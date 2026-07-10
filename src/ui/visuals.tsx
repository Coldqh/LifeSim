import type { ProductCategory } from '../types/product';
import type { LocationType } from '../types/location';
import cityRiver from '../assets/ui/city-river.webp';
import citySkyline from '../assets/ui/moscow-skyline.webp';
import coffeeCorner from '../assets/ui/coffee-corner.webp';
import { Icon, type IconName } from './icons';

type CharacterSceneProps = {
  initial: string;
  cityName: string;
  day: number;
};

export function CharacterScene({ initial, cityName, day }: CharacterSceneProps) {
  return (
    <div className="character-scene" aria-hidden="true">
      <img alt="" src={citySkyline} />
      <div className="character-scene__grid" />
      <svg className="character-scene__portrait" viewBox="0 0 260 320" role="presentation">
        <defs>
          <linearGradient id="characterBody" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#182736" />
            <stop offset="1" stopColor="#06090d" />
          </linearGradient>
          <linearGradient id="characterRim" x1="0" x2="1">
            <stop stopColor="#54d9ff" stopOpacity=".9" />
            <stop offset="1" stopColor="#68f6cf" stopOpacity=".1" />
          </linearGradient>
        </defs>
        <path fill="url(#characterBody)" d="M63 320c5-72 30-115 74-124-27-17-39-45-31-77 8-36 34-58 69-58 38 0 67 27 70 65 2 31-11 55-37 72 42 13 66 53 70 122H63Z"/>
        <path fill="none" stroke="url(#characterRim)" strokeWidth="3" d="M74 320c7-60 29-99 67-115-30-20-42-48-32-83 9-33 34-52 66-52"/>
        <circle cx="183" cy="107" r="2" fill="#a8fff1"/>
      </svg>
      <div className="character-scene__monogram">{initial}</div>
      <div className="character-scene__meta">
        <span>{cityName}</span>
        <strong>DAY {String(day).padStart(2, '0')}</strong>
      </div>
    </div>
  );
}

type LocationSceneProps = {
  type?: LocationType;
  title: string;
  subtitle: string;
};

const LOCATION_SCENES: Partial<Record<LocationType, { icon: IconName; tone: string; image?: string }>> = {
  home: { icon: 'home', tone: 'home' },
  cafe: { icon: 'coffee', tone: 'cafe', image: coffeeCorner },
  restaurant: { icon: 'food', tone: 'cafe', image: coffeeCorner },
  food_court: { icon: 'food', tone: 'cafe', image: coffeeCorner },
  shop: { icon: 'shop', tone: 'commerce' },
  pharmacy: { icon: 'medicine', tone: 'health' },
  clinic: { icon: 'heart', tone: 'health' },
  fitness: { icon: 'gym', tone: 'sport' },
  sport_ground: { icon: 'gym', tone: 'sport' },
  boxing_gym: { icon: 'gym', tone: 'sport' },
  pool: { icon: 'water', tone: 'sport' },
  workplace: { icon: 'briefcase', tone: 'work' },
  business_center: { icon: 'building', tone: 'work' },
  coworking: { icon: 'building', tone: 'work' },
  warehouse: { icon: 'package', tone: 'service' },
  park: { icon: 'sparkle', tone: 'park' }
};

export function LocationScene({ type, title, subtitle }: LocationSceneProps) {
  const scene = type ? LOCATION_SCENES[type] : undefined;
  const icon = scene?.icon ?? 'pin';
  const tone = scene?.tone ?? 'city';
  const image = scene?.image ?? cityRiver;

  return (
    <div className={`location-scene location-scene--${tone}`}>
      <img alt="" src={image} />
      <div className="location-scene__veil" />
      <div className="location-scene__radar" aria-hidden="true"><i/><i/><i/></div>
      <div className="location-scene__content">
        <div className="location-scene__icon"><Icon name={icon} size={25} /></div>
        <div>
          <span>{subtitle}</span>
          <strong>{title}</strong>
        </div>
      </div>
      <div className="location-scene__signal"><span/> LIVE CITY DATA</div>
    </div>
  );
}

export function HousingScene({ imageSrc }: { imageSrc?: string }) {
  return (
    <div className="housing-scene" aria-hidden="true">
      {imageSrc ? <img className="housing-scene__image" alt="" decoding="async" src={imageSrc} /> : null}
      {!imageSrc ? <svg viewBox="0 0 420 220" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="wall" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#172735"/><stop offset="1" stopColor="#080b10"/></linearGradient>
          <linearGradient id="window" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#54caff"/><stop offset="1" stopColor="#173a5c"/></linearGradient>
        </defs>
        <rect width="420" height="220" fill="url(#wall)"/>
        <rect x="230" y="22" width="152" height="105" fill="url(#window)" opacity=".78"/>
        <path stroke="#8be7ff" strokeOpacity=".24" d="M280 22v105M330 22v105M230 75h152"/>
        <rect x="32" y="130" width="250" height="55" fill="#111820"/>
        <rect x="48" y="114" width="140" height="24" fill="#253644"/>
        <rect x="300" y="132" width="55" height="53" fill="#14202a"/>
        <path stroke="#70e8c4" strokeWidth="3" d="M322 132V85M309 87h26"/>
        <circle cx="322" cy="78" r="13" fill="#ffd48a" opacity=".7"/>
        <path fill="#0a0d11" d="M0 185h420v35H0z"/>
      </svg> : null}
      <div className="housing-scene__glow" />
    </div>
  );
}

export function WorkplaceScene() {
  return (
    <div className="workplace-scene" aria-hidden="true">
      <img alt="" src={citySkyline} />
      <div className="workplace-scene__glass" />
      <svg viewBox="0 0 580 240" preserveAspectRatio="none">
        <path fill="#0b1016" fillOpacity=".74" d="M0 160h580v80H0z"/>
        <path stroke="#5ce5ff" strokeOpacity=".16" d="M0 160h580M90 0v240M210 0v240M335 0v240M470 0v240"/>
        <path fill="#121b23" d="M55 155h155v10H55zM92 122h72v35H92zM320 146h205v12H320zM370 106h84v42h-84z"/>
        <circle cx="492" cy="54" r="42" fill="none" stroke="#65e9d0" strokeOpacity=".28" strokeWidth="2"/>
        <circle cx="492" cy="54" r="27" fill="none" stroke="#65e9d0" strokeOpacity=".12"/>
      </svg>
      <div className="workplace-scene__scan" />
    </div>
  );
}

type ProductGlyphProps = {
  category?: ProductCategory;
  imageSrc?: string;
  alt?: string;
};

const PRODUCT_ICONS: Record<ProductCategory, IconName> = {
  food: 'food',
  drink: 'water',
  coffee: 'coffee',
  medicine: 'medicine',
  other: 'package'
};

export function ProductGlyph({ category = 'other', imageSrc, alt = '' }: ProductGlyphProps) {
  return (
    <span className={`product-glyph product-glyph--${category} ${imageSrc ? 'product-glyph--image' : ''}`} aria-hidden={imageSrc ? undefined : true}>
      {imageSrc ? <img alt={alt} decoding="async" loading="lazy" src={imageSrc} /> : <><i /><Icon name={PRODUCT_ICONS[category]} size={20} /></>}
    </span>
  );
}

export function CommerceScene({ title }: { title: string }) {
  return (
    <div className="commerce-scene" aria-hidden="true">
      <img alt="" src={coffeeCorner} />
      <div className="commerce-scene__veil" />
      <div className="commerce-scene__copy">
        <span>ГОРОДСКОЙ КАТАЛОГ</span>
        <strong>{title}</strong>
      </div>
      <div className="commerce-scene__orbit"><Icon name="sparkle" size={18} /></div>
    </div>
  );
}
