import { activateSocialEvent } from '../events';
import { fromTotalMinutes } from '../time';
import type { Npc } from '../../types/npc';
import type { SocialState, SocialEventTemplate } from '../../types/socialEvent';
import type {
  SocialGroupAcceptance,
  SocialGroupDefinition,
  SocialGroupId,
  SocialGroupView
} from '../../types/socialGroup';
import { getNpcRelationship } from '../relationships';

const GLOBAL_GROUP_EVENT_COOLDOWN_KEY = 'social_group_global_activation';
const GLOBAL_GROUP_EVENT_COOLDOWN_DAYS = 2;

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function relationshipScore(social: SocialState, npc: Npc): number {
  const relationship = getNpcRelationship(social, npc.id);
  return clamp(
    40
      + relationship.familiarity * 0.15
      + relationship.affinity * 0.25
      + relationship.trust * 0.25
      - relationship.tension * 0.2
  );
}

export function getSocialGroupAcceptance(reputation: number): SocialGroupAcceptance {
  if (reputation < 25) return 'outsider';
  if (reputation < 45) return 'tolerated';
  if (reputation < 65) return 'accepted';
  if (reputation < 82) return 'trusted';
  return 'core';
}

export function getSocialGroupReputation(social: SocialState, members: Npc[]): number {
  if (members.length === 0) return 0;
  return clamp(members.reduce((sum, npc) => sum + relationshipScore(social, npc), 0) / members.length);
}

export function createSocialGroupView(input: {
  definition: SocialGroupDefinition;
  social: SocialState;
  members: Npc[];
}): SocialGroupView {
  const reputation = getSocialGroupReputation(input.social, input.members);
  const knownMemberCount = input.members.filter((npc) => {
    const relationship = getNpcRelationship(input.social, npc.id);
    return relationship.familiarity >= 5 || Boolean(input.social.contacts[String(npc.id)]);
  }).length;
  return {
    definition: input.definition,
    active: input.members.length > 0,
    members: input.members,
    knownMemberCount,
    reputation,
    acceptance: getSocialGroupAcceptance(reputation)
  };
}


export function createSocialGroupMemberMap(input: {
  day: number;
  universityCandidates: Npc[];
  workCandidates: Npc[];
  boxingCandidates: Npc[];
}): Record<SocialGroupId, Npc[]> {
  const active = (entries: Npc[]) => entries
    .filter((npc) => npc.activationDay <= input.day)
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  return {
    university_group: active(input.universityCandidates),
    work_team: active(input.workCandidates),
    boxing_gym: active(input.boxingCandidates)
  };
}

function chooseRepresentative(members: Npc[], day: number): Npc | undefined {
  const active = members
    .filter((npc) => npc.activationDay <= day)
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  if (active.length === 0) return undefined;
  return active[(day - 1) % active.length];
}

export function maybeActivateSocialGroupEvent(input: {
  social: SocialState;
  currentTotalMinutes: number;
  definitions: SocialGroupDefinition[];
  templates: SocialEventTemplate[];
  membersByGroup: Record<SocialGroupId, Npc[]>;
}): SocialState {
  if (input.social.activeEvent) return input.social;
  const day = fromTotalMinutes(input.currentTotalMinutes).day;
  const lastGlobalDay = input.social.eventCooldowns[GLOBAL_GROUP_EVENT_COOLDOWN_KEY];
  if (lastGlobalDay !== undefined && day - lastGlobalDay < GLOBAL_GROUP_EVENT_COOLDOWN_DAYS) return input.social;

  const ordered = [...input.definitions].sort((left, right) => left.id.localeCompare(right.id));
  const offset = (day - 1) % Math.max(1, ordered.length);
  const rotated = [...ordered.slice(offset), ...ordered.slice(0, offset)];

  for (const definition of rotated) {
    const members = input.membersByGroup[definition.id].filter((npc) => npc.activationDay <= day);
    if (members.length === 0) continue;
    const template = input.templates.find((entry) => entry.id === definition.eventTemplateId);
    if (!template?.group) continue;
    const lastTemplateDay = input.social.eventCooldowns[String(template.id)];
    if (lastTemplateDay !== undefined && day - lastTemplateDay < (template.cooldownDays ?? 7)) continue;
    const representative = chooseRepresentative(members, day);
    if (!representative) continue;

    const activated = activateSocialEvent({
      social: input.social,
      npc: representative,
      template,
      currentTotalMinutes: input.currentTotalMinutes,
      source: 'group',
      groupMemberIds: members.map((npc) => npc.id)
    });
    return {
      ...activated,
      eventCooldowns: {
        ...activated.eventCooldowns,
        [GLOBAL_GROUP_EVENT_COOLDOWN_KEY]: day
      }
    };
  }

  return input.social;
}
