/**
 * 알고리즘이 돌아가는 예시 세계: 사용자·취향·게시물·반응 지표·검색 로그.
 * 시각은 고정(NOW)해서 화면이 언제 열어도 같은 결과를 보여 준다.
 */
import type { AlgoPost, PostMetrics, SearchLog, UserProfile } from '../algorithm';
import { IMG, avatarAt } from './images';

export const NOW = Date.parse('2026-11-04T21:00:00+09:00');
/** 일 활성 사용자 수 (노출 단계 계산용 예시값) */
export const DAU = 5_000;
const H = 3_600_000;

/* ---------------- 사용자 ---------------- */

export type AppUser = UserProfile & { avatar: string; bio?: string; expertLabel?: string };

export const ME_ID = 'goldking';

const U = (u: Omit<AppUser, 'visits' | 'expertTopics' | 'follows' | 'avatar'> & Partial<AppUser>, i: number): AppUser => ({
  visits: {},
  expertTopics: [],
  follows: [],
  ...u,
  avatar: u.avatar ?? avatarAt(i),
});

export const USERS: AppUser[] = [
  U({
    id: ME_ID, name: 'GOLDKING', bio: '매운 거 좋아하는 바다 여행러',
    taste: {
      푸드: { 매운맛: 0.9, 단맛: -0.6, 건강식: 0.6, MSG: -0.7, 고기: 0.8 },
      여행: { 바다: 0.8, 호텔: 0.7, 캠핑: -0.6, 관광지: 0.5 },
      '데이트·핫플': { 분위기: 0.8, 가성비: 0.4, 웨이팅: -0.7 },
    },
    visits: { 죠스떡볶이: 1, 릴라바비큐: 1 },
    follows: ['leehappy', 'kimjung80'],
  }, 3),
  U({
    id: 'leehappy', name: 'Leehappy', expertTopics: ['푸드'], expertLabel: '맛집',
    taste: {
      푸드: { 매운맛: 0.8, 단맛: -0.5, 건강식: 0.5, MSG: -0.6, 고기: 0.9 },
      '연애·결혼': { 감성: 0.9, 즉흥: 0.8, 현실: -0.3 },
      '데이트·핫플': { 분위기: 0.9, 가성비: 0.2, 웨이팅: -0.5 },
    },
    visits: { 릴라바비큐: 1 },
  }, 0),
  U({
    id: 'kimjung80', name: 'KimJung80',
    taste: {
      푸드: { 매운맛: 0.4, 단맛: 0.2, 건강식: 0.7, MSG: -0.2, 고기: 0.6 },
      여행: { 바다: 0.6, 호텔: 0.3, 캠핑: 0.8, 관광지: 0.2 },
    },
  }, 1),
  U({
    id: 'ronnyoon', name: 'ronnyoonsoonmu',
    taste: { 푸드: { 매운맛: 1, 단맛: -0.4, 건강식: 0.3, MSG: -0.5, 고기: 0.7 } },
    visits: { 죠스떡볶이: 1 },
  }, 2),
  U({
    id: 'kylie', name: 'Kyliejennersd', expertTopics: ['반려동물'], expertLabel: '반려동물',
    taste: {
      푸드: { 매운맛: -0.8, 단맛: 0.9, 건강식: -0.3, MSG: 0.5, 고기: -0.2 },
      반려동물: { 강아지: 0.9, 고양이: 0.6 },
    },
    visits: { 죠스떡볶이: -1 },
  }, 4),
  U({
    id: 'aiden', name: 'Aiden_Byun', expertTopics: ['여행'], expertLabel: '여행',
    taste: { 여행: { 바다: 0.9, 호텔: 0.8, 캠핑: -0.5, 관광지: 0.6 } },
  }, 0),
  U({
    id: 'jyeahs2', name: 'Jyeahs2', expertTopics: ['도서'], expertLabel: '도서',
    taste: { 도서: { 소설: 0.8, 자기계발: -0.4 }, 푸드: { 매운맛: 0.1, 단맛: 0.3, 건강식: 0.2 } },
  }, 1),
  U({
    id: 'blues', name: 'Blues_pank',
    taste: { '데이트·핫플': { 분위기: 0.9, 가성비: 0.5, 웨이팅: -0.8 }, 푸드: { 매운맛: 0.6, 고기: 0.5 } },
  }, 2),
  U({
    id: 'yunkim', name: 'YUNkim', expertTopics: ['생활·리빙'], expertLabel: '홈케어',
    taste: { '생활·리빙': { 청소: 0.9, 미니멀: 0.7 }, 푸드: { 매운맛: -0.6, 단맛: 0.6, 건강식: 0.8, MSG: -0.9 } },
  }, 3),
  U({
    id: 'tooline', name: 'toolineAA_bob',
    taste: { 푸드: { 매운맛: -0.9, 단맛: 0.7, 건강식: 0.6, MSG: -0.8 } },
  }, 4),
  U({ id: 'adking', name: 'deal_king99', taste: { 푸드: { 매운맛: -0.9, 단맛: 0.9 } } }, 1),
];

export const userById = new Map(USERS.map((u) => [u.id, u]));
export const ME = userById.get(ME_ID)!;

/* ---------------- 게시물 ---------------- */

export type TipLine = { text: string; strong?: string; after?: string };
export type PointSection = { title: string; lines: string[] };
export type MenuRate = { name: string; comment: string; best?: boolean };

export type AppPost = AlgoPost & {
  title: string;
  titleFlag?: boolean;
  body?: string;
  images: { src: string; alt: string }[];
  tips?: TipLine[];
  points?: PointSection[];
  menus?: MenuRate[];
  tags: string[];
  location?: string;
  pros?: string[];
  cons?: string[];
};

const M = (honey: number, views: number, comments: number, saves: number, shares: number, last = 40, prev = 30, dwell = 45): PostMetrics => ({
  honey, views, viewsLastHour: last, viewsPrevHour: prev, comments, dwell, saves, shares,
});

const P = (p: Omit<AppPost, 'createdAt'> & { ageH: number }): AppPost => {
  const { ageH, ...rest } = p;
  return { ...rest, createdAt: NOW - ageH * H };
};

const BBQ_TIPS: TipLine[] = [
  { text: '주차는 지중해마을 ', strong: '공영주차장 이용이 가장 편함' },
  { text: '해질녘 야외 테라스 자리는 빨리 매진되니 예약 필수!' },
  { text: '', strong: '추천 메뉴', after: ': 로즈마리 양갈비, 바질 치킨 스테이크, 삼겹 꼬치 플래터' },
  { text: '와인 페어링 메뉴가 잘 준비돼 있어 커플 또는 단체 모임에 굿' },
  { text: '', strong: '주말 저녁 라이브 음악 공연', after: '. 좋은 자리 선착순' },
];

const CORE: AppPost[] = [
  /* ----- 48시간 이내 (최신순 대상) ----- */
  P({
    id: 'p-bbq', authorId: 'leehappy', topic: '푸드', kind: 'normal', ageH: 1,
    metrics: M(230, 12000, 35, 400, 86, 220, 120, 70),
    tasteTags: { 고기: 0.9, 매운맛: 0.3 }, keywords: ['바비큐', '맛집', '아산', '양갈비'],
    title: '음식점#릴라 바비큐 아산지중해', titleFlag: true,
    body: "바베큐 찐 맛집 발견! 단점으로는 맛있는데 먹다보니 물려서 아쉬웠음...기본 소스에 곁들여 '4가지 버전'의 맛을 만들어내는 비법 공유!",
    images: [{ src: IMG.bbqGrill, alt: '그릴 위 바비큐 꼬치' }, { src: IMG.bbqPlate, alt: '구운 고기 플래터' }],
    tips: BBQ_TIPS,
    menus: [
      { name: '올 미트 꼬치 플래터', comment: '생각보다 양이 많아요 2인용인데 3명이서 먹어도 될듯', best: true },
      { name: '시저 샐러드', comment: '야채가 싱싱하지 않음' },
    ],
    tags: ['맛집', '데이트', '분위기'], location: '탕정면',
    pros: ['양이 넉넉함', '야외 테라스 분위기', '와인 페어링'], cons: ['먹다 보면 물림', '샐러드 신선도 아쉬움'],
  }),
  P({
    id: 'p-mbti', authorId: 'leehappy', topic: '연애·결혼', kind: 'honey', ageH: 3,
    metrics: M(180, 9800, 52, 610, 140, 180, 90, 95),
    tasteTags: { 감성: 0.8, 즉흥: 0.9 }, keywords: ['MBTI', 'ENFP', '연애'],
    title: 'MBTI#ENFP 연애 심층 분석',
    images: [{ src: IMG.coupleTable, alt: '테이블 너머 손을 맞잡은 커플' }],
    points: [
      { title: '1. 플러팅 심층 분석', lines: ['왜 장난을 무기로 쓰는지', '엔프피 플러팅 유형 분석'] },
      { title: '2. 고백 스타일 심층 분석', lines: ['즉흥적인 고백이 성공하는 경우와 실패하는 경우', '엔프피 플러팅 유형 분석'] },
      { title: '3. 연애 스타일 심층 분석', lines: ['왜 "축몰상"이 관계 유지의 핵심인지', '엔프피 플러팅 유형 분석'] },
    ],
    tags: ['연애', 'MBTI', 'ENFP'],
  }),
  P({
    id: 'p-tteok', authorId: 'ronnyoon', topic: '푸드', kind: 'normal', ageH: 2,
    metrics: M(95, 6400, 41, 120, 33, 300, 60, 40),
    tasteTags: { 매운맛: 0.9, MSG: -0.3 }, keywords: ['떡볶이', '죠스떡볶이', '매운맛'],
    title: '떡볶이#죠스떡볶이 신메뉴 로제 vs 오리지널', titleFlag: true,
    body: '로제가 맛있다길래 둘 다 시켜 봄. 매운 거 좋아하면 오리지널 한 단계 매운맛 추천.',
    images: [{ src: IMG.tteokbokki.replace('w=160', 'w=720'), alt: '떡볶이' }],
    tips: [
      { text: '', strong: '오리지널 매운맛', after: '이 로제보다 덜 느끼함' },
      { text: '튀김은 김말이보다 ', strong: '야채튀김', after: ' 추천' },
    ],
    tags: ['떡볶이', '분식'], location: '강남역',
    pros: ['매운맛 단계 선택', '튀김 바삭'], cons: ['로제는 금방 느끼함'],
  }),
  P({
    id: 'p-gukbap', authorId: 'kimjung80', topic: '푸드', kind: 'normal', ageH: 5,
    metrics: M(60, 4100, 18, 90, 12),
    tasteTags: { 건강식: 0.7, 고기: 0.6 }, keywords: ['국밥', '남원', '맛집'],
    title: '광장지#남원국밥', titleFlag: true,
    images: [{ src: IMG.soupBowl, alt: '국밥 한 그릇' }],
    tips: [
      { text: '', strong: '주차', after: ': 가게 뒤 공영주차장, 30분 무료' },
      { text: '', strong: '메뉴', after: ': 순대국밥보다 머릿고기국밥이 국물 깔끔' },
      { text: '깍두기 맛집. ', strong: '아침 7시', after: '부터 영업' },
    ],
    tags: ['국밥', '해장'], location: '종로',
    pros: ['국물 깔끔', '이른 영업'], cons: ['점심엔 웨이팅'],
  }),
  P({
    id: 'p-tteokmap', authorId: 'ronnyoon', topic: '푸드', kind: 'honey', ageH: 6,
    metrics: M(320, 15000, 77, 980, 210, 520, 80, 120),
    tasteTags: { 매운맛: 1 }, keywords: ['떡볶이', '매운맛', '맛집지도'],
    title: '꿀단지#서울 매운 떡볶이 지도 10곳',
    body: '3년 동안 다닌 매운 떡볶이 집만 골라서 맵기 순으로 정리. 웨이팅 팁 포함.',
    images: [{ src: IMG.chopsticksPlate, alt: '떡볶이와 젓가락' }],
    points: [
      { title: '1. 맵기 5단계 이상', lines: ['신당동 ○○ — 캡사이신 없이 고추로만', '을지로 △△ — 치즈 추가 필수'] },
      { title: '2. 웨이팅 피하는 시간', lines: ['평일 오후 3~5시', '주말은 오픈 직후'] },
    ],
    tags: ['떡볶이', '매운맛', '맛집지도'],
    pros: ['맵기 순 정리', '웨이팅 팁'], cons: ['강북 위주'],
  }),
  P({
    id: 'p-dessert', authorId: 'kylie', topic: '푸드', kind: 'normal', ageH: 4,
    metrics: M(140, 8800, 64, 300, 70, 600, 90, 50),
    tasteTags: { 단맛: 0.9, 매운맛: -0.5 }, keywords: ['두쫀쿠', '디저트', '쿠키'],
    title: '디저트#두쫀쿠 오픈런 후기',
    body: '두바이 쫀득 쿠키 드디어 성공. 오전 10시 오픈인데 9시 20분에 줄 섰어요.',
    images: [{ src: IMG.gift2, alt: '디저트 상자' }],
    tips: [{ text: '1인 ', strong: '4개 구매 제한' }, { text: '현장 결제는 카드만 가능' }],
    tags: ['디저트', '오픈런'], location: '성수동',
    pros: ['쫀득한 식감'], cons: ['오픈런 필수', '1인 구매 제한'],
  }),
  P({
    id: 'p-dessert-map', authorId: 'kylie', topic: '푸드', kind: 'honey', ageH: 1.5,
    metrics: M(160, 7200, 48, 640, 120, 900, 60, 100),
    tasteTags: { 단맛: 0.9 }, keywords: ['두쫀쿠', '디저트', '판매처'],
    title: '꿀단지#두쫀쿠 판매처·재고 시간 총정리',
    images: [{ src: IMG.gift2, alt: '디저트 상자' }],
    points: [
      { title: '1. 재고 들어오는 시간', lines: ['성수 본점 오전 10시·오후 3시', '편의점 납품은 화·금'] },
      { title: '2. 줄 서기 팁', lines: ['오픈 40분 전 도착', '현장 결제는 카드만'] },
    ],
    tags: ['두쫀쿠', '디저트'], location: '성수동',
    pros: ['재고 시간 정리'], cons: ['지역 한정'],
  }),
  P({
    id: 'p-dog', authorId: 'kylie', topic: '반려동물', kind: 'honey', ageH: 10,
    metrics: M(210, 7600, 38, 520, 90),
    tasteTags: { 강아지: 0.9 }, keywords: ['강아지', '산책', '겨울'],
    title: '꿀단지#강아지 겨울 산책 체크리스트',
    images: [{ src: IMG.puppy, alt: '산책하는 강아지' }],
    points: [
      { title: '1. 발바닥 보호', lines: ['제설제 묻으면 바로 닦기', '발바닥 밤 바르기'] },
      { title: '2. 산책 시간', lines: ['낮 12시~3시 사이', '소형견은 20분 이내'] },
    ],
    tags: ['강아지', '산책'],
  }),
  P({
    id: 'p-jeju', authorId: 'aiden', topic: '여행', kind: 'honey', ageH: 12,
    metrics: M(260, 11000, 45, 870, 160, 260, 140, 110),
    tasteTags: { 바다: 0.9, 관광지: 0.4 }, keywords: ['제주', '카페리', '여행', '완도'],
    title: '꿀단지#완도→제주 카페리로 차 싣고 가는 법',
    images: [{ src: IMG.jejuShore, alt: '제주 바닷가 돌탑' }],
    points: [
      { title: '1. 예약', lines: ['차량 선적은 2주 전 마감되는 경우 많음', '왕복 예약이 더 저렴'] },
      { title: '2. 당일', lines: ['출항 1시간 전 차량 대기', '객실은 침대칸 추천'] },
    ],
    tags: ['제주', '여행', '카페리'], location: '완도항',
    pros: ['렌트비 절약'], cons: ['뱃멀미 주의'],
  }),
  P({
    id: 'p-hotel', authorId: 'aiden', topic: '여행', kind: 'normal', ageH: 20,
    metrics: M(90, 5200, 22, 260, 40),
    tasteTags: { 바다: 0.8, 호텔: 0.9 }, keywords: ['부산', '호텔', '오션뷰'],
    title: '여행#부산 오션뷰 호텔 가성비 3곳',
    images: [{ src: IMG.coupleSunset, alt: '노을 진 바다' }],
    tips: [{ text: '평일 숙박이 ', strong: '주말 대비 40% 저렴' }, { text: '오션뷰는 고층 배정 요청 필수' }],
    tags: ['부산', '호텔'], location: '해운대',
  }),
  P({
    id: 'p-book', authorId: 'jyeahs2', topic: '도서', kind: 'normal', ageH: 9,
    metrics: M(70, 3000, 14, 150, 20),
    tasteTags: { 소설: 0.9 }, keywords: ['소설', '책추천'],
    title: '도서#올해 읽은 장편소설 BEST 3',
    images: [{ src: IMG.books, alt: '쌓인 책' }],
    tips: [{ text: '출퇴근길엔 ', strong: '단편집', after: '부터' }],
    tags: ['책추천', '소설'],
  }),
  P({
    id: 'p-bar', authorId: 'blues', topic: '데이트·핫플', kind: 'normal', ageH: 7,
    metrics: M(120, 6100, 30, 340, 55),
    tasteTags: { 분위기: 0.9, 웨이팅: -0.8 }, keywords: ['성수', '바', '데이트'],
    title: '데이트#성수 웨이팅 없는 분위기 바',
    images: [{ src: IMG.barTable, alt: '은은한 조명의 바 테이블' }],
    tips: [{ text: '', strong: '평일 7시 이전', after: ' 입장하면 창가 자리' }, { text: '시그니처 칵테일은 단맛 조절 가능' }],
    tags: ['데이트', '성수'], location: '성수동',
  }),
  P({
    id: 'p-clean', authorId: 'yunkim', topic: '생활·리빙', kind: 'honey', ageH: 15,
    metrics: M(300, 13000, 60, 1200, 300),
    tasteTags: { 청소: 0.9 }, keywords: ['청소', '곰팡이', '욕실'],
    title: '꿀단지#욕실 곰팡이 10분 청소법',
    images: [{ src: IMG.bathroom, alt: '깨끗한 욕실' }],
    points: [
      { title: '1. 준비물', lines: ['락스 희석액(1:10)', '키친타월'] },
      { title: '2. 순서', lines: ['실리콘에 키친타월 붙이고 락스 적시기', '30분 후 물청소'] },
    ],
    tags: ['청소', '살림'],
  }),
  P({
    id: 'p-buldak', authorId: 'tooline', topic: '푸드', kind: 'normal', ageH: 2.5,
    metrics: M(4, 900, 3, 2, 1),
    tasteTags: { 매운맛: 1, 단맛: -0.5 }, keywords: ['불닭', '매운맛'],
    title: '불닭 3배 매운맛 도전 성공',
    images: [{ src: IMG.ceramicBowls.replace('w=160', 'w=720'), alt: '매운 볶음면' }],
    tips: [{ text: '우유보다 ', strong: '쿨피스', after: '가 효과 좋음' }],
    tags: ['매운맛', '챌린지'],
  }),

  /* ----- 49시간 이후 (트렌드순 대상) ----- */
  P({
    id: 'p-mealkit', authorId: 'ronnyoon', topic: '푸드', kind: 'honey', ageH: 60,
    metrics: M(410, 21000, 120, 1500, 380, 30, 30, 130),
    tasteTags: { 매운맛: 0.8 }, keywords: ['떡볶이', '밀키트'],
    title: '꿀단지#떡볶이 밀키트 6종 맵기 비교',
    images: [{ src: IMG.koreanTable, alt: '한식 한 상' }],
    points: [{ title: '1. 맵기 순위', lines: ['A사 > C사 > B사', '국물 많은 건 B사'] }],
    tags: ['떡볶이', '밀키트'],
  }),
  P({
    id: 'p-lamb', authorId: 'leehappy', topic: '푸드', kind: 'normal', ageH: 70,
    metrics: M(150, 7000, 40, 300, 60, 20, 25),
    tasteTags: { 고기: 0.9 }, keywords: ['양갈비', '고기'],
    title: '고기#양갈비 집 고르는 법',
    images: [{ src: IMG.meatBoard, alt: '나무 접시 위 고기' }],
    tips: [{ text: '', strong: '숄더랙', after: '보다 프렌치랙이 잡내 적음' }],
    tags: ['양갈비'],
  }),
  P({
    id: 'p-camp', authorId: 'kimjung80', topic: '여행', kind: 'honey', ageH: 100,
    metrics: M(280, 16000, 90, 1100, 240, 15, 18),
    tasteTags: { 캠핑: 0.9 }, keywords: ['차박', '캠핑'],
    title: '꿀단지#초보 차박 세팅 A to Z',
    images: [{ src: IMG.campfire, alt: '캠핑 불꽃' }],
    points: [{ title: '1. 매트', lines: ['자충 매트 + 발포 매트 2겹', '평탄화 먼저'] }],
    tags: ['차박', '캠핑'],
  }),
  P({
    id: 'p-cafe', authorId: 'blues', topic: '데이트·핫플', kind: 'normal', ageH: 90,
    metrics: M(110, 5800, 28, 270, 44, 10, 12),
    tasteTags: { 분위기: 0.8 }, keywords: ['카페', '데이트'],
    title: '데이트#한남동 조용한 브런치 카페',
    images: [{ src: IMG.cafeTable, alt: '흰 테이블 카페' }],
    tips: [{ text: '', strong: '예약 필수', after: ', 주말 2시간 제한' }],
    tags: ['카페', '브런치'], location: '한남동',
  }),
  P({
    id: 'p-cat', authorId: 'kylie', topic: '반려동물', kind: 'normal', ageH: 80,
    metrics: M(130, 6500, 33, 280, 50, 10, 10),
    tasteTags: { 고양이: 0.8 }, keywords: ['고양이', '숨숨집'],
    title: '반려동물#고양이 숨숨집 직접 만들기',
    images: [{ src: IMG.cat, alt: '잠자는 고양이' }],
    tips: [{ text: '박스 입구는 ', strong: '지름 20cm', after: '가 적당' }],
    tags: ['고양이', 'DIY'],
  }),
  P({
    id: 'p-kimchi', authorId: 'yunkim', topic: '푸드', kind: 'honey', ageH: 130,
    metrics: M(350, 18000, 95, 1300, 290, 80, 20, 140),
    tasteTags: { 건강식: 0.8, 매운맛: 0.3 }, keywords: ['김치', '김장', '레시피'],
    title: '꿀단지#김장 김치 황금 레시피',
    images: [{ src: IMG.grillParty, alt: '함께 음식 준비' }],
    points: [{ title: '1. 절임', lines: ['배추 10포기 기준 소금 2kg', '8시간 절이고 3번 헹굼'] }],
    tags: ['김장', '김치'],
  }),
];

/** 내 게시물 (마이프로필) */
const MINE: AppPost[] = [
  P({
    id: 'p-my-tteok', authorId: ME_ID, topic: '푸드', kind: 'normal', ageH: 30,
    metrics: M(48, 2100, 12, 60, 8),
    tasteTags: { 매운맛: 0.9, MSG: -0.4 }, keywords: ['떡볶이', '매운맛'],
    title: '떡볶이#신당동 할머니 떡볶이', titleFlag: true,
    images: [{ src: IMG.chopsticksPlate, alt: '떡볶이' }],
    tips: [{ text: '', strong: '매운맛 2단계', after: '가 국물 맛이 제일 좋음' }],
    tags: ['떡볶이'], location: '신당동',
  }),
  P({
    id: 'p-my-hotel', authorId: ME_ID, topic: '여행', kind: 'honey', ageH: 75,
    metrics: M(120, 5400, 20, 340, 40),
    tasteTags: { 바다: 0.9, 호텔: 0.8 }, keywords: ['강릉', '호텔', '오션뷰'],
    title: '꿀단지#강릉 오션뷰 호텔 고르는 법',
    images: [{ src: IMG.coupleSunset, alt: '바다 노을' }],
    points: [{ title: '1. 방향', lines: ['동향 객실은 일출', '고층 요청은 체크인 전날'] }],
    tags: ['강릉', '호텔'],
  }),
  P({
    id: 'p-my-bar', authorId: ME_ID, topic: '데이트·핫플', kind: 'normal', ageH: 120,
    metrics: M(30, 1500, 6, 40, 3),
    tasteTags: { 분위기: 0.8 }, keywords: ['을지로', '데이트'],
    title: '데이트#을지로 루프탑 바',
    images: [{ src: IMG.barTable, alt: '바 테이블' }],
    tags: ['을지로'],
  }),
];

/** 취향과 반대 게시물을 반복 등록한 계정 — 신뢰도 감점 예시 */
const CONTRA: AppPost[] = [
  ...[30, 40, 52].map((age, i) =>
    P({
      id: `p-tooline-${i}`, authorId: 'tooline', topic: '푸드', kind: 'normal', ageH: age,
      metrics: M(2, 400, 1, 0, 0, 5, 5),
      tasteTags: { 매운맛: 0.9, MSG: 0.8 }, keywords: ['매운맛', '야식'],
      title: `야식#매운 야식 추천 ${i + 1}`, images: [], tags: ['야식'],
    })),
  ...Array.from({ length: 10 }, (_, i) =>
    P({
      id: `p-ad-${i}`, authorId: 'adking', topic: '푸드', kind: 'normal', ageH: 1 + i * 3,
      metrics: M(1, 300, 0, 0, 0, 100, 1),
      tasteTags: { 매운맛: 1, 단맛: -1 }, keywords: ['떡볶이', '매운맛'],
      title: `[광고] 역대급 매운 떡볶이 할인 ${i + 1}`, images: [], tags: ['할인'],
    })),
];

export const POSTS: AppPost[] = [...CORE, ...MINE, ...CONTRA];
export const postById = new Map(POSTS.map((p) => [p.id, p]));

export const postText = (p: AppPost) =>
  [p.title, p.body, ...p.tags, ...(p.tips ?? []).map((t) => `${t.text}${t.strong ?? ''}${t.after ?? ''}`)].join(' ');

/* ---------------- 검색 로그 (최근 2시간) ---------------- */

const logs = (keyword: string, prev: number, last: number, extra: Partial<SearchLog> = {}): SearchLog[] => [
  ...Array.from({ length: prev }, (_, i) => ({ userId: `u${i}`, keyword, at: NOW - (1.1 + (i % 9) / 10) * H, ...extra })),
  ...Array.from({ length: last }, (_, i) => ({ userId: `v${i}`, keyword, at: NOW - ((i % 10) / 10.5) * H, ...extra })),
];

export const SEARCH_LOGS: SearchLog[] = [
  ...logs('두쫀쿠', 8, 64),
  ...logs('떡볶이', 30, 70),
  ...logs('김장', 12, 40),
  ...logs('제주', 25, 38),
  ...logs('곰팡이', 5, 22),
  ...logs('양갈비', 20, 18),
  ...logs('강아지', 10, 12),
  ...logs('할인쿠폰', 0, 200, { isAd: true }),
  ...Array.from({ length: 80 }, () => ({ userId: 'bot', keyword: '매크로', at: NOW - 0.2 * H, isBot: true })),
];

/** 실시간 Top5 노출 이력 — 이전 1시간 갱신 결과 */
export const TOP5_HISTORY = {
  frontCount: { 'p-tteokmap': 3 } as Record<string, number>, // 이미 맨 앞 3번 노출 → 1~2위 배제
  shownBefore: new Set<string>(['p-clean']),
};

/* ---------------- 투표 ---------------- */

export type Vote = {
  id: string;
  authorId: string;
  ageLabel: string;
  question: string;
  images: string[];
  options: { id: string; label: string; total: number; peer: number; expert: number }[];
  likes: number;
  comments: number;
};

export const VOTES: Vote[] = [
  {
    id: 'v1', authorId: 'leehappy', ageLabel: '43분 전',
    question: '제주 2박 3일, 렌트 vs 카페리로 차 싣고 가기 어떤 게 나을까요?',
    images: [IMG.jejuShore, IMG.coupleSunset],
    options: [
      { id: 'a', label: '렌트가 편하다', total: 128, peer: 12, expert: 3 },
      { id: 'b', label: '카페리로 내 차가 낫다', total: 96, peer: 21, expert: 6 },
      { id: 'c', label: '대중교통+택시', total: 31, peer: 2, expert: 0 },
    ],
    likes: 78, comments: 49,
  },
  {
    id: 'v2', authorId: 'ronnyoon', ageLabel: '2시간 전',
    question: '떡볶이 맵기 몇 단계가 적당해요?',
    images: [IMG.chopsticksPlate],
    options: [
      { id: 'a', label: '순한맛', total: 40, peer: 1, expert: 0 },
      { id: 'b', label: '보통맛', total: 112, peer: 8, expert: 2 },
      { id: 'c', label: '매운맛 이상', total: 150, peer: 27, expert: 4 },
    ],
    likes: 33, comments: 18,
  },
];

/* ---------------- 메시지 ---------------- */

export type Chat = { id: string; userId: string; last: string; time: string; unread: number; messages: { mine: boolean; text: string; time: string }[] };

export const CHATS: Chat[] = [
  {
    id: 'c1', userId: 'leehappy', last: '양갈비는 프렌치랙으로 시키세요!', time: '오후 8:12', unread: 2,
    messages: [
      { mine: true, text: '릴라 바비큐 글 잘 봤어요. 2명이면 뭐 시키면 좋을까요?', time: '오후 8:02' },
      { mine: false, text: '꼬치 플래터 하나면 충분해요 :)', time: '오후 8:10' },
      { mine: false, text: '양갈비는 프렌치랙으로 시키세요!', time: '오후 8:12' },
    ],
  },
  {
    id: 'c2', userId: 'aiden', last: '카페리는 2주 전에 예약하세요', time: '어제', unread: 0,
    messages: [
      { mine: true, text: '제주 카페리 차량 선적 언제 예약해야 하나요?', time: '어제' },
      { mine: false, text: '카페리는 2주 전에 예약하세요', time: '어제' },
    ],
  },
  {
    id: 'c3', userId: 'ronnyoon', last: '신당동 거기 진짜 매워요 ㅋㅋ', time: '11월 2일', unread: 0,
    messages: [{ mine: false, text: '신당동 거기 진짜 매워요 ㅋㅋ', time: '11월 2일' }],
  },
];

/* ---------------- 취향 테스트 (온보딩) ---------------- */

export type TasteQuestion = { id: string; topic: string; feature: string; question: string; options: { label: string; value: number }[] };

export const TASTE_TEST: TasteQuestion[] = [
  { id: 'q1', topic: '푸드', feature: '매운맛', question: '매운 음식, 어느 정도 좋아하세요?', options: [{ label: '못 먹어요', value: -1 }, { label: '조금', value: 0 }, { label: '좋아해요', value: 0.6 }, { label: '맵부심 있어요', value: 1 }] },
  { id: 'q2', topic: '푸드', feature: '단맛', question: '디저트·단 음식은요?', options: [{ label: '별로', value: -0.7 }, { label: '가끔', value: 0 }, { label: '자주 찾아요', value: 0.8 }] },
  { id: 'q3', topic: '푸드', feature: 'MSG', question: 'MSG·자극적인 맛 괜찮으세요?', options: [{ label: '피해요', value: -0.8 }, { label: '상관없어요', value: 0 }, { label: '좋아요', value: 0.7 }] },
  { id: 'q4', topic: '푸드', feature: '건강식', question: '칼로리·건강 신경 쓰시나요?', options: [{ label: '전혀', value: -0.5 }, { label: '조금', value: 0.2 }, { label: '많이', value: 0.8 }] },
  { id: 'q5', topic: '여행', feature: '바다', question: '여행지는 바다·강·호수가 좋다', options: [{ label: '아니요', value: -0.6 }, { label: '보통', value: 0 }, { label: '네', value: 0.9 }] },
  { id: 'q6', topic: '여행', feature: '캠핑', question: '캠핑은요?', options: [{ label: '귀찮아요', value: -0.7 }, { label: '가끔', value: 0.2 }, { label: '좋아해요', value: 0.9 }] },
  { id: 'q7', topic: '여행', feature: '호텔', question: '숙소는 호텔 선호', options: [{ label: '아니요', value: -0.4 }, { label: '보통', value: 0 }, { label: '네', value: 0.8 }] },
  { id: 'q8', topic: '데이트·핫플', feature: '웨이팅', question: '맛집 웨이팅, 감수할 수 있다', options: [{ label: '절대 안 해요', value: -0.9 }, { label: '30분까지', value: 0 }, { label: '얼마든지', value: 0.8 }] },
];
