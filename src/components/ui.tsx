import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/* ---------- Button (DESIGN.md 4-1) ---------- */
type BtnVariant = 'primary' | 'secondary' | 'small' | 'smallOutline';
export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button type="button" className={`btn btn--${variant} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/* ---------- Icon + Count 버튼 ---------- */
export function IconCount({ icon, count, label }: { icon: IconName; count?: string; label: string }) {
  return (
    <button type="button" className="icon-count" aria-label={label}>
      <Icon name={icon} />
      {count && <span>{count}</span>}
    </button>
  );
}

/* ---------- Badges (DESIGN.md 4-4) ---------- */
export function SoulBadge() {
  return (
    <span className="badge badge--soul" aria-label="소울 배지">
      <Icon name="soul" size={12} style={{ color: 'var(--color-brown600)' }} />
    </span>
  );
}

export function ExpertBadge({ label }: { label: string }) {
  return (
    <span className="badge badge--expert">
      <Icon name="expert" size={12} />
      {label}
    </span>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ size = 40, src }: { size?: number; src?: string }) {
  return (
    <span className="avatar" style={{ width: size, height: size }} aria-hidden>
      {src && <img src={src} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} />}
    </span>
  );
}

/* ---------- Image (src 없으면 Figma 체크무늬 자리표시) ---------- */
export function ImageBox({
  ratio,
  src,
  alt = '',
  className = '',
  children,
}: {
  ratio: string;
  src?: string;
  alt?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`image-box ${className}`} style={{ aspectRatio: ratio }}>
      {src && (
        <img
          className="image-box__img"
          src={src}
          alt={alt}
          loading="lazy"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
      {children}
    </div>
  );
}

/* ---------- Header: 메인 (선물 · 로고 · 알림) ---------- */
export function MainHeader({ onGift, onBell, hasNew = true }: { onGift: () => void; onBell: () => void; hasNew?: boolean }) {
  return (
    <header className="main-header">
      <button type="button" className="main-header__btn" onClick={onGift} aria-label="이벤트">
        <Icon name="gift" />
      </button>
      <span className="main-header__logo" aria-label="Twinsy">T</span>
      <button type="button" className="main-header__btn" onClick={onBell} aria-label="알림">
        <Icon name="bell" />
        {hasNew && <span className="main-header__dot" />}
      </button>
    </header>
  );
}

/* ---------- Header: 서브 (DESIGN.md 4-6) ---------- */
export function SubHeader({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="sub-header">
      <div className="sub-header__side">
        {onBack && (
          <button type="button" className="sub-header__btn" onClick={onBack} aria-label="뒤로">
            <Icon name="arrowLeft" />
          </button>
        )}
      </div>
      <h1 className="sub-header__title">{title}</h1>
      <div className="sub-header__side sub-header__side--right">{right}</div>
    </header>
  );
}

/* ---------- 탭 (취향콕 / 추천) ---------- */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          className={`tabs__item ${value === t.id ? 'is-active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- 하단 내비게이션 (DESIGN.md 4-6) ---------- */
const NAV: { id: string; icon: IconName; label: string }[] = [
  { id: 'home', icon: 'home', label: '홈' },
  { id: 'search', icon: 'search', label: '검색' },
  { id: 'write', icon: 'write', label: '작성' },
  { id: 'message', icon: 'message', label: '메시지' },
  { id: 'profile', icon: 'profile', label: '마이프로필' },
];
export function BottomNav({ active = 'home', onHome }: { active?: string; onHome?: () => void }) {
  return (
    <nav className="bottom-nav" aria-label="하단 메뉴">
      {NAV.map((n) => (
        <button
          key={n.id}
          type="button"
          className={`bottom-nav__item ${active === n.id ? 'is-active' : ''}`}
          aria-label={n.label}
          aria-current={active === n.id ? 'page' : undefined}
          onClick={n.id === 'home' ? onHome : undefined}
        >
          <Icon name={n.icon} size={26} />
        </button>
      ))}
    </nav>
  );
}

/* ---------- Bottom Sheet (DESIGN.md 4-5) ---------- */
export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="dim" onClick={onClose}>
      <section className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <span className="sheet__grabber" />
        {title && <h2 className="sheet__title">{title}</h2>}
        {children}
      </section>
    </div>
  );
}

/* ---------- Toast ---------- */
export function Toast({ children }: { children: ReactNode }) {
  return <div className="toast" role="status">{children}</div>;
}
