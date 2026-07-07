import { formatRubles } from '../../core/economy';
import { formatGameTime, formatWeekday } from '../../core/time';
import type { GameState } from '../../state';
import type { LifeAction } from '../../types/actions';
import type { DistrictId, LocationId, ActionId } from '../../types/ids';
import type { City, District, Location } from '../../types/location';
import { ActionCard } from './ActionCard';
import { LifeLog } from './LifeLog';
import { LocationPanel } from './LocationPanel';
import { StatCard } from './StatCard';

type DashboardProps = {
  gameState: GameState;
  actions: LifeAction[];
  locationState: {
    city?: City;
    district?: District;
    location?: Location;
    districts: District[];
    locations: Location[];
  };
  onPerformAction: (actionId: ActionId) => void;
  onMoveDistrict: (districtId: DistrictId) => void;
  onMoveLocation: (locationId: LocationId) => void;
  onReset: () => void;
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
  onPerformAction,
  onMoveDistrict,
  onMoveLocation,
  onReset
}: DashboardProps) {
  const { player, time, lastResult } = gameState;

  return (
    <main className="dashboard-shell">
      <section className="hero-panel">
        <div>
          <p className="hero-panel__eyebrow">LifeSim MVP</p>
          <h1 className="hero-panel__title">Москва: первый день</h1>
          <p className="hero-panel__text">
            Действия больше не висят в воздухе. Район и место определяют, что можно сделать сейчас.
          </p>
        </div>
        <button className="reset-button" type="button" onClick={onReset}>
          Сбросить
        </button>
      </section>

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

      <LocationPanel
        city={locationState.city}
        district={locationState.district}
        location={locationState.location}
        districts={locationState.districts}
        locations={locationState.locations}
        onMoveDistrict={onMoveDistrict}
        onMoveLocation={onMoveLocation}
      />

      {lastResult ? (
        <section className={`result-panel ${lastResult.ok ? 'result-panel--ok' : 'result-panel--fail'}`}>
          <p className="result-panel__eyebrow">Последний результат</p>
          <h2>{lastResult.actionName ?? 'Действие'}</h2>
          {lastResult.messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </section>
      ) : null}

      <section className="panel">
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
          <p className="empty-state">В этом месте пока нет доступных действий.</p>
        )}
      </section>

      <LifeLog entries={gameState.lifeLog} />
    </main>
  );
}
