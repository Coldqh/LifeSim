import type { BusinessEquipmentDefinition } from '../../types/business';
import type { BusinessEquipmentId } from '../../types/ids';

export function businessEquipmentId(value: string): BusinessEquipmentId {
  return value as BusinessEquipmentId;
}

export const BUSINESS_EQUIPMENT_IDS = {
  basicCoffeeMachine: businessEquipmentId('equipment_basic_coffee_machine'),
  fridge: businessEquipmentId('equipment_fridge'),
  counter: businessEquipmentId('equipment_counter'),
  cashRegister: businessEquipmentId('equipment_cash_register'),
  proCoffeeMachine: businessEquipmentId('equipment_pro_coffee_machine'),
  secondWorkstation: businessEquipmentId('equipment_second_workstation')
} as const;

export const businessEquipment: BusinessEquipmentDefinition[] = [
  { id: BUSINESS_EQUIPMENT_IDS.basicCoffeeMachine, name: 'Базовая кофемашина', description: 'Стартовое оборудование для одной рабочей позиции.', price: 12500, capacityPerHour: 8, qualityBonus: 0 },
  { id: BUSINESS_EQUIPMENT_IDS.fridge, name: 'Холодильник', description: 'Хранение молока и готовых перекусов.', price: 6500, capacityPerHour: 0, qualityBonus: 0 },
  { id: BUSINESS_EQUIPMENT_IDS.counter, name: 'Стойка', description: 'Рабочая зона и выдача заказов.', price: 4500, capacityPerHour: 1, qualityBonus: 0 },
  { id: BUSINESS_EQUIPMENT_IDS.cashRegister, name: 'Касса', description: 'Приём оплаты и учёт продаж.', price: 3500, capacityPerHour: 1, qualityBonus: 0 },
  { id: BUSINESS_EQUIPMENT_IDS.proCoffeeMachine, name: 'Профессиональная кофемашина', description: 'Быстрее готовит напитки и повышает качество.', price: 32000, capacityPerHour: 7, qualityBonus: 4 },
  { id: BUSINESS_EQUIPMENT_IDS.secondWorkstation, name: 'Второе рабочее место', description: 'Позволяет обслуживать больше гостей в час пик.', price: 18000, capacityPerHour: 5, qualityBonus: 1 }
];

export function getBusinessEquipmentById(id: BusinessEquipmentId): BusinessEquipmentDefinition | undefined {
  return businessEquipment.find((equipment) => equipment.id === id);
}
