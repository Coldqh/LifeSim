import type { BusinessUpgradeDefinition } from '../../types/business';
import type { BusinessUpgradeId } from '../../types/ids';

export function businessUpgradeId(value: string): BusinessUpgradeId {
  return value as BusinessUpgradeId;
}

export const BUSINESS_UPGRADE_IDS = {
  signboard: businessUpgradeId('upgrade_signboard'),
  storage: businessUpgradeId('upgrade_storage'),
  localPromotion: businessUpgradeId('upgrade_local_promotion')
} as const;

export const businessUpgrades: BusinessUpgradeDefinition[] = [
  { id: BUSINESS_UPGRADE_IDS.signboard, name: 'Новая вывеска', description: 'Точка заметнее для проходящего потока.', price: 9000, effect: { reputationBonus: 4, demandMultiplier: 1.08 } },
  { id: BUSINESS_UPGRADE_IDS.storage, name: 'Расширение склада', description: 'Проще держать запас расходников и еды.', price: 12000, effect: { storageMultiplier: 1.5 } },
  { id: BUSINESS_UPGRADE_IDS.localPromotion, name: 'Реклама в районе', description: 'Даёт дополнительный поток посетителей.', price: 15000, effect: { demandMultiplier: 1.15 } }
];

export function getBusinessUpgradeById(id: BusinessUpgradeId): BusinessUpgradeDefinition | undefined {
  return businessUpgrades.find((upgrade) => upgrade.id === id);
}
