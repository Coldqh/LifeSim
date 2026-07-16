import { applyMoneyDelta, canAfford } from '../economy';
import { applyNeedsDelta } from '../needs';
import { addMinutes } from '../time';
import { HOUSEHOLD_BILL_PERIOD_DAYS, HOUSEHOLD_BILL_SHARES, HOUSEHOLD_DELIVERY_COST, HOUSEHOLD_REPAIR_COST } from '../../data/household';
import type { Housing, HousingId } from '../../types/housing';
import type {
  HouseholdActionKind,
  HouseholdActionResult,
  HouseholdBillKind,
  HouseholdBillState,
  HouseholdBreakdownKind,
  HouseholdEvent,
  HouseholdProcessResult,
  HouseholdState,
  HouseholdSupplyDefinition
} from '../../types/household';
import type { ProductId } from '../../types/ids';
import type { Player } from '../../types/player';
import type { GameTime } from '../../types/time';

const BILL_KINDS: HouseholdBillKind[] = ['electricity', 'water', 'internet'];
function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function createBill(kind: HouseholdBillKind, day: number): HouseholdBillState {
  return { kind, accrued: 0, debt: 0, dueDay: day + HOUSEHOLD_BILL_PERIOD_DAYS, overdueDays: 0 };
}

function seedFromHousing(housingId: HousingId): number {
  let hash = 2166136261;
  for (const char of String(housingId)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function conditionFromHousing(housing: Housing | undefined): number {
  if (!housing) return 65;
  return { poor: 45, standard: 65, good: 80, excellent: 92 }[housing.condition];
}

export function createInitialHouseholdState(input: {
  housingId: HousingId;
  day: number;
  housing?: Housing;
}): HouseholdState {
  const day = Math.max(1, Math.floor(input.day));
  return {
    version: 1,
    seed: seedFromHousing(input.housingId) ^ day,
    housingId: input.housingId,
    cleanliness: 72,
    condition: conditionFromHousing(input.housing),
    cleaningSupplies: 1,
    pantry: [{
      id: `pantry_starter_${day}`,
      productId: 'groceries_basic' as ProductId,
      units: 2,
      storedDay: day,
      expiresDay: day + 5
    }],
    bills: BILL_KINDS.map((kind) => createBill(kind, day)),
    lastProcessedDay: day
  };
}

export function normalizeHouseholdState(input: {
  value: unknown;
  housingId: HousingId;
  day: number;
  housing?: Housing;
}): HouseholdState {
  const initial = createInitialHouseholdState(input);
  if (!input.value || typeof input.value !== 'object') return initial;
  const candidate = input.value as Partial<HouseholdState>;
  const billsByKind = new Map((Array.isArray(candidate.bills) ? candidate.bills : []).map((bill) => [bill.kind, bill]));
  const bills = BILL_KINDS.map((kind) => {
    const raw = billsByKind.get(kind);
    return raw ? {
      kind,
      accrued: Math.max(0, Math.round(raw.accrued ?? 0)),
      debt: Math.max(0, Math.round(raw.debt ?? 0)),
      dueDay: Math.max(input.day, Math.floor(raw.dueDay ?? input.day + HOUSEHOLD_BILL_PERIOD_DAYS)),
      overdueDays: Math.max(0, Math.floor(raw.overdueDays ?? 0))
    } : createBill(kind, input.day);
  });
  const sameHousing = candidate.housingId === input.housingId;
  return {
    version: 1,
    seed: typeof candidate.seed === 'number' ? candidate.seed >>> 0 : initial.seed,
    housingId: input.housingId,
    cleanliness: clamp(sameHousing ? candidate.cleanliness ?? initial.cleanliness : 75),
    condition: clamp(sameHousing ? candidate.condition ?? initial.condition : conditionFromHousing(input.housing)),
    cleaningSupplies: Math.max(0, Math.floor(candidate.cleaningSupplies ?? initial.cleaningSupplies)),
    pantry: Array.isArray(candidate.pantry)
      ? candidate.pantry.filter((batch) => batch && batch.units > 0 && batch.expiresDay >= input.day).map((batch) => ({
          ...batch,
          units: Math.max(1, Math.floor(batch.units)),
          storedDay: Math.max(1, Math.floor(batch.storedDay)),
          expiresDay: Math.max(input.day, Math.floor(batch.expiresDay))
        })).slice(0, 30)
      : initial.pantry,
    bills,
    activeBreakdown: sameHousing && candidate.activeBreakdown && typeof candidate.activeBreakdown === 'object'
      ? {
          kind: candidate.activeBreakdown.kind,
          startedDay: Math.max(1, Math.floor(candidate.activeBreakdown.startedDay)),
          repairCost: Math.max(100, Math.floor(candidate.activeBreakdown.repairCost ?? HOUSEHOLD_REPAIR_COST))
        }
      : undefined,
    lastProcessedDay: Math.min(input.day, Math.max(1, Math.floor(candidate.lastProcessedDay ?? input.day)))
  };
}

export function moveHouseholdToHousing(input: {
  state: HouseholdState;
  housingId: HousingId;
  day: number;
  housing?: Housing;
}): HouseholdState {
  if (input.state.housingId === input.housingId) return input.state;
  const fresh = createInitialHouseholdState({ housingId: input.housingId, day: input.day, housing: input.housing });
  const outstandingByKind = new Map(input.state.bills.map((bill) => [bill.kind, bill.debt]));
  return {
    ...fresh,
    pantry: input.state.pantry,
    cleaningSupplies: input.state.cleaningSupplies,
    bills: fresh.bills.map((bill) => ({ ...bill, debt: outstandingByKind.get(bill.kind) ?? 0 }))
  };
}

export function addHouseholdSupply(input: {
  state: HouseholdState;
  productId: ProductId;
  supply: HouseholdSupplyDefinition;
  day: number;
}): HouseholdState {
  let state = input.state;
  const foodUnits = Math.max(0, Math.floor(input.supply.foodUnits ?? 0));
  const cleaningUnits = Math.max(0, Math.floor(input.supply.cleaningUnits ?? 0));
  if (foodUnits > 0) {
    const shelfLife = Math.max(1, Math.floor(input.supply.shelfLifeDays ?? 3));
    const nextSeed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
    state = {
      ...state,
      seed: nextSeed,
      pantry: [...state.pantry, {
        id: `pantry_${input.day}_${String(input.productId)}_${nextSeed.toString(36)}`,
        productId: input.productId,
        units: foodUnits,
        storedDay: input.day,
        expiresDay: input.day + shelfLife
      }].slice(-30)
    };
  }
  if (cleaningUnits > 0) state = { ...state, cleaningSupplies: state.cleaningSupplies + cleaningUnits };
  return state;
}

export function getHouseholdFoodUnits(state: HouseholdState, day?: number): number {
  return state.pantry.reduce((sum, batch) => sum + ((day === undefined || batch.expiresDay >= day) ? batch.units : 0), 0);
}

export function getHouseholdOutstandingBills(state: HouseholdState): number {
  return state.bills.reduce((sum, bill) => sum + bill.accrued + bill.debt, 0);
}

export function getHouseholdDebt(state: HouseholdState): number {
  return state.bills.reduce((sum, bill) => sum + bill.debt, 0);
}

function consumeOldestFood(state: HouseholdState): HouseholdState {
  const sorted = [...state.pantry].sort((a, b) => a.expiresDay - b.expiresDay);
  const target = sorted.find((batch) => batch.units > 0);
  if (!target) return state;
  return {
    ...state,
    pantry: state.pantry
      .map((batch) => batch.id === target.id ? { ...batch, units: batch.units - 1 } : batch)
      .filter((batch) => batch.units > 0)
  };
}

export function getHouseholdActionFailure(input: {
  state: HouseholdState;
  player: Player;
  kind: HouseholdActionKind;
  atHome: boolean;
  day: number;
}): string | undefined {
  if (!input.atHome) return 'Нужно находиться дома.';
  if (input.kind === 'cook') {
    if (getHouseholdFoodUnits(input.state, input.day) < 1) return 'Дома нет продуктов для готовки.';
    if (input.player.needs.energy < 8) return 'Недостаточно энергии для готовки.';
  }
  if (input.kind === 'clean') {
    if (input.state.cleaningSupplies < 1) return 'Закончились средства для уборки.';
    if (input.state.cleanliness >= 95) return 'Жильё уже чистое.';
    if (input.player.needs.energy < 12) return 'Недостаточно энергии для уборки.';
  }
  if (input.kind === 'delivery' && !canAfford(input.player.money, HOUSEHOLD_DELIVERY_COST)) return `Нужно ${HOUSEHOLD_DELIVERY_COST} ₽ на доставку.`;
  if (input.kind === 'repair') {
    if (!input.state.activeBreakdown) return 'В жилье сейчас нет активной поломки.';
    if (!canAfford(input.player.money, input.state.activeBreakdown.repairCost)) return `Нужно ${input.state.activeBreakdown.repairCost} ₽ на ремонт.`;
  }
  return undefined;
}

export function applyHouseholdAction(input: {
  state: HouseholdState;
  player: Player;
  time: GameTime;
  kind: HouseholdActionKind;
}): HouseholdActionResult {
  const definitions: Record<HouseholdActionKind, { name: string; minutes: number }> = {
    cook: { name: 'Приготовить простую еду', minutes: 45 },
    clean: { name: 'Убрать жильё', minutes: 60 },
    delivery: { name: 'Заказать доставку еды', minutes: 20 },
    repair: { name: 'Устранить поломку', minutes: 120 }
  };
  const definition = definitions[input.kind];
  let state = input.state;
  let player = input.player;
  let moneyDelta = 0;
  let needsDelta: Partial<Player['needs']> = {};
  const messages: string[] = [];

  if (input.kind === 'cook') {
    state = consumeOldestFood(state);
    needsDelta = { hunger: 50, thirst: 5, energy: -6, mood: 5, health: 1 };
    messages.push('Ты использовал продукты из домашнего запаса и приготовил горячую еду.');
  } else if (input.kind === 'clean') {
    state = {
      ...state,
      cleanliness: clamp(state.cleanliness + 38),
      condition: clamp(state.condition + 3),
      cleaningSupplies: Math.max(0, state.cleaningSupplies - 1)
    };
    needsDelta = { energy: -14, mood: 8, health: 1 };
    messages.push('Ты убрал мусор, разобрал вещи и привёл жильё в порядок.');
  } else if (input.kind === 'delivery') {
    moneyDelta = -HOUSEHOLD_DELIVERY_COST;
    needsDelta = { hunger: 65, thirst: 8, energy: 2, mood: 5 };
    messages.push('Курьер привёз еду. Это быстрее готовки, но заметно дороже.');
  } else {
    const cost = state.activeBreakdown?.repairCost ?? HOUSEHOLD_REPAIR_COST;
    moneyDelta = -cost;
    state = { ...state, activeBreakdown: undefined, condition: clamp(state.condition + 18) };
    needsDelta = { energy: -4, mood: 4 };
    messages.push(`Поломка устранена. Работа мастера стоила ${cost} ₽.`);
  }

  player = {
    ...player,
    money: applyMoneyDelta(player.money, moneyDelta),
    needs: applyNeedsDelta(player.needs, needsDelta)
  };
  const actualNeedsDelta = Object.fromEntries(Object.keys(needsDelta).map((key) => {
    const typed = key as keyof Player['needs'];
    return [typed, player.needs[typed] - input.player.needs[typed]];
  }).filter(([, value]) => value !== 0)) as Partial<Player['needs']>;

  return {
    state,
    player,
    time: addMinutes(input.time, definition.minutes),
    ok: true,
    actionName: definition.name,
    timeDeltaMinutes: definition.minutes,
    moneyDelta,
    needsDelta: actualNeedsDelta,
    messages
  };
}

function billDailyAmounts(total: number): Record<HouseholdBillKind, number> {
  const electricity = Math.max(1, Math.round(total * HOUSEHOLD_BILL_SHARES.electricity));
  const water = Math.max(1, Math.round(total * HOUSEHOLD_BILL_SHARES.water));
  return { electricity, water, internet: Math.max(1, total - electricity - water) };
}

function chooseBreakdown(seed: number, day: number): HouseholdBreakdownKind {
  return (['fridge', 'plumbing', 'power'] as HouseholdBreakdownKind[])[Math.abs((seed ^ Math.imul(day, 1103515245)) >>> 0) % 3];
}

function shouldBreak(state: HouseholdState, day: number): boolean {
  const risk = state.condition < 35 ? 20 : state.condition < 55 ? 10 : state.condition < 75 ? 4 : 1;
  return ((state.seed ^ Math.imul(day, 2654435761)) >>> 0) % 100 < risk;
}

export function processHouseholdDays(input: {
  state: HouseholdState;
  housing: Housing;
  player: Player;
  toDay: number;
}): HouseholdProcessResult {
  let state = input.state.housingId === input.housing.id
    ? input.state
    : moveHouseholdToHousing({ state: input.state, housingId: input.housing.id, day: input.toDay, housing: input.housing });
  let player = input.player;
  const events: HouseholdEvent[] = [];
  const beforeNeeds = player.needs;
  const dailyBills = billDailyAmounts(Math.max(3, input.housing.dailyUtilities));

  for (let day = state.lastProcessedDay + 1; day <= input.toDay; day += 1) {
    let pantry = state.pantry;
    if (state.activeBreakdown?.kind === 'fridge') {
      pantry = pantry.map((batch) => ({ ...batch, expiresDay: batch.expiresDay - 1 }));
    }
    const spoiled = pantry.filter((batch) => batch.expiresDay < day);
    pantry = pantry.filter((batch) => batch.expiresDay >= day);
    if (spoiled.length > 0) {
      events.push({ title: 'Продукты испортились', text: `Испорчено запасов еды: ${spoiled.reduce((sum, batch) => sum + batch.units, 0)}.`, severity: 'warning' });
    }

    const bills = state.bills.map((bill) => {
      let next = { ...bill, accrued: bill.accrued + dailyBills[bill.kind] };
      if (day >= next.dueDay) {
        const amount = next.accrued;
        next = { ...next, debt: next.debt + amount, accrued: 0, dueDay: next.dueDay + HOUSEHOLD_BILL_PERIOD_DAYS };
        events.push({ title: 'Счёт выставлен', text: `${bill.kind === 'electricity' ? 'Электричество' : bill.kind === 'water' ? 'Вода' : 'Интернет'}: ${amount} ₽.`, severity: next.debt > amount ? 'critical' : 'warning' });
      }
      return { ...next, overdueDays: next.debt > 0 ? next.overdueDays + 1 : 0 };
    });

    const dirtLoss = 5 + (input.housing.condition === 'poor' ? 2 : 0) + (state.activeBreakdown?.kind === 'plumbing' ? 3 : 0);
    const cleanliness = clamp(state.cleanliness - dirtLoss);
    const conditionLoss = cleanliness < 30 ? 2 : cleanliness < 50 ? 1 : 0;
    let condition = clamp(state.condition - conditionLoss);
    let activeBreakdown = state.activeBreakdown;
    if (!activeBreakdown && shouldBreak({ ...state, condition }, day)) {
      activeBreakdown = { kind: chooseBreakdown(state.seed, day), startedDay: day, repairCost: HOUSEHOLD_REPAIR_COST };
      condition = clamp(condition - 5);
      const labels: Record<HouseholdBreakdownKind, string> = { fridge: 'сломался холодильник', plumbing: 'протекает сантехника', power: 'неисправна электрика' };
      events.push({ title: 'Поломка дома', text: `В жилье ${labels[activeBreakdown.kind]}.`, severity: 'critical' });
    }

    const debt = bills.reduce((sum, bill) => sum + bill.debt, 0);
    const dailyNeeds: Partial<Player['needs']> = {};
    if (cleanliness < 40) { dailyNeeds.mood = -2; dailyNeeds.health = -1; }
    if (cleanliness < 20) { dailyNeeds.mood = -2; dailyNeeds.health = -1; }
    if (activeBreakdown?.kind === 'plumbing') { dailyNeeds.mood = (dailyNeeds.mood ?? 0) - 2; dailyNeeds.health = (dailyNeeds.health ?? 0) - 1; }
    if (activeBreakdown?.kind === 'power') dailyNeeds.mood = (dailyNeeds.mood ?? 0) - 2;
    if (debt > 0) dailyNeeds.mood = (dailyNeeds.mood ?? 0) - Math.min(3, 1 + Math.floor(debt / 1500));
    player = { ...player, needs: applyNeedsDelta(player.needs, dailyNeeds) };

    state = { ...state, pantry, bills, cleanliness, condition, activeBreakdown, lastProcessedDay: day };
  }

  const needsDelta = Object.fromEntries((Object.keys(beforeNeeds) as Array<keyof Player['needs']>).map((key) => [key, player.needs[key] - beforeNeeds[key]]).filter(([, value]) => value !== 0)) as Partial<Player['needs']>;
  return { state, player, needsDelta, events };
}

export function payHouseholdBills(input: {
  state: HouseholdState;
  player: Player;
}): { state: HouseholdState; player: Player; amount: number; ok: boolean; message: string } {
  const amount = getHouseholdOutstandingBills(input.state);
  if (amount <= 0) return { state: input.state, player: input.player, amount: 0, ok: false, message: 'Сейчас нет неоплаченных бытовых счетов.' };
  if (!canAfford(input.player.money, amount)) return { state: input.state, player: input.player, amount, ok: false, message: `На оплату всех счетов нужно ${amount} ₽.` };
  return {
    state: { ...input.state, bills: input.state.bills.map((bill) => ({ ...bill, accrued: 0, debt: 0, overdueDays: 0 })) },
    player: { ...input.player, money: applyMoneyDelta(input.player.money, -amount) },
    amount,
    ok: true,
    message: `Бытовые счета оплачены: ${amount} ₽.`
  };
}

export function getHouseholdSleepPenalty(state: HouseholdState, elapsedMinutes: number): Partial<Player['needs']> {
  if (elapsedMinutes <= 0) return {};
  const factor = Math.min(1, elapsedMinutes / 480);
  let energy = 0;
  let mood = 0;
  if (state.cleanliness < 40) mood -= 4;
  if (state.condition < 45) { energy -= 6; mood -= 3; }
  if (state.activeBreakdown?.kind === 'power') energy -= 10;
  if (state.activeBreakdown?.kind === 'plumbing') mood -= 4;
  if (getHouseholdDebt(state) > 0) mood -= 2;
  return {
    ...(energy ? { energy: Math.round(energy * factor) } : {}),
    ...(mood ? { mood: Math.round(mood * factor) } : {})
  };
}
