import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { PostRow } from '../components/PostCard';
import { Avatar, BottomNav, BottomSheet, Button, ExpertBadge, ImageBox, SoulBadge, Tabs } from '../components/ui';
import { realtimeTop5, risingKeywords, topicSearch, type RankedPost } from '../algorithm';
import { countLabel, useStore } from '../data/store';
import { NOW, SEARCH_LOGS, TOP5_HISTORY, VOTES, postText, userById, type AppPost, type Vote } from '../data/world';
import type { Nav } from '../App';

type Tab = 'search' | 'vote';

/** 검색 탭 — ⑪ 실시간 꿀팁 검색 Top5 + 일반 주제 검색(AI 요약) / 투표 탭 */
export function SearchScreen({ nav, initialQuery = '', initialTab = 'search' }: { nav: Nav; initialQuery?: string; initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  return (
    <div className="screen">
      <Tabs
        items={[
          { id: 'search' as Tab, label: '검색' },
          { id: 'vote' as Tab, label: '투표' },
        ]}
        value={tab}
        onChange={setTab}
      />
      <main className="screen__body">{tab === 'search' ? <SearchTab nav={nav} initialQuery={initialQuery} /> : <VoteTab />}</main>
      <BottomNav active="search" nav={nav} />
    </div>
  );
}

/* ================= 검색 ================= */

function SearchTab({ nav, initialQuery }: { nav: Nav; initialQuery: string }) {
  const s = useStore();
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const rising = useMemo(() => risingKeywords(SEARCH_LOGS, NOW), []);
  const [kw, setKw] = useState(rising[0]?.keyword ?? '');

  const top5 = useMemo(() => realtimeTop5(kw, s.posts, NOW, TOP5_HISTORY), [kw, s.posts]);

  // 노출 3회 제한은 검색할 때마다 쌓이므로, 이번 검색에 쓴 노출 기록을 고정해 둔다
  const [frozenImpressions, setFrozen] = useState(s.impressions);
  const results = useMemo(
    () =>
      topicSearch(s.me, s.users, s.posts, query, {
        now: NOW,
        impressions: frozenImpressions,
        textOf: (p) => postText(p as AppPost),
      }),
    [query, s.me, s.users, s.posts, frozenImpressions],
  );
  useEffect(() => {
    if (query) s.addImpressions(results.map((r) => r.post.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const run = (q: string) => {
    setFrozen(s.impressions);
    setInput(q);
    setQuery(q.trim());
  };

  const viewOf = (r: RankedPost) => s.view(s.posts.find((p) => p.id === r.post.id)!, r);

  return (
    <>
      <form
        className="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(input);
        }}
      >
        <label className="searchbar" htmlFor="search-input">
          <Icon name="search" size={22} />
          <input
            id="search-input"
            type="search"
            placeholder="궁금한 꿀팁을 검색해 보세요"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {input && (
            <button type="button" className="searchbar__clear" aria-label="지우기" onClick={() => run('')}>
              <Icon name="close" size={16} />
            </button>
          )}
        </label>
      </form>

      {!query ? (
        <>
          <section className="section">
            <div className="section__head">
              <h2 className="section__title">실시간 꿀팁 검색 Top5</h2>
              <span className="section__note">1시간 단위 갱신</span>
            </div>
            <ol className="rising">
              {rising.map((k, i) => (
                <li key={k.keyword}>
                  <button type="button" className={`rising__item ${kw === k.keyword ? 'is-active' : ''}`} onClick={() => setKw(k.keyword)}>
                    <span className="rising__no">{i + 1}</span>
                    <span className="rising__kw">{k.keyword}</span>
                    <span className="rising__up">▲ {Math.round(k.change * 100)}%</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
          <section className="section">
            <div className="section__head">
              <h2 className="section__title">‘{kw}’ 꿀단지</h2>
              <button type="button" className="section__link" onClick={() => run(kw)}>
                전체 검색 <Icon name="arrowRight" size={12} />
              </button>
            </div>
            {top5.length ? (
              <ul className="row-list">
                {top5.map((r, i) => (
                  <li key={r.post.id}>
                    <PostRow v={viewOf(r)} rankNo={i + 1} onOpen={() => nav('post-detail', r.post.id)} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-line">이 키워드의 꿀단지 게시물이 아직 없어요</p>
            )}
          </section>
        </>
      ) : (
        <>
          <AiSummary results={results} />
          <section className="section">
            <div className="section__head">
              <h2 className="section__title">검색 결과 {results.length}</h2>
              <span className="section__note">유사취향자 · 전문가 · 일반</span>
            </div>
            {results.length ? (
              <ul className="row-list">
                {results.map((r) => (
                  <li key={r.post.id}>
                    <PostRow v={viewOf(r)} onOpen={() => nav('post-detail', r.post.id)} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-line">‘{query}’ 검색 결과가 없어요. 다른 단어로 검색해 보세요</p>
            )}
          </section>
        </>
      )}
    </>
  );
}

/** AI 검색 요약 — 전체 사용자 / 유사취향자 콘텐츠를 장점·단점·팁으로 구조화 (예시: 결과 게시물 데이터를 모아 요약) */
function AiSummary({ results }: { results: RankedPost[] }) {
  const s = useStore();
  const [who, setWho] = useState<'all' | 'peer'>('all');
  const posts = results
    .filter((r) => who === 'all' || r.bucket === 'peer')
    .map((r) => s.posts.find((p) => p.id === r.post.id)!) as AppPost[];
  if (!results.length) return null;
  const uniq = (xs: string[]) => [...new Set(xs)].slice(0, 3);
  const pros = uniq(posts.flatMap((p) => p.pros ?? []));
  const cons = uniq(posts.flatMap((p) => p.cons ?? []));
  const tips = uniq(posts.flatMap((p) => (p.tips ?? []).map((t) => `${t.text}${t.strong ?? ''}${t.after ?? ''}`.trim())));
  const honey = posts.reduce((a, p) => a + p.metrics.honey, 0);

  return (
    <section className="ai-summary">
      <div className="ai-summary__head">
        <h2 className="ai-summary__title">AI 요약</h2>
        <div className="seg">
          <button type="button" className={`seg__item ${who === 'all' ? 'is-active' : ''}`} onClick={() => setWho('all')}>전체</button>
          <button type="button" className={`seg__item ${who === 'peer' ? 'is-active' : ''}`} onClick={() => setWho('peer')}>
            <SoulBadge /> 유사취향자
          </button>
        </div>
      </div>
      {posts.length === 0 ? (
        <p className="ai-summary__empty">이 검색어에는 유사취향자 게시물이 아직 없어요</p>
      ) : (
        <dl className="ai-summary__list">
          {pros.length > 0 && (<><dt>장점</dt><dd>{pros.join(', ')}</dd></>)}
          {cons.length > 0 && (<><dt>단점</dt><dd>{cons.join(', ')}</dd></>)}
          {tips.length > 0 && (<><dt>팁</dt><dd>{tips.join(' · ')}</dd></>)}
          <dt>평가</dt>
          <dd>게시물 {posts.length}개 · 꿀팁 평가 {countLabel(honey)}</dd>
        </dl>
      )}
    </section>
  );
}

/* ================= 투표 ================= */

function VoteTab() {
  const s = useStore();
  const [votes, setVotes] = useState<Vote[]>(VOTES);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="vote-intro">
        <p>AI가 보기를 만들고, 다수의 의견을 모은 뒤 <b>유사취향자·전문가 의견을 따로</b> 보여 줘요.</p>
        <Button variant="small" onClick={() => setCreating(true)}>투표 만들기</Button>
      </div>
      <ul className="vote-list">
        {votes.map((v) => {
          const author = userById.get(v.authorId)!;
          const mine = picked[v.id];
          const total = v.options.reduce((a, o) => a + o.total, 0) + (mine ? 1 : 0);
          const peerTotal = v.options.reduce((a, o) => a + o.peer, 0);
          const soul = s.isPeer(author.id);
          return (
            <li key={v.id} className="vote">
              <div className="post__author">
                <Avatar size={34} src={author.avatar} />
                <div className="post__author-info">
                  <div className="post__author-row">
                    <strong className="post__name">{author.name}</strong>
                    {soul && <SoulBadge />}
                  </div>
                  <span className="post__time">{v.ageLabel}</span>
                </div>
              </div>
              <p className="vote__q">{v.question}</p>
              {v.images.length > 0 && (
                <div className="vote__images">
                  {v.images.map((src) => (
                    <ImageBox key={src} ratio="1 / 1" src={src} className="vote__image" />
                  ))}
                </div>
              )}
              <ul className="vote__options">
                {v.options.map((o) => {
                  const count = o.total + (mine === o.id ? 1 : 0);
                  const pct = Math.round((count / total) * 100);
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        className={`vote-opt ${mine ? 'is-done' : ''} ${mine === o.id ? 'is-mine' : ''}`}
                        disabled={Boolean(mine)}
                        onClick={() => setPicked((p) => ({ ...p, [v.id]: o.id }))}
                      >
                        {mine && <span className="vote-opt__bar" style={{ width: `${pct}%` }} />}
                        <span className="vote-opt__label">{o.label}</span>
                        {mine && <span className="vote-opt__pct">{pct}%</span>}
                      </button>
                      {mine && (
                        <p className="vote-opt__split">
                          <SoulBadge /> 유사취향자 {o.peer}표({peerTotal ? Math.round((o.peer / peerTotal) * 100) : 0}%) · <ExpertBadge label="전문가" /> {o.expert}표
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="vote__meta">
                {mine ? `${countLabel(total)}명 참여` : '투표하면 결과를 볼 수 있어요'} · 좋아요 {v.likes} · 댓글 {v.comments}
              </p>
            </li>
          );
        })}
      </ul>

      <CreateVoteSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(q, opts) => {
          setVotes((vs) => [
            {
              id: `v${Date.now()}`, authorId: s.me.id, ageLabel: '방금', question: q, images: [],
              options: opts.map((label, i) => ({ id: String(i), label, total: 0, peer: 0, expert: 0 })),
              likes: 0, comments: 0,
            },
            ...vs,
          ]);
          setCreating(false);
        }}
      />
    </>
  );
}

/** AI가 객관식 보기 생성 (예시 규칙: "A vs B" 패턴이면 두 보기 + 둘 다/둘 다 아님) */
export function suggestOptions(q: string): string[] {
  const vs = q.split(/\s*(?:vs|VS|아니면|or)\s*/);
  if (vs.length >= 2) {
    const clean = (x: string) => x.replace(/[?？]|어떤 게 나을까요|뭐가 나아요/g, '').trim();
    return [clean(vs[0]), clean(vs[1]), '둘 다 좋아요', '둘 다 별로예요'];
  }
  return ['추천해요', '보통이에요', '비추천해요'];
}

function CreateVoteSheet({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (q: string, opts: string[]) => void }) {
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState<string[]>([]);
  return (
    <BottomSheet open={open} onClose={onClose} title="투표 만들기">
      <div className="sheet__content">
        <textarea
          id="vote-question"
          className="textbox"
          rows={3}
          maxLength={100}
          placeholder="예) 제주 여행, 렌트 vs 카페리 어떤 게 나을까요?"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button variant="smallOutline" disabled={!q.trim()} onClick={() => setOpts(suggestOptions(q))}>
          AI 보기 만들기
        </Button>
        {opts.length > 0 && (
          <ul className="vote__options">
            {opts.map((o, i) => (
              <li key={i}>
                <input
                  id={`vote-opt-${i}`}
                  className="vote-opt vote-opt--edit"
                  value={o}
                  aria-label={`보기 ${i + 1}`}
                  onChange={(e) => setOpts((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="sheet__btns">
        <Button variant="secondary" onClick={onClose}>취소</Button>
        <Button variant="primary" disabled={opts.length < 2} onClick={() => { onCreate(q.trim(), opts.filter(Boolean)); setQ(''); setOpts([]); }}>
          올리기
        </Button>
      </div>
    </BottomSheet>
  );
}
