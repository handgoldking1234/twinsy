// AI 검색 요약 — 전체 사용자 / 유사취향자 콘텐츠를 장점·단점·팁·평가로 구조화
// 입력: { query: string, postIds: string[] }  출력: { pros: string[], cons: string[], tips: string[], verdict: string }
import { admin, askClaude, cors, json, parseJson } from '../_shared/db.ts';

const SYSTEM = `너는 트윈지(Twinsy)의 검색 요약 도우미다.
사용자들이 직접 경험하고 쓴 게시물만 근거로, 광고성·과장 표현 없이 요약한다.
게시물에 없는 내용은 지어내지 않는다.
반드시 아래 JSON 하나만 출력한다:
{"pros": ["장점 최대 3개, 각 15자 이내"], "cons": ["단점 최대 3개"], "tips": ["실용 팁 최대 3개, 각 30자 이내"], "verdict": "한 줄 평가 40자 이내"}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { query, postIds } = (await req.json()) as { query: string; postIds: string[] };
    if (!query || !postIds?.length) return json({ error: 'query와 postIds가 필요합니다' }, 400);
    const { data, error } = await admin()
      .from('posts')
      .select('title, body, tips, points, menus, pros, cons, post_metrics(honey)')
      .in('id', postIds.slice(0, 12));
    if (error) throw error;

    const docs = (data ?? [])
      .map((p, i) => `[${i + 1}] ${p.title} (꿀팁 평가 ${(p.post_metrics as { honey: number }[] | null)?.[0]?.honey ?? 0})\n${p.body ?? ''}\n${JSON.stringify({ tips: p.tips, points: p.points, menus: p.menus, pros: p.pros, cons: p.cons })}`)
      .join('\n\n');
    const text = await askClaude(SYSTEM, `검색어: ${query}\n\n게시물:\n${docs}`);
    return json(parseJson(text));
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
