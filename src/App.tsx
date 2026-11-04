import { useEffect, useState } from 'react';
import { MainScreen } from './screens/Main';
import { NotificationScreen, PickRequestScreen } from './screens/Notice';
import { EventDetailScreen, EventListScreen } from './screens/Event';

export type ScreenId =
  | 'main-pick' | 'main-recommend' | 'topic-sheet' | 'main-empty'
  | 'noti' | 'pick-requests' | 'events' | 'event-detail';
export type Nav = (id: ScreenId) => void;

/** Figma 프레임 순서 그대로 */
export const SCREENS: { id: ScreenId; code: string; label: string; group: string }[] = [
  { id: 'main-pick', code: 'Main_01_1', label: '취향콕 피드', group: '메인' },
  { id: 'main-recommend', code: 'Main_01_2', label: '추천 피드', group: '메인' },
  { id: 'topic-sheet', code: 'Main_01_3', label: '주제 선택', group: '메인' },
  { id: 'main-empty', code: 'Main_01_4', label: '취향콕 빈 상태', group: '메인' },
  { id: 'noti', code: 'Main_01_5-1', label: '알림', group: '알림' },
  { id: 'pick-requests', code: 'Main_01_5-2', label: '취향콕 요청', group: '알림' },
  { id: 'events', code: 'Main_01_6-1', label: '이벤트', group: '이벤트' },
  { id: 'event-detail', code: 'Main_01_6-2', label: '이벤트 상세', group: '이벤트' },
];

const fromHash = (): ScreenId => {
  const h = window.location.hash.slice(1) as ScreenId;
  return SCREENS.some((s) => s.id === h) ? h : 'main-pick';
};

export default function App() {
  const [screen, setScreen] = useState<ScreenId>(fromHash);

  useEffect(() => {
    const on = () => setScreen(fromHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const nav: Nav = (id) => {
    window.location.hash = id;
    setScreen(id);
  };

  const isMain = ['main-pick', 'main-recommend', 'topic-sheet', 'main-empty'].includes(screen);

  return (
    <div className="preview">
      <aside className="preview__index" aria-label="화면 목록">
        <p className="preview__brand">Twinsy 화면</p>
        {['메인', '알림', '이벤트'].map((g) => (
          <div key={g} className="preview__group">
            <p className="preview__group-title">{g}</p>
            {SCREENS.filter((s) => s.group === g).map((s) => (
              <button
                key={s.id}
                type="button"
                className={`preview__link ${screen === s.id ? 'is-active' : ''}`}
                onClick={() => nav(s.id)}
              >
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
            empty={screen === 'main-empty'}
          />
        )}
        {screen === 'noti' && <NotificationScreen nav={nav} />}
        {screen === 'pick-requests' && <PickRequestScreen nav={nav} />}
        {screen === 'events' && <EventListScreen nav={nav} />}
        {screen === 'event-detail' && <EventDetailScreen nav={nav} />}
      </div>
    </div>
  );
}
