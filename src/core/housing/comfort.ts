import { applyNeedsDelta } from '../needs';
import type { Housing } from '../../types/housing';
import type { NeedsState } from '../../types/needs';
import type { Player } from '../../types/player';

export type HousingRecoveryResult = {
  player: Player;
  needsDelta: Partial<NeedsState>;
  fatigueDelta: number;
};

export function applyHousingSleepRecovery(input: {
  player: Player;
  housing: Housing | undefined;
  elapsedMinutes: number;
}): HousingRecoveryResult {
  if (!input.housing || input.elapsedMinutes <= 0) {
    return { player: input.player, needsDelta: {}, fatigueDelta: 0 };
  }

  const factor = Math.min(1, input.elapsedMinutes / 480);
  const needsDelta: Partial<NeedsState> = {
    energy: Math.max(0, Math.round(input.housing.sleepRecoveryBonus * factor)),
    mood: Math.max(0, Math.round(input.housing.moodRecoveryBonus * factor))
  };
  const before = input.player.needs;
  const nextNeeds = applyNeedsDelta(before, needsDelta);
  const actualNeedsDelta: Partial<NeedsState> = {
    energy: nextNeeds.energy - before.energy,
    mood: nextNeeds.mood - before.mood
  };
  const fatigueRecovery = Math.max(0, Math.round(input.housing.boxingFatigueRecoveryBonus * factor));
  const nextFatigue = Math.max(0, input.player.boxing.fatigue - fatigueRecovery);

  return {
    player: {
      ...input.player,
      needs: nextNeeds,
      boxing: { ...input.player.boxing, fatigue: nextFatigue }
    },
    needsDelta: Object.fromEntries(
      Object.entries(actualNeedsDelta).filter(([, value]) => value !== 0)
    ) as Partial<NeedsState>,
    fatigueDelta: nextFatigue - input.player.boxing.fatigue
  };
}
