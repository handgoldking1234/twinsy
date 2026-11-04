/* 화면 확인용 더미 데이터 — Figma 시안 문구 기준 */
import { IMG, avatarAt } from './images';

export type TipLine = { text: string; strong?: string; after?: string };
export type PointSection = { title: string; lines: string[] };
export type MenuRate = { name: string; comment: string; best?: boolean };

export type Post = {
  id: string;
  author: string;
  soul?: boolean;
  expert?: string;
  time: string;
  title: string;
  titleFlag?: boolean;
  category?: string;
  body?: string;
  images: { src: string; alt: string }[];
  avatar: string;
  imageLabel?: string;
  tips?: TipLine[];
  points?: PointSection[];
  menus?: MenuRate[];
  tags: string[];
  location?: string;
  honey: string;
  comments: string;
  shares: string;
};

export const POSTS_PICK: Post[] = [
  {
    id: 'p1',
    images: [{ src: IMG.bbqGrill, alt: '그릴 위 바비큐 꼬치' }, { src: IMG.bbqPlate, alt: '구운 고기 플래터' }],
    avatar: avatarAt(0),
    author: 'Leehappy',
    soul: true,
    expert: '맛집',
    time: '1시간 전',
    title: '음식점#릴라 바비큐 아산지중해',
    titleFlag: true,
    body: '바베큐 찐 맛집 발견! 단점으로는 맛있는데 먹다보니 물려서 아쉬웠음...기본 소스에 곁들여 \'4가지 버전\'의 맛을 만들어내는 비법 공유!',
    tips: [
      { text: '주차는 지중해마을 ', strong: '공영주차장 이용이 가장 편함' },
      { text: '해질녘 야외 테라스 자리는 빨리 매진되니 예약 필수!' },
      { text: '', strong: '추천 메뉴', after: ': 로즈마리 양갈비, 바질 치킨 스테이크, 삼겹 꼬치 플래터' },
      { text: '와인 페어링 메뉴가 잘 준비돼 있어 커플 또는 단체 모임에 굿' },
      { text: '', strong: '주말 저녁 라이브 음악 공연', after: '. 좋은 자리 선착순' },
    ],
    menus: [
      { name: '올 미트 꼬치 플래터', comment: '생각보다 양이 많아요 2인용인데 3명이서 먹어도 될듯', best: true },
      { name: '시저 샐러드', comment: '야채가 싱싱하지 않음' },
    ],
    tags: ['맛집', '데이트', '분위기'],
    location: '탕정면',
    honey: '23만',
    comments: '3.5만',
    shares: '869',
  },
  {
    id: 'p2',
    images: [{ src: IMG.coupleTable, alt: '테이블 너머 손을 맞잡은 커플' }],
    avatar: avatarAt(0),
    author: 'Leehappy',
    soul: true,
    expert: '연애',
    time: '1시간 전',
    title: 'MBTI#ENFP 연애 심층 분석',
    category: '연애',
    points: [
      { title: '1. 플러팅 심층 분석', lines: ['왜 장난을 무기로 쓰는지', '엔프피 플러팅 유형 분석'] },
      { title: '2. 고백 스타일 심층 분석', lines: ['즉흥적인 고백이 성공하는 경우와 실패하는 경우', '엔프피 플러팅 유형 분석'] },
      { title: '3. 연애 스타일 심층 분석', lines: ['왜 "축몰상"이 관계 유지의 핵심인지', '엔프피 플러팅 유형 분석'] },
    ],
    tags: ['연애', '데이트', '분위기'],
    honey: '23만',
    comments: '3.5만',
    shares: '869',
  },
];

export const POSTS_RECOMMEND: Post[] = [
  {
    id: 'r1',
    images: [{ src: IMG.soupBowl, alt: '국밥 한 그릇' }],
    avatar: avatarAt(0),
    author: 'Leehappy',
    soul: true,
    expert: '여행',
    time: '1시간 전',
    title: '광장지#남원국밥',
    titleFlag: true,
    tips: [
      { text: '', strong: '주차', after: ': 지중해마을 공영주차장을 이용하면 가장 편함. 해질녘 야외 테라스 자리는 빨리 매진되니 예약 필수' },
      { text: '', strong: '메뉴', after: ': 로즈마리 양갈비, 바질 치킨 스테이크, 삼겹 꼬치 플래터 추천' },
      { text: '와인 페어링 메뉴가 잘 준비돼 있어 ', strong: '커플 또는 단체 모임', after: '에 좋음' },
      { text: '', strong: '주말 저녁 라이브 음악 공연', after: '. 좋은 자리 선착순' },
    ],
    tags: ['맛집', '데이트', '분위기'],
    location: '탕정면',
    honey: '23만',
    comments: '3.5만',
    shares: '869',
  },
  {
    id: 'r2',
    images: [{ src: IMG.meatBoard, alt: '나무 접시에 담긴 바비큐' }],
    avatar: avatarAt(1),
    author: 'KimJung80',
    soul: true,
    time: '3시간 전',
    title: '음식점#릴라 바비큐 아산지중해 릴라 바비큐 아산지중해',
    titleFlag: true,
    body: '바베큐 찐 맛집 발견! 단점으로는 맛있는데 먹다보니 물려서 아쉬웠음...기본 소스에 곁들여 \'4가지 버전\'의 맛을 만들어내는 비법 공유!',
    tips: [
      { text: '주차는 지중해마을 ', strong: '공영주차장 이용이 가장 편함' },
      { text: '해질녘 야외 테라스 자리는 빨리 매진되니 예약 필수!' },
      { text: '', strong: '추천 메뉴', after: ': 로즈마리 양갈비, 바질 치킨 스테이크, 삼겹 꼬치 플래터' },
    ],
    tags: ['맛집', '데이트', '분위기'],
    location: '탕정면',
    honey: '23만',
    comments: '3.5만',
    shares: '869',
  },
];

export const TOPICS = [
  '트렌드', '데이트·핫플', '푸드', '여행', '패션·뷰티', '엔터테인먼트', '문화·예술',
  '도서', '연애·결혼', '스포츠', '취미·창작', '반려동물', '생활·리빙', '육아',
];

export type Noti = { id: string; kind: 'warning' | 'pick' | 'comment' | 'honey'; thumb?: string; user?: string; soul?: boolean; expert?: string; text: string; time: string };

export const NOTI_TODAY: Noti[] = [
  { id: 'n0', kind: 'warning', text: '회원님의 프로필 계정이 회원님의 이용 정책을 어겨 계정 이용이 제한되었습니다. 운영정책 위반 사유는 이메일로 안내드립니다.', time: '1분' },
  { id: 'n1', kind: 'pick', user: 'ronnyoonsoonmu', soul: true, expert: '맛집', text: '님이 회원님을 취향콕 했어요.', time: '5분' },
  { id: 'n2', thumb: IMG.tteokbokki, kind: 'comment', user: 'kyliejennersd', soul: true, expert: '여행', text: '님이 회원님의 게시물에 댓글을 남겼어요.', time: '12분' },
  { id: 'n3', thumb: IMG.bowls, kind: 'honey', user: 'Blues_pank', expert: '도서', text: '님이 회원님의 게시물을 꿀팁으로 평가했어요.', time: '1시간' },
  { id: 'n4', thumb: IMG.ceramicBowls, kind: 'comment', user: 'YUNkim', text: '님이 회원님의 게시물을 공유했어요.', time: '2시간' },
  { id: 'n5', thumb: IMG.bbqPlate, kind: 'honey', user: 'toolineAA_bob', text: '님이 회원님의 게시물을 저장했어요.', time: '3시간' },
];

export const PICK_REQUESTS = [
  { id: 'q1', user: 'Kyliejennersd', soul: true, expert: '반려동물' },
  { id: 'q2', user: 'Kyliejennersd', soul: true },
  { id: 'q3', user: 'Kyliejennersd', expert: '의학' },
  { id: 'q4', user: 'Kyliejennersd' },
  { id: 'q5', user: 'Kyliejennersd', soul: true },
  { id: 'q6', user: 'Kyliejennersd', soul: true, expert: '도서' },
  { id: 'q7', user: 'Kyliejennersd' },
  { id: 'q8', user: 'Kyliejennersd', soul: true },
  { id: 'q9', user: 'Kyliejennersd', expert: '여행' },
  { id: 'q10', user: 'Kyliejennersd', soul: true },
];

export const EVENTS = [
  { id: 'e1', image: IMG.gift, title: '신규 가입 이벤트', desc: '지금 트윈지에 가입하면 취향테스트 쇼핑백 기프티 카드와 신규 가입자 전원에게 특별 혜택이 기다려요!', period: '2025.08.12 ~ 2025.09.30' },
  { id: 'e2', image: IMG.koreanTable, title: '신규 가입 이벤트', desc: '지금 트윈지에 가입하면 취향테스트 쇼핑백 기프티 카드와 신규 가입자 전원에게 특별 혜택이 기다려요!', period: '2025.08.12 ~ 2025.09.30' },
];
