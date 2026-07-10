import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'character'
  | 'city'
  | 'work'
  | 'log'
  | 'sun'
  | 'moon'
  | 'clock'
  | 'wallet'
  | 'pin'
  | 'home'
  | 'bag'
  | 'shop'
  | 'search'
  | 'arrow'
  | 'close'
  | 'reset'
  | 'walk'
  | 'metro'
  | 'taxi'
  | 'pulse'
  | 'briefcase'
  | 'chevron';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const PATHS: Record<IconName, ReactNode> = {
  character: <><circle cx="12" cy="8" r="3"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></>,
  city: <><path d="M3 21V7l6-3v17"/><path d="M9 21V10l6-3v14"/><path d="M15 21V5l6 3v13"/><path d="M6 10h.01M6 14h.01M12 13h.01M12 17h.01M18 10h.01M18 14h.01"/></>,
  work: <><rect x="3" y="7" width="18" height="13" rx="1"/><path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2"/></>,
  log: <><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
  moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.8 6.8 0 0 0 21 12.8Z"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  wallet: <><path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12"/><path d="M15 11h5v4h-5a2 2 0 0 1 0-4Z"/></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-6h6v6"/></>,
  bag: <><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></>,
  shop: <><path d="M4 10v10h16V10"/><path d="M3 4h18l-2 6H5L3 4Z"/><path d="M8 20v-6h8v6"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  reset: <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/></>,
  walk: <><circle cx="13" cy="4" r="2"/><path d="m10 22 2-7-3-3 2-5 4 3 3 1M15 22l-2-7 3-2"/></>,
  metro: <><rect x="5" y="3" width="14" height="16" rx="2"/><path d="M8 7h8M8 12h8M9 19l-2 2M15 19l2 2"/></>,
  taxi: <><path d="M4 17h16l-1-7-2-4H7l-2 4-1 7Z"/><path d="M7 6h10M6 13h12M7 20v-3M17 20v-3"/></>,
  pulse: <><path d="M3 12h4l2-5 4 10 2-5h6"/></>,
  briefcase: <><rect x="3" y="7" width="18" height="13"/><path d="M8 7V4h8v3M3 12h18"/></>,
  chevron: <path d="m9 6 6 6-6 6"/>
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
