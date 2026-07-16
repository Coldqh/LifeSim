import type { JobCategory } from '../types/job';
import type { NpcRoleId } from '../types/ids';
import { NPC_ROLE_IDS } from './population/npcRoles';

export const opportunityLifecycleRules = {
  minOpenDays: 3,
  maxOpenDays: 7,
  minClosedDays: 2,
  maxClosedDays: 5,
  npcFillChancePercent: 70,
  maxHistoryEntries: 100
} as const;

export const jobCategoryNpcRoles: Record<JobCategory, NpcRoleId> = {
  service: NPC_ROLE_IDS.operator,
  office: NPC_ROLE_IDS.officeWorker,
  assistant: NPC_ROLE_IDS.administrator,
  retail: NPC_ROLE_IDS.seller,
  warehouse: NPC_ROLE_IDS.warehouseWorker,
  fitness: NPC_ROLE_IDS.trainer
};
