/**
 * 노출 단계 — 게시물당 최소 노출 수 + 소수 샘플 그룹 테스트.
 *
 * 문서 규칙
 * - 게시물당 최소 노출 수는 전체 활성 사용자 수 대비 비율로 설정한다.
 *   초기에는 사용자·게시물이 적어 유사취향자 전체에게 노출하고,
 *   일정 사용자 수에 도달하면 비율 기준(예: 일 활성 사용자의 7%)으로 자동 전환한다.
 * - 새 게시물은 소수의 샘플 그룹(수십~수백 명)에게 먼저 보여 반응을 살핀 뒤,
 *   반응이 좋으면 더 많은 사람에게 확장한다 (인스타그램·틱톡 방식).
 * - 최신순에서 반응이 좋은 게시물은 트렌드순에서도 노출 확률이 올라간다(반응 점수로 반영).
 */

export const MIN_EXPOSURE_RATE = 0.07;   // 일 활성 사용자 대비 최소 노출 비율
export const SMALL_BASE_DAU = 1_000;     // 이보다 적으면 유사취향자 전원 노출 단계
export const SAMPLE_MIN = 30;
export const SAMPLE_MAX = 300;
export const SAMPLE_RATE = 0.01;         // 샘플 그룹 = DAU의 1% (30~300명)
export const PROMOTE_RATE = 0.05;        // 반응률 5% 이상이면 전체 회원으로 확장

export type ExposureStats = {
  impressions: number; // 노출 수
  engaged: number;     // 반응 수 (꿀팁 평가 + 댓글 + 저장 + 공유)
};

export type ExposureStage = 'sample' | 'peers' | 'all';

/** 게시물당 최소 노출 수 — 초기엔 유사취향자 전원, 이후 DAU × 7% */
export function minExposure(dau: number, peerAudience: number): number {
  if (dau < SMALL_BASE_DAU) return peerAudience;
  return Math.ceil(Math.round(dau * MIN_EXPOSURE_RATE * 1000) / 1000);
}

export function sampleSize(dau: number): number {
  return Math.min(SAMPLE_MAX, Math.max(SAMPLE_MIN, Math.round(dau * SAMPLE_RATE)));
}

export const engagementRate = (s: ExposureStats) => (s.impressions > 0 ? s.engaged / s.impressions : 0);

/**
 * 노출 단계
 * - sample: 샘플 그룹(유사취향자 일부)에게만 노출 중
 * - peers : 샘플 반응이 기준에 못 미침 → 유사취향자 안에서만 노출
 * - all   : 반응이 좋아 전체 회원 피드까지 확장
 * 초기(DAU < 1,000)에는 샘플 단계 없이 유사취향자 전원에게 노출하고 반응을 본다.
 */
export function exposureStage(stats: ExposureStats, dau: number): ExposureStage {
  const early = dau < SMALL_BASE_DAU;
  if (!early && stats.impressions < sampleSize(dau)) return 'sample';
  if (early && stats.impressions < SAMPLE_MIN) return 'peers';
  return engagementRate(stats) >= PROMOTE_RATE ? 'all' : 'peers';
}

/** 최소 노출 수에 못 미친 게시물은 최신순에서 끌어올린다 (시간 단위 가산) */
export function underExposedBoostHours(stats: ExposureStats, dau: number, peerAudience: number): number {
  const min = minExposure(dau, peerAudience);
  if (stats.impressions >= min) return 0;
  return 6 * (1 - stats.impressions / Math.max(1, min)); // 최대 6시간 앞당김
}
