export type NeedsState = {
  hunger: number;
  thirst: number;
  energy: number;
  health: number;
  mood: number;
};

export type NeedSeverity = 'stable' | 'warning' | 'critical' | 'emergency';

export type NeedConditionId = 'hunger' | 'dehydration' | 'exhaustion' | 'poor_health';

export type NeedCondition = {
  id: NeedConditionId;
  label: string;
  severity: Exclude<NeedSeverity, 'stable'>;
  value: number;
  summary: string;
};

export type NeedsConsequences = {
  conditions: NeedCondition[];
  energyCostMultiplier: number;
  energyRecoveryMultiplier: number;
  healthDrainPerHour: number;
};

export type NeedsRequirement = {
  minEnergy?: number;
  minHealth?: number;
  minHunger?: number;
  minThirst?: number;
};
