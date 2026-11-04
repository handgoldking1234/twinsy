import { useState } from 'react';
import { Icon } from '../components/Icon';
import { Avatar, BottomNav, Button, ExpertBadge, ImageBox, SoulBadge, SubHeader } from '../components/ui';
import { avatarAt } from '../data/images';
import { NOTI_TODAY, PICK_REQUESTS, type Noti } from '../data/mock';
import type { Nav } from '../App';

/** Main_01_5-1 알림 */
export function NotificationScreen({ nav }: { nav: Nav }) {
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  const row = (n: Noti, idx: number) =>
    n.kind === 'warning' ? (
      <li key={n.id} className="noti noti--warning">
        <Icon name="warning" size={20} style={{ color: 'var(--color-point-primary)' }} />
        <p className="noti__text">
          {n.text}
          <span className="noti__time">{n.time}</span>
        </p>
      </li>
    ) : (
      <li key={n.id} className="noti">
        <Avatar size={34} src={avatarAt(idx)} />
        <div className="noti__content">
          <div className="noti__user">
            <strong>{n.user}</strong>
            {n.soul && <SoulBadge />}
            {n.expert && <ExpertBadge label={n.expert} />}
          </div>
          <p className="noti__text">{n.text}</p>
          <span className="noti__time">{n.time}</span>
        </div>
        {n.kind === 'pick' ? (
          <Button
            variant={picked[n.id] ? 'smallOutline' : 'small'}
            className="noti__action"
            onClick={() => setPicked((s) => ({ ...s, [n.id]: !s[n.id] }))}
          >
            {picked[n.id] ? '취향콕 취소' : '맞취향콕'}
          </Button>
        ) : (
          <ImageBox ratio="1 / 1" src={n.thumb} className="noti__thumb" />
        )}
      </li>
    );

  return (
    <div className="screen">
      <SubHeader title="알림" onBack={() => nav('main-pick')} />
      <main className="screen__body">
        <button type="button" className="request-row" onClick={() => nav('pick-requests')}>
          <span className="request-row__label">취향콕 요청</span>
          <span className="request-row__avatars" aria-hidden>
            {[0, 1, 2, 3].map((i) => <Avatar key={i} size={24} src={avatarAt(i)} />)}
          </span>
          <span className="request-row__count">+ 10명</span>
          <Icon name="arrowRight" size={16} />
        </button>

        <section className="noti-section">
          <h2 className="list-subtitle">오늘</h2>
          <ul className="noti-list">{NOTI_TODAY.map(row)}</ul>
        </section>
        <section className="noti-section">
          <h2 className="list-subtitle">일주일</h2>
          <ul className="noti-list">{NOTI_TODAY.slice(2, 4).map((n, i) => row({ ...n, id: n.id + 'w', time: '3일' }, i + 2))}</ul>
        </section>
      </main>
      <BottomNav onHome={() => nav('main-pick')} />
    </div>
  );
}

/** Main_01_5-2 취향콕 요청 */
export function PickRequestScreen({ nav }: { nav: Nav }) {
  const [state, setState] = useState<Record<string, 'accepted' | 'rejected'>>({});

  return (
    <div className="screen">
      <SubHeader title="취향콕 요청" onBack={() => nav('noti')} />
      <main className="screen__body">
        <ul className="profile-list">
          {PICK_REQUESTS.filter((r) => state[r.id] !== 'rejected').map((r, i) => (
            <li key={r.id} className="profile-item">
              <Avatar size={40} src={avatarAt(i)} />
              <div className="profile-item__info">
                <strong className="profile-item__name">{r.user}</strong>
                {(r.soul || r.expert) && (
                  <span className="profile-item__badges">
                    {r.soul && <SoulBadge />}
                    {r.expert && <ExpertBadge label={r.expert} />}
                  </span>
                )}
              </div>
              {state[r.id] === 'accepted' ? (
                <span className="profile-item__done">수락됨</span>
              ) : (
                <div className="profile-item__actions">
                  <Button variant="small" className="btn--narrow" onClick={() => setState((s) => ({ ...s, [r.id]: 'accepted' }))}>
                    수락
                  </Button>
                  <Button variant="smallOutline" className="btn--narrow" onClick={() => setState((s) => ({ ...s, [r.id]: 'rejected' }))}>
                    거절
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
      <BottomNav onHome={() => nav('main-pick')} />
    </div>
  );
}
