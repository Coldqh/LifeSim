import type { Weekday } from './time';

export type ScheduleWindow = {
  startMinute: number;
  endMinute: number;
};

export type WeeklySchedule =
  | {
      kind: 'always';
    }
  | {
      kind: 'weekly';
      days: Partial<Record<Weekday, ScheduleWindow[]>>;
    };

export type ScheduleStatus = {
  isOpen: boolean;
  isAlwaysOpen: boolean;
  label: string;
  shortLabel: string;
  nextChangeMinute?: number;
  nextChangeDayOffset?: number;
};
