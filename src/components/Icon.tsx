/**
 * 임시 아이콘 세트.
 * DESIGN.md 5장: "아이콘은 Figma 원본 에셋 사용". Figma MCP 호출 한도 때문에
 * 원본 SVG를 받지 못해 같은 크기·선 굵기로 만든 대체 아이콘이다.
 * 원본 에셋을 받으면 이 파일의 path만 교체하면 되도록 이름은 Figma 레이어명을 따른다.
 */
import type { CSSProperties, ReactElement } from 'react';

export type IconName =
  | 'home' | 'search' | 'write' | 'message' | 'profile'
  | 'bell' | 'gift' | 'arrowLeft' | 'arrowRight' | 'chevronDown' | 'more'
  | 'share' | 'chat' | 'save' | 'thumbsUp' | 'mapPin' | 'send' | 'close'
  | 'flag' | 'soul' | 'expert' | 'lock' | 'warning' | 'peoplePlus' | 'sort' | 'link';

type Props = { name: IconName; size?: number; className?: string; style?: CSSProperties; title?: string };

const P: Record<IconName, ReactElement> = {
  home: <path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></>,
  write: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m9 15 1-3 5.5-5.5 2 2L12 14l-3 1z" /></>,
  message: <path d="M21 3 3 10.5l7 2.5 2.5 7z M10 13l11-10" />,
  profile: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  gift: <><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1.5S10 9 12 9c2 0 6 1 6-1.5S14 5 12 9" /></>,
  arrowLeft: <path d="M15 4 7 12l8 8" />,
  arrowRight: <path d="m9 4 8 8-8 8" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  more: <><circle cx="12" cy="5" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="19" r="1.2" fill="currentColor" /></>,
  share: <><circle cx="17" cy="5.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="17" cy="18.5" r="2.5" /><path d="m8.2 10.8 6.6-4M8.2 13.2l6.6 4" /></>,
  chat: <path d="M4 12a8 7 0 1 1 3.5 5.8L4 19.5l1.2-3.6A6.6 6.6 0 0 1 4 12z" />,
  save: <path d="M6 3.5h12V21l-6-4.5L6 21z" />,
  thumbsUp: <path d="M7 10v10H4V10zM7 10l4-7c1.6 0 2.5 1.1 2.2 2.6L12.5 9H19a2 2 0 0 1 2 2.3l-1.2 6.8A2.3 2.3 0 0 1 17.5 20H7" />,
  mapPin: <><path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  send: <path d="M21 3 3 10.5l7 2.5 2.5 7z M10 13l11-10" />,
  close: <path d="M5 5l14 14M19 5 5 19" />,
  flag: <path d="M6 21V4h11l-2.5 4L17 12H6" fill="currentColor" />,
  soul: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10zM9.5 11.5l2.5 2.5 2.5-2.5" />,
  expert: <><path d="M12 3 5 6v5c0 4.4 3 8.2 7 10 4-1.8 7-5.6 7-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  warning: <><path d="M12 3 2 20h20z" fill="currentColor" stroke="none" /><path d="M12 9v5M12 16.5v.5" stroke="var(--color-white)" /></>,
  peoplePlus: <><circle cx="9" cy="8" r="3" /><circle cx="15.5" cy="8" r="3" /><path d="M3 18c.6-3 3-4.8 6-4.8 1.2 0 2.3.3 3.2.8M12 21v-6M9 18h6" /></>,
  sort: <path d="M8 4v16M8 4 5 7M8 4l3 3M16 20V4M16 20l-3-3M16 20l3-3" />,
  link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />,
};

export function Icon({ name, size = 22, className, style, title }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {P[name]}
    </svg>
  );
}
