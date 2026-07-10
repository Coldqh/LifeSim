import type { DistrictId, LocationId } from './ids';
import type { Player } from './player';

export type HousingId = string & { readonly __brand: 'HousingId' };

export type HousingKind = 'bed_space' | 'room' | 'studio' | 'one_room';
export type HousingCondition = 'poor' | 'standard' | 'good' | 'excellent';

export type Housing = {
  id: HousingId;
  name: string;
  locationId: LocationId;
  districtId: DistrictId;
  address: string;
  kind: HousingKind;
  areaSqm: number;
  condition: HousingCondition;
  rentPerWeek: number;
  rentPeriodDays: number;
  deposit: number;
  movingCost: number;
  dailyUtilities: number;
  comfort: number;
  sleepRecoveryBonus: number;
  moodRecoveryBonus: number;
  boxingFatigueRecoveryBonus: number;
  description: string;
  imageSrc?: string;
};

export type RentalContract = {
  housingId: HousingId;
  startedDay: number;
  nextPaymentDay: number;
  depositPaid: number;
};

export type HousingMarketState = {
  seed: number;
  lastRefreshDay: number;
  activeHousingIds: HousingId[];
  viewedHousingIds: HousingId[];
  scheduledViewingHousingId?: HousingId;
};

export type HousingAffordability = {
  moveInCost: number;
  depositRefund: number;
  netCost: number;
  canAfford: boolean;
  failure?: string;
};

export type HousingOperationResult = {
  ok: boolean;
  actionName: string;
  timeDeltaMinutes: number;
  moneyDelta: number;
  messages: string[];
};

export type HousingMoveResult = {
  player: Player;
  market: HousingMarketState;
  result: HousingOperationResult;
};

export type HousingChargeEventType = 'daily_upkeep' | 'rent_paid' | 'housing_debt';

export type HousingChargeEvent = {
  type: HousingChargeEventType;
  title: string;
  text: string;
  moneyDelta: number;
  debtDelta?: number;
};

export type HousingDayChangeResult = {
  playerMoney: number;
  rentDebt: number;
  daysUntilRent: number;
  events: HousingChargeEvent[];
};
