/**
 * src/data/world.ts 예시 데이터를 supabase/seed.sql 로 변환한다.
 *   npm run seed:gen
 * 문자열 id는 md5(id)::uuid 로 바꿔 항상 같은 uuid가 나오게 한다.
 */
import { writeFileSync } from 'node:fs';
import { CHATS, NOW, POSTS, SEARCH_LOGS, USERS, VOTES } from '../src/data/world';

const q = (v: unknown): string => {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return `'${String(v).replace(/'/g, "''")}'`;
};
const uid = (id: string) => `md5(${q(id)})::uuid`;
const arr = (xs: string[]) => `array[${xs.map(q).join(',')}]::text[]`;
const json = (v: unknown) => (v === undefined ? 'null' : `${q(JSON.stringify(v))}::jsonb`);
// 고정 시각 NOW 기준 상대 시간을 실제 now() 기준으로 옮겨, 언제 시드해도 최신순·트렌드순 창에 들어가게 한다
const at = (t: number) => `now() - interval '${Math.round((NOW - t) / 60_000)} minutes'`;

const out: string[] = ['-- 자동 생성: npm run seed:gen', 'begin;'];

for (const u of USERS) {
  out.push(
    `insert into public.profiles (id, name, avatar_url, bio, expert_topics, expert_label) values (${uid(u.id)}, ${q(u.name)}, ${q(u.avatar)}, ${q(u.bio)}, ${arr(u.expertTopics)}, ${q(u.expertLabel)}) on conflict (id) do nothing;`,
  );
  for (const [topic, vec] of Object.entries(u.taste))
    for (const [feature, value] of Object.entries(vec))
      out.push(`insert into public.taste values (${uid(u.id)}, ${q(topic)}, ${q(feature)}, ${value}, now()) on conflict do nothing;`);
  for (const [place, rating] of Object.entries(u.visits))
    out.push(`insert into public.visits values (${uid(u.id)}, ${q(place)}, ${rating}, now()) on conflict do nothing;`);
}
for (const u of USERS)
  for (const f of u.follows) out.push(`insert into public.follows values (${uid(u.id)}, ${uid(f)}, now()) on conflict do nothing;`);

for (const p of POSTS) {
  out.push(
    `insert into public.posts (id, author_id, topic, kind, title, body, images, tips, points, menus, tags, keywords, location, taste_tags, pros, cons, created_at) values (` +
      [uid(p.id), uid(p.authorId), q(p.topic), q(p.kind), q(p.title), q(p.body), json(p.images), json(p.tips), json(p.points), json(p.menus), arr(p.tags), arr(p.keywords), q(p.location), json(p.tasteTags), arr(p.pros ?? []), arr(p.cons ?? []), at(p.createdAt)].join(', ') +
      `) on conflict (id) do nothing;`,
  );
  const m = p.metrics;
  out.push(
    `insert into public.post_metrics (post_id, honey, views, views_last_hour, views_prev_hour, comments, dwell, saves, shares) values (${uid(p.id)}, ${m.honey}, ${m.views}, ${m.viewsLastHour}, ${m.viewsPrevHour}, ${m.comments}, ${m.dwell}, ${m.saves}, ${m.shares}) on conflict (post_id) do update set honey = excluded.honey, views = excluded.views, views_last_hour = excluded.views_last_hour, views_prev_hour = excluded.views_prev_hour, comments = excluded.comments, dwell = excluded.dwell, saves = excluded.saves, shares = excluded.shares;`,
  );
}

for (const l of SEARCH_LOGS)
  out.push(`insert into public.search_logs (keyword, is_bot, is_ad, at) values (${q(l.keyword)}, ${q(Boolean(l.isBot))}, ${q(Boolean(l.isAd))}, ${at(l.at)});`);

for (const v of VOTES) {
  out.push(`insert into public.votes (id, author_id, question, images) values (${uid(v.id)}, ${uid(v.authorId)}, ${q(v.question)}, ${arr(v.images)}) on conflict do nothing;`);
  v.options.forEach((o, i) =>
    out.push(`insert into public.vote_options (id, vote_id, label, ai_generated, sort) values (${uid(v.id + o.id)}, ${uid(v.id)}, ${q(o.label)}, true, ${i}) on conflict do nothing;`),
  );
}

for (const c of CHATS) {
  out.push(`insert into public.chats (id, a_id, b_id) values (${uid(c.id)}, ${uid('goldking')}, ${uid(c.userId)}) on conflict do nothing;`);
  for (const m of c.messages)
    out.push(`insert into public.messages (chat_id, sender_id, text) values (${uid(c.id)}, ${uid(m.mine ? 'goldking' : c.userId)}, ${q(m.text)});`);
}

out.push(
  `insert into public.challenges (title, descr, goal, reward, ends_at) values` +
    ` ('동네 맛집 방문 인증 5곳', '위치 인증 평가만 남기면 돼요', 5, 500, now() + interval '6 days'),` +
    ` ('이번 주 꿀단지 1개 올리기', '사진과 핵심 Point 3개 이상', 1, 1000, now() + interval '3 days'),` +
    ` ('유사취향자 글에 꿀팁 평가 10번', '좋아요 대신 유용성으로 평가', 10, 300, now() + interval '1 day');`,
);
out.push('commit;');

writeFileSync(new URL('../supabase/seed.sql', import.meta.url), out.join('\n') + '\n');
console.log(`seed.sql: ${out.length} statements`);
