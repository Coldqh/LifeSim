import { describe, expect, it } from 'vitest';
import type { Housing } from '../../types/housing';
import type { Job } from '../../types/job';
import type { LifeProgressionSnapshot } from '../../types/lifeProgression';
import {
  createInitialLifeProgressionState,
  getBusinessProgressionFailure,
  getCareerInviteChanceDelta,
  getCareerProgressionFailure,
  getHousingProgressionFailure,
  getUniversityProgressionFailure,
  reconcileLifeProgression
} from '.';

function snapshot(day = 1): LifeProgressionSnapshot {
  return {
    day,
    career: {
      completedShifts: 0,
      promotionCount: 0,
      completedProbations: 0,
      professionalEmploymentCount: 0,
      qualificationCount: 0,
      missedInterviewIds: [],
      earlyResignationIds: []
    },
    education: {
      enrolled: false,
      applicationCount: 0,
      attendedClasses: 0,
      missedClasses: 0,
      assignmentsCompleted: 0,
      overdueAssignments: 0,
      examsPassed: 0,
      totalKnowledge: 0,
      degreeCount: 0,
      academicDebtCount: 0
    },
    independence: {
      currentHousingKind: 'bed_space',
      savings: 0,
      housingPaymentCount: 0,
      rentDebt: 0
    },
    social: {
      interactionCount: 0,
      contactCount: 0,
      completedMeetings: 0,
      missedMeetings: 0,
      positiveMemoryCount: 0,
      averageTrust: 0,
      averageAffinity: 0,
      averageTension: 0
    },
    business: {
      owned: false,
      totalServed: 0,
      profitableDays: 0,
      employeeCount: 0,
      upgradeCount: 0,
      reputation: 0,
      debt: 0
    }
  };
}

const professionalJob = { employmentType: 'professional' } as Job;
const studio = { kind: 'studio' } as Housing;

function reconcile(input: LifeProgressionSnapshot) {
  return reconcileLifeProgression({
    state: createInitialLifeProgressionState(input.day),
    snapshot: input
  });
}

describe('life progression', () => {
  it('turns real activity into track levels instead of button counters', () => {
    const input = snapshot(8);
    input.career.completedShifts = 5;
    input.education.enrolled = true;
    input.education.attendedClasses = 4;
    input.social.contactCount = 4;

    const result = reconcile(input);

    expect(result.state.tracks.career).toMatchObject({ xp: 50, level: 1 });
    expect(result.state.tracks.education.level).toBeGreaterThan(0);
    expect(result.state.tracks.social.level).toBeGreaterThan(0);
  });

  it('creates a temporary career consequence from a missed interview and lowers invite chance', () => {
    const input = snapshot(3);
    input.career.missedInterviewIds = ['application_1'];

    const result = reconcile(input);

    expect(result.activated[0]).toMatchObject({ kind: 'career_unreliable', expiresDay: 17 });
    expect(getCareerInviteChanceDelta(result.state)).toBeLessThan(0);
  });

  it('does not recreate an expired handled consequence', () => {
    const initialInput = snapshot(3);
    initialInput.career.missedInterviewIds = ['application_1'];
    const first = reconcile(initialInput);
    const later = snapshot(18);
    later.career.missedInterviewIds = ['application_1'];

    const second = reconcileLifeProgression({ state: first.state, snapshot: later });

    expect(second.state.consequences).toEqual([]);
    expect(second.resolved[0]?.kind).toBe('career_unreliable');
  });

  it('keeps persistent debt and academic consequences until their cause is fixed', () => {
    const input = snapshot(6);
    input.education.academicDebtCount = 4;
    input.independence.rentDebt = 9000;
    input.business.owned = true;
    input.business.debt = 12000;

    const result = reconcile(input);

    expect(result.state.consequences.map((entry) => entry.kind)).toEqual(expect.arrayContaining([
      'academic_warning',
      'rent_arrears',
      'business_debt'
    ]));
    expect(getUniversityProgressionFailure(result.state, 'university_activity_student_club')).toContain('академического предупреждения');
    expect(getHousingProgressionFailure(result.state, studio)).toContain('погаси долг');
  });

  it('opens professional work, better housing and business only through progression', () => {
    const base = createInitialLifeProgressionState(1);

    expect(getCareerProgressionFailure(base, professionalJob)).toContain('1 уровень');
    expect(getHousingProgressionFailure(base, studio)).toContain('уровень самостоятельности 1');
    expect(getBusinessProgressionFailure(base)).toContain('1 уровня самостоятельности');

    const progressed = {
      ...base,
      tracks: {
        ...base.tracks,
        career: { ...base.tracks.career, level: 1, reputation: 55 },
        independence: { ...base.tracks.independence, level: 1 }
      }
    };

    expect(getCareerProgressionFailure(progressed, professionalJob)).toBeUndefined();
    expect(getHousingProgressionFailure(progressed, studio)).toBeUndefined();
    expect(getBusinessProgressionFailure(progressed)).toBeUndefined();
  });
});
