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

export default function CalendarApp(props: {
  state: PhonePanelState;
  onRoute: (locationId: LocationId) => void;
  onAttend: (jobId: JobId) => void;
  onAttendMedical: (serviceId: MedicalServiceId) => void;
  onBoardIntercity: (ticketId: IntercityTicketId) => void;
  onAttendUniversity: (programId: DegreeProgramId) => void;
  onAttendSocial: (meetingId: SocialMeetingId) => void;
}) {
  const events = [...props.state.phone.calendarEvents].sort((a, b) => a.startsAtTotalMinutes - b.startsAtTotalMinutes);
  return (
    <div className="phone-app-page phone-screen-enter">
      <div className="phone-app-banner phone-app-banner--calendar"><Icon name="calendar" size={25}/><div><strong>Календарь</strong><small>Встречи и приёмы</small></div></div>
      <div className="phone-calendar-list">
        {events.length ? events.map((event) => {
          const vacancy = event.jobId ? props.state.jobs.find((entry) => entry.job.id === event.jobId) : undefined;
          const medicalService = event.medicalServiceId
            ? props.state.health.services.find((entry) => entry.service.id === event.medicalServiceId)
            : undefined;
          const tripTicket = event.intercityTicketId
            ? props.state.intercity.tickets.find((entry) => entry.ticket.id === event.intercityTicketId)
            : undefined;
          const universityProgram = event.degreeProgramId ? props.state.university.programs.find((entry) => entry.program.id === event.degreeProgramId) : undefined;
          const socialMeeting = event.socialMeetingId ? props.state.social.meetings.find((entry) => entry.meeting.id === event.socialMeetingId) : undefined;
          const location = vacancy?.location ?? medicalService?.clinic ?? tripTicket?.originTerminal ?? socialMeeting?.location ?? (universityProgram?.university ? { name: universityProgram.university.shortName, address: universityProgram.university.address } : undefined);
          const failure = vacancy?.interviewFailure ?? medicalService?.attendFailure ?? tripTicket?.boardFailure ?? universityProgram?.examFailure ?? socialMeeting?.failure;
          return (
            <article className={`phone-calendar-event phone-calendar-event--${event.status}`} key={event.id}>
              <time><strong>{formatTotalMinutes(event.startsAtTotalMinutes).split(' · ')[0]}</strong><span>{formatTotalMinutes(event.startsAtTotalMinutes).split(' · ')[1]}</span></time>
              <div><em>{event.status === 'scheduled' ? 'Запланировано' : event.status === 'completed' ? 'Завершено' : 'Пропущено'}</em><h3>{event.title}</h3><p>{location?.name}<br/>{location?.address}</p>
                {event.status === 'scheduled' ? <div className="phone-inline-actions">
                  <button type="button" onClick={() => props.onRoute(event.locationId)}>Маршрут</button>
                  {event.type === 'job_interview' && event.jobId ? <button disabled={Boolean(failure)} type="button" onClick={() => props.onAttend(event.jobId!)}>Собеседование</button> : null}
                  {event.type === 'medical_appointment' && event.medicalServiceId ? <button disabled={Boolean(failure)} type="button" onClick={() => props.onAttendMedical(event.medicalServiceId!)}>Приём</button> : null}
                  {event.type === 'intercity_departure' && event.intercityTicketId ? <button disabled={Boolean(failure)} type="button" onClick={() => props.onBoardIntercity(event.intercityTicketId!)}>Посадка</button> : null}
                  {event.type === 'university_entrance_exam' && event.degreeProgramId ? <button disabled={Boolean(failure)} type="button" onClick={() => props.onAttendUniversity(event.degreeProgramId!)}>Испытание</button> : null}
                  {event.type === 'social_meeting' && event.socialMeetingId ? <button disabled={Boolean(failure)} type="button" onClick={() => props.onAttendSocial(event.socialMeetingId!)}>Встретиться</button> : null}
                </div> : null}
                {event.status === 'scheduled' && failure ? <small>{failure}</small> : null}
              </div>
            </article>
          );
        }) : <div className="phone-empty-state">Календарь свободен</div>}
      </div>
    </div>
  );
}

