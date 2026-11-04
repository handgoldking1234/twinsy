// 엣지 함수 공통: service_role 클라이언트, DB 행 → 알고리즘 타입 변환, CORS
import { createClient } from 'npm:@supabase/supabase-js@2';
import type { AlgoPost, SearchLog, UserProfile } from './algorithm/index.ts';

export const admin = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

export async function loadUsers(db: ReturnType<typeof admin>): Promise<UserProfile[]> {
  const [p, t, v, f] = await Promise.all([
    db.from('profiles').select('id, name, expert_topics').is('disabled_at', null),
    db.from('taste').select('*'),
    db.from('visits').select('*'),
    db.from('follows').select('*'),
  ]);
  return (p.data as Row[]).map((u) => {
    const taste: UserProfile['taste'] = {};
    for (const r of (t.data as Row[]).filter((x) => x.profile_id === u.id)) (taste[r.topic] ??= {})[r.feature] = r.value;
    const visits: UserProfile['visits'] = {};
    for (const r of (v.data as Row[]).filter((x) => x.profile_id === u.id)) visits[r.place_id] = r.rating;
    return {
      id: u.id, name: u.name, taste, visits, expertTopics: u.expert_topics ?? [],
      follows: (f.data as Row[]).filter((x) => x.follower_id === u.id).map((x) => x.followee_id),
    };
  });
}

export async function loadPosts(db: ReturnType<typeof admin>, sinceHours = 24 * 60): Promise<AlgoPost[]> {
  const since = new Date(Date.now() - sinceHours * 3_600_000).toISOString();
  const { data, error } = await db
    .from('posts')
    .select('id, author_id, topic, kind, created_at, taste_tags, keywords, title, post_metrics(*)')
    .is('deleted_at', null)
    .gte('created_at', since);
  if (error) throw error;
  return (data as Row[]).map((p) => {
    const m = (Array.isArray(p.post_metrics) ? p.post_metrics[0] : p.post_metrics) ?? {};
    return {
      id: p.id, authorId: p.author_id, topic: p.topic, kind: p.kind, createdAt: Date.parse(p.created_at),
      tasteTags: p.taste_tags ?? {}, keywords: [...(p.keywords ?? []), p.title],
      metrics: {
        honey: m.honey ?? 0, views: m.views ?? 0, viewsLastHour: m.views_last_hour ?? 0, viewsPrevHour: m.views_prev_hour ?? 0,
        comments: m.comments ?? 0, dwell: m.dwell ?? 0, saves: m.saves ?? 0, shares: m.shares ?? 0,
      },
    };
  });
}

export async function loadSearchLogs(db: ReturnType<typeof admin>): Promise<SearchLog[]> {
  const since = new Date(Date.now() - 2 * 3_600_000).toISOString();
  const { data } = await db.from('search_logs').select('*').gte('at', since);
  return ((data ?? []) as Row[]).map((l) => ({
    userId: l.profile_id ?? `anon-${l.id}`, keyword: l.keyword, at: Date.parse(l.at), isBot: l.is_bot, isAd: l.is_ad,
  }));
}

/* ---------- Claude API ---------- */

export async function askClaude(system: string, user: string, maxTokens = 600): Promise<string> {
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) throw new Error('ANTHROPIC_API_KEY 시크릿이 없습니다');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-haiku-5-5',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return body.content?.find((c: Row) => c.type === 'text')?.text ?? '';
}

/** 응답 텍스트에서 첫 JSON 블록만 꺼낸다 */
export function parseJson<T>(text: string): T {
  const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!m) throw new Error('JSON 응답이 아닙니다');
  return JSON.parse(m[0]) as T;
}
