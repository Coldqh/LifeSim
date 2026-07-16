import { applyMoneyDelta } from '../economy';
import { applyActivityNeedsDelta, getNeedsRequirementFailure } from '../needs';
import {
  addNpcMemory,
  applyRelationshipDelta,
  getNpcRelationship
} from '../relationships';
import {
  pushPhoneCalendarEvent,
  pushPhoneMessage,
  pushPhoneNotification
} from '../phone';
import { addMinutes, getTotalMinutes } from '../time';
import { getNpcScheduleConflict } from '../npc-daily';
import type {
  LocationId,
  NpcId,
  PhoneCalendarEventId,
  SocialInvitationId,
  SocialMeetingId,
  SocialMeetingTypeId
} from '../../types/ids';
import type { Location } from '../../types/location';
import type { Npc } from '../../types/npc';
import type { PhoneState } from '../../types/phone';
import type { Player } from '../../types/player';
import type { NpcRelationship, RelationshipDelta, RomanceStatus } from '../../types/relationship';
import type { SocialState } from '../../types/socialEvent';
import type {
  SocialCircleTag,
  SocialInvitation,
  SocialMeeting,
  SocialMeetingDefinition,
  SocialQuickMessageDefinition,
  SocialQuickMessageId
} from '../../types/socialLife';
import type { GameTime } from '../../types/time';

const MINUTES_IN_DAY = 1440;
const CONTACT_FAMILIARITY_REQUIRED = 15;
const CONTACT_INTERACTIONS_REQUIRED = 2;
const MEETING_EARLY_WINDOW = 60;
const MEETING_LATE_WINDOW = 120;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function invitationId(value: string): SocialInvitationId {
  return value as SocialInvitationId;
}

function meetingId(value: string): SocialMeetingId {
  return value as SocialMeetingId;
}

function calendarId(value: string): PhoneCalendarEventId {
  return value as PhoneCalendarEventId;
}

function fullName(npc: Npc): string {
  return `${npc.firstName} ${npc.lastName}`;
}

function formatClock(totalMinutes: number): string {
  const inside = ((totalMinutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  return `${String(Math.floor(inside / 60)).padStart(2, '0')}:${String(inside % 60).padStart(2, '0')}`;
}

function formatDayTime(totalMinutes: number): string {
  return `День ${Math.floor(totalMinutes / MINUTES_IN_DAY) + 1} · ${formatClock(totalMinutes)}`;
}

function resolveRomanceStatus(relationship: NpcRelationship): RomanceStatus {
  if (relationship.romance >= 80 && relationship.trust >= 60 && relationship.affinity >= 55) return 'partner';
  if (relationship.romance >= 55 && relationship.trust >= 25 && relationship.affinity >= 40) return 'dating';
  if (relationship.romance >= 20 && relationship.affinity >= 25) return 'interest';
  return 'none';
}

function withResolvedRomance(relationship: NpcRelationship): NpcRelationship {
  return { ...relationship, romanceStatus: resolveRomanceStatus(relationship) };
}

function updateRelationship(
  social: SocialState,
  npcId: NpcId,
  delta: RelationshipDelta,
  memory?: { key: string; text: string; tone: 'positive' | 'neutral' | 'negative'; day: number }
): SocialState {
  let relationship = withResolvedRomance(applyRelationshipDelta(getNpcRelationship(social, npcId), delta));
  if (memory) relationship = addNpcMemory(relationship, memory);
  return {
    ...social,
    relationships: { ...social.relationships, [String(npcId)]: relationship }
  };
}

export function getContactExchangeFailure(social: SocialState, npcId: NpcId): string | undefined {
  if (social.contacts[String(npcId)]) return 'Контакт уже сохранён.';
  const relationship = getNpcRelationship(social, npcId);
  if (relationship.tension >= 55 || relationship.affinity <= -25) return 'Отношения слишком напряжённые.';
  if (relationship.familiarity < CONTACT_FAMILIARITY_REQUIRED || relationship.interactionCount < CONTACT_INTERACTIONS_REQUIRED) {
    return `Нужно лучше познакомиться: ${relationship.familiarity}/${CONTACT_FAMILIARITY_REQUIRED}, разговоры ${relationship.interactionCount}/${CONTACT_INTERACTIONS_REQUIRED}.`;
  }
  return undefined;
}

export function exchangeSocialContact(input: {
  social: SocialState;
  phone: PhoneState;
  npc: Npc;
  time: GameTime;
}): { social: SocialState; phone: PhoneState; time: GameTime; ok: boolean; message: string } {
  const failure = getContactExchangeFailure(input.social, input.npc.id);
  if (failure) return { social: input.social, phone: input.phone, time: input.time, ok: false, message: failure };

  const now = getTotalMinutes(input.time);
  let social: SocialState = {
    ...input.social,
    contacts: {
      ...input.social.contacts,
      [String(input.npc.id)]: { npcId: input.npc.id, exchangedAtTotalMinutes: now }
    }
  };
  social = updateRelationship(social, input.npc.id, { familiarity: 3, trust: 2 }, {
    key: 'contact_exchanged',
    text: 'Вы обменялись контактами.',
    tone: 'positive',
    day: input.time.day
  });
  let phone = pushPhoneMessage(input.phone, {
    senderName: fullName(input.npc),
    subject: 'Новый контакт',
    body: 'Привет. Это я. Теперь можно договориться о встрече через телефон.',
    createdAtTotalMinutes: now,
    npcId: input.npc.id
  });
  phone = pushPhoneNotification(phone, {
    appId: 'contacts',
    title: 'Контакт сохранён',
    body: fullName(input.npc),
    createdAtTotalMinutes: now,
    npcId: input.npc.id
  });
  return {
    social,
    phone,
    time: addMinutes(input.time, 2),
    ok: true,
    message: `${fullName(input.npc)} добавлен в контакты.`
  };
}

export function getNpcSocialCircles(input: {
  npc: Npc;
  relationship: NpcRelationship;
  playerJobLocationId?: LocationId;
  universityLocationId?: LocationId;
  boxingLocationId?: LocationId;
  playerHomeDistrictId?: string;
  businessLocationId?: LocationId;
}): SocialCircleTag[] {
  const result: SocialCircleTag[] = [];
  if (input.playerJobLocationId && input.npc.employment?.locationId === input.playerJobLocationId) result.push('work');
  if (input.universityLocationId && (input.npc.employment?.locationId === input.universityLocationId || input.npc.activityProfile === 'student')) result.push('university');
  if (input.boxingLocationId && input.npc.employment?.locationId === input.boxingLocationId) result.push('boxing');
  if (input.playerHomeDistrictId && String(input.npc.homeDistrictId) === input.playerHomeDistrictId) result.push('neighborhood');
  if (input.businessLocationId && input.npc.employment?.locationId === input.businessLocationId) result.push('business');
  if (input.relationship.familiarity >= 50 && input.relationship.trust >= 25 && input.relationship.affinity >= 25) result.push('friends');
  return [...new Set(result)];
}

export function getMeetingInviteFailure(input: {
  player: Player;
  social: SocialState;
  npc: Npc;
  meetingType: SocialMeetingDefinition;
  location?: Location;
  startsAtTotalMinutes: number;
  currentTotalMinutes: number;
}): string | undefined {
  const relationship = getNpcRelationship(input.social, input.npc.id);
  if (!input.social.contacts[String(input.npc.id)]) return 'Сначала обменяйтесь контактами.';
  if (relationship.familiarity < input.meetingType.minFamiliarity) return `Знакомство: ${relationship.familiarity}/${input.meetingType.minFamiliarity}.`;
  if (relationship.affinity < input.meetingType.minAffinity) return 'Отношение пока недостаточно хорошее.';
  if (relationship.trust < (input.meetingType.minTrust ?? 0)) return `Доверие: ${relationship.trust}/${input.meetingType.minTrust}.`;
  if (relationship.tension >= 60) return 'Слишком напряжённые отношения.';
  if (input.meetingType.romantic && input.npc.age < 18) return 'Романтические встречи доступны только со взрослыми персонажами.';
  if (!input.location || !input.meetingType.locationTypes.includes(input.location.type)) return 'Для этой встречи выбрано неподходящее место.';
  if (input.startsAtTotalMinutes < input.currentTotalMinutes + 120) return 'Встречу нужно назначить минимум через два часа.';
  if (input.startsAtTotalMinutes > input.currentTotalMinutes + 7 * MINUTES_IN_DAY) return 'Встречу можно назначить максимум на неделю вперёд.';
  const npcConflict = getNpcScheduleConflict(input.npc, input.startsAtTotalMinutes);
  if (npcConflict) return npcConflict;
  const hasActive = input.social.invitations.some((entry) => entry.npcId === input.npc.id && entry.status === 'pending')
    || input.social.meetings.some((entry) => entry.npcId === input.npc.id && entry.status === 'scheduled');
  if (hasActive) return 'С этим человеком уже есть активное приглашение или встреча.';
  if (input.player.money < input.meetingType.moneyCost) return `Нужно ${input.meetingType.moneyCost} ₽.`;
  const needFailure = getNeedsRequirementFailure(input.player.needs, { minHealth: 15, minEnergy: 10 });
  return needFailure;
}

export function createOutgoingSocialInvitation(input: {
  player: Player;
  social: SocialState;
  phone: PhoneState;
  npc: Npc;
  meetingType: SocialMeetingDefinition;
  location?: Location;
  startsAtTotalMinutes: number;
  currentTotalMinutes: number;
}): { social: SocialState; phone: PhoneState; ok: boolean; message: string } {
  const failure = getMeetingInviteFailure(input);
  if (failure) return { social: input.social, phone: input.phone, ok: false, message: failure };
  const seed = hashString(`${input.npc.id}:${input.meetingType.id}:${input.currentTotalMinutes}`);
  const invitation: SocialInvitation = {
    id: invitationId(`social_invite_${String(input.npc.id)}_${input.currentTotalMinutes}`),
    npcId: input.npc.id,
    meetingTypeId: input.meetingType.id,
    locationId: input.location!.id,
    startsAtTotalMinutes: input.startsAtTotalMinutes,
    createdAtTotalMinutes: input.currentTotalMinutes,
    responseAtTotalMinutes: input.currentTotalMinutes + 60 + (seed % 240),
    direction: 'outgoing',
    status: 'pending'
  };
  const social = {
    ...input.social,
    invitations: [invitation, ...input.social.invitations].slice(0, 60)
  };
  const phone = pushPhoneMessage(input.phone, {
    senderName: 'Ты',
    subject: input.meetingType.shortTitle,
    body: `Предложение встретиться: ${formatDayTime(input.startsAtTotalMinutes)}, ${input.location!.name}.`,
    createdAtTotalMinutes: input.currentTotalMinutes,
    locationId: input.location!.id,
    npcId: input.npc.id,
    socialInvitationId: invitation.id
  });
  return { social, phone, ok: true, message: `Приглашение отправлено: ${fullName(input.npc)}.` };
}

function createMeetingFromInvitation(invitation: SocialInvitation, definition: SocialMeetingDefinition): SocialMeeting {
  return {
    id: meetingId(`social_meeting_${String(invitation.npcId)}_${invitation.startsAtTotalMinutes}`),
    invitationId: invitation.id,
    npcId: invitation.npcId,
    meetingTypeId: invitation.meetingTypeId,
    locationId: invitation.locationId,
    startsAtTotalMinutes: invitation.startsAtTotalMinutes,
    durationMinutes: definition.durationMinutes,
    status: 'scheduled'
  };
}

function addMeetingToPhone(input: {
  phone: PhoneState;
  meeting: SocialMeeting;
  npc: Npc;
  definition: SocialMeetingDefinition;
  createdAtTotalMinutes: number;
}): PhoneState {
  let phone = pushPhoneCalendarEvent(input.phone, {
    id: calendarId(`calendar_social_${String(input.meeting.id)}`),
    type: 'social_meeting',
    title: `${input.definition.shortTitle}: ${input.npc.firstName}`,
    locationId: input.meeting.locationId,
    startsAtTotalMinutes: input.meeting.startsAtTotalMinutes,
    durationMinutes: input.meeting.durationMinutes,
    status: 'scheduled',
    npcId: input.npc.id,
    socialMeetingId: input.meeting.id,
    socialInvitationId: input.meeting.invitationId
  });
  phone = pushPhoneNotification(phone, {
    appId: 'contacts',
    title: 'Встреча запланирована',
    body: `${fullName(input.npc)} · ${formatDayTime(input.meeting.startsAtTotalMinutes)}`,
    createdAtTotalMinutes: input.createdAtTotalMinutes,
    locationId: input.meeting.locationId,
    npcId: input.npc.id,
    socialMeetingId: input.meeting.id
  });
  return phone;
}

function invitationAcceptanceScore(npc: Npc, relationship: NpcRelationship, definition: SocialMeetingDefinition): number {
  const sharedBias = npc.personality.sociability * 0.18 + npc.personality.reliability * 0.12;
  const relationshipScore = relationship.affinity * 0.8 + relationship.trust * 0.35 + relationship.familiarity * 0.18;
  const romanticPenalty = definition.romantic ? 18 - relationship.romance * 0.35 : 0;
  return clamp(Math.round(35 + sharedBias + relationshipScore - romanticPenalty), 8, 96);
}

function chooseInitiativeMeetingType(npc: Npc, definitions: SocialMeetingDefinition[], relationship: NpcRelationship): SocialMeetingDefinition | undefined {
  const preferred = npc.personality.interests.includes('sport') ? 'social_training'
    : npc.personality.interests.includes('education') ? 'social_study'
      : npc.personality.interests.includes('food') ? 'social_coffee'
        : 'social_walk';
  const romantic = relationship.romance >= 28 && relationship.affinity >= 35
    ? definitions.find((entry) => String(entry.id) === 'social_date')
    : undefined;
  return romantic ?? definitions.find((entry) => String(entry.id) === preferred) ?? definitions[0];
}

function findMeetingLocation(input: {
  npc: Npc;
  definition: SocialMeetingDefinition;
  locations: Location[];
}): Location | undefined {
  const homeCity = input.locations.find((location) => location.districtId === input.npc.homeDistrictId)?.cityId;
  return input.locations.find((location) => location.cityId === homeCity && input.definition.locationTypes.includes(location.type) && !location.hiddenFromCityBrowser)
    ?? input.locations.find((location) => input.definition.locationTypes.includes(location.type) && !location.hiddenFromCityBrowser);
}

export function processSocialLifeTime(input: {
  social: SocialState;
  phone: PhoneState;
  currentTotalMinutes: number;
  npcs: Npc[];
  locations: Location[];
  meetingTypes: SocialMeetingDefinition[];
}): { social: SocialState; phone: PhoneState; messages: Array<{ title: string; text: string }> } {
  if (input.currentTotalMinutes <= input.social.lastProcessedTotalMinutes) {
    return { social: input.social, phone: input.phone, messages: [] };
  }

  let social: SocialState = { ...input.social };
  let phone = input.phone;
  const messages: Array<{ title: string; text: string }> = [];

  const invitations = social.invitations.map((invitation) => {
    if (invitation.status !== 'pending') return invitation;
    const npc = input.npcs.find((entry) => entry.id === invitation.npcId);
    const definition = input.meetingTypes.find((entry) => entry.id === invitation.meetingTypeId);
    if (!npc || !definition) return { ...invitation, status: 'expired' as const, resolvedAtTotalMinutes: input.currentTotalMinutes };

    if (invitation.direction === 'outgoing' && input.currentTotalMinutes >= invitation.responseAtTotalMinutes) {
      const relationship = getNpcRelationship(social, npc.id);
      const scheduleConflict = getNpcScheduleConflict(npc, invitation.startsAtTotalMinutes);
      const roll = hashString(`${invitation.id}:answer`) % 100;
      const accepted = !scheduleConflict && roll < invitationAcceptanceScore(npc, relationship, definition);
      if (accepted) {
        const meeting = createMeetingFromInvitation(invitation, definition);
        if (!social.meetings.some((entry) => entry.id === meeting.id)) social = { ...social, meetings: [meeting, ...social.meetings].slice(0, 60) };
        phone = addMeetingToPhone({ phone, meeting, npc, definition, createdAtTotalMinutes: invitation.responseAtTotalMinutes });
        phone = pushPhoneMessage(phone, {
          senderName: fullName(npc),
          subject: 'Договорились',
          body: `Да, подходит. ${formatDayTime(meeting.startsAtTotalMinutes)}, ${input.locations.find((entry) => entry.id === meeting.locationId)?.name ?? 'встретимся на месте'}.`,
          createdAtTotalMinutes: invitation.responseAtTotalMinutes,
          locationId: meeting.locationId,
          npcId: npc.id,
          socialInvitationId: invitation.id,
          socialMeetingId: meeting.id
        });
        messages.push({ title: 'Встреча подтверждена', text: `${fullName(npc)} согласился встретиться.` });
        return { ...invitation, status: 'accepted' as const, resolvedAtTotalMinutes: invitation.responseAtTotalMinutes };
      }
      phone = pushPhoneMessage(phone, {
        senderName: fullName(npc),
        subject: 'Не получится',
        body: scheduleConflict ?? 'В этот раз не смогу. Давай как-нибудь позже.',
        createdAtTotalMinutes: invitation.responseAtTotalMinutes,
        npcId: npc.id,
        socialInvitationId: invitation.id
      });
      social = updateRelationship(social, npc.id, { affinity: -1 });
      return { ...invitation, status: 'declined' as const, resolvedAtTotalMinutes: invitation.responseAtTotalMinutes };
    }

    if (invitation.direction === 'incoming' && input.currentTotalMinutes > invitation.startsAtTotalMinutes - 30) {
      phone = pushPhoneMessage(phone, {
        senderName: fullName(npc),
        subject: 'Приглашение закрыто',
        body: 'Время уже прошло. В другой раз.',
        createdAtTotalMinutes: invitation.startsAtTotalMinutes,
        npcId: npc.id,
        socialInvitationId: invitation.id
      });
      social = updateRelationship(social, npc.id, { affinity: -2, tension: 1 });
      return { ...invitation, status: 'expired' as const, resolvedAtTotalMinutes: input.currentTotalMinutes };
    }
    return invitation;
  });
  social = { ...social, invitations };

  const meetings = social.meetings.map((meeting) => {
    if (meeting.status !== 'scheduled') return meeting;
    const npc = input.npcs.find((entry) => entry.id === meeting.npcId);
    if (!npc) return { ...meeting, status: 'cancelled' as const, cancelledAtTotalMinutes: input.currentTotalMinutes };
    if (!meeting.reminderSent && input.currentTotalMinutes >= meeting.startsAtTotalMinutes - 90 && input.currentTotalMinutes <= meeting.startsAtTotalMinutes + MEETING_LATE_WINDOW) {
      phone = pushPhoneNotification(phone, {
        appId: 'calendar',
        title: 'Встреча скоро',
        body: `${fullName(npc)} · ${formatClock(meeting.startsAtTotalMinutes)}`,
        createdAtTotalMinutes: Math.max(meeting.startsAtTotalMinutes - 90, social.lastProcessedTotalMinutes),
        locationId: meeting.locationId,
        npcId: npc.id,
        socialMeetingId: meeting.id
      });
      return { ...meeting, reminderSent: true };
    }
    if (input.currentTotalMinutes > meeting.startsAtTotalMinutes + MEETING_LATE_WINDOW) {
      social = updateRelationship(social, npc.id, { affinity: -6, trust: -4, tension: 6 }, {
        key: `missed_meeting_${meeting.id}`,
        text: 'Ты не пришёл на запланированную встречу.',
        tone: 'negative',
        day: Math.floor(input.currentTotalMinutes / MINUTES_IN_DAY) + 1
      });
      phone = {
        ...phone,
        calendarEvents: phone.calendarEvents.map((event) => event.socialMeetingId === meeting.id ? { ...event, status: 'missed' as const } : event)
      };
      phone = pushPhoneMessage(phone, {
        senderName: fullName(npc),
        subject: 'Ты не пришёл',
        body: 'Я ждал. Можно было хотя бы предупредить.',
        createdAtTotalMinutes: meeting.startsAtTotalMinutes + MEETING_LATE_WINDOW,
        npcId: npc.id,
        socialMeetingId: meeting.id
      });
      messages.push({ title: 'Встреча пропущена', text: `${fullName(npc)} ждал тебя.` });
      return { ...meeting, status: 'missed' as const };
    }
    return meeting;
  });
  social = { ...social, meetings };

  const globalCooldown = social.initiativeCooldowns.__global ?? 0;
  const contacts = Object.values(social.contacts);
  const noPendingIncoming = !social.invitations.some((entry) => entry.direction === 'incoming' && entry.status === 'pending');
  if (noPendingIncoming && contacts.length > 0 && input.currentTotalMinutes >= globalCooldown) {
    const eligible = contacts
      .filter((contact) => input.currentTotalMinutes - contact.exchangedAtTotalMinutes >= 180)
      .map((contact) => input.npcs.find((npc) => npc.id === contact.npcId))
      .filter((npc): npc is Npc => Boolean(npc))
      .filter((npc) => {
        const relationship = getNpcRelationship(social, npc.id);
        const npcCooldown = social.initiativeCooldowns[String(npc.id)] ?? 0;
        const hasPendingInvitation = social.invitations.some((entry) => entry.npcId === npc.id && entry.status === 'pending');
        return input.currentTotalMinutes >= npcCooldown
          && relationship.affinity >= 8
          && relationship.tension < 45
          && !hasPendingInvitation
          && !social.meetings.some((meeting) => meeting.npcId === npc.id && meeting.status === 'scheduled');
      });
    if (eligible.length > 0) {
      const index = hashString(`initiative:${input.currentTotalMinutes}:${contacts.length}`) % eligible.length;
      const npc = eligible[index];
      const relationship = getNpcRelationship(social, npc.id);
      const definition = chooseInitiativeMeetingType(npc, input.meetingTypes, relationship);
      const location = definition ? findMeetingLocation({ npc, definition, locations: input.locations }) : undefined;
      if (definition && location) {
        const startDay = Math.floor(input.currentTotalMinutes / MINUTES_IN_DAY) + 1;
        const startHour = definition.id.toString().includes('training') ? 19 : definition.id.toString().includes('study') ? 16 : 18;
        const startsAt = startDay * MINUTES_IN_DAY + startHour * 60 + (hashString(String(npc.id)) % 2) * 30;
        if (!getNpcScheduleConflict(npc, startsAt)) {
          const invitation: SocialInvitation = {
            id: invitationId(`social_incoming_${String(npc.id)}_${input.currentTotalMinutes}`),
            npcId: npc.id,
            meetingTypeId: definition.id,
            locationId: location.id,
            startsAtTotalMinutes: startsAt,
            createdAtTotalMinutes: input.currentTotalMinutes,
            responseAtTotalMinutes: startsAt - 60,
            direction: 'incoming',
            status: 'pending'
          };
          social = {
            ...social,
            invitations: [invitation, ...social.invitations].slice(0, 60),
            initiativeCooldowns: {
              ...social.initiativeCooldowns,
              __global: input.currentTotalMinutes + 18 * 60,
              [String(npc.id)]: input.currentTotalMinutes + 3 * MINUTES_IN_DAY
            }
          };
          phone = pushPhoneMessage(phone, {
            senderName: fullName(npc),
            subject: definition.shortTitle,
            body: `Есть предложение: ${definition.title.toLowerCase()}. ${formatDayTime(startsAt)}, ${location.name}.`,
            createdAtTotalMinutes: input.currentTotalMinutes,
            locationId: location.id,
            npcId: npc.id,
            socialInvitationId: invitation.id
          });
          phone = pushPhoneNotification(phone, {
            appId: 'contacts',
            title: 'Новое приглашение',
            body: `${fullName(npc)} · ${definition.shortTitle}`,
            createdAtTotalMinutes: input.currentTotalMinutes,
            locationId: location.id,
            npcId: npc.id,
            socialInvitationId: invitation.id
          });
        }
      }
    }
  }

  social = { ...social, lastProcessedTotalMinutes: input.currentTotalMinutes };
  return { social, phone, messages };
}

export function respondToSocialInvitation(input: {
  social: SocialState;
  phone: PhoneState;
  invitationId: SocialInvitationId;
  accept: boolean;
  currentTotalMinutes: number;
  npcs: Npc[];
  meetingTypes: SocialMeetingDefinition[];
}): { social: SocialState; phone: PhoneState; ok: boolean; message: string } {
  const invitation = input.social.invitations.find((entry) => entry.id === input.invitationId);
  if (!invitation || invitation.direction !== 'incoming' || invitation.status !== 'pending') {
    return { social: input.social, phone: input.phone, ok: false, message: 'Приглашение уже закрыто.' };
  }
  const npc = input.npcs.find((entry) => entry.id === invitation.npcId);
  const definition = input.meetingTypes.find((entry) => entry.id === invitation.meetingTypeId);
  if (!npc || !definition) return { social: input.social, phone: input.phone, ok: false, message: 'Данные встречи не найдены.' };
  if (input.currentTotalMinutes > invitation.startsAtTotalMinutes - 30) return { social: input.social, phone: input.phone, ok: false, message: 'Уже поздно отвечать.' };

  let social: SocialState = {
    ...input.social,
    invitations: input.social.invitations.map((entry) => entry.id === invitation.id
      ? { ...entry, status: input.accept ? 'accepted' as const : 'declined' as const, resolvedAtTotalMinutes: input.currentTotalMinutes }
      : entry)
  };
  let phone = input.phone;
  if (input.accept) {
    const meeting = createMeetingFromInvitation(invitation, definition);
    social = { ...social, meetings: [meeting, ...social.meetings].slice(0, 60) };
    social = updateRelationship(social, npc.id, { affinity: 2, trust: 1 });
    phone = addMeetingToPhone({ phone, meeting, npc, definition, createdAtTotalMinutes: input.currentTotalMinutes });
    phone = pushPhoneMessage(phone, {
      senderName: 'Ты',
      subject: 'Договорились',
      body: `Буду. ${formatDayTime(meeting.startsAtTotalMinutes)}.`,
      createdAtTotalMinutes: input.currentTotalMinutes,
      npcId: npc.id,
      locationId: meeting.locationId,
      socialInvitationId: invitation.id,
      socialMeetingId: meeting.id
    });
    return { social, phone, ok: true, message: `Встреча с ${fullName(npc)} добавлена в календарь.` };
  }

  social = updateRelationship(social, npc.id, { affinity: -2 });
  phone = pushPhoneMessage(phone, {
    senderName: 'Ты',
    subject: 'Не смогу',
    body: 'В этот раз не получится.',
    createdAtTotalMinutes: input.currentTotalMinutes,
    npcId: npc.id,
    socialInvitationId: invitation.id
  });
  return { social, phone, ok: true, message: 'Приглашение отклонено.' };
}

export function getSocialMeetingFailure(input: {
  meeting: SocialMeeting;
  currentLocationId?: LocationId;
  currentTotalMinutes: number;
  player: Player;
  definition?: SocialMeetingDefinition;
  npc?: Npc;
}): string | undefined {
  if (input.meeting.status !== 'scheduled') return 'Встреча уже закрыта.';
  if (input.currentLocationId !== input.meeting.locationId) return 'Нужно приехать в место встречи.';
  if (input.currentTotalMinutes < input.meeting.startsAtTotalMinutes - MEETING_EARLY_WINDOW) return `Встреча начнётся в ${formatClock(input.meeting.startsAtTotalMinutes)}.`;
  if (input.currentTotalMinutes > input.meeting.startsAtTotalMinutes + MEETING_LATE_WINDOW) return 'Ты опоздал на встречу.';
  if (!input.definition) return 'Тип встречи не найден.';
  if (input.npc) {
    const npcConflict = getNpcScheduleConflict(input.npc, input.meeting.startsAtTotalMinutes);
    if (npcConflict) return npcConflict;
  }
  if (input.player.money < input.definition.moneyCost) return `Нужно ${input.definition.moneyCost} ₽.`;
  return getNeedsRequirementFailure(input.player.needs, { minEnergy: 8, minHealth: 12, minHunger: 4, minThirst: 4 });
}

export function attendSocialMeeting(input: {
  player: Player;
  time: GameTime;
  social: SocialState;
  phone: PhoneState;
  meeting: SocialMeeting;
  npc: Npc;
  definition: SocialMeetingDefinition;
  currentLocationId?: LocationId;
  housingComfort?: number;
}): {
  player: Player;
  time: GameTime;
  social: SocialState;
  phone: PhoneState;
  ok: boolean;
  message: string;
  needsDelta?: Partial<import('../../types/needs').NeedsState>;
  moneyDelta?: number;
} {
  const now = getTotalMinutes(input.time);
  const failure = getSocialMeetingFailure({
    meeting: input.meeting,
    currentLocationId: input.currentLocationId,
    currentTotalMinutes: now,
    player: input.player,
    definition: input.definition,
    npc: input.npc
  });
  if (failure) return { player: input.player, time: input.time, social: input.social, phone: input.phone, ok: false, message: failure };

  const relationship = getNpcRelationship(input.social, input.npc.id);
  const sharedInterests = input.npc.personality.interests.length;
  const compatibility = clamp(Math.round((input.npc.personality.sociability + input.npc.personality.reliability) / 25 + sharedInterests), 0, 10);
  const comfortBonus = input.definition.locationTypes.includes('home') ? Math.floor((input.housingComfort ?? 0) / 20) : 0;
  const romanticBonus = input.definition.romantic ? Math.max(-4, Math.round((relationship.affinity + compatibility - 35) / 12)) : 0;
  const delta: RelationshipDelta = {
    ...input.definition.relationshipDelta,
    affinity: (input.definition.relationshipDelta.affinity ?? 0) + compatibility + comfortBonus,
    trust: (input.definition.relationshipDelta.trust ?? 0) + comfortBonus,
    romance: (input.definition.relationshipDelta.romance ?? 0) + romanticBonus
  };
  let social = updateRelationship(input.social, input.npc.id, delta, {
    key: `meeting_${input.meeting.id}`,
    text: `${input.definition.title}.`,
    tone: 'positive',
    day: input.time.day
  });
  social = {
    ...social,
    meetings: social.meetings.map((entry) => entry.id === input.meeting.id
      ? { ...entry, status: 'completed' as const, completedAtTotalMinutes: now }
      : entry)
  };
  const needsApplied = applyActivityNeedsDelta(input.player.needs, input.definition.needsDelta, { scaleEnergyCost: true });
  const player = {
    ...input.player,
    money: applyMoneyDelta(input.player.money, -input.definition.moneyCost),
    needs: needsApplied.needs
  };
  let phone: PhoneState = {
    ...input.phone,
    calendarEvents: input.phone.calendarEvents.map((event) => event.socialMeetingId === input.meeting.id
      ? { ...event, status: 'completed' as const }
      : event)
  };
  const nextRelationship = getNpcRelationship(social, input.npc.id);
  const romanceText = input.definition.romantic && nextRelationship.romanceStatus !== relationship.romanceStatus
    ? nextRelationship.romanceStatus === 'dating' ? ' Вы начали встречаться.'
      : nextRelationship.romanceStatus === 'partner' ? ' Отношения стали серьёзными.'
        : ' Между вами появилась симпатия.'
    : '';
  phone = pushPhoneMessage(phone, {
    senderName: fullName(input.npc),
    subject: 'Спасибо за встречу',
    body: `Хорошо провели время.${romanceText}`,
    createdAtTotalMinutes: now + input.definition.durationMinutes,
    npcId: input.npc.id,
    socialMeetingId: input.meeting.id
  });
  return {
    player,
    time: addMinutes(input.time, input.definition.durationMinutes),
    social,
    phone,
    ok: true,
    message: `${input.definition.title}: ${fullName(input.npc)}.${romanceText}`,
    needsDelta: needsApplied.delta,
    moneyDelta: -input.definition.moneyCost
  };
}

export function cancelSocialMeeting(input: {
  social: SocialState;
  phone: PhoneState;
  meetingId: SocialMeetingId;
  currentTotalMinutes: number;
  npcs: Npc[];
}): { social: SocialState; phone: PhoneState; ok: boolean; message: string } {
  const meeting = input.social.meetings.find((entry) => entry.id === input.meetingId);
  if (!meeting || meeting.status !== 'scheduled') return { social: input.social, phone: input.phone, ok: false, message: 'Встреча уже закрыта.' };
  const npc = input.npcs.find((entry) => entry.id === meeting.npcId);
  if (!npc) return { social: input.social, phone: input.phone, ok: false, message: 'Контакт не найден.' };
  const late = input.currentTotalMinutes > meeting.startsAtTotalMinutes - 180;
  let social: SocialState = {
    ...input.social,
    meetings: input.social.meetings.map((entry) => entry.id === meeting.id
      ? { ...entry, status: 'cancelled' as const, cancelledAtTotalMinutes: input.currentTotalMinutes }
      : entry)
  };
  social = updateRelationship(social, npc.id, late ? { affinity: -5, trust: -4, tension: 3 } : { affinity: -2, trust: -1 });
  let phone: PhoneState = {
    ...input.phone,
    calendarEvents: input.phone.calendarEvents.map((event) => event.socialMeetingId === meeting.id
      ? { ...event, status: 'missed' as const }
      : event)
  };
  phone = pushPhoneMessage(phone, {
    senderName: 'Ты',
    subject: 'Отмена встречи',
    body: late ? 'Извини, не смогу прийти. Понимаю, что поздно предупредил.' : 'Не получится встретиться. Предупреждаю заранее.',
    createdAtTotalMinutes: input.currentTotalMinutes,
    npcId: npc.id,
    socialMeetingId: meeting.id
  });
  return { social, phone, ok: true, message: late ? 'Поздняя отмена ухудшила отношения.' : 'Встреча отменена.' };
}

export function sendSocialQuickMessage(input: {
  social: SocialState;
  phone: PhoneState;
  npc: Npc;
  definition: SocialQuickMessageDefinition;
  time: GameTime;
}): { social: SocialState; phone: PhoneState; time: GameTime; ok: boolean; message: string } {
  const contact = input.social.contacts[String(input.npc.id)];
  if (!contact) return { social: input.social, phone: input.phone, time: input.time, ok: false, message: 'Контакт не сохранён.' };
  const relationship = getNpcRelationship(input.social, input.npc.id);
  if (relationship.familiarity < input.definition.minFamiliarity) return { social: input.social, phone: input.phone, time: input.time, ok: false, message: 'Вы ещё слишком мало знакомы.' };
  const now = getTotalMinutes(input.time);
  if (contact.lastMessageTotalMinutes !== undefined && now - contact.lastMessageTotalMinutes < input.definition.cooldownMinutes) {
    return { social: input.social, phone: input.phone, time: input.time, ok: false, message: 'Вы недавно уже переписывались.' };
  }
  let social: SocialState = {
    ...input.social,
    contacts: {
      ...input.social.contacts,
      [String(input.npc.id)]: { ...contact, lastMessageTotalMinutes: now }
    }
  };
  social = updateRelationship(social, input.npc.id, input.definition.relationshipDelta);
  let phone = pushPhoneMessage(input.phone, {
    senderName: 'Ты',
    subject: input.definition.label,
    body: input.definition.outgoingText,
    createdAtTotalMinutes: now,
    npcId: input.npc.id
  });
  phone = pushPhoneMessage(phone, {
    senderName: fullName(input.npc),
    subject: input.definition.label,
    body: input.definition.replyText,
    createdAtTotalMinutes: now + 3,
    npcId: input.npc.id
  });
  return {
    social,
    phone,
    time: addMinutes(input.time, 5),
    ok: true,
    message: `Переписка: ${fullName(input.npc)}.`
  };
}

export function getSocialQuickMessageFailure(input: {
  social: SocialState;
  npcId: NpcId;
  definition: SocialQuickMessageDefinition;
  currentTotalMinutes: number;
}): string | undefined {
  const contact = input.social.contacts[String(input.npcId)];
  if (!contact) return 'Контакт не сохранён.';
  const relationship = getNpcRelationship(input.social, input.npcId);
  if (relationship.familiarity < input.definition.minFamiliarity) return 'Нужно лучше познакомиться.';
  if (contact.lastMessageTotalMinutes !== undefined && input.currentTotalMinutes - contact.lastMessageTotalMinutes < input.definition.cooldownMinutes) return 'Вы недавно уже переписывались.';
  return undefined;
}

export function getDefaultMeetingStart(currentTotalMinutes: number, slot: 'today_evening' | 'tomorrow_day' | 'tomorrow_evening'): number {
  const currentDayIndex = Math.floor(currentTotalMinutes / MINUTES_IN_DAY);
  if (slot === 'today_evening') {
    const today = currentDayIndex * MINUTES_IN_DAY + 19 * 60;
    return today >= currentTotalMinutes + 120 ? today : (currentDayIndex + 1) * MINUTES_IN_DAY + 19 * 60;
  }
  if (slot === 'tomorrow_day') return (currentDayIndex + 1) * MINUTES_IN_DAY + 13 * 60;
  return (currentDayIndex + 1) * MINUTES_IN_DAY + 19 * 60;
}

