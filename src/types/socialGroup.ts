import type { NpcId, SocialEventChoiceId, SocialEventId } from './ids';
import type { Npc } from './npc';
import type { RelationshipDelta, SocialContext } from './relationship';

export type SocialGroupId = 'university_group' | 'work_team' | 'boxing_gym';

export type SocialGroupDefinition = {
  id: SocialGroupId;
  title: string;
  shortTitle: string;
  description: string;
  context: Extract<SocialContext, 'education' | 'work' | 'boxing'>;
  eventTemplateId: SocialEventId;
};

export type SocialGroupEffect = {
  relationshipDelta: RelationshipDelta;
  memoryKey: string;
  memoryText: string;
  memoryTone: 'positive' | 'neutral' | 'negative';
};

export type SocialGroupEventMeta = {
  groupId: SocialGroupId;
  responseWindowMinutes: number;
  expiryChoiceId: SocialEventChoiceId;
};

export type SocialGroupAcceptance = 'outsider' | 'tolerated' | 'accepted' | 'trusted' | 'core';

export type SocialGroupView = {
  definition: SocialGroupDefinition;
  active: boolean;
  members: Npc[];
  knownMemberCount: number;
  reputation: number;
  acceptance: SocialGroupAcceptance;
};

export type ActiveSocialGroupSummary = {
  groupId: SocialGroupId;
  title: string;
  memberIds: NpcId[];
};
