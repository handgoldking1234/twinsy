-- =========================================================
-- Twinsy 초기 스키마
-- 앱 화면(src/screens)과 알고리즘(src/algorithm)이 쓰는 데이터 구조 그대로.
-- 실행: supabase db push  (또는 SQL Editor에 붙여 넣기)
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- 회원 ----------
create table public.profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_id       uuid unique references auth.users(id) on delete set null, -- 로그인 계정 (예시 회원은 null)
  name          text not null unique,
  avatar_url    text,
  bio           text,
  expert_topics text[] not null default '{}',    -- 전문가 배지 주제
  expert_label  text,
  is_private    boolean not null default false,  -- 비공개 계정: 취향메이트에게만 게시물 공개
  disabled_at   timestamptz,                     -- 비활성화 (매월 1일 기준 3회까지)
  disable_count_month int not null default 0,
  created_at    timestamptz not null default now()
);

-- 주제별 세부 취향 (취향 테스트 + 본인 게시물 취향 + 투표 답변 + 위치 인증 평가가 합쳐진 값)
create table public.taste (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  topic      text not null,
  feature    text not null,
  value      real not null check (value between -1 and 1),
  updated_at timestamptz not null default now(),
  primary key (profile_id, topic, feature)
);

-- 위치 인증 방문 평가 (콘텐츠 작성 없이 취향·평가 데이터에 반영)
create table public.visits (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  place_id   text not null,
  rating     smallint not null check (rating in (-1, 1)),
  verified_at timestamptz not null default now(),
  primary key (profile_id, place_id)
);

-- 취향콕(팔로잉)
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- ---------- 게시물 ----------
create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  topic       text not null,
  kind        text not null check (kind in ('normal', 'honey')), -- 일반(500자) / 꿀단지
  title       text not null,
  body        text check (char_length(body) <= 2000),
  images      jsonb not null default '[]',   -- [{src, alt}]
  tips        jsonb,                          -- My 꿀팁 [{text, strong, after}]
  points      jsonb,                          -- 핵심 Point [{title, lines[]}]
  menus       jsonb,                          -- 메뉴 평가 [{name, comment, best}]
  tags        text[] not null default '{}',
  keywords    text[] not null default '{}',
  location    text,
  taste_tags  jsonb not null default '{}',   -- 게시물이 드러내는 취향 → 신뢰도 판단
  pros        text[] not null default '{}',  -- AI 요약 재료
  cons        text[] not null default '{}',
  is_private  boolean not null default false,
  deleted_at  timestamptz,                    -- 삭제 후 15일 보관
  created_at  timestamptz not null default now()
);
create index posts_feed_idx on public.posts (created_at desc) where deleted_at is null;
create index posts_topic_idx on public.posts (topic, created_at desc);
create index posts_keywords_idx on public.posts using gin (keywords);

-- 반응·행동 지표 (랭킹 입력값)
create table public.post_metrics (
  post_id          uuid primary key references public.posts(id) on delete cascade,
  honey            int not null default 0, -- 꿀팁(유용성 평가) 수
  views            int not null default 0,
  views_last_hour  int not null default 0,
  views_prev_hour  int not null default 0,
  comments         int not null default 0,
  dwell            real not null default 0, -- 평균 체류 시간(초)
  saves            int not null default 0,
  shares           int not null default 0,
  updated_at       timestamptz not null default now()
);

create table public.reactions (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  kind       text not null check (kind in ('honey', 'save', 'share')),
  created_at timestamptz not null default now(),
  primary key (profile_id, post_id, kind)
);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  text       text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);

-- 노출 기록: 검색 결과 1인 3회 제한, 최소 노출 수, 샘플 그룹 반응률
create table public.impressions (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  context    text not null check (context in ('feed', 'search', 'top5')),
  count      int not null default 1,
  last_at    timestamptz not null default now(),
  primary key (profile_id, post_id, context)
);

-- 조회 기록 → 시간대별 조회수
create table public.views (
  id         bigint generated always as identity primary key,
  post_id    uuid not null references public.posts(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  dwell      real,
  at         timestamptz not null default now()
);
create index views_post_at_idx on public.views (post_id, at desc);

-- 검색 로그 (급상승 키워드)
create table public.search_logs (
  id         bigint generated always as identity primary key,
  profile_id uuid references public.profiles(id) on delete set null,
  keyword    text not null,
  is_bot     boolean not null default false,
  is_ad      boolean not null default false,
  at         timestamptz not null default now()
);
create index search_logs_at_idx on public.search_logs (at desc);

-- ---------- 알고리즘 계산 결과 (엣지 함수가 주기적으로 채움) ----------
create table public.peer_cache (
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  topic       text not null,
  peer_id     uuid not null references public.profiles(id) on delete cascade,
  similarity  real not null,
  computed_at timestamptz not null default now(),
  primary key (profile_id, topic, peer_id)
);

create table public.trust_cache (
  profile_id       uuid primary key references public.profiles(id) on delete cascade,
  total            int not null default 0,
  by_topic         jsonb not null default '{}',
  level            text not null default 'ok' check (level in ('ok', 'notice', 'warning', 'restricted')),
  restricted_until timestamptz,
  computed_at      timestamptz not null default now()
);

create table public.top5_snapshots (
  hour       timestamptz not null,     -- 1시간 단위 갱신 시각
  rank       smallint not null check (rank between 1 and 5),
  keyword    text not null,
  change     real not null,
  post_ids   uuid[] not null default '{}', -- 키워드별 꿀단지 5개
  criteria   text[] not null default '{}', -- 'A' | 'B'
  primary key (hour, rank)
);

-- ---------- 투표 ----------
create table public.votes (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  question   text not null,
  images     text[] not null default '{}',
  is_live    boolean not null default false,  -- 실시간 Live 투표 (출시 6개월 후)
  ends_at    timestamptz,
  created_at timestamptz not null default now()
);
create table public.vote_options (
  id      uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes(id) on delete cascade,
  label   text not null,
  ai_generated boolean not null default false,
  sort    smallint not null default 0
);
create table public.vote_ballots (
  vote_id    uuid not null references public.votes(id) on delete cascade,
  option_id  uuid not null references public.vote_options(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (vote_id, profile_id)
);

-- ---------- 메시지 ----------
create table public.chats (
  id         uuid primary key default gen_random_uuid(),
  a_id       uuid not null references public.profiles(id) on delete cascade,
  b_id       uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (a_id, b_id)
);
create table public.messages (
  id         bigint generated always as identity primary key,
  chat_id    uuid not null references public.chats(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  text       text not null check (char_length(text) between 1 and 2000),
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- 챌린지 · 포인트 (출시 6개월 후) ----------
create table public.challenges (
  id      uuid primary key default gen_random_uuid(),
  title   text not null,
  descr   text,
  goal    int not null,
  reward  int not null,
  ends_at timestamptz not null
);
create table public.challenge_participants (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  progress     int not null default 0,
  joined_at    timestamptz not null default now(),
  primary key (challenge_id, profile_id)
);
create table public.points_ledger (
  id         bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount     int not null,
  reason     text not null, -- 'reward_ad' | 'challenge' | 'redeem'
  created_at timestamptz not null default now()
);

-- ---------- 고객지원 ----------
create table public.inquiries (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  subject    text not null default '계정 이용 제한 검토 요청',
  text       text not null,
  created_at timestamptz not null default now()
);
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_id   uuid not null references public.profiles(id) on delete cascade,
  reason      text not null,
  memo        text,
  created_at  timestamptz not null default now()
);
create table public.data_exports (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'requested' check (status in ('requested', 'ready', 'expired')),
  file_url    text,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- =========================================================
-- 트리거: 반응·댓글이 생기면 지표 갱신
-- =========================================================
create or replace function public.bump_metrics() returns trigger language plpgsql security definer as $$
begin
  insert into public.post_metrics (post_id) values (coalesce(new.post_id, old.post_id)) on conflict do nothing;
  if tg_table_name = 'reactions' then
    update public.post_metrics set
      honey  = honey  + case when new.kind = 'honey' then 1 else 0 end,
      saves  = saves  + case when new.kind = 'save'  then 1 else 0 end,
      shares = shares + case when new.kind = 'share' then 1 else 0 end,
      updated_at = now()
    where post_id = new.post_id;
  elsif tg_table_name = 'comments' then
    update public.post_metrics set comments = comments + 1, updated_at = now() where post_id = new.post_id;
  elsif tg_table_name = 'views' then
    update public.post_metrics set views = views + 1, updated_at = now() where post_id = new.post_id;
  end if;
  return new;
end $$;

create trigger reactions_metrics after insert on public.reactions for each row execute function public.bump_metrics();
create trigger comments_metrics  after insert on public.comments  for each row execute function public.bump_metrics();
create trigger views_metrics     after insert on public.views     for each row execute function public.bump_metrics();

create or replace function public.init_metrics() returns trigger language plpgsql security definer as $$
begin
  insert into public.post_metrics (post_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger posts_init_metrics after insert on public.posts for each row execute function public.init_metrics();

-- 1시간 단위 조회수 롤업 (refresh-top5 함수가 먼저 호출)
create or replace function public.roll_hourly_views() returns void language sql security definer as $$
  update public.post_metrics m set
    views_prev_hour = coalesce((select count(*) from public.views v where v.post_id = m.post_id and v.at >= now() - interval '2 hours' and v.at < now() - interval '1 hour'), 0),
    views_last_hour = coalesce((select count(*) from public.views v where v.post_id = m.post_id and v.at >= now() - interval '1 hour'), 0),
    dwell = coalesce((select avg(v.dwell) from public.views v where v.post_id = m.post_id and v.dwell is not null), m.dwell),
    updated_at = now();
$$;

-- 검색 결과 노출 기록 (1인 3회 제한용)
create or replace function public.record_impressions(p_post_ids uuid[], p_context text) returns void language sql security definer as $$
  insert into public.impressions (profile_id, post_id, context)
  select (select id from public.profiles where auth_id = auth.uid()), unnest(p_post_ids), p_context
  on conflict (profile_id, post_id, context) do update set count = impressions.count + 1, last_at = now();
$$;

-- =========================================================
-- RLS
-- =========================================================
create or replace function public.my_profile_id() returns uuid language sql stable security definer as $$
  select id from public.profiles where auth_id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.taste enable row level security;
alter table public.visits enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.posts enable row level security;
alter table public.post_metrics enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.impressions enable row level security;
alter table public.views enable row level security;
alter table public.search_logs enable row level security;
alter table public.peer_cache enable row level security;
alter table public.trust_cache enable row level security;
alter table public.top5_snapshots enable row level security;
alter table public.votes enable row level security;
alter table public.vote_options enable row level security;
alter table public.vote_ballots enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.points_ledger enable row level security;
alter table public.inquiries enable row level security;
alter table public.reports enable row level security;
alter table public.data_exports enable row level security;

-- 공개 읽기
create policy "read profiles" on public.profiles for select using (true);
create policy "read taste" on public.taste for select using (true);       -- 유사율 계산·소울 말풍선
create policy "read visits" on public.visits for select using (true);
create policy "read follows" on public.follows for select using (true);
create policy "read metrics" on public.post_metrics for select using (true);
create policy "read comments" on public.comments for select using (true);
create policy "read peer cache" on public.peer_cache for select using (profile_id = public.my_profile_id());
create policy "read trust" on public.trust_cache for select using (true);
create policy "read top5" on public.top5_snapshots for select using (true);
create policy "read votes" on public.votes for select using (true);
create policy "read vote options" on public.vote_options for select using (true);
create policy "read ballots" on public.vote_ballots for select using (true);
create policy "read challenges" on public.challenges for select using (true);

-- 게시물: 삭제·비공개·차단·비공개 계정 처리
create policy "read posts" on public.posts for select using (
  deleted_at is null
  and (
    author_id = public.my_profile_id()
    or (
      not is_private
      and not exists (select 1 from public.blocks b where (b.blocker_id = public.my_profile_id() and b.blocked_id = posts.author_id)
                                                     or (b.blocker_id = posts.author_id and b.blocked_id = public.my_profile_id()))
      and (
        not (select p.is_private from public.profiles p where p.id = posts.author_id)
        or exists (select 1 from public.follows f where f.follower_id = posts.author_id and f.followee_id = public.my_profile_id())
      )
    )
  )
);

-- 본인 데이터 쓰기
create policy "own profile" on public.profiles for update using (auth_id = auth.uid());
create policy "create own profile" on public.profiles for insert with check (auth_id = auth.uid());
create policy "own taste" on public.taste for all using (profile_id = public.my_profile_id()) with check (profile_id = public.my_profile_id());
create policy "own visits" on public.visits for all using (profile_id = public.my_profile_id()) with check (profile_id = public.my_profile_id());
create policy "own follows" on public.follows for all using (follower_id = public.my_profile_id()) with check (follower_id = public.my_profile_id());
create policy "own blocks" on public.blocks for all using (blocker_id = public.my_profile_id()) with check (blocker_id = public.my_profile_id());
create policy "own posts" on public.posts for all using (author_id = public.my_profile_id()) with check (author_id = public.my_profile_id());
create policy "own reactions" on public.reactions for all using (profile_id = public.my_profile_id()) with check (profile_id = public.my_profile_id());
create policy "write comments" on public.comments for insert with check (profile_id = public.my_profile_id());
create policy "own comments" on public.comments for delete using (profile_id = public.my_profile_id());
create policy "own impressions" on public.impressions for select using (profile_id = public.my_profile_id());
create policy "write views" on public.views for insert with check (profile_id = public.my_profile_id() or profile_id is null);
create policy "write search logs" on public.search_logs for insert with check (profile_id = public.my_profile_id() or profile_id is null);
create policy "own votes" on public.votes for insert with check (author_id = public.my_profile_id());
create policy "own vote options" on public.vote_options for insert with check (exists (select 1 from public.votes v where v.id = vote_id and v.author_id = public.my_profile_id()));
create policy "cast ballot" on public.vote_ballots for insert with check (profile_id = public.my_profile_id());
create policy "my chats" on public.chats for all using (public.my_profile_id() in (a_id, b_id)) with check (public.my_profile_id() in (a_id, b_id));
create policy "my messages" on public.messages for select using (exists (select 1 from public.chats c where c.id = chat_id and public.my_profile_id() in (c.a_id, c.b_id)));
create policy "send messages" on public.messages for insert with check (sender_id = public.my_profile_id());
create policy "join challenge" on public.challenge_participants for all using (profile_id = public.my_profile_id()) with check (profile_id = public.my_profile_id());
create policy "my points" on public.points_ledger for select using (profile_id = public.my_profile_id());
create policy "send inquiry" on public.inquiries for insert with check (profile_id = public.my_profile_id());
create policy "send report" on public.reports for insert with check (reporter_id = public.my_profile_id());
create policy "my exports" on public.data_exports for all using (profile_id = public.my_profile_id()) with check (profile_id = public.my_profile_id());

-- 실시간 Live 투표
alter publication supabase_realtime add table public.vote_ballots;
alter publication supabase_realtime add table public.messages;
