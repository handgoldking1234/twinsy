/**
 * 스키마·시드 SQL 검증 — 실제 Postgres(PGlite)에 마이그레이션과 seed.sql을 돌려 본다.
 *   npm run db:check
 * Supabase 전용 객체(auth.users, auth.uid(), supabase_realtime)는 간단한 대체물로 만든다.
 * pg_cron 일정(…_schedules.sql)은 PGlite에 확장이 없어 제외한다.
 */
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const db = new PGlite({ extensions: { pgcrypto } });
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  create role anon; create role authenticated;
  create publication supabase_realtime;
`);
await db.exec(read('supabase/migrations/20261104000000_init.sql'));
await db.exec(read('supabase/seed.sql'));

const count = async (t: string) => (await db.query<{ n: number }>(`select count(*)::int n from public.${t}`)).rows[0].n;
for (const t of ['profiles', 'taste', 'posts', 'post_metrics', 'search_logs', 'votes', 'vote_options', 'messages', 'challenges'])
  console.log(t.padEnd(14), await count(t));

// 트리거 확인: 댓글을 달면 comments 지표가 1 오른다
const post = (await db.query<{ id: string; c: number }>(`select p.id, m.comments c from public.posts p join public.post_metrics m on m.post_id = p.id limit 1`)).rows[0];
const author = (await db.query<{ id: string }>(`select id from public.profiles limit 1`)).rows[0];
await db.query(`insert into public.comments (post_id, profile_id, text) values ($1, $2, '좋아요')`, [post.id, author.id]);
const after = (await db.query<{ c: number }>(`select comments c from public.post_metrics where post_id = $1`, [post.id])).rows[0].c;
if (after !== post.c + 1) throw new Error('댓글 트리거가 지표를 올리지 않았습니다');
await db.query(`select public.roll_hourly_views()`);
console.log('트리거·함수 OK');
