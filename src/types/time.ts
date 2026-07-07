export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type GameTime = {
  day: number;
  hour: number;
  minute: number;
  weekday: Weekday;
};
