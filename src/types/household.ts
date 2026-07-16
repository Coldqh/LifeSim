import type { HousingId } from './housing';
import type { ProductId } from './ids';
import type { NeedsState } from './needs';
import type { Player } from './player';
import type { GameTime } from './time';

export type HouseholdBillKind = 'electricity' | 'water' | 'internet';
export type HouseholdBreakdownKind = 'fridge' | 'plumbing' | 'power';
export type HouseholdActionKind = 'cook' | 'clean' | 'delivery' | 'repair';

export type HouseholdSupplyDefinition = {
  foodUnits?: number;
  cleaningUnits?: number;
  shelfLifeDays?: number;
};

export type HouseholdSupplyBatch = {
  id: string;
  productId: ProductId;
  units: number;
  storedDay: number;
  expiresDay: number;
};

export type HouseholdBillState = {
  kind: HouseholdBillKind;
  accrued: number;
  debt: number;
  dueDay: number;
  overdueDays: number;
};

export type HouseholdBreakdown = {
  kind: HouseholdBreakdownKind;
  startedDay: number;
  repairCost: number;
};

export type HouseholdState = {
  version: 1;
  seed: number;
  housingId: HousingId;
  cleanliness: number;
  condition: number;
  cleaningSupplies: number;
  pantry: HouseholdSupplyBatch[];
  bills: HouseholdBillState[];
  activeBreakdown?: HouseholdBreakdown;
  lastProcessedDay: number;
};

export type HouseholdEvent = {
  title: string;
  text: string;
  severity: 'info' | 'warning' | 'critical';
};

export type HouseholdProcessResult = {
  state: HouseholdState;
  player: Player;
  needsDelta: Partial<NeedsState>;
  events: HouseholdEvent[];
};

export type HouseholdActionResult = {
  state: HouseholdState;
  player: Player;
  time: GameTime;
  ok: boolean;
  actionName: string;
  timeDeltaMinutes: number;
  moneyDelta: number;
  needsDelta?: Partial<NeedsState>;
  messages: string[];
};


export type HouseholdPanelState = {
  state: HouseholdState;
  foodUnits: number;
  cleaningSupplies: number;
  nextExpiryDay?: number;
  outstandingBills: number;
  debt: number;
  isAtHome: boolean;
  activeBreakdownLabel?: string;
  bills: Array<{
    kind: HouseholdBillKind;
    label: string;
    accrued: number;
    debt: number;
    dueDay: number;
    overdueDays: number;
  }>;
};
