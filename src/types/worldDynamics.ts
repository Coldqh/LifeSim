import type { CityId } from './ids';
import type { WorldAtlasState } from './worldAtlas';

export type WorldConditionKind =
  | 'transit_disruption'
  | 'hiring_wave'
  | 'hiring_slowdown'
  | 'consumer_boom'
  | 'consumer_slump';

export type WorldNewsTone = 'positive' | 'neutral' | 'warning' | 'negative';

export type WorldCondition = {
  id: string;
  kind: WorldConditionKind;
  cityId: CityId;
  title: string;
  description: string;
  startedDay: number;
  endsDay: number;
  strength: number;
};

export type WorldNewsEntry = {
  id: string;
  cityId: CityId;
  day: number;
  title: string;
  text: string;
  tone: WorldNewsTone;
  conditionId?: string;
  phase: 'started' | 'ended';
};

export type WorldDynamicsState = {
  version: 1;
  seed: number;
  lastProcessedDay: number;
  activeConditions: WorldCondition[];
  history: WorldNewsEntry[];
};

export type WorldDynamicsModifiers = {
  publicTransportDurationMultiplier: number;
  jobResponseDelayMultiplier: number;
  jobInviteChanceDelta: number;
  businessDemandMultiplier: number;
};

export type WorldDynamicsTemplate = {
  kind: WorldConditionKind;
  title: string;
  startText: string;
  endTitle: string;
  endText: string;
  tone: WorldNewsTone;
  durationDays: number;
  strength: number;
};

export type WorldDynamicsProcessResult = {
  state: WorldDynamicsState;
  started: WorldNewsEntry[];
  ended: WorldNewsEntry[];
};

export type WorldDynamicsPanelState = {
  activeConditions: WorldCondition[];
  recentNews: WorldNewsEntry[];
  modifiers: WorldDynamicsModifiers;
};

export type WorldDynamicsProcessInput = {
  state: WorldDynamicsState;
  fromDay: number;
  toDay: number;
  activeCityId: CityId;
  atlas: WorldAtlasState;
  templates: readonly WorldDynamicsTemplate[];
};

