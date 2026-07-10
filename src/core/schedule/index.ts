import type { ScheduleStatus, ScheduleWindow, WeeklySchedule } from '../../types/schedule';
import type { GameTime, Weekday } from '../../types/time';

const MINUTES_IN_DAY = 24 * 60;
const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
  monday: 'пн',
  tuesday: 'вт',
  wednesday: 'ср',
  thursday: 'чт',
  friday: 'пт',
  saturday: 'сб',
  sunday: 'вс'
};

type ActiveWindow = {
  endAbsoluteMinute: number;
};

type NextOpening = {
  startMinute: number;
  dayOffset: number;
  weekday: Weekday;
};

function normalizeMinute(value: number): number {
  return Math.min(MINUTES_IN_DAY, Math.max(0, Math.floor(value)));
}

function minuteOfDay(time: GameTime): number {
  return time.hour * 60 + time.minute;
}

function weekdayIndex(weekday: Weekday): number {
  return WEEKDAYS.indexOf(weekday);
}

function weekdayAtOffset(weekday: Weekday, offset: number): Weekday {
  return WEEKDAYS[(weekdayIndex(weekday) + offset + WEEKDAYS.length) % WEEKDAYS.length];
}

function getWindows(schedule: WeeklySchedule, weekday: Weekday): ScheduleWindow[] {
  if (schedule.kind === 'always') return [{ startMinute: 0, endMinute: MINUTES_IN_DAY }];
  return schedule.days[weekday] ?? [];
}

function isFullDay(window: ScheduleWindow): boolean {
  return normalizeMinute(window.startMinute) === 0 && normalizeMinute(window.endMinute) === MINUTES_IN_DAY;
}

function findActiveWindow(schedule: WeeklySchedule, time: GameTime): ActiveWindow | undefined {
  if (schedule.kind === 'always') {
    return { endAbsoluteMinute: minuteOfDay(time) + MINUTES_IN_DAY };
  }

  const currentMinute = minuteOfDay(time);
  const currentWindows = getWindows(schedule, time.weekday);

  for (const window of currentWindows) {
    const start = normalizeMinute(window.startMinute);
    const end = normalizeMinute(window.endMinute);

    if (isFullDay(window)) {
      return { endAbsoluteMinute: MINUTES_IN_DAY };
    }

    if (end > start && currentMinute >= start && currentMinute < end) {
      return { endAbsoluteMinute: end };
    }

    if (end <= start && currentMinute >= start) {
      return { endAbsoluteMinute: MINUTES_IN_DAY + end };
    }
  }

  const previousWeekday = weekdayAtOffset(time.weekday, -1);
  const previousWindows = getWindows(schedule, previousWeekday);

  for (const window of previousWindows) {
    const start = normalizeMinute(window.startMinute);
    const end = normalizeMinute(window.endMinute);

    if (!isFullDay(window) && end <= start && currentMinute < end) {
      return { endAbsoluteMinute: end };
    }
  }

  return undefined;
}

function findNextOpening(schedule: WeeklySchedule, time: GameTime): NextOpening | undefined {
  if (schedule.kind === 'always') {
    return { startMinute: minuteOfDay(time), dayOffset: 0, weekday: time.weekday };
  }

  const currentMinute = minuteOfDay(time);

  for (let dayOffset = 0; dayOffset <= 7; dayOffset += 1) {
    const weekday = weekdayAtOffset(time.weekday, dayOffset);
    const windows = [...getWindows(schedule, weekday)].sort((a, b) => a.startMinute - b.startMinute);

    for (const window of windows) {
      const start = normalizeMinute(window.startMinute);
      if (dayOffset === 0 && start <= currentMinute) continue;
      return { startMinute: start, dayOffset, weekday };
    }
  }

  return undefined;
}

export function formatMinuteOfDay(value: number): string {
  const normalized = ((Math.floor(value) % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hour = String(Math.floor(normalized / 60)).padStart(2, '0');
  const minute = String(normalized % 60).padStart(2, '0');
  return `${hour}:${minute}`;
}

function formatNextOpening(nextOpening: NextOpening | undefined): string {
  if (!nextOpening) return 'Закрыто';
  const timeLabel = formatMinuteOfDay(nextOpening.startMinute);
  if (nextOpening.dayOffset === 0) return `Откроется в ${timeLabel}`;
  if (nextOpening.dayOffset === 1) return `Откроется завтра в ${timeLabel}`;
  return `Откроется ${WEEKDAY_SHORT_LABELS[nextOpening.weekday]} в ${timeLabel}`;
}

export function getScheduleStatus(schedule: WeeklySchedule | undefined, time: GameTime): ScheduleStatus {
  if (!schedule || schedule.kind === 'always') {
    return {
      isOpen: true,
      isAlwaysOpen: true,
      label: 'Круглосуточно',
      shortLabel: '24/7'
    };
  }

  const activeWindow = findActiveWindow(schedule, time);
  if (activeWindow) {
    const currentMinute = minuteOfDay(time);
    const minutesUntilClose = Math.max(0, activeWindow.endAbsoluteMinute - currentMinute);
    const closingMinute = currentMinute + minutesUntilClose;
    return {
      isOpen: true,
      isAlwaysOpen: false,
      label: `Открыто до ${formatMinuteOfDay(closingMinute)}`,
      shortLabel: 'Открыто',
      nextChangeMinute: closingMinute,
      nextChangeDayOffset: closingMinute >= MINUTES_IN_DAY ? 1 : 0
    };
  }

  const nextOpening = findNextOpening(schedule, time);
  return {
    isOpen: false,
    isAlwaysOpen: false,
    label: formatNextOpening(nextOpening),
    shortLabel: 'Закрыто',
    nextChangeMinute: nextOpening?.startMinute,
    nextChangeDayOffset: nextOpening?.dayOffset
  };
}

export function getScheduleActivityFailure(
  schedule: WeeklySchedule | undefined,
  time: GameTime,
  durationMinutes = 0,
  activityLabel = 'Действие'
): string | undefined {
  const status = getScheduleStatus(schedule, time);
  if (!status.isOpen) return `${activityLabel} недоступно. ${status.label}.`;
  if (status.isAlwaysOpen || durationMinutes <= 0) return undefined;

  const activeWindow = findActiveWindow(schedule ?? { kind: 'always' }, time);
  if (!activeWindow) return `${activityLabel} недоступно. ${status.label}.`;

  const currentMinute = minuteOfDay(time);
  const minutesUntilClose = activeWindow.endAbsoluteMinute - currentMinute;
  if (durationMinutes > minutesUntilClose) {
    return `${activityLabel} не успеет завершиться до закрытия в ${formatMinuteOfDay(activeWindow.endAbsoluteMinute)}.`;
  }

  return undefined;
}
