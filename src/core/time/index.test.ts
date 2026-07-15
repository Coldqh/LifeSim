import { describe, expect, it } from 'vitest';
import { addMinutes, calculateAge, createInitialTime, formatGameDate, fromTotalMinutes, getCalendarDateForDay } from './index';

describe('calendar time', () => {
  it('adds minutes and crosses into the next day', () => {
    const time = { ...createInitialTime(), hour: 23, minute: 50 };

    expect(addMinutes(time, 20)).toEqual({
      day: 2,
      hour: 0,
      minute: 10,
      weekday: 'tuesday',
      calendar: { year: 2026, month: 9, dayOfMonth: 8, season: 'autumn' }
    });
  });

  it('crosses month, year and leap-day boundaries deterministically', () => {
    expect(getCalendarDateForDay(24)).toEqual({ year: 2026, month: 9, dayOfMonth: 30, season: 'autumn' });
    expect(getCalendarDateForDay(25)).toEqual({ year: 2026, month: 10, dayOfMonth: 1, season: 'autumn' });
    expect(getCalendarDateForDay(116)).toEqual({ year: 2026, month: 12, dayOfMonth: 31, season: 'winter' });
    expect(getCalendarDateForDay(117)).toEqual({ year: 2027, month: 1, dayOfMonth: 1, season: 'winter' });
    expect(getCalendarDateForDay(541)).toEqual({ year: 2028, month: 2, dayOfMonth: 29, season: 'winter' });
  });

  it('formats dates and calculates age from the stored birthday', () => {
    const time = fromTotalMinutes((347 - 1) * 1440);
    expect(formatGameDate(time)).toBe('19 августа 2027');
    expect(calculateAge({ year: 2008, month: 8, dayOfMonth: 20 }, time.calendar)).toBe(18);
    expect(calculateAge({ year: 2008, month: 8, dayOfMonth: 20 }, addMinutes(time, 1440).calendar)).toBe(19);
  });
});
