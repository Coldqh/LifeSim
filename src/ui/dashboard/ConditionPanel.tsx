import type { NeedCondition, NeedsConsequences } from '../../types/needs';
import { Icon } from '../icons';

const SEVERITY_LABELS: Record<NeedCondition['severity'], string> = {
  warning: 'Низкий уровень',
  critical: 'Критический уровень',
  emergency: 'Опасный уровень'
};

type ConditionPanelProps = {
  conditions: NeedCondition[];
  consequences: NeedsConsequences;
};

export function ConditionPanel({ conditions, consequences }: ConditionPanelProps) {
  if (conditions.length === 0) {
    return (
      <section className="condition-strip condition-strip--stable" aria-label="Состояние персонажа">
        <span className="condition-strip__lead"><Icon name="pulse" size={18} /><strong>Состояние стабильное</strong></span>
        <span>Ограничений нет</span>
      </section>
    );
  }

  return (
    <section className="condition-panel visual-panel" aria-label="Последствия состояния">
      <div className="condition-panel__header">
        <div>
          <span className="section-kicker">Текущее состояние</span>
          <h2>{conditions.map((condition) => condition.label).join(' · ')}</h2>
        </div>
        <span className="condition-panel__cost">Расход энергии ×{consequences.energyCostMultiplier.toFixed(2)}</span>
      </div>

      <div className="condition-panel__list">
        {conditions.map((condition) => (
          <article className={`condition-row condition-row--${condition.severity}`} key={condition.id}>
            <span className="condition-row__signal" />
            <div>
              <strong>{condition.label}</strong>
              <span>{SEVERITY_LABELS[condition.severity]} · {condition.value}/100</span>
            </div>
            <small>{condition.summary}</small>
          </article>
        ))}
      </div>

      <div className="condition-panel__modifiers">
        <span>Восстановление энергии: {Math.round(consequences.energyRecoveryMultiplier * 100)}%</span>
        {consequences.healthDrainPerHour > 0 ? <span>Потеря здоровья: −{consequences.healthDrainPerHour.toFixed(1)}/ч</span> : null}
      </div>
    </section>
  );
}
