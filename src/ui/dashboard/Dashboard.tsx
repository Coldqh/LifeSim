import { useState } from 'react';
import { useUiTheme } from '../../state';
import { formatRubles } from '../../core/economy';
import { getHousingById } from '../../data/housing/basicHousing';
import { formatGameTime, formatWeekday } from '../../core/time';
import type { GameState } from '../../state';
import type { LifeAction } from '../../types/actions';
import type { DistrictId, LocationId, ActionId, ProductId, JobId } from '../../types/ids';
import type { TravelModeId } from '../../types/transport';
import type { City, District, Location } from '../../types/location';
import type { Job } from '../../types/job';
import type { Product, Shop } from '../../types/product';
import type { DistrictTravelOption, LocationTravelOption } from '../../types/travel';
import { ActionCard } from './ActionCard';
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
  isCurrentJob: boolean;
  completedShifts: number;
  canApply: boolean;
  applicationFailure?: string;
  canWorkShift: boolean;
  shiftFailure?: string;
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
  };
  onPerformAction: (actionId: ActionId) => void;
  onMoveDistrict: (districtId: DistrictId, modeId: TravelModeId) => void;
  onMoveLocation: (locationId: LocationId, modeId: TravelModeId) => void;
  onBuyProduct: (productId: ProductId) => void;
  onUseInventoryItem: (productId: ProductId) => void;
  onApplyForJob: (jobId: JobId) => void;
  onWorkShift: (jobId: JobId) => void;
  onReset: () => void;
};

function needTone(value: number): 'default' | 'good' | 'warning' {
  if (value <= 25) return 'warning';
  if (value >= 75) return 'good';

  return 'default';
}

function getTabClassName(tab: DashboardTab, activeTab: DashboardTab): string {
  return `side-tab ${tab === activeTab ? 'side-tab--active' : ''}`;
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
  onWorkShift,
  onReset
}: DashboardProps) {
  const { player, time, lastResult } = gameState;
  const housing = getHousingById(player.housingId);
  const [activeTab, setActiveTab] = useState<DashboardTab>('character');
  const { theme, toggleTheme } = useUiTheme();

  return (
    <main className="app-layout">
      <aside className="side-panel" aria-label="Навигация LifeSim">
        <div className="side-panel__brand">
          <span>LifeSim</span>
          <small>Москва MVP</small>
        </div>

        <button className="theme-toggle" type="button" onClick={toggleTheme}>
          <span>{theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}</span>
          <small>Переключить на {theme === 'dark' ? 'светлую' : 'тёмную'}</small>
        </button>

        <nav className="side-tabs" aria-label="Основные вкладки">
          <button className={getTabClassName('character', activeTab)} type="button" onClick={() => setActiveTab('character')}>
            <span>Персонаж</span>
            <small>статы и инвентарь</small>
          </button>
          <button className={getTabClassName('city', activeTab)} type="button" onClick={() => setActiveTab('city')}>
            <span>Город</span>
            <small>места и действия</small>
          </button>
          <button className={getTabClassName('jobs', activeTab)} type="button" onClick={() => setActiveTab('jobs')}>
            <span>Работа</span>
            <small>вакансии и смены</small>
          </button>
          <button className={getTabClassName('log', activeTab)} type="button" onClick={() => setActiveTab('log')}>
            <span>Лог</span>
            <small>архив жизни</small>
          </button>
        </nav>

        <button className="reset-button reset-button--wide" type="button" onClick={onReset}>
          Сбросить
        </button>
      </aside>

      <section className="dashboard-shell">
        <section className="hero-panel">
          <div>
            <p className="hero-panel__eyebrow">LifeSim MVP</p>
            <h1 className="hero-panel__title">
              {locationState.city?.name ?? 'Город'} · {locationState.district?.name ?? 'Район'}
            </h1>
            <p className="hero-panel__text">
              Текущее место: {locationState.location?.name ?? 'не найдено'}. Работа теперь проходит через вакансии, места и смены.
            </p>
          </div>
        </section>

        {lastResult ? (
          <section className={`result-panel ${lastResult.ok ? 'result-panel--ok' : 'result-panel--fail'}`}>
            <p className="result-panel__eyebrow">Последний результат</p>
            <h2>{lastResult.actionName ?? 'Действие'}</h2>
            {lastResult.messages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </section>
        ) : null}

        {activeTab === 'character' ? (
          <>
            <section className="stats-grid" aria-label="Состояние игрока">
              <StatCard label="День" value={time.day} helper={formatWeekday(time.weekday)} />
              <StatCard label="Время" value={formatGameTime(time)} helper="часы уходят за действия" />
              <StatCard label="Деньги" value={formatRubles(player.money)} helper="наличные" tone="good" />
              <StatCard label="Энергия" value={player.needs.energy} helper="0–100" tone={needTone(player.needs.energy)} />
              <StatCard label="Еда" value={player.needs.hunger} helper="голод" tone={needTone(player.needs.hunger)} />
              <StatCard label="Вода" value={player.needs.thirst} helper="жажда" tone={needTone(player.needs.thirst)} />
              <StatCard label="Здоровье" value={player.needs.health} helper="тело" tone={needTone(player.needs.health)} />
              <StatCard label="Настроение" value={player.needs.mood} helper="фон" tone={needTone(player.needs.mood)} />
            </section>

            <HousingPanel housing={housing} player={player} />

            <InventoryPanel inventory={player.inventory} onUseInventoryItem={onUseInventoryItem} />
          </>
        ) : null}

        {activeTab === 'city' ? (
          <>
            <LocationPanel
              city={locationState.city}
              district={locationState.district}
              location={locationState.location}
              districtTravelOptions={locationState.districtTravelOptions}
              locationTravelOptions={locationState.locationTravelOptions}
              onMoveDistrict={onMoveDistrict}
              onMoveLocation={onMoveLocation}
            />

            <ShopPanel shop={locationState.shop} products={locationState.shopProducts} onBuyProduct={onBuyProduct} />

            <section className="panel actions-panel">
              <div className="panel__header">
                <p className="panel__eyebrow">Действия</p>
                <h2 className="panel__title">Доступно здесь</h2>
              </div>

              {actions.length > 0 ? (
                <div className="actions-grid">
                  {actions.map((action) => (
                    <ActionCard action={action} key={action.id} onPerform={onPerformAction} />
                  ))}
                </div>
              ) : (
                <p className="empty-state">В этом месте нет обычных действий. Если это магазин, кафе или работа — смотри соответствующую вкладку.</p>
              )}
            </section>
          </>
        ) : null}

        {activeTab === 'jobs' ? (
          <JobPanel
            currentJob={jobState.currentJob}
            jobs={jobState.jobs}
            onApplyForJob={onApplyForJob}
            onWorkShift={onWorkShift}
          />
        ) : null}

        {activeTab === 'log' ? <LifeLog entries={gameState.lifeLog} /> : null}
      </section>
    </main>
  );
}
