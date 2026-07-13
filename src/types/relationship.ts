import type { LocationId, NpcId, NpcInteractionId } from './ids';
import type { Npc, NpcRoleDefinition } from './npc';
import type { NeedsState } from './needs';

export type NpcInterest = 'sport' | 'career' | 'nightlife' | 'education' | 'money' | 'culture' | 'food' | 'city';

export type NpcPersonality = {
  sociability: number;
  temperament: number;
  reliability: number;
  ambition: number;
  generosity: number;
  interests: NpcInterest[];
};

export type RomanceStatus = 'none' | 'interest' | 'dating' | 'partner';

export type RelationshipStatus =
  | 'stranger'
  | 'acquaintance'
  | 'friendly'
  | 'friend'
  | 'close_friend'
  | 'tense'
  | 'dislike'
  | 'conflict';

export type NpcMemoryTone = 'positive' | 'neutral' | 'negative';

export type NpcMemory = {
  key: string;
  day: number;
  text: string;
  tone: NpcMemoryTone;
};

export type NpcRelationship = {
  npcId: NpcId;
  familiarity: number;
  affinity: number;
  trust: number;
  tension: number;
  romance: number;
  romanceStatus: RomanceStatus;
  interactionCount: number;
  firstMetDay?: number;
  lastInteractionDay?: number;
  lastInteractionTotalMinutes?: number;
  metAtLocationId?: LocationId;
  memories: NpcMemory[];
};

export type RelationshipDelta = Partial<Pick<NpcRelationship, 'familiarity' | 'affinity' | 'trust' | 'tension' | 'romance'>>;

export type SocialContext = 'general' | 'work' | 'boxing' | 'shop' | 'cafe' | 'education' | 'home';

export type NpcInteractionDefinition = {
  id: NpcInteractionId;
  label: string;
  description: string;
  contexts: SocialContext[];
  durationMinutes: number;
  moneyDelta?: number;
  needsDelta?: Partial<NeedsState>;
  relationshipDelta: RelationshipDelta;
  minFamiliarity?: number;
  minTrust?: number;
  maxTension?: number;
  memory?: Omit<NpcMemory, 'day'>;
  eventWeight?: number;
};

export type NpcInteractionAvailability = {
  interaction: NpcInteractionDefinition;
  available: boolean;
  failure?: string;
};

export type SocialNpcView = {
  npc: Npc;
  role?: NpcRoleDefinition;
  relationship: NpcRelationship;
  status: RelationshipStatus;
  context: SocialContext;
  isPresent: boolean;
  isStaff: boolean;
  isColleague: boolean;
  isKnown: boolean;
  contactUnlocked?: boolean;
  contactFailure?: string;
  interactions: NpcInteractionAvailability[];
};
