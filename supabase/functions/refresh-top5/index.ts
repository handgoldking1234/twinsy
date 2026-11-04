// 실시간 꿀팁 검색 Top5 — 매시 정각 pg_cron이 호출
//  1) 시간대별 조회수 롤업  2) 급상승 키워드 5개  3) 키워드별 꿀단지 5개(A/B 기준)  4) top5_snapshots 저장
import { realtimeTop5, risingKeywords } from '../_shared/algorithm/index.ts';
import { admin, cors, json, loadPosts, loadSearchLogs } from '../_shared/db.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const db = admin();
    await db.rpc('roll_hourly_views');
    const now = Date.now();
    const hour = new Date(Math.floor(now / 3_600_000) * 3_600_000).toISOString();

    const [logs, posts, prev] = await Promise.all([
      loadSearchLogs(db),
      loadPosts(db, 24 * 30),
      db.from('top5_snapshots').select('*').gte('hour', new Date(now - 3 * 3_600_000).toISOString()).lt('hour', hour),
    ]);

    // 노출 이력: 최근 3시간 1~2위 노출 횟수 / 직전 시간 3~5위 노출 게시물
    const frontCount: Record<string, number> = {};
    const shownBefore = new Set<string>();
    const lastHour = new Date(Date.parse(hour) - 3_600_000).toISOString();
    for (const s of prev.data ?? []) {
      (s.post_ids as string[]).forEach((id, i) => {
        if (i < 2) frontCount[id] = (frontCount[id] ?? 0) + 1;
        else if (new Date(s.hour).toISOString() === lastHour) shownBefore.add(id);
      });
    }

    const rising = risingKeywords(logs, now, 5);
    const rows = rising.map((k, i) => {
      const top = realtimeTop5(k.keyword, posts, now, { frontCount, shownBefore });
      return {
        hour, rank: i + 1, keyword: k.keyword, change: k.change,
        post_ids: top.map((r) => r.post.id), criteria: top.map((r) => r.criteria),
      };
    });
    if (rows.length) await db.from('top5_snapshots').upsert(rows);
    return json({ hour, keywords: rows.map((r) => r.keyword) });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
