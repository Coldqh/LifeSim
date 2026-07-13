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

export default function MapsApp(props: {
  state: PhonePanelState;
  currentLocation?: Location;
  onClear: () => void;
  onMove: (locationId: LocationId, modeId: TravelModeId) => void;
  onMoveDistrict: (districtId: DistrictId, modeId: TravelModeId) => void;
}) {
  const [selectedDistrictId, setSelectedDistrictId] = useState<DistrictId>();
  const target = props.state.mapTarget;
  const route = props.state.mapRoute;
  const districtRoute = props.state.districtTravelOptions.find((entry) => entry.district.id === selectedDistrictId);
  const currentDistrictSlug = String(props.currentLocation?.districtId ?? '').replace('msk_', '').replace('yar_', '');
  const isYaroslavl = String(props.currentLocation?.cityId ?? '') === 'yaroslavl';
  const cityName = isYaroslavl ? 'Ярославль' : 'Москва';
  const selectedTitle = target?.name ?? districtRoute?.district.name ?? cityName;
  const selectedAddress = target?.address ?? (districtRoute ? `Переезд в район: ${districtRoute.district.name}` : `Сейчас: ${props.currentLocation?.name ?? cityName}`);

  function selectDistrict(id: DistrictId): void {
    setSelectedDistrictId(id);
    props.onClear();
  }

  return (
    <div className="phone-app-page phone-screen-enter phone-maps-app">
      {isYaroslavl ? (
        <div className="yaroslavl-map" role="img" aria-label="Карта Ярославля с районами">
          <svg viewBox="0 0 420 360" aria-hidden="true">
            <defs><linearGradient id="yarMapBg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#253f4d"/><stop offset="1" stopColor="#0b1821"/></linearGradient></defs>
            <path className="yaroslavl-map__outline" d="M55 42C127 10 284 15 354 67c54 40 61 140 22 207-40 68-168 83-255 58C41 309 11 227 28 139 37 94 49 58 55 42Z" fill="url(#yarMapBg)"/>
            <path className="yaroslavl-map__river" d="M18 98c75 29 107 52 139 98 30 44 74 82 127 91 48 8 88-4 132-32"/>
            <g className="yaroslavl-map__districts">
              <path className={`${selectedDistrictId === ('yar_kirovsky' as DistrictId) ? 'is-selected ' : ''}${currentDistrictSlug === 'kirovsky' ? 'is-current' : ''}`} d="M116 52 248 48 285 130 230 190 137 164 82 105Z" onClick={() => selectDistrict('yar_kirovsky' as DistrictId)}/>
              <path className={`${selectedDistrictId === ('yar_leninsky' as DistrictId) ? 'is-selected ' : ''}${currentDistrictSlug === 'leninsky' ? 'is-current' : ''}`} d="M68 112 137 164 230 190 202 300 94 313 38 230Z" onClick={() => selectDistrict('yar_leninsky' as DistrictId)}/>
              <path className={`${selectedDistrictId === ('yar_frunzensky' as DistrictId) ? 'is-selected ' : ''}${currentDistrictSlug === 'frunzensky' ? 'is-current' : ''}`} d="M285 130 374 98 397 225 326 314 202 300 230 190Z" onClick={() => selectDistrict('yar_frunzensky' as DistrictId)}/>
            </g>
            <text x="137" y="108">Кировский</text><text x="86" y="245">Ленинский</text><text x="280" y="232">Фрунзенский</text>
          </svg>
          <span className="yaroslavl-map__caption">Схема районов Ярославля</span>
        </div>
      ) : (
        <div className="moscow-map" role="img" aria-label="Карта Москвы с районами">
          <svg viewBox="0 0 420 360" aria-hidden="true">
            <defs>
              <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#1a3441"/><stop offset="1" stopColor="#0a1720"/></linearGradient>
              <filter id="mapGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <path className="moscow-map__mkad" d="M57 62C111 8 302 7 365 69c51 51 48 171 3 225-54 65-232 72-306 9C4 253 8 111 57 62Z" fill="url(#mapBg)"/>
            <path className="moscow-map__river" d="M4 202c64-30 90-5 128-20 41-17 54-70 102-69 39 1 53 39 91 45 37 6 64-15 95-44"/>
            <path className="moscow-map__road" d="M80 80 340 287M342 75 82 292M205 28v310M40 178h345"/>
            <circle className="moscow-map__ring" cx="212" cy="176" r="82"/>
            <g className="moscow-map__districts">
              <path data-id="msk_presnya" d="M104 94 188 78 201 142 165 184 94 159Z"/>
              <path data-id="msk_tverskoy" d="M190 70 264 83 280 147 218 166 201 142Z"/>
              <path data-id="msk_khamovniki" d="M109 171 166 184 216 168 224 236 151 260 92 225Z"/>
              <path data-id="msk_danilovsky" d="M218 168 282 151 321 213 284 276 224 236Z"/>
            </g>
            <text x="119" y="125">Пресня</text><text x="218" y="113">Тверской</text><text x="119" y="221">Хамовники</text><text x="248" y="222">Даниловский</text>
          </svg>
          <div className="moscow-map__hitboxes">
            {props.state.districtTravelOptions.map((option) => {
              const slug = String(option.district.id).replace('msk_', '');
              return <button className={`map-hitbox map-hitbox--${slug} ${selectedDistrictId === option.district.id ? 'is-active' : ''}`} key={option.district.id} type="button" aria-label={option.district.name} onClick={() => selectDistrict(option.district.id)}/>;
            })}
          </div>
          <span className={`moscow-map__current moscow-map__current--${currentDistrictSlug}`}><i/>Ты здесь</span>
        </div>
      )}
      <section className="phone-map-sheet">
        <span className="phone-kicker">Маршрут</span>
        <h2>{selectedTitle}</h2>
        <p>{selectedAddress}</p>
        {route?.transportOptions.length ? (
          <div className="phone-route-options">
            {route.transportOptions.map((option) => (
              <button disabled={!option.available} key={option.modeId} type="button" onClick={() => target && props.onMove(target.id, option.modeId)}>
                <Icon name={option.modeId} size={19}/><div><strong>{option.name}</strong><span>{option.durationMinutes} мин · {option.moneyCost ? formatRubles(option.moneyCost) : 'Бесплатно'}</span></div>
              </button>
            ))}
          </div>
        ) : districtRoute ? (
          <div className="phone-route-options">
            {districtRoute.transportOptions.map((option) => (
              <button disabled={!option.available || districtRoute.isCurrent} key={option.modeId} type="button" onClick={() => props.onMoveDistrict(districtRoute.district.id, option.modeId)}>
                <Icon name={option.modeId} size={19}/><div><strong>{option.name}</strong><span>{districtRoute.isCurrent ? 'Ты уже в этом районе' : `${option.durationMinutes} мин · ${option.moneyCost ? formatRubles(option.moneyCost) : 'Бесплатно'}`}</span></div>
              </button>
            ))}
          </div>
        ) : <p className="phone-muted">Нажми на цветной район или открой маршрут из вакансии.</p>}
        {target || selectedDistrictId ? <button className="phone-text-button" type="button" onClick={() => { props.onClear(); setSelectedDistrictId(undefined); }}>Сбросить маршрут</button> : null}
      </section>
    </div>
  );
}

