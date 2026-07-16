import { describe, expect, it } from 'vitest';
import type { CityId, DistrictId, LocationId, NpcId, NpcRoleId } from '../../types/ids';
import type { Npc } from '../../types/npc';
import type { PopulationState } from '../../types/population';
import { createInitialNpcLifeState, getNpcScheduleConflict, processNpcDailyPopulation } from './index';

const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

function createNpc(profile: Npc['activityProfile'], id = `npc_${profile}`): Npc {
  const life = createInitialNpcLifeState({ npcId: id, activityProfile: profile, day: 1, reliability: 70 });
  return {
    id: id as NpcId,
    firstName: 'Илья',
    lastName: 'Тестов',
    age: 22,
    homeDistrictId: 'district_test' as DistrictId,
    activityProfile: profile,
    activationDay: 1,
    preferredLocationTypes: [],
    employment: profile === 'worker' ? {
      locationId: 'workplace_test' as LocationId,
      roleId: 'role_test' as NpcRoleId,
      workdays: [...allDays],
      startMinute: 9 * 60,
      endMinute: 17 * 60
    } : undefined,
    personality: { sociability: 50, temperament: 50, reliability: 70, ambition: 50, generosity: 50, interests: [] },
    life,
    worldState: { kind: 'home', sinceTotalMinutes: 0 }
  };
}

function population(npcs: Npc[]): PopulationState {
  return { seed: 11, generatedAtDay: 1, lastSimulatedTotalMinutes: 0, npcs };
}

describe('NPC daily simulation', () => {
  it('makes an unemployed resident search for work across weekdays', () => {
    const unemployed = createNpc('unemployed');
    const result = processNpcDailyPopulation({
      population: population([unemployed]),
      fromDay: 1,
      toDay: 3,
      getNpcCityId: () => 'moscow' as CityId
    });

    expect(result.population.npcs[0].life.jobSearchDays).toBeGreaterThan(unemployed.life.jobSearchDays);
    expect(result.population.npcs[0].life.lastOutcome?.kind).toBe('searched_job');
  });

  it('removes employment after repeated missed shifts', () => {
    const worker = createNpc('worker');
    worker.life = {
      ...worker.life,
      warningCount: 3,
      sickUntilDay: 2,
      lastProcessedDay: 1
    };
    const result = processNpcDailyPopulation({
      population: population([worker]),
      fromDay: 1,
      toDay: 2,
      getNpcCityId: () => 'moscow' as CityId
    });

    expect(result.population.npcs[0].activityProfile).toBe('unemployed');
    expect(result.population.npcs[0].employment).toBeUndefined();
    expect(result.events.some((event) => event.kind === 'job_lost')).toBe(true);
  });

  it('blocks meetings during work, study and sickness', () => {
    const worker = createNpc('worker');
    const student = createNpc('student');
    const mondayTen = 10 * 60;

    expect(getNpcScheduleConflict(worker, mondayTen)).toContain('работает');
    expect(getNpcScheduleConflict(student, mondayTen)).toContain('учёбе');

    student.life.sickUntilDay = 1;
    expect(getNpcScheduleConflict(student, 18 * 60)).toContain('болеет');
  });
});
