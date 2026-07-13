import { useEffect, useMemo, useState } from 'react';
import type { Job } from '../../types/job';
import type { District, Location } from '../../types/location';
import type {
  JobId,
  LocationId,
  PhoneMessageId,
  PhoneNotificationId
} from '../../types/ids';
import type {
  PhoneAppId,
  PhoneJobApplication,
  PhoneState
} from '../../types/phone';
import type { GameTime } from '../../types/time';
import type { LocationTravelOption } from '../../types/travel';
import type { TravelModeId } from '../../types/transport';
import { formatGameTime } from '../../core/time';
import { Icon, type IconName } from '../icons';
import './phone.css';

export type PhoneVacancyView = {
  job: Job;
  location?: Location;
  district?: District;
  application?: PhoneJobApplication;
  applicationFailure?: string;
  missingSkillRequirements: Array<{ skillId: import('../../types/ids').SkillId; name: string; currentLevel: number; minLevel: number }>;
  interviewFailure?: string;
  saved: boolean;
  estimatedMonthlyIncome: number;
};

export type PhonePanelState = {
  phone: PhoneState;
  jobs: PhoneVacancyView[];
  unreadCount: number;
  unreadMessages: number;
  unreadNotifications: number;
  mapTarget?: Location;
  mapRoute?: LocationTravelOption;
};

type PhoneShellProps = {
  open: boolean;
  activeApp: PhoneAppId;
  selectedJobId?: JobId;
  time: GameTime;
  currentLocation?: Location;
  state: PhonePanelState;
  onClose: () => void;
  onOpen: () => void;
  onOpenApp: (app: PhoneAppId) => void;
  onSelectJob: (jobId?: JobId) => void;
  onSubmitApplication: (jobId: JobId) => void;
  onToggleSavedJob: (jobId: JobId) => void;
  onSetMapTarget: (locationId?: LocationId) => void;
  onMoveLocation: (locationId: LocationId, modeId: TravelModeId) => void;
  onReadNotification: (id: PhoneNotificationId) => void;
  onReadMessage: (id: PhoneMessageId) => void;
  onAttendInterview: (jobId: JobId) => void;
};

const APPLICATION_LABELS: Record<PhoneJobApplication['status'], string> = {
  submitted: 'На рассмотрении',
  invited: 'Приглашение',
  rejected: 'Отказ',
  accepted: 'Принят',
  missed: 'Пропущено'
};

const APP_META: Array<{ id: PhoneAppId; label: string; icon: IconName; tone: string }> = [
  { id: 'jobs', label: 'hh', icon: 'briefcase', tone: 'red' },
  { id: 'maps', label: 'Карты', icon: 'pin', tone: 'blue' },
  { id: 'messages', label: 'Сообщения', icon: 'message', tone: 'green' },
  { id: 'calendar', label: 'Календарь', icon: 'calendar', tone: 'violet' },
  { id: 'notifications', label: 'Уведомления', icon: 'bell', tone: 'amber' }
];

function formatRubles(value: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ₽`;
}

function formatTotalMinutes(totalMinutes: number): string {
  const safe = Math.max(0, Math.floor(totalMinutes));
  const day = Math.floor(safe / 1440) + 1;
  const insideDay = safe % 1440;
  const hour = String(Math.floor(insideDay / 60)).padStart(2, '0');
  const minute = String(insideDay % 60).padStart(2, '0');
  return `День ${day} · ${hour}:${minute}`;
}

function getApplicationTone(status?: PhoneJobApplication['status']): string {
  if (status === 'accepted' || status === 'invited') return 'positive';
  if (status === 'rejected' || status === 'missed') return 'negative';
  return 'neutral';
}

function AppBadge({ count }: { count: number }) {
  return count > 0 ? <span className="phone-app-badge">{count > 99 ? '99+' : count}</span> : null;
}

function PhoneHome({ state, onOpenApp }: { state: PhonePanelState; onOpenApp: (app: PhoneAppId) => void }) {
  const counts: Partial<Record<PhoneAppId, number>> = {
    messages: state.unreadMessages,
    notifications: state.unreadNotifications,
    calendar: state.phone.calendarEvents.filter((event) => event.status === 'scheduled').length,
    jobs: state.phone.applications.filter((entry) => entry.status === 'invited').length
  };

  return (
    <div className="phone-home-screen phone-screen-enter">
      <section className="phone-home-hero">
        <span>LifeSim Mobile</span>
        <strong>Москва в твоём кармане</strong>
        <p>{state.phone.applications.filter((entry) => entry.status === 'submitted').length} откликов рассматриваются</p>
      </section>
      <div className="phone-app-grid">
        {APP_META.map((app) => (
          <button className="phone-app-tile" key={app.id} type="button" onClick={() => onOpenApp(app.id)}>
            <span className={`phone-app-icon phone-app-icon--${app.tone}`}>
              <Icon name={app.icon} size={24} />
              <AppBadge count={counts[app.id] ?? 0} />
            </span>
            <strong>{app.label}</strong>
          </button>
        ))}
      </div>
      <section className="phone-home-widget">
        <div><span>Ближайшее событие</span><strong>{state.phone.calendarEvents.find((event) => event.status === 'scheduled')?.title ?? 'Планов нет'}</strong></div>
        <Icon name="calendar" size={22} />
      </section>
    </div>
  );
}

function JobsApp(props: {
  state: PhonePanelState;
  selectedJobId?: JobId;
  onSelectJob: (jobId?: JobId) => void;
  onSubmit: (jobId: JobId) => void;
  onToggleSaved: (jobId: JobId) => void;
  onRoute: (locationId: LocationId) => void;
  onAttendInterview: (jobId: JobId) => void;
}) {
  const [query, setQuery] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const selected = props.state.jobs.find((entry) => entry.job.id === props.selectedJobId);
  const filtered = props.state.jobs.filter((entry) => {
    if (savedOnly && !entry.saved) return false;
    const haystack = `${entry.job.title} ${entry.location?.name ?? ''} ${entry.district?.name ?? ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  if (selected) {
    const application = selected.application;
    return (
      <div className="phone-app-page phone-screen-enter">
        <button className="phone-text-button" type="button" onClick={() => props.onSelectJob(undefined)}>← Все вакансии</button>
        <section className="phone-job-detail">
          <div className="phone-job-detail__brand">hh</div>
          <span className="phone-kicker">{selected.location?.name ?? 'Работодатель'}</span>
          <h2>{selected.job.title}</h2>
          <strong className="phone-job-salary">{formatRubles(selected.estimatedMonthlyIncome)} / месяц</strong>
          <div className="phone-detail-grid">
            <div><span>Смена</span><strong>{selected.job.shiftDurationMinutes / 60} ч · {formatRubles(selected.job.wagePerShift)}</strong></div>
            <div><span>Район</span><strong>{selected.district?.name ?? 'Москва'}</strong></div>
          </div>
          <div className="phone-address-block"><Icon name="pin" size={18}/><div><strong>{selected.location?.name ?? 'Место работы'}</strong><span>{selected.location?.address ?? 'Адрес не указан'}</span></div></div>
        </section>

        <section className="phone-subsection">
          <div className="phone-section-title"><span>Требования</span>{selected.missingSkillRequirements.length === 0 ? <em>Подходишь</em> : <em className="negative">Не хватает навыков</em>}</div>
          {selected.job.requirements?.skills?.length ? (
            <div className="phone-requirements-list">
              {selected.job.requirements.skills.map((requirement) => {
                const missing = selected.missingSkillRequirements.find((entry) => entry.skillId === requirement.skillId);
                return <div key={requirement.skillId}><span>{missing?.name ?? String(requirement.skillId)}</span><strong className={missing ? 'negative' : 'positive'}>{missing?.currentLevel ?? requirement.minLevel}/{requirement.minLevel}</strong></div>;
              })}
            </div>
          ) : <p className="phone-muted">Стартовая вакансия без требований к навыкам.</p>}
        </section>

        {application ? (
          <section className={`phone-application-status phone-application-status--${getApplicationTone(application.status)}`}>
            <span>{APPLICATION_LABELS[application.status]}</span>
            <strong>{application.status === 'submitted' ? 'Работодатель рассматривает отклик' : application.status === 'invited' && application.interviewAtTotalMinutes !== undefined ? formatTotalMinutes(application.interviewAtTotalMinutes) : application.status === 'accepted' ? 'Работа получена' : 'Отклик закрыт'}</strong>
            {application.status === 'invited' ? <button type="button" disabled={Boolean(selected.interviewFailure)} onClick={() => props.onAttendInterview(selected.job.id)}>Пройти собеседование</button> : null}
            {selected.interviewFailure && application.status === 'invited' ? <small>{selected.interviewFailure}</small> : null}
          </section>
        ) : null}

        <div className="phone-sticky-actions">
          <button className="phone-secondary-action" type="button" onClick={() => props.onToggleSaved(selected.job.id)}><Icon name="star" size={17}/>{selected.saved ? 'Сохранено' : 'Сохранить'}</button>
          {selected.location ? <button className="phone-secondary-action" type="button" onClick={() => props.onRoute(selected.location!.id)}><Icon name="pin" size={17}/>Маршрут</button> : null}
          <button className="phone-primary-action" type="button" disabled={Boolean(selected.applicationFailure) || Boolean(application && ['submitted', 'invited', 'accepted'].includes(application.status))} onClick={() => props.onSubmit(selected.job.id)}>Откликнуться</button>
        </div>
        {selected.applicationFailure ? <p className="phone-inline-error">{selected.applicationFailure}</p> : null}
      </div>
    );
  }

  return (
    <div className="phone-app-page phone-screen-enter">
      <div className="phone-app-banner phone-app-banner--jobs"><span>hh</span><div><strong>Работа в Москве</strong><small>{filtered.length} вакансий</small></div></div>
      <label className="phone-search"><Icon name="search" size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Должность, компания, район" /></label>
      <div className="phone-filter-row">
        <button className={!savedOnly ? 'active' : ''} type="button" onClick={() => setSavedOnly(false)}>Все</button>
        <button className={savedOnly ? 'active' : ''} type="button" onClick={() => setSavedOnly(true)}>Сохранённые</button>
      </div>
      <div className="phone-job-list">
        {filtered.map((view) => (
          <button className="phone-job-card" key={view.job.id} type="button" onClick={() => props.onSelectJob(view.job.id)}>
            <div className="phone-job-card__top"><span>{view.location?.name ?? 'Работодатель'}</span>{view.application ? <em className={`status-${getApplicationTone(view.application.status)}`}>{APPLICATION_LABELS[view.application.status]}</em> : null}</div>
            <strong>{view.job.title}</strong>
            <b>{formatRubles(view.estimatedMonthlyIncome)} / месяц</b>
            <small>{view.district?.name ?? 'Москва'} · {view.job.shiftDurationMinutes / 60} ч</small>
            {view.saved ? <i><Icon name="star" size={14}/></i> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function MapsApp(props: {
  state: PhonePanelState;
  currentLocation?: Location;
  onClear: () => void;
  onMove: (locationId: LocationId, modeId: TravelModeId) => void;
}) {
  const target = props.state.mapTarget;
  const route = props.state.mapRoute;
  return (
    <div className="phone-app-page phone-screen-enter phone-maps-app">
      <div className="phone-map-canvas" aria-hidden="true"><i/><i/><i/><span className="phone-map-current">Ты</span>{target ? <span className="phone-map-target">Цель</span> : null}</div>
      <section className="phone-map-sheet">
        <span className="phone-kicker">Маршрут</span>
        <h2>{target?.name ?? 'Выбери адрес из вакансии'}</h2>
        <p>{target?.address ?? `Сейчас: ${props.currentLocation?.name ?? 'Москва'}`}</p>
        {route?.transportOptions.length ? (
          <div className="phone-route-options">
            {route.transportOptions.map((option) => (
              <button disabled={!option.available} key={option.modeId} type="button" onClick={() => target && props.onMove(target.id, option.modeId)}>
                <Icon name={option.modeId} size={19}/>
                <div><strong>{option.name}</strong><span>{option.durationMinutes} мин · {option.moneyCost ? formatRubles(option.moneyCost) : 'Бесплатно'}</span></div>
              </button>
            ))}
          </div>
        ) : <p className="phone-muted">Открой вакансию и нажми «Маршрут».</p>}
        {target ? <button className="phone-text-button" type="button" onClick={props.onClear}>Сбросить маршрут</button> : null}
      </section>
    </div>
  );
}

function MessagesApp({ state, onRead }: { state: PhonePanelState; onRead: (id: PhoneMessageId) => void }) {
  return (
    <div className="phone-app-page phone-screen-enter">
      <div className="phone-app-banner phone-app-banner--messages"><Icon name="message" size={25}/><div><strong>Сообщения</strong><small>{state.unreadMessages} непрочитанных</small></div></div>
      <div className="phone-message-list">
        {state.phone.messages.length ? state.phone.messages.map((message) => (
          <button className={`phone-message-row ${message.read ? '' : 'is-unread'}`} key={message.id} type="button" onClick={() => onRead(message.id)}>
            <span className="phone-message-avatar">{message.senderName.slice(0, 1)}</span>
            <div><strong>{message.senderName}</strong><b>{message.subject}</b><p>{message.body}</p><small>{formatTotalMinutes(message.createdAtTotalMinutes)}</small></div>
          </button>
        )) : <div className="phone-empty-state">Сообщений пока нет</div>}
      </div>
    </div>
  );
}

function CalendarApp(props: {
  state: PhonePanelState;
  onRoute: (locationId: LocationId) => void;
  onAttend: (jobId: JobId) => void;
}) {
  const events = [...props.state.phone.calendarEvents].sort((a, b) => a.startsAtTotalMinutes - b.startsAtTotalMinutes);
  return (
    <div className="phone-app-page phone-screen-enter">
      <div className="phone-app-banner phone-app-banner--calendar"><Icon name="calendar" size={25}/><div><strong>Календарь</strong><small>Встречи и дедлайны</small></div></div>
      <div className="phone-calendar-list">
        {events.length ? events.map((event) => {
          const vacancy = props.state.jobs.find((entry) => entry.job.id === event.jobId);
          return (
            <article className={`phone-calendar-event phone-calendar-event--${event.status}`} key={event.id}>
              <time><strong>{formatTotalMinutes(event.startsAtTotalMinutes).split(' · ')[0]}</strong><span>{formatTotalMinutes(event.startsAtTotalMinutes).split(' · ')[1]}</span></time>
              <div><em>{event.status === 'scheduled' ? 'Запланировано' : event.status === 'completed' ? 'Завершено' : 'Пропущено'}</em><h3>{event.title}</h3><p>{vacancy?.location?.name}<br/>{vacancy?.location?.address}</p>
                {event.status === 'scheduled' ? <div className="phone-inline-actions"><button type="button" onClick={() => props.onRoute(event.locationId)}>Маршрут</button><button disabled={Boolean(vacancy?.interviewFailure)} type="button" onClick={() => props.onAttend(event.jobId)}>Собеседование</button></div> : null}
                {event.status === 'scheduled' && vacancy?.interviewFailure ? <small>{vacancy.interviewFailure}</small> : null}
              </div>
            </article>
          );
        }) : <div className="phone-empty-state">Календарь свободен</div>}
      </div>
    </div>
  );
}

function NotificationsApp({ state, onRead }: { state: PhonePanelState; onRead: (id: PhoneNotificationId) => void }) {
  return (
    <div className="phone-app-page phone-screen-enter">
      <div className="phone-app-banner phone-app-banner--notifications"><Icon name="bell" size={25}/><div><strong>Уведомления</strong><small>{state.unreadNotifications} новых</small></div></div>
      <div className="phone-notification-list">
        {state.phone.notifications.length ? state.phone.notifications.map((notification) => (
          <button className={`phone-notification-row ${notification.read ? '' : 'is-unread'}`} key={notification.id} type="button" onClick={() => onRead(notification.id)}>
            <span><Icon name={notification.appId === 'jobs' ? 'briefcase' : notification.appId === 'calendar' ? 'calendar' : 'bell'} size={18}/></span>
            <div><strong>{notification.title}</strong><p>{notification.body}</p><small>{formatTotalMinutes(notification.createdAtTotalMinutes)}</small></div>
          </button>
        )) : <div className="phone-empty-state">Уведомлений нет</div>}
      </div>
    </div>
  );
}

export function PhoneShell(props: PhoneShellProps) {
  const [mounted, setMounted] = useState(props.open);
  const appTitle = useMemo(() => APP_META.find((entry) => entry.id === props.activeApp)?.label ?? 'Телефон', [props.activeApp]);

  useEffect(() => {
    if (props.open) setMounted(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'p') props.open ? props.onClose() : props.onOpen();
      if (event.key === 'Escape' && props.open) props.onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [props.open, props.onClose, props.onOpen]);

  if (!mounted && !props.open) {
    return (
      <button className="phone-launcher" type="button" onClick={props.onOpen} aria-label="Открыть телефон">
        <Icon name="phone" size={23}/><span>Телефон</span><AppBadge count={props.state.unreadCount}/><kbd>P</kbd>
      </button>
    );
  }

  return (
    <>
      {!props.open ? (
        <button className="phone-launcher" type="button" onClick={props.onOpen} aria-label="Открыть телефон">
          <Icon name="phone" size={23}/><span>Телефон</span><AppBadge count={props.state.unreadCount}/><kbd>P</kbd>
        </button>
      ) : null}
      <div className={`phone-overlay ${props.open ? 'is-open' : 'is-closing'}`} onAnimationEnd={() => { if (!props.open) setMounted(false); }}>
        <button className="phone-overlay__backdrop" type="button" aria-label="Закрыть телефон" onClick={props.onClose}/>
        <aside className="diegetic-phone" aria-label="Смартфон персонажа">
          <div className="diegetic-phone__hardware"><i/><i/><i/></div>
          <div className="diegetic-phone__screen">
            <header className="phone-status-bar">
              <strong>{formatGameTime(props.time)}</strong>
              <span>5G <i className="phone-signal"/> 87%</span>
            </header>
            {props.activeApp !== 'home' ? (
              <header className="phone-app-header">
                <button type="button" onClick={() => { props.onSelectJob(undefined); props.onOpenApp('home'); }}><Icon name="chevron" size={20}/></button>
                <strong>{appTitle}</strong>
                <button type="button" onClick={props.onClose}><Icon name="close" size={18}/></button>
              </header>
            ) : <button className="phone-close-button" type="button" onClick={props.onClose}><Icon name="close" size={18}/></button>}
            <div className="phone-app-content">
              {props.activeApp === 'home' ? <PhoneHome state={props.state} onOpenApp={props.onOpenApp}/> : null}
              {props.activeApp === 'jobs' ? <JobsApp state={props.state} selectedJobId={props.selectedJobId} onSelectJob={props.onSelectJob} onSubmit={props.onSubmitApplication} onToggleSaved={props.onToggleSavedJob} onRoute={(locationId) => { props.onSetMapTarget(locationId); props.onOpenApp('maps'); }} onAttendInterview={props.onAttendInterview}/> : null}
              {props.activeApp === 'maps' ? <MapsApp state={props.state} currentLocation={props.currentLocation} onClear={() => props.onSetMapTarget(undefined)} onMove={(locationId, modeId) => { props.onMoveLocation(locationId, modeId); props.onClose(); }}/> : null}
              {props.activeApp === 'messages' ? <MessagesApp state={props.state} onRead={props.onReadMessage}/> : null}
              {props.activeApp === 'calendar' ? <CalendarApp state={props.state} onRoute={(locationId) => { props.onSetMapTarget(locationId); props.onOpenApp('maps'); }} onAttend={props.onAttendInterview}/> : null}
              {props.activeApp === 'notifications' ? <NotificationsApp state={props.state} onRead={props.onReadNotification}/> : null}
            </div>
            <button className="phone-home-indicator" type="button" aria-label="На главный экран" onClick={() => { props.onSelectJob(undefined); props.onOpenApp('home'); }}/>
          </div>
        </aside>
      </div>
    </>
  );
}
