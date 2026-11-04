import { useState } from 'react';
import { Icon } from '../components/Icon';
import { PostCard } from '../components/PostCard';
import { BottomNav, BottomSheet, MainHeader, Tabs } from '../components/ui';
import { POSTS_PICK, POSTS_RECOMMEND, TOPICS } from '../data/mock';
import type { Nav } from '../App';

type Tab = 'pick' | 'recommend';
const TAB_ITEMS: { id: Tab; label: string }[] = [
  { id: 'pick', label: '취향콕' },
  { id: 'recommend', label: '추천' },
];
const FILTERS = ['전체', '경험담'];

/**
 * Main_01_1 (취향콕 피드) · Main_01_2 (추천 피드) · Main_01_3 (주제 선택 시트) · Main_01_4 (취향콕 빈 상태)
 */
export function MainScreen({
  nav,
  tab,
  sheetOpen = false,
  empty = false,
}: {
  nav: Nav;
  tab: Tab;
  sheetOpen?: boolean;
  empty?: boolean;
}) {
  const [filter, setFilter] = useState('전체');
  const [topic, setTopic] = useState<string | null>(null);

  const setTab = (t: Tab) => nav(t === 'pick' ? (empty ? 'main-empty' : 'main-pick') : 'main-recommend');

  return (
    <div className="screen">
      <MainHeader onGift={() => nav('events')} onBell={() => nav('noti')} />
      <Tabs items={TAB_ITEMS} value={tab} onChange={setTab} />

      <main className="screen__body">
        {tab === 'recommend' && (
          <div className="feed-filter">
            <div className="feed-filter__chips">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`filter-chip ${filter === f ? 'is-active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <button type="button" className="sort-btn" onClick={() => nav('topic-sheet')}>
              {topic ?? '주제 선택'}
              <Icon name="chevronDown" size={16} />
            </button>
          </div>
        )}

        {tab === 'pick' && empty ? (
          <div className="empty">
            <span className="empty__icon"><Icon name="peoplePlus" size={48} /></span>
            <p className="empty__title">내가 취향콕한 사람들의<br />꿀팁 모아보기</p>
            <p className="empty__desc">
              취향이 비슷한 사람을 취향콕하면<br />그 사람의 꿀팁을 여기서 모아볼 수 있어요
            </p>
          </div>
        ) : (
          <div className="feed">
            {(tab === 'pick' ? POSTS_PICK : POSTS_RECOMMEND).map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </main>

      <BottomNav onHome={() => nav('main-pick')} />

      <BottomSheet open={sheetOpen} onClose={() => nav('main-recommend')} title="주제 선택">
        <ul className="topic-list">
          {TOPICS.map((t) => (
            <li key={t}>
              <button
                type="button"
                className={`topic-list__item ${topic === t ? 'is-active' : ''}`}
                onClick={() => {
                  setTopic(t);
                  nav('main-recommend');
                }}
              >
                <span>{t}</span>
                <Icon name="chevronDown" size={16} />
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </div>
  );
}
