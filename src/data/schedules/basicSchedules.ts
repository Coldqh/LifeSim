import type { ScheduleWindow, WeeklySchedule } from '../../types/schedule';
import type { Weekday } from '../../types/time';

const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const WORKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const WEEKEND: Weekday[] = ['saturday', 'sunday'];

function at(hour: number, minute = 0): number {
  return hour * 60 + minute;
}

function window(startHour: number, endHour: number, startMinute = 0, endMinute = 0): ScheduleWindow {
  return {
    startMinute: at(startHour, startMinute),
    endMinute: endHour === 24 ? 24 * 60 : at(endHour, endMinute)
  };
}

function scheduleForDays(entries: Array<{ days: Weekday[]; windows: ScheduleWindow[] }>): WeeklySchedule {
  const days: Partial<Record<Weekday, ScheduleWindow[]>> = {};
  entries.forEach((entry) => entry.days.forEach((day) => { days[day] = entry.windows; }));
  return { kind: 'weekly', days };
}

function everyDay(...windows: ScheduleWindow[]): WeeklySchedule {
  return scheduleForDays([{ days: WEEKDAYS, windows }]);
}

export const ALWAYS_OPEN_SCHEDULE: WeeklySchedule = { kind: 'always' };
export const GROCERY_SCHEDULE = everyDay(window(8, 23));
export const CAFE_SCHEDULE = everyDay(window(7, 22));
export const PREMIUM_CAFE_SCHEDULE = everyDay(window(8, 23));
export const SERVICE_SCHEDULE = scheduleForDays([
  { days: WORKDAYS, windows: [window(9, 21)] },
  { days: WEEKEND, windows: [window(10, 20)] }
]);
export const WAREHOUSE_SCHEDULE = scheduleForDays([
  { days: WORKDAYS, windows: [window(8, 20)] },
  { days: ['saturday'], windows: [window(9, 18)] }
]);
export const OFFICE_SCHEDULE = scheduleForDays([{ days: WORKDAYS, windows: [window(9, 19)] }]);
export const BUSINESS_CENTER_SCHEDULE = scheduleForDays([{ days: WORKDAYS, windows: [window(8, 20)] }]);
export const COWORKING_SCHEDULE = everyDay(window(8, 22));
export const FITNESS_SCHEDULE = everyDay(window(6, 24));
export const SPORT_FACILITY_SCHEDULE = everyDay(window(6, 23));
export const CLINIC_SCHEDULE = scheduleForDays([
  { days: WORKDAYS, windows: [window(8, 20)] },
  { days: WEEKEND, windows: [window(9, 18)] }
]);
export const PHARMACY_SCHEDULE = everyDay(window(8, 22));
export const RESTAURANT_SCHEDULE = everyDay(window(9, 23));
export const FOOD_COURT_SCHEDULE = everyDay(window(10, 22));
export const PICKUP_POINT_SCHEDULE = everyDay(window(9, 21));
export const MALL_SCHEDULE = everyDay(window(10, 22));
export const RETAIL_SCHEDULE = everyDay(window(10, 22));
export const BANK_SCHEDULE = scheduleForDays([{ days: WORKDAYS, windows: [window(9, 18)] }]);
export const EDUCATION_CENTER_SCHEDULE = scheduleForDays([
  { days: WORKDAYS, windows: [window(10, 20)] },
  { days: ['saturday'], windows: [window(10, 18)] }
]);
export const UNIVERSITY_SCHEDULE = scheduleForDays([
  { days: WORKDAYS, windows: [window(8, 21)] },
  { days: ['saturday'], windows: [window(9, 18)] }
]);
export const NIGHT_SHIFT_SCHEDULE = everyDay(window(20, 6));
