/**
 * 게시물 랭킹 점수.
 *
 * 최신성 = e^(-λ·t), λ = 0.00002, t = 경과 시간(분)
 *   예) 60일(86,400분) → 0.177, 2시간(120분) → 0.998
 * 각 항목은 같은 후보 집합 안의 최댓값으로 나눠 0~1로 정규화한다 (최댓값은 동적 산정).
 * 꿀팁(유용성 평가 수)은 시간 감쇠를 적용한다.
 *
 * ※ 문서의 정규화 식은 "1 − A / max(A)"로 적혀 있으나, 그대로 쓰면 꿀팁·댓글이 많을수록
 *   점수가 낮아진다. 의도(반응이 많을수록 상위)에 맞게 A / max(A)로 구현했다.
 */
import type { AlgoPost } from './types';

export const LAMBDA = 0.00002;

export const minutesSince = (createdAt: number, now: number) => Math.max(0, (now - createdAt) / 60_000);
export const freshness = (createdAt: number, now: number) => Math.exp(-LAMBDA * minutesSince(createdAt, now));

export type Weights = {
  honey: number;
  views: number;
  comments: number;
  dwell: number;
  saves: number;
  fresh: number;
  /** 'rise' = 1시간 조회수 상승률 (실시간 Top5), 'total' = 누적 조회수 (일반 검색) */
  viewMode: 'rise' | 'total';
};

/** 실시간 꿀팁 Top5 — 1~2번째 */
export const WEIGHTS_A: Weights = { honey: 0.4, views: 0.1, comments: 0.1, dwell: 0.1, saves: 0.1, fresh: 0.2, viewMode: 'rise' };
/** 실시간 꿀팁 Top5 — 3~4번째 */
export const WEIGHTS_B: Weights = { honey: 0.27, views: 0.09, comments: 0.07, dwell: 0.07, saves: 0.1, fresh: 0.4, viewMode: 'rise' };
/** 일반 주제 검색 — 4개 단위 중 3개 */
export const WEIGHTS_C: Weights = { honey: 0.4, views: 0.1, comments: 0.1, dwell: 0.1, saves: 0.1, fresh: 0.2, viewMode: 'total' };
/** 일반 주제 검색 — 4개 단위 중 1개 */
export const WEIGHTS_D: Weights = { honey: 0.27, views: 0.09, comments: 0.07, dwell: 0.07, saves: 0.1, fresh: 0.4, viewMode: 'total' };

export const viewRise = (p: AlgoPost) =>
  Math.max(0, (p.metrics.viewsLastHour - p.metrics.viewsPrevHour) / Math.max(1, p.metrics.viewsPrevHour));

const norm = (v: number, max: number) => (max > 0 ? v / max : 0);

/** 후보 집합 전체에 대해 점수를 매긴다. 반환: postId → 0~1 점수 */
export function scorePosts(posts: AlgoPost[], w: Weights, now: number): Map<string, number> {
  const rows = posts.map((p) => {
    const f = freshness(p.createdAt, now);
    return {
      id: p.id,
      honey: p.metrics.honey * f, // 시간 감쇠 적용
      views: w.viewMode === 'rise' ? viewRise(p) : p.metrics.views,
      comments: p.metrics.comments,
      dwell: p.metrics.dwell,
      saves: p.metrics.saves,
      fresh: f,
    };
  });
  const max = {
    honey: Math.max(0, ...rows.map((r) => r.honey)),
    views: Math.max(0, ...rows.map((r) => r.views)),
    comments: Math.max(0, ...rows.map((r) => r.comments)),
    dwell: Math.max(0, ...rows.map((r) => r.dwell)),
    saves: Math.max(0, ...rows.map((r) => r.saves)),
  };
  const out = new Map<string, number>();
  for (const r of rows) {
    out.set(
      r.id,
      w.honey * norm(r.honey, max.honey) +
        w.views * norm(r.views, max.views) +
        w.comments * norm(r.comments, max.comments) +
        w.dwell * norm(r.dwell, max.dwell) +
        w.saves * norm(r.saves, max.saves) +
        w.fresh * r.fresh,
    );
  }
  return out;
}

/** 트렌드순용 반응 점수: 반응 데이터(유용성 평가·댓글·공유·저장) 정규화 합 */
export function reactionScores(posts: AlgoPost[]): Map<string, number> {
  const max = {
    honey: Math.max(0, ...posts.map((p) => p.metrics.honey)),
    comments: Math.max(0, ...posts.map((p) => p.metrics.comments)),
    shares: Math.max(0, ...posts.map((p) => p.metrics.shares)),
    saves: Math.max(0, ...posts.map((p) => p.metrics.saves)),
  };
  return new Map(
    posts.map((p) => [
      p.id,
      0.4 * norm(p.metrics.honey, max.honey) +
        0.2 * norm(p.metrics.comments, max.comments) +
        0.2 * norm(p.metrics.shares, max.shares) +
        0.2 * norm(p.metrics.saves, max.saves),
    ]),
  );
}
