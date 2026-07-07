import { formatRubles } from '../../core/economy';
import { formatGameTime, formatWeekday } from '../../core/time';
import type { GameState } from '../../state';
import type { LifeAction } from '../../types/actions';
import type { ActionId } from '../../types/ids';
import { ActionCard } from './ActionCard';
import { LifeLog } from './LifeLog';
import { StatCard } from './StatCard';

type DashboardProps = {
  gameState: GameState;
  actions: LifeAction[];
  onPerformAction: (actionId: ActionId) => void;
  onReset: () => void;
};

function needTone(value: number): 'default' | 'good' | 'warning' {
  if (value <= 25) return 'warning';
  if (value >= 75) return 'good';

  return 'default';
}

export function Dashboard({ gameState, actions, onPerformAction, onReset }: DashboardProps) {
  const { player, time, lastResult } = gameState;

  return (
    <main className="dashboard-shell">
      <section className="hero-panel">
        <div>
          <p className="hero-panel__eyebrow">LifeSim MVP</p>
          <h1 className="hero-panel__title">Первый день взрослой жизни</h1>
          <p className="hero-panel__text">
            Деньги, время и базовые потребности уже работают. Городские системы появятся позже.
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
          <h2 className="panel__title">Что делать сейчас</h2>
        </div>

        <div className="actions-grid">
          {actions.map((action) => (
            <ActionCard action={action} key={action.id} onPerform={onPerformAction} />
          ))}
        </div>
      </section>

      <LifeLog entries={gameState.lifeLog} />
    </main>
  );
}
