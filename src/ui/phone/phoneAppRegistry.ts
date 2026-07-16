import type { PhoneAppId } from '../../types/phone';

type LazyPhoneAppId = Exclude<PhoneAppId, 'home'>;

export const PHONE_APP_LOADERS = {
  today: () => import('./apps/TodayApp'),
  contacts: () => import('./apps/ContactsApp'),
  jobs: () => import('./apps/JobsApp'),
  education: () => import('./apps/EducationApp'),
  clock: () => import('./apps/ClockApp'),
  maps: () => import('./apps/MapsApp'),
  bank: () => import('./apps/BankApp'),
  auto: () => import('./apps/VehiclesApp'),
  health: () => import('./apps/HealthApp'),
  trips: () => import('./apps/TripsApp'),
  messages: () => import('./apps/MessagesApp'),
  calendar: () => import('./apps/CalendarApp'),
  notifications: () => import('./apps/NotificationsApp')
} satisfies Record<LazyPhoneAppId, () => Promise<unknown>>;
