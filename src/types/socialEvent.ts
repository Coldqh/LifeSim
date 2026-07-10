import type { NpcId, SocialEventChoiceId, SocialEventId } from './ids';
import type { NeedsState } from './needs';
import type { RelationshipDelta, SocialContext } from './relationship';

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
};

export type ActiveSocialEvent = {
  instanceId: string;
  templateId: SocialEventId;
  npcId: NpcId;
  title: string;
  text: string;
  choices: SocialEventChoiceDefinition[];
  source: 'interaction' | 'scheduled';
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
};
