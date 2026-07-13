import type {
  BusinessEquipmentDefinition,
  BusinessOperationResult,
  BusinessUpgradeDefinition,
  BusinessWorldState
} from '../../types/business';

export function buyBusinessEquipment(input: {
  world: BusinessWorldState;
  equipment: BusinessEquipmentDefinition;
}): { world: BusinessWorldState; result: BusinessOperationResult } {
  const business = input.world.ownedBusiness;
  if (!business) {
    return { world: input.world, result: { ok: false, actionName: 'Оборудование', timeDeltaMinutes: 0, messages: ['Сначала открой бизнес.'] } };
  }
  if (business.equipmentIds.includes(input.equipment.id)) {
    return { world: input.world, result: { ok: false, actionName: 'Оборудование', timeDeltaMinutes: 0, messages: ['Это оборудование уже установлено.'] } };
  }
  if (business.balance < input.equipment.price) {
    return { world: input.world, result: { ok: false, actionName: 'Оборудование', timeDeltaMinutes: 0, messages: [`На счёте бизнеса не хватает ${input.equipment.price - business.balance} ₽.`] } };
  }
  return {
    world: {
      ...input.world,
      ownedBusiness: {
        ...business,
        balance: business.balance - input.equipment.price,
        equipmentIds: [...business.equipmentIds, input.equipment.id]
      }
    },
    result: {
      ok: true,
      actionName: 'Оборудование',
      timeDeltaMinutes: 0,
      businessMoneyDelta: -input.equipment.price,
      messages: [`Установлено: ${input.equipment.name}. Списано ${input.equipment.price} ₽.`]
    }
  };
}

export function buyBusinessUpgrade(input: {
  world: BusinessWorldState;
  upgrade: BusinessUpgradeDefinition;
}): { world: BusinessWorldState; result: BusinessOperationResult } {
  const business = input.world.ownedBusiness;
  if (!business) {
    return { world: input.world, result: { ok: false, actionName: 'Улучшение', timeDeltaMinutes: 0, messages: ['Сначала открой бизнес.'] } };
  }
  if (business.upgradeIds.includes(input.upgrade.id)) {
    return { world: input.world, result: { ok: false, actionName: 'Улучшение', timeDeltaMinutes: 0, messages: ['Это улучшение уже куплено.'] } };
  }
  if (business.balance < input.upgrade.price) {
    return { world: input.world, result: { ok: false, actionName: 'Улучшение', timeDeltaMinutes: 0, messages: [`На счёте бизнеса не хватает ${input.upgrade.price - business.balance} ₽.`] } };
  }
  return {
    world: {
      ...input.world,
      ownedBusiness: {
        ...business,
        balance: business.balance - input.upgrade.price,
        reputation: Math.min(100, business.reputation + (input.upgrade.effect.reputationBonus ?? 0)),
        upgradeIds: [...business.upgradeIds, input.upgrade.id]
      }
    },
    result: {
      ok: true,
      actionName: 'Улучшение',
      timeDeltaMinutes: 0,
      businessMoneyDelta: -input.upgrade.price,
      messages: [`Куплено улучшение: ${input.upgrade.name}.`]
    }
  };
}
