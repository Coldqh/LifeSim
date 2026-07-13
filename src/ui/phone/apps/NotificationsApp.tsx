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
import { VEHICLE_DEFECT_LABELS } from '../../../core/vehicles';
import { formatGameTime } from '../../../core/time';
import { getRelationshipStatusLabel } from '../../../core/relationships';
import { Icon } from '../../icons';
import type { PhonePanelState } from '../phoneTypes';
import { APPLICATION_LABELS, formatRubles, formatTotalMinutes, getApplicationTone } from '../phoneShared';

export default function NotificationsApp({ state, onRead }: { state: PhonePanelState; onRead: (id: PhoneNotificationId) => void }) {
  return (
    <div className="phone-app-page phone-screen-enter">
      <div className="phone-app-banner phone-app-banner--notifications"><Icon name="bell" size={25}/><div><strong>Уведомления</strong><small>{state.unreadNotifications} новых</small></div></div>
      <div className="phone-notification-list">
        {state.phone.notifications.length ? state.phone.notifications.map((notification) => (
          <button className={`phone-notification-row ${notification.read ? '' : 'is-unread'}`} key={notification.id} type="button" onClick={() => onRead(notification.id)}>
            <span><Icon name={notification.appId === 'jobs' ? 'briefcase' : notification.appId === 'calendar' ? 'calendar' : notification.appId === 'health' ? 'heart' : notification.appId === 'trips' ? 'bus' : notification.appId === 'education' ? 'book' : notification.appId === 'clock' ? 'clock' : notification.appId === 'contacts' ? 'users' : 'bell'} size={18}/></span>
            <div><strong>{notification.title}</strong><p>{notification.body}</p><small>{formatTotalMinutes(notification.createdAtTotalMinutes)}</small></div>
          </button>
        )) : <div className="phone-empty-state">Уведомлений нет</div>}
      </div>
    </div>
  );
}

