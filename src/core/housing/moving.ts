import { applyMoneyDelta } from '../economy';
import type {
  Housing,
  HousingAffordability,
  HousingMarketState,
  HousingMoveResult,
  RentalContract
} from '../../types/housing';
import type { Player } from '../../types/player';
import { isHousingListingActive, isHousingViewed } from './market';

export const HOUSING_VIEWING_DURATION_MINUTES = 40;
export const HOUSING_MOVING_DURATION_MINUTES = 120;

export function getHousingAffordability(player: Player, housing: Housing, rentMultiplier = 1): HousingAffordability {
  const depositRefund = player.rentalContract?.depositPaid ?? 0;
  const effectiveRent = Math.round(housing.rentPerWeek * Math.max(0.5, rentMultiplier));
  const moveInCost = housing.deposit + effectiveRent + housing.movingCost;
  const netCost = Math.max(0, moveInCost - depositRefund);

  if (player.rentDebt > 0) {
    return {
      moveInCost,
      depositRefund,
      netCost,
      canAfford: false,
      failure: `Сначала погаси долг по жилью: ${player.rentDebt} ₽.`
    };
  }

  if (player.money + depositRefund < moveInCost) {
    return {
      moveInCost,
      depositRefund,
      netCost,
      canAfford: false,
      failure: `Нужно ${netCost} ₽ с учётом возврата залога.`
    };
  }

  return { moveInCost, depositRefund, netCost, canAfford: true };
}

export function getHousingMoveFailure(input: {
  player: Player;
  market: HousingMarketState;
  housing: Housing;
  rentMultiplier?: number;
}): string | undefined {
  if (input.player.housingId === input.housing.id) return 'Ты уже живёшь здесь.';
  if (!isHousingListingActive(input.market, input.housing.id)) return 'Объявление больше не активно.';
  if (!isHousingViewed(input.market, input.housing.id)) return 'Сначала осмотри жильё.';
  return getHousingAffordability(input.player, input.housing, input.rentMultiplier).failure;
}

export function moveIntoHousing(input: {
  player: Player;
  market: HousingMarketState;
  housing: Housing;
  currentDay: number;
  rentMultiplier?: number;
}): HousingMoveResult {
  const failure = getHousingMoveFailure(input);
  if (failure) {
    return {
      player: input.player,
      market: input.market,
      result: {
        ok: false,
        actionName: 'Переезд',
        timeDeltaMinutes: 0,
        moneyDelta: 0,
        messages: [failure]
      }
    };
  }

  const affordability = getHousingAffordability(input.player, input.housing, input.rentMultiplier);
  const moneyWithRefund = applyMoneyDelta(input.player.money, affordability.depositRefund);
  const nextMoney = applyMoneyDelta(moneyWithRefund, -affordability.moveInCost);
  const contract: RentalContract = {
    housingId: input.housing.id,
    startedDay: input.currentDay,
    nextPaymentDay: input.currentDay + input.housing.rentPeriodDays,
    depositPaid: input.housing.deposit
  };
  const nextMarket: HousingMarketState = {
    ...input.market,
    activeHousingIds: input.market.activeHousingIds.filter((id) => id !== input.housing.id),
    viewedHousingIds: input.market.viewedHousingIds.filter((id) => id !== input.housing.id),
    scheduledViewingHousingId: undefined
  };
  const refundText = affordability.depositRefund > 0
    ? ` Возвращён старый залог ${affordability.depositRefund} ₽.`
    : '';

  return {
    player: {
      ...input.player,
      money: nextMoney,
      housingId: input.housing.id,
      rentalContract: contract,
      cityId: input.player.cityId,
      districtId: input.housing.districtId,
      locationId: input.housing.locationId,
      rentDebt: 0,
      daysUntilRent: input.housing.rentPeriodDays
    },
    market: nextMarket,
    result: {
      ok: true,
      actionName: 'Переезд',
      timeDeltaMinutes: HOUSING_MOVING_DURATION_MINUTES,
      moneyDelta: nextMoney - input.player.money,
      messages: [
        `Переезд завершён: ${input.housing.name}. Списано ${affordability.moveInCost} ₽.${refundText}`
      ]
    }
  };
}
