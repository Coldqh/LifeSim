import { describe, expect, it } from 'vitest';
import type { CityId, DistrictId, JobId, LocationId, PhoneCalendarEventId, UniversitySubjectId } from '../../types/ids';
import type { Job } from '../../types/job';
import type { Location } from '../../types/location';
import type { UniversityClassView } from '../../types/university';
import { selectDailyLifeState, type DailyLifeSelectorInput } from './index';

const cityId = 'city' as CityId;
const districtId = 'district' as DistrictId;
const homeId = 'home' as LocationId;
const campusId = 'campus' as LocationId;
const workId = 'work' as LocationId;

function location(id: LocationId, name: string, type: Location['type']): Location {
  return {
    id,
    cityId,
    districtId,
    name,
    address: 'Адрес',
    type,
    description: '',
    availableActionIds: []
  };
}

const home = location(homeId, 'Дом', 'home');
const campus = location(campusId, 'Университет', 'university');
const workplace = location(workId, 'Кофейня', 'cafe');

const job: Job = {
  id: 'job' as JobId,
  title: 'Бариста',
  category: 'service',
  locationId: workId,
  description: '',
  wagePerShift: 1800,
  shiftDurationMinutes: 240,
  experiencePerShift: 10,
  promotionThreshold: 100,
  effects: { moneyDelta: 1800, needsDelta: { energy: -18 } },
  levels: [{ level: 1, title: 'Бариста', wagePerShift: 1800 }]
};

const universityClass: UniversityClassView = {
  subject: {
    id: 'subject' as UniversitySubjectId,
    title: 'Математика',
    skillId: 'math' as never,
    weekday: 'monday',
    startMinute: 10 * 60 + 30,
    durationMinutes: 60,
    experienceReward: 10
  },
  startsAtTotalMinutes: 10 * 60 + 30,
  sessionKey: '1:subject',
  isToday: true,
  canAttend: true
};

function buildInput(day = 1): DailyLifeSelectorInput {
  return {
    time: {
      day,
      hour: 9,
      minute: 0,
      weekday: day === 1 ? 'monday' as const : 'tuesday' as const,
      calendar: { year: 2026, month: 9, dayOfMonth: 6 + day, season: 'autumn' as const }
    },
    money: 5000,
    currentLocation: home,
    locations: [home, campus, workplace],
    calendarEvents: [{
      id: 'event' as PhoneCalendarEventId,
      type: 'job_interview' as const,
      title: 'Собеседование',
      locationId: workId,
      startsAtTotalMinutes: (day - 1) * 1440 + 10 * 60,
      durationMinutes: 60,
      status: 'scheduled' as const
    }],
    universityClasses: day === 1 ? [universityClass] : [],
    universityLocation: campus,
    attendedUniversitySessionKeys: [],
    missedUniversitySessionKeys: [],
    currentJob: job,
    currentJobWage: 2100,
    jobLocation: workplace,
    upcomingPayments: [{ id: 'rent', title: 'Аренда', amount: 4200, dueDay: day + 1, category: 'housing' as const }],
    opportunityResolutions: [],
    libraryActivityId: 'library' as never,
    recoveryActionId: 'walk' as never,
    lifeLog: []
  };
}

describe('daily life director', () => {
  it('combines obligations, travel and time conflicts', () => {
    const result = selectDailyLifeState(buildInput());
    const interview = result.agenda.find((item) => item.title === 'Собеседование');
    const lesson = result.agenda.find((item) => item.title === 'Математика');

    expect(interview?.travelMinutes).toBe(20);
    expect(interview?.leaveByTotalMinutes).toBe(9 * 60 + 40);
    expect(interview?.conflictIds).toContain(lesson?.id);
    expect(lesson?.conflictIds).toContain(interview?.id);
    expect(result.conflictCount).toBe(1);
    expect(result.mandatoryCount).toBe(3);
  });

  it('shows near payments and remaining money', () => {
    const result = selectDailyLifeState(buildInput());

    expect(result.payments).toEqual([expect.objectContaining({ title: 'Аренда', daysUntilDue: 1 })]);
    expect(result.remainingAfterPayments).toBe(800);
  });

  it('rotates contextual opportunities and restores their decision', () => {
    const input = buildInput(2);
    const opportunityId = 'study_session:2';
    input.opportunityResolutions = [{ day: 2, opportunityId, decision: 'accepted', resolvedAtTotalMinutes: 1500 }];

    const result = selectDailyLifeState(input);

    expect(result.opportunity).toMatchObject({ id: opportunityId, kind: 'study_session', decision: 'accepted' });
  });
});
