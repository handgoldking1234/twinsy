# Twinsy (트윈지) — 작업 안내서

## 한 줄 요약
취향 기반 AI 소셜 큐레이션 모바일 앱. Figma 시안을 웹 React(Vite + TypeScript)로 구현하고, 기획서의 추천·검색 알고리즘을 코드로 만듦.

## 먼저 읽을 문서
- `DESIGN.md` — 화면 디자인 규칙 (색·간격·컴포넌트). 화면을 고칠 때 기준
- `README.md` — 실행, 화면 목록(URL 해시), 알고리즘 설명
- `DEPLOY.md` — Vercel·Supabase 배포

## 확정된 결정
| 항목 | 결정 |
|---|---|
| 구현 | HTML 퍼블리싱 없이 바로 React(웹) |
| 배포 | Vercel 연결됨 |
| 백엔드 | Supabase (마이그레이션·Edge Function 준비됨, 연결 예정) |
| 알고리즘 | 화면용 `src/algorithm/`과 서버용 `supabase/functions/_shared/algorithm/`이 **같은 코드** → `scripts/sync-functions.mjs`로 맞춤 |

## 파일
```
src/screens/      화면 (Main, Search, Post, Profile, Auth, Event, Notice, Extra, Algo)
src/components/   공통 컴포넌트 (PostCard, Icon, overlays, ui)
src/algorithm/    취향 유사도·피드·노출·랭킹·검색 (+ algorithm.test.ts)
src/data/         목업 세계(world.ts), 저장소(repo.ts), 상태(store.tsx)
src/lib/supabase.ts
src/styles/tokens.css, components.css
supabase/migrations/, supabase/functions/(ai-summary, ai-vote-options, recompute-peers, refresh-top5), seed.sql
scripts/gen-seed.ts, check-sql.ts, sync-functions.mjs
.env.example      필요한 환경 변수 이름 (값은 .env.local, 커밋 금지)
```

## 확인
```
npm install
npm run dev     # 화면
npm test        # 알고리즘 테스트 (vitest)
```
PC 화면 왼쪽의 "알고리즘 점수 보기" 스위치로 노출 근거 확인.

---

## 공통 작업 원칙 (IUX 프로젝트 전체)
- **언어:** 화면 문구·문서·커밋 메시지는 한국어. 쉬운 말, 기술 용어 최소화.
- **퍼블리싱 시안:** 순수 HTML/CSS + 간단한 스크립트만 넣는다. 서버·DB 연동 코드는 개발 단계에서 따로 붙인다.
- **아이콘:** Lucide. 디자인 시스템을 따로 정하지 않았으면 스포티파이 스타일(다크/화이트 + 포인트 컬러)을 기본으로 쓴다.
- **배포:** GitHub `main` → Vercel 자동 배포. 도메인은 가비아 `iux.kr`의 서브도메인(`*.iux.kr` CNAME → Vercel)을 쓴다.
- **DB:** Supabase 무료 플랜은 활성 프로젝트 2개까지라, 새 프로젝트를 만들지 말고 기존 `iux-cloud`(studio) 프로젝트에 테이블을 얹는 것을 먼저 검토한다.
- **비밀값:** 공개 저장소다. 서비스 키·AI 키·비밀번호는 절대 커밋하지 않는다. 키는 Vercel 환경 변수나 Supabase secrets에 둔다. Supabase anon(public) 키만 코드에 넣을 수 있다.
- **확인:** 고친 뒤에는 브라우저 콘솔 오류 0개, 모바일(390px)과 PC 화면을 눈으로 확인하고 나서 완료라고 한다.
- **브랜치:** `main`은 배포 중인 상태. 큰 작업이나 검증 전 작업은 브랜치(`wip/…`, `claude/…`)에 올리고, `main`을 강제 푸시(-f)로 덮어쓰지 않는다.
- **전체 프로젝트 목록:** https://github.com/handgoldking1234/iux-app/blob/main/docs/PROJECTS.md
