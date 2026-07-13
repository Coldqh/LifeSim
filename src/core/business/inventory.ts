import type {
  BusinessInventory,
  BusinessMenuItemDefinition,
  BusinessOperationResult,
  BusinessSupplyDefinition,
  BusinessWorldState
} from '../../types/business';
import type { BusinessMenuItemId, BusinessSupplyId } from '../../types/ids';

export function getBusinessSupplyQuantity(world: BusinessWorldState, supplyId: BusinessSupplyId): number {
  return world.ownedBusiness?.inventory[supplyId] ?? 0;
}

export function buyBusinessSupply(input: {
  world: BusinessWorldState;
  supply: BusinessSupplyDefinition;
  batches?: number;
  storageMultiplier?: number;
}): { world: BusinessWorldState; result: BusinessOperationResult } {
  const business = input.world.ownedBusiness;
  if (!business) {
    return {
      world: input.world,
      result: { ok: false, actionName: 'Закупка', timeDeltaMinutes: 0, messages: ['Сначала открой бизнес.'] }
    };
  }
  const batches = Math.max(1, Math.floor(input.batches ?? 1));
  const quantity = input.supply.purchaseBatch * batches;
  const cost = input.supply.unitCost * quantity;
  const currentStock = Object.values(business.inventory).reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const storageLimit = Math.floor(240 * Math.max(1, input.storageMultiplier ?? 1));
  if (currentStock + quantity > storageLimit) {
    return {
      world: input.world,
      result: { ok: false, actionName: 'Закупка', timeDeltaMinutes: 0, messages: [`На складе нет места. Лимит: ${storageLimit} единиц.`] }
    };
  }
  if (business.balance < cost) {
    return {
      world: input.world,
      result: { ok: false, actionName: 'Закупка', timeDeltaMinutes: 0, messages: [`На счёте бизнеса не хватает ${cost - business.balance} ₽.`] }
    };
  }

  const nextBusiness = {
    ...business,
    balance: business.balance - cost,
    inventory: {
      ...business.inventory,
      [input.supply.id]: (business.inventory[input.supply.id] ?? 0) + quantity
    }
  };

  return {
    world: { ...input.world, ownedBusiness: nextBusiness },
    result: {
      ok: true,
      actionName: 'Закупка',
      timeDeltaMinutes: 0,
      businessMoneyDelta: -cost,
      messages: [`Закуплено: ${input.supply.name} ×${quantity}. Списано ${cost} ₽.`]
    }
  };
}

export function setBusinessMenuPrice(input: {
  world: BusinessWorldState;
  item: BusinessMenuItemDefinition;
  price: number;
}): { world: BusinessWorldState; result: BusinessOperationResult } {
  const business = input.world.ownedBusiness;
  if (!business) {
    return {
      world: input.world,
      result: { ok: false, actionName: 'Цена', timeDeltaMinutes: 0, messages: ['Сначала открой бизнес.'] }
    };
  }
  const minPrice = Math.max(50, Math.round(input.item.recommendedPrice * 0.55 / 10) * 10);
  const maxPrice = Math.round(input.item.recommendedPrice * 1.8 / 10) * 10;
  const price = Math.min(maxPrice, Math.max(minPrice, Math.round(input.price / 10) * 10));
  const nextBusiness = {
    ...business,
    menuPrices: { ...business.menuPrices, [input.item.id]: price }
  };
  return {
    world: { ...input.world, ownedBusiness: nextBusiness },
    result: {
      ok: true,
      actionName: 'Цена',
      timeDeltaMinutes: 0,
      messages: [`${input.item.name}: установлена цена ${price} ₽.`]
    }
  };
}

export function canProduceMenuItem(
  inventory: BusinessInventory,
  equipmentIds: readonly string[],
  item: BusinessMenuItemDefinition
): boolean {
  if (item.requiredEquipmentIds?.some((id) => !equipmentIds.includes(String(id)))) return false;
  return item.ingredients.every((ingredient) => (inventory[ingredient.supplyId] ?? 0) >= ingredient.quantity);
}

export function consumeMenuItemIngredients(
  inventory: BusinessInventory,
  item: BusinessMenuItemDefinition
): BusinessInventory {
  const next = { ...inventory };
  item.ingredients.forEach((ingredient) => {
    next[ingredient.supplyId] = Math.max(0, (next[ingredient.supplyId] ?? 0) - ingredient.quantity);
  });
  return next;
}

export function getMenuPrice(world: BusinessWorldState, itemId: BusinessMenuItemId, fallback: number): number {
  return world.ownedBusiness?.menuPrices[itemId] ?? fallback;
}
