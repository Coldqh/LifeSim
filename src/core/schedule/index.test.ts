import { describe, expect, it } from 'vitest';
import type { WeeklySchedule } from '../../types/schedule';
import type { GameTime } from '../../types/time';
import { getScheduleStatus } from './index';

const weekdaySchedule: WeeklySchedule = {
  kind: 'weekly',
  days: {
    monday: [{ startMinute: 9 * 60, endMinute: 18 * 60 }]
  }
};

function createTime(hour: number, minute: number, weekday: GameTime['weekday'] = 'monday'): GameTime {
  return {
    day: 1,
    hour,
    minute,
    weekday,
    calendar: { year: 2026, month: 9, dayOfMonth: 7, season: 'autumn' }
  };
}

describe('getScheduleStatus', () => {
  it('opens exactly at the configured opening minute', () => {
    expect(getScheduleStatus(weekdaySchedule, createTime(9, 0))).toMatchObject({
      isOpen: true,
      label: 'Открыто до 18:00'
    });
  });

  it('closes exactly at the configured closing minute', () => {
    expect(getScheduleStatus(weekdaySchedule, createTime(18, 0))).toMatchObject({
      isOpen: false,
      label: 'Откроется пн в 09:00'
    });
  });

  it('shows the next opening on a closed weekday', () => {
    expect(getScheduleStatus(weekdaySchedule, createTime(12, 0, 'sunday'))).toMatchObject({
      isOpen: false,
      label: 'Откроется завтра в 09:00'
    });
  });

  it('keeps an overnight window open after midnight', () => {
    const overnight: WeeklySchedule = {
      kind: 'weekly',
      days: {
        monday: [{ startMinute: 22 * 60, endMinute: 2 * 60 }]
      }
    };

    expect(getScheduleStatus(overnight, createTime(1, 30, 'tuesday'))).toMatchObject({
      isOpen: true,
      label: 'Открыто до 02:00'
    });
  });
});
