import type { DistrictId, LocationId } from './ids';

export type HousingId = string & { readonly __brand: 'HousingId' };

export type Housing = {
  id: HousingId;
  name: string;
  locationId: LocationId;
  districtId: DistrictId;
  rentPerWeek: number;
  rentPeriodDays: number;
  dailyUtilities: number;
  comfort: number;
  sleepRecoveryBonus: number;
  description: string;
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
