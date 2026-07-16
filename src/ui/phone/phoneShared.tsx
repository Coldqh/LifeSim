import type { PhoneAppId, PhoneJobApplication } from '../../types/phone';
import { formatGameDateShort, formatGameTime, fromTotalMinutes } from '../../core/time';
import { Icon, type IconName } from '../icons';

export const APPLICATION_LABELS: Record<PhoneJobApplication['status'], string> = {
  submitted: 'На рассмотрении',
  invited: 'Приглашение',
  rejected: 'Отказ',
  accepted: 'Принят',
  missed: 'Пропущено'
};

export const APP_META: Array<{ id: PhoneAppId; label: string; icon: IconName; tone: string }> = [
  { id: 'today', label: 'Сегодня', icon: 'sun', tone: 'amber' },
  { id: 'contacts', label: 'Контакты', icon: 'users', tone: 'green' },
  { id: 'jobs', label: 'hh', icon: 'briefcase', tone: 'red' },
  { id: 'education', label: 'Учёба', icon: 'book', tone: 'violet' },
  { id: 'clock', label: 'Время', icon: 'clock', tone: 'cyan' },
  { id: 'maps', label: 'Карты', icon: 'pin', tone: 'blue' },
  { id: 'bank', label: 'Банк', icon: 'wallet', tone: 'cyan' },
  { id: 'auto', label: 'Авто', icon: 'car', tone: 'steel' },
  { id: 'health', label: 'Здоровье', icon: 'heart', tone: 'rose' },
  { id: 'trips', label: 'Поездки', icon: 'bus', tone: 'amber' },
  { id: 'messages', label: 'Сообщения', icon: 'message', tone: 'green' },
  { id: 'calendar', label: 'Календарь', icon: 'calendar', tone: 'violet' },
  { id: 'notifications', label: 'Уведомления', icon: 'bell', tone: 'amber' }
];

export function formatRubles(value: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ₽`;
}

export function formatTotalMinutes(totalMinutes: number): string {
  const time = fromTotalMinutes(totalMinutes);
  return `${formatGameDateShort(time)} · ${formatGameTime(time)}`;
}

export function getApplicationTone(status?: PhoneJobApplication['status']): string {
  if (status === 'accepted' || status === 'invited') return 'positive';
  if (status === 'rejected' || status === 'missed') return 'negative';
  return 'neutral';
}

export function AppBadge({ count }: { count: number }) {
  return count > 0 ? <span className="phone-app-badge">{count > 99 ? '99+' : count}</span> : null;
}
