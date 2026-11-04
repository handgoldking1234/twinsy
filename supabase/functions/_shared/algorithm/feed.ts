// 자동 복사본 — 원본은 src/algorithm/feed.ts (npm run functions:sync)
/**
 * 메인 피드 — 취향콕(팔로잉) 탭과 추천 탭 분리.
 *
 * 콜드 스타트: 신규 사용자는 설문 기반 유사 취향 콘텐츠로 시작. 취향콕 탭이 비어 있으므로 추천 탭이 기본.
 *
 * 취향콕 탭: 취향콕(팔로잉)한 사람 게시물 최신순. 신뢰도 -10 계정은 팔로우한 사람 피드에서도 제외.
 *
 * 추천 탭: 전체 주제 또는 선택한 관심콕(관심 주제) 안에서 유사취향자 게시물 + 전체 회원 게시물을 번갈아 노출.
 *   - 최신순: 유사취향자 최신순 4개 + 전체 회원 최신순 2개
 *            일반 게시물 48시간 이내, 꿀단지 게시물 48시간 이내
 *   - 트렌드순: 유사취향자 중 반응 데이터 높은 순 4개 + 전체 회원 중 반응 데이터 높은 순 2개
 *            일반 게시물 49~120시간, 꿀단지 게시물 49~168시간
 *   - 노출 비중: 일반 게시물 60% : 꿀단지 게시물 40%
 *   - 내 취향 데이터가 없는(취향과 상관없는) 주제는 전체 회원 게시물 순으로만.
 *   - 주제 신뢰도가 낮은 작성자의 게시물은 우선순위를 낮추고, 신뢰도 -10 계정은 노출하지 않는다.
 */
import { accountTrust, similarPeers, trustMultiplier, type AccountTrust } from './taste.ts';
import { reactionScores } from './ranking.ts';
import { exposureStage, underExposedBoostHours, type ExposureStats } from './exposure.ts';
import type { AlgoPost, FeedSource, RankedPost, Topic, UserProfile } from './types.ts';

const HOUR = 3_600_000;

export const PEER_PER_BLOCK = 4;
export const ALL_PER_BLOCK = 2;
export const NORMAL_RATIO = 0.6;

export type FeedSort = 'latest' | 'trend';
export type FeedScope = { kind: 'all' } | { kind: 'interest'; topics: Topic[] };

export const isColdStart = (me: UserProfile) => me.follows.length === 0;

export function trustMap(users: UserProfile[], posts: AlgoPost[], now?: number): Map<string, AccountTrust> {
  return new Map(users.map((u) => [u.id, accountTrust(u, posts, now)]));
}

/** 반응 지표로 노출 통계 추정 (실서비스에서는 노출 로그로 대체) */
export const statsFromMetrics = (p: AlgoPost): ExposureStats => ({
  impressions: p.metrics.views,
  engaged: p.metrics.honey + p.metrics.comments + p.metrics.saves + p.metrics.shares,
});

/** 기간 창 — 최신순/트렌드순 × 일반/꿀단지 */
export function inWindow(p: AlgoPost, sort: FeedSort, now: number): boolean {
  const ageH = (now - p.createdAt) / HOUR;
  if (sort === 'latest') return ageH >= 0 && ageH <= 48;
  return p.kind === 'normal' ? ageH > 48 && ageH <= 120 : ageH > 48 && ageH <= 168;
}

/** 취향콕(팔로잉) 탭 */
export function followingFeed(
  me: UserProfile,
  posts: AlgoPost[],
  trusts: Map<string, AccountTrust>,
): RankedPost[] {
  const follows = new Set(me.follows);
  return posts
    .filter((p) => follows.has(p.authorId) && trusts.get(p.authorId)?.level !== 'restricted')
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((p) => ({ post: p, score: p.createdAt, source: 'following' as FeedSource, criteria: 'latest' as const }));
}

/** 60:40 비율을 지키도록 다음에 필요한 게시물 종류 */
function nextKind(normalCount: number, total: number): 'normal' | 'honey' {
  return normalCount < Math.round((total + 1) * NORMAL_RATIO) ? 'normal' : 'honey';
}

/** 추천 탭 */
export function recommendFeed(
  me: UserProfile,
  users: UserProfile[],
  posts: AlgoPost[],
  opts: {
    scope: FeedScope;
    sort: FeedSort;
    now: number;
    trusts?: Map<string, AccountTrust>;
    /** 노출 단계 적용 — 일 활성 사용자 수와 게시물별 노출 통계 */
    exposure?: { dau: number; stats?: (p: AlgoPost) => ExposureStats };
  },
): RankedPost[] {
  const { scope, sort, now } = opts;
  const trusts = opts.trusts ?? trustMap(users, posts, now);
  const peerCache = new Map<Topic, Map<string, number>>();
  const peersOf = (topic: Topic) => {
    if (!peerCache.has(topic)) peerCache.set(topic, similarPeers(me, users, topic));
    return peerCache.get(topic)!;
  };

  const candidates = posts.filter((p) => {
    if (p.authorId === me.id) return false;
    if (scope.kind === 'interest' && !scope.topics.includes(p.topic)) return false;
    const t = trusts.get(p.authorId);
    if (t && trustMultiplier(t, p.topic) === 0) return false;
    return inWindow(p, sort, now);
  });

  const reaction = reactionScores(candidates);
  const mult = (p: AlgoPost) => {
    const t = trusts.get(p.authorId);
    return t ? trustMultiplier(t, p.topic) : 1;
  };
  // 최신순: 신뢰도 1점 감점마다 3시간 늦게 올린 것처럼 밀어냄 / 트렌드순: 반응 점수 × 신뢰도 가중치
  const exp = opts.exposure;
  const statsOf = exp?.stats ?? statsFromMetrics;
  const boost = (p: AlgoPost) =>
    exp ? underExposedBoostHours(statsOf(p), exp.dau, peersOf(p.topic).size || users.length) * HOUR : 0;
  const key = (p: AlgoPost) =>
    sort === 'latest' ? p.createdAt - (1 - mult(p)) * 30 * HOUR + boost(p) : (reaction.get(p.id) ?? 0) * mult(p);

  const peerPool: RankedPost[] = [];
  const allPool: RankedPost[] = [];
  for (const p of candidates) {
    const mine = me.taste[p.topic];
    const sim = mine ? peersOf(p.topic).get(p.authorId) : undefined;
    const item: RankedPost = { post: p, score: key(p), criteria: sort, similarity: sim };
    // 내 취향 데이터가 없는 주제는 전체 회원 게시물로만
    if (sim !== undefined) peerPool.push({ ...item, source: 'peer' });
    else {
      // 샘플·유사취향자 단계 게시물은 아직 전체 회원 피드로 확장하지 않는다
      if (exp && exposureStage(statsOf(p), exp.dau) !== 'all') continue;
      allPool.push({ ...item, source: 'all' });
    }
  }
  peerPool.sort((a, b) => b.score - a.score);
  allPool.sort((a, b) => b.score - a.score);

  const out: RankedPost[] = [];
  let normals = 0;
  const take = (pool: RankedPost[]) => {
    if (!pool.length) return false;
    const want = nextKind(normals, out.length);
    let i = pool.findIndex((r) => r.post.kind === want);
    if (i < 0) i = 0;
    const [r] = pool.splice(i, 1);
    if (r.post.kind === 'normal') normals++;
    out.push(r);
    return true;
  };

  while (peerPool.length || allPool.length) {
    for (let i = 0; i < PEER_PER_BLOCK; i++) if (!take(peerPool)) take(allPool);
    for (let i = 0; i < ALL_PER_BLOCK; i++) if (!take(allPool)) take(peerPool);
  }
  return out;
}
