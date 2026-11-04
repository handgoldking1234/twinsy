# Twinsy — DESIGN.md

> 이 문서는 Twinsy(트윈지) 화면을 코드로 옮길 때 **반드시 지켜야 하는 디자인 규칙**이다.
> 출처: Figma `Twinsy` (fileKey `0hXCBqF0I5u7Xp70akxFcE`, Page 1) — 변수(Variables), 텍스트 스타일, 실제 화면 컴포넌트에서 추출.
> 규칙에 없는 값을 임의로 만들지 말 것. 새 값이 필요하면 이 문서에 먼저 추가한 뒤 사용한다.

---

## 0. 핵심 원칙

1. **모노톤 + 브라운 포인트.** 화면의 90%는 블랙·그레이·화이트. 컬러는 브랜드 브라운(#A36502 / #BE6307), 위험 액션 레드(#FD0D19), 전문가 그린(#53991D)만 의미가 있을 때 쓴다.
2. **하드코딩 금지.** 색·폰트·간격·라운드는 모두 아래 CSS 변수로만 참조한다.
3. **폰트는 Pretendard 단일.** 예외는 `My 꿀팁` 같은 포인트 라벨의 영문 스크립트(Kaushan Script) 하나뿐.
4. **모바일 퍼스트 360 × 800** 기준으로 설계되어 있다.
5. 텍스트 행간은 대부분 `1`(한 줄 UI 텍스트) 또는 `1.3~1.5`(본문). 이 두 계열 외의 값은 쓰지 않는다.

---

## 1. Color Palette

### 1-1. Brand

| 변수 | Hex | 용도 |
|---|---|---|
| `--color-brand-primary` | `#050505` | 주색. 제목, 리스트 소제목, 꿀팁 본문, 메뉴명 |
| `--color-brand-secondary` | `#A36502` | 보조색(브라운). 바텀시트 제목의 강조 키워드 (예: **인증 번호**를 못 받으셨나요?) |
| `--color-brown600` | `#BE6307` | 포인트 라벨 (`My 꿀팁` 서브타이틀) |
| `--color-point-primary` | `#FD0D19` | 파괴적/취소 액션 텍스트 (다이얼로그의 "취향콕 취소", "삭제", "차단") |
| `--color-brand-expert` | `#53991D` | 전문가 배지 텍스트 |

### 1-2. Neutral (Black scale)

| 변수 | Hex | 용도 |
|---|---|---|
| `--color-text-primary` | `#000000` | 기본 텍스트 |
| `--color-black800` | `#242424` | Sub Black1 |
| `--color-black600` | `#303030` | 꿀팁 평가 칩 테두리·텍스트 |
| `--color-black400` | `#373737` | **Primary 버튼 배경**, 아이콘 버튼 카운트 텍스트 |
| `--color-black300` | `#4A4A4A` | 보조 본문, 태그, 위치, 정렬 버튼 |
| `--color-black200` | `#B2B2B2` | **Secondary(취소) 버튼 배경** |
| `--color-black100` | `#C6C6C6` | 비활성 아이콘 계열 |

### 1-3. Text (Gray)

| 변수 | Hex | 용도 |
|---|---|---|
| `--color-text-gray800` | `#838383` | 다이얼로그 취소 텍스트, 메뉴 코멘트, 아웃라인 버튼 텍스트 |
| `--color-text-secondary` | `#929292` | 카테고리 라벨, 플레이스홀더(검색) |
| `--color-text-disabled1` | `#CCCCCC` | 입력창 플레이스홀더, 비활성 텍스트 |
| `--color-text-disabled2` | `#D6D6D6` | 바텀시트 그래버, 비활성 |
| (팔레트 표기) Sub Gray | `#E3E3E3` | 연한 구분 요소 |

### 1-4. Background / Border

| 변수 | Hex | 용도 |
|---|---|---|
| `--color-white` | `#FFFFFF` | 기본 배경, 카드·다이얼로그·시트 배경 |
| `--color-bg-gray200` | `#FAFAFA` | 검색바, 메뉴 평가 박스 배경 |
| `--color-bg-gray300` | `#F4F4F4` | 섹션 배경 |
| `--color-border-gray100` | `#F5F5F5` | 하단 내비게이션 상단 보더 |
| `--color-border-gray200` | `#EDEDED` | 다이얼로그 버튼 영역 구분선 |
| `--color-border-gray300` | `#E8E8E8` | 입력창(Textbox) 테두리 |
| `--color-border-gray600` | `#AAAAAA` | 아웃라인 버튼 테두리 |
| `--color-bg-dim` | `rgba(0,0,0,0.53)` | 모달/바텀시트 딤 레이어 |
| `--color-bg-toast` | `rgba(0,0,0,0.70)` | 토스트 배경 |

### 1-5. Effect

| 변수 | 값 |
|---|---|
| `--shadow-layer` | `0 1px 8px 0 rgba(0,0,0,0.14)` (Figma `Shadow_Layer`, #00000024) |

> ⚠️ Figma 메모에 `color-border-focus / error / success / warning`, `color-interactive-hover / active / selected / disabled`, `color-text-success / warning / error` 등의 **토큰 이름만 정의되어 있고 값은 아직 없다.** 해당 상태가 필요해지면 값을 디자이너에게 확정받아 이 문서에 추가한 뒤 사용한다. 임시값을 지어내지 않는다.

```css
:root {
  /* brand */
  --color-brand-primary: #050505;
  --color-brand-secondary: #A36502;
  --color-brown600: #BE6307;
  --color-point-primary: #FD0D19;
  --color-brand-expert: #53991D;
  /* black scale */
  --color-text-primary: #000000;
  --color-black800: #242424;
  --color-black600: #303030;
  --color-black400: #373737;
  --color-black300: #4A4A4A;
  --color-black200: #B2B2B2;
  --color-black100: #C6C6C6;
  /* text gray */
  --color-text-gray800: #838383;
  --color-text-secondary: #929292;
  --color-text-disabled1: #CCCCCC;
  --color-text-disabled2: #D6D6D6;
  /* bg / border */
  --color-white: #FFFFFF;
  --color-bg-gray200: #FAFAFA;
  --color-bg-gray300: #F4F4F4;
  --color-border-gray100: #F5F5F5;
  --color-border-gray200: #EDEDED;
  --color-border-gray300: #E8E8E8;
  --color-border-gray600: #AAAAAA;
  --color-bg-dim: rgba(0,0,0,0.53);
  --color-bg-toast: rgba(0,0,0,0.70);
  /* effect */
  --shadow-layer: 0 1px 8px 0 rgba(0,0,0,0.14);
}
```

---

## 2. Typography

- **Font family:** `Pretendard` (fallback: `-apple-system, "Apple SD Gothic Neo", sans-serif`)
- **포인트 라벨 전용:** `Kaushan Script` 15px / 400 (예: `My` + `꿀팁`) — 그 외 사용 금지
- **Weight:** Regular 400 · Medium 500 · SemiBold 600 · Bold 700
- **스타일 이름 규칙(Figma):** `카테고리_크기/굵기_행간%_자간%` 예) `Text_14/R_130_0` = 14px Regular, line-height 1.3, letter-spacing 0
  - 자간 `-2` = `-0.02em`, `1` = `0.01em`

### 2-1. 텍스트 스타일 표

| 역할 | Figma 스타일 | Size | Weight | Line-height | 사용처 |
|---|---|---|---|---|---|
| Title L | `Title_20/SB_100_0` | 20 | 600 | 1 | 프로필 이름 등 큰 제목 |
| Title M (헤더) | `Title_18/B_100_0` | 18 | 700 | 1 | 상단 네비 타이틀("설정") |
| Title M 2줄 | `Title_18/B_140_0` | 18 | 700 | 1.4 | 게시물 제목 |
| Dialog Title | (18 Medium/SemiBold) | 18 | 500 / 600(이름) | 1.5 | 다이얼로그 질문 문구 |
| Sheet Title | — | 19 | 500 (+강조 700) | 1 | 바텀시트 제목 |
| SubTitle 16 | `SubTitle/16_B_100_0` | 16 | 700 | 1 | 섹션 제목(`꿀팁`) |
| SubTitle 15 | `SubTitle/15_B_100_0` | 15 | 700 | 1 | 리스트 소제목("모든 취향콕"), 메뉴명 |
| Body 16 | `Text_16/M_100_0` | 16 | 500 | 1 | 설정 항목, 검색 플레이스홀더 |
| Body 16 Toast | `Text_16/SB_130_0` | 16 | 600 | 1.3 | 토스트 |
| Body 15 | `Text_15/R_140_0` | 15 | 400 | 1.4 | 본문·꿀팁 내용·안내 리스트 |
| Body 14 | `Text_14/R_130_0` | 14 | 400 | 1.3 | 일반 본문, 입력창 |
| Body 14 tight | `Text_14/R_120_0` | 14 | 400 | 1.2 | 카드 제목, 메뉴 코멘트 |
| Body 14 Strong | `Text_14/B_100_0` / `SB_130_0` | 14 | 700 / 600 | 1 / 1.3 | 사용자명 |
| Caption 13 | `Sub_Text/13_M_100_0` | 13 | 500 | 1 | 태그, 위치, 카운트 |
| Caption 12 | `Sub_Text/12_R_140_0` | 12 | 400 | 1.4 | 보조 설명 |
| Caption 12 M | `Sub_Text/12_M_100_0` | 12 | 500 | 1 | 라벨 |
| Caption 11 | `Sub_Text/11_R_100_0` | 11 | 400 | 1 | 카드 카테고리 라벨 |
| Badge | — | 9.5 | 600 | 1 | 전문가 배지 |

### 2-2. 버튼 텍스트

| 스타일 | Size | Weight | 사용처 |
|---|---|---|---|
| `Btn_Text/17_B_100_0` | 17 | 700 | 하단 풀폭 버튼(확인/접수/취소) |
| `Btn_Text/16_M_100_0` | 16 | 500 | 다이얼로그 버튼 |
| `Btn_Text/16_SB_100_0` / `16_B` | 16 | 600 / 700 | 강조 버튼 |
| `Btn_Text/14_B_100_0` | 14 | 700 | 소형 버튼(취향콕) |
| `Btn_Text/13_M_100_0` | 13 | 500 | 아이콘+텍스트 버튼 |

### 2-3. 시스템 토큰 (Figma 메모 기준)

```css
:root {
  --font-family: "Pretendard", -apple-system, "Apple SD Gothic Neo", sans-serif;
  --font-size-heading-lg: 32px;
  --font-size-heading-md: 24px;
  --font-size-body-lg: 18px;
  --font-size-body-md: 16px;
  --font-size-body-sm: 14px;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-lineheight-none: 1;
  --font-lineheight-tight: 1.2;
  --font-lineheight-normal: 1.5;
  --font-lineheight-loose: 1.8;
}
```

> 실제 화면에는 13·15·17·19px 같은 중간 크기도 쓰인다. 위 2-1 표가 **실제 구현 기준**이고, 2-3 토큰은 스케일 정의다. 표에 없는 크기는 쓰지 않는다.

---

## 3. Layout & Spacing

### 3-1. 화면 기준

| 항목 | 값 |
|---|---|
| 디자인 프레임 | **360 × 800** (모바일) |
| 상태바 | 24px |
| 상단 헤더(SubTitle) | 52~58px (좌우 버튼 영역 각 70px, 버튼 높이 40px) |
| 하단 내비게이션 | 58px, 아이콘 34px × 5개, 패딩 `5 14 9`, 상단 1px `--color-border-gray100` |
| 컨테이너 최대 너비 | Figma에 정의 없음 → **모바일 단일 컬럼 기준으로 구현하고 데스크톱에서는 가운데 정렬.** 최대 너비는 디자이너 확인 전까지 360px 비율을 유지한다 |

### 3-2. 좌우 여백 (화면 가장자리)

| 영역 | 좌 / 우 |
|---|---|
| 게시물 텍스트·바텀시트 콘텐츠·하단 버튼 | **24 / 20~24** |
| 리스트·검색바·카드 그리드·메뉴 평가 박스 | **18 / 18** |
| 설정 리스트 | **20 / 20** |
| 게시물 이미지 캐러셀 | 19 (좌측 시작) |

### 3-3. 그리드

- **2열 매스너리 카드 그리드**: 좌우 패딩 18px, 카드 폭 **160px**, 열 간격 **4px**, 카드 세로 간격 **16px**
- 이미지 비율: 세로형 160×190 / 가로형 160×140 / 와이드 160×90 (16:9)
- 게시물 상세 이미지: 322×382, 여러 장일 때 가로 스크롤, 간격 8px

### 3-4. 간격 스케일 (4px 단위)

```css
:root {
  --spacing-xxs: 4px;
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
}
```

자주 쓰이는 조합:
- 텍스트 줄 간 / 배지 간: **4px**
- 아이콘–텍스트, 프로필–이름: **8px**
- 리스트 아이템 간: **12px**, 섹션 내부 블록 간: **16px**
- 섹션 간: **24px**, 설정 그룹 간: **40px**
- 바텀시트: 상단 16 / 하단 32, 블록 gap 16

### 3-5. Radius

```css
:root {
  --radius-none: 0;
  --radius-sm: 4px;    /* 카드 이미지 */
  --radius-md: 8px;    /* 검색바, 메뉴 평가 박스 */
  --radius-lg: 12px;   /* 입력창 */
  --radius-xl: 16px;   /* 바텀시트 상단 */
  --radius-full: 9999px; /* 배지, 칩, 토스트 */
  --radius-btn: 6px;   /* 모든 사각 버튼 (실사용값) */
  --radius-dialog: 18px; /* 다이얼로그 */
}
```

---

## 4. Components Specification

### 4-1. Buttons

| 종류 | 높이 | 배경 | 테두리 | 텍스트 | Radius | 비고 |
|---|---|---|---|---|---|---|
| **Primary (Btn_PageBagic)** | 48~52 | `--color-black400` | 1px 동색 | 17 Bold `--color-white` | 6 | 바텀시트·페이지 하단 확인/접수 |
| **Secondary (취소)** | 48 | `--color-black200` | 1px 동색 | 17 Bold `--color-white` | 6 | Primary와 2개 나란히, gap 16 |
| **Small Filled (Btn_Pic)** | 30 | `--color-black400` | — | 14 Bold white | 6 | 폭 70, 좌우 패딩 16 ("취향콕") |
| **Small Outline** | 30 | `--color-white` | 1px `--color-border-gray600` | 14 Bold `--color-text-gray800` | 6 | 좌우 패딩 7 ("취향콕 취소") |
| **Dialog Button** | 52 | `--color-white` | 상단 1px `--color-border-gray200`, 버튼 사이 1px | 16 Medium | 0 | 취소 = `--color-text-gray800`, 확정 = `--color-point-primary`(파괴적) 또는 `--color-text-primary` |
| **Chip (꿀팁 평가)** | ~28 | 투명 | 1px `--color-black600` | 13 Medium/SemiBold `--color-black600` | full | 패딩 3 8, 아이콘 22 |
| **Icon + Count** | 40 | 투명 | — | 13 Medium `--color-black400` | — | 아이콘 22px, gap 2, 터치영역 py 9 |
| **Tag (#태그)** | 29 | 투명 | — | 13 Medium `--color-black300` + underline | — | 패딩 8 3 |
| **List Action (바텀시트 메뉴)** | 48 | 투명 | — | 16 Medium `--color-text-primary` | — | 좌측 정렬, 좌 24 |
| **Setting Row** | 38 | 투명 | — | 16 Medium + 우측 화살표 16px | — | 행 간 8 |

규칙:
- 버튼 내부 텍스트 행간은 항상 `1`.
- 하단 버튼 2개는 `flex: 1` 균등 분할.
- 최소 터치 영역 40px 이상 확보(아이콘만 있는 버튼은 패딩으로 확장).

### 4-2. Inputs

**Textbox (멀티라인)**
- 테두리 1px `--color-border-gray300`, radius 12, padding 12
- 텍스트 14 Regular, line-height 1.3, 플레이스홀더 `--color-text-disabled1`
- 높이: 신고 사유 124px, 문의 380px

**SearchBar**
- 배경 `--color-bg-gray200`, 테두리 없음, radius 8
- padding `4 8 4 4`, 높이 48
- 검색 아이콘 34px + 플레이스홀더 16 Medium `--color-text-secondary`
- 우측 삭제 버튼 영역 30×40

**Radio (Btn_Radial)** — 24×24, 라벨과 gap 12, 행 높이 48

### 4-3. Cards

**List Post Card (그리드 카드, 폭 160)**
1. 카테고리 라벨: 11 Regular `--color-text-secondary` + 우측 잠금 아이콘 12px (비공개 시)
2. 이미지: radius 4, `object-fit: cover`, 상단 8px 안쪽에 배지 오버레이 (좌: 전문가 마크, 우: 소울/전문가 배지)
3. 제목: 14 Regular, line-height 1.2, 최대 2줄 + 우측 평가 아이콘 16px
- 블록 간 gap 8

**Standard Post (상세)**
- 제목 → 본문(15/1.4) → 이미지 캐러셀 → `My 꿀팁` 리스트 → 메뉴 평가 박스 → 태그/위치 → 기능 버튼
- 꿀팁 리스트: "-" 불릿(17 Bold) + 15 Regular/Bold 혼용, 줄 간 4
- 메뉴 평가 박스: 배경 `--color-bg-gray200`, radius 8, padding `14 12`, 항목 gap 8 / 메뉴명 15 Bold + 평가 아이콘 16, 코멘트 14 Regular `--color-text-gray800`

**Profile List Item (PickRequest)**
- 프로필 이미지 40px 원형 → gap 8 → 이름(14 Bold) + 배지 줄(gap 4, 이름과 간격 7)
- 우측: 메시지 아이콘 버튼 + Small 버튼
- 아이템 간 12

### 4-4. Badges

| 배지 | 높이 | 스타일 |
|---|---|---|
| Soul | 16 | 배경 `rgba(255,255,255,0.7)`, 1px white 테두리, radius full, 아이콘 12 |
| Expert | 16 | 배경 `#F6F6F6`, 1px `#F0F0F0`, radius full, 아이콘 12 + 9.5 SemiBold `--color-brand-expert` |

### 4-5. Overlay

**Dialog (Layer)**
- 딤 `--color-bg-dim` 전체
- 박스 폭 **300**, 화면 중앙, radius 18, 배경 white
- 내용 영역 padding 상하 26, 요소 gap 8, 가운데 정렬 (프로필 46px → 18px 질문 → 보조설명)
- 보조설명과 구분선: 140~210px 가로 라인
- 하단 버튼 영역 52px (4-1 Dialog Button)

**Bottom Sheet**
- 딤 동일, 하단 고정, 상단 radius 16, 배경 white
- 그래버 38×4, `--color-text-disabled2`, radius 2.5, 상단 16
- 패딩 상 16 / 하 32, 콘텐츠 좌 24 우 20
- 제목 19px (강조 단어 Bold + `--color-brand-secondary`)
- 하단 버튼 4-1 Primary/Secondary

**Toast**
- 배경 `--color-bg-toast`, radius full, padding `10 24`
- 텍스트 16 SemiBold white, line-height 1.3, 가운데 정렬
- 하단 내비 위 약 30px 위치

**Popover (말풍선)**
- 폭 244~252, 꼬리 20×13, 그림자 `--shadow-layer`
- 내부 라벨 11~13px, 칩형 키워드 나열

**Loading**
- 121×46 박스, 아이콘 14px + "삭제 중..." 16px

### 4-6. Navigation

**Top Header (SubTitle)** — 좌측 뒤로가기(아이콘 22, 영역 70×40) / 가운데 타이틀 18 Bold / 우측 70×40 (빈 영역도 유지해 타이틀 중앙 정렬)

**Bottom Navigation** — 홈·검색·작성·메시지·마이프로필 5개, 아이콘 34px, `justify-content: space-between`, 활성 상태는 `_On` 아이콘으로 교체(색 변경 아님)

---

## 5. 구현 체크리스트

- [ ] 색·폰트·간격·라운드를 CSS 변수로만 사용했는가
- [ ] Pretendard 외 폰트를 쓰지 않았는가 (`My` 라벨 제외)
- [ ] 버튼 radius 6, 다이얼로그 18, 시트 상단 16을 지켰는가
- [ ] 좌우 여백이 영역별 규칙(24 / 18 / 20)과 일치하는가
- [ ] 파괴적 액션에만 `--color-point-primary`를 썼는가
- [ ] 정의되지 않은 상태 색(focus/error 등)을 임의로 만들지 않았는가
- [ ] 아이콘·이미지는 Figma 원본 에셋을 그대로 썼는가 (다시 그리지 않음)
