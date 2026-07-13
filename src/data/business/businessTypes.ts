import type { BusinessTypeDefinition } from '../../types/business';
import type { BusinessTypeId } from '../../types/ids';
import { BUSINESS_EQUIPMENT_IDS } from './equipment';
import { BUSINESS_MENU_ITEM_IDS } from './menu';
import { BUSINESS_SUPPLY_IDS } from './supplies';

export function businessTypeId(value: string): BusinessTypeId {
  return value as BusinessTypeId;
}

export const BUSINESS_TYPE_IDS = {
  takeawayCoffee: businessTypeId('business_type_takeaway_coffee')
} as const;

const EVERY_DAY = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export const businessTypes: BusinessTypeDefinition[] = [
  {
    id: BUSINESS_TYPE_IDS.takeawayCoffee,
    name: 'Кофейня навынос',
    description: 'Небольшая городская точка с кофе, водой и быстрым перекусом.',
    registrationCost: 2500,
    startingCashReserve: 5000,
    defaultSchedule: {
      kind: 'weekly',
      days: Object.fromEntries(EVERY_DAY.map((day) => [day, [{ startMinute: 8 * 60, endMinute: 20 * 60 }]]))
    },
    starterEquipmentIds: [
      BUSINESS_EQUIPMENT_IDS.basicCoffeeMachine,
      BUSINESS_EQUIPMENT_IDS.fridge,
      BUSINESS_EQUIPMENT_IDS.counter,
      BUSINESS_EQUIPMENT_IDS.cashRegister
    ],
    starterInventory: [
      { supplyId: BUSINESS_SUPPLY_IDS.coffeeBeans, quantity: 35 },
      { supplyId: BUSINESS_SUPPLY_IDS.milk, quantity: 24 },
      { supplyId: BUSINESS_SUPPLY_IDS.cups, quantity: 60 },
      { supplyId: BUSINESS_SUPPLY_IDS.tea, quantity: 20 },
      { supplyId: BUSINESS_SUPPLY_IDS.waterBottles, quantity: 18 },
      { supplyId: BUSINESS_SUPPLY_IDS.sandwiches, quantity: 12 },
      { supplyId: BUSINESS_SUPPLY_IDS.energyDrinks, quantity: 10 }
    ],
    menuItemIds: [
      BUSINESS_MENU_ITEM_IDS.americano,
      BUSINESS_MENU_ITEM_IDS.latte,
      BUSINESS_MENU_ITEM_IDS.tea,
      BUSINESS_MENU_ITEM_IDS.water,
      BUSINESS_MENU_ITEM_IDS.sandwich,
      BUSINESS_MENU_ITEM_IDS.energyDrink
    ]
  }
];

export function getBusinessTypeById(id: BusinessTypeId | undefined): BusinessTypeDefinition | undefined {
  return businessTypes.find((type) => type.id === id);
}
