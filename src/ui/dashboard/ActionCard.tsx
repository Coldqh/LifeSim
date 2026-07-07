import type { LifeAction } from '../../types/actions';
import type { ActionId } from '../../types/ids';
import { formatRubles } from '../../core/economy';

type ActionCardProps = {
  action: LifeAction;
  onPerform: (actionId: ActionId) => void;
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  return restMinutes > 0 ? `${hours} ч ${restMinutes} мин` : `${hours} ч`;
}

function formatMoneyDelta(delta?: number): string {
  if (!delta) return '0 ₽';

  return `${delta > 0 ? '+' : ''}${formatRubles(delta)}`;
}

export function ActionCard({ action, onPerform }: ActionCardProps) {
  return (
    <article className="action-card">
      <div>
        <p className="action-card__category">{action.category}</p>
        <h3 className="action-card__title">{action.name}</h3>
        <p className="action-card__text">{action.description}</p>
      </div>

      <dl className="action-card__meta">
        <div>
          <dt>Время</dt>
          <dd>{formatDuration(action.durationMinutes)}</dd>
        </div>
        <div>
          <dt>Деньги</dt>
          <dd>{formatMoneyDelta(action.moneyDelta)}</dd>
        </div>
      </dl>

      <button className="action-card__button" type="button" onClick={() => onPerform(action.id)}>
        Выполнить
      </button>
    </article>
  );
}
