# Twinsy — React (Vite + TypeScript)

DESIGN.md 규칙을 따르는 Twinsy 화면 구현. Figma 프레임 순서대로 8개 화면이 들어 있다.

| 순서 | Figma | 화면 | URL |
|---|---|---|---|
| 1 | Main_01_1 | 취향콕 피드 | `#main-pick` |
| 2 | Main_01_2 | 추천 피드 | `#main-recommend` |
| 3 | Main_01_3 | 주제 선택 바텀시트 | `#topic-sheet` |
| 4 | Main_01_4 | 취향콕 빈 상태 | `#main-empty` |
| 5 | Main_01_5-1 | 알림 | `#noti` |
| 6 | Main_01_5-2 | 취향콕 요청 | `#pick-requests` |
| 7 | Main_01_6-1 | 이벤트 | `#events` |
| 8 | Main_01_6-2 | 이벤트 상세 | `#event-detail` |

## 실행
```bash
npm install
npm run dev
```

## 구조
```
src/
  styles/tokens.css       DESIGN.md 1~3장 토큰 (색·폰트·간격·라운드)
  styles/components.css   DESIGN.md 4장 컴포넌트 규격 (토큰만 참조)
  components/ui.tsx       Button, Badge, Header, Tabs, BottomNav, BottomSheet, Toast …
  components/PostCard.tsx 게시물 (꿀팁 / 핵심 Point / 메뉴 평가)
  components/Icon.tsx     임시 아이콘 (Figma 원본 에셋으로 교체 예정)
  screens/                Main · Notice · Event
  data/mock.ts            시안 문구 기반 더미 데이터
```

## 교체 필요 (Figma 원본 확인 필요)
- 아이콘·로고: Figma MCP 호출 한도로 원본 SVG를 받지 못해 같은 크기의 대체 아이콘 사용. `Icon.tsx`의 path만 교체하면 됨.
- 메인 탭·필터 칩·알림 행·이벤트 카드의 세부 간격은 캡처 기준값 → Figma 실측값으로 보정 필요.

## 이미지 출처 (Unsplash License — 무료, 상업적 이용 가능)
`src/data/images.ts`에 모아 두었고, 실서비스에서는 사용자 업로드 이미지로 대체된다. 이미지를 불러오지 못하면 Figma와 같은 체크무늬 자리표시로 돌아간다.

| 용도 | 사진작가 |
|---|---|
| 바비큐 게시물 | Jessie Beck, Z Grills Australia, Mayumi Maciel |
| 연애 게시물 | Priscilla Du Preez |
| 국밥 게시물 | Vicky Ng |
| 알림 썸네일 | Marcin Skalij, Jakub Kapusnak, Vicky Ng |
| 이벤트 | Jess Bailey, Cecelia Chang |
| 프로필 사진 | Candice Picard, Caleb Ekeroth, Allef Vinicius, Khamkéo, Cindie Hansen |
