import type { CityId } from './ids';

export type CitySimulationTier = 'active' | 'regional' | 'remote';

export type CityAggregateState = {
  residents: number;
  employed: number;
  activeResidents: number;
  economyIndex: number;
  housingPressure: number;
  jobMarketIndex: number;
  revision: number;
};

export type CityRuntimeState = {
  cityId: CityId;
  tier: CitySimulationTier;
  lastProcessedDay: number;
  lastProcessedTotalMinutes: number;
  lastVisitedDay?: number;
  aggregate: CityAggregateState;
};

export type WorldAtlasState = {
  version: 1;
  seed: number;
  activeCityId: CityId;
  regionalCityIds: CityId[];
  cityStates: Record<string, CityRuntimeState>;
  lastRebalancedDay: number;
  lastProcessedTotalMinutes: number;
};
