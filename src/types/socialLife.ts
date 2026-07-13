import type { LocationType } from './location';
import type { NeedsState } from './needs';
import type {
  LocationId,
  NpcId,
  SocialInvitationId,
  SocialMeetingId,
  SocialMeetingTypeId
} from './ids';

export type SocialCircleTag = 'work' | 'university' | 'boxing' | 'neighborhood' | 'business' | 'friends';

export type SocialContact = {
  npcId: NpcId;
  exchangedAtTotalMinutes: number;
  lastMessageTotalMinutes?: number;
  muted?: boolean;
};

export type SocialMeetingDefinition = {
  id: SocialMeetingTypeId;
  title: string;
  shortTitle: string;
  description: string;
  durationMinutes: number;
  moneyCost: number;
  locationTypes: LocationType[];
  minFamiliarity: number;
  minAffinity: number;
  minTrust?: number;
  romantic: boolean;
  needsDelta?: Partial<NeedsState>;
  relationshipDelta: {
    familiarity?: number;
    affinity?: number;
    trust?: number;
    tension?: number;
    romance?: number;
  };
};

export type SocialInvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type SocialInvitationDirection = 'incoming' | 'outgoing';

export type SocialInvitation = {
  id: SocialInvitationId;
  npcId: NpcId;
  meetingTypeId: SocialMeetingTypeId;
  locationId: LocationId;
  startsAtTotalMinutes: number;
  createdAtTotalMinutes: number;
  responseAtTotalMinutes: number;
  direction: SocialInvitationDirection;
  status: SocialInvitationStatus;
  resolvedAtTotalMinutes?: number;
};

export type SocialMeetingStatus = 'scheduled' | 'completed' | 'missed' | 'cancelled';

export type SocialMeeting = {
  id: SocialMeetingId;
  invitationId?: SocialInvitationId;
  npcId: NpcId;
  meetingTypeId: SocialMeetingTypeId;
  locationId: LocationId;
  startsAtTotalMinutes: number;
  durationMinutes: number;
  status: SocialMeetingStatus;
  reminderSent?: boolean;
  completedAtTotalMinutes?: number;
  cancelledAtTotalMinutes?: number;
};

export type SocialQuickMessageId = 'check_in' | 'invite_talk' | 'work_chat' | 'study_chat' | 'training_chat';

export type SocialQuickMessageDefinition = {
  id: SocialQuickMessageId;
  label: string;
  outgoingText: string;
  replyText: string;
  cooldownMinutes: number;
  minFamiliarity: number;
  relationshipDelta: {
    familiarity?: number;
    affinity?: number;
    trust?: number;
    tension?: number;
    romance?: number;
  };
};

export type SocialLifeProcessMessage = {
  title: string;
  text: string;
};

export type SocialMeetingSlot = 'today_evening' | 'tomorrow_day' | 'tomorrow_evening';
export type SocialMessageActionId = SocialQuickMessageId;
