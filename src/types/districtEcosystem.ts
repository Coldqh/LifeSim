import type { CityId, DistrictId, NpcId } from './ids';

export type DistrictTrend = 'rising' | 'stable' | 'declining';

export type DistrictRuntimeState = {
  districtId: DistrictId;
  cityId: CityId;
  costOfLivingIndex: number;
  housingDemandIndex: number;
  jobAccessIndex: number;
  popularityIndex: number;
  transportLoadIndex: number;
  servicesIndex: number;
  trend: DistrictTrend;
  lastProcessedDay: number;
  revision: number;
};

export type DistrictHistoryKind =
  | 'district_rising'
  | 'district_declining'
  | 'housing_tightened'
  | 'housing_eased'
  | 'jobs_improved'
  | 'jobs_declined'
  | 'transport_overloaded'
  | 'services_declined'
  | 'npc_moved';

export type DistrictHistoryEntry = {
  id: string;
  day: number;
  kind: DistrictHistoryKind;
  districtId: DistrictId;
  cityId: CityId;
  title: string;
  text: string;
  npcId?: NpcId;
};

export type DistrictEcosystemState = {
  version: 1;
  seed: number;
  lastProcessedDay: number;
  districts: Record<string, DistrictRuntimeState>;
  history: DistrictHistoryEntry[];
};

export type DistrictEcosystemModifiers = {
  rentMultiplier: number;
  travelDurationMultiplier: number;
  businessDemandMultiplier: number;
  opportunityOpenDaysDelta: number;
  opportunityClosedDaysDelta: number;
  npcFillChanceDelta: number;
  attractiveness: number;
};

export type DistrictEcosystemView = {
  state: DistrictRuntimeState;
  districtName: string;
  trendLabel: string;
  trendDescription: string;
  modifiers: DistrictEcosystemModifiers;
};

export type DistrictEcosystemPanelState = {
  current?: DistrictEcosystemView;
  districts: DistrictEcosystemView[];
  recentChanges: DistrictHistoryEntry[];
};
