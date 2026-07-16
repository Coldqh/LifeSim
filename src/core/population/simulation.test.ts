import { describe, expect, it } from 'vitest';
import type { CityId, DistrictId, LocationId, NpcId } from '../../types/ids';
import type { Location } from '../../types/location';
import type { Npc } from '../../types/npc';
import type { PopulationState } from '../../types/population';
import { fromTotalMinutes } from '../time';
import { createInitialNpcLifeState } from '../npc-daily';
import { simulatePopulation } from './simulation';

const city = 'moscow' as CityId;
const district = 'district_test' as DistrictId;
const universityId = 'university_test' as LocationId;
const businessCenterId = 'business_center_test' as LocationId;

const locations: Location[] = [
  {
    id: universityId,
    cityId: city,
    districtId: district,
    name: 'Университет',
    address: 'Учебная, 1',
    type: 'university',
    description: '',
    availableActionIds: [],
    openingHours: { kind: 'always' }
  },
  {
    id: businessCenterId,
    cityId: city,
    districtId: district,
    name: 'Деловой центр',
    address: 'Деловая, 1',
    type: 'business_center',
    description: '',
    availableActionIds: [],
    openingHours: { kind: 'always' }
  }
];

function npc(profile: Npc['activityProfile'], id: string): Npc {
  return {
    id: id as NpcId,
    firstName: 'Тест',
    lastName: 'Житель',
    age: 20,
    homeDistrictId: district,
    activityProfile: profile,
    activationDay: 1,
    preferredLocationTypes: [],
    personality: { sociability: 50, temperament: 50, reliability: 80, ambition: 50, generosity: 50, interests: [] },
    life: createInitialNpcLifeState({ npcId: id, activityProfile: profile, day: 1, reliability: 80 }),
    worldState: { kind: 'home', sinceTotalMinutes: 0 }
  };
}

const getLocationProfile = () => ({
  staff: [],
  visitors: { quiet: [0, 0] as const, normal: [0, 0] as const, peak: [0, 0] as const, peakWindows: [] }
});

describe('population daily routes', () => {
  it('sends students to education and unemployed residents to job search locations', () => {
    const state: PopulationState = {
      seed: 8,
      generatedAtDay: 1,
      lastSimulatedTotalMinutes: 8 * 60,
      npcs: [npc('student', 'student'), npc('unemployed', 'unemployed')]
    };
    const result = simulatePopulation({
      population: state,
      fromTime: fromTotalMinutes(8 * 60),
      toTime: fromTotalMinutes(11 * 60),
      locations,
      getLocationProfile
    });

    const student = result.npcs.find((entry) => String(entry.id) === 'student');
    const unemployed = result.npcs.find((entry) => String(entry.id) === 'unemployed');
    expect(student?.worldState).toMatchObject({ kind: 'at_location', locationId: universityId, purpose: 'study' });
    expect(unemployed?.worldState).toMatchObject({ kind: 'at_location', locationId: businessCenterId, purpose: 'job_search' });
  });
});
