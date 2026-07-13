import type { BusinessSupplyDefinition } from '../../types/business';
import type { BusinessSupplyId } from '../../types/ids';

export function businessSupplyId(value: string): BusinessSupplyId {
  return value as BusinessSupplyId;
}

export const BUSINESS_SUPPLY_IDS = {
  coffeeBeans: businessSupplyId('supply_coffee_beans'),
  milk: businessSupplyId('supply_milk'),
  cups: businessSupplyId('supply_cups'),
  tea: businessSupplyId('supply_tea'),
  waterBottles: businessSupplyId('supply_water_bottles'),
  sandwiches: businessSupplyId('supply_sandwiches'),
  energyDrinks: businessSupplyId('supply_energy_drinks')
} as const;

export const businessSupplies: BusinessSupplyDefinition[] = [
  { id: BUSINESS_SUPPLY_IDS.coffeeBeans, name: 'Кофейное зерно', unitCost: 42, purchaseBatch: 20 },
  { id: BUSINESS_SUPPLY_IDS.milk, name: 'Молоко', unitCost: 34, purchaseBatch: 12 },
  { id: BUSINESS_SUPPLY_IDS.cups, name: 'Стаканы и крышки', unitCost: 14, purchaseBatch: 40 },
  { id: BUSINESS_SUPPLY_IDS.tea, name: 'Чай', unitCost: 18, purchaseBatch: 20 },
  { id: BUSINESS_SUPPLY_IDS.waterBottles, name: 'Вода 0.5 л', unitCost: 48, purchaseBatch: 18 },
  { id: BUSINESS_SUPPLY_IDS.sandwiches, name: 'Сэндвичи', unitCost: 155, purchaseBatch: 10 },
  { id: BUSINESS_SUPPLY_IDS.energyDrinks, name: 'Burn Original', unitCost: 118, purchaseBatch: 12 }
];

export function getBusinessSupplyById(id: BusinessSupplyId): BusinessSupplyDefinition | undefined {
  return businessSupplies.find((supply) => supply.id === id);
}
