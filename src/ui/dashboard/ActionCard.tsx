import type { LifeAction } from '../../types/actions';
import type { ActionId } from '../../types/ids';
import { Icon } from '../icons';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type ActionCardProps = {
  action: LifeAction;
  onPerform: (actionId: ActionId) => void;
};

function getActionEffects(action: LifeAction): EffectListItem[] {
  return [
    { label: 'Время', value: -action.durationMinutes, unit: 'мин', tone: 'negative' },
    action.moneyDelta ? { label: 'Деньги', value: action.moneyDelta, unit: '₽' } : undefined,
    ...createNeedsEffectItems(action.needsDelta)
  ].filter((item): item is EffectListItem => Boolean(item));
}

export function ActionCard({ action, onPerform }: ActionCardProps) {
  return (
    <article className="action-row">
      <div className="action-row__icon"><Icon name="pulse" size={18} /></div>
      <div className="action-row__content">
        <span>{action.category}</span>
        <strong>{action.name}</strong>
        <EffectList items={getActionEffects(action)} />
      </div>
      <button className="row-action-button" type="button" onClick={() => onPerform(action.id)}>
        <span>Выполнить</span>
        <Icon name="arrow" size={17} />
      </button>
    </article>
  );
}
