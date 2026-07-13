import type { GameTime, Weekday } from '../../types/time';

const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MINUTES_IN_DAY = 24 * 60;

export function createInitialTime(): GameTime {
  return {
    day: 1,
    hour: 7,
    minute: 0,
    weekday: 'monday'
  };
}

export function addMinutes(time: GameTime, minutesToAdd: number): GameTime {
  const safeMinutesToAdd = Math.max(0, Math.floor(minutesToAdd));
  const currentTotalMinutes = (time.day - 1) * MINUTES_IN_DAY + time.hour * 60 + time.minute;
  const nextTotalMinutes = currentTotalMinutes + safeMinutesToAdd;
  const nextDay = Math.floor(nextTotalMinutes / MINUTES_IN_DAY) + 1;
  const minutesInsideDay = nextTotalMinutes % MINUTES_IN_DAY;

  return {
    day: nextDay,
    hour: Math.floor(minutesInsideDay / 60),
    minute: minutesInsideDay % 60,
    weekday: WEEKDAYS[(nextDay - 1) % WEEKDAYS.length]
  };
}

export function formatGameTime(time: GameTime): string {
  const hour = String(time.hour).padStart(2, '0');
  const minute = String(time.minute).padStart(2, '0');

  return `${hour}:${minute}`;
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


export function getTotalMinutes(time: GameTime): number {
  return (time.day - 1) * MINUTES_IN_DAY + time.hour * 60 + time.minute;
}

export function getElapsedMinutes(fromTime: GameTime, toTime: GameTime): number {
  return Math.max(0, getTotalMinutes(toTime) - getTotalMinutes(fromTime));
}

export function fromTotalMinutes(totalMinutes: number): GameTime {
  const safe = Math.max(0, Math.floor(totalMinutes));
  const day = Math.floor(safe / (24 * 60)) + 1;
  const insideDay = safe % (24 * 60);
  return { day, hour: Math.floor(insideDay / 60), minute: insideDay % 60, weekday: WEEKDAYS[(day - 1) % WEEKDAYS.length] };
}
