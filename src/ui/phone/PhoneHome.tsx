import type { PhoneAppId } from '../../types/phone';
import { Icon } from '../icons';
import type { PhonePanelState } from './phoneTypes';
import { APP_META, AppBadge } from './phoneShared';

export function PhoneHome({ state, onOpenApp }: { state: PhonePanelState; onOpenApp: (app: PhoneAppId) => void }) {
  const counts: Partial<Record<PhoneAppId, number>> = {
    contacts: state.social.invitations.length + state.social.meetings.length,
    messages: state.unreadMessages,
    notifications: state.unreadNotifications,
    calendar: state.phone.calendarEvents.filter((event) => event.status === 'scheduled').length,
    jobs: state.phone.applications.filter((entry) => entry.status === 'invited').length,
    health: state.health.conditions.length,
    trips: state.intercity.tickets.filter((entry) => entry.ticket.status === 'booked').length,
    education: state.university.state.applications.filter((entry) => ['exam_scheduled', 'passed'].includes(entry.status)).length
  };

  return (
    <div className="phone-home-screen phone-screen-enter">
      <section className="phone-home-hero">
        <span>LifeSim Mobile</span>
        <strong>{state.intercity.currentCity?.name ?? 'Город'} в твоём кармане</strong>
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

