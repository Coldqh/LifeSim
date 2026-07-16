import { resolveContextualStoryEvent } from '../../core/story-director';
import { pushPhoneNotification } from '../../core/phone';
import { addMinutes, getTotalMinutes } from '../../core/time';
import type { NeedsState } from '../../types/needs';
import { createLifeLogEntry } from '../gameState';
import type { GameStateSetter } from './commandSupport';
import { applyElapsedTimeConsequences, mergeLifeLog } from './commandSupport';
import { mergeNeedsDelta } from '../worldTimePipeline';

function needsDifference(before: NeedsState, after: NeedsState): Partial<NeedsState> | undefined {
  const delta: Partial<NeedsState> = {
    hunger: after.hunger - before.hunger,
    thirst: after.thirst - before.thirst,
    energy: after.energy - before.energy,
    health: after.health - before.health,
    mood: after.mood - before.mood
  };
  const visible = Object.entries(delta).filter(([, value]) => value !== 0);
  return visible.length ? Object.fromEntries(visible) as Partial<NeedsState> : undefined;
}

export function createContextualStoryCommands(setGameState: GameStateSetter) {
  function resolveContextualStoryDecision(eventId: string, choiceId: string): void {
    setGameState((currentState) => {
      const event = currentState.world.contextualStories.activeEvents.find((entry) => entry.id === eventId);
      if (!event) {
        return { ...currentState, lastResult: { ok: false, actionName: 'История', timeDeltaMinutes: 0, messages: ['Событие уже завершено.'] } };
      }

      const applied = resolveContextualStoryEvent({
        state: currentState.world.contextualStories,
        player: currentState.player,
        university: currentState.world.university,
        household: currentState.world.household,
        social: currentState.world.social,
        organizations: currentState.world.organizations,
        districtEcosystem: currentState.world.districtEcosystem,
        population: currentState.world.population,
        eventId,
        choiceId,
        day: currentState.time.day
      });

      if (!applied) return { ...currentState, lastResult: { ok: false, actionName: event.title, timeDeltaMinutes: 0, messages: ['Событие уже завершено.'] } };
      if ('failure' in applied) return { ...currentState, lastResult: { ok: false, actionName: event.title, timeDeltaMinutes: 0, messages: [applied.failure] } };

      const directNeedsDelta = needsDifference(currentState.player.needs, applied.player.needs);
      if (applied.durationMinutes > 0) {
        const nextTime = addMinutes(currentState.time, applied.durationMinutes);
        const elapsed = applyElapsedTimeConsequences(currentState, applied.player, nextTime, 'active', {
          population: applied.population,
          social: applied.social,
          university: applied.university,
          organizations: applied.organizations,
          household: applied.household,
          districtEcosystem: applied.districtEcosystem,
          contextualStories: applied.state,
          actionTitle: event.title
        });
        const phone = pushPhoneNotification(elapsed.world.phone, {
          appId: 'today', title: event.title, body: applied.message,
          createdAtTotalMinutes: getTotalMinutes(nextTime), npcId: event.npcId
        });
        return {
          ...currentState,
          player: elapsed.player,
          time: nextTime,
          world: { ...elapsed.world, phone },
          lastResult: {
            ok: true,
            actionName: event.title,
            timeDeltaMinutes: applied.durationMinutes,
            moneyDelta: applied.moneyDelta,
            needsDelta: mergeNeedsDelta(directNeedsDelta, elapsed.needsDelta),
            messages: [applied.message, ...elapsed.messages]
          },
          lifeLog: mergeLifeLog([
            createLifeLogEntry({ time: nextTime }, event.title, applied.message),
            ...elapsed.lifeLogEntries
          ], currentState.lifeLog)
        };
      }

      const phone = pushPhoneNotification(currentState.world.phone, {
        appId: 'today', title: event.title, body: applied.message,
        createdAtTotalMinutes: getTotalMinutes(currentState.time), npcId: event.npcId
      });
      return {
        ...currentState,
        player: applied.player,
        world: {
          ...currentState.world,
          population: applied.population,
          social: applied.social,
          university: applied.university,
          organizations: applied.organizations,
          household: applied.household,
          districtEcosystem: applied.districtEcosystem,
          contextualStories: applied.state,
          phone
        },
        lastResult: {
          ok: true,
          actionName: event.title,
          timeDeltaMinutes: 0,
          moneyDelta: applied.moneyDelta,
          needsDelta: directNeedsDelta,
          messages: [applied.message]
        },
        lifeLog: mergeLifeLog([createLifeLogEntry(currentState, event.title, applied.message)], currentState.lifeLog)
      };
    });
  }

  return { resolveContextualStoryDecision };
}
