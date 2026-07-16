import type { UniversityCampusActivityDefinition } from '../../types/university';
import type { UniversityCampusActivityId } from '../../types/ids';
import type { NeedsState } from '../../types/needs';
import { Icon } from '../icons';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type UniversityCampusActionCardProps = {
  activity: UniversityCampusActivityDefinition;
  failure?: string;
  effectiveNeedsDelta?: Partial<NeedsState>;
  onPerform: (activityId: UniversityCampusActivityId) => void;
};

const ACTIVITY_KIND_LABELS: Record<UniversityCampusActivityDefinition['kind'], string> = {
  study: 'Учёба',
  meal: 'Столовая',
  social: 'Кампус'
};

function getEffects(
  activity: UniversityCampusActivityDefinition,
  effectiveNeedsDelta?: Partial<NeedsState>
): EffectListItem[] {
  return [
    { label: 'Время', value: -activity.durationMinutes, unit: 'мин', tone: 'negative' },
    activity.moneyCost > 0 ? { label: 'Деньги', value: -activity.moneyCost, unit: '₽' } : undefined,
    ...createNeedsEffectItems(effectiveNeedsDelta ?? activity.needsDelta),
    activity.studyLoadDelta !== 0 ? { label: 'Нагрузка', value: activity.studyLoadDelta } : undefined,
    activity.knowledgeReward ? { label: 'Знания', value: activity.knowledgeReward } : undefined
  ].filter((item): item is EffectListItem => Boolean(item));
}

export function UniversityCampusActionCard({
  activity,
  failure,
  effectiveNeedsDelta,
  onPerform
}: UniversityCampusActionCardProps) {
  return (
    <article className={failure ? 'action-row action-row--disabled interactive-surface' : 'action-row interactive-surface'}>
      <div className="action-row__icon"><Icon name="book" size={18} /></div>
      <div className="action-row__content">
        <span>{ACTIVITY_KIND_LABELS[activity.kind]}</span>
        <strong>{activity.title}</strong>
        <EffectList items={getEffects(activity, effectiveNeedsDelta)} />
        {failure ? <small className="action-row__failure">{failure}</small> : null}
      </div>
      <button className="row-action-button" disabled={Boolean(failure)} type="button" onClick={() => onPerform(activity.id)}>
        <span>Начать</span>
        <Icon name="arrow" size={17} />
      </button>
    </article>
  );
}
