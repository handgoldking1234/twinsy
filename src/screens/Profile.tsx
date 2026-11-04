import { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { Dialog } from '../components/overlays';
import { Avatar, BottomNav, Button, ExpertBadge, ImageBox, SoulBadge, SubHeader, Tabs, Toast } from '../components/ui';
import { similarity, TRUST_MESSAGE, type TasteVector } from '../algorithm';
import { countLabel, useStore } from '../data/store';
import { TASTE_TEST, userById, type AppPost } from '../data/world';
import type { Nav } from '../App';

/** 세부 취향 → 사람이 읽는 칩 (예: 매운맛 좋아함 / 단맛 X) */
export function tasteChips(v: TasteVector): string[] {
  return Object.entries(v)
    .filter(([, x]) => Math.abs(x) >= 0.5)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .map(([k, x]) => (x > 0 ? `${k} 좋아함` : `${k} X`));
}

/** Profile 01-1 — 본인 프로필 계정 화면 */
export function ProfileScreen({ nav }: { nav: Nav }) {
  const s = useStore();
  const [tab, setTab] = useState<'all' | 'honey' | 'saved'>('all');
  const mine = s.posts.filter((p) => p.authorId === s.me.id);
  const list = tab === 'honey' ? mine.filter((p) => p.kind === 'honey') : tab === 'saved' ? s.posts.filter((p) => ['p-jeju', 'p-clean'].includes(p.id)) : mine;
  const followers = s.users.filter((u) => u.follows.includes(s.me.id)).length + 128;
  const trust = s.trusts.get(s.me.id)!;

  const left = list.filter((_, i) => i % 2 === 0);
  const right = list.filter((_, i) => i % 2 === 1);

  return (
    <div className="screen">
      <header className="profile-top">
        <h1 className="profile-top__name">{s.me.name}</h1>
        <button type="button" className="sub-header__btn" aria-label="설정" onClick={() => nav('settings')}>
          <Icon name="more" />
        </button>
      </header>
      <main className="screen__body">
        <section className="profile-info">
          <div className="profile-info__row">
            <Avatar size={72} src={s.me.avatar} />
            <ul className="profile-stats">
              <li><b>{mine.length}</b><span>게시물</span></li>
              <li><button type="button" onClick={() => nav('pick-list')}><b>{s.me.follows.length}</b><span>취향콕</span></button></li>
              <li><b>{countLabel(followers)}</b><span>취향메이트</span></li>
            </ul>
          </div>
          {s.me.bio && <p className="profile-info__bio">{s.me.bio}</p>}
          <div className="taste-box">
            {Object.entries(s.me.taste).map(([topic, v]) => (
              <div key={topic} className="taste-box__row">
                <span className="taste-box__topic">{topic}</span>
                <span className="taste-box__chips">
                  {tasteChips(v).map((c) => <span key={c} className="taste-chip">{c}</span>)}
                </span>
              </div>
            ))}
          </div>
          {TRUST_MESSAGE[trust.level] && <p className="trust-banner">{TRUST_MESSAGE[trust.level]}</p>}
          <div className="profile-info__btns">
            <Button variant="smallOutline" onClick={() => nav('onboarding')}>취향 테스트 다시 하기</Button>
            <Button variant="smallOutline" onClick={() => nav('pick-list')}>취향콕 목록</Button>
          </div>
        </section>

        <Tabs
          items={[
            { id: 'all' as const, label: '게시물' },
            { id: 'honey' as const, label: '꿀단지' },
            { id: 'saved' as const, label: '저장됨' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {list.length === 0 ? (
          <p className="empty-line">아직 게시물이 없어요</p>
        ) : (
          <div className="masonry">
            {[left, right].map((col, ci) => (
              <div key={ci} className="masonry__col">
                {col.map((p, i) => <GridCard key={p.id} p={p} tall={(i + ci) % 2 === 0} onOpen={() => nav('post-detail', p.id)} />)}
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav active="profile" nav={nav} />
    </div>
  );
}

/** List Post Card (DESIGN.md 4-3, 폭 160) */
function GridCard({ p, tall, onOpen }: { p: AppPost; tall: boolean; onOpen: () => void }) {
  return (
    <button type="button" className="grid-card" onClick={onOpen}>
      <span className="grid-card__topic">{p.topic}</span>
      <ImageBox ratio={tall ? '160 / 190' : '160 / 140'} src={p.images[0]?.src} alt={p.images[0]?.alt}>
        {p.kind === 'honey' && <span className="post__category">꿀단지</span>}
      </ImageBox>
      <span className="grid-card__title">{p.title}</span>
    </button>
  );
}

/** Profile 01-7 — 취향콕 목록 + 취향콕 추천(유사율 순) */
export function PickListScreen({ nav }: { nav: Nav }) {
  const s = useStore();
  const [q, setQ] = useState('');
  const [oldest, setOldest] = useState(false);
  const [unpick, setUnpick] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);

  const following = s.me.follows.map((id) => userById.get(id)!).filter((u) => u.name.toLowerCase().includes(q.toLowerCase()));
  const ordered = oldest ? following : [...following].reverse();

  // 취향콕 추천: 내가 취향 데이터를 가진 주제에서 가장 높은 유사율 순
  const recommend = useMemo(() => {
    return s.users
      .filter((u) => u.id !== s.me.id && !s.me.follows.includes(u.id) && !hidden.includes(u.id))
      .map((u) => {
        const sims = Object.keys(s.me.taste).map((t) => ({ t, v: similarity(s.me, u, t) })).filter((x) => x.v !== null) as { t: string; v: number }[];
        const best = sims.sort((a, b) => b.v - a.v)[0];
        return { u, best };
      })
      .filter((x) => x.best && s.trusts.get(x.u.id)?.level !== 'restricted')
      .sort((a, b) => b.best.v - a.best.v)
      .slice(0, 5);
  }, [s, hidden]);

  return (
    <div className="screen">
      <SubHeader title="취향콕" onBack={() => nav('profile')} />
      <main className="screen__body">
        <div className="pad-list">
          <label className="searchbar" htmlFor="pick-search">
            <Icon name="search" size={22} />
            <input id="pick-search" type="search" placeholder="검색" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>

          <div className="list-head">
            <h2 className="list-head__title">모든 취향콕</h2>
            <button type="button" className="sort-btn" onClick={() => setOldest((o) => !o)}>
              {oldest ? '오래된순' : '최신순'} <Icon name="sort" size={16} />
            </button>
          </div>
          {ordered.length === 0 ? (
            <p className="empty-line">아직 취향콕한 사람이 없어요</p>
          ) : (
            <ul className="profile-list profile-list--flush">
              {ordered.map((u) => (
                <li key={u.id} className="profile-item">
                  <Avatar size={40} src={u.avatar} />
                  <div className="profile-item__info">
                    <strong className="profile-item__name">{u.name}</strong>
                    <span className="profile-item__badges">
                      {s.isPeer(u.id) && <SoulBadge />}
                      {u.expertLabel && <ExpertBadge label={u.expertLabel} />}
                    </span>
                  </div>
                  <button type="button" className="icon-btn" aria-label="메시지 보내기" onClick={() => nav('chat', u.id)}>
                    <Icon name="send" size={22} />
                  </button>
                  <Button variant="smallOutline" onClick={() => setUnpick(u.id)}>취향콕 취소</Button>
                </li>
              ))}
            </ul>
          )}

          <div className="list-head">
            <h2 className="list-head__title">취향콕 추천</h2>
            <span className="section__note">취향 유사율 순</span>
          </div>
          <ul className="profile-list profile-list--flush">
            {recommend.map(({ u, best }) => (
              <li key={u.id} className="profile-item">
                <Avatar size={40} src={u.avatar} />
                <div className="profile-item__info">
                  <strong className="profile-item__name">{u.name}</strong>
                  <span className="profile-item__badges">
                    {s.isPeer(u.id) && <SoulBadge />}
                    {u.expertLabel && <ExpertBadge label={u.expertLabel} />}
                    <span className="sim-label">{best.t} {Math.round(best.v)}%</span>
                  </span>
                </div>
                <Button variant="small" onClick={() => s.toggleFollow(u.id)}>취향콕</Button>
                <button type="button" className="icon-btn" aria-label="추천에서 숨기기" onClick={() => setHidden((h) => [...h, u.id])}>
                  <Icon name="close" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <BottomNav active="profile" nav={nav} />
      <Dialog
        open={Boolean(unpick)}
        avatar={unpick ? userById.get(unpick)?.avatar : undefined}
        title={<><b>{unpick && userById.get(unpick)?.name}</b> 님을<br />취향콕 취소하시겠어요?</>}
        confirm="취향콕 취소"
        onCancel={() => setUnpick(null)}
        onConfirm={() => {
          s.toggleFollow(unpick!);
          setUnpick(null);
        }}
      />
    </div>
  );
}

/** 설정 */
export function SettingsScreen({ nav }: { nav: Nav }) {
  const s = useStore();
  const trust = s.trusts.get(s.me.id)!;
  const [dialog, setDialog] = useState<null | 'private' | 'disable' | 'delete'>(null);
  const [isPrivate, setPrivate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const groups: { title: string; items: { label: string; onClick?: () => void; value?: string }[] }[] = [
    {
      title: '계정',
      items: [
        { label: '개인 정보' },
        { label: '프로필 계정 정보' },
        { label: '프로필 공유' },
        { label: '프로필 공개 범위', value: isPrivate ? '비공개' : '전체 공개', onClick: () => setDialog('private') },
        { label: '알림' },
        { label: '권한' },
      ],
    },
    {
      title: '취향',
      items: [
        { label: '취향 테스트 다시 하기', onClick: () => nav('onboarding') },
        { label: '계정 신뢰도', value: trust.total === 0 ? '좋음' : `${trust.total}점` },
      ],
    },
    {
      title: '활동 내역',
      items: [{ label: '꿀팁 평가' }, { label: '저장됨', onClick: () => nav('profile') }, { label: '차단 목록' }],
    },
    {
      title: '고객 지원',
      items: [{ label: '문의' }, { label: '프로필 계정 비활성화', onClick: () => setDialog('disable') }, { label: '프로필 계정 삭제', onClick: () => setDialog('delete') }],
    },
  ];

  return (
    <div className="screen">
      <SubHeader title="설정" onBack={() => nav('profile')} />
      <main className="screen__body">
        <div className="settings">
          {groups.map((g) => (
            <section key={g.title} className="settings__group">
              <h2 className="settings__title">{g.title}</h2>
              <ul>
                {g.items.map((it) => (
                  <li key={it.label}>
                    <button type="button" className="setting-row" onClick={it.onClick}>
                      <span>{it.label}</span>
                      <span className="setting-row__side">
                        {it.value && <span className="setting-row__value">{it.value}</span>}
                        <Icon name="arrowRight" size={16} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="settings__note">
            계정 신뢰도는 0에서 시작해요. 기본 취향과 반대되는 게시물을 올리면 그 주제에서 1점씩 내려가고, -3점이면 안내, -6점이면 경고, -10점이면 한 달간 피드 노출이 제한돼요.
          </p>
        </div>
      </main>
      <BottomNav active="profile" nav={nav} />

      <Dialog
        open={dialog === 'private'}
        title={isPrivate ? '프로필 계정을 공개로 전환하시겠어요?' : '프로필 계정을 비공개로 전환하시겠어요?'}
        desc={isPrivate ? '프로필 계정을 공개로 설정하면, 누구나 회원님의 게시물을 볼 수 있습니다' : '프로필 계정을 비공개로 설정하면, 회원님의 취향메이트에게만 게시물이 공개돼요'}
        confirm={isPrivate ? '전체 공개로 전환' : '비공개로 전환'}
        destructive={false}
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setPrivate((p) => !p);
          setDialog(null);
        }}
      />
      <Dialog
        open={dialog === 'disable'}
        title="프로필 계정을 비활성화로 전환하시겠어요?"
        desc={<>잠시 Twinsy 활동을 쉬고 싶으시다면 프로필 계정을 일시적으로 비활성화하실 수 있으며 매월 1일 기준 최대 3회까지 가능합니다<hr />프로필 계정을 다시 활성화할 때까지 Twinsy에서 회원님의 계정이 숨겨지며, 언제든지 설정에서 재활성화하실 수 있습니다</>}
        cancel="다음에"
        confirm="비활성화로 전환"
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          setDialog(null);
          setToast('프로필 계정을 비활성화했어요');
          window.setTimeout(() => setToast(null), 1800);
        }}
      />
      <Dialog
        open={dialog === 'delete'}
        title="정말로 프로필 계정을 삭제하시겠습니까?"
        desc="삭제된 계정과 모든 데이터는 복구할 수 없습니다"
        confirm="계정 삭제하기"
        onCancel={() => setDialog(null)}
        onConfirm={() => setDialog(null)}
      />
      {toast && <Toast>{toast}</Toast>}
    </div>
  );
}

/** 온보딩 — 세부 취향 테스트(최대 4분) → 초기 취향 프로필 생성 (콜드 스타트) */
export function OnboardingScreen({ nav }: { nav: Nav }) {
  const s = useStore();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const done = step >= TASTE_TEST.length;
  const q = TASTE_TEST[Math.min(step, TASTE_TEST.length - 1)];

  const result = () => {
    const taste: Record<string, TasteVector> = {};
    for (const t of TASTE_TEST) {
      if (answers[t.id] === undefined) continue;
      taste[t.topic] = { ...(taste[t.topic] ?? {}), [t.feature]: answers[t.id] };
    }
    return taste;
  };

  if (done) {
    const taste = result();
    return (
      <div className="screen">
        <SubHeader title="취향 테스트 결과" onBack={() => setStep(TASTE_TEST.length - 1)} />
        <main className="screen__body">
          <div className="onboard">
            <p className="onboard__eyebrow">나의 취향 프로필</p>
            <h2 className="onboard__title">나와 취향이 비슷한 사람의<br />꿀팁부터 보여 드릴게요</h2>
            <div className="taste-box">
              {Object.entries(taste).map(([topic, v]) => (
                <div key={topic} className="taste-box__row">
                  <span className="taste-box__topic">{topic}</span>
                  <span className="taste-box__chips">
                    {tasteChips(v).length ? tasteChips(v).map((c) => <span key={c} className="taste-chip">{c}</span>) : <span className="taste-chip">무난함</span>}
                  </span>
                </div>
              ))}
            </div>
            <p className="onboard__note">
              주제별로 취향 유사율 상위 20%인 사람이 유사취향자가 되고, 방문 평가·투표·게시물이 쌓일수록 더 정확해져요.
              아직 취향콕한 사람이 없으니 추천 탭부터 보여 드려요.
            </p>
          </div>
        </main>
        <div className="bottom-cta">
          <Button
            variant="primary"
            onClick={() => {
              s.setMe({ ...s.me, taste: { ...s.me.taste, ...taste }, follows: [] });
              nav('main-recommend');
            }}
          >
            트윈지 시작하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <SubHeader title="취향 테스트" onBack={() => (step ? setStep(step - 1) : nav('profile'))} right={<button type="button" className="text-btn" onClick={() => setStep(TASTE_TEST.length)}>건너뛰기</button>} />
      <main className="screen__body">
        <div className="onboard">
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={TASTE_TEST.length} aria-valuenow={step + 1}>
            <span style={{ width: `${((step + 1) / TASTE_TEST.length) * 100}%` }} />
          </div>
          <p className="onboard__eyebrow">{q.topic} · {step + 1}/{TASTE_TEST.length}</p>
          <h2 className="onboard__title">{q.question}</h2>
          <ul className="choice-list">
            {q.options.map((o) => (
              <li key={o.label}>
                <button
                  type="button"
                  className={`choice ${answers[q.id] === o.value ? 'is-on' : ''}`}
                  onClick={() => {
                    setAnswers((a) => ({ ...a, [q.id]: o.value }));
                    window.setTimeout(() => setStep((x) => x + 1), 160);
                  }}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
          <p className="onboard__note">약 {Math.max(1, Math.round(((TASTE_TEST.length - step) * 25) / 60))}분 남았어요 · 최대 4분</p>
        </div>
      </main>
    </div>
  );
}
