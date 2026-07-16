import { applyMoneyDelta, canAfford } from '../economy';
import {
  applyActivityNeedsDelta,
  getNeedsRequirementFailure,
  getNeedWarning
} from '../needs';
import { applySkillRewards } from '../progression';
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

function getCategoryRequirements(action: LifeAction): {
  minEnergy?: number;
  minHealth?: number;
  minHunger?: number;
  minThirst?: number;
} {
  if (action.category === 'training') {
    return {
      minEnergy: Math.max(20, action.requirements?.minEnergy ?? 0),
      minHealth: Math.max(30, action.requirements?.minHealth ?? 0),
      minHunger: Math.max(6, action.requirements?.minHunger ?? 0),
      minThirst: Math.max(6, action.requirements?.minThirst ?? 0)
    };
  }

  if (action.category === 'walk') {
    return {
      minEnergy: Math.max(6, action.requirements?.minEnergy ?? 0),
      minHealth: Math.max(15, action.requirements?.minHealth ?? 0)
    };
  }

  if (action.category === 'sleep' || action.category === 'rest') {
    return {
      minEnergy: action.requirements?.minEnergy,
      minHealth: action.requirements?.minHealth,
      minHunger: action.requirements?.minHunger,
      minThirst: action.requirements?.minThirst
    };
  }

  return {
    minEnergy: action.requirements?.minEnergy,
    minHealth: Math.max(6, action.requirements?.minHealth ?? 0),
    minHunger: action.requirements?.minHunger,
    minThirst: action.requirements?.minThirst
  };
}

export function getLifeActionFailure(player: Player, action: LifeAction): string | undefined {
  const requirements = action.requirements;

  if (requirements?.minMoney !== undefined && player.money < requirements.minMoney) {
    return `Деньги: ${player.money}/${requirements.minMoney} ₽.`;
  }

  const needsFailure = getNeedsRequirementFailure(player.needs, getCategoryRequirements(action));
  if (needsFailure) return needsFailure;

  const moneyDelta = action.moneyDelta ?? 0;
  if (moneyDelta < 0 && !canAfford(player.money, Math.abs(moneyDelta))) {
    return `Деньги: ${player.money}/${Math.abs(moneyDelta)} ₽.`;
  }

  return undefined;
}

export function applyLifeAction(input: ApplyLifeActionInput): ApplyLifeActionOutput {
  const { player, time, action } = input;
  const failure = getLifeActionFailure(player, action);

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
  const needsApplied = applyActivityNeedsDelta(player.needs, action.needsDelta, {
    scaleEnergyCost: true,
    scaleEnergyRecovery: action.category === 'sleep' || action.category === 'rest'
  });
  const skillApplied = applySkillRewards(player.skills, action.skillRewards);
  const nextMoney = applyMoneyDelta(player.money, action.moneyDelta);
  const warning = getNeedWarning(needsApplied.needs);
  const levelUpMessages = skillApplied.updates
    .filter((update) => update.leveledUp)
    .map((update) => `Навык повышен до уровня ${update.nextLevel}.`);
  const messages = [action.resultMessage, ...levelUpMessages, warning]
    .filter((message): message is string => Boolean(message));

  return {
    player: {
      ...player,
      money: nextMoney,
      needs: needsApplied.needs,
      skills: skillApplied.skills
    },
    time: nextTime,
    result: {
      ok: true,
      actionId: action.id,
      actionName: action.name,
      timeDeltaMinutes: action.durationMinutes,
      moneyDelta: action.moneyDelta,
      needsDelta: needsApplied.delta,
      ...(skillApplied.updates.length > 0 ? { skillUpdates: skillApplied.updates } : {}),
      messages
    }
  };
}

export type { ActionResult, LifeAction };
