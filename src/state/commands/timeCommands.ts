import { addMinutes } from '../../core/time';
import { createLifeLogEntry } from '../gameState';
import type { GameStateSetter } from './commandSupport';
import { applyElapsedTimeConsequences, mergeLifeLog } from './commandSupport';

export function createTimeCommands(setGameState: GameStateSetter) {
  function skipGameTime(minutes: number, maxMinutes = 24 * 60): void {
    const safeMinutes = Math.max(1, Math.min(maxMinutes, Math.floor(minutes)));
    setGameState((currentState) => {
      const nextTime = addMinutes(currentState.time, safeMinutes);
      const elapsedApplied = applyElapsedTimeConsequences(currentState, currentState.player, nextTime, 'resting', { actionTitle: 'Ожидание' });
      const message = `Прошло ${Math.floor(safeMinutes / 60)} ч ${safeMinutes % 60} мин.`;
      return {
        ...currentState,
        player: elapsedApplied.player,
        time: nextTime,
        world: elapsedApplied.world,
        lastResult: { ok: true, actionName: 'Ожидание', timeDeltaMinutes: safeMinutes, needsDelta: elapsedApplied.needsDelta, messages: [message, ...elapsedApplied.messages] },
        lifeLog: mergeLifeLog([createLifeLogEntry({ time: nextTime }, 'Ожидание', message), ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  return {
    skipGameTime
  };
}
