import type { LifeGoalId } from '../../../types/lifeGoal';
import { Icon, type IconName } from '../../icons';
import type { PhonePanelState } from '../phoneTypes';

const GOAL_VISUALS: Record<LifeGoalId, { icon: IconName; label: string }> = {
  university: { icon: 'book', label: 'Образование' },
  career: { icon: 'briefcase', label: 'Работа' },
  boxing: { icon: 'boxing', label: 'Спорт' },
  business: { icon: 'building', label: 'Предпринимательство' },
  housing: { icon: 'home', label: 'Стабильность' }
};

export default function GoalsApp(props: {
  state: PhonePanelState;
  onSelect: (goalId: LifeGoalId) => void;
}) {
  const { lifeGoals } = props.state;
  const active = lifeGoals.activeGoal;

  if (!active) {
    return (
      <div className="phone-app-page phone-screen-enter phone-goals">
        <section className="phone-goals__intro">
          <span>Главное направление</span>
          <strong>Выбери одну жизненную цель</strong>
          <p>Она не закроет остальные системы. Игра будет показывать этапы и фиксировать реальный прогресс по уже существующим действиям.</p>
        </section>
        <div className="phone-goals__choice-list">
          {lifeGoals.goals.map((goal) => {
            const visual = GOAL_VISUALS[goal.definition.id];
            return (
              <article className="phone-goal-choice" key={goal.definition.id}>
                <div className="phone-goal-choice__icon"><Icon name={visual.icon} size={23}/></div>
                <div>
                  <span>{visual.label}</span>
                  <h3>{goal.definition.title}</h3>
                  <p>{goal.definition.description}</p>
                  <small>{goal.totalCount} этапов</small>
                </div>
                <button type="button" onClick={() => props.onSelect(goal.definition.id)}>Выбрать</button>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  const visual = GOAL_VISUALS[active.definition.id];
  return (
    <div className="phone-app-page phone-screen-enter phone-goals">
      <section className="phone-goals__active-hero">
        <div className="phone-goals__active-icon"><Icon name={visual.icon} size={27}/></div>
        <div>
          <span>{visual.label} · выбрано в день {lifeGoals.state.selectedDay ?? '—'}</span>
          <strong>{active.definition.title}</strong>
          <p>{active.definition.description}</p>
        </div>
        <b>{active.progressPercent}%</b>
      </section>

      <section className="phone-section-card phone-goals__progress-card">
        <header><div><span>Общий прогресс</span><strong>{active.completedCount} из {active.totalCount} этапов</strong></div><Icon name="growth" size={20}/></header>
        <div className="phone-goals__progress-track"><i style={{ width: `${active.progressPercent}%` }}/></div>
        {active.complete ? <div className="phone-goals__complete">Цель завершена</div> : active.nextMilestone ? <small>Следующий этап: {active.nextMilestone.definition.title}</small> : null}
      </section>

      <section className="phone-section-card phone-goals__milestones">
        <header><div><span>Путь</span><strong>Этапы цели</strong></div><Icon name="star" size={20}/></header>
        {active.milestones.map((milestone, index) => (
          <article className={milestone.completed ? 'is-complete' : ''} key={milestone.definition.id}>
            <div className="phone-goals__step-index">{milestone.completed ? '✓' : index + 1}</div>
            <div>
              <strong>{milestone.definition.title}</strong>
              <p>{milestone.definition.description}</p>
              {milestone.progressLabel ? <small>{milestone.progressLabel}</small> : null}
              {milestone.targetValue && milestone.progressValue !== undefined && !milestone.completed ? (
                <div className="phone-goals__milestone-track"><i style={{ width: `${Math.min(100, Math.round(milestone.progressValue / milestone.targetValue * 100))}%` }}/></div>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      <section className="phone-goals__lock-note">
        <Icon name="star" size={18}/>
        <p>Главная цель фиксируется. Остальные направления остаются доступными, но этапы и журнал ведутся по выбранному пути.</p>
      </section>
    </div>
  );
}
