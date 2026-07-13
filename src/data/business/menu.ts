import type { BusinessMenuItemDefinition } from '../../types/business';
import type { BusinessMenuItemId } from '../../types/ids';
import { BUSINESS_EQUIPMENT_IDS } from './equipment';
import { BUSINESS_SUPPLY_IDS } from './supplies';

export function businessMenuItemId(value: string): BusinessMenuItemId {
  return value as BusinessMenuItemId;
}

export const BUSINESS_MENU_ITEM_IDS = {
  americano: businessMenuItemId('menu_americano'),
  latte: businessMenuItemId('menu_latte'),
  tea: businessMenuItemId('menu_tea'),
  water: businessMenuItemId('menu_water'),
  sandwich: businessMenuItemId('menu_sandwich'),
  energyDrink: businessMenuItemId('menu_energy_drink')
} as const;

export const businessMenuItems: BusinessMenuItemDefinition[] = [
  {
    id: BUSINESS_MENU_ITEM_IDS.americano,
    name: 'Американо',
    recommendedPrice: 220,
    ingredients: [
      { supplyId: BUSINESS_SUPPLY_IDS.coffeeBeans, quantity: 1 },
      { supplyId: BUSINESS_SUPPLY_IDS.cups, quantity: 1 }
    ],
    requiredEquipmentIds: [BUSINESS_EQUIPMENT_IDS.basicCoffeeMachine],
    demandWeight: 5
  },
  {
    id: BUSINESS_MENU_ITEM_IDS.latte,
    name: 'Латте',
    recommendedPrice: 290,
    ingredients: [
      { supplyId: BUSINESS_SUPPLY_IDS.coffeeBeans, quantity: 1 },
      { supplyId: BUSINESS_SUPPLY_IDS.milk, quantity: 1 },
      { supplyId: BUSINESS_SUPPLY_IDS.cups, quantity: 1 }
    ],
    requiredEquipmentIds: [BUSINESS_EQUIPMENT_IDS.basicCoffeeMachine, BUSINESS_EQUIPMENT_IDS.fridge],
    demandWeight: 5
  },
  {
    id: BUSINESS_MENU_ITEM_IDS.tea,
    name: 'Чай',
    recommendedPrice: 170,
    ingredients: [
      { supplyId: BUSINESS_SUPPLY_IDS.tea, quantity: 1 },
      { supplyId: BUSINESS_SUPPLY_IDS.cups, quantity: 1 }
    ],
    demandWeight: 2
  },
  {
    id: BUSINESS_MENU_ITEM_IDS.water,
    name: 'Вода 0.5 л',
    recommendedPrice: 110,
    ingredients: [{ supplyId: BUSINESS_SUPPLY_IDS.waterBottles, quantity: 1 }],
    demandWeight: 2
  },
  {
    id: BUSINESS_MENU_ITEM_IDS.sandwich,
    name: 'Сэндвич с курицей',
    recommendedPrice: 330,
    ingredients: [{ supplyId: BUSINESS_SUPPLY_IDS.sandwiches, quantity: 1 }],
    requiredEquipmentIds: [BUSINESS_EQUIPMENT_IDS.fridge],
    demandWeight: 3
  },
  {
    id: BUSINESS_MENU_ITEM_IDS.energyDrink,
    name: 'Burn Original',
    recommendedPrice: 230,
    ingredients: [{ supplyId: BUSINESS_SUPPLY_IDS.energyDrinks, quantity: 1 }],
    requiredEquipmentIds: [BUSINESS_EQUIPMENT_IDS.fridge],
    demandWeight: 1
  }
];

export function getBusinessMenuItemById(id: BusinessMenuItemId): BusinessMenuItemDefinition | undefined {
  return businessMenuItems.find((item) => item.id === id);
}
