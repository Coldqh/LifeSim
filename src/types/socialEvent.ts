import type { BoxingStatId } from './boxing';
import type { NpcId, SocialEventChoiceId, SocialEventId } from './ids';
import type { NeedsState } from './needs';
import type { RelationshipDelta, SocialContext } from './relationship';
import type { SocialContact, SocialInvitation, SocialMeeting } from './socialLife';

export type NpcStoryChainId = 'university_peer' | 'work_colleague' | 'boxing_partner';

export type NpcStoryChainDefinition = {
  id: NpcStoryChainId;
  context: Extract<SocialContext, 'education' | 'work' | 'boxing'>;
  rootTemplateId: SocialEventId;
  templateIds: SocialEventId[];
  memoryPrefix: string;
};

export type NpcStoryEffect =
  | { kind: 'university_knowledge'; knowledgeDelta: number; studyLoadDelta?: number }
  | { kind: 'boxing_progress'; stat: BoxingStatId; statDelta: number; formDelta?: number; fatigueDelta?: number };

export type SocialFollowUp = {
  templateId: SocialEventId;
  delayDays: number;
};

export type SocialEventChoiceDefinition = {
  id: SocialEventChoiceId;
  label: string;
  resultText: string;
  durationMinutes?: number;
  moneyDelta?: number;
  needsDelta?: Partial<NeedsState>;
  relationshipDelta?: RelationshipDelta;
  memoryKey?: string;
  memoryText?: string;
  memoryTone?: 'positive' | 'neutral' | 'negative';
  followUp?: SocialFollowUp;
  storyEffect?: NpcStoryEffect;
  expiryOnly?: boolean;
};

export type SocialStoryMeta = {
  chainId: NpcStoryChainId;
  step: number;
  responseWindowMinutes: number;
  expiryChoiceId: SocialEventChoiceId;
};

export type SocialEventTemplate = {
  id: SocialEventId;
  title: string;
  text: string;
  contexts: SocialContext[];
  minFamiliarity?: number;
  minTrust?: number;
  maxTension?: number;
  cooldownDays?: number;
  choices: SocialEventChoiceDefinition[];
  story?: SocialStoryMeta;
};

export type ActiveSocialEvent = {
  instanceId: string;
  templateId: SocialEventId;
  npcId: NpcId;
  title: string;
  text: string;
  choices: SocialEventChoiceDefinition[];
  source: 'interaction' | 'scheduled' | 'story';
  expiresAtTotalMinutes?: number;
  storyChainId?: NpcStoryChainId;
  storyStep?: number;
  expiryChoiceId?: SocialEventChoiceId;
};

export type ScheduledSocialEvent = {
  id: string;
  templateId: SocialEventId;
  npcId: NpcId;
  dueDay: number;
};

export type SocialHistoryEntry = {
  id: string;
  day: number;
  npcId: NpcId;
  title: string;
  text: string;
};

export type SocialState = {
  relationships: Record<string, import('./relationship').NpcRelationship>;
  scheduledEvents: ScheduledSocialEvent[];
  activeEvent?: ActiveSocialEvent;
  eventCooldowns: Record<string, number>;
  history: SocialHistoryEntry[];
  contacts: Record<string, SocialContact>;
  invitations: SocialInvitation[];
  meetings: SocialMeeting[];
  initiativeCooldowns: Record<string, number>;
  lastProcessedTotalMinutes: number;
};
