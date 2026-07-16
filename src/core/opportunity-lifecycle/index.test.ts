import { describe, expect, it } from 'vitest';
import type { Job } from '../../types/job';
import type { CityId, DistrictId, JobId, LocationId, NpcId, NpcRoleId } from '../../types/ids';
import type { Npc } from '../../types/npc';
import { createInitialOpportunityState, processOpportunityLifecycle } from './index';

const cityId = 'moscow' as CityId;
const locationId = 'test_workplace' as LocationId;
const job: Job = {
  id: 'job_test' as JobId,
  title: 'Тестовая работа',
  category: 'office',
  locationId,
  description: 'Test',
  wagePerShift: 1000,
  shiftDurationMinutes: 240,
  experiencePerShift: 10,
  promotionThreshold: 100,
  effects: { moneyDelta: 1000, needsDelta: { energy: -10 } },
  levels: [{ level: 1, title: 'Стажёр', wagePerShift: 1000 }]
};
const npc: Npc = {
  id: 'npc_candidate' as NpcId,
  firstName: 'Илья',
  lastName: 'Смирнов',
  age: 22,
  homeDistrictId: 'district_test' as DistrictId,
  activityProfile: 'unemployed',
  activationDay: 1,
  preferredLocationTypes: ['workplace'],
  personality: {
    sociability: 50,
    temperament: 50,
    reliability: 50,
    ambition: 50,
    generosity: 50,
    interests: []
  },
  worldState: { kind: 'home', sinceTotalMinutes: 0 }
};
const rules = {
  minOpenDays: 1,
  maxOpenDays: 1,
  minClosedDays: 2,
  maxClosedDays: 2,
  npcFillChancePercent: 100,
  maxHistoryEntries: 20
};

function initial() {
  return createInitialOpportunityState({
    seed: 7,
    day: 1,
    jobs: [job],
    getJobCityId: () => cityId,
    rules
  });
}

describe('opportunity lifecycle', () => {
  it('lets another person fill an expired vacancy and changes their world employment', () => {
    const result = processOpportunityLifecycle({
      state: initial(),
      fromDay: 1,
      toDay: 2,
      jobs: [job],
      npcs: [npc],
      getJobCityId: () => cityId,
      getNpcCityId: () => cityId,
      getNpcRoleId: () => 'npc_role_office_worker' as NpcRoleId,
      rules
    });

    expect(result.state.jobListings[String(job.id)]).toMatchObject({
      status: 'filled',
      resolvedDay: 2,
      reopenDay: 4,
      filledByNpcId: npc.id
    });
    expect(result.npcs[0].activityProfile).toBe('worker');
    expect(result.npcs[0].employment).toMatchObject({ locationId, roleId: 'npc_role_office_worker' });
    expect(result.events[0].text).toContain('Илья Смирнов');
  });

  it('keeps an invited vacancy alive until the interview is resolved', () => {
    const result = processOpportunityLifecycle({
      state: initial(),
      fromDay: 1,
      toDay: 2,
      jobs: [job],
      npcs: [npc],
      protectedJobIds: [job.id],
      getJobCityId: () => cityId,
      getNpcCityId: () => cityId,
      getNpcRoleId: () => 'npc_role_office_worker' as NpcRoleId,
      rules
    });

    expect(result.state.jobListings[String(job.id)]).toMatchObject({ status: 'open', closesDay: 3 });
    expect(result.events).toHaveLength(0);
    expect(result.npcs[0].employment).toBeUndefined();
  });

  it('reopens a filled vacancy after its closed period', () => {
    const filled = processOpportunityLifecycle({
      state: initial(),
      fromDay: 1,
      toDay: 2,
      jobs: [job],
      npcs: [npc],
      getJobCityId: () => cityId,
      getNpcCityId: () => cityId,
      getNpcRoleId: () => 'npc_role_office_worker' as NpcRoleId,
      rules
    });
    const reopened = processOpportunityLifecycle({
      state: filled.state,
      fromDay: 2,
      toDay: 4,
      jobs: [job],
      npcs: filled.npcs,
      getJobCityId: () => cityId,
      getNpcCityId: () => cityId,
      getNpcRoleId: () => 'npc_role_office_worker' as NpcRoleId,
      rules
    });

    expect(reopened.state.jobListings[String(job.id)]).toMatchObject({ status: 'open', openedDay: 4, closesDay: 5 });
    expect(reopened.events.some((event) => event.kind === 'job_opened')).toBe(true);
  });
});
