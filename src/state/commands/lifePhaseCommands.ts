import { resolveLongTermLifeEvent } from '../../core/life-phases';
import { pushPhoneNotification } from '../../core/phone';
import { getTotalMinutes } from '../../core/time';
import { createLifeLogEntry } from '../gameState';
import type { GameStateSetter } from './commandSupport';
import { mergeLifeLog } from './commandSupport';

export function createLifePhaseCommands(setGameState: GameStateSetter) {
  function resolveLongTermLifeDecision(eventId: string, choiceId: string): void {
    setGameState((currentState) => {
      const applied = resolveLongTermLifeEvent({
        state: currentState.world.lifePhases,
        player: currentState.player,
        university: currentState.world.university,
        business: currentState.world.business,
        medical: currentState.world.medical,
        population: currentState.world.population,
        social: currentState.world.social,
        progression: currentState.progression,
        eventId,
        choiceId,
        day: currentState.time.day
      });
      if (!applied) {
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Долгосрочное решение', timeDeltaMinutes: 0, messages: ['Событие уже закрыто или выбор недоступен.'] }
        };
      }
      const phone = pushPhoneNotification(currentState.world.phone, {
        appId: 'today',
        title: applied.historyEntry.title,
        body: applied.message,
        createdAtTotalMinutes: getTotalMinutes(currentState.time),
        npcId: currentState.world.lifePhases.activeEvents.find((entry) => entry.id === eventId)?.npcId
      });
      return {
        ...currentState,
        player: applied.player,
        progression: applied.progression,
        world: {
          ...currentState.world,
          university: applied.university,
          business: applied.business,
          medical: applied.medical,
          population: applied.population,
          social: applied.social,
          phone,
          lifePhases: applied.state
        },
        lastResult: { ok: true, actionName: applied.historyEntry.title, timeDeltaMinutes: 0, messages: [applied.message] },
        lifeLog: mergeLifeLog([createLifeLogEntry(currentState, applied.historyEntry.title, applied.message)], currentState.lifeLog)
      };
    });
  }

  return { resolveLongTermLifeDecision };
}
