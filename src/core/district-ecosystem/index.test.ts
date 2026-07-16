import { describe, expect, it } from 'vitest';
import { createInitialDistrictEcosystemState, getDistrictEcosystemModifiers, processDistrictEcosystemTime } from '.';
import type { District, Location } from '../../types/location';
import type { Housing } from '../../types/housing';
import type { Job } from '../../types/job';
import type { Npc } from '../../types/npc';
import type { CityId, DistrictId, JobId, LocationId, NpcId, ShopId } from '../../types/ids';

const cityId = 'city' as CityId;
const districtId = (value: string) => value as DistrictId;
const locationId = (value: string) => value as LocationId;
const jobId = (value: string) => value as JobId;
const npcId = (value: string) => value as NpcId;

const district = (value: string): District => ({
  id: districtId(value),
  cityId,
  name: value,
  description: '',
  locationIds: [locationId(`${value}_location`)]
});

const location = (value: string): Location => ({
  id: locationId(`${value}_location`),
  cityId,
  districtId: districtId(value),
  name: value,
  address: '',
  type: 'shop',
  description: '',
  availableActionIds: [],
  shopId: `shop_${value}` as ShopId
});

const housing = (value: string) => ({
  id: `housing_${value}`,
  districtId: districtId(value),
  locationId: locationId(`${value}_location`),
  rentPerWeek: 1000
}) as Housing;

const job = (value: string) => ({
  id: jobId(`job_${value}`),
  locationId: locationId(`${value}_location`)
}) as Job;

const npc = (value: string, home: string): Npc => ({
  id: npcId(value),
  firstName: 'Иван',
  lastName: value,
  age: 25,
  homeDistrictId: districtId(home),
  activityProfile: 'unemployed',
  activationDay: 1,
  preferredLocationTypes: [],
  personality: {
    sociability: 50,
    temperament: 50,
    reliability: 50,
    ambition: 50,
    generosity: 50,
    interests: ['career']
  },
  life: {
    energy: 70,
    health: 80,
    money: 1000,
    reliability: 50,
    studyProgress: 0,
    missedCommitments: 0,
    warningCount: 0,
    jobSearchDays: 10,
    lastProcessedDay: 1
  },
  worldState: { kind: 'home', sinceTotalMinutes: 0 }
});

describe('district ecosystem', () => {
  it('changes district metrics weekly and exposes real modifiers', () => {
    const districts = [district('weak'), district('strong')];
    const locations = districts.map((entry) => location(String(entry.id)));
    const jobs = [job('strong')];
    const initial = createInitialDistrictEcosystemState({
      seed: 5,
      day: 1,
      districts,
      locations,
      jobs,
      housing: districts.map((entry) => housing(String(entry.id))),
      npcs: [npc('one', 'weak')]
    });
    const applied = processDistrictEcosystemTime({
      state: initial,
      fromDay: 1,
      toDay: 8,
      districts,
      locations,
      jobs,
      housing: districts.map((entry) => housing(String(entry.id))),
      population: [npc('one', 'weak')],
      opportunities: {
        version: 1,
        seed: 1,
        lastProcessedDay: 8,
        jobListings: {
          job_strong: { jobId: jobId('job_strong'), cityId, status: 'open', openedDay: 1, closesDay: 10 }
        },
        history: []
      },
      organizations: { version: 1, seed: 1, lastProcessedDay: 8, organizations: {}, history: [] },
      organizationDefinitions: [],
      atlas: {
        version: 1,
        seed: 1,
        activeCityId: cityId,
        regionalCityIds: [],
        lastRebalancedDay: 8,
        lastProcessedTotalMinutes: 0,
        cityStates: {
          city: {
            cityId,
            tier: 'active',
            lastProcessedDay: 8,
            lastProcessedTotalMinutes: 0,
            aggregate: {
              residents: 20,
              employed: 10,
              activeResidents: 18,
              economyIndex: 112,
              housingPressure: 108,
              jobMarketIndex: 118,
              revision: 1
            }
          }
        }
      }
    });
    expect(applied.state.districts.strong.revision).toBe(1);
    expect(applied.state.districts.strong.jobAccessIndex).toBeGreaterThanOrEqual(initial.districts.strong.jobAccessIndex);
    expect(getDistrictEcosystemModifiers(applied.state, districts[1].id).businessDemandMultiplier).toBeGreaterThan(0.75);
  });

  it('keeps normal district modifiers bounded', () => {
    const state = createInitialDistrictEcosystemState({
      seed: 1,
      day: 1,
      districts: [district('a')],
      locations: [location('a')],
      jobs: [],
      housing: [housing('a')],
      npcs: []
    });
    const modifiers = getDistrictEcosystemModifiers(state, districtId('a'));
    expect(modifiers.rentMultiplier).toBeGreaterThanOrEqual(0.78);
    expect(modifiers.travelDurationMultiplier).toBeLessThanOrEqual(1.22);
  });
});
