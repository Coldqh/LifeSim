import { useMemo, useState } from 'react';
import type { Job } from '../../../types/job';
import type { City, District, Location } from '../../../types/location';
import type {
  CityId,
  DistrictId,
  JobId,
  LocationId,
  MedicalServiceId,
  PhoneMessageId,
  PhoneNotificationId,
  VehicleListingId,
  VehicleModelId,
  IntercityRouteId,
  IntercityTicketId,
  TemporaryAccommodationId,
  DegreeProgramId,
  UniversitySubjectId,
  NpcId,
  SocialInvitationId,
  SocialMeetingId,
  SocialMeetingTypeId
} from '../../../types/ids';
import type { PhoneAppId, PhoneJobApplication, PhoneMessage, PhoneState } from '../../../types/phone';
import type { GameTime } from '../../../types/time';
import type { DistrictTravelOption, LocationTravelOption } from '../../../types/travel';
import type { PersonalFinanceState, UpcomingPayment } from '../../../types/finance';
import type { TravelModeId } from '../../../types/transport';
import type { VehicleListingView, VehicleModel, VehicleWorldState } from '../../../types/vehicle';
import type { ActiveMedicalCondition, MedicalAppointment, MedicalConditionDefinition, MedicalPrescription, MedicalService, MedicalState, SickLeave } from '../../../types/healthcare';
import type { Product } from '../../../types/product';
import type { IntercityCarQuote, IntercityDeparture, IntercityRoadConnection, IntercityRoute, IntercityTicket, IntercityTravelState, TemporaryAccommodation, TemporaryStay } from '../../../types/intercity';
import type { ScheduleStatus } from '../../../types/schedule';
import type { DegreeProgramDefinition, UniversityApplication, UniversityAssignment, UniversityClassView, UniversityDefinition, UniversityEnrollment, UniversityState } from '../../../types/university';
import type { Npc, NpcRoleDefinition } from '../../../types/npc';
import type { NpcRelationship, RelationshipStatus } from '../../../types/relationship';
import type { SocialContact, SocialCircleTag, SocialInvitation, SocialMeeting, SocialMeetingDefinition, SocialMeetingSlot, SocialMessageActionId, SocialQuickMessageDefinition } from '../../../types/socialLife';
import type { SocialGroupAcceptance } from '../../../types/socialGroup';
import { VEHICLE_DEFECT_LABELS } from '../../../core/vehicles';
import { formatGameTime } from '../../../core/time';
import { getRelationshipStatusLabel } from '../../../core/relationships';
import { Icon } from '../../icons';
import type { PhonePanelState } from '../phoneTypes';
import { APPLICATION_LABELS, formatRubles, formatTotalMinutes, getApplicationTone } from '../phoneShared';

const SOCIAL_CIRCLE_LABELS: Record<SocialCircleTag, string> = {
  work: 'Работа',
  university: 'Учёба',
  boxing: 'Бокс',
  neighborhood: 'Район',
  business: 'Бизнес',
  friends: 'Друзья'
};


const SOCIAL_GROUP_ACCEPTANCE_LABELS: Record<SocialGroupAcceptance, string> = {
  outsider: 'Чужой',
  tolerated: 'Терпят',
  accepted: 'Приняли',
  trusted: 'Доверяют',
  core: 'Свой человек'
};

const ROMANCE_LABELS: Record<NpcRelationship['romanceStatus'], string> = {
  none: 'Нет романтической линии',
  interest: 'Есть взаимная симпатия',
  dating: 'Вы встречаетесь',
  partner: 'Пара'
};


export default function ContactsApp(props: {
  state: PhonePanelState;
  onRoute: (locationId: LocationId) => void;
  onSendMessage: (npcId: NpcId, actionId: SocialMessageActionId) => void;
  onInvite: (npcId: NpcId, meetingTypeId: SocialMeetingTypeId, locationId: LocationId, slot: SocialMeetingSlot) => void;
  onRespond: (invitationId: SocialInvitationId, accept: boolean) => void;
  onAttend: (meetingId: SocialMeetingId) => void;
  onCancel: (meetingId: SocialMeetingId) => void;
}) {
  const [selectedNpcId, setSelectedNpcId] = useState<NpcId>();
  const [filter, setFilter] = useState<'all' | SocialCircleTag>('all');
  const [meetingTypeId, setMeetingTypeId] = useState<SocialMeetingTypeId>();
  const [meetingLocationId, setMeetingLocationId] = useState<LocationId>();
  const [slot, setSlot] = useState<SocialMeetingSlot>('tomorrow_evening');
  const selected = props.state.social.contacts.find((entry) => entry.npc.id === selectedNpcId);
  const filtered = props.state.social.contacts.filter((entry) => filter === 'all' || entry.circles.includes(filter));
  const selectedMeetingOption = props.state.social.meetingOptions.find((entry) => entry.definition.id === meetingTypeId)
    ?? props.state.social.meetingOptions[0];
  const selectedMeetingLocation = selectedMeetingOption?.locations.find((entry) => entry.id === meetingLocationId)
    ?? selectedMeetingOption?.locations[0];

  if (selected) {
    const fullName = `${selected.npc.firstName} ${selected.npc.lastName}`;
    return (
      <div className="phone-app-page phone-screen-enter phone-contacts-app">
        <button className="phone-text-button" type="button" onClick={() => setSelectedNpcId(undefined)}>← Все контакты</button>
        <section className="phone-contact-profile">
          <span className="phone-contact-profile__avatar">{selected.npc.firstName[0]}{selected.npc.lastName[0]}</span>
          <div>
            <span className="phone-kicker">{selected.role?.name ?? 'Житель города'}</span>
            <h2>{fullName}</h2>
            <p>{selected.npc.age} лет · {getRelationshipStatusLabel(selected.status)}</p>
            <p>{selected.activityLabel}{selected.activityLocation ? ` · ${selected.activityLocation.name}` : ''} · {selected.availableNow ? 'свободен' : 'занят'}</p>
          </div>
        </section>

        <div className="phone-contact-metrics">
          <div><span>Отношение</span><strong>{selected.relationship.affinity}</strong></div>
          <div><span>Доверие</span><strong>{selected.relationship.trust}</strong></div>
          <div><span>Симпатия</span><strong>{selected.relationship.romance}</strong></div>
        </div>
        <div className="phone-contact-romance"><Icon name="heart" size={16}/><span>{ROMANCE_LABELS[selected.relationship.romanceStatus]}</span></div>
        <div className="phone-contact-circles">{selected.circles.length ? selected.circles.map((circle) => <span key={circle}>{SOCIAL_CIRCLE_LABELS[circle]}</span>) : <span>Личный контакт</span>}</div>

        {selected.scheduledMeeting ? (
          <section className="phone-social-active-card">
            <span>Запланирована встреча</span>
            <strong>{formatTotalMinutes(selected.scheduledMeeting.startsAtTotalMinutes)}</strong>
            <div className="phone-inline-actions">
              <button type="button" onClick={() => props.onRoute(selected.scheduledMeeting!.locationId)}>Маршрут</button>
              <button type="button" onClick={() => props.onAttend(selected.scheduledMeeting!.id)}>Встретиться</button>
              <button type="button" onClick={() => props.onCancel(selected.scheduledMeeting!.id)}>Отменить</button>
            </div>
          </section>
        ) : null}

        <section className="phone-subsection">
          <div className="phone-section-title"><span>Написать</span><em>5 минут</em></div>
          <div className="phone-social-quick-grid">
            {selected.quickMessages.map(({ definition, failure }) => (
              <button disabled={Boolean(failure)} title={failure} key={definition.id} type="button" onClick={() => props.onSendMessage(selected.npc.id, definition.id)}>
                <Icon name="message" size={16}/><span>{definition.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="phone-subsection">
          <div className="phone-section-title"><span>Предложить встречу</span><em>{selected.pendingInvitation ? 'Ответ ожидается' : 'Планировщик'}</em></div>
          <label className="phone-field-label">Формат
            <select value={String(selectedMeetingOption?.definition.id ?? '')} onChange={(event) => { const value = event.target.value as SocialMeetingTypeId; setMeetingTypeId(value); setMeetingLocationId(undefined); }}>
              {props.state.social.meetingOptions.map((entry) => <option key={entry.definition.id} value={entry.definition.id}>{entry.definition.shortTitle} · {formatRubles(entry.definition.moneyCost)}</option>)}
            </select>
          </label>
          <label className="phone-field-label">Место
            <select value={String(selectedMeetingLocation?.id ?? '')} onChange={(event) => setMeetingLocationId(event.target.value as LocationId)}>
              {(selectedMeetingOption?.locations ?? []).map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
          <label className="phone-field-label">Когда
            <select value={slot} onChange={(event) => setSlot(event.target.value as SocialMeetingSlot)}>
              <option value="today_evening">Ближайший вечер</option>
              <option value="tomorrow_day">Завтра днём</option>
              <option value="tomorrow_evening">Завтра вечером</option>
            </select>
          </label>
          <button className="phone-primary-action" type="button" disabled={Boolean(selected.pendingInvitation || selected.scheduledMeeting || !selectedMeetingOption || !selectedMeetingLocation)} onClick={() => {
            if (selectedMeetingOption && selectedMeetingLocation) props.onInvite(selected.npc.id, selectedMeetingOption.definition.id, selectedMeetingLocation.id, slot);
          }}>Отправить приглашение</button>
          {selectedMeetingOption ? <p className="phone-muted">{selectedMeetingOption.definition.description} · {selectedMeetingOption.definition.durationMinutes} мин</p> : null}
        </section>

        <section className="phone-subsection">
          <div className="phone-section-title"><span>Переписка</span><em>{selected.messages.length}</em></div>
          <div className="phone-contact-chat">
            {selected.messages.length ? [...selected.messages].reverse().map((message) => (
              <div className={message.senderName === 'Ты' ? 'is-outgoing' : ''} key={message.id}>
                <strong>{message.senderName}</strong><p>{message.body}</p><small>{formatTotalMinutes(message.createdAtTotalMinutes)}</small>
              </div>
            )) : <p className="phone-muted">Переписка ещё не началась.</p>}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="phone-app-page phone-screen-enter phone-contacts-app">
      <div className="phone-app-banner phone-app-banner--contacts"><Icon name="users" size={25}/><div><strong>Контакты</strong><small>{props.state.social.contacts.length} человек</small></div></div>

      <section className="phone-subsection phone-social-groups">
        <div className="phone-section-title"><span>Мои круги</span><em>{props.state.social.groups.filter((group) => group.active).length}</em></div>
        <div className="phone-social-group-grid">
          {props.state.social.groups.filter((group) => group.active).map((group) => (
            <article key={group.definition.id}>
              <div className="phone-social-group-card__top">
                <span>{group.definition.shortTitle}</span>
                <strong>{group.reputation}</strong>
              </div>
              <div className="phone-social-group-card__track"><i style={{ width: `${group.reputation}%` }}/></div>
              <p>{SOCIAL_GROUP_ACCEPTANCE_LABELS[group.acceptance]} · знакомы {group.knownMemberCount}/{group.members.length}</p>
              <small>{group.definition.description}</small>
            </article>
          ))}
          {!props.state.social.groups.some((group) => group.active) ? <div className="phone-empty-state">Поступи, устройся на работу или запишись в зал, чтобы войти в социальный круг.</div> : null}
        </div>
      </section>

      {props.state.social.invitations.length ? (
        <section className="phone-subsection phone-social-invitations">
          <div className="phone-section-title"><span>Приглашения</span><em>{props.state.social.invitations.length}</em></div>
          {props.state.social.invitations.map(({ invitation, npc, definition, location }) => (
            <article key={invitation.id}>
              <span>{definition?.shortTitle ?? 'Встреча'}</span>
              <strong>{npc ? `${npc.firstName} ${npc.lastName}` : 'Контакт'}</strong>
              <p>{formatTotalMinutes(invitation.startsAtTotalMinutes)} · {location?.name}</p>
              <div className="phone-inline-actions"><button type="button" onClick={() => props.onRespond(invitation.id, true)}>Принять</button><button type="button" onClick={() => props.onRespond(invitation.id, false)}>Отказаться</button></div>
            </article>
          ))}
        </section>
      ) : null}

      {props.state.social.meetings.length ? (
        <section className="phone-subsection phone-social-schedule">
          <div className="phone-section-title"><span>Ближайшие встречи</span><em>{props.state.social.meetings.length}</em></div>
          {props.state.social.meetings.map(({ meeting, npc, definition, location, failure }) => (
            <article key={meeting.id}>
              <span>{formatTotalMinutes(meeting.startsAtTotalMinutes)}</span>
              <strong>{definition?.shortTitle} · {npc?.firstName}</strong>
              <p>{location?.name}</p>
              <div className="phone-inline-actions">
                <button type="button" onClick={() => props.onRoute(meeting.locationId)}>Маршрут</button>
                <button type="button" disabled={Boolean(failure)} title={failure} onClick={() => props.onAttend(meeting.id)}>Встретиться</button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <div className="phone-filter-row phone-contact-filters">
        {(['all', 'friends', 'work', 'university', 'boxing', 'neighborhood'] as Array<'all' | SocialCircleTag>).map((entry) => (
          <button className={filter === entry ? 'active' : ''} key={entry} type="button" onClick={() => setFilter(entry)}>{entry === 'all' ? 'Все' : SOCIAL_CIRCLE_LABELS[entry]}</button>
        ))}
      </div>
      <div className="phone-contact-list">
        {filtered.length ? filtered.map((contact) => (
          <button type="button" key={contact.npc.id} onClick={() => setSelectedNpcId(contact.npc.id)}>
            <span className="phone-message-avatar">{contact.npc.firstName[0]}{contact.npc.lastName[0]}</span>
            <div><strong>{contact.npc.firstName} {contact.npc.lastName}</strong><small>{contact.role?.name ?? 'Житель города'} · {getRelationshipStatusLabel(contact.status)}</small><p>{contact.activityLabel}{contact.activityLocation ? ` · ${contact.activityLocation.name}` : ''}</p></div>
            {contact.relationship.romanceStatus !== 'none' ? <Icon name="heart" size={16}/> : null}
          </button>
        )) : <div className="phone-empty-state">Контактов в этой категории нет</div>}
      </div>
    </div>
  );
}

