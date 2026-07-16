import type { Location } from '../../types/location';
import type { Npc, NpcLocationPurpose, NpcWorldState } from '../../types/npc';
import type { LocationPopulationProfile, PopulationState } from '../../types/population';
import type { GameTime, Weekday } from '../../types/time';
import type { LocationId, NpcId } from '../../types/ids';
import { fromTotalMinutes, getTotalMinutes } from '../time';
import { getScheduleStatus } from '../schedule';

const STEP_MINUTES = 15;
const MINUTES_IN_DAY = 24 * 60;
const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

type DesiredTarget =
  | { kind: 'home'; purpose: 'home' }
  | { kind: 'location'; locationId: LocationId; purpose: NpcLocationPurpose };

function stringHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicUnit(seed: number, key: string): number {
  const mixed = (stringHash(key) ^ seed) >>> 0;
  return (Math.imul(mixed, 1664525) + 1013904223 >>> 0) / 4294967296;
}

function timeFromTotalMinutes(totalMinutes: number): GameTime {
  return fromTotalMinutes(totalMinutes);
}

function previousWeekday(weekday: Weekday): Weekday {
  const index = WEEKDAYS.indexOf(weekday);
  return WEEKDAYS[(index + WEEKDAYS.length - 1) % WEEKDAYS.length];
}

function isWorkTargetActive(npc: Npc, time: GameTime): boolean {
  const employment = npc.employment;
  if (!employment) return false;

  const minute = time.hour * 60 + time.minute;
  const commuteLead = 45;
  const start = employment.startMinute;
  const end = employment.endMinute;

  if (end > start) {
    return employment.workdays.includes(time.weekday) && minute >= Math.max(0, start - commuteLead) && minute < end;
  }

  if (minute >= Math.max(0, start - commuteLead)) {
    return employment.workdays.includes(time.weekday);
  }

  if (minute < end) {
    return employment.workdays.includes(previousWeekday(time.weekday));
  }

  return false;
}

function isPeakMinute(profile: LocationPopulationProfile, minute: number): boolean {
  return profile.visitors.peakWindows.some((window) => {
    if (window.endMinute > window.startMinute) return minute >= window.startMinute && minute < window.endMinute;
    return minute >= window.startMinute || minute < window.endMinute;
  });
}

function getVisitorDemand(location: Location, time: GameTime, seed: number, getProfile: (location: Location) => LocationPopulationProfile): { minimum: number; target: number } {
  if (!getScheduleStatus(location.openingHours, time).isOpen) return { minimum: 0, target: 0 };
  const locationProfile = getProfile(location);
  const profile = locationProfile.visitors;
  const minute = time.hour * 60 + time.minute;
  const range = isPeakMinute(locationProfile, minute)
    ? profile.peak
    : minute < 8 * 60 || minute >= 22 * 60
      ? profile.quiet
      : profile.normal;
  const block = Math.floor(minute / 120);
  const random = deterministicUnit(seed, `${location.id}:${time.day}:${block}`);
  return {
    minimum: range[0],
    target: Math.round(range[0] + (range[1] - range[0]) * random)
  };
}

function rankCandidate(npc: Npc, location: Location, seed: number, time: GameTime): number {
  const preferenceBonus = npc.preferredLocationTypes.includes(location.type) ? 2 : 0;
  const districtBonus = npc.homeDistrictId === location.districtId ? 0.7 : 0;
  const random = deterministicUnit(seed, `${npc.id}:${location.id}:${time.day}:${Math.floor((time.hour * 60 + time.minute) / 120)}`);
  return preferenceBonus + districtBonus + random;
}

function choosePlannedLocation(input: {
  npc: Npc;
  time: GameTime;
  locations: Location[];
  cityByDistrict: Map<import('../../types/ids').DistrictId, import('../../types/ids').CityId>;
  seed: number;
  types: Location['type'][];
}): Location | undefined {
  const cityId = input.cityByDistrict.get(input.npc.homeDistrictId);
  const candidates = input.locations
    .filter((location) => location.cityId === cityId
      && input.types.includes(location.type)
      && getScheduleStatus(location.openingHours, input.time).isOpen)
    .sort((first, second) => rankCandidate(input.npc, second, input.seed, input.time) - rankCandidate(input.npc, first, input.seed, input.time));
  return candidates[0];
}

function getProfileTarget(input: {
  npc: Npc;
  time: GameTime;
  locations: Location[];
  cityByDistrict: Map<import('../../types/ids').DistrictId, import('../../types/ids').CityId>;
  seed: number;
}): DesiredTarget | undefined {
  const { npc, time } = input;
  const minute = time.hour * 60 + time.minute;
  const weekday = WEEKDAYS.slice(0, 5).includes(time.weekday);
  if ((npc.life.sickUntilDay ?? 0) >= time.day) return { kind: 'home', purpose: 'home' };
  if (minute < 7 * 60 + 30 || minute >= 22 * 60) return { kind: 'home', purpose: 'home' };

  if (npc.activityProfile === 'student') {
    const missedToday = npc.life.lastOutcome?.day === time.day && npc.life.lastOutcome.kind === 'missed_study';
    if (weekday && !missedToday && minute >= 8 * 60 + 15 && minute < 15 * 60 + 30) {
      const location = choosePlannedLocation({ ...input, types: ['university', 'education_center'] });
      if (location) return { kind: 'location', locationId: location.id, purpose: 'study' };
    }
    if (minute >= 16 * 60 && minute < 18 * 60) {
      const location = choosePlannedLocation({ ...input, types: ['shop', 'cafe', 'food_court'] });
      if (location) return { kind: 'location', locationId: location.id, purpose: 'shopping' };
    }
    if (minute >= 18 * 60 && minute < 21 * 60 + 30) {
      const location = choosePlannedLocation({ ...input, types: ['park', 'cafe', 'sport_ground', 'fitness'] });
      if (location) return { kind: 'location', locationId: location.id, purpose: 'leisure' };
    }
  }

  if (npc.activityProfile === 'unemployed') {
    if (weekday && minute >= 9 * 60 + 30 && minute < 13 * 60 + 30) {
      const location = choosePlannedLocation({ ...input, types: ['business_center', 'coworking', 'service', 'education_center'] });
      if (location) return { kind: 'location', locationId: location.id, purpose: 'job_search' };
    }
    if (minute >= 14 * 60 && minute < 16 * 60) {
      const location = choosePlannedLocation({ ...input, types: ['shop', 'mall', 'bank'] });
      if (location) return { kind: 'location', locationId: location.id, purpose: 'shopping' };
    }
    if (minute >= 17 * 60 && minute < 20 * 60 + 30) {
      const location = choosePlannedLocation({ ...input, types: ['park', 'cafe', 'sport_ground'] });
      if (location) return { kind: 'location', locationId: location.id, purpose: 'leisure' };
    }
  }

  if (npc.activityProfile === 'worker' && minute >= 18 * 60 && minute < 21 * 60) {
    const location = choosePlannedLocation({ ...input, types: ['shop', 'cafe', 'park', 'fitness'] });
    if (location) return { kind: 'location', locationId: location.id, purpose: minute < 19 * 60 + 30 ? 'shopping' : 'leisure' };
  }

  return undefined;
}

function resolveDesiredTargets(population: PopulationState, locations: Location[], time: GameTime, getProfile: (location: Location) => LocationPopulationProfile): Map<NpcId, DesiredTarget> {
  const targets = new Map<NpcId, DesiredTarget>();
  const available: Npc[] = [];
  const publicLocations = locations.filter((location) => location.type !== 'home');
  const cityByDistrict = new Map(locations.map((location) => [location.districtId, location.cityId]));

  population.npcs.forEach((npc) => {
    if (npc.activationDay > time.day) {
      targets.set(npc.id, { kind: 'home', purpose: 'home' });
      return;
    }

    const missedWorkToday = npc.life.lastOutcome?.day === time.day
      && (npc.life.lastOutcome.kind === 'missed_work' || npc.life.lastOutcome.kind === 'lost_job');
    if (!missedWorkToday && isWorkTargetActive(npc, time) && npc.employment) {
      targets.set(npc.id, { kind: 'location', locationId: npc.employment.locationId, purpose: 'work' });
      return;
    }

    const plannedTarget = getProfileTarget({ npc, time, locations: publicLocations, cityByDistrict, seed: population.seed });
    if (plannedTarget) {
      targets.set(npc.id, plannedTarget);
      return;
    }

    available.push(npc);
  });

  const minuteBlock = Math.floor((time.hour * 60 + time.minute) / 120);
  const orderedLocations = [...publicLocations].sort((first, second) => {
    const firstScore = deterministicUnit(population.seed, `${first.id}:${time.day}:${minuteBlock}:order`);
    const secondScore = deterministicUnit(population.seed, `${second.id}:${time.day}:${minuteBlock}:order`);
    return secondScore - firstScore;
  });
  const remaining = new Set(available.map((npc) => npc.id));

  const demandRows = orderedLocations.map((location) => ({
    location,
    demand: getVisitorDemand(location, time, population.seed, getProfile)
  }));

  function assignVisitors(location: Location, requestedCount: number): void {
    if (requestedCount <= 0 || remaining.size === 0) return;
    const candidates = available
      .filter((npc) => remaining.has(npc.id)
        && npc.employment?.locationId !== location.id
        && cityByDistrict.get(npc.homeDistrictId) === location.cityId)
      .sort((first, second) => rankCandidate(second, location, population.seed, time) - rankCandidate(first, location, population.seed, time));

    candidates.slice(0, requestedCount).forEach((npc) => {
      targets.set(npc.id, { kind: 'location', locationId: location.id, purpose: 'visit' });
      remaining.delete(npc.id);
    });
  }

  demandRows.forEach(({ location, demand }) => assignVisitors(location, demand.minimum));
  demandRows.forEach(({ location, demand }) => assignVisitors(location, Math.max(0, demand.target - demand.minimum)));

  available.forEach((npc) => {
    if (!targets.has(npc.id)) targets.set(npc.id, { kind: 'home', purpose: 'home' });
  });

  return targets;
}

function stateDistrictId(npc: Npc, state: NpcWorldState, locationById: Map<LocationId, Location>) {
  if (state.kind === 'home') return npc.homeDistrictId;
  if (state.kind === 'at_location') return locationById.get(state.locationId)?.districtId ?? npc.homeDistrictId;
  if (state.destinationKind === 'location' && state.destinationLocationId) {
    return locationById.get(state.destinationLocationId)?.districtId ?? npc.homeDistrictId;
  }
  return npc.homeDistrictId;
}

function targetDistrictId(npc: Npc, target: DesiredTarget, locationById: Map<LocationId, Location>) {
  if (target.kind === 'home') return npc.homeDistrictId;
  return locationById.get(target.locationId)?.districtId ?? npc.homeDistrictId;
}

function getTravelDuration(npc: Npc, state: NpcWorldState, target: DesiredTarget, locationById: Map<LocationId, Location>, seed: number): number {
  const sameDistrict = stateDistrictId(npc, state, locationById) === targetDistrictId(npc, target, locationById);
  const variance = Math.floor(deterministicUnit(seed, `${npc.id}:${state.sinceTotalMinutes}:${target.kind}`) * 11);
  return (sameDistrict ? 15 : 35) + variance;
}

function stateMatchesTarget(state: NpcWorldState, target: DesiredTarget): boolean {
  if (target.kind === 'home') return state.kind === 'home';
  return state.kind === 'at_location' && state.locationId === target.locationId && state.purpose === target.purpose;
}

function travellingMatchesTarget(state: NpcWorldState, target: DesiredTarget): boolean {
  if (state.kind !== 'travelling') return false;
  if (target.kind === 'home') return state.destinationKind === 'home';
  return state.destinationKind === 'location' && state.destinationLocationId === target.locationId && state.purpose === target.purpose;
}

function completeTravel(state: NpcWorldState, totalMinutes: number): NpcWorldState {
  if (state.kind !== 'travelling' || state.arrivalTotalMinutes > totalMinutes) return state;
  if (state.destinationKind === 'home') return { kind: 'home', sinceTotalMinutes: state.arrivalTotalMinutes };
  if (!state.destinationLocationId) return { kind: 'home', sinceTotalMinutes: state.arrivalTotalMinutes };
  return {
    kind: 'at_location',
    locationId: state.destinationLocationId,
    purpose: state.purpose === 'home' ? 'visit' : state.purpose,
    sinceTotalMinutes: state.arrivalTotalMinutes
  };
}

function transitionNpc(npc: Npc, target: DesiredTarget, totalMinutes: number, locationById: Map<LocationId, Location>, seed: number): Npc {
  const arrivedState = completeTravel(npc.worldState, totalMinutes);
  if (stateMatchesTarget(arrivedState, target) || travellingMatchesTarget(arrivedState, target)) {
    return arrivedState === npc.worldState ? npc : { ...npc, worldState: arrivedState };
  }

  const duration = getTravelDuration(npc, arrivedState, target, locationById, seed);
  const nextState: NpcWorldState = target.kind === 'home'
    ? {
        kind: 'travelling',
        destinationKind: 'home',
        purpose: 'home',
        arrivalTotalMinutes: totalMinutes + duration,
        sinceTotalMinutes: totalMinutes
      }
    : {
        kind: 'travelling',
        destinationKind: 'location',
        destinationLocationId: target.locationId,
        purpose: target.purpose,
        arrivalTotalMinutes: totalMinutes + duration,
        sinceTotalMinutes: totalMinutes
      };

  return { ...npc, worldState: nextState };
}

function simulateStep(population: PopulationState, locations: Location[], totalMinutes: number, getProfile: (location: Location) => LocationPopulationProfile): PopulationState {
  const time = timeFromTotalMinutes(totalMinutes);
  const targets = resolveDesiredTargets(population, locations, time, getProfile);
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const npcs = population.npcs.map((npc) => transitionNpc(
    npc,
    targets.get(npc.id) ?? { kind: 'home', purpose: 'home' },
    totalMinutes,
    locationById,
    population.seed
  ));

  return { ...population, npcs, lastSimulatedTotalMinutes: totalMinutes };
}

export function simulatePopulation(input: {
  population: PopulationState;
  fromTime: GameTime;
  toTime: GameTime;
  locations: Location[];
  getLocationProfile: (location: Location) => LocationPopulationProfile;
}): PopulationState {
  const { locations, toTime, getLocationProfile } = input;
  const end = getTotalMinutes(toTime);
  let nextPopulation = input.population;
  let cursor = Math.max(input.population.lastSimulatedTotalMinutes, getTotalMinutes(input.fromTime));

  if (end < cursor) {
    return simulateStep({ ...nextPopulation, lastSimulatedTotalMinutes: end }, locations, end, getLocationProfile);
  }

  if (end === cursor) return simulateStep(nextPopulation, locations, end, getLocationProfile);

  while (cursor < end) {
    cursor = Math.min(end, cursor + STEP_MINUTES);
    nextPopulation = simulateStep(nextPopulation, locations, cursor, getLocationProfile);
  }

  return nextPopulation;
}
