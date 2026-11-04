/**
 * 출시 6개월 후 도입 예정 기능 (기획서): 챌린지 · 리워드 광고 · 실시간 Live 투표
 */
import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { BottomNav, Button, ExpertBadge, ImageBox, SoulBadge, SubHeader, Toast } from '../components/ui';
import { IMG } from '../data/images';
import type { Nav } from '../App';

type Challenge = { id: string; title: string; desc: string; goal: number; done: number; reward: number; ends: string; image: string };

const CHALLENGES: Challenge[] = [
  { id: 'c1', title: '동네 맛집 방문 인증 5곳', desc: '위치 인증 평가만 남기면 돼요. 글 작성은 필요 없어요', goal: 5, done: 2, reward: 500, ends: 'D-6', image: IMG.koreanBbq },
  { id: 'c2', title: '이번 주 꿀단지 1개 올리기', desc: '사진과 핵심 Point 3개 이상', goal: 1, done: 0, reward: 1000, ends: 'D-3', image: IMG.books },
  { id: 'c3', title: '유사취향자 글에 꿀팁 평가 10번', desc: '좋아요 대신 유용성으로 평가해 주세요', goal: 10, done: 7, reward: 300, ends: 'D-1', image: IMG.gift },
];

/** 챌린지 + 리워드 광고 */
export function ChallengeScreen({ nav }: { nav: Nav }) {
  const [joined, setJoined] = useState<string[]>(['c1', 'c3']);
  const [points, setPoints] = useState(1250);
  const [watching, setWatching] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!watching) return;
    const t = window.setInterval(() => setWatching((w) => (w <= 1 ? 0 : w - 1)), 1000);
    return () => window.clearInterval(t);
  }, [watching > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (watching === 0 && toast === 'ad') {
      setPoints((p) => p + 50);
      setToast('50포인트를 받았어요');
      window.setTimeout(() => setToast(null), 1600);
    }
  }, [watching, toast]);

  return (
    <div className="screen">
      <SubHeader title="챌린지" onBack={() => nav('main-pick')} />
      <main className="screen__body">
        <section className="points">
          <div>
            <p className="points__label">내 포인트</p>
            <p className="points__value">{points.toLocaleString()}P</p>
          </div>
          <Button variant="small" disabled={watching > 0} onClick={() => { setWatching(5); setToast('ad'); }}>
            {watching ? `광고 ${watching}초` : '광고 보고 50P'}
          </Button>
        </section>
        <ul className="challenge-list">
          {CHALLENGES.map((c) => {
            const on = joined.includes(c.id);
            const pct = Math.round((c.done / c.goal) * 100);
            return (
              <li key={c.id} className="challenge">
                <ImageBox ratio="324 / 120" src={c.image} alt="" className="challenge__image">
                  <span className="challenge__ends">{c.ends}</span>
                </ImageBox>
                <div className="challenge__body">
                  <strong className="challenge__title">{c.title}</strong>
                  <p className="challenge__desc">{c.desc}</p>
                  {on && (
                    <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={c.goal} aria-valuenow={c.done}>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  <div className="challenge__foot">
                    <span className="challenge__reward">+{c.reward.toLocaleString()}P</span>
                    {on ? (
                      <span className="challenge__progress">{c.done}/{c.goal} 진행 중</span>
                    ) : (
                      <Button variant="small" onClick={() => setJoined((j) => [...j, c.id])}>참여하기</Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="settings__note pad">포인트는 제휴처 쿠폰으로 바꿀 수 있어요. 리워드 광고는 하루 5번까지 볼 수 있어요.</p>
      </main>
      <BottomNav nav={nav} />
      {toast && toast !== 'ad' && <Toast>{toast}</Toast>}
    </div>
  );
}

/** 실시간 Live 투표 — 마감 시간까지 표가 실시간으로 늘어난다 (서버 연결 시 Supabase Realtime) */
export function LiveVoteScreen({ nav }: { nav: Nav }) {
  const [left, setLeft] = useState(15 * 60);
  const [opts, setOpts] = useState([
    { id: 'a', label: '성수 웨이팅 맛집', total: 312, peer: 41 },
    { id: 'b', label: '을지로 노포', total: 287, peer: 58 },
    { id: 'c', label: '한남동 브런치', total: 154, peer: 12 },
  ]);
  const [mine, setMine] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => {
      setLeft((l) => Math.max(0, l - 1));
      setOpts((os) => os.map((o) => ({ ...o, total: o.total + Math.floor(Math.random() * 3), peer: o.peer + (Math.random() < 0.15 ? 1 : 0) })));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const total = opts.reduce((a, o) => a + o.total, 0);
  const peerTotal = opts.reduce((a, o) => a + o.peer, 0);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div className="screen">
      <SubHeader title="Live 투표" onBack={() => nav('vote')} />
      <main className="screen__body">
        <section className="live">
          <p className="live__badge"><span className="live__dot" />LIVE · {mm}:{ss} 남음</p>
          <h2 className="live__q">이번 주말 데이트, 어디가 제일 좋아요?</h2>
          <p className="live__count">{total.toLocaleString()}명 참여 중</p>
          <ul className="vote__options vote__options--flush">
            {opts.map((o) => {
              const pct = Math.round((o.total / total) * 100);
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    className={`vote-opt is-done ${mine === o.id ? 'is-mine' : ''}`}
                    disabled={Boolean(mine) || left === 0}
                    onClick={() => setMine(o.id)}
                  >
                    <span className="vote-opt__bar" style={{ width: `${pct}%` }} />
                    <span className="vote-opt__label">{o.label}</span>
                    <span className="vote-opt__pct">{pct}%</span>
                  </button>
                  <p className="vote-opt__split">
                    <SoulBadge /> 유사취향자 {peerTotal ? Math.round((o.peer / peerTotal) * 100) : 0}% · <ExpertBadge label="전문가" /> {o.id === 'b' ? 4 : 1}표
                  </p>
                </li>
              );
            })}
          </ul>
          <p className="live__note">
            <Icon name="warning" size={14} style={{ color: 'var(--color-text-secondary)' }} /> 투표는 한 번만 할 수 있고, 마감 후 결과가 확정돼요
          </p>
        </section>
      </main>
      <BottomNav active="search" nav={nav} />
    </div>
  );
}

/** 피드 사이 리워드 광고 카드 */
export function RewardAdCard() {
  const [done, setDone] = useState(false);
  return (
    <aside className="ad-card" aria-label="광고">
      <span className="ad-card__label">광고</span>
      <ImageBox ratio="324 / 140" src={IMG.grillParty} alt="" className="ad-card__image" />
      <div className="ad-card__body">
        <strong className="ad-card__title">캠핑 바비큐 세트 20% 할인</strong>
        <p className="ad-card__desc">끝까지 보면 50포인트를 드려요</p>
      </div>
      <Button variant={done ? 'smallOutline' : 'small'} disabled={done} onClick={() => setDone(true)}>
        {done ? '50P 받음' : '보고 포인트 받기'}
      </Button>
    </aside>
  );
}
