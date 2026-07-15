export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export type CalendarDate = {
  year: number;
  month: number;
  dayOfMonth: number;
};

export type GameCalendarDate = CalendarDate & {
  season: Season;
};

export type GameTime = {
  /** Absolute one-based day used by existing simulation systems. */
  day: number;
  hour: number;
  minute: number;
  weekday: Weekday;
  calendar: GameCalendarDate;
};
