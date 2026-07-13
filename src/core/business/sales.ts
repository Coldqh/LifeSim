import { getScheduleStatus } from '../schedule';
import { addMinutes, getTotalMinutes } from '../time';
import type {
  BusinessDailyReport,
  BusinessEquipmentDefinition,
  BusinessMenuItemDefinition,
  BusinessPremises,
  BusinessSimulationEvent,
  BusinessSupplyDefinition,
  BusinessTypeDefinition,
  BusinessUpgradeDefinition,
  BusinessWorldState,
  OwnedBusiness
} from '../../types/business';
import type { BusinessMenuItemId, NpcId } from '../../types/ids';
import type { PopulationState } from '../../types/population';
import type { GameTime } from '../../types/time';
import { canProduceMenuItem, consumeMenuItemIngredients } from './inventory';
import { createEmptyBusinessReport } from './creation';
import { isBusinessEmployeeOnShift } from './staffing';

const STEP_MINUTES = 60;

export type BusinessSimulationResult = {
  world: BusinessWorldState;
  events: BusinessSimulationEvent[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicUnit(seed: number, key: string): number {
  return ((Math.imul(hashString(key) ^ seed, 1664525) + 1013904223) >>> 0) / 4294967296;
}

function timeFromTotalMinutes(totalMinutes: number): GameTime {
  return addMinutes({ day: 1, hour: 0, minute: 0, weekday: 'monday' }, Math.max(0, totalMinutes));
}

function getPeakMultiplier(time: GameTime): number {
  const minute = time.hour * 60 + time.minute;
  if (minute >= 7 * 60 && minute < 10 * 60) return 1.45;
  if (minute >= 12 * 60 && minute < 15 * 60) return 1.35;
  if (minute >= 17 * 60 && minute < 20 * 60) return 1.2;
  if (minute < 7 * 60 || minute >= 22 * 60) return 0.45;
  return 0.9;
}

function getAveragePriceRatio(business: OwnedBusiness, menuItems: BusinessMenuItemDefinition[]): number {
  const rows = menuItems.filter((item) => business.menuPrices[item.id] !== undefined);
  if (rows.length === 0) return 1;
  return rows.reduce((sum, item) => sum + (business.menuPrices[item.id] ?? item.recommendedPrice) / item.recommendedPrice, 0) / rows.length;
}

function getUpgradeDemandMultiplier(business: OwnedBusiness, upgrades: BusinessUpgradeDefinition[]): number {
  return business.upgradeIds.reduce((multiplier, id) => {
    const upgrade = upgrades.find((candidate) => candidate.id === id);
    return multiplier * (upgrade?.effect.demandMultiplier ?? 1);
  }, 1);
}

function getEquipmentCapacity(business: OwnedBusiness, equipment: BusinessEquipmentDefinition[]): number {
  return business.equipmentIds.reduce((sum, id) => sum + (equipment.find((candidate) => candidate.id === id)?.capacityPerHour ?? 0), 0);
}

function getStaffCapacity(business: OwnedBusiness, time: GameTime, ownerWorking: boolean): { capacity: number; wages: number } {
  let capacity = ownerWorking ? 8 : 0;
  let wages = 0;

  business.employees.forEach((employee) => {
    if (!isBusinessEmployeeOnShift(employee, time)) return;
    const shiftMinutes = employee.shiftEndMinute > employee.shiftStartMinute
      ? employee.shiftEndMinute - employee.shiftStartMinute
      : 24 * 60 - employee.shiftStartMinute + employee.shiftEndMinute;
    const hourlyWage = employee.wagePerShift / Math.max(1, shiftMinutes / 60);
    wages += hourlyWage;
    if (employee.role === 'barista') capacity += 8;
    if (employee.role === 'administrator') capacity += 2;
  });

  return { capacity: Math.floor(capacity), wages: Math.round(wages) };
}

function getCandidates(population: PopulationState, business: OwnedBusiness, premises: BusinessPremises, time: GameTime, seed: number): NpcId[] {
  const employeeIds = new Set(business.employees.map((employee) => String(employee.npcId)));
  return population.npcs
    .filter((npc) => npc.activationDay <= time.day && !employeeIds.has(String(npc.id)))
    .sort((left, right) => {
      const leftDistrict = left.homeDistrictId === premises.districtId ? 0.5 : 0;
      const rightDistrict = right.homeDistrictId === premises.districtId ? 0.5 : 0;
      const leftScore = leftDistrict + deterministicUnit(seed, `${left.id}:${time.day}:${time.hour}`);
      const rightScore = rightDistrict + deterministicUnit(seed, `${right.id}:${time.day}:${time.hour}`);
      return rightScore - leftScore;
    })
    .map((npc) => npc.id);
}

function weightedMenuOrder(menuItems: BusinessMenuItemDefinition[], seed: number, key: string): BusinessMenuItemDefinition[] {
  return [...menuItems].sort((left, right) => {
    const leftScore = deterministicUnit(seed, `${key}:${left.id}`) * left.demandWeight;
    const rightScore = deterministicUnit(seed, `${key}:${right.id}`) * right.demandWeight;
    return rightScore - leftScore;
  });
}

function getIngredientCost(item: BusinessMenuItemDefinition, supplies: BusinessSupplyDefinition[]): number {
  return item.ingredients.reduce((sum, ingredient) => {
    const supply = supplies.find((candidate) => candidate.id === ingredient.supplyId);
    return sum + (supply?.unitCost ?? 0) * ingredient.quantity;
  }, 0);
}

function finalizeReport(report: BusinessDailyReport): BusinessDailyReport {
  const topMenuItemId = Object.entries(report.itemSales)
    .sort(([, left], [, right]) => (right ?? 0) - (left ?? 0))[0]?.[0] as BusinessMenuItemId | undefined;
  return {
    ...report,
    topMenuItemId,
    netProfit: report.revenue - report.costOfGoods - report.wages - report.utilities - report.rent
  };
}

function chargeBusiness(balance: number, debt: number, amount: number): { balance: number; debt: number } {
  if (amount <= balance) return { balance: balance - amount, debt };
  return { balance: 0, debt: debt + amount - balance };
}

function rolloverToDay(
  business: OwnedBusiness,
  targetDay: number,
  premises: BusinessPremises,
  events: BusinessSimulationEvent[]
): OwnedBusiness {
  let next = business;
  while (next.currentReport.day < targetDay) {
    const finalized = finalizeReport(next.currentReport);
    events.push({
      title: 'Отчёт кофейни',
      text: `День ${finalized.day}: выручка ${finalized.revenue} ₽, чистая прибыль ${finalized.netProfit} ₽, обслужено ${finalized.served}.`
    });
    const reportDay = next.currentReport.day + 1;
    const utilityCharge = chargeBusiness(next.balance, next.debt, premises.dailyUtilities);
    let balance = utilityCharge.balance;
    let debt = utilityCharge.debt;
    let rent = 0;
    let nextRentDay = next.nextRentDay;

    if (reportDay >= nextRentDay) {
      rent = premises.rentPerWeek;
      const rentCharge = chargeBusiness(balance, debt, rent);
      balance = rentCharge.balance;
      debt = rentCharge.debt;
      nextRentDay += 7;
      events.push({
        title: 'Аренда бизнеса',
        text: debt > next.debt
          ? `Аренда ${rent} ₽ оплачена не полностью. Долг бизнеса: ${debt} ₽.`
          : `Оплачена недельная аренда помещения: ${rent} ₽.`
      });
    }

    next = {
      ...next,
      balance,
      debt,
      nextRentDay,
      reports: [finalized, ...next.reports].slice(0, 30),
      currentReport: {
        ...createEmptyBusinessReport(reportDay),
        utilities: premises.dailyUtilities,
        rent
      }
    };
  }
  return next;
}

function simulateHour(input: {
  business: OwnedBusiness;
  premises: BusinessPremises;
  businessType: BusinessTypeDefinition;
  equipment: BusinessEquipmentDefinition[];
  menuItems: BusinessMenuItemDefinition[];
  supplies: BusinessSupplyDefinition[];
  upgrades: BusinessUpgradeDefinition[];
  population: PopulationState;
  time: GameTime;
  seed: number;
  ownerWorking: boolean;
}): OwnedBusiness {
  const { premises, businessType, equipment, menuItems, supplies, upgrades, population, time, seed, ownerWorking } = input;
  let business = input.business;
  if (!getScheduleStatus(business.schedule, time).isOpen) return business;

  const activeMenu = menuItems.filter((item) => businessType.menuItemIds.includes(item.id));
  const staff = getStaffCapacity(business, time, ownerWorking);
  const equipmentCapacity = getEquipmentCapacity(business, equipment);
  const capacity = Math.max(0, Math.min(staff.capacity, equipmentCapacity));
  const averagePriceRatio = getAveragePriceRatio(business, activeMenu);
  const priceFactor = clamp(1.45 - averagePriceRatio * 0.45, 0.55, 1.15);
  const reputationFactor = 0.65 + business.reputation / 100 * 0.7;
  const demandMultiplier = getUpgradeDemandMultiplier(business, upgrades);
  const rawDemand = premises.footTraffic * 2.2 * getPeakMultiplier(time) * priceFactor * reputationFactor * demandMultiplier;
  const demandVariance = 0.8 + deterministicUnit(seed, `${business.id}:${time.day}:${time.hour}:demand`) * 0.45;
  const visitors = Math.max(0, Math.round(rawDemand * demandVariance));
  const candidates = getCandidates(population, business, premises, time, seed).slice(0, visitors);
  let inventory = { ...business.inventory };
  let served = 0;
  let revenue = 0;
  let costOfGoods = 0;
  let stockouts = 0;
  const itemSales = { ...business.currentReport.itemSales };
  const customerIds: NpcId[] = [];

  for (let index = 0; index < Math.min(visitors, capacity); index += 1) {
    const ordered = weightedMenuOrder(activeMenu, seed, `${business.id}:${time.day}:${time.hour}:${index}`);
    const item = ordered.find((candidate) => canProduceMenuItem(inventory, business.equipmentIds, candidate));
    if (!item) {
      stockouts += 1;
      continue;
    }
    inventory = consumeMenuItemIngredients(inventory, item);
    served += 1;
    revenue += business.menuPrices[item.id] ?? item.recommendedPrice;
    costOfGoods += getIngredientCost(item, supplies);
    itemSales[item.id] = (itemSales[item.id] ?? 0) + 1;
    const customerId = candidates[index];
    if (customerId) customerIds.push(customerId);
  }

  const lostCustomers = Math.max(0, visitors - served);
  const reputationDelta = visitors === 0
    ? 0
    : lostCustomers / Math.max(1, visitors) > 0.4
      ? -1.2
      : stockouts > 0
        ? -0.5
        : 0.25;
  const report = {
    ...business.currentReport,
    visitors: business.currentReport.visitors + visitors,
    served: business.currentReport.served + served,
    lostCustomers: business.currentReport.lostCustomers + lostCustomers,
    revenue: business.currentReport.revenue + revenue,
    costOfGoods: business.currentReport.costOfGoods + costOfGoods,
    wages: business.currentReport.wages + staff.wages,
    stockouts: business.currentReport.stockouts + stockouts,
    itemSales
  };

  business = {
    ...business,
    balance: Math.max(0, business.balance + revenue - staff.wages),
    debt: business.balance + revenue >= staff.wages ? business.debt : business.debt + staff.wages - (business.balance + revenue),
    reputation: clamp(business.reputation + reputationDelta, 0, 100),
    inventory,
    currentReport: report,
    lastCustomerNpcIds: [...customerIds, ...business.lastCustomerNpcIds.filter((id) => !customerIds.includes(id))].slice(0, 12)
  };

  return business;
}

export function simulateBusinessTime(input: {
  world: BusinessWorldState;
  fromTime: GameTime;
  toTime: GameTime;
  population: PopulationState;
  premises?: BusinessPremises;
  businessType?: BusinessTypeDefinition;
  equipment: BusinessEquipmentDefinition[];
  menuItems: BusinessMenuItemDefinition[];
  supplies: BusinessSupplyDefinition[];
  upgrades: BusinessUpgradeDefinition[];
  ownerWorking?: boolean;
}): BusinessSimulationResult {
  const business = input.world.ownedBusiness;
  if (!business || !input.premises || !input.businessType) return { world: input.world, events: [] };

  const events: BusinessSimulationEvent[] = [];
  const endTotal = getTotalMinutes(input.toTime);
  let cursor = Math.max(0, Math.min(business.lastProcessedTotalMinutes, endTotal));
  let nextBusiness = business;

  while (cursor + STEP_MINUTES <= endTotal) {
    const stepTime = timeFromTotalMinutes(cursor + STEP_MINUTES);
    nextBusiness = rolloverToDay(nextBusiness, stepTime.day, input.premises, events);
    nextBusiness = simulateHour({
      business: nextBusiness,
      premises: input.premises,
      businessType: input.businessType,
      equipment: input.equipment,
      menuItems: input.menuItems,
      supplies: input.supplies,
      upgrades: input.upgrades,
      population: input.population,
      time: stepTime,
      seed: input.world.seed,
      ownerWorking: Boolean(input.ownerWorking)
    });
    cursor += STEP_MINUTES;
  }

  nextBusiness = rolloverToDay(nextBusiness, input.toTime.day, input.premises, events);
  nextBusiness = { ...nextBusiness, lastProcessedTotalMinutes: cursor };
  return { world: { ...input.world, ownedBusiness: nextBusiness }, events };
}
