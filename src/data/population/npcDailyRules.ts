import type { NpcActivityProfile } from '../../types/npc';

export type NpcDailyProfileRule = {
  dailyExpense: number;
  activeEnergyCost: number;
  restRecovery: number;
  startingMoney: number;
};

export const npcDailyProfileRules: Record<NpcActivityProfile, NpcDailyProfileRule> = {
  worker: { dailyExpense: 620, activeEnergyCost: 22, restRecovery: 18, startingMoney: 24_000 },
  student: { dailyExpense: 430, activeEnergyCost: 18, restRecovery: 20, startingMoney: 9_000 },
  unemployed: { dailyExpense: 310, activeEnergyCost: 12, restRecovery: 22, startingMoney: 4_500 },
  remote_worker: { dailyExpense: 540, activeEnergyCost: 16, restRecovery: 20, startingMoney: 18_000 },
  retired: { dailyExpense: 360, activeEnergyCost: 10, restRecovery: 24, startingMoney: 16_000 }
};

export const npcDailySimulationRules = {
  workerDailyIncome: 2_350,
  missedWorkWarningThreshold: 2,
  jobLossWarningThreshold: 4,
  academicWarningThreshold: 3,
  baseSicknessChancePercent: 2,
  maxHistoryEventsPerAdvance: 8
} as const;
