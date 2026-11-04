/**
 * 검색 알고리즘.
 *
 * ⑪ 실시간 꿀팁 검색 Top5 (네이버 실시간 검색어와 비슷)
 *   - 1시간 단위 갱신, 누적량이 아닌 변화율(% 증가) 중심: 변화율 + 검색량 + 시간 가중치
 *   - 반복 검색·봇 검색·특정 이벤트/광고 검색 제외
 *   - 급상승 키워드 주제의 꿀단지 게시물 5개 노출
 *     · 1~2번째: A 기준 랭킹 1·2위. 같은 게시물은 맨 앞 노출 3번(3시간)까지, 이후 배제
 *     · 3~4번째: B 기준. 이전 1시간 단위 갱신 때 한 번 노출됐던 게시물은 배제
 *     · 5번째: 문서에 기준이 없어 3~4번째와 같은 B 기준으로 채움
 *
 * 일반 주제 검색
 *   - 유사성향자 40% · 전문가 40% · 그 외 일반 20%
 *     · 관련 주제 전문가 게시물이 없으면 유사취향자 80% · 일반 20%
 *     · 유사취향자 해당 주제가 아니면 전문가 80% · 일반 20% (전문가도 없으면 일반 100%)
 *   - 꿀단지 60% : 일반 40%
 *   - 4개 단위로 C 기준 3개 + D 기준 1개
 *   - 한 게시물은 검색 결과 노출이 1인당 3번까지
 *   - 영상·사진 게시물 구분 없이 선정
 */
import { similarPeers } from './taste';
import { WEIGHTS_A, WEIGHTS_B, WEIGHTS_C, WEIGHTS_D, scorePosts } from './ranking';
import type { AlgoPost, RankedPost, SearchBucket, SearchLog, UserProfile } from './types';

const HOUR = 3_600_000;

/* ---------------- 급상승 키워드 ---------------- */

export type RisingKeyword = { keyword: string; lastHour: number; prevHour: number; change: number; score: number };

export function risingKeywords(logs: SearchLog[], now: number, n = 5): RisingKeyword[] {
  const seen = new Set<string>(); // 같은 사람이 같은 시간대에 반복 검색 → 1회로
  const stats = new Map<string, { last: number; prev: number; recency: number }>();
  for (const l of logs) {
    if (l.isBot || l.isAd) continue;
    const age = now - l.at;
    if (age < 0 || age >= 2 * HOUR) continue;
    const bucket = age < HOUR ? 'last' : 'prev';
    const dedupe = `${l.userId}|${l.keyword}|${bucket}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const s = stats.get(l.keyword) ?? { last: 0, prev: 0, recency: 0 };
    if (bucket === 'last') {
      s.last++;
      s.recency += 1 - age / HOUR; // 방금 검색될수록 가중치 ↑
    } else s.prev++;
    stats.set(l.keyword, s);
  }
  const rows = [...stats.entries()]
    .filter(([, s]) => s.last > 0)
    .map(([keyword, s]) => ({
      keyword,
      lastHour: s.last,
      prevHour: s.prev,
      change: (s.last - s.prev) / Math.max(1, s.prev),
      recency: s.recency / s.last,
    }));
  const maxChange = Math.max(1e-9, ...rows.map((r) => r.change));
  const maxVol = Math.max(1, ...rows.map((r) => r.lastHour));
  return rows
    .map((r) => ({
      keyword: r.keyword,
      lastHour: r.lastHour,
      prevHour: r.prevHour,
      change: r.change,
      score: 0.5 * Math.max(0, r.change / maxChange) + 0.3 * (r.lastHour / maxVol) + 0.2 * r.recency,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/* ---------------- 실시간 꿀팁 Top5 게시물 ---------------- */

export type Top5History = {
  /** 맨 앞(1~2위)에 노출된 횟수 */
  frontCount: Record<string, number>;
  /** 이전 1시간 단위 갱신 때 3~5번째로 노출된 게시물 */
  shownBefore: Set<string>;
};

export const matchesKeyword = (p: AlgoPost, kw: string) =>
  p.keywords.some((k) => k.includes(kw) || kw.includes(k)) || p.topic.includes(kw);

export function realtimeTop5(
  keyword: string,
  posts: AlgoPost[],
  now: number,
  history: Top5History = { frontCount: {}, shownBefore: new Set() },
): RankedPost[] {
  const pool = posts.filter((p) => p.kind === 'honey' && matchesKeyword(p, keyword));
  const a = scorePosts(pool, WEIGHTS_A, now);
  const b = scorePosts(pool, WEIGHTS_B, now);
  const out: RankedPost[] = [];
  const used = new Set<string>();

  const front = pool
    .filter((p) => (history.frontCount[p.id] ?? 0) < 3)
    .sort((x, y) => a.get(y.id)! - a.get(x.id)!)
    .slice(0, 2);
  for (const p of front) {
    out.push({ post: p, score: a.get(p.id)!, criteria: 'A' });
    used.add(p.id);
  }
  const rest = pool
    .filter((p) => !used.has(p.id) && !history.shownBefore.has(p.id))
    .sort((x, y) => b.get(y.id)! - b.get(x.id)!);
  for (const p of rest.slice(0, 5 - out.length)) out.push({ post: p, score: b.get(p.id)!, criteria: 'B' });
  return out;
}

/* ---------------- 일반 주제 검색 ---------------- */

export const IMPRESSION_CAP = 3;

export function bucketShares(hasPeers: boolean, hasExperts: boolean): Record<SearchBucket, number> {
  if (hasPeers && hasExperts) return { peer: 0.4, expert: 0.4, general: 0.2 };
  if (hasPeers) return { peer: 0.8, expert: 0, general: 0.2 };
  if (hasExperts) return { peer: 0, expert: 0.8, general: 0.2 };
  return { peer: 0, expert: 0, general: 1 };
}

export function topicSearch(
  me: UserProfile,
  users: UserProfile[],
  posts: AlgoPost[],
  query: string,
  opts: { now: number; impressions?: Record<string, number>; textOf?: (p: AlgoPost) => string },
): RankedPost[] {
  const q = query.trim();
  if (!q) return [];
  const byId = new Map(users.map((u) => [u.id, u]));
  const impressions = opts.impressions ?? {};
  const matched = posts.filter(
    (p) =>
      p.authorId !== me.id &&
      (impressions[p.id] ?? 0) < IMPRESSION_CAP &&
      (matchesKeyword(p, q) || (opts.textOf?.(p) ?? '').includes(q)),
  );
  if (!matched.length) return [];

  const peerCache = new Map<string, Map<string, number>>();
  const bucketOf = (p: AlgoPost): { bucket: SearchBucket; sim?: number } => {
    if (!peerCache.has(p.topic)) peerCache.set(p.topic, similarPeers(me, users, p.topic));
    const sim = me.taste[p.topic] ? peerCache.get(p.topic)!.get(p.authorId) : undefined;
    if (sim !== undefined) return { bucket: 'peer', sim };
    if (byId.get(p.authorId)?.expertTopics.includes(p.topic)) return { bucket: 'expert' };
    return { bucket: 'general' };
  };

  const c = scorePosts(matched, WEIGHTS_C, opts.now);
  const d = scorePosts(matched, WEIGHTS_D, opts.now);
  const pool = matched.map((p) => ({ p, ...bucketOf(p) }));
  const shares = bucketShares(pool.some((x) => x.bucket === 'peer'), pool.some((x) => x.bucket === 'expert'));
  const counts: Record<SearchBucket, number> = { peer: 0, expert: 0, general: 0 };
  let honeys = 0;
  const out: RankedPost[] = [];

  while (pool.length) {
    const i = out.length;
    const criteria = i % 4 === 3 ? 'D' : 'C';
    const scores = criteria === 'C' ? c : d;
    // 비중이 가장 모자란 그룹 → 그 다음 그룹 순으로 시도
    const order = (Object.keys(shares) as SearchBucket[])
      .filter((k) => shares[k] > 0)
      .sort((x, y) => (counts[x] - shares[x] * (i + 1)) - (counts[y] - shares[y] * (i + 1)));
    const wantHoney = honeys < Math.round((i + 1) * 0.6);
    let pick = -1;
    for (const b of order) {
      const cands = pool
        .map((x, idx) => ({ x, idx }))
        .filter(({ x }) => x.bucket === b)
        .sort((u, v) => scores.get(v.x.p.id)! - scores.get(u.x.p.id)!);
      if (!cands.length) continue;
      const k = cands.find(({ x }) => (x.p.kind === 'honey') === wantHoney) ?? cands[0];
      pick = k.idx;
      break;
    }
    if (pick < 0) pick = 0;
    const [x] = pool.splice(pick, 1);
    counts[x.bucket]++;
    if (x.p.kind === 'honey') honeys++;
    out.push({ post: x.p, score: scores.get(x.p.id)!, bucket: x.bucket, criteria, similarity: x.sim });
  }
  return out;
}
