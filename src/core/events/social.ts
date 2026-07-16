import { applyMoneyDelta, canAfford } from '../economy';
import { applyActivityNeedsDelta, getNeedWarning, getNeedsRequirementFailure } from '../needs';
import { addNpcMemory, applyRelationshipDelta, getNpcRelationship } from '../relationships';
import { addMinutes, fromTotalMinutes, getTotalMinutes } from '../time';
import type { Npc } from '../../types/npc';
import type { Player } from '../../types/player';
import type { SocialContext } from '../../types/relationship';
import type {
  ActiveSocialEvent,
  SocialEventChoiceDefinition,
  SocialEventTemplate,
  SocialState
} from '../../types/socialEvent';
import type { GameTime } from '../../types/time';

function stringHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicUnit(key: string): number {
  const hash = stringHash(key);
  return ((Math.imul(hash, 1664525) + 1013904223) >>> 0) / 4294967296;
}

function formatEventText(text: string, npc: Npc): string {
  return text.split('{npc}').join(`${npc.firstName} ${npc.lastName}`);
}

function createActiveEvent(
  template: SocialEventTemplate,
  npc: Npc,
  currentTotalMinutes: number,
  source: ActiveSocialEvent['source']
): ActiveSocialEvent {
  const day = fromTotalMinutes(currentTotalMinutes).day;
  return {
    instanceId: `social_${String(template.id)}_${String(npc.id)}_${day}_${source}`,
    templateId: template.id,
    npcId: npc.id,
    title: template.title,
    text: formatEventText(template.text, npc),
    choices: template.choices,
    source,
    expiresAtTotalMinutes: template.story
      ? currentTotalMinutes + Math.max(60, template.story.responseWindowMinutes)
      : undefined,
    storyChainId: template.story?.chainId,
    storyStep: template.story?.step,
    expiryChoiceId: template.story?.expiryChoiceId
  };
}

export function activateSocialEvent(input: {
  social: SocialState;
  npc: Npc;
  template: SocialEventTemplate;
  currentTotalMinutes: number;
  source?: ActiveSocialEvent['source'];
}): SocialState {
  if (input.social.activeEvent) return input.social;
  const day = fromTotalMinutes(input.currentTotalMinutes).day;
  return {
    ...input.social,
    activeEvent: createActiveEvent(
      input.template,
      input.npc,
      input.currentTotalMinutes,
      input.source ?? (input.template.story ? 'story' : 'scheduled')
    ),
    eventCooldowns: {
      ...input.social.eventCooldowns,
      [String(input.template.id)]: day
    }
  };
}

export function getEligibleSocialEvents(input: {
  social: SocialState;
  npc: Npc;
  context: SocialContext;
  day: number;
  templates: SocialEventTemplate[];
}): SocialEventTemplate[] {
  const { social, npc, context, day, templates } = input;
  const relationship = getNpcRelationship(social, npc.id);

  return templates.filter((template) => {
    if (template.story) return false;
    if (String(template.id).startsWith('social_followup_')) return false;
    if (!template.contexts.includes('general') && !template.contexts.includes(context)) return false;
    if ((template.minFamiliarity ?? 0) > relationship.familiarity) return false;
    if ((template.minTrust ?? 0) > relationship.trust) return false;
    if (template.maxTension !== undefined && relationship.tension > template.maxTension) return false;
    const lastDay = social.eventCooldowns[String(template.id)];
    if (lastDay !== undefined && day - lastDay < (template.cooldownDays ?? 3)) return false;
    return true;
  });
}

export function maybeActivateSocialEvent(input: {
  social: SocialState;
  npc: Npc;
  context: SocialContext;
  day: number;
  eventWeight: number;
  templates: SocialEventTemplate[];
}): SocialState {
  const { social, npc, context, day, eventWeight, templates } = input;
  if (social.activeEvent) return social;
  const relationship = getNpcRelationship(social, npc.id);
  const roll = deterministicUnit(`${npc.id}:${relationship.interactionCount}:${day}:${context}`);
  if (roll > Math.max(0, Math.min(1, eventWeight))) return social;

  const eligible = getEligibleSocialEvents({ social, npc, context, day, templates });
  if (eligible.length === 0) return social;
  const selected = eligible[Math.floor(deterministicUnit(`${npc.id}:${day}:event`) * eligible.length)] ?? eligible[0];

  return activateSocialEvent({
    social,
    npc,
    template: selected,
    currentTotalMinutes: (day - 1) * 1440,
    source: 'interaction'
  });
}

export function processScheduledSocialEvents(input: {
  social: SocialState;
  currentDay: number;
  currentTotalMinutes: number;
  npcs: Npc[];
  templates: SocialEventTemplate[];
}): SocialState {
  const { social, currentDay, currentTotalMinutes, npcs, templates } = input;
  if (social.activeEvent) return social;
  const due = [...social.scheduledEvents]
    .filter((event) => event.dueDay <= currentDay)
    .sort((left, right) => left.dueDay - right.dueDay)[0];
  if (!due) return social;

  const npc = npcs.find((candidate) => candidate.id === due.npcId);
  const template = templates.find((candidate) => candidate.id === due.templateId);
  if (!npc || !template) {
    return {
      ...social,
      scheduledEvents: social.scheduledEvents.filter((event) => event.id !== due.id)
    };
  }

  const withoutDue = {
    ...social,
    scheduledEvents: social.scheduledEvents.filter((event) => event.id !== due.id)
  };
  return activateSocialEvent({
    social: withoutDue,
    npc,
    template,
    currentTotalMinutes,
    source: template.story ? 'story' : 'scheduled'
  });
}

export function expireActiveSocialEvent(input: {
  social: SocialState;
  currentTotalMinutes: number;
  npcs: Npc[];
}): { social: SocialState; message?: string } {
  const event = input.social.activeEvent;
  if (!event?.expiresAtTotalMinutes || input.currentTotalMinutes < event.expiresAtTotalMinutes) {
    return { social: input.social };
  }

  const npc = input.npcs.find((entry) => entry.id === event.npcId);
  const expiryChoice = event.choices.find((choice) => choice.id === event.expiryChoiceId || choice.expiryOnly);
  if (!npc || !expiryChoice) {
    return { social: { ...input.social, activeEvent: undefined } };
  }

  const day = fromTotalMinutes(input.currentTotalMinutes).day;
  const relationship = getNpcRelationship(input.social, npc.id);
  let nextRelationship = applyRelationshipDelta(relationship, expiryChoice.relationshipDelta);
  nextRelationship = {
    ...nextRelationship,
    lastInteractionDay: day,
    lastInteractionTotalMinutes: input.currentTotalMinutes
  };
  if (expiryChoice.memoryKey && expiryChoice.memoryText) {
    nextRelationship = addNpcMemory(nextRelationship, {
      key: expiryChoice.memoryKey,
      day,
      text: expiryChoice.memoryText,
      tone: expiryChoice.memoryTone ?? 'negative'
    });
  }

  return {
    social: {
      ...input.social,
      activeEvent: undefined,
      relationships: {
        ...input.social.relationships,
        [String(npc.id)]: nextRelationship
      },
      history: [{
        id: `social_history_expired_${event.instanceId}`,
        day,
        npcId: npc.id,
        title: event.title,
        text: expiryChoice.resultText
      }, ...input.social.history].slice(0, 40)
    },
    message: expiryChoice.resultText
  };
}

export function getSocialEventChoiceFailure(player: Player, choice: SocialEventChoiceDefinition): string | undefined {
  if (choice.expiryOnly) return 'Этот вариант применяется только после истечения срока.';
  if ((choice.moneyDelta ?? 0) < 0 && !canAfford(player.money, Math.abs(choice.moneyDelta ?? 0))) {
    return `Деньги: ${player.money}/${Math.abs(choice.moneyDelta ?? 0)} ₽.`;
  }
  const energyCost = Math.abs(Math.min(0, choice.needsDelta?.energy ?? 0));
  return getNeedsRequirementFailure(player.needs, {
    minEnergy: energyCost > 0 ? energyCost + 2 : undefined,
    minHealth: (choice.durationMinutes ?? 0) >= 40 ? 10 : undefined
  });
}

export type ApplySocialEventChoiceOutput = {
  player: Player;
  time: GameTime;
  social: SocialState;
  choice?: SocialEventChoiceDefinition;
  result: {
    ok: boolean;
    actionName: string;
    timeDeltaMinutes: number;
    moneyDelta?: number;
    needsDelta?: Partial<import('../../types/needs').NeedsState>;
    messages: string[];
  };
};

export function applySocialEventChoice(input: {
  player: Player;
  time: GameTime;
  social: SocialState;
  npc: Npc;
  choiceId: string;
}): ApplySocialEventChoiceOutput {
  const { player, time, social, npc, choiceId } = input;
  const event = social.activeEvent;
  const choice = event?.choices.find((candidate) => String(candidate.id) === choiceId);
  if (!event || !choice || event.npcId !== npc.id) {
    return {
      player,
      time,
      social,
      result: { ok: false, actionName: 'Социальное событие', timeDeltaMinutes: 0, messages: ['Событие больше недоступно.'] }
    };
  }
  if (event.expiresAtTotalMinutes !== undefined && getTotalMinutes(time) >= event.expiresAtTotalMinutes) {
    return {
      player,
      time,
      social,
      result: { ok: false, actionName: event.title, timeDeltaMinutes: 0, messages: ['Срок ответа уже истёк.'] }
    };
  }

  const failure = getSocialEventChoiceFailure(player, choice);
  if (failure) {
    return {
      player,
      time,
      social,
      result: { ok: false, actionName: event.title, timeDeltaMinutes: 0, messages: [failure] }
    };
  }

  const relationship = getNpcRelationship(social, npc.id);
  let nextRelationship = applyRelationshipDelta(relationship, choice.relationshipDelta);
  nextRelationship = {
    ...nextRelationship,
    interactionCount: relationship.interactionCount + 1,
    firstMetDay: relationship.firstMetDay ?? time.day,
    lastInteractionDay: time.day,
    lastInteractionTotalMinutes: getTotalMinutes(time) + (choice.durationMinutes ?? 0)
  };
  if (choice.memoryKey && choice.memoryText) {
    nextRelationship = addNpcMemory(nextRelationship, {
      key: choice.memoryKey,
      day: time.day,
      text: choice.memoryText,
      tone: choice.memoryTone ?? 'neutral'
    });
  }

  const needsApplied = applyActivityNeedsDelta(player.needs, choice.needsDelta, { scaleEnergyCost: true });
  const nextPlayer: Player = {
    ...player,
    money: applyMoneyDelta(player.money, choice.moneyDelta),
    needs: needsApplied.needs
  };
  const nextTime = addMinutes(time, choice.durationMinutes ?? 0);
  const followUp = choice.followUp
    ? [{
        id: `scheduled_${String(choice.followUp.templateId)}_${String(npc.id)}_${time.day}_${relationship.interactionCount}`,
        templateId: choice.followUp.templateId,
        npcId: npc.id,
        dueDay: time.day + Math.max(1, choice.followUp.delayDays)
      }]
    : [];
  const historyEntry = {
    id: `social_history_${event.instanceId}_${String(choice.id)}`,
    day: time.day,
    npcId: npc.id,
    title: event.title,
    text: choice.resultText
  };
  const nextSocial: SocialState = {
    ...social,
    activeEvent: undefined,
    relationships: {
      ...social.relationships,
      [String(npc.id)]: nextRelationship
    },
    scheduledEvents: [...social.scheduledEvents, ...followUp],
    history: [historyEntry, ...social.history].slice(0, 40)
  };
  const warning = getNeedWarning(nextPlayer.needs);
  const messages = [choice.resultText, warning].filter((message): message is string => Boolean(message));

  return {
    player: nextPlayer,
    time: nextTime,
    social: nextSocial,
    choice,
    result: {
      ok: true,
      actionName: event.title,
      timeDeltaMinutes: choice.durationMinutes ?? 0,
      moneyDelta: choice.moneyDelta,
      needsDelta: needsApplied.delta,
      messages
    }
  };
}
