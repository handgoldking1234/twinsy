import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { PostCard } from '../components/PostCard';
import { Dialog, PostOptionsSheet, ReportSheet } from '../components/overlays';
import { BottomNav, BottomSheet, Button, MainHeader, Tabs, Toast } from '../components/ui';
import { followingFeed, isColdStart, recommendFeed, TRUST_MESSAGE, type FeedSort } from '../algorithm';
import { useStore } from '../data/store';
import { DAU, NOW, type AppUser } from '../data/world';
import { TOPICS } from '../data/mock';
import type { Nav } from '../App';
import { Fragment } from 'react';
import { RewardAdCard } from './Extra';

type Tab = 'pick' | 'recommend';
const TAB_ITEMS: { id: Tab; label: string }[] = [
  { id: 'pick', label: '취향콕' },
  { id: 'recommend', label: '추천' },
];
const SORTS: { id: FeedSort; label: string }[] = [
  { id: 'latest', label: '최신순' },
  { id: 'trend', label: '트렌드순' },
];

/**
 * Main_01_1 (취향콕 피드) · Main_01_2 (추천 피드) · Main_01_3 (관심콕 주제 선택) · Main_01_4 (취향콕 빈 상태)
 * 피드 순서는 src/algorithm/feed.ts 가 정한다.
 */
export function MainScreen({ nav, tab, sheetOpen = false, forceEmpty = false }: { nav: Nav; tab: Tab; sheetOpen?: boolean; forceEmpty?: boolean }) {
  const s = useStore();
  const [scope, setScope] = useState<'all' | 'interest'>('all');
  const [sort, setSort] = useState<FeedSort>('latest');
  const [sortOpen, setSortOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(s.interests);
  const [optionsFor, setOptionsFor] = useState<AppUser | null>(null);
  const [blockFor, setBlockFor] = useState<AppUser | null>(null);
  const [unpickFor, setUnpickFor] = useState<AppUser | null>(null);
  const [reportFor, setReportFor] = useState<AppUser | null>(null);
  const [blockedDone, setBlockedDone] = useState<AppUser | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 1800);
  };

  const feed = useMemo(() => {
    if (forceEmpty) return [];
    const ranked =
      tab === 'pick'
        ? followingFeed(s.me, s.posts, s.trusts)
        : recommendFeed(s.me, s.users, s.posts, {
            scope: scope === 'all' ? { kind: 'all' } : { kind: 'interest', topics: s.interests },
            sort,
            now: NOW,
            trusts: s.trusts,
            exposure: { dau: DAU },
          });
    return ranked.filter((r) => !s.blocked.includes(r.post.authorId)).map((r) => s.view(s.posts.find((p) => p.id === r.post.id)!, r));
  }, [tab, scope, sort, s, forceEmpty]);

  const setTab = (t: Tab) => nav(t === 'pick' ? 'main-pick' : 'main-recommend');
  const myTrust = s.trusts.get(s.me.id);

  return (
    <div className="screen">
      <MainHeader onGift={() => nav('events')} onBell={() => nav('noti')} />
      <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />

      <main className="screen__body">
        {myTrust && TRUST_MESSAGE[myTrust.level] && <p className="trust-banner">{TRUST_MESSAGE[myTrust.level]}</p>}

        {tab === 'recommend' && (
          <div className="feed-filter">
            <div className="feed-filter__chips">
              <button type="button" className={`filter-chip ${scope === 'all' ? 'is-active' : ''}`} onClick={() => setScope('all')}>
                전체
              </button>
              <button
                type="button"
                className={`filter-chip ${scope === 'interest' ? 'is-active' : ''}`}
                onClick={() => {
                  if (scope === 'interest') nav('topic-sheet');
                  else setScope('interest');
                }}
              >
                관심콕{scope === 'interest' && <Icon name="chevronDown" size={14} />}
              </button>
            </div>
            <div className="sort-wrap">
              <button type="button" className="sort-btn" aria-expanded={sortOpen} onClick={() => setSortOpen((o) => !o)}>
                {SORTS.find((x) => x.id === sort)!.label}
                <Icon name="chevronDown" size={16} />
              </button>
              {sortOpen && (
                <ul className="sort-menu" role="listbox">
                  {SORTS.map((o) => (
                    <li key={o.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={sort === o.id}
                        className={`sort-menu__item ${sort === o.id ? 'is-active' : ''}`}
                        onClick={() => {
                          setSort(o.id);
                          setSortOpen(false);
                        }}
                      >
                        <span className="radio-dot" />
                        {o.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        {tab === 'recommend' && scope === 'interest' && (
          <p className="feed-scope">관심콕 · {s.interests.join(', ')}</p>
        )}

        {tab === 'pick' && feed.length === 0 ? (
          <div className="empty">
            <span className="empty__icon"><Icon name="peoplePlus" size={48} /></span>
            <p className="empty__title">내가 취향콕한 사람들의<br />꿀팁 모아보기</p>
            <p className="empty__desc">
              {isColdStart(s.me) ? '아직 취향콕한 사람이 없어요. 추천 탭에서 나와 취향이 비슷한 사람을 찾아보세요' : '취향콕한 사람의 새 게시물이 없어요'}
            </p>
            <Button variant="small" onClick={() => nav('main-recommend')}>추천 보러 가기</Button>
          </div>
        ) : feed.length === 0 ? (
          <div className="empty">
            <p className="empty__title">이 조건에 맞는 게시물이 없어요</p>
            <p className="empty__desc">{sort === 'trend' ? '트렌드순은 2~7일 전 게시물 중 반응이 많은 순이에요' : '최신순은 48시간 이내 게시물만 보여요'}</p>
          </div>
        ) : (
          <div className="feed">
            {feed.map((v, i) => (
              <Fragment key={v.post.id}>
                <PostCard
                  v={v}
                  onMore={() => setOptionsFor(v.author)}
                  onOpen={() => nav('post-detail', v.post.id)}
                  onTag={(t) => nav('search', t)}
                />
                {tab === 'recommend' && i % 6 === 5 && <RewardAdCard />}
              </Fragment>
            ))}
          </div>
        )}
      </main>

      <BottomNav active="home" nav={nav} />

      {/* 관심콕 주제 선택 */}
      <BottomSheet open={sheetOpen} onClose={() => nav('main-recommend')} title="관심콕 주제 선택">
        <ul className="topic-list">
          {TOPICS.map((t) => {
            const on = draft.includes(t);
            const related = Boolean(s.me.taste[t]);
            return (
              <li key={t}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  className={`topic-list__item ${on ? 'is-active' : ''}`}
                  onClick={() => setDraft((d) => (on ? d.filter((x) => x !== t) : [...d, t]))}
                >
                  <span>
                    {t}
                    {!related && <em className="topic-list__note">전체 회원 게시물</em>}
                  </span>
                  <span className={`check ${on ? 'is-on' : ''}`} />
                </button>
              </li>
            );
          })}
        </ul>
        <div className="sheet__btns">
          <Button
            variant="primary"
            disabled={!draft.length}
            onClick={() => {
              s.setInterests(draft);
              setScope('interest');
              nav('main-recommend');
            }}
          >
            {draft.length}개 주제 적용
          </Button>
        </div>
      </BottomSheet>

      <PostOptionsSheet
        author={optionsFor}
        following={Boolean(optionsFor && s.me.follows.includes(optionsFor.id))}
        onClose={() => setOptionsFor(null)}
        onAction={(a) => {
          const u = optionsFor!;
          setOptionsFor(null);
          if (a === 'block') setBlockFor(u);
          else if (a === 'report') setReportFor(u);
          else if (a === 'unpick') setUnpickFor(u);
          else if (a === 'pick') {
            s.toggleFollow(u.id);
            flash(`${u.name} 님을 취향콕했어요`);
          } else if (a === 'message') nav('chat', u.id);
          else flash('프로필 링크를 복사했어요');
        }}
      />
      <Dialog
        open={Boolean(blockFor)}
        avatar={blockFor?.avatar}
        title={<><b>{blockFor?.name}</b> 님을<br />차단하시겠습니까?</>}
        desc={<>향후 서로의 프로필 계정과 게시물을 검색하거나 볼 수 없으며, 메시지도 주고받을 수 없습니다<hr />동일인이 다시 가입해도 차단은 유지되며, 상대방에게 회원님이 차단한 사실을 알리지 않습니다</>}
        confirm="차단"
        onCancel={() => setBlockFor(null)}
        onConfirm={() => {
          s.block(blockFor!.id);
          setBlockedDone(blockFor);
          setBlockFor(null);
        }}
      />
      <Dialog
        open={Boolean(unpickFor)}
        avatar={unpickFor?.avatar}
        title={<><b>{unpickFor?.name}</b> 님을<br />취향콕 취소하시겠어요?</>}
        confirm="취향콕 취소"
        onCancel={() => setUnpickFor(null)}
        onConfirm={() => {
          s.toggleFollow(unpickFor!.id);
          setUnpickFor(null);
        }}
      />
      <Dialog
        open={Boolean(blockedDone)}
        title={<><b>{blockedDone?.name}</b> 님을<br />차단하였습니다</>}
        desc="설정에서 언제든지 차단을 해제할 수 있습니다"
        cancel={null}
        confirm="확인"
        destructive={false}
        onCancel={() => setBlockedDone(null)}
        onConfirm={() => setBlockedDone(null)}
      />
      <ReportSheet
        author={reportFor}
        onClose={() => setReportFor(null)}
        onSubmit={() => {
          setReportFor(null);
          flash('신고가 접수되었습니다');
        }}
      />
      {toast && <Toast>{toast}</Toast>}
    </div>
  );
}

