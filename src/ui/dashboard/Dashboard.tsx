import { useState } from 'react';
import { useUiTheme } from '../../state';
import { formatRubles } from '../../core/economy';
import { getNeedsDecayDelta } from '../../core/needs';
import { getHousingById } from '../../data/housing/basicHousing';
import { formatGameTime, formatWeekday } from '../../core/time';
import type { GameState } from '../../state';
import type { LifeAction } from '../../types/actions';
import type { DistrictId, LocationId, ActionId, ProductId, JobId } from '../../types/ids';
import type { TravelModeId } from '../../types/transport';
import type { City, District, Location } from '../../types/location';
import type { Job, JobLevel } from '../../types/job';
import type { Product, Shop } from '../../types/product';
import type { DistrictTravelOption, LocationTravelOption } from '../../types/travel';
import { Icon, type IconName } from '../icons';
import { CharacterScene } from '../visuals';
import { ActionCard } from './ActionCard';
import { createNeedsEffectItems, EffectList } from './EffectList';
import { HousingPanel } from './HousingPanel';
import { InventoryPanel } from './InventoryPanel';
import { JobPanel } from './JobPanel';
import { LifeLog } from './LifeLog';
import { LocationPanel } from './LocationPanel';
import { ShopPanel } from './ShopPanel';
import { StatCard } from './StatCard';

type DashboardTab = 'character' | 'city' | 'jobs' | 'log';

type JobView = {
  job: Job;
  location?: Location;
  district?: District;
  jobLevel: JobLevel;
  nextJobLevel?: JobLevel;
  currentLevel: number;
  maxLevel: number;
  isCurrentJob: boolean;
  completedShifts: number;
  jobExperience: number;
  levelExperience: number;
  levelExperienceRequired: number;
  promotionThreshold?: number;
  experienceRemaining: number;
  progressPercent: number;
  isMaxLevel: boolean;
  canApply: boolean;
  applicationFailure?: string;
  canWorkShift: boolean;
  shiftFailure?: string;
  canPromote: boolean;
  promotionFailure?: string;
};

type DashboardProps = {
  gameState: GameState;
  actions: LifeAction[];
  locationState: {
    city?: City;
    district?: District;
    location?: Location;
    districts: District[];
    locations: Location[];
    shop?: Shop;
    shopProducts: Product[];
    locationTravelOptions: LocationTravelOption[];
    districtTravelOptions: DistrictTravelOption[];
  };
  jobState: {
    jobs: JobView[];
    currentJob?: Job;
    currentJobView?: JobView;
    currentLocationJobs: JobView[];
  };
  onPerformAction: (actionId: ActionId) => void;
  onMoveDistrict: (districtId: DistrictId, modeId: TravelModeId) => void;
  onMoveLocation: (locationId: LocationId, modeId: TravelModeId) => void;
  onBuyProduct: (productId: ProductId) => void;
  onUseInventoryItem: (productId: ProductId) => void;
  onApplyForJob: (jobId: JobId) => void;
  onPromoteJob: (jobId: JobId) => void;
  onWorkShift: (jobId: JobId) => void;
  onReset: () => void;
};

type NavigationItem = { id: DashboardTab; label: string; icon: IconName };

const NAVIGATION: NavigationItem[] = [
  { id: 'character', label: 'Персонаж', icon: 'character' },
  { id: 'city', label: 'Город', icon: 'city' },
  { id: 'jobs', label: 'Работа', icon: 'work' },
  { id: 'log', label: 'Журнал', icon: 'log' }
];

const PAGE_TITLES: Record<DashboardTab, { title: string; eyebrow: string }> = {
  character: { title: 'Состояние', eyebrow: 'Личная панель' },
  city: { title: 'Город', eyebrow: 'Москва' },
  jobs: { title: 'Работа', eyebrow: 'Карьера' },
  log: { title: 'Журнал', eyebrow: 'Хронология' }
};

function needTone(value: number): 'default' | 'good' | 'warning' {
  if (value <= 25) return 'warning';
  if (value >= 75) return 'good';
  return 'default';
}

export function Dashboard({
  gameState,
  actions,
  locationState,
  jobState,
  onPerformAction,
  onMoveDistrict,
  onMoveLocation,
  onBuyProduct,
  onUseInventoryItem,
  onApplyForJob,
  onPromoteJob,
  onWorkShift,
  onReset
}: DashboardProps) {
  const { player, time, lastResult } = gameState;
  const housing = getHousingById(player.housingId);
  const [activeTab, setActiveTab] = useState<DashboardTab>('character');
  const { theme, toggleTheme } = useUiTheme();
  const activeHourDecayItems = createNeedsEffectItems(getNeedsDecayDelta(60, 'active'));
  const page = PAGE_TITLES[activeTab];

  function handleResetClick(): void {
    if (window.confirm('Сбросить сохранение LifeSim? Это действие нельзя отменить.')) onReset();
  }

  return (
    <main className="app-frame">
      <div className="ambient-canvas" aria-hidden="true"><i/><i/><i/><span/></div>

      <aside className="desktop-navigation" aria-label="Навигация LifeSim">
        <div className="brand-block" aria-label="LifeSim">
          <span className="brand-block__mark">LS<i /></span>
          <div><strong>LIFESIM</strong><small>URBAN LIFE SYSTEM</small></div>
        </div>

        <nav className="primary-navigation" aria-label="Разделы игры">
          {NAVIGATION.map((item) => (
            <button
              aria-current={activeTab === item.id ? 'page' : undefined}
              className={`navigation-item ${activeTab === item.id ? 'navigation-item--active' : ''}`}
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
            >
              <span className="navigation-item__icon"><Icon name={item.icon} size={20} /></span>
              <span>{item.label}</span>
              <i className="navigation-item__signal" />
            </button>
          ))}
        </nav>

        <div className="navigation-motto">
          <Icon name="sparkle" size={17} />
          <span>Твой город.<br/>Твоя история.</span>
        </div>

        <div className="desktop-navigation__footer">
          <button className="utility-button" type="button" onClick={toggleTheme}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
          </button>
          <button className="utility-button utility-button--danger" type="button" onClick={handleResetClick}>
            <Icon name="reset" size={18} /><span>Сбросить игру</span>
          </button>
        </div>
      </aside>

      <section className="app-workspace">
        <header className="top-status-bar">
          <div className="page-identity">
            <span>{page.eyebrow}</span>
            <h1>{page.title}</h1>
          </div>

          <div className="global-status" aria-label="Текущее состояние">
            <div className="global-status__item global-status__item--location">
              <Icon name="pin" size={17} />
              <div><span>{locationState.district?.name ?? 'Район'}</span><strong>{locationState.location?.name ?? 'Место'}</strong></div>
            </div>
            <div className="global-status__item">
              <Icon name="clock" size={17} />
              <div><span>День {time.day} · {formatWeekday(time.weekday)}</span><strong>{formatGameTime(time)}</strong></div>
            </div>
            <div className="global-status__item global-status__item--money">
              <Icon name="wallet" size={17} />
              <div><span>Баланс</span><strong>{formatRubles(player.money)}</strong></div>
            </div>
            <button className="icon-button top-theme-toggle" aria-label="Переключить тему" type="button" onClick={toggleTheme}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
            </button>
          </div>
        </header>

        <div className="workspace-content">
          {lastResult ? (
            <section className={`activity-notice ${lastResult.ok ? 'activity-notice--success' : 'activity-notice--error'}`}>
              <div className="activity-notice__icon"><Icon name={lastResult.ok ? 'sparkle' : 'close'} size={18} /></div>
              <div><span>{lastResult.actionName ?? 'Последнее действие'}</span><strong>{lastResult.messages[0] ?? 'Состояние обновлено'}</strong></div>
              {lastResult.messages.length > 1 ? <small>+{lastResult.messages.length - 1}</small> : null}
            </section>
          ) : null}

          {activeTab === 'character' ? (
            <section className="screen screen-enter character-screen">
              <section className="profile-command-panel visual-panel">
                <CharacterScene initial={player.name.slice(0, 1).toUpperCase()} cityName={locationState.city?.name ?? 'Москва'} day={time.day} />
                <div className="profile-command-panel__overlay">
                  <div className="profile-command-panel__identity">
                    <div className="profile-avatar" aria-hidden="true">{player.name.slice(0, 1).toUpperCase()}</div>
                    <div><span className="section-kicker">Персонаж</span><h2>{player.name}</h2><p>{player.age} лет · {locationState.city?.name ?? 'Москва'}</p></div>
                  </div>
                  <div className="profile-command-panel__quick">
                    <div><span>Жильё</span><strong>{housing?.name ?? 'Нет жилья'}</strong></div>
                    <div><span>Работа</span><strong>{jobState.currentJobView?.jobLevel.title ?? 'Нет работы'}</strong></div>
                    <div><span>Сейчас</span><strong>{formatGameTime(time)}</strong></div>
                  </div>
                </div>
              </section>

              <section className="panel vitals-panel visual-panel">
                <div className="vitals-panel__aurora" aria-hidden="true" />
                <div className="section-heading">
                  <div><span className="section-kicker">Состояние</span><h2>Показатели жизни</h2></div>
                  <div className="decay-summary"><span>Расход за активный час</span><EffectList items={activeHourDecayItems} /></div>
                </div>

                <div className="vitals-grid" aria-label="Состояние игрока">
                  <StatCard icon="energy" label="Энергия" value={player.needs.energy} progress={player.needs.energy} tone={needTone(player.needs.energy)} />
                  <StatCard icon="food" label="Сытость" value={player.needs.hunger} progress={player.needs.hunger} tone={needTone(player.needs.hunger)} />
                  <StatCard icon="water" label="Вода" value={player.needs.thirst} progress={player.needs.thirst} tone={needTone(player.needs.thirst)} />
                  <StatCard icon="heart" label="Здоровье" value={player.needs.health} progress={player.needs.health} tone={needTone(player.needs.health)} />
                  <StatCard icon="smile" label="Настроение" value={player.needs.mood} progress={player.needs.mood} tone={needTone(player.needs.mood)} />
                </div>
              </section>

              <div className="character-data-grid">
                <HousingPanel housing={housing} player={player} />
                <InventoryPanel inventory={player.inventory} onUseInventoryItem={onUseInventoryItem} />
              </div>
            </section>
          ) : null}

          {activeTab === 'city' ? (
            <section className="screen screen-enter city-screen">
              <div className="city-main-column">
                <LocationPanel
                  city={locationState.city}
                  district={locationState.district}
                  location={locationState.location}
                  districtTravelOptions={locationState.districtTravelOptions}
                  locationTravelOptions={locationState.locationTravelOptions}
                  locationJobs={jobState.currentLocationJobs}
                  onMoveDistrict={onMoveDistrict}
                  onMoveLocation={onMoveLocation}
                  onApplyForJob={onApplyForJob}
                />
              </div>

              <aside className="context-column">
                <ShopPanel shop={locationState.shop} products={locationState.shopProducts} onBuyProduct={onBuyProduct} />
                <section className="panel actions-panel visual-panel">
                  <div className="actions-panel__beam" aria-hidden="true" />
                  <div className="section-heading section-heading--compact">
                    <div><span className="section-kicker">Текущее место</span><h2>Действия</h2></div>
                    <span className="section-counter">{actions.length}</span>
                  </div>
                  {actions.length > 0 ? (
                    <div className="actions-list">{actions.map((action) => <ActionCard action={action} key={action.id} onPerform={onPerformAction} />)}</div>
                  ) : (
                    <div className="empty-state compact-empty-state">Нет доступных действий</div>
                  )}
                </section>
              </aside>
            </section>
          ) : null}

          {activeTab === 'jobs' ? <section className="screen screen-enter narrow-screen"><JobPanel currentJobView={jobState.currentJobView} onPromoteJob={onPromoteJob} onWorkShift={onWorkShift} /></section> : null}
          {activeTab === 'log' ? <section className="screen screen-enter narrow-screen"><LifeLog entries={gameState.lifeLog} /></section> : null}
        </div>
      </section>

      <nav className="mobile-navigation" aria-label="Мобильная навигация">
        {NAVIGATION.map((item) => (
          <button
            aria-current={activeTab === item.id ? 'page' : undefined}
            className={activeTab === item.id ? 'mobile-navigation__item mobile-navigation__item--active' : 'mobile-navigation__item'}
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
          >
            <Icon name={item.icon} size={21} /><span>{item.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
