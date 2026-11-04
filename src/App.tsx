import { useEffect, useState } from 'react';
import { MainScreen } from './screens/Main';
import { NotificationScreen, PickRequestScreen } from './screens/Notice';
import { EventDetailScreen, EventListScreen } from './screens/Event';
import { SearchScreen } from './screens/Search';
import { ChatScreen, MessagesScreen, PostDetailScreen, WriteScreen } from './screens/Post';
import { OnboardingScreen, PickListScreen, ProfileScreen, SettingsScreen } from './screens/Profile';
import { AlgoScreen } from './screens/Algo';
import { StoreProvider, useStore } from './data/store';

export type ScreenId =
  | 'main-pick' | 'main-recommend' | 'topic-sheet' | 'main-empty'
  | 'noti' | 'pick-requests' | 'events' | 'event-detail'
  | 'search' | 'vote' | 'post-detail' | 'write' | 'messages' | 'chat'
  | 'profile' | 'pick-list' | 'settings' | 'onboarding' | 'algo';

/** 화면 이동. param = 게시물 id · 검색어 · 대화 상대 id */
export type Nav = (id: ScreenId, param?: string) => void;

export const SCREENS: { id: ScreenId; code: string; label: string; group: string }[] = [
  { id: 'main-pick', code: 'Main_01_1', label: '취향콕 피드', group: '메인' },
  { id: 'main-recommend', code: 'Main_01_2', label: '추천 피드', group: '메인' },
  { id: 'topic-sheet', code: 'Main_01_3', label: '관심콕 주제 선택', group: '메인' },
  { id: 'main-empty', code: 'Main_01_4', label: '취향콕 빈 상태', group: '메인' },
  { id: 'noti', code: 'Main_01_5-1', label: '알림', group: '알림' },
  { id: 'pick-requests', code: 'Main_01_5-2', label: '취향콕 요청', group: '알림' },
  { id: 'events', code: 'Main_01_6-1', label: '이벤트', group: '이벤트' },
  { id: 'event-detail', code: 'Main_01_6-2', label: '이벤트 상세', group: '이벤트' },
  { id: 'search', code: 'Search', label: '검색 · 실시간 Top5', group: '검색' },
  { id: 'vote', code: 'Vote', label: '투표', group: '검색' },
  { id: 'post-detail', code: 'Post', label: '게시물 상세', group: '게시물' },
  { id: 'write', code: 'Write', label: '게시물 작성', group: '게시물' },
  { id: 'messages', code: 'Message', label: '메시지 목록', group: '메시지' },
  { id: 'chat', code: 'Chat', label: '대화방', group: '메시지' },
  { id: 'profile', code: 'Profile 01-1', label: '마이프로필', group: '마이' },
  { id: 'pick-list', code: 'Profile 01-7', label: '취향콕 목록', group: '마이' },
  { id: 'settings', code: 'Setting', label: '설정', group: '마이' },
  { id: 'onboarding', code: 'Onboarding', label: '취향 테스트', group: '시작' },
  { id: 'algo', code: 'Algorithm', label: '알고리즘 확인', group: '개발 확인' },
];
const GROUPS = [...new Set(SCREENS.map((s) => s.group))];

const fromHash = (): ScreenId => {
  const h = window.location.hash.slice(1) as ScreenId;
  return SCREENS.some((s) => s.id === h) ? h : 'main-pick';
};

function Shell() {
  const store = useStore();
  const [screen, setScreen] = useState<ScreenId>(fromHash);
  const [param, setParam] = useState<string | undefined>();

  useEffect(() => {
    const on = () => setScreen(fromHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const nav: Nav = (id, p) => {
    setParam(p);
    setScreen(id);
    if (window.location.hash.slice(1) !== id) window.location.hash = id;
    document.querySelector('.screen__body')?.scrollTo(0, 0);
  };

  const isMain = ['main-pick', 'main-recommend', 'topic-sheet', 'main-empty'].includes(screen);

  return (
    <div className="preview">
      <aside className="preview__index" aria-label="화면 목록">
        <p className="preview__brand">Twinsy 화면</p>
        <label className="preview__toggle" htmlFor="debug-toggle">
          <input id="debug-toggle" type="checkbox" checked={store.debug} onChange={(e) => store.setDebug(e.target.checked)} />
          알고리즘 점수 보기
        </label>
        {GROUPS.map((g) => (
          <div key={g} className="preview__group">
            <p className="preview__group-title">{g}</p>
            {SCREENS.filter((s) => s.group === g).map((s) => (
              <button key={s.id} type="button" className={`preview__link ${screen === s.id ? 'is-active' : ''}`} onClick={() => nav(s.id)}>
                <span className="preview__code">{s.code}</span>
                {s.label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      <div className="device">
        {isMain && (
          <MainScreen
            key="main"
            nav={nav}
            tab={screen === 'main-pick' || screen === 'main-empty' ? 'pick' : 'recommend'}
            sheetOpen={screen === 'topic-sheet'}
            forceEmpty={screen === 'main-empty'}
          />
        )}
        {screen === 'noti' && <NotificationScreen nav={nav} />}
        {screen === 'pick-requests' && <PickRequestScreen nav={nav} />}
        {screen === 'events' && <EventListScreen nav={nav} />}
        {screen === 'event-detail' && <EventDetailScreen nav={nav} />}
        {(screen === 'search' || screen === 'vote') && (
          <SearchScreen key={`${screen}-${param ?? ''}`} nav={nav} initialQuery={param} initialTab={screen === 'vote' ? 'vote' : 'search'} />
        )}
        {screen === 'post-detail' && <PostDetailScreen key={param} nav={nav} postId={param} />}
        {screen === 'write' && <WriteScreen nav={nav} />}
        {screen === 'messages' && <MessagesScreen nav={nav} />}
        {screen === 'chat' && <ChatScreen key={param} nav={nav} userId={param} />}
        {screen === 'profile' && <ProfileScreen nav={nav} />}
        {screen === 'pick-list' && <PickListScreen nav={nav} />}
        {screen === 'settings' && <SettingsScreen nav={nav} />}
        {screen === 'onboarding' && <OnboardingScreen nav={nav} />}
        {screen === 'algo' && <AlgoScreen nav={nav} />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
