import { getLocationById } from '../../core/location';
import { applyNpcInteraction } from '../../core/relationships';
import { attendSocialMeeting, cancelSocialMeeting, createOutgoingSocialInvitation, exchangeSocialContact, getDefaultMeetingStart, respondToSocialInvitation, sendSocialQuickMessage } from '../../core/social-life';
import { applySocialEventChoice, maybeActivateSocialEvent } from '../../core/events';
import { getTotalMinutes } from '../../core/time';
import { getNpcInteractionById } from '../../data/social/interactionTemplates';
import { socialEventTemplates } from '../../data/social/socialEventTemplates';
import { getSocialMeetingType, getSocialQuickMessage, socialMeetingTypes } from '../../data/social/meetingTypes';
import { getHousingById, getJobById } from '../../data/cities/contentSelectors';
import type { LocationId, NpcId, NpcInteractionId, SocialEventChoiceId, SocialInvitationId, SocialMeetingId, SocialMeetingTypeId } from '../../types/ids';
import type { SocialMeetingSlot, SocialMessageActionId } from '../../types/socialLife';
import { createLifeLogEntry } from '../gameState';
import { mergeNeedsDelta } from '../worldTimePipeline';
import type { GameStateSetter } from './commandSupport';
import { applyElapsedTimeConsequences, mergeLifeLog, getNpcSocialContext } from './commandSupport';

export function createSocialCommands(setGameState: GameStateSetter) {
  function interactWithNpc(npcId: NpcId, interactionId: NpcInteractionId): void {
    const interaction = getNpcInteractionById(interactionId);
    if (!interaction) return;

    setGameState((currentState) => {
      const npc = currentState.world.population.npcs.find((candidate) => candidate.id === npcId);
      if (!npc) return currentState;
      const isPresent = npc.worldState.kind === 'at_location' && npc.worldState.locationId === currentState.player.locationId;
      const currentJob = getJobById(currentState.player.currentJobId);
      const isColleague = Boolean(currentJob && npc.employment?.locationId === currentJob.locationId);
      const context = getNpcSocialContext(npc, currentState.player.locationId, isColleague);
      const applied = applyNpcInteraction({
        player: currentState.player,
        time: currentState.time,
        social: currentState.world.social,
        npc,
        interaction,
        context,
        locationId: currentState.player.locationId,
        isPresent
      });

      if (!applied.result.ok) {
        const logEntry = createLifeLogEntry(currentState, 'Взаимодействие недоступно', applied.result.messages.join(' '));
        return {
          ...currentState,
          lastResult: {
            ok: false,
            actionName: interaction.label,
            timeDeltaMinutes: 0,
            messages: applied.result.messages
          },
          lifeLog: mergeLifeLog([logEntry], currentState.lifeLog)
        };
      }

      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        applied.player,
        applied.time,
        'active',
        { social: applied.social, actionTitle: applied.result.actionName }
      );
      const nextSocial = maybeActivateSocialEvent({
        social: elapsedApplied.social,
        npc,
        context,
        day: applied.time.day,
        eventWeight: interaction.eventWeight ?? 0,
        templates: socialEventTemplates
      });
      const messages = [...applied.result.messages, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: applied.time }, 'Люди', messages.join(' '));

      return {
        ...currentState,
        player: elapsedApplied.player,
        time: applied.time,
        world: { ...elapsedApplied.world, social: nextSocial },
        lastResult: {
          ok: true,
          actionName: applied.result.actionName,
          timeDeltaMinutes: applied.result.timeDeltaMinutes,
          moneyDelta: applied.result.moneyDelta,
          needsDelta: mergeNeedsDelta(applied.result.needsDelta, elapsedApplied.needsDelta),
          messages
        },
        lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function exchangeNpcContact(npcId: NpcId): void {
    setGameState((currentState) => {
      const npc = currentState.world.population.npcs.find((entry) => entry.id === npcId);
      if (!npc) return currentState;
      const isPresent = npc.worldState.kind === 'at_location' && npc.worldState.locationId === currentState.player.locationId;
      if (!isPresent) {
        return { ...currentState, lastResult: { ok: false, actionName: 'Обмен контактами', timeDeltaMinutes: 0, messages: ['Человек должен быть рядом.'] } };
      }
      const applied = exchangeSocialContact({
        social: currentState.world.social,
        phone: currentState.world.phone,
        npc,
        time: currentState.time
      });
      if (!applied.ok) {
        return {
          ...currentState,
          lastResult: { ok: false, actionName: 'Обмен контактами', timeDeltaMinutes: 0, messages: [applied.message] }
        };
      }
      const elapsedApplied = applyElapsedTimeConsequences(currentState, currentState.player, applied.time, 'active', { social: applied.social, phone: applied.phone, actionTitle: 'Обмен контактами' });
      const messages = [applied.message, ...elapsedApplied.messages];
      return {
        ...currentState,
        player: elapsedApplied.player,
        time: applied.time,
        world: elapsedApplied.world,
        lastResult: { ok: true, actionName: 'Обмен контактами', timeDeltaMinutes: 2, needsDelta: elapsedApplied.needsDelta, messages },
        lifeLog: mergeLifeLog([createLifeLogEntry({ time: applied.time }, 'Контакты', applied.message), ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function sendNpcPhoneMessage(npcId: NpcId, actionId: SocialMessageActionId): void {
    const definition = getSocialQuickMessage(actionId);
    if (!definition) return;
    setGameState((currentState) => {
      const npc = currentState.world.population.npcs.find((entry) => entry.id === npcId);
      if (!npc) return currentState;
      const applied = sendSocialQuickMessage({
        social: currentState.world.social,
        phone: currentState.world.phone,
        npc,
        definition,
        time: currentState.time
      });
      if (!applied.ok) {
        return { ...currentState, lastResult: { ok: false, actionName: 'Сообщение', timeDeltaMinutes: 0, messages: [applied.message] } };
      }
      const elapsedApplied = applyElapsedTimeConsequences(currentState, currentState.player, applied.time, 'active', { social: applied.social, phone: applied.phone, actionTitle: 'Сообщение' });
      return {
        ...currentState,
        player: elapsedApplied.player,
        time: applied.time,
        world: elapsedApplied.world,
        lastResult: { ok: true, actionName: 'Сообщение', timeDeltaMinutes: 5, needsDelta: elapsedApplied.needsDelta, messages: [applied.message, ...elapsedApplied.messages] },
        lifeLog: mergeLifeLog([createLifeLogEntry({ time: applied.time }, 'Переписка', applied.message), ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function inviteNpcToMeeting(npcId: NpcId, meetingTypeId: SocialMeetingTypeId, locationId: LocationId, slot: SocialMeetingSlot): void {
    setGameState((currentState) => {
      const npc = currentState.world.population.npcs.find((entry) => entry.id === npcId);
      const meetingType = getSocialMeetingType(meetingTypeId);
      const location = getLocationById(locationId);
      if (!npc || !meetingType) return currentState;
      const applied = createOutgoingSocialInvitation({
        player: currentState.player,
        social: currentState.world.social,
        phone: currentState.world.phone,
        npc,
        meetingType,
        location,
        startsAtTotalMinutes: getDefaultMeetingStart(getTotalMinutes(currentState.time), slot),
        currentTotalMinutes: getTotalMinutes(currentState.time)
      });
      return {
        ...currentState,
        world: applied.ok ? { ...currentState.world, social: applied.social, phone: applied.phone } : currentState.world,
        lastResult: { ok: applied.ok, actionName: 'Приглашение', timeDeltaMinutes: 0, messages: [applied.message] },
        lifeLog: applied.ok ? mergeLifeLog([createLifeLogEntry(currentState, 'Приглашение', applied.message)], currentState.lifeLog) : currentState.lifeLog
      };
    });
  }

  function respondNpcMeetingInvitation(invitationId: SocialInvitationId, accept: boolean): void {
    setGameState((currentState) => {
      const applied = respondToSocialInvitation({
        social: currentState.world.social,
        phone: currentState.world.phone,
        invitationId,
        accept,
        currentTotalMinutes: getTotalMinutes(currentState.time),
        npcs: currentState.world.population.npcs,
        meetingTypes: socialMeetingTypes
      });
      return {
        ...currentState,
        world: applied.ok ? { ...currentState.world, social: applied.social, phone: applied.phone } : currentState.world,
        lastResult: { ok: applied.ok, actionName: accept ? 'Принять приглашение' : 'Отклонить приглашение', timeDeltaMinutes: 0, messages: [applied.message] },
        lifeLog: applied.ok ? mergeLifeLog([createLifeLogEntry(currentState, 'Социальная жизнь', applied.message)], currentState.lifeLog) : currentState.lifeLog
      };
    });
  }

  function attendNpcMeeting(meetingId: SocialMeetingId): void {
    setGameState((currentState) => {
      const meeting = currentState.world.social.meetings.find((entry) => entry.id === meetingId);
      const npc = currentState.world.population.npcs.find((entry) => entry.id === meeting?.npcId);
      const definition = getSocialMeetingType(meeting?.meetingTypeId);
      if (!meeting || !npc || !definition) return currentState;
      const housing = getHousingById(currentState.player.housingId);
      const applied = attendSocialMeeting({
        player: currentState.player,
        time: currentState.time,
        social: currentState.world.social,
        phone: currentState.world.phone,
        meeting,
        npc,
        definition,
        currentLocationId: currentState.player.locationId,
        housingComfort: housing?.comfort
      });
      if (!applied.ok) {
        return { ...currentState, lastResult: { ok: false, actionName: definition.shortTitle, timeDeltaMinutes: 0, messages: [applied.message] } };
      }
      const elapsedApplied = applyElapsedTimeConsequences(currentState, applied.player, applied.time, 'active', { social: applied.social, phone: applied.phone, actionTitle: definition.shortTitle });
      const messages = [applied.message, ...elapsedApplied.messages];
      return {
        ...currentState,
        player: elapsedApplied.player,
        time: applied.time,
        world: elapsedApplied.world,
        lastResult: {
          ok: true,
          actionName: definition.shortTitle,
          timeDeltaMinutes: definition.durationMinutes,
          moneyDelta: applied.moneyDelta,
          needsDelta: mergeNeedsDelta(applied.needsDelta, elapsedApplied.needsDelta),
          messages
        },
        lifeLog: mergeLifeLog([createLifeLogEntry({ time: applied.time }, 'Встреча', applied.message), ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  function cancelNpcMeeting(meetingId: SocialMeetingId): void {
    setGameState((currentState) => {
      const applied = cancelSocialMeeting({
        social: currentState.world.social,
        phone: currentState.world.phone,
        meetingId,
        currentTotalMinutes: getTotalMinutes(currentState.time),
        npcs: currentState.world.population.npcs
      });
      return {
        ...currentState,
        world: applied.ok ? { ...currentState.world, social: applied.social, phone: applied.phone } : currentState.world,
        lastResult: { ok: applied.ok, actionName: 'Отмена встречи', timeDeltaMinutes: 0, messages: [applied.message] },
        lifeLog: applied.ok ? mergeLifeLog([createLifeLogEntry(currentState, 'Встреча', applied.message)], currentState.lifeLog) : currentState.lifeLog
      };
    });
  }

  function chooseSocialEvent(choiceId: SocialEventChoiceId): void {
    setGameState((currentState) => {
      const event = currentState.world.social.activeEvent;
      if (!event) return currentState;
      const npc = currentState.world.population.npcs.find((candidate) => candidate.id === event.npcId);
      if (!npc) {
        return {
          ...currentState,
          world: {
            ...currentState.world,
            social: { ...currentState.world.social, activeEvent: undefined }
          }
        };
      }

      const applied = applySocialEventChoice({
        player: currentState.player,
        time: currentState.time,
        social: currentState.world.social,
        npc,
        choiceId: String(choiceId)
      });
      if (!applied.result.ok) {
        return {
          ...currentState,
          lastResult: {
            ok: false,
            actionName: applied.result.actionName,
            timeDeltaMinutes: 0,
            messages: applied.result.messages
          }
        };
      }

      const elapsedApplied = applyElapsedTimeConsequences(
        currentState,
        applied.player,
        applied.time,
        'active',
        { social: applied.social, actionTitle: applied.result.actionName }
      );
      const messages = [...applied.result.messages, ...elapsedApplied.messages];
      const logEntry = createLifeLogEntry({ time: applied.time }, 'Социальное событие', messages.join(' '));

      return {
        ...currentState,
        player: elapsedApplied.player,
        time: applied.time,
        world: elapsedApplied.world,
        lastResult: {
          ok: true,
          actionName: applied.result.actionName,
          timeDeltaMinutes: applied.result.timeDeltaMinutes,
          moneyDelta: applied.result.moneyDelta,
          needsDelta: mergeNeedsDelta(applied.result.needsDelta, elapsedApplied.needsDelta),
          messages
        },
        lifeLog: mergeLifeLog([logEntry, ...elapsedApplied.lifeLogEntries], currentState.lifeLog)
      };
    });
  }

  return {
    interactWithNpc,
    exchangeNpcContact,
    sendNpcPhoneMessage,
    inviteNpcToMeeting,
    respondNpcMeetingInvitation,
    attendNpcMeeting,
    cancelNpcMeeting,
    chooseSocialEvent
  };
}
