import type { ActionId } from '../types/ids';
import type { HouseholdActionKind, HouseholdBillKind } from '../types/household';
import { LIFE_ACTION_IDS } from './lifeActions';

export const HOUSEHOLD_BILL_LABELS: Record<HouseholdBillKind, string> = {
  electricity: 'Электричество',
  water: 'Вода',
  internet: 'Интернет'
};

export const HOUSEHOLD_BILL_SHARES: Record<HouseholdBillKind, number> = {
  electricity: 0.45,
  water: 0.3,
  internet: 0.25
};

export const HOUSEHOLD_BILL_PERIOD_DAYS = 7;
export const HOUSEHOLD_DELIVERY_COST = 650;
export const HOUSEHOLD_REPAIR_COST = 1800;

const HOUSEHOLD_ACTION_KIND_BY_ID = new Map<ActionId, HouseholdActionKind>([
  [LIFE_ACTION_IDS.cookSimpleMeal, 'cook'],
  [LIFE_ACTION_IDS.cleanHome, 'clean'],
  [LIFE_ACTION_IDS.orderMealDelivery, 'delivery'],
  [LIFE_ACTION_IDS.repairHome, 'repair']
]);

export function getHouseholdActionKind(actionId: ActionId): HouseholdActionKind | undefined {
  return HOUSEHOLD_ACTION_KIND_BY_ID.get(actionId);
}
