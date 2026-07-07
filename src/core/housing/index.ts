import { applyMoneyDelta } from '../economy';
import type { Housing, HousingChargeEvent, HousingDayChangeResult } from '../../types/housing';
import type { Player } from '../../types/player';

type ApplyHousingChargeInput = {
  money: number;
  debt: number;
  amount: number;
  paidTitle: string;
  paidText: string;
  debtText: string;
};

type ApplyHousingChargeOutput = {
  money: number;
  debt: number;
  event: HousingChargeEvent;
};

export type ApplyHousingDayChangesInput = {
  player: Player;
  housing: Housing;
  elapsedDays: number;
};

export type ApplyHousingDayChangesOutput = {
  player: Player;
  events: HousingChargeEvent[];
};

function applyHousingCharge(input: ApplyHousingChargeInput): ApplyHousingChargeOutput {
  const amount = Math.max(0, Math.round(input.amount));
  const paidAmount = Math.min(input.money, amount);
  const debtDelta = amount - paidAmount;
  const nextMoney = applyMoneyDelta(input.money, -paidAmount);
  const nextDebt = Math.round(input.debt + debtDelta);

  if (debtDelta > 0) {
    return {
      money: nextMoney,
      debt: nextDebt,
      event: {
        type: 'housing_debt',
        title: 'Долг по жилью',
        text: `${input.debtText} Не хватило ${debtDelta} ₽.`,
        moneyDelta: -paidAmount,
        debtDelta
      }
    };
  }

  return {
    money: nextMoney,
    debt: nextDebt,
    event: {
      type: input.paidTitle === 'Аренда' ? 'rent_paid' : 'daily_upkeep',
      title: input.paidTitle,
      text: input.paidText,
      moneyDelta: -paidAmount
    }
  };
}

export function applyHousingDayChanges(input: ApplyHousingDayChangesInput): ApplyHousingDayChangesOutput {
  const elapsedDays = Math.max(0, Math.floor(input.elapsedDays));
  if (elapsedDays === 0) {
    return {
      player: input.player,
      events: []
    };
  }

  let money = input.player.money;
  let rentDebt = input.player.rentDebt;
  let daysUntilRent = input.player.daysUntilRent || input.housing.rentPeriodDays;
  const events: HousingChargeEvent[] = [];

  for (let dayIndex = 0; dayIndex < elapsedDays; dayIndex += 1) {
    const upkeep = applyHousingCharge({
      money,
      debt: rentDebt,
      amount: input.housing.dailyUtilities,
      paidTitle: 'Бытовые расходы',
      paidText: `Жильё: бытовые расходы ${input.housing.dailyUtilities} ₽.`,
      debtText: `Бытовые расходы ${input.housing.dailyUtilities} ₽ ушли в долг.`
    });

    money = upkeep.money;
    rentDebt = upkeep.debt;
    events.push(upkeep.event);

    daysUntilRent -= 1;

    if (daysUntilRent <= 0) {
      const rent = applyHousingCharge({
        money,
        debt: rentDebt,
        amount: input.housing.rentPerWeek,
        paidTitle: 'Аренда',
        paidText: `Оплачена аренда: ${input.housing.rentPerWeek} ₽.`,
        debtText: `Аренда ${input.housing.rentPerWeek} ₽ ушла в долг.`
      });

      money = rent.money;
      rentDebt = rent.debt;
      events.push(rent.event);
      daysUntilRent = input.housing.rentPeriodDays;
    }
  }

  return {
    player: {
      ...input.player,
      money,
      rentDebt,
      daysUntilRent
    },
    events
  };
}

export function getHousingSummary(housing: Housing): HousingDayChangeResult {
  return {
    playerMoney: 0,
    rentDebt: 0,
    daysUntilRent: housing.rentPeriodDays,
    events: []
  };
}

export type { Housing, HousingChargeEvent };
