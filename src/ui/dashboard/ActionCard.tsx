import { formatRubles } from '../../core/economy';
import type { LifeAction } from '../../types/actions';
import type { ActionId } from '../../types/ids';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type ActionCardProps = {
  action: LifeAction;
  onPerform: (actionId: ActionId) => void;
};

function getActionEffects(action: LifeAction): EffectListItem[] {
  return [
    {
      label: 'Время',
      value: -action.durationMinutes,
      unit: 'мин',
      tone: 'negative'
    },
    action.moneyDelta
      ? {
          label: 'Деньги',
          value: action.moneyDelta,
          unit: '₽'
        }
      : undefined,
    ...createNeedsEffectItems(action.needsDelta)
  ].filter((item): item is EffectListItem => Boolean(item));
}

export function ActionCard({ action, onPerform }: ActionCardProps) {
  return (
    <article className="action-card">
      <div>
        <p className="action-card__category">{action.category}</p>
        <h3 className="action-card__title">{action.name}</h3>
        <p className="action-card__text">{action.description}</p>
      </div>

      <EffectList items={getActionEffects(action)} />

      {action.moneyDelta ? <small className="action-card__money">Итог по деньгам: {formatRubles(action.moneyDelta)}</small> : null}

      <button className="action-card__button" type="button" onClick={() => onPerform(action.id)}>
        Выполнить
      </button>
    </article>
  );
}
