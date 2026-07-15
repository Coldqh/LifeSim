import type { CalendarDate, GameCalendarDate, GameTime, Season, Weekday } from '../../types/time';

const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MINUTES_IN_DAY = 24 * 60;
const START_DATE: CalendarDate = { year: 2026, month: 9, dayOfMonth: 7 };
const MONTH_LABELS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
] as const;
const MONTH_SHORT_LABELS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'] as const;

function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function getDaysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function getSeason(month: number): Season {
  if (month === 12 || month <= 2) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'autumn';
}

function sanitizeAbsoluteDay(day: number): number {
  return Math.max(1, Math.floor(Number.isFinite(day) ? day : 1));
}

export function getCalendarDateForDay(day: number): GameCalendarDate {
  let remainingDays = sanitizeAbsoluteDay(day) - 1;
  let year = START_DATE.year;
  let month = START_DATE.month;
  let dayOfMonth = START_DATE.dayOfMonth;

  while (remainingDays > 0) {
    const daysLeftInMonth = getDaysInMonth(year, month) - dayOfMonth;
    if (remainingDays <= daysLeftInMonth) {
      dayOfMonth += remainingDays;
      remainingDays = 0;
      break;
    }

    remainingDays -= daysLeftInMonth + 1;
    dayOfMonth = 1;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return { year, month, dayOfMonth, season: getSeason(month) };
}

export function getWeekdayForDay(day: number): Weekday {
  return WEEKDAYS[(sanitizeAbsoluteDay(day) - 1) % WEEKDAYS.length];
}

export function createInitialTime(): GameTime {
  return {
    day: 1,
    hour: 7,
    minute: 0,
    weekday: 'monday',
    calendar: getCalendarDateForDay(1)
  };
}

export function normalizeGameTime(value: unknown): GameTime {
  const candidate = value && typeof value === 'object' ? value as Partial<GameTime> : {};
  const day = sanitizeAbsoluteDay(typeof candidate.day === 'number' ? candidate.day : 1);
  const hour = Math.min(23, Math.max(0, Math.floor(typeof candidate.hour === 'number' ? candidate.hour : 7)));
  const minute = Math.min(59, Math.max(0, Math.floor(typeof candidate.minute === 'number' ? candidate.minute : 0)));
  return {
    day,
    hour,
    minute,
    weekday: getWeekdayForDay(day),
    calendar: getCalendarDateForDay(day)
  };
}

export function addMinutes(time: GameTime, minutesToAdd: number): GameTime {
  const safeMinutesToAdd = Math.max(0, Math.floor(minutesToAdd));
  const currentTotalMinutes = (time.day - 1) * MINUTES_IN_DAY + time.hour * 60 + time.minute;
  return fromTotalMinutes(currentTotalMinutes + safeMinutesToAdd);
}

export function formatGameTime(time: GameTime): string {
  const hour = String(time.hour).padStart(2, '0');
  const minute = String(time.minute).padStart(2, '0');
  return `${hour}:${minute}`;
}

export function formatGameDate(timeOrDate: GameTime | CalendarDate): string {
  const date = 'calendar' in timeOrDate ? timeOrDate.calendar : timeOrDate;
  return `${date.dayOfMonth} ${MONTH_LABELS[date.month - 1] ?? ''} ${date.year}`.trim();
}

export function formatGameDateShort(timeOrDate: GameTime | CalendarDate): string {
  const date = 'calendar' in timeOrDate ? timeOrDate.calendar : timeOrDate;
  return `${date.dayOfMonth} ${MONTH_SHORT_LABELS[date.month - 1] ?? ''} ${date.year}`.trim();
}

export function formatWeekday(weekday: Weekday): string {
  const labels: Record<Weekday, string> = {
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье'
  };
  return labels[weekday];
}

export function formatSeason(season: Season): string {
  const labels: Record<Season, string> = {
    winter: 'Зима',
    spring: 'Весна',
    summer: 'Лето',
    autumn: 'Осень'
  };
  return labels[season];
}

export function calculateAge(birthDate: CalendarDate, currentDate: CalendarDate): number {
  let age = currentDate.year - birthDate.year;
  const birthdayNotReached = currentDate.month < birthDate.month
    || (currentDate.month === birthDate.month && currentDate.dayOfMonth < birthDate.dayOfMonth);
  if (birthdayNotReached) age -= 1;
  return Math.max(0, age);
}

export function getTotalMinutes(time: GameTime): number {
  return (time.day - 1) * MINUTES_IN_DAY + time.hour * 60 + time.minute;
}

export function getElapsedMinutes(fromTime: GameTime, toTime: GameTime): number {
  return Math.max(0, getTotalMinutes(toTime) - getTotalMinutes(fromTime));
}

export function fromTotalMinutes(totalMinutes: number): GameTime {
  const safe = Math.max(0, Math.floor(totalMinutes));
  const day = Math.floor(safe / MINUTES_IN_DAY) + 1;
  const insideDay = safe % MINUTES_IN_DAY;
  return {
    day,
    hour: Math.floor(insideDay / 60),
    minute: insideDay % 60,
    weekday: getWeekdayForDay(day),
    calendar: getCalendarDateForDay(day)
  };
}
