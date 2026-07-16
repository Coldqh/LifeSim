import { getSkillById } from '../../data/skills/basicSkills';
import type { LifeAction, LifeActionCategory } from '../../types/actions';
import type { ActionId } from '../../types/ids';
import type { NeedsState } from '../../types/needs';
import { Icon } from '../icons';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type ActionCardProps = {
  action: LifeAction;
  onPerform: (actionId: ActionId) => void;
  failure?: string;
  effectiveNeedsDelta?: Partial<NeedsState>;
};

const ACTION_CATEGORY_LABELS: Record<LifeActionCategory, string> = {
  work: 'Работа',
  food: 'Еда',
  drink: 'Напиток',
  rest: 'Отдых',
  sleep: 'Сон',
  walk: 'Прогулка',
  training: 'Тренировка',
  household: 'Быт',
  study: 'Развитие',
  social: 'Общение'
};

function getActionEffects(action: LifeAction, effectiveNeedsDelta?: Partial<NeedsState>): EffectListItem[] {
  const skillEffects = (action.skillRewards ?? []).map((reward) => ({
    label: getSkillById(reward.skillId)?.name ?? 'Навык',
    value: reward.experience,
    unit: 'XP' as const
  }));

  return [
    { label: 'Время', value: -action.durationMinutes, unit: 'мин', tone: 'negative' as const },
    action.moneyDelta ? { label: 'Деньги', value: action.moneyDelta, unit: '₽' } : undefined,
    ...createNeedsEffectItems(effectiveNeedsDelta ?? action.needsDelta),
    ...skillEffects
  ].filter((item): item is EffectListItem => Boolean(item));
}

export function ActionCard({ action, onPerform, failure, effectiveNeedsDelta }: ActionCardProps) {
  return (
    <article className={failure ? 'action-row action-row--disabled interactive-surface' : 'action-row interactive-surface'}>
      <div className="action-row__icon"><Icon name="sparkle" size={18} /></div>
      <div className="action-row__content">
        <span>{ACTION_CATEGORY_LABELS[action.category]}</span>
        <strong>{action.name}</strong>
        <EffectList items={getActionEffects(action, effectiveNeedsDelta)} />
        {failure ? <small className="action-row__failure">{failure}</small> : null}
      </div>
      <button className="row-action-button" disabled={Boolean(failure)} type="button" onClick={() => onPerform(action.id)}>
        <span>Выполнить</span>
        <Icon name="arrow" size={17} />
      </button>
    </article>
  );
}
