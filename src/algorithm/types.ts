/**
 * Twinsy 알고리즘 공통 타입.
 * 유료·무료 사용자 구분 없이 같은 매칭 기준을 쓴다 (알고리즘 문서 상단 원칙).
 */

export type Topic = string;

/** 세부 취향 벡터 — 항목별 -1(싫어함) ~ 1(좋아함). 예: { 매운맛: 0.9, MSG: -0.7 } */
export type TasteVector = Record<string, number>;

/** 주제별 세부 취향 (초기 취향 설문 + 본인 콘텐츠 취향 + 투표 답변 + 위치 인증 평가가 합쳐진 결과) */
export type TasteProfile = Record<Topic, TasteVector>;

export type UserProfile = {
  id: string;
  name: string;
  taste: TasteProfile;
  /** 위치 인증 방문 평가 — 장소 id → 1(좋았음) / -1(별로) */
  visits: Record<string, 1 | -1>;
  /** 전문가 배지를 받은 주제 (평균 유용성 평가가 높은 작성자) */
  expertTopics: Topic[];
  /** 취향콕(팔로잉)한 사용자 id */
  follows: string[];
};

export type PostKind = 'normal' | 'honey'; // 일반(요약) / 꿀단지(상세)

export type PostMetrics = {
  honey: number;          // 꿀팁(유용성 평가) 수
  views: number;          // 누적 조회수
  viewsLastHour: number;  // 최근 1시간 조회수
  viewsPrevHour: number;  // 그 전 1시간 조회수
  comments: number;
  dwell: number;          // 평균 체류 시간(초)
  saves: number;
  shares: number;
};

export type AlgoPost = {
  id: string;
  authorId: string;
  topic: Topic;
  kind: PostKind;
  createdAt: number; // epoch ms
  metrics: PostMetrics;
  /** 이 게시물이 드러내는 취향 — 작성자 기본 취향과의 일치 여부 판단에 사용 */
  tasteTags: TasteVector;
  keywords: string[];
};

export type SearchLog = {
  userId: string;
  keyword: string;
  at: number; // epoch ms
  isBot?: boolean;
  isAd?: boolean; // 특정 이벤트·광고 검색
};

export type FeedSource = 'peer' | 'all' | 'following';
export type SearchBucket = 'peer' | 'expert' | 'general';

export type RankedPost<P extends AlgoPost = AlgoPost> = {
  post: P;
  score: number;
  source?: FeedSource;
  bucket?: SearchBucket;
  criteria?: 'A' | 'B' | 'C' | 'D' | 'latest' | 'trend';
  similarity?: number;
};
