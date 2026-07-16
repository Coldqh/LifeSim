import { describe, expect, it } from 'vitest';
import {
  getUniversityClasses,
  getUniversitySemesterExamFailure,
  getUniversitySemesterSummary,
  performUniversityCampusActivity
} from './index';
import { UNIVERSITY_CAMPUS_ACTIVITY_IDS, getUniversityCampusActivityById } from '../../data/education/universityActivities';
import type { DegreeProgramDefinition, UniversityDefinition, UniversityState, UniversitySubjectDefinition } from '../../types/university';
import type { Player } from '../../types/player';
import type { GameTime } from '../../types/time';
import type { CityId, DegreeProgramId, DistrictId, LocationId, PlayerId, SkillId, UniversityId, UniversitySubjectId } from '../../types/ids';
import type { HousingId } from '../../types/housing';

const asId = <T>(value: string) => value as T;
const subjectId = asId<UniversitySubjectId>('subject_test');
const campusId = asId<LocationId>('campus_test');

const program: DegreeProgramDefinition = {
  id: asId<DegreeProgramId>('program_test'),
  universityId: asId<UniversityId>('university_test'),
  title: 'Тестовая программа',
  durationSemesters: 8,
  tuitionPerSemester: 1000,
  entranceDifficulty: 1,
  subjectIds: [subjectId],
  careerTags: []
};

const university: UniversityDefinition = {
  id: program.universityId,
  name: 'Тестовый университет',
  shortName: 'ТУ',
  cityId: asId<CityId>('city_test'),
  locationId: campusId,
  address: 'Кампус',
  description: '',
  programIds: [program.id]
};

const subjects: UniversitySubjectDefinition[] = [{
  id: subjectId,
  title: 'Тестовый предмет',
  skillId: asId<SkillId>('skill_test'),
  weekday: 'monday',
  startMinute: 600,
  durationMinutes: 90,
  experienceReward: 10
}];

const time: GameTime = { day: 1, hour: 9, minute: 0, weekday: 'monday', calendar: { year: 2026, month: 9, dayOfMonth: 1, season: 'autumn' } };

function createPlayer(locationId: LocationId | undefined = campusId): Player {
  return {
    id: asId<PlayerId>('player_test'),
    name: 'Игрок',
    age: 19,
    birthDate: { year: 2007, month: 9, dayOfMonth: 1 },
    money: 1000,
    cityId: university.cityId,
    districtId: asId<DistrictId>('district_test'),
    locationId,
    needs: { hunger: 50, thirst: 50, energy: 60, health: 100, mood: 50 },
    skills: {},
    inventory: [],
    completedShifts: {},
    jobExperience: {},
    jobLevels: {},
    housingId: asId<HousingId>('housing_test'),
    rentDebt: 0,
    daysUntilRent: 30,
    rentalContract: {} as Player['rentalContract'],
    boxing: {} as Player['boxing']
  };
}

function createState(): UniversityState {
  return {
    applications: [],
    enrollment: {
      programId: program.id,
      startedDay: 1,
      semester: 1,
      tuitionPaidThroughSemester: 1,
      studyLoad: 20,
      subjectProgress: {
        [subjectId]: { classesAttended: 0, classesMissed: 0, assignmentsCompleted: 0, knowledge: 15 }
      },
      assignments: [],
      attendedSessionKeys: [],
      missedSessionKeys: [],
      examsPassed: 0,
      completed: false
    },
    history: [],
    lastProcessedTotalMinutes: 540
  };
}

describe('university campus activities', () => {
  it('requires the enrolled player to be at their university', () => {
    const activity = getUniversityCampusActivityById(UNIVERSITY_CAMPUS_ACTIVITY_IDS.library)!;
    const result = performUniversityCampusActivity({
      state: createState(),
      player: createPlayer(asId<LocationId>('outside_campus')),
      time,
      program,
      university,
      subjects,
      activity
    });

    expect(result.result.ok).toBe(false);
    expect(result.result.message).toBe('Нужно быть в своём университете.');
    expect(result.time).toEqual(time);
  });

  it('raises knowledge in the weakest subject and advances time in the library', () => {
    const activity = getUniversityCampusActivityById(UNIVERSITY_CAMPUS_ACTIVITY_IDS.library)!;
    const result = performUniversityCampusActivity({
      state: createState(),
      player: createPlayer(),
      time,
      program,
      university,
      subjects,
      activity
    });

    expect(result.result.ok).toBe(true);
    expect(result.time).toMatchObject({ hour: 10, minute: 30 });
    expect(result.state.enrollment?.subjectProgress[subjectId]?.knowledge).toBe(25);
    expect(result.state.enrollment?.studyLoad).toBe(25);
    expect(result.player.needs.energy).toBeLessThan(60);
  });

  it('charges money and restores needs in the cafeteria', () => {
    const activity = getUniversityCampusActivityById(UNIVERSITY_CAMPUS_ACTIVITY_IDS.cafeteria)!;
    const player = createPlayer();
    player.needs.hunger = 25;
    player.needs.thirst = 30;
    const result = performUniversityCampusActivity({
      state: createState(),
      player,
      time,
      program,
      university,
      subjects,
      activity
    });

    expect(result.result.ok).toBe(true);
    expect(result.player.money).toBe(680);
    expect(result.player.needs.hunger).toBeGreaterThan(25);
    expect(result.player.needs.thirst).toBeGreaterThan(30);
    expect(result.state.enrollment?.studyLoad).toBe(17);
  });
});

describe('university semester summary', () => {
  it('reports attendance, academic debt and the exam penalty from existing enrollment data', () => {
    const state = createState();
    state.enrollment!.subjectProgress[subjectId] = {
      classesAttended: 2,
      classesMissed: 1,
      assignmentsCompleted: 1,
      knowledge: 64
    };
    state.enrollment!.assignments = [{
      id: 'assignment_overdue',
      subjectId,
      title: 'Просроченное задание',
      dueDay: 1,
      durationMinutes: 120,
      completed: false,
      missed: true
    }];

    const summary = getUniversitySemesterSummary({ state, program, subjects });

    expect(summary).toMatchObject({
      attendedClasses: 2,
      missedClasses: 1,
      attendanceRate: 67,
      overdueAssignments: 1,
      academicDebtCount: 2,
      examPenaltyPoints: 4,
      examRequirementsMet: true,
      averageKnowledge: 64
    });
  });

  it('returns the exact remaining requirements before the semester exam', () => {
    const state = createState();

    expect(getUniversitySemesterExamFailure({
      state,
      program,
      university,
      currentLocationId: campusId
    })).toBe('До допуска нужно посетить ещё 2 пары и сдать ещё 1 задание.');

    state.enrollment!.subjectProgress[subjectId] = {
      classesAttended: 2,
      classesMissed: 0,
      assignmentsCompleted: 1,
      knowledge: 60
    };

    expect(getUniversitySemesterExamFailure({
      state,
      program,
      university,
      currentLocationId: asId<LocationId>('outside_campus')
    })).toBe('Нужно приехать в университет.');
  });

  it('shows the time blocker before the location blocker for a future class', () => {
    const state = createState();
    const classes = getUniversityClasses({
      state,
      time,
      program,
      subjects,
      university,
      currentLocationId: asId<LocationId>('outside_campus')
    });

    expect(classes[0]?.failure).toBe('Пара ещё не началась.');
  });
});
