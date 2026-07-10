import { applyMoneyDelta, canAfford } from '../economy';
import { applyActivityNeedsDelta, getNeedWarning, getNeedsRequirementFailure } from '../needs';
import { addMinutes, getTotalMinutes } from '../time';
import type { Npc, NpcActivityProfile } from '../../types/npc';
import type { Player } from '../../types/player';
import type {
  NpcInteractionDefinition,
  NpcMemory,
  NpcPersonality,
  NpcRelationship,
  RelationshipDelta,
  RelationshipStatus,
  SocialContext
} from '../../types/relationship';
import type { SocialState } from '../../types/socialEvent';
import type { GameTime } from '../../types/time';
import type { LocationId, NpcId } from '../../types/ids';

const RELATIONSHIP_MIN = 0;
const RELATIONSHIP_MAX = 100;
const AFFINITY_MIN = -100;
const AFFINITY_MAX = 100;

function clamp(value: number, min = RELATIONSHIP_MIN, max = RELATIONSHIP_MAX): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function stringHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function personalityValue(seed: number, salt: number): number {
  const mixed = Math.imul(seed ^ salt, 1664525) + 1013904223;
  return 25 + Math.abs(mixed % 71);
}

export function createNpcPersonality(npcId: string, activityProfile: NpcActivityProfile): NpcPersonality {
  const seed = stringHash(npcId);
  const interestPools: Record<NpcActivityProfile, NpcPersonality['interests']> = {
    worker: ['career', 'money', 'food', 'city', 'sport'],
    student: ['education', 'culture', 'nightlife', 'sport', 'city'],
    unemployed: ['city', 'food', 'nightlife', 'money', 'sport'],
    remote_worker: ['career', 'education', 'culture', 'food', 'city'],
    retired: ['culture', 'city', 'food', 'education', 'sport']
  };
  const pool = interestPools[activityProfile];
  const first = seed % pool.length;
  const second = (first + 2 + (seed % 2)) % pool.length;
  const third = (first + 4) % pool.length;

  return {
    sociability: personalityValue(seed, 11),
    temperament: personalityValue(seed, 23),
    reliability: personalityValue(seed, 37),
    ambition: personalityValue(seed, 53),
    generosity: personalityValue(seed, 71),
    interests: [...new Set([pool[first], pool[second], pool[third]])]
  };
}

export function createInitialSocialState(): SocialState {
  return {
    relationships: {},
    scheduledEvents: [],
    eventCooldowns: {},
    history: []
  };
}

export function createInitialRelationship(npcId: NpcId): NpcRelationship {
  return {
    npcId,
    familiarity: 0,
    affinity: 0,
    trust: 0,
    tension: 0,
    interactionCount: 0,
    memories: []
  };
}

export function getNpcRelationship(social: SocialState, npcId: NpcId): NpcRelationship {
  return social.relationships[String(npcId)] ?? createInitialRelationship(npcId);
}

export function getRelationshipStatus(relationship: NpcRelationship): RelationshipStatus {
  if (relationship.tension >= 80 || relationship.affinity <= -70) return 'conflict';
  if (relationship.tension >= 55 || relationship.affinity <= -40) return 'dislike';
  if (relationship.tension >= 30 || relationship.affinity <= -15) return 'tense';
  if (relationship.familiarity < 5) return 'stranger';
  if (relationship.familiarity < 25) return 'acquaintance';
  if (relationship.familiarity < 50 || relationship.trust < 25) return 'friendly';
  if (relationship.familiarity < 80 || relationship.trust < 55) return 'friend';
  return 'close_friend';
}

export function getRelationshipStatusLabel(status: RelationshipStatus): string {
  const labels: Record<RelationshipStatus, string> = {
    stranger: 'Незнакомец',
    acquaintance: 'Знакомый',
    friendly: 'Хороший знакомый',
    friend: 'Друг',
    close_friend: 'Близкий друг',
    tense: 'Напряжённые отношения',
    dislike: 'Неприязнь',
    conflict: 'Конфликт'
  };
  return labels[status];
}

export function applyRelationshipDelta(relationship: NpcRelationship, delta: RelationshipDelta = {}): NpcRelationship {
  return {
    ...relationship,
    familiarity: clamp(relationship.familiarity + (delta.familiarity ?? 0)),
    affinity: clamp(relationship.affinity + (delta.affinity ?? 0), AFFINITY_MIN, AFFINITY_MAX),
    trust: clamp(relationship.trust + (delta.trust ?? 0)),
    tension: clamp(relationship.tension + (delta.tension ?? 0))
  };
}

export function addNpcMemory(relationship: NpcRelationship, memory: NpcMemory): NpcRelationship {
  const withoutDuplicate = relationship.memories.filter((item) => item.key !== memory.key);
  return {
    ...relationship,
    memories: [memory, ...withoutDuplicate].slice(0, 12)
  };
}

export function getInteractionFailure(input: {
  player: Player;
  npc: Npc;
  relationship: NpcRelationship;
  interaction: NpcInteractionDefinition;
  context: SocialContext;
  isPresent: boolean;
}): string | undefined {
  const { player, relationship, interaction, context, isPresent } = input;
  if (!isPresent) return 'Человека сейчас нет рядом.';
  if (!interaction.contexts.includes('general') && !interaction.contexts.includes(context)) return 'Это действие недоступно в текущем месте.';
  if ((interaction.minFamiliarity ?? 0) > relationship.familiarity) return `Знакомство: ${relationship.familiarity}/${interaction.minFamiliarity}.`;
  if ((interaction.minTrust ?? 0) > relationship.trust) return `Доверие: ${relationship.trust}/${interaction.minTrust}.`;
  if (interaction.maxTension !== undefined && relationship.tension > interaction.maxTension) return 'Слишком напряжённые отношения.';
  if ((interaction.moneyDelta ?? 0) < 0 && !canAfford(player.money, Math.abs(interaction.moneyDelta ?? 0))) {
    return `Деньги: ${player.money}/${Math.abs(interaction.moneyDelta ?? 0)} ₽.`;
  }
  const energyCost = Math.abs(Math.min(0, interaction.needsDelta?.energy ?? 0));
  const needsFailure = getNeedsRequirementFailure(player.needs, {
    minEnergy: energyCost > 0 ? energyCost + 3 : undefined,
    minHealth: interaction.durationMinutes >= 30 ? 10 : undefined
  });
  return needsFailure;
}

export type ApplyNpcInteractionOutput = {
  player: Player;
  time: GameTime;
  social: SocialState;
  result: {
    ok: boolean;
    actionName: string;
    timeDeltaMinutes: number;
    moneyDelta?: number;
    needsDelta?: Partial<import('../../types/needs').NeedsState>;
    relationship: NpcRelationship;
    messages: string[];
  };
};

export function applyNpcInteraction(input: {
  player: Player;
  time: GameTime;
  social: SocialState;
  npc: Npc;
  interaction: NpcInteractionDefinition;
  context: SocialContext;
  locationId?: LocationId;
  isPresent: boolean;
}): ApplyNpcInteractionOutput {
  const { player, time, social, npc, interaction, context, locationId, isPresent } = input;
  const currentRelationship = getNpcRelationship(social, npc.id);
  const failure = getInteractionFailure({ player, npc, relationship: currentRelationship, interaction, context, isPresent });

  if (failure) {
    return {
      player,
      time,
      social,
      result: {
        ok: false,
        actionName: interaction.label,
        timeDeltaMinutes: 0,
        relationship: currentRelationship,
        messages: [failure]
      }
    };
  }

  const sociabilityModifier = interaction.relationshipDelta.familiarity && interaction.relationshipDelta.familiarity > 0
    ? Math.round((npc.personality.sociability - 50) / 25)
    : 0;
  const trustModifier = interaction.relationshipDelta.trust && interaction.relationshipDelta.trust > 0
    ? Math.round((npc.personality.reliability - 50) / 35)
    : 0;
  const adjustedDelta: RelationshipDelta = {
    ...interaction.relationshipDelta,
    familiarity: (interaction.relationshipDelta.familiarity ?? 0) + sociabilityModifier,
    trust: (interaction.relationshipDelta.trust ?? 0) + trustModifier
  };
  let nextRelationship = applyRelationshipDelta(currentRelationship, adjustedDelta);
  nextRelationship = {
    ...nextRelationship,
    interactionCount: currentRelationship.interactionCount + 1,
    firstMetDay: currentRelationship.firstMetDay ?? time.day,
    lastInteractionDay: time.day,
    lastInteractionTotalMinutes: getTotalMinutes(time) + interaction.durationMinutes,
    metAtLocationId: currentRelationship.metAtLocationId ?? locationId
  };
  if (interaction.memory) {
    nextRelationship = addNpcMemory(nextRelationship, { ...interaction.memory, day: time.day });
  }

  const needsApplied = applyActivityNeedsDelta(player.needs, interaction.needsDelta, { scaleEnergyCost: true });
  const nextPlayer: Player = {
    ...player,
    money: applyMoneyDelta(player.money, interaction.moneyDelta),
    needs: needsApplied.needs
  };
  const nextTime = addMinutes(time, interaction.durationMinutes);
  const warning = getNeedWarning(nextPlayer.needs);
  const messages = [`${interaction.label}: ${npc.firstName} ${npc.lastName}.`, warning].filter((message): message is string => Boolean(message));

  return {
    player: nextPlayer,
    time: nextTime,
    social: {
      ...social,
      relationships: {
        ...social.relationships,
        [String(npc.id)]: nextRelationship
      }
    },
    result: {
      ok: true,
      actionName: interaction.label,
      timeDeltaMinutes: interaction.durationMinutes,
      moneyDelta: interaction.moneyDelta,
      needsDelta: needsApplied.delta,
      relationship: nextRelationship,
      messages
    }
  };
}
