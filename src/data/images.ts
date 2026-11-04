/**
 * 화면 확인용 이미지 — Unsplash (Unsplash License, 무료 상업 이용 가능, 출처 표기 선택).
 * 실서비스에서는 사용자가 올린 이미지로 대체된다.
 */
const u = (id: string, w = 720) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const IMG = {
  bbqGrill: u('1461530927168-44328109da52'),        // Jessie Beck — 그릴 위 바비큐
  bbqPlate: u('1626323109697-df55d20f06a8'),        // Z Grills Australia — 접시 위 구운 고기
  meatBoard: u('1692106914421-e04e1066bd62'),       // Mayumi Maciel — 나무 접시 위 고기
  coupleTable: u('1604881990409-b9f246db39da'),     // Priscilla Du Preez — 테이블 너머 맞잡은 손
  soupBowl: u('1609501676725-7186f017a4b7'),        // Vicky Ng — 국자와 국 그릇
  koreanTable: u('1761303506087-9788d0a98e87'),     // Cecelia Chang — 한식 한 상
  tteokbokki: u('1635363638580-c2809d049eee', 160), // Marcin Skalij — 떡볶이
  bowls: u('1498654896293-37aacf113fd9', 160),      // Jakub Kapusnak — 여러 그릇
  ceramicBowls: u('1590301157890-4810ed352733', 160), // Vicky Ng — 흰 그릇 음식
  gift: u('1764385827352-78c20131fd47'),            // Jess Bailey — 리본 선물 상자
  coupleSunset: u('1591969851586-adbbd4accf81'),    // Jonathan Borba — 노을 속 두 사람
  koreanBbq: u('1780082755456-3a72460270ea'),       // 친구들과 한국식 바비큐
  chopsticksPlate: u('1632558610168-8377309e34c7'), // 젓가락과 음식 접시
  soupSpoon: u('1603105037880-880cd4edfb0d'),       // 숟가락과 국 그릇
  barTable: u('1698614082118-8e6eaecb08ef'),        // 은은한 조명의 테이블
  cafeTable: u('1517957096399-3a4e3d34d95e'),       // 흰 테이블과 의자
  campfire: u('1505405241694-58823de133e1'),        // 불꽃 피어오르는 그릴
  grillParty: u('1681353523973-926db2891d30'),      // 그릴 주변에 모인 사람들
  gift2: u('1549465220-1a8b9238cd48'),              // 포장된 선물 상자
  puppy: u('1760615303229-8b32553033a6'),           // 산책하는 골든 리트리버 강아지
  books: u('1658842042779-dc9ab3125690'),           // 쌓인 책
  jejuShore: u('1764092182379-ba45339d5e5b'),       // 돌탑과 바다
  cat: u('1554530699-505410e7bd20'),                // 잠자는 고양이
  bathroom: u('1552321554-5fefe8c9ef14'),           // 깨끗한 욕실
};

/** 프로필 사진 대용 — 작은 원형 썸네일 */
export const AVATARS = [
  u('1541089404510-5c9a779841fc', 96),   // Candice Picard
  u('1426543881949-cbd9a76740a4', 96),   // Caleb Ekeroth
  u('1540076156429-35ffe82b7870', 96),   // Allef Vinicius
  u('1496602910407-bacda74a0fe4', 96),   // Khamkéo
  u('1602470520998-f4a52199a3d6', 96),   // Cindie Hansen
];
export const avatarAt = (i: number) => AVATARS[i % AVATARS.length];
