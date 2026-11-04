import { Icon } from '../components/Icon';
import { BottomNav, ImageBox, SubHeader } from '../components/ui';
import { EVENTS } from '../data/mock';
import { IMG } from '../data/images';
import type { Nav } from '../App';

/** Main_01_6-1 이벤트 목록 */
export function EventListScreen({ nav }: { nav: Nav }) {
  return (
    <div className="screen">
      <SubHeader title="이벤트" onBack={() => nav('main-pick')} />
      <main className="screen__body">
        <ul className="event-list">
          {EVENTS.map((e) => (
            <li key={e.id}>
              <button type="button" className="event-card" onClick={() => nav('event-detail')}>
                <ImageBox ratio="324 / 230" src={e.image} alt={e.title} className="event-card__image" />
                <strong className="event-card__title">{e.title}</strong>
                <p className="event-card__desc">{e.desc}</p>
                <span className="event-card__period">{e.period}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
      <BottomNav onHome={() => nav('main-pick')} />
    </div>
  );
}

/** Main_01_6-2 이벤트 상세 */
export function EventDetailScreen({ nav }: { nav: Nav }) {
  const e = EVENTS[0];
  return (
    <div className="screen">
      <SubHeader
        title={e.title}
        onBack={() => nav('events')}
        right={
          <button type="button" className="sub-header__btn" aria-label="공유">
            <Icon name="share" />
          </button>
        }
      />
      <main className="screen__body">
        <ImageBox ratio="360 / 330" src={e.image} alt={e.title} className="event-detail__hero" />
        <section className="event-detail__benefit">
          <span className="event-detail__num">01</span>
          <h2 className="event-detail__heading">신규 가입 혜택</h2>
          <p className="event-detail__desc">{e.desc}</p>
        </section>
        <ImageBox ratio="360 / 260" src={IMG.koreanTable} alt="취향이 비슷한 사람들과 나누는 한 상" className="event-detail__visual" />
      </main>
      <BottomNav onHome={() => nav('main-pick')} />
    </div>
  );
}
