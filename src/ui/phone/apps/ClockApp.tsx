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

export default function ClockApp({ onSkip }: { onSkip: (minutes: number) => void }) {
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const total = Math.max(0, hours) * 60 + Math.max(0, minutes);
  return (
    <div className="phone-app-page phone-screen-enter">
      <div className="phone-app-banner phone-app-banner--clock"><Icon name="clock" size={26}/><div><strong>Время</strong><small>Ожидание и свободное время</small></div></div>
      <section className="phone-time-card">
        <span>Перемотать</span>
        <div className="phone-time-inputs">
          <label><input type="number" min="0" max="24" value={hours} onChange={(event) => setHours(Math.max(0, Math.min(24, Number(event.target.value))))}/><small>часов</small></label>
          <label><input type="number" min="0" max="59" value={minutes} onChange={(event) => setMinutes(Math.max(0, Math.min(59, Number(event.target.value))))}/><small>минут</small></label>
        </div>
        <div className="phone-time-presets">
          {[30, 60, 180, 360].map((value) => <button key={value} type="button" onClick={() => onSkip(value)}>{value < 60 ? `${value} мин` : `${value / 60} ч`}</button>)}
        </div>
        <button className="phone-primary-action" disabled={total < 1 || total > 1440} type="button" onClick={() => onSkip(total)}>Подождать</button>
        <p className="phone-muted">Потребности, расписания, NPC, бизнес, здоровье и учёба продолжают обновляться.</p>
      </section>
    </div>
  );
}

