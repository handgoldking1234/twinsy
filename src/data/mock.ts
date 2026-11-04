/* 화면 확인용 더미 데이터 — Figma 시안 문구 기준 */
import { IMG } from './images';

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
