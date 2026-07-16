import type { DailyOpportunityDecision } from '../../../types/dailyLife';
import type { LocationId } from '../../../types/ids';
import type { GameTime } from '../../../types/time';
import { formatGameDate, formatGameTime, formatWeekday } from '../../../core/time';
import { Icon } from '../../icons';
import type { PhonePanelState } from '../phoneTypes';
import { formatRubles, formatTotalMinutes } from '../phoneShared';

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
  onOpenApp: (app: 'jobs' | 'education') => void;
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

      <section className="phone-section-card phone-today__log">
        <header><div><span>Итог дня</span><strong>Что уже произошло</strong></div><Icon name="log" size={20}/></header>
        {daily.recentActivity.length ? daily.recentActivity.map((entry) => (
          <div className="phone-today-log-entry" key={entry.id}><time>{entry.timeLabel}</time><div><strong>{entry.title}</strong><p>{entry.text}</p></div></div>
        )) : <div className="phone-empty-state">День только начался</div>}
      </section>
    </div>
  );
}
