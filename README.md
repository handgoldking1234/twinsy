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
| 시작 | 취향 테스트(콜드 스타트) | `#onboarding` |
| 개발 확인 | 유사율·신뢰도·급상승 키워드 표 | `#algo` |

게시물 더보기(⋮) → 프로필 공유 / 메시지 / 취향콕 취소 / 차단 다이얼로그 / 신고 바텀시트.

## 알고리즘 (`src/algorithm`)
| 파일 | 내용 |
|---|---|
| `taste.ts` | 주제별 유사율(설문 코사인 + 세부 취향 ±5 + 방문 평가 ±5), 상위 20% 유사취향자, 계정 신뢰도(-3 안내 · -6 경고 · -10 한 달 노출 제한, 꿀팁 100개 이상이면 감점 없음) |
| `ranking.ts` | 최신성 e^(−0.00002·분), A·B·C·D 가중치 표, 후보 내 최댓값 정규화, 트렌드용 반응 점수 |
| `feed.ts` | 취향콕 탭(팔로잉 최신순), 추천 탭(유사취향자 4 + 전체 2, 일반 60 : 꿀단지 40, 최신순 48h · 트렌드순 일반 49~120h / 꿀단지 49~168h, 취향 무관 주제는 전체 회원만) |
| `search.ts` | 급상승 키워드(변화율 50 · 검색량 30 · 시간 20, 봇·광고·반복 제외), Top5(1~2위 A기준·맨 앞 3회 제한, 3~5위 B기준·직전 노출 배제), 일반 검색(유사 40 · 전문가 40 · 일반 20 + 대체 규칙, 꿀단지 60, C3 + D1, 1인 3회 노출 제한) |

문서와 다르게 해석한 부분
- 정규화 식 `1 − A / max(A)`는 반응이 많을수록 점수가 낮아지므로 `A / max(A)`로 구현.
- Top5의 5번째 자리는 기준이 없어 3~4번째와 같은 B 기준으로 채움.
- AI 요약은 검색 결과 게시물의 장점·단점·팁 데이터를 모아 보여 주는 예시(실제 LLM 연결 전).

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
