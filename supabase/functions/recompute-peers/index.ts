// 유사취향자 상위 20% · 계정 신뢰도 재계산 — 매일 pg_cron이 호출
// 문서: "하루 이틀 단위로 전체 유사성향자 리셋해서 계산 — 기존 유사성향자 중 20% 안에 못 들거나 새로 추가 가능"
import { accountTrust, similarPeers } from '../_shared/algorithm/index.ts';
import { admin, cors, json, loadPosts, loadUsers } from '../_shared/db.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const db = admin();
    const now = Date.now();
    const [users, posts] = await Promise.all([loadUsers(db), loadPosts(db, 24 * 365)]);

    const peerRows: Record<string, unknown>[] = [];
    for (const me of users) {
      for (const topic of Object.keys(me.taste)) {
        for (const [peerId, sim] of similarPeers(me, users, topic)) {
          peerRows.push({ profile_id: me.id, topic, peer_id: peerId, similarity: sim, computed_at: new Date(now).toISOString() });
        }
      }
    }
    await db.from('peer_cache').delete().lt('computed_at', new Date(now).toISOString());
    for (let i = 0; i < peerRows.length; i += 1000) await db.from('peer_cache').upsert(peerRows.slice(i, i + 1000));

    const trustRows = users.map((u) => {
      const t = accountTrust(u, posts, now);
      return {
        profile_id: u.id, total: t.total, by_topic: t.byTopic, level: t.level,
        restricted_until: t.restrictedUntil ? new Date(t.restrictedUntil).toISOString() : null,
        computed_at: new Date(now).toISOString(),
      };
    });
    await db.from('trust_cache').upsert(trustRows);

    return json({ users: users.length, peers: peerRows.length, restricted: trustRows.filter((r) => r.level === 'restricted').length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
