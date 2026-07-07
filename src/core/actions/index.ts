import { applyMoneyDelta, canAfford } from '../economy';
import { applyNeedsDelta, getNeedWarning } from '../needs';
import { addMinutes } from '../time';
import type { ActionResult, LifeAction } from '../../types/actions';
import type { GameTime } from '../../types/time';
import type { Player } from '../../types/player';

export type ApplyLifeActionInput = {
  player: Player;
  time: GameTime;
  action: LifeAction;
};

export type ApplyLifeActionOutput = {
  player: Player;
  time: GameTime;
  result: ActionResult;
};

function getRequirementFailure(player: Player, action: LifeAction): string | undefined {
  const requirements = action.requirements;

  if (requirements?.minMoney !== undefined && player.money < requirements.minMoney) {
    return 'Не хватает денег.';
  }

  if (requirements?.minEnergy !== undefined && player.needs.energy < requirements.minEnergy) {
    return 'Не хватает энергии.';
  }

  const moneyDelta = action.moneyDelta ?? 0;
  if (moneyDelta < 0 && !canAfford(player.money, Math.abs(moneyDelta))) {
    return 'Не хватает денег.';
  }

  return undefined;
}

export function applyLifeAction(input: ApplyLifeActionInput): ApplyLifeActionOutput {
  const { player, time, action } = input;
  const failure = getRequirementFailure(player, action);

  if (failure) {
    return {
      player,
      time,
      result: {
        ok: false,
        actionId: action.id,
        actionName: action.name,
        timeDeltaMinutes: 0,
        messages: [failure]
      }
    };
  }

  const nextTime = addMinutes(time, action.durationMinutes);
  const nextNeeds = applyNeedsDelta(player.needs, action.needsDelta);
  const nextMoney = applyMoneyDelta(player.money, action.moneyDelta);
  const warning = getNeedWarning(nextNeeds);
  const messages = warning ? [action.resultMessage, warning] : [action.resultMessage];

  return {
    player: {
      ...player,
      money: nextMoney,
      needs: nextNeeds
    },
    time: nextTime,
    result: {
      ok: true,
      actionId: action.id,
      actionName: action.name,
      timeDeltaMinutes: action.durationMinutes,
      moneyDelta: action.moneyDelta,
      needsDelta: action.needsDelta,
      messages
    }
  };
}

export type { ActionResult, LifeAction };
