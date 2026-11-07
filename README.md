# Twinsy — React (Vite + TypeScript)

DESIGN.md 규칙을 따르는 트윈지 앱 화면과, 기획 문서의 추천·검색 알고리즘 구현.

## 실행
```bash
npm install
npm run dev     # 화면 확인
npm test        # 알고리즘 테스트 (vitest)
```
PC 화면에서는 왼쪽에 화면 목록과 **알고리즘 점수 보기** 스위치가 있다. 켜면 게시물마다 노출 근거(유사취향자/전체 회원, 유사율, 기준, 점수)가 표시된다.

## 화면
| 그룹 | 화면 | URL |
|---|---|---|
| 메인 | Main_01_1 취향콕 피드 · 01_2 추천 피드 · 01_3 관심콕 주제 선택 · 01_4 빈 상태 | `#main-pick` `#main-recommend` `#topic-sheet` `#main-empty` |
| 알림 | Main_01_5-1 알림 · 5-2 취향콕 요청 | `#noti` `#pick-requests` |
| 이벤트 | Main_01_6-1 목록 · 6-2 상세 | `#events` `#event-detail` |
| 검색 | 실시간 꿀팁 검색 Top5 · 일반 검색 + AI 요약 · 투표 | `#search` `#vote` |
| 게시물 | 상세(댓글) · 작성(일반/꿀단지, 취향 불일치 안내) | `#post-detail` `#write` |
| 메시지 | 목록 · 대화방 | `#messages` `#chat` |
| 마이 | 프로필 · 취향콕 목록/추천 · 설정 | `#profile` `#pick-list` `#settings` |
| 마이 | 차단 목록(차단 해제) | `#blocked` |
| 시작 | 로그인·휴대폰 인증(인증번호 도움말) · 취향 테스트(콜드 스타트) | `#login` `#onboarding` |
| 6개월 후 | 챌린지·리워드 광고(피드 6개마다 광고 카드) · 실시간 Live 투표 | `#challenge` `#live-vote` |
| 개발 확인 | 유사율·신뢰도·노출 단계·급상승 키워드 표 | `#algo` |

게시물 더보기(⋮) → 프로필 공유 / 메시지 / 취향콕 취소 / 차단(+차단 완료) / 신고 바텀시트.
내 게시물 더보기 → 수정 / 공개·비공개 / 삭제(15일 보관 안내 → 삭제 중 로딩).
설정 → 공개 범위·비활성화·계정 삭제·데이터 다운로드(기간 만료)·문의 시트·로그아웃. 소울 배지를 누르면 그 사람의 세부 취향 말풍선.

## 알고리즘 (`src/algorithm`)
| 파일 | 내용 |
|---|---|
| `taste.ts` | 주제별 유사율(설문 코사인 + 세부 취향 ±5 + 방문 평가 ±5), 상위 20% 유사취향자, 계정 신뢰도(-3 안내 · -6 경고 · -10 한 달 노출 제한 후 자동 해제, 꿀팁 100개 이상이면 감점 없음) |
| `ranking.ts` | 최신성 e^(−0.00002·분), A·B·C·D 가중치 표, 후보 내 최댓값 정규화, 트렌드용 반응 점수 |
| `feed.ts` | 취향콕 탭(팔로잉 최신순), 추천 탭(유사취향자 4 + 전체 2, 일반 60 : 꿀단지 40, 최신순 48h · 트렌드순 일반 49~120h / 꿀단지 49~168h, 취향 무관 주제는 전체 회원만) |
| `exposure.ts` | 게시물당 최소 노출 수(초기 유사취향자 전원 → DAU 1,000명부터 DAU 7%), 샘플 그룹(DAU 1%, 30~300명) 반응률 5% 이상이면 전체 회원으로 확장, 최소 노출 미달 게시물 최신순 끌어올림 |
| `search.ts` | 급상승 키워드(변화율 50 · 검색량 30 · 시간 20, 봇·광고·반복 제외), Top5(1~2위 A기준·맨 앞 3회 제한, 3~5위 B기준·직전 노출 배제), 일반 검색(유사 40 · 전문가 40 · 일반 20 + 대체 규칙, 꿀단지 60, C3 + D1, 1인 3회 노출 제한) |

문서와 다르게 해석한 부분
- 정규화 식 `1 − A / max(A)`는 반응이 많을수록 점수가 낮아지므로 `A / max(A)`로 구현.
- Top5의 5번째 자리는 기준이 없어 3~4번째와 같은 B 기준으로 채움.
- AI 요약·투표 보기는 서버 연결 시 Claude API(엣지 함수)로, 연결 전에는 게시물 데이터를 모은 예시로 동작.
- 최소 노출 7%·샘플 그룹 1%(30~300명)·확장 반응률 5%·DAU 1,000명 전환점은 문서의 예시 수치를 바탕으로 정한 값 — `exposure.ts` 상단 상수로 조정.

## 서버 (`supabase/`)
- `migrations/…_init.sql` — 회원·취향·방문 평가·취향콕·게시물·지표·노출·검색 로그·투표·메시지·챌린지·포인트·문의·신고 테이블, 지표 트리거, RLS(비공개·차단 반영)
- `migrations/…_schedules.sql` — pg_cron: Top5 매시, 유사취향자·신뢰도 매일, 삭제 게시물 15일 후 정리
- `functions/` — `refresh-top5`, `recompute-peers`, `ai-summary`, `ai-vote-options` (알고리즘은 `npm run functions:sync`로 같은 코드를 공유)
- `seed.sql` — 예시 데이터 (`npm run seed:gen`)

`.env`에 Supabase 값이 없으면 예시 데이터, 있으면 서버 데이터를 읽는다. 배포 순서는 [DEPLOY.md](DEPLOY.md).

| 명령 | 내용 |
|---|---|
| `npm test` | 알고리즘 테스트 23건 |
| `npm run db:check` | 스키마·시드를 PGlite(Postgres)에서 실행 검증 |
| `npm run seed:gen` | world.ts → seed.sql |
| `npm run functions:sync` | 알고리즘 → 엣지 함수 공유 폴더 |

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

## 교체 필요
- 아이콘·로고: 대체 아이콘(`src/components/Icon.tsx`) → Figma 원본 SVG로 교체.
- 예시 데이터(`src/data/world.ts`)는 Supabase 등 실제 데이터로 교체. 알고리즘 모듈은 그대로 재사용.

## 이어서 작업하기
결정사항·코드 지도·수정 방법은 [CLAUDE.md](CLAUDE.md), 전체 프로젝트 목록은 [IUX 프로젝트 목록](https://github.com/handgoldking1234/iux-app/blob/main/docs/PROJECTS.md)에 있습니다.
