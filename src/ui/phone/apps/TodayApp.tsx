import type { DailyOpportunityDecision } from '../../../types/dailyLife';
import type { LocationId, SocialEventChoiceId } from '../../../types/ids';
import type { GameTime } from '../../../types/time';
import { formatGameDate, formatGameTime, formatWeekday, getTotalMinutes } from '../../../core/time';
import { Icon } from '../../icons';
import type { PhonePanelState } from '../phoneTypes';
import { formatRubles, formatTotalMinutes } from '../phoneShared';

const STORY_LABELS = {
  university_peer: 'Университет',
  work_colleague: 'Работа',
  boxing_partner: 'Боксёрский зал'
} as const;

const STATUS_LABELS = {
  upcoming: 'Впереди',
  active: 'Сейчас',
  completed: 'Выполнено',
  missed: 'Пропущено',
  flexible: 'В течение дня'
} as const;

function clock(totalMinutes: number | undefined): string | undefined {
  return totalMinutes === undefined ? undefined : formatTotalMinutes(totalMinutes).split(' · ')[1];
}

export default function TodayApp(props: {
  state: PhonePanelState;
  time: GameTime;
  onRoute: (locationId: LocationId) => void;
  onResolve: (opportunityId: string, decision: DailyOpportunityDecision) => void;
  onExecute: () => void;
  onOpenApp: (app: 'jobs' | 'education' | 'goals') => void;
  onChooseStory: (choiceId: SocialEventChoiceId) => void;
  onResolveLifeEvent: (eventId: string, choiceId: string) => void;
  onClose: () => void;
}) {
  const daily = props.state.dailyLife;
  const opportunity = daily.opportunity;
  const accepted = opportunity.decision === 'accepted';
  const declined = opportunity.decision === 'declined';

  function executeOpportunity(): void {
    props.onExecute();
    props.onClose();
  }

  return (
    <div className="phone-app-page phone-screen-enter phone-today">
      <section className="phone-today__hero">
        <div>
          <span>{formatWeekday(props.time.weekday)}</span>
          <strong>{formatGameDate(props.time)}</strong>
          <small>{formatGameTime(props.time)} · {props.state.intercity.currentCity?.name ?? 'Город'}</small>
        </div>
        <Icon name="sun" size={29}/>
      </section>

      <section className="phone-today__summary">
        <div><span>Дела</span><strong>{daily.mandatoryCount}</strong></div>
        <div className={daily.conflictCount ? 'is-warning' : ''}><span>Конфликты</span><strong>{daily.conflictCount}</strong></div>
        <div className={daily.remainingAfterPayments < 0 ? 'is-negative' : ''}><span>После платежей</span><strong>{formatRubles(daily.remainingAfterPayments)}</strong></div>
      </section>

      <section className="phone-section-card phone-today__goal">
        {props.state.lifeGoals.activeGoal ? (
          <>
            <header><div><span>Жизненная цель</span><strong>{props.state.lifeGoals.activeGoal.definition.shortTitle}</strong></div><b>{props.state.lifeGoals.activeGoal.progressPercent}%</b></header>
            <p>{props.state.lifeGoals.activeGoal.nextMilestone?.definition.title ?? 'Все этапы завершены'}</p>
            <div className="phone-today__goal-track"><i style={{ width: `${props.state.lifeGoals.activeGoal.progressPercent}%` }}/></div>
            <button type="button" onClick={() => props.onOpenApp('goals')}>Открыть путь</button>
          </>
        ) : (
          <>
            <header><div><span>Жизненная цель</span><strong>Направление не выбрано</strong></div><Icon name="star" size={20}/></header>
            <p>Выбери главный путь, чтобы видеть этапы и связать текущие действия с большим результатом.</p>
            <button type="button" onClick={() => props.onOpenApp('goals')}>Выбрать цель</button>
          </>
        )}
      </section>

      {props.state.lifePhases.activeEvents.length ? (
        <section className="phone-section-card phone-today__story">
          <header><div><span>Жизненные решения</span><strong>{props.state.lifePhases.activeEvents.length} требуют ответа</strong></div><Icon name="bell" size={20}/></header>
          {props.state.lifePhases.activeEvents.map((event) => (
            <article className={`phone-today-world-condition phone-today-world-condition--${event.tone === 'critical' ? 'slowdown' : event.tone === 'warning' ? 'transport_delay' : 'demand_surge'}`} key={event.id}>
              <div><strong>{event.title}</strong><small>Ответить до дня {event.dueDay} · осталось {Math.max(0, event.dueDay - props.time.day)} дн.</small></div>
              <p>{event.description}</p>
              <div className="phone-today__story-choices">
                {event.choices.map((choice) => (
                  <button type="button" key={choice.id} onClick={() => props.onResolveLifeEvent(event.id, choice.id)}>
                    <strong>{choice.label}</strong>
                    <span>{choice.description}</span>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {props.state.lifeProgression.consequences.length ? (
        <section className="phone-section-card phone-today__world">
          <header><div><span>Долгие последствия</span><strong>{props.state.lifeProgression.consequences.length} активных</strong></div><Icon name="bell" size={20}/></header>
          {props.state.lifeProgression.consequences.map((entry) => (
            <article className={`phone-today-world-condition phone-today-world-condition--${entry.severity === 'critical' ? 'slowdown' : 'transport_delay'}`} key={entry.id}>
              <div><strong>{entry.title}</strong><small>{entry.expiresDay ? `До дня ${entry.expiresDay}` : 'Пока причина не устранена'}</small></div>
              <p>{entry.description}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="phone-section-card phone-today__household">
        <header>
          <div><span>Дом и быт</span><strong>{props.state.household.activeBreakdownLabel ?? (props.state.household.debt > 0 ? 'Нужна оплата' : 'Состояние дома')}</strong></div>
          <Icon name="home" size={20}/>
        </header>
        <div className="phone-today__household-grid">
          <div><span>Чистота</span><strong>{props.state.household.state.cleanliness}/100</strong></div>
          <div><span>Исправность</span><strong>{props.state.household.state.condition}/100</strong></div>
          <div><span>Продукты</span><strong>{props.state.household.foodUnits} порц.</strong></div>
          <div className={props.state.household.outstandingBills > 0 ? 'is-warning' : ''}><span>Счета</span><strong>{formatRubles(props.state.household.outstandingBills)}</strong></div>
        </div>
        {props.state.household.activeBreakdownLabel ? <p className="phone-today__household-alert">{props.state.household.activeBreakdownLabel}. Ремонт доступен дома.</p> : null}
        {props.state.household.nextExpiryDay ? <small>Ближайшие продукты испортятся в день {props.state.household.nextExpiryDay}.</small> : <small>Дома нет запаса продуктов.</small>}
      </section>

      <section className="phone-section-card phone-today__world">
        <header><div><span>Город сейчас</span><strong>{props.state.worldDynamics.activeConditions.length ? 'Мир меняется' : 'Спокойный период'}</strong></div><Icon name="city" size={20}/></header>
        {props.state.worldDynamics.activeConditions.length ? props.state.worldDynamics.activeConditions.map((condition) => (
          <article className={`phone-today-world-condition phone-today-world-condition--${condition.kind}`} key={condition.id}>
            <div><strong>{condition.title}</strong><small>До дня {condition.endsDay}</small></div>
            <p>{condition.description}</p>
          </article>
        )) : <p>Сейчас в городе нет крупных временных изменений.</p>}
        {props.state.worldDynamics.recentNews.length ? (
          <details className="phone-today-world-news">
            <summary>Последние новости мира</summary>
            {props.state.worldDynamics.recentNews.slice(0, 4).map((entry) => (
              <div key={entry.id}><span>День {entry.day}</span><strong>{entry.title}</strong><p>{entry.text}</p></div>
            ))}
          </details>
        ) : null}
      </section>

      {props.state.districtEcosystem.current ? (
        <section className="phone-section-card phone-today__world phone-today__district">
          <header><div><span>Район сейчас</span><strong>{props.state.districtEcosystem.current.districtName} · {props.state.districtEcosystem.current.trendLabel}</strong></div><Icon name="pin" size={20}/></header>
          <p>{props.state.districtEcosystem.current.trendDescription}</p>
          <div className="phone-today__district-grid">
            <div><span>Аренда</span><strong>×{props.state.districtEcosystem.current.modifiers.rentMultiplier.toFixed(2)}</strong></div>
            <div><span>Поездки</span><strong>×{props.state.districtEcosystem.current.modifiers.travelDurationMultiplier.toFixed(2)}</strong></div>
            <div><span>Работа</span><strong>{props.state.districtEcosystem.current.state.jobAccessIndex}</strong></div>
            <div><span>Сервисы</span><strong>{props.state.districtEcosystem.current.state.servicesIndex}</strong></div>
          </div>
          {props.state.districtEcosystem.recentChanges.length ? (
            <details className="phone-today-world-news">
              <summary>Изменения районов</summary>
              {props.state.districtEcosystem.recentChanges.slice(0, 5).map((entry) => (
                <div key={entry.id}><span>День {entry.day}</span><strong>{entry.title}</strong><p>{entry.text}</p></div>
              ))}
            </details>
          ) : null}
        </section>
      ) : null}

      <section className="phone-section-card phone-today__world">
        <header><div><span>Организации города</span><strong>{props.state.organizations.organizations.filter((entry) => entry.state.status !== 'stable').length ? 'Есть изменения' : 'Работают стабильно'}</strong></div><Icon name="building" size={20}/></header>
        {props.state.organizations.organizations.filter((entry) => entry.state.status !== 'stable').slice(0, 5).map((entry) => (
          <article className={`phone-today-world-condition phone-today-world-condition--${entry.state.status === 'critical' ? 'slowdown' : entry.state.status === 'strained' ? 'transport_delay' : 'demand_surge'}`} key={entry.definition.id}>
            <div><strong>{entry.definition.name}</strong><small>{entry.statusLabel} · штат {entry.state.staffCount}/{entry.state.targetStaff}</small></div>
            <p>{entry.statusDescription}{entry.state.closedUntilDay ? ` Закрыто до дня ${entry.state.closedUntilDay}.` : ''}</p>
          </article>
        ))}
        {!props.state.organizations.organizations.some((entry) => entry.state.status !== 'stable') ? <p>Работодатели, университеты и заведения города работают без серьёзных сбоев.</p> : null}
        {props.state.organizations.recentChanges.length ? (
          <details className="phone-today-world-news">
            <summary>Изменения организаций</summary>
            {props.state.organizations.recentChanges.slice(0, 5).map((entry) => (
              <div key={entry.id}><span>День {entry.day}</span><strong>{entry.title}</strong><p>{entry.text}</p></div>
            ))}
          </details>
        ) : null}
      </section>

      <section className="phone-section-card phone-today__world">
        <header><div><span>Рынок возможностей</span><strong>{props.state.opportunities.openVacancyCount} открытых вакансий</strong></div><Icon name="briefcase" size={20}/></header>
        <p>{props.state.opportunities.closedVacancyCount > 0
          ? `${props.state.opportunities.closedVacancyCount} вакансий сейчас закрыты или уже заняты. Мир не ждёт решения игрока.`
          : 'Все известные вакансии пока принимают отклики.'}</p>
        {props.state.opportunities.recentChanges.length ? (
          <div className="phone-today-world-news">
            {props.state.opportunities.recentChanges.slice(0, 4).map((entry) => (
              <div key={entry.id}><span>День {entry.day}</span><strong>{entry.title}</strong><p>{entry.text}</p></div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="phone-section-card phone-today__agenda">
        <header><div><span>План</span><strong>Сегодня</strong></div><Icon name="calendar" size={20}/></header>
        {daily.agenda.length ? daily.agenda.map((item) => (
          <article className={`phone-today-item phone-today-item--${item.status}`} key={item.id}>
            <time>{item.startsAtTotalMinutes === undefined ? '—' : clock(item.startsAtTotalMinutes)}</time>
            <div>
              <div className="phone-today-item__top"><em>{STATUS_LABELS[item.status]}</em>{item.conflictIds.length ? <b>Конфликт</b> : null}</div>
              <h3>{item.title}</h3>
              <p>{item.locationName ?? item.description}</p>
              {item.windowEndTotalMinutes ? <small>Окно до {clock(item.windowEndTotalMinutes)} · смена {Math.round(((item.endsAtTotalMinutes ?? 0) - (item.startsAtTotalMinutes ?? 0)) / 60)} ч.</small> : null}
              {item.travelMinutes !== undefined && item.travelMinutes > 0 ? <small>Дорога: {item.travelMinutes} мин{item.leaveByTotalMinutes !== undefined ? ` · выйти до ${clock(item.leaveByTotalMinutes)}` : ''}</small> : null}
              {item.locationId ? <button type="button" onClick={() => props.onRoute(item.locationId!)}>Маршрут</button> : null}
            </div>
          </article>
        )) : <div className="phone-empty-state">Обязательных дел на сегодня нет</div>}
      </section>

      {daily.storyEvent ? (
        <section className="phone-section-card phone-today__story">
          <header>
            <div><span>{STORY_LABELS[daily.storyEvent.chainId]} · этап {daily.storyEvent.step}</span><strong>{daily.storyEvent.title}</strong></div>
            <Icon name="users" size={20}/>
          </header>
          <div className="phone-today__story-person"><strong>{daily.storyEvent.npcName}</strong><small>Ответить до {formatTotalMinutes(daily.storyEvent.expiresAtTotalMinutes)}</small></div>
          <p>{daily.storyEvent.text}</p>
          <div className="phone-today__story-choices">
            {daily.storyEvent.choices.map((choice) => (
              <button type="button" key={choice.id} onClick={() => props.onChooseStory(choice.id)}>
                <strong>{choice.label}</strong>
                <span>{choice.resultText}</span>
                <small>{[
                  choice.durationMinutes ? `${choice.durationMinutes} мин` : undefined,
                  choice.moneyDelta ? `${choice.moneyDelta > 0 ? '+' : ''}${formatRubles(choice.moneyDelta)}` : undefined
                ].filter(Boolean).join(' · ') || 'Решение без затрат времени'}</small>
              </button>
            ))}
          </div>
          <small className="phone-today__story-deadline">Осталось {Math.max(0, Math.ceil((daily.storyEvent.expiresAtTotalMinutes - getTotalMinutes(props.time)) / 60))} ч.</small>
        </section>
      ) : null}

      {daily.groupEvent ? (
        <section className="phone-section-card phone-today__story phone-today__group-event">
          <header>
            <div><span>{daily.groupEvent.groupTitle} · {daily.groupEvent.memberCount} участников</span><strong>{daily.groupEvent.title}</strong></div>
            <Icon name="users" size={20}/>
          </header>
          <div className="phone-today__story-person"><strong>{daily.groupEvent.representativeName}</strong><small>Ответить до {formatTotalMinutes(daily.groupEvent.expiresAtTotalMinutes)}</small></div>
          <p>{daily.groupEvent.text}</p>
          <div className="phone-today__story-choices">
            {daily.groupEvent.choices.map((choice) => (
              <button type="button" key={choice.id} onClick={() => props.onChooseStory(choice.id)}>
                <strong>{choice.label}</strong>
                <span>{choice.resultText}</span>
                <small>{[
                  choice.durationMinutes ? `${choice.durationMinutes} мин` : undefined,
                  choice.moneyDelta ? `${choice.moneyDelta > 0 ? '+' : ''}${formatRubles(choice.moneyDelta)}` : undefined
                ].filter(Boolean).join(' · ') || 'Решение без затрат времени'}</small>
              </button>
            ))}
          </div>
          <small className="phone-today__story-deadline">Осталось {Math.max(0, Math.ceil((daily.groupEvent.expiresAtTotalMinutes - getTotalMinutes(props.time)) / 60))} ч.</small>
        </section>
      ) : null}

      {daily.payments.length ? (
        <section className="phone-section-card phone-today__payments">
          <header><div><span>Деньги</span><strong>Ближайшие платежи</strong></div><Icon name="wallet" size={20}/></header>
          {daily.payments.map((payment) => (
            <div className="phone-today-payment" key={payment.id}>
              <div><strong>{payment.title}</strong><small>{payment.daysUntilDue === 0 ? 'Сегодня' : payment.daysUntilDue === 1 ? 'Завтра' : `Через ${payment.daysUntilDue} дня`}</small></div>
              <b>{formatRubles(payment.amount)}</b>
            </div>
          ))}
        </section>
      ) : null}

      <section className={`phone-section-card phone-today__opportunity ${accepted ? 'is-accepted' : declined ? 'is-declined' : ''}`}>
        <header><div><span>Возможность дня</span><strong>{opportunity.title}</strong></div><Icon name="sparkle" size={20}/></header>
        <p>{opportunity.description}</p>
        <div className="phone-today__opportunity-meta"><span>{opportunity.durationMinutes} мин</span><strong>{opportunity.rewardLabel}</strong></div>
        {opportunity.locationName ? <small>{opportunity.locationName}</small> : null}
        {!opportunity.decision ? (
          <div className="phone-inline-actions">
            <button type="button" onClick={() => props.onResolve(opportunity.id, 'accepted')}>Принять</button>
            <button type="button" onClick={() => props.onResolve(opportunity.id, 'declined')}>Отказаться</button>
          </div>
        ) : accepted ? (
          <div className="phone-inline-actions">
            {opportunity.locationId ? <button type="button" onClick={() => props.onRoute(opportunity.locationId!)}>Маршрут</button> : null}
            <button type="button" onClick={executeOpportunity}>Выполнить</button>
            {opportunity.targetApp ? <button type="button" onClick={() => props.onOpenApp(opportunity.targetApp!)}>Открыть раздел</button> : null}
          </div>
        ) : <small>Возможность закрыта до следующего дня.</small>}
      </section>

      {(props.state.lifePhases.latestWeeklySummary || props.state.lifePhases.latestMonthlySummary) ? (
        <section className="phone-section-card phone-today__world">
          <header><div><span>Этап жизни</span><strong>Недели и месяцы имеют итог</strong></div><Icon name="calendar" size={20}/></header>
          {props.state.lifePhases.latestMonthlySummary ? (
            <article className="phone-today-world-condition phone-today-world-condition--demand_surge">
              <div><strong>{props.state.lifePhases.latestMonthlySummary.title}</strong><small>Дни {props.state.lifePhases.latestMonthlySummary.fromDay}–{props.state.lifePhases.latestMonthlySummary.toDay}</small></div>
              {props.state.lifePhases.latestMonthlySummary.lines.map((line) => <p key={line}>{line}</p>)}
            </article>
          ) : null}
          {props.state.lifePhases.latestWeeklySummary ? (
            <details className="phone-today-world-news">
              <summary>{props.state.lifePhases.latestWeeklySummary.title}</summary>
              {props.state.lifePhases.latestWeeklySummary.lines.map((line) => <div key={line}><p>{line}</p></div>)}
            </details>
          ) : null}
        </section>
      ) : null}

      <section className="phone-section-card phone-today__log">
        <header><div><span>Итог дня</span><strong>Что уже произошло</strong></div><Icon name="log" size={20}/></header>
        {daily.recentActivity.length ? daily.recentActivity.map((entry) => (
          <div className="phone-today-log-entry" key={entry.id}><time>{entry.timeLabel}</time><div><strong>{entry.title}</strong><p>{entry.text}</p></div></div>
        )) : <div className="phone-empty-state">День только начался</div>}
      </section>
    </div>
  );
}
