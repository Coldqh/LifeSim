import { activateSocialEvent } from '../events';
import type { Npc } from '../../types/npc';
import type { NpcStoryChainDefinition, NpcStoryEffect, SocialEventTemplate, SocialState } from '../../types/socialEvent';
import { fromTotalMinutes } from '../time';
import type { Player } from '../../types/player';
import type { UniversityState, UniversitySubjectDefinition } from '../../types/university';
import { applyUniversityStoryKnowledge } from '../university';
import { applyBoxingStoryProgress } from '../sport';

const GLOBAL_STORY_COOLDOWN_KEY = 'npc_story_global_activation';
const GLOBAL_STORY_COOLDOWN_DAYS = 2;

function hasStoryMemory(social: SocialState, prefix: string): boolean {
  return Object.values(social.relationships).some((relationship) => (
    relationship.memories.some((memory) => memory.key.startsWith(prefix))
  ));
}

function hasStoryInFlight(social: SocialState, chain: NpcStoryChainDefinition): boolean {
  if (social.activeEvent?.storyChainId === chain.id) return true;
  return social.scheduledEvents.some((event) => chain.templateIds.includes(event.templateId));
}

function chooseNpc(candidates: Npc[], day: number): Npc | undefined {
  const active = candidates
    .filter((npc) => npc.activationDay <= day)
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  if (active.length === 0) return undefined;
  return active[(day - 1) % active.length];
}

export function maybeActivateNpcStory(input: {
  social: SocialState;
  currentTotalMinutes: number;
  templates: SocialEventTemplate[];
  chains: NpcStoryChainDefinition[];
  universityCandidates: Npc[];
  workCandidates: Npc[];
  boxingCandidates: Npc[];
}): SocialState {
  if (input.social.activeEvent) return input.social;
  if (input.chains.some((chain) => hasStoryInFlight(input.social, chain))) return input.social;

  const day = fromTotalMinutes(input.currentTotalMinutes).day;
  const lastActivationDay = input.social.eventCooldowns[GLOBAL_STORY_COOLDOWN_KEY];
  if (lastActivationDay !== undefined && day - lastActivationDay < GLOBAL_STORY_COOLDOWN_DAYS) {
    return input.social;
  }

  const candidateMap = {
    university_peer: input.universityCandidates,
    work_colleague: input.workCandidates,
    boxing_partner: input.boxingCandidates
  } as const;

  for (const chain of input.chains) {
    if (hasStoryMemory(input.social, chain.memoryPrefix)) continue;
    const npc = chooseNpc(candidateMap[chain.id], day);
    const template = input.templates.find((entry) => entry.id === chain.rootTemplateId);
    if (!npc || !template) continue;

    const activated = activateSocialEvent({
      social: input.social,
      npc,
      template,
      currentTotalMinutes: input.currentTotalMinutes,
      source: 'story'
    });
    return {
      ...activated,
      eventCooldowns: {
        ...activated.eventCooldowns,
        [GLOBAL_STORY_COOLDOWN_KEY]: day
      }
    };
  }

  return input.social;
}

export function applyNpcStoryEffect(input: {
  effect?: NpcStoryEffect;
  player: Player;
  university: UniversityState;
  universitySubjects: UniversitySubjectDefinition[];
  currentTotalMinutes: number;
}): { player: Player; university: UniversityState; messages: string[] } {
  if (!input.effect) return { player: input.player, university: input.university, messages: [] };

  if (input.effect.kind === 'university_knowledge') {
    const applied = applyUniversityStoryKnowledge({
      state: input.university,
      subjects: input.universitySubjects,
      knowledgeDelta: input.effect.knowledgeDelta,
      studyLoadDelta: input.effect.studyLoadDelta,
      currentTotalMinutes: input.currentTotalMinutes
    });
    return {
      player: input.player,
      university: applied.state,
      messages: applied.message ? [applied.message] : []
    };
  }

  const boxingApplied = applyBoxingStoryProgress({
    profile: input.player.boxing,
    stat: input.effect.stat,
    statDelta: input.effect.statDelta,
    formDelta: input.effect.formDelta,
    fatigueDelta: input.effect.fatigueDelta
  });
  return {
    player: { ...input.player, boxing: boxingApplied.profile },
    university: input.university,
    messages: boxingApplied.message ? [boxingApplied.message] : []
  };
}
