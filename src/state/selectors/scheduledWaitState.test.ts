import { describe, expect, it } from 'vitest';
import type { LocationId, PhoneCalendarEventId, UniversitySubjectId } from '../../types/ids';
import type { PhoneCalendarEvent } from '../../types/phone';
import type { UniversityClassView } from '../../types/university';
import { selectScheduledWaitState } from './scheduledWaitState';

const locationId = (value: string) => value as LocationId;
const calendarId = (value: string) => value as PhoneCalendarEventId;
const subjectId = (value: string) => value as UniversitySubjectId;

function event(overrides: Partial<PhoneCalendarEvent> = {}): PhoneCalendarEvent {
  return {
    id: calendarId('event_1'),
    type: 'intercity_departure',
    title: 'Поезд: Москва — Ярославль',
    locationId: locationId('station'),
    startsAtTotalMinutes: 600,
    durationMinutes: 180,
    status: 'scheduled',
    ...overrides
  };
}

function universityClass(startsAtTotalMinutes: number): UniversityClassView {
  return {
    subject: {
      id: subjectId('math'),
      title: 'Математика',
      skillId: 'logic' as UniversityClassView['subject']['skillId'],
      weekday: 'monday',
      startMinute: 600,
      durationMinutes: 90,
      experienceReward: 10
    },
    startsAtTotalMinutes,
    sessionKey: `math_${startsAtTotalMinutes}`,
    isToday: true,
    canAttend: false,
    failure: 'Пара ещё не началась.'
  };
}

describe('selectScheduledWaitState', () => {
  it('selects the earliest scheduled event at the current location', () => {
    const result = selectScheduledWaitState({
      currentTotalMinutes: 420,
      currentLocationId: locationId('station'),
      calendarEvents: [
        event({ id: calendarId('later'), startsAtTotalMinutes: 720 }),
        event({ id: calendarId('earlier'), startsAtTotalMinutes: 600 })
      ]
    });

    expect(result).toMatchObject({
      kind: 'intercity_departure',
      title: 'Подождать поезд',
      minutes: 180,
      startsAtTotalMinutes: 600
    });
  });

  it('includes the next university class at the campus', () => {
    const result = selectScheduledWaitState({
      currentTotalMinutes: 500,
      currentLocationId: locationId('campus'),
      calendarEvents: [],
      universityClasses: [universityClass(620)],
      universityLocationId: locationId('campus')
    });

    expect(result).toMatchObject({
      kind: 'university_class',
      title: 'Подождать пару',
      description: 'Математика',
      minutes: 120
    });
  });

  it('ignores events at another location or more than a day away', () => {
    expect(selectScheduledWaitState({
      currentTotalMinutes: 100,
      currentLocationId: locationId('station'),
      calendarEvents: [
        event({ locationId: locationId('other'), startsAtTotalMinutes: 200 }),
        event({ startsAtTotalMinutes: 1600 })
      ],
      maxWaitMinutes: 1440
    })).toBeUndefined();
  });
});
