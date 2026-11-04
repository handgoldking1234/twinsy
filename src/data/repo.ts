/**
 * 데이터 계층 — Supabase가 연결돼 있으면 서버 데이터를 읽어 world.ts 의 배열을 채운다.
 * 연결 전에는 아무것도 하지 않고, 앱은 예시 데이터로 동작한다.
 * (화면 코드는 world.ts 의 USERS / POSTS / userById 를 그대로 쓰므로 수정할 필요가 없다)
 */
import { supabase } from '../lib/supabase';
import type { SearchLog, TasteProfile } from '../algorithm';
import { POSTS, SEARCH_LOGS, USERS, postById, userById, type AppPost, type AppUser } from './world';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export async function loadLiveWorld(): Promise<{ meId: string | null } | null> {
  if (!supabase) return null;
  const since = new Date(Date.now() - 2 * 3_600_000).toISOString();
  const [profiles, taste, visits, follows, posts, logs, session] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('taste').select('*'),
    supabase.from('visits').select('*'),
    supabase.from('follows').select('*'),
    supabase.from('posts').select('*, post_metrics(*)').order('created_at', { ascending: false }).limit(500),
    supabase.from('search_logs').select('*').gte('at', since),
    supabase.auth.getSession(),
  ]);
  const err = [profiles, taste, visits, follows, posts, logs].find((r) => r.error)?.error;
  if (err) throw new Error(err.message);

  const users: AppUser[] = (profiles.data as Row[]).map((p) => {
    const t: TasteProfile = {};
    for (const r of (taste.data as Row[]).filter((x) => x.profile_id === p.id)) (t[r.topic] ??= {})[r.feature] = r.value;
    const v: Record<string, 1 | -1> = {};
    for (const r of (visits.data as Row[]).filter((x) => x.profile_id === p.id)) v[r.place_id] = r.rating;
    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar_url ?? '',
      bio: p.bio ?? undefined,
      expertTopics: p.expert_topics ?? [],
      expertLabel: p.expert_label ?? undefined,
      taste: t,
      visits: v,
      follows: (follows.data as Row[]).filter((f) => f.follower_id === p.id).map((f) => f.followee_id),
    };
  });

  const ps: AppPost[] = (posts.data as Row[]).map((p) => {
    const m = (Array.isArray(p.post_metrics) ? p.post_metrics[0] : p.post_metrics) ?? {};
    return {
      id: p.id,
      authorId: p.author_id,
      topic: p.topic,
      kind: p.kind,
      createdAt: Date.parse(p.created_at),
      title: p.title,
      body: p.body ?? undefined,
      images: p.images ?? [],
      tips: p.tips ?? undefined,
      points: p.points ?? undefined,
      menus: p.menus ?? undefined,
      tags: p.tags ?? [],
      keywords: p.keywords ?? [],
      location: p.location ?? undefined,
      tasteTags: p.taste_tags ?? {},
      pros: p.pros ?? [],
      cons: p.cons ?? [],
      metrics: {
        honey: m.honey ?? 0, views: m.views ?? 0, viewsLastHour: m.views_last_hour ?? 0, viewsPrevHour: m.views_prev_hour ?? 0,
        comments: m.comments ?? 0, dwell: m.dwell ?? 0, saves: m.saves ?? 0, shares: m.shares ?? 0,
      },
    };
  });

  const ls: SearchLog[] = (logs.data as Row[]).map((l) => ({
    userId: l.profile_id ?? `anon-${l.id}`, keyword: l.keyword, at: Date.parse(l.at), isBot: l.is_bot, isAd: l.is_ad,
  }));

  // 같은 배열·Map 객체를 채워 넣어 화면 코드가 그대로 새 데이터를 본다
  USERS.splice(0, USERS.length, ...users);
  POSTS.splice(0, POSTS.length, ...ps);
  SEARCH_LOGS.splice(0, SEARCH_LOGS.length, ...ls);
  userById.clear();
  users.forEach((u) => userById.set(u.id, u));
  postById.clear();
  ps.forEach((p) => postById.set(p.id, p));

  const authId = session.data.session?.user.id;
  const me = authId ? (profiles.data as Row[]).find((p) => p.auth_id === authId) : undefined;
  return { meId: me?.id ?? null };
}

/* ---------- 쓰기 (로그인 상태에서만 동작, 실패해도 화면은 유지) ---------- */

export async function saveFollow(meId: string, targetId: string, on: boolean) {
  if (!supabase) return;
  if (on) await supabase.from('follows').insert({ follower_id: meId, followee_id: targetId });
  else await supabase.from('follows').delete().match({ follower_id: meId, followee_id: targetId });
}

export async function saveTaste(meId: string, taste: TasteProfile) {
  if (!supabase) return;
  const rows = Object.entries(taste).flatMap(([topic, v]) =>
    Object.entries(v).map(([feature, value]) => ({ profile_id: meId, topic, feature, value })),
  );
  await supabase.from('taste').upsert(rows);
}

export async function logSearch(meId: string | null, keyword: string) {
  if (!supabase || !keyword) return;
  await supabase.from('search_logs').insert({ profile_id: meId, keyword });
}

export async function recordImpressions(postIds: string[], context: 'feed' | 'search' | 'top5') {
  if (!supabase || !postIds.length) return;
  await supabase.rpc('record_impressions', { p_post_ids: postIds, p_context: context });
}
