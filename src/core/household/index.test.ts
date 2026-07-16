import { describe, expect, it } from 'vitest';
import { addHouseholdSupply, applyHouseholdAction, createInitialHouseholdState, getHouseholdFoodUnits, payHouseholdBills, processHouseholdDays } from '.';
import { createInitialPlayer } from '../../state/gameState';
import { createInitialTime } from '../time';
import type { Housing } from '../../types/housing';

const housing: Housing = {
  id: 'housing_test' as Housing['id'], name: 'Тест', locationId: 'home' as Housing['locationId'], districtId: 'district' as Housing['districtId'], address: '', kind: 'room', areaSqm: 18, condition: 'standard', rentPerWeek: 5000, rentPeriodDays: 7, deposit: 0, movingCost: 0, dailyUtilities: 100, comfort: 50, sleepRecoveryBonus: 4, moodRecoveryBonus: 2, boxingFatigueRecoveryBonus: 2, description: ''
};

describe('household core', () => {
  it('stores groceries and consumes the oldest food unit when cooking', () => {
    const player = createInitialPlayer();
    let state = createInitialHouseholdState({ housingId: housing.id, day: 1, housing });
    state = addHouseholdSupply({ state, productId: 'groceries_fresh' as never, supply: { foodUnits: 3, shelfLifeDays: 3 }, day: 1 });
    const before = getHouseholdFoodUnits(state, 1);
    const result = applyHouseholdAction({ state, player, time: createInitialTime(), kind: 'cook' });
    expect(result.ok).toBe(true);
    expect(getHouseholdFoodUnits(result.state, 1)).toBe(before - 1);
    expect(result.player.needs.hunger).toBeGreaterThan(player.needs.hunger);
  });

  it('accrues weekly bills and keeps them as debt until paid', () => {
    const player = createInitialPlayer();
    const state = createInitialHouseholdState({ housingId: housing.id, day: 1, housing });
    const processed = processHouseholdDays({ state, housing, player, toDay: 8 });
    const debt = processed.state.bills.reduce((sum, bill) => sum + bill.debt, 0);
    expect(debt).toBeGreaterThan(0);
    const paid = payHouseholdBills({ state: processed.state, player: { ...processed.player, money: 10000 } });
    expect(paid.ok).toBe(true);
    expect(paid.state.bills.every((bill) => bill.debt === 0 && bill.accrued === 0)).toBe(true);
  });

  it('spoils expired food and lowers cleanliness as days pass', () => {
    const player = createInitialPlayer();
    const state = addHouseholdSupply({ state: createInitialHouseholdState({ housingId: housing.id, day: 1, housing }), productId: 'groceries_fresh' as never, supply: { foodUnits: 2, shelfLifeDays: 1 }, day: 1 });
    const processed = processHouseholdDays({ state, housing, player, toDay: 4 });
    expect(processed.state.cleanliness).toBeLessThan(state.cleanliness);
    expect(processed.events.some((event) => event.title === 'Продукты испортились')).toBe(true);
  });
});
