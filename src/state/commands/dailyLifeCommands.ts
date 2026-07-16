import type { DailyOpportunityDecision } from '../../types/dailyLife';
import { getTotalMinutes } from '../../core/time';
import { createLifeLogEntry } from '../gameState';
import type { GameStateSetter } from './commandSupport';
import { mergeLifeLog } from './commandSupport';

export function createDailyLifeCommands(setGameState: GameStateSetter) {
  function resolveDailyOpportunity(opportunityId: string, decision: DailyOpportunityDecision): void {
    setGameState((currentState) => {
      const resolution = {
        day: currentState.time.day,
        opportunityId,
        decision,
        resolvedAtTotalMinutes: getTotalMinutes(currentState.time)
      } as const;
      const existing = currentState.world.phone.dailyOpportunityResolutions.filter((entry) => entry.day !== currentState.time.day);
      const message = decision === 'accepted'
        ? 'Возможность добавлена в план на сегодня.'
        : 'Ты отказался от возможности на сегодня.';
      return {
        ...currentState,
        world: {
          ...currentState.world,
          phone: {
            ...currentState.world.phone,
            dailyOpportunityResolutions: [resolution, ...existing].slice(0, 60)
          }
        },
        lastResult: {
          ok: true,
          actionName: decision === 'accepted' ? 'План на день' : 'Отказ от возможности',
          timeDeltaMinutes: 0,
          messages: [message]
        },
        lifeLog: mergeLifeLog([
          createLifeLogEntry(currentState, decision === 'accepted' ? 'План на день' : 'Возможность отклонена', message)
        ], currentState.lifeLog)
      };
    });
  }

  return { resolveDailyOpportunity };
}
