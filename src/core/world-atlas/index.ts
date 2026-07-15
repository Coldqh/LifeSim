import type { CityId, DistrictId, LocationId, NpcId } from '../../types/ids';
import type { City, District, Location } from '../../types/location';
import type { PopulationDataSource, PopulationState } from '../../types/population';
import type { GameTime } from '../../types/time';
import type {
  CityAggregateState,
  CityRuntimeState,
  CitySimulationTier,
  WorldAtlasState
} from '../../types/worldAtlas';
import type { IntercityRoadConnection, IntercityRoute } from '../../types/intercity';
import { getTotalMinutes } from '../time';
import { simulatePopulation } from '../population';

const MIN_INDEX = 55;
const MAX_INDEX = 145;
const REMOTE_STEP_DAYS = 7;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function clampCount(value: number): number {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

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

function deterministicDelta(seed: number, key: string, magnitude: number): number {
  return Math.round((deterministicUnit(seed, key) * 2 - 1) * magnitude);
}

function cityStateKey(cityId: CityId): string {
  return String(cityId);
}

function createCityMaps(input: {
  districts: readonly District[];
  locations: readonly Location[];
}) {
  return {
    cityByDistrictId: new Map(input.districts.map((district) => [district.id, district.cityId])),
    cityByLocationId: new Map(input.locations.map((location) => [location.id, location.cityId]))
  };
}

function getNpcHomeCityId(
  homeDistrictId: DistrictId,
  cityByDistrictId: ReadonlyMap<DistrictId, CityId>
): CityId | undefined {
  return cityByDistrictId.get(homeDistrictId);
}

function createAggregate(input: {
  city: City;
  locations: readonly Location[];
  population: PopulationState;
  day: number;
  seed: number;
  cityByDistrictId: ReadonlyMap<DistrictId, CityId>;
  cityByLocationId: ReadonlyMap<LocationId, CityId>;
}): CityAggregateState {
  const residents = input.population.npcs.filter((npc) => (
    getNpcHomeCityId(npc.homeDistrictId, input.cityByDistrictId) === input.city.id
  ));
  const employed = residents.filter((npc) => (
    npc.employment
    && input.cityByLocationId.get(npc.employment.locationId) === input.city.id
  )).length;
  const activeResidents = residents.filter((npc) => npc.activationDay <= input.day).length;
  const estimatedResidents = Math.max(
    24,
    input.city.districtIds.length * 18 + input.locations.filter((location) => location.cityId === input.city.id).length * 3
  );
  const baseKey = String(input.city.id);

  return {
    residents: residents.length > 0 ? residents.length : estimatedResidents,
    employed,
    activeResidents: residents.length > 0 ? activeResidents : Math.round(estimatedResidents * 0.82),
    economyIndex: 82 + Math.floor(deterministicUnit(input.seed, `${baseKey}:economy`) * 37),
    housingPressure: 76 + Math.floor(deterministicUnit(input.seed, `${baseKey}:housing`) * 43),
    jobMarketIndex: 78 + Math.floor(deterministicUnit(input.seed, `${baseKey}:jobs`) * 41),
    revision: 0
  };
}

function sanitizeAggregate(value: unknown, fallback: CityAggregateState): CityAggregateState {
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<CityAggregateState>;
  return {
    residents: clampCount(candidate.residents ?? fallback.residents),
    employed: clampCount(candidate.employed ?? fallback.employed),
    activeResidents: clampCount(candidate.activeResidents ?? fallback.activeResidents),
    economyIndex: clamp(Number(candidate.economyIndex ?? fallback.economyIndex), MIN_INDEX, MAX_INDEX),
    housingPressure: clamp(Number(candidate.housingPressure ?? fallback.housingPressure), MIN_INDEX, MAX_INDEX),
    jobMarketIndex: clamp(Number(candidate.jobMarketIndex ?? fallback.jobMarketIndex), MIN_INDEX, MAX_INDEX),
    revision: clampCount(candidate.revision ?? fallback.revision)
  };
}

function getTier(cityId: CityId, activeCityId: CityId, regionalCityIds: readonly CityId[]): CitySimulationTier {
  if (cityId === activeCityId) return 'active';
  return regionalCityIds.includes(cityId) ? 'regional' : 'remote';
}

function advanceAggregate(input: {
  aggregate: CityAggregateState;
  seed: number;
  cityId: CityId;
  fromDay: number;
  steps: number;
  stepDays: number;
}): CityAggregateState {
  let aggregate = input.aggregate;
  for (let index = 0; index < input.steps; index += 1) {
    const day = input.fromDay + (index + 1) * input.stepDays;
    const key = `${String(input.cityId)}:${day}`;
    const residentsDelta = input.stepDays >= REMOTE_STEP_DAYS
      ? deterministicDelta(input.seed, `${key}:population`, Math.max(1, Math.round(aggregate.residents * 0.012)))
      : 0;
    const residents = Math.max(8, aggregate.residents + residentsDelta);
    const employmentRate = aggregate.residents > 0 ? aggregate.employed / aggregate.residents : 0.55;
    const activeRate = aggregate.residents > 0 ? aggregate.activeResidents / aggregate.residents : 0.82;
    aggregate = {
      residents,
      employed: clampCount(residents * clamp(employmentRate + deterministicDelta(input.seed, `${key}:employment`, 1) / 100, 0.25, 0.82)),
      activeResidents: clampCount(residents * clamp(activeRate, 0.55, 0.96)),
      economyIndex: clamp(aggregate.economyIndex + deterministicDelta(input.seed, `${key}:economy`, 2), MIN_INDEX, MAX_INDEX),
      housingPressure: clamp(aggregate.housingPressure + deterministicDelta(input.seed, `${key}:housing`, 2), MIN_INDEX, MAX_INDEX),
      jobMarketIndex: clamp(aggregate.jobMarketIndex + deterministicDelta(input.seed, `${key}:jobs`, 2), MIN_INDEX, MAX_INDEX),
      revision: aggregate.revision + 1
    };
  }
  return aggregate;
}

export function getRegionalCityIds(input: {
  activeCityId: CityId;
  routes: readonly IntercityRoute[];
  roadConnections: readonly IntercityRoadConnection[];
}): CityId[] {
  const connected = new Set<CityId>();
  for (const route of input.routes) {
    if (route.originCityId === input.activeCityId) connected.add(route.destinationCityId);
    if (route.destinationCityId === input.activeCityId) connected.add(route.originCityId);
  }
  for (const connection of input.roadConnections) {
    if (connection.originCityId === input.activeCityId) connected.add(connection.destinationCityId);
    if (connection.destinationCityId === input.activeCityId) connected.add(connection.originCityId);
  }
  connected.delete(input.activeCityId);
  return [...connected].sort((first, second) => String(first).localeCompare(String(second)));
}

export function createInitialWorldAtlasState(input: {
  cities: readonly City[];
  districts: readonly District[];
  locations: readonly Location[];
  population: PopulationState;
  activeCityId: CityId;
  regionalCityIds?: readonly CityId[];
  time: GameTime;
  seed?: number;
}): WorldAtlasState {
  const seed = Math.max(1, Math.floor(input.seed ?? input.population.seed));
  const regionalCityIds = [...new Set(input.regionalCityIds ?? [])]
    .filter((cityId) => cityId !== input.activeCityId && input.cities.some((city) => city.id === cityId));
  const maps = createCityMaps(input);
  const currentTotalMinutes = getTotalMinutes(input.time);
  const cityStates = Object.fromEntries(input.cities.map((city) => {
    const tier = getTier(city.id, input.activeCityId, regionalCityIds);
    const state: CityRuntimeState = {
      cityId: city.id,
      tier,
      lastProcessedDay: input.time.day,
      lastProcessedTotalMinutes: currentTotalMinutes,
      lastVisitedDay: tier === 'active' ? input.time.day : undefined,
      aggregate: createAggregate({
        city,
        locations: input.locations,
        population: input.population,
        day: input.time.day,
        seed,
        ...maps
      })
    };
    return [cityStateKey(city.id), state];
  }));

  return {
    version: 1,
    seed,
    activeCityId: input.activeCityId,
    regionalCityIds,
    cityStates,
    lastRebalancedDay: input.time.day,
    lastProcessedTotalMinutes: currentTotalMinutes
  };
}

export function normalizeWorldAtlasState(value: unknown, input: {
  cities: readonly City[];
  districts: readonly District[];
  locations: readonly Location[];
  population: PopulationState;
  activeCityId: CityId;
  regionalCityIds?: readonly CityId[];
  time: GameTime;
}): WorldAtlasState {
  const candidate = value && typeof value === 'object' ? value as Partial<WorldAtlasState> : undefined;
  const base = createInitialWorldAtlasState({
    ...input,
    seed: typeof candidate?.seed === 'number' ? candidate.seed : input.population.seed
  });
  const candidateStates = candidate?.cityStates && typeof candidate.cityStates === 'object'
    ? candidate.cityStates
    : {};

  const cityStates = Object.fromEntries(input.cities.map((city) => {
    const fallback = base.cityStates[cityStateKey(city.id)];
    const raw = candidateStates[cityStateKey(city.id)] as Partial<CityRuntimeState> | undefined;
    const tier = getTier(city.id, input.activeCityId, base.regionalCityIds);
    const state: CityRuntimeState = {
      cityId: city.id,
      tier,
      lastProcessedDay: Math.min(input.time.day, Math.max(1, Math.floor(raw?.lastProcessedDay ?? fallback.lastProcessedDay))),
      lastProcessedTotalMinutes: Math.min(
        getTotalMinutes(input.time),
        Math.max(0, Math.floor(raw?.lastProcessedTotalMinutes ?? fallback.lastProcessedTotalMinutes))
      ),
      lastVisitedDay: tier === 'active'
        ? input.time.day
        : typeof raw?.lastVisitedDay === 'number' ? Math.max(1, Math.floor(raw.lastVisitedDay)) : undefined,
      aggregate: sanitizeAggregate(raw?.aggregate, fallback.aggregate)
    };
    return [cityStateKey(city.id), state];
  }));

  return {
    version: 1,
    seed: base.seed,
    activeCityId: input.activeCityId,
    regionalCityIds: base.regionalCityIds,
    cityStates,
    lastRebalancedDay: Math.min(input.time.day, Math.max(1, Math.floor(candidate?.lastRebalancedDay ?? input.time.day))),
    lastProcessedTotalMinutes: Math.min(
      getTotalMinutes(input.time),
      Math.max(0, Math.floor(candidate?.lastProcessedTotalMinutes ?? getTotalMinutes(input.time)))
    )
  };
}

export function processWorldAtlasTime(input: {
  atlas: WorldAtlasState;
  cities: readonly City[];
  districts: readonly District[];
  locations: readonly Location[];
  population: PopulationState;
  activeCityId: CityId;
  regionalCityIds: readonly CityId[];
  toTime: GameTime;
}): { atlas: WorldAtlasState; processedCityIds: CityId[] } {
  const normalized = normalizeWorldAtlasState(input.atlas, {
    cities: input.cities,
    districts: input.districts,
    locations: input.locations,
    population: input.population,
    activeCityId: input.activeCityId,
    regionalCityIds: input.regionalCityIds,
    time: input.toTime
  });
  const maps = createCityMaps(input);
  const currentTotalMinutes = getTotalMinutes(input.toTime);
  const processedCityIds: CityId[] = [];
  const cityStates = Object.fromEntries(input.cities.map((city) => {
    const previous = normalized.cityStates[cityStateKey(city.id)];
    const tier = getTier(city.id, input.activeCityId, normalized.regionalCityIds);
    let nextState: CityRuntimeState = { ...previous, tier };

    if (tier === 'active') {
      const synced = createAggregate({
        city,
        locations: input.locations,
        population: input.population,
        day: input.toTime.day,
        seed: normalized.seed,
        ...maps
      });
      nextState = {
        ...nextState,
        lastProcessedDay: input.toTime.day,
        lastProcessedTotalMinutes: currentTotalMinutes,
        lastVisitedDay: input.toTime.day,
        aggregate: {
          ...previous.aggregate,
          residents: synced.residents,
          employed: synced.employed,
          activeResidents: synced.activeResidents,
          revision: previous.aggregate.revision + 1
        }
      };
      processedCityIds.push(city.id);
    } else {
      const stepDays = tier === 'regional' ? 1 : REMOTE_STEP_DAYS;
      const elapsedDays = Math.max(0, input.toTime.day - previous.lastProcessedDay);
      const steps = Math.floor(elapsedDays / stepDays);
      if (steps > 0) {
        const processedDay = previous.lastProcessedDay + steps * stepDays;
        nextState = {
          ...nextState,
          lastProcessedDay: processedDay,
          lastProcessedTotalMinutes: (processedDay - 1) * 24 * 60,
          aggregate: advanceAggregate({
            aggregate: previous.aggregate,
            seed: normalized.seed,
            cityId: city.id,
            fromDay: previous.lastProcessedDay,
            steps,
            stepDays
          })
        };
        processedCityIds.push(city.id);
      }
    }

    return [cityStateKey(city.id), nextState];
  }));

  return {
    atlas: {
      ...normalized,
      activeCityId: input.activeCityId,
      regionalCityIds: [...normalized.regionalCityIds],
      cityStates,
      lastRebalancedDay: input.toTime.day,
      lastProcessedTotalMinutes: currentTotalMinutes
    },
    processedCityIds
  };
}

export function simulateActiveCityPopulation(input: {
  population: PopulationState;
  fromTime: GameTime;
  toTime: GameTime;
  activeCityId: CityId;
  cityLocations: Location[];
  getLocationProfile: PopulationDataSource['getLocationProfile'];
  getCityIdForDistrict: (districtId: DistrictId) => CityId | undefined;
  getCityIdForLocation: (locationId: LocationId) => CityId | undefined;
}): PopulationState {
  const activeNpcIds = new Set<NpcId>();
  const activeNpcs = input.population.npcs.filter((npc) => {
    const homeCityId = input.getCityIdForDistrict(npc.homeDistrictId);
    const employmentCityId = npc.employment
      ? input.getCityIdForLocation(npc.employment.locationId)
      : undefined;
    const active = homeCityId === input.activeCityId || employmentCityId === input.activeCityId;
    if (active) activeNpcIds.add(npc.id);
    return active;
  });

  if (activeNpcs.length === 0) {
    return { ...input.population, lastSimulatedTotalMinutes: getTotalMinutes(input.toTime) };
  }

  const simulated = simulatePopulation({
    population: {
      ...input.population,
      npcs: activeNpcs,
      lastSimulatedTotalMinutes: getTotalMinutes(input.fromTime)
    },
    fromTime: input.fromTime,
    toTime: input.toTime,
    locations: input.cityLocations,
    getLocationProfile: input.getLocationProfile
  });
  const simulatedById = new Map(simulated.npcs.map((npc) => [npc.id, npc]));

  return {
    ...input.population,
    lastSimulatedTotalMinutes: getTotalMinutes(input.toTime),
    npcs: input.population.npcs.map((npc) => (
      activeNpcIds.has(npc.id) ? simulatedById.get(npc.id) ?? npc : npc
    ))
  };
}
