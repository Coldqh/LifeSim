import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'character'
  | 'users'
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
  | 'bus'
  | 'metro'
  | 'taxi'
  | 'pulse'
  | 'briefcase'
  | 'chevron'
  | 'energy'
  | 'food'
  | 'water'
  | 'heart'
  | 'smile'
  | 'sparkle'
  | 'coffee'
  | 'medicine'
  | 'package'
  | 'star'
  | 'building'
  | 'gym'
  | 'growth'
  | 'book'
  | 'boxing';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const PATHS: Record<IconName, ReactNode> = {
  character: <><circle cx="12" cy="8" r="3"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></>,
  users: <><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M14 15a5 5 0 0 1 7 5"/></>,
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
  bus: <><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M7 7h10M7 12h10M7 19v2M17 19v2"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/></>,
  metro: <><rect x="5" y="3" width="14" height="16" rx="2"/><path d="M8 7h8M8 12h8M9 19l-2 2M15 19l2 2"/></>,
  taxi: <><path d="M4 17h16l-1-7-2-4H7l-2 4-1 7Z"/><path d="M7 6h10M6 13h12M7 20v-3M17 20v-3"/></>,
  pulse: <><path d="M3 12h4l2-5 4 10 2-5h6"/></>,
  briefcase: <><rect x="3" y="7" width="18" height="13"/><path d="M8 7V4h8v3M3 12h18"/></>,
  chevron: <path d="m9 6 6 6-6 6"/>,
  energy: <path d="M13 2 5 14h6l-1 8 9-13h-6V2Z"/>,
  food: <><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10"/><path d="M16 3v18M16 3c3 2 4 5 4 8h-4"/></>,
  water: <path d="M12 2s6 7 6 12a6 6 0 1 1-12 0c0-5 6-12 6-12Z"/>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
  smile: <><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></>,
  sparkle: <><path d="m12 2 1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></>,
  coffee: <><path d="M5 8h11v7a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8Z"/><path d="M16 10h2a3 3 0 0 1 0 6h-2M8 3v2M12 3v2"/></>,
  medicine: <><path d="M9 3h6v4H9z"/><path d="M8 7h8l2 4v10H6V11l2-4Z"/><path d="M9 15h6M12 12v6"/></>,
  package: <><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/></>,
  star: <path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8l3-6Z"/>,
  building: <><path d="M5 21V4h10v17M15 9h4v12M8 8h4M8 12h4M8 16h4"/></>,
  gym: <><path d="M6 9v6M3 10v4M18 9v6M21 10v4M6 12h12"/></>,
  growth: <><path d="M4 19V9M10 19V5M16 19v-7M3 19h18"/><path d="m4 10 5-4 5 3 6-6"/></>,
  book: <><path d="M4 5a3 3 0 0 1 3-2h5v17H7a3 3 0 0 0-3 2V5Z"/><path d="M20 5a3 3 0 0 0-3-2h-5v17h5a3 3 0 0 1 3 2V5Z"/></>,
  boxing: <><path d="M8 4h5a3 3 0 0 1 3 3v2h1a3 3 0 0 1 3 3v3a4 4 0 0 1-4 4H9a5 5 0 0 1-5-5V9a3 3 0 0 1 3-3h1V4Z"/><path d="M8 6v5M12 5v5M16 9v4M7 19v2h9v-2"/></>
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
