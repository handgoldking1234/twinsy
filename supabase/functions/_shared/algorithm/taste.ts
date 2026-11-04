// 자동 복사본 — 원본은 src/algorithm/taste.ts (npm run functions:sync)
/**
 * 유사 취향 매칭 + 계정 신뢰도.
 *
 * 문서 규칙
 * - 주제별로 유사 취향 상위 20%만 유사취향자로 분류 (회원 수가 늘면 비율을 낮춰 정확도를 높임)
 * - 설문 유사율에서 세부 메뉴·취향이 다르면 -5점, 같으면 +5점 → 상위 20% 진입·이탈이 생김
 * - 위치 인증 방문 평가가 같으면 유사율 상승, 다르면 하락
 * - 기본 취향과 반대되는 게시물을 올리면 해당 주제 신뢰도 -1 (유용성 평가가 많으면 진실성 인정, 감점 없음)
 * - 신뢰도 -3: 경고 문구 / -6: 경고 알림 / -10: 한 달간 계정 전체 게시물 피드 노출 제한
 */
import type { AlgoPost, TasteVector, Topic, UserProfile } from './types.ts';

export const DETAIL_POINT = 5;           // 세부 취향 일치 +5 / 불일치 -5
export const VISIT_POINT = 5;            // 방문 평가 일치 +5 / 불일치 -5
export const STRONG = 0.5;               // 세부 취향 비교 시 "확실한 호불호"로 보는 기준
export const CONTRADICT_COS = -0.3;      // 이 값보다 낮으면 기본 취향과 반대되는 게시물
export const HONEY_TRUST_THRESHOLD = 100; // 유용성 평가가 이만큼 많으면 진실성 인정

/** 두 취향 벡터의 코사인 유사도. 겹치는 항목이 없으면 null */
export function cosine(a: TasteVector, b: TasteVector): number | null {
  let dot = 0, na = 0, nb = 0, shared = 0;
  for (const k of Object.keys(a)) {
    if (!(k in b)) continue;
    shared++;
    dot += a[k] * b[k];
    na += a[k] * a[k];
    nb += b[k] * b[k];
  }
  if (!shared || !na || !nb) return null;
  return dot / Math.sqrt(na * nb);
}

/** 세부 취향 보정: 둘 다 확실한 호불호가 있는 항목마다 같으면 +5, 반대면 -5 */
export function detailAdjust(a: TasteVector, b: TasteVector): number {
  let adj = 0;
  for (const k of Object.keys(a)) {
    if (!(k in b)) continue;
    if (Math.abs(a[k]) < STRONG || Math.abs(b[k]) < STRONG) continue;
    adj += Math.sign(a[k]) === Math.sign(b[k]) ? DETAIL_POINT : -DETAIL_POINT;
  }
  return adj;
}

/** 위치 인증 방문 평가 보정 (예: 둘 다 죠스떡볶이가 맛있었다 → +5) */
export function visitAdjust(a: UserProfile, b: UserProfile): number {
  let adj = 0;
  for (const place of Object.keys(a.visits)) {
    const bv = b.visits[place];
    if (bv === undefined) continue;
    adj += a.visits[place] === bv ? VISIT_POINT : -VISIT_POINT;
  }
  return adj;
}

/**
 * 주제별 취향 유사율 0~100.
 * 설문 유사율(코사인 → 0~100) + 세부 취향 보정 + 방문 평가 보정.
 * 어느 한쪽이라도 그 주제 취향 데이터가 없으면 null (매칭 대상 아님).
 */
export function similarity(me: UserProfile, other: UserProfile, topic: Topic): number | null {
  const a = me.taste[topic];
  const b = other.taste[topic];
  if (!a || !b) return null;
  const cos = cosine(a, b);
  if (cos === null) return null;
  const base = ((cos + 1) / 2) * 100;
  const v = base + detailAdjust(a, b) + visitAdjust(me, other);
  return Math.max(0, Math.min(100, Math.round(v * 10) / 10));
}

/** 회원 수에 따라 유사취향자 비율을 낮춤: 기본 20% → 18% → 16% → 14% … (최소 10%) */
export function peerRatio(memberCount: number): number {
  if (memberCount < 10_000) return 0.2;
  const steps = Math.floor(Math.log10(memberCount / 1_000));
  return Math.max(0.1, 0.2 - steps * 0.02);
}

/**
 * 주제별 유사취향자(상위 20%) — userId → 유사율.
 * 하루 이틀 단위로 다시 계산하면 기존 유사성향자가 빠지거나 새로 추가된다.
 */
export function similarPeers(
  me: UserProfile,
  users: UserProfile[],
  topic: Topic,
  ratio = peerRatio(users.length),
): Map<string, number> {
  const scored: [string, number][] = [];
  for (const u of users) {
    if (u.id === me.id) continue;
    const s = similarity(me, u, topic);
    if (s !== null) scored.push([u.id, s]);
  }
  scored.sort((x, y) => y[1] - x[1]);
  const take = scored.length ? Math.max(1, Math.ceil(scored.length * ratio)) : 0;
  return new Map(scored.slice(0, take));
}

/* ---------------- 계정 신뢰도 ---------------- */

/** 게시물이 작성자의 기본 취향과 반대인가 (유용성 평가가 많으면 진실성 인정) */
export function contradictsAuthor(post: AlgoPost, author: UserProfile): boolean {
  const base = author.taste[post.topic];
  if (!base) return false;
  const cos = cosine(post.tasteTags, base);
  if (cos === null || cos >= CONTRADICT_COS) return false;
  return post.metrics.honey < HONEY_TRUST_THRESHOLD;
}

export type TrustLevel = 'ok' | 'notice' | 'warning' | 'restricted';

export type AccountTrust = {
  total: number;                    // 0에서 시작, 불일치 1건마다 -1
  byTopic: Record<Topic, number>;   // 주제별 신뢰도 (주제별로 따로 운영)
  level: TrustLevel;
  /** -10에 도달한 시각부터 30일 뒤 (노출 제한 해제 시각) */
  restrictedUntil?: number;
  /** 한 달 제한이 끝나 풀린 상태 — 점수는 유지하고 '경고' 단계로 운영 */
  lifted?: boolean;
};

export const RESTRICT_DAYS = 30;

export function trustLevel(score: number): TrustLevel {
  if (score <= -10) return 'restricted'; // 한 달간 계정 전체 게시물 피드 노출 제한
  if (score <= -6) return 'warning';     // 경고 알림
  if (score <= -3) return 'notice';      // 경고 문구
  return 'ok';
}

export const TRUST_MESSAGE: Record<TrustLevel, string | null> = {
  ok: null,
  notice: '취향과 다른 게시물을 반복 등록하고 있습니다. 기본 취향이 바뀌셨다면 [설정]에서 변경해 주세요.',
  warning: '게시물이 반복적으로 기본 취향과 다릅니다. 계정 신뢰도 감소로 피드 노출이 제한될 수 있어요. 기본 취향이 바뀌었다면 [설정]에서 변경해 주세요.',
  restricted: '취향 불일치 게시물 누적으로 계정 전체 게시물의 피드와 팔로우한 사람의 피드 노출이 한 달간 제한됩니다.',
};

/**
 * 계정 신뢰도. now를 주면 -10 도달 시점부터 30일 제한 기간을 계산하고,
 * 기간이 지나면 제한을 풀어 '경고' 단계로 되돌린다.
 */
export function accountTrust(author: UserProfile, posts: AlgoPost[], now?: number): AccountTrust {
  const byTopic: Record<Topic, number> = {};
  let total = 0;
  let restrictedAt: number | undefined;
  const mine = posts.filter((p) => p.authorId === author.id).sort((a, b) => a.createdAt - b.createdAt);
  for (const p of mine) {
    if (!contradictsAuthor(p, author)) continue;
    byTopic[p.topic] = (byTopic[p.topic] ?? 0) - 1;
    total -= 1;
    if (total <= -10 && restrictedAt === undefined) restrictedAt = p.createdAt;
  }
  const level = trustLevel(total);
  if (restrictedAt === undefined) return { total, byTopic, level };
  const restrictedUntil = restrictedAt + RESTRICT_DAYS * 86_400_000;
  if (now !== undefined && now >= restrictedUntil) return { total, byTopic, level: 'warning', restrictedUntil, lifted: true };
  return { total, byTopic, level, restrictedUntil };
}

/** 주제 신뢰도에 따른 노출 가중치: 0 → 1.0, -1 → 0.9 … -10 이하 → 0 (노출 제한) */
export function trustMultiplier(trust: AccountTrust, topic: Topic): number {
  if (trust.level === 'restricted') return 0;
  const t = trust.byTopic[topic] ?? 0;
  return Math.max(trust.lifted ? 0.3 : 0, 1 + t * 0.1);
}
