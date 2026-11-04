# Twinsy 배포 가이드

서버를 연결하기 전에도 앱은 `src/data/world.ts` 예시 데이터로 모든 화면이 동작한다.
아래 순서대로 연결하면 같은 화면이 실제 데이터로 바뀐다.

## 1. Vercel — 화면 배포 (5분)
1. vercel.com → **Add New › Project** → GitHub `handgoldking1234/twinsy` 선택
2. Framework는 Vite로 자동 인식된다 (`vercel.json`에 빌드 설정 포함). **Deploy**
3. Supabase를 연결한 뒤에는 **Settings › Environment Variables**에 아래 두 값을 넣고 다시 배포
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 2. Supabase — 데이터·로그인·주기 작업
```bash
npm i -g supabase
supabase login
supabase link --project-ref <프로젝트 ref>

# 스키마 + 주기 작업
supabase db push

# 예시 데이터 넣기 (선택) — world.ts 를 바꿨다면 먼저 npm run seed:gen
psql "$(supabase db url)" -f supabase/seed.sql
```
- **휴대폰 인증**: Dashboard › Authentication › Providers › Phone 켜고 SMS 제공자(Twilio 등) 키 입력
- **주기 작업 시크릿**: SQL Editor에서
  ```sql
  select vault.create_secret('https://<ref>.supabase.co', 'project_url');
  select vault.create_secret('<service_role 키>', 'service_role_key');
  ```
  → 매시 정각 `refresh-top5`, 매일 04:10 `recompute-peers`, 04:30 삭제 게시물 정리가 돈다.

## 3. 엣지 함수 — 알고리즘 서버 작업 + AI
```bash
npm run functions:sync          # src/algorithm → supabase/functions/_shared/algorithm
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy refresh-top5
supabase functions deploy recompute-peers
supabase functions deploy ai-summary
supabase functions deploy ai-vote-options
```
| 함수 | 하는 일 | 호출 |
|---|---|---|
| `refresh-top5` | 시간대별 조회수 롤업 → 급상승 키워드 5개 → 키워드별 꿀단지 5개(A/B 기준, 노출 이력 반영) → `top5_snapshots` | pg_cron 매시 |
| `recompute-peers` | 주제별 유사취향자 상위 20% → `peer_cache`, 계정 신뢰도 → `trust_cache` | pg_cron 매일 |
| `ai-summary` | 검색 결과 게시물을 장점·단점·팁·평가로 요약 | 검색 화면 |
| `ai-vote-options` | 투표 질문으로 객관식 보기 3~4개 생성 | 투표 만들기 |

## 4. 확인
```bash
npm test            # 알고리즘 테스트
npm run db:check    # 스키마·시드를 PGlite(Postgres)에 실제로 돌려 검증
```
앱 왼쪽 화면 목록 위에 `데이터: Supabase 서버`가 보이면 연결 성공.
