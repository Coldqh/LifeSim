import { applyMoneyDelta } from '../economy';
import { getTotalMinutes } from '../time';
import type {
  BusinessDailyReport,
  BusinessEquipmentDefinition,
  BusinessMenuItemDefinition,
  BusinessOperationResult,
  BusinessPremises,
  BusinessSupplyDefinition,
  BusinessTypeDefinition,
  BusinessWorldState,
  OwnedBusiness
} from '../../types/business';
import type { BusinessId, BusinessMenuItemId } from '../../types/ids';
import type { Player } from '../../types/player';
import type { GameTime } from '../../types/time';

function businessId(value: string): BusinessId {
  return value as BusinessId;
}

export function createEmptyBusinessReport(day: number): BusinessDailyReport {
  return {
    day,
    visitors: 0,
    served: 0,
    lostCustomers: 0,
    revenue: 0,
    costOfGoods: 0,
    wages: 0,
    utilities: 0,
    rent: 0,
    netProfit: 0,
    stockouts: 0,
    itemSales: {}
  };
}

export function createInitialBusinessWorldState(
  seed: number,
  activePremisesIds: BusinessWorldState['activePremisesIds'] = []
): BusinessWorldState {
  return {
    seed: seed ^ 0x29f13a,
    activePremisesIds: [...activePremisesIds]
  };
}

export function getBusinessStartupCost(input: {
  premises: BusinessPremises;
  businessType: BusinessTypeDefinition;
  equipment: BusinessEquipmentDefinition[];
  supplies: BusinessSupplyDefinition[];
}): {
  equipmentCost: number;
  starterInventoryCost: number;
  total: number;
} {
  const equipmentById = new Map(input.equipment.map((item) => [item.id, item]));
  const suppliesById = new Map(input.supplies.map((item) => [item.id, item]));
  const equipmentCost = input.businessType.starterEquipmentIds.reduce(
    (sum, id) => sum + (equipmentById.get(id)?.price ?? 0),
    0
  );
  const starterInventoryCost = input.businessType.starterInventory.reduce(
    (sum, item) => sum + (suppliesById.get(item.supplyId)?.unitCost ?? 0) * item.quantity,
    0
  );
  const total = input.premises.deposit
    + input.premises.rentPerWeek
    + input.businessType.registrationCost
    + input.businessType.startingCashReserve
    + equipmentCost
    + starterInventoryCost;

  return { equipmentCost, starterInventoryCost, total };
}

export function getBusinessLaunchFailure(input: {
  player: Player;
  world: BusinessWorldState;
  premises: BusinessPremises;
  businessType: BusinessTypeDefinition;
  equipment: BusinessEquipmentDefinition[];
  supplies: BusinessSupplyDefinition[];
}): string | undefined {
  if (input.world.ownedBusiness) return 'У тебя уже есть действующий бизнес.';
  if (!input.premises.allowedBusinessTypeIds.includes(input.businessType.id)) {
    return 'Это помещение не подходит для выбранного формата.';
  }
  if (input.player.locationId !== input.premises.locationId) {
    return 'Нужно приехать к выбранному помещению.';
  }
  const startup = getBusinessStartupCost(input);
  if (input.player.money < startup.total) {
    return `Для запуска нужно ${startup.total} ₽. Сейчас ${input.player.money} ₽.`;
  }
  return undefined;
}

export function launchBusiness(input: {
  player: Player;
  world: BusinessWorldState;
  premises: BusinessPremises;
  businessType: BusinessTypeDefinition;
  equipment: BusinessEquipmentDefinition[];
  supplies: BusinessSupplyDefinition[];
  menuItems: BusinessMenuItemDefinition[];
  time: GameTime;
  name: string;
}): { player: Player; world: BusinessWorldState; result: BusinessOperationResult } {
  const failure = getBusinessLaunchFailure(input);
  if (failure) {
    return {
      player: input.player,
      world: input.world,
      result: { ok: false, actionName: 'Открытие бизнеса', timeDeltaMinutes: 0, messages: [failure] }
    };
  }

  const startup = getBusinessStartupCost(input);
  const cleanName = input.name.trim().slice(0, 40) || 'Городской кофе';
  const inventory = Object.fromEntries(
    input.businessType.starterInventory.map((item) => [item.supplyId, item.quantity])
  );
  const menuPrices = Object.fromEntries(
    input.businessType.menuItemIds.map((id) => {
      const item = input.menuItems.find((candidate) => candidate.id === id);
      return [id, item?.recommendedPrice ?? 100];
    })
  ) as Partial<Record<BusinessMenuItemId, number>>;

  const business: OwnedBusiness = {
    id: businessId(`business_${input.world.seed}_${input.time.day}`),
    name: cleanName,
    typeId: input.businessType.id,
    premisesId: input.premises.id,
    createdDay: input.time.day,
    balance: input.businessType.startingCashReserve,
    debt: 0,
    reputation: 45,
    schedule: input.businessType.defaultSchedule,
    equipmentIds: [...input.businessType.starterEquipmentIds],
    inventory,
    menuPrices,
    employees: [],
    upgradeIds: [],
    currentReport: createEmptyBusinessReport(input.time.day),
    reports: [],
    nextRentDay: input.time.day + 7,
    lastProcessedTotalMinutes: getTotalMinutes(input.time),
    lastCustomerNpcIds: []
  };

  const nextPlayer = {
    ...input.player,
    money: applyMoneyDelta(input.player.money, -startup.total)
  };

  return {
    player: nextPlayer,
    world: {
      ...input.world,
      ownedBusiness: business,
      activePremisesIds: input.world.activePremisesIds.filter((id) => id !== input.premises.id)
    },
    result: {
      ok: true,
      actionName: 'Открытие бизнеса',
      timeDeltaMinutes: 0,
      playerMoneyDelta: -startup.total,
      messages: [
        `Открыта кофейня «${cleanName}». Стартовые расходы: ${startup.total} ₽. На счёте бизнеса ${business.balance} ₽.`
      ]
    }
  };
}
