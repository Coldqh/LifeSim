import type { Location } from '../../types/location';
import type { KnownNpcIdentity, Npc, NpcActivityProfile, NpcEmployment, NpcWorldState } from '../../types/npc';
import type { PopulationDataSource, PopulationState } from '../../types/population';
import type { DistrictId, NpcId } from '../../types/ids';
import type { GameTime, Weekday } from '../../types/time';
import { getTotalMinutes } from '../time';
import { createNpcPersonality } from '../relationships';

const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MINUTES_IN_DAY = 24 * 60;

function npcId(value: string): NpcId {
  return value as NpcId;
}

function createRandom(seed: number): () => number {
  let state = Math.max(1, Math.floor(seed) % 2147483647);
  return () => {
    state = (state * 48271) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] ?? items[0];
}

function getScheduleDays(location: Location): Weekday[] {
  const schedule = location.openingHours;
  if (!schedule || schedule.kind === 'always') return WEEKDAYS;
  return WEEKDAYS.filter((weekday) => (schedule.days[weekday]?.length ?? 0) > 0);
}

function getPrimaryScheduleWindow(location: Location): { startMinute: number; endMinute: number } {
  const schedule = location.openingHours;
  if (!schedule || schedule.kind === 'always') return { startMinute: 6 * 60, endMinute: 22 * 60 };

  for (const weekday of WEEKDAYS) {
    const window = schedule.days[weekday]?.[0];
    if (window) return window;
  }

  return { startMinute: 9 * 60, endMinute: 18 * 60 };
}

function chooseWorkdays(location: Location): Weekday[] {
  return getScheduleDays(location);
}

function createEmployment(location: Location, roleId: NpcEmployment['roleId'], staffIndex: number): NpcEmployment {
  const window = getPrimaryScheduleWindow(location);
  const rawStart = window.startMinute;
  const rawEnd = window.endMinute;
  let startMinute = rawStart;
  let endMinute = rawEnd;

  if (!location.openingHours || location.openingHours.kind === 'always') {
    const shifts = [
      { startMinute: 6 * 60, endMinute: 14 * 60 },
      { startMinute: 14 * 60, endMinute: 22 * 60 },
      { startMinute: 22 * 60, endMinute: 6 * 60 }
    ];
    const shift = shifts[staffIndex % shifts.length];
    startMinute = shift.startMinute;
    endMinute = shift.endMinute;
  }

  return {
    locationId: location.id,
    roleId,
    workdays: chooseWorkdays(location),
    startMinute,
    endMinute
  };
}

function getResidentProfile(index: number): NpcActivityProfile {
  const profiles: NpcActivityProfile[] = ['student', 'unemployed', 'remote_worker', 'retired'];
  return profiles[index % profiles.length];
}

function getPreferences(profile: NpcActivityProfile): Location['type'][] {
  if (profile === 'student') return ['education_center', 'cafe', 'park', 'sport_ground'];
  if (profile === 'remote_worker') return ['coworking', 'cafe', 'park', 'shop'];
  if (profile === 'retired') return ['park', 'shop', 'pharmacy', 'cafe'];
  if (profile === 'worker') return ['shop', 'cafe', 'park', 'fitness'];
  return ['shop', 'park', 'cafe', 'service'];
}

function createNpc(input: {
  index: number;
  random: () => number;
  districts: DistrictId[];
  employment?: NpcEmployment;
  activityProfile: NpcActivityProfile;
  activationDay: number;
  preferredHomeDistrictId?: DistrictId;
  preferredHomeDistrictIds?: DistrictId[];
  knownIdentity?: KnownNpcIdentity;
  firstNames: readonly string[];
  lastNames: readonly string[];
}): Npc {
  const { index, random, districts, employment, activityProfile, activationDay, preferredHomeDistrictId, preferredHomeDistrictIds, knownIdentity, firstNames, lastNames } = input;
  const firstName = knownIdentity?.firstName ?? pick(firstNames, random);
  const rawLastName = knownIdentity?.lastName ?? pick(lastNames, random);
  const isLikelyFemale = firstNames.indexOf(firstName) >= Math.floor(firstNames.length * 0.6);
  const lastName = isLikelyFemale && rawLastName.endsWith('ов')
    ? `${rawLastName}а`
    : isLikelyFemale && rawLastName.endsWith('ев')
      ? `${rawLastName}а`
      : rawLastName;
  const localDistricts = preferredHomeDistrictIds?.length ? preferredHomeDistrictIds : districts;
  const homeDistrictId = employment && preferredHomeDistrictId && random() < 0.88
    ? preferredHomeDistrictId
    : pick(localDistricts, random);
  const initialState: NpcWorldState = { kind: 'home', sinceTotalMinutes: 0 };

  const id = npcId(`npc_${String(index + 1).padStart(4, '0')}`);

  return {
    id,
    firstName,
    lastName,
    age: knownIdentity?.age ?? Math.floor(18 + random() * 48),
    homeDistrictId,
    activityProfile,
    activationDay,
    preferredLocationTypes: getPreferences(activityProfile),
    employment,
    personality: createNpcPersonality(String(id), activityProfile),
    worldState: initialState
  };
}

export function createPopulationSeed(): number {
  return Math.abs(Math.floor((Date.now() % 2147483647) + Math.random() * 1000000));
}

export function generatePopulation(input: {
  seed: number;
  locations: Location[];
  time: GameTime;
  dataSource: PopulationDataSource;
}): PopulationState {
  const { seed, locations, time, dataSource } = input;
  const random = createRandom(seed);
  const districts = [...new Set(locations.map((location) => location.districtId))];
  const npcs: Npc[] = [];
  let index = 0;

  locations.forEach((location) => {
    const profile = dataSource.getLocationProfile(location);
    let staffIndex = 0;

    profile.staff.forEach((requirement) => {
      for (let count = 0; count < requirement.count; count += 1) {
        const employment = createEmployment(location, requirement.roleId, staffIndex);
        const knownIdentity = dataSource.getKnownIdentity(location.id, requirement.roleId, count);
        const cityDistricts = [...new Set(locations.filter((candidate) => candidate.cityId === location.cityId).map((candidate) => candidate.districtId))];
        npcs.push(createNpc({
          index,
          random,
          districts,
          employment,
          activityProfile: 'worker',
          activationDay: 1,
          preferredHomeDistrictId: location.districtId,
          preferredHomeDistrictIds: cityDistricts,
          knownIdentity,
          firstNames: dataSource.firstNames,
          lastNames: dataSource.lastNames
        }));
        index += 1;
        staffIndex += 1;
      }
    });
  });

  const visitorDemand = locations.reduce((totals, location) => {
    if (location.type === 'home') return totals;
    const profile = dataSource.getLocationProfile(location).visitors;
    totals.normalMinimum += profile.normal[0];
    totals.peakMinimum += profile.peak[0];
    return totals;
  }, { normalMinimum: 0, peakMinimum: 0 });
  const mobileResidentCount = Math.max(
    48,
    visitorDemand.normalMinimum,
    Math.ceil(visitorDemand.peakMinimum * 0.65)
  );

  for (let residentIndex = 0; residentIndex < mobileResidentCount; residentIndex += 1) {
    const activityProfile = getResidentProfile(residentIndex);
    npcs.push(createNpc({
      index,
      random,
      districts,
      activityProfile,
      activationDay: 1,
      firstNames: dataSource.firstNames,
      lastNames: dataSource.lastNames
    }));
    index += 1;
  }

  const reserveCount = Math.ceil(npcs.length * 0.2);
  for (let reserveIndex = 0; reserveIndex < reserveCount; reserveIndex += 1) {
    const activityProfile = getResidentProfile(reserveIndex + mobileResidentCount);
    npcs.push(createNpc({
      index,
      random,
      districts,
      activityProfile,
      activationDay: 2 + Math.floor(random() * 3),
      firstNames: dataSource.firstNames,
      lastNames: dataSource.lastNames
    }));
    index += 1;
  }

  return {
    seed,
    generatedAtDay: time.day,
    lastSimulatedTotalMinutes: getTotalMinutes(time),
    npcs
  };
}
