import { applyMoneyDelta } from '../economy';
import type { BusinessOperationResult, BusinessWorldState } from '../../types/business';
import type { Player } from '../../types/player';

export function investInBusiness(input: {
  player: Player;
  world: BusinessWorldState;
  amount: number;
}): { player: Player; world: BusinessWorldState; result: BusinessOperationResult } {
  const business = input.world.ownedBusiness;
  const amount = Math.max(1000, Math.floor(input.amount / 1000) * 1000);
  if (!business) {
    return { player: input.player, world: input.world, result: { ok: false, actionName: 'Пополнение', timeDeltaMinutes: 0, messages: ['Сначала открой бизнес.'] } };
  }
  if (input.player.money < amount) {
    return { player: input.player, world: input.world, result: { ok: false, actionName: 'Пополнение', timeDeltaMinutes: 0, messages: [`Не хватает ${amount - input.player.money} ₽.`] } };
  }
  return {
    player: { ...input.player, money: applyMoneyDelta(input.player.money, -amount) },
    world: { ...input.world, ownedBusiness: { ...business, balance: business.balance + amount } },
    result: {
      ok: true,
      actionName: 'Пополнение',
      timeDeltaMinutes: 0,
      playerMoneyDelta: -amount,
      businessMoneyDelta: amount,
      messages: [`На счёт бизнеса внесено ${amount} ₽.`]
    }
  };
}
