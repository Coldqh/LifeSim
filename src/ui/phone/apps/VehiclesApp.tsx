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

export default function VehiclesApp(props: {
  state: PhonePanelState;
  onRoute: (locationId: LocationId) => void;
  onScheduleInspection: (listingId: VehicleListingId) => void;
  onInspect: (listingId: VehicleListingId) => void;
  onBuyUsed: (listingId: VehicleListingId) => void;
  onBuyNew: (modelId: VehicleModelId) => void;
  onRefuel: (liters: number) => void;
  onService: () => void;
  onSell: () => void;
}) {
  const [tab, setTab] = useState<'used' | 'new' | 'mine'>('used');
  const [selectedListingId, setSelectedListingId] = useState<VehicleListingId>();
  const selected = props.state.vehicles.listings.find((entry) => entry.listing.id === selectedListingId);
  const vehicle = props.state.vehicles.ownedVehicle;
  const ownedModel = props.state.vehicles.ownedModel;

  if (selected) {
    return (
      <div className="phone-app-page phone-screen-enter vehicle-app-page">
        <button className="phone-text-button" type="button" onClick={() => setSelectedListingId(undefined)}>← Все объявления</button>
        <section className="vehicle-detail-card">
          <div className="vehicle-detail-card__hero">
            <span className="vehicle-brand-mark">{selected.model.brand.slice(0, 1)}</span>
            <div><span>{selected.listing.year} · {selected.model.bodyType}</span><h2>{selected.model.brand} {selected.model.model}</h2><strong>{formatRubles(selected.listing.price)}</strong></div>
          </div>
          <div className="vehicle-metric-grid">
            <div><span>Пробег</span><strong>{new Intl.NumberFormat('ru-RU').format(selected.listing.mileageKm)} км</strong></div>
            <div><span>Состояние</span><strong>{selected.listing.conditionPercent}%</strong></div>
            <div><span>Мощность</span><strong>{selected.model.powerHp} л.с.</strong></div>
            <div><span>Расход</span><strong>{selected.model.consumptionLitersPer100Km} л/100 км</strong></div>
          </div>
          <div className="phone-address-block"><Icon name="pin" size={18}/><div><strong>{selected.listing.sellerName}</strong><span>{selected.listing.sellerLocationId === props.state.vehicles.currentLocation?.id ? 'Ты уже на месте' : 'Нужно приехать на осмотр'}</span></div></div>
        </section>
        <section className="phone-subsection">
          <div className="phone-section-title"><span>Диагностика</span><em>{selected.inspected ? 'Проверено' : 'Не проверено'}</em></div>
          {selected.inspected ? (
            selected.revealedDefects.length ? <div className="vehicle-defect-list">{selected.revealedDefects.map((defect) => <div key={defect}><Icon name="wrench" size={16}/><span>{VEHICLE_DEFECT_LABELS[defect]}</span></div>)}</div> : <p className="phone-muted">Серьёзных проблем не обнаружено.</p>
          ) : <p className="phone-muted">Скрытые дефекты станут известны после личного осмотра.</p>}
        </section>
        <div className="phone-sticky-actions vehicle-sticky-actions">
          <button className="phone-secondary-action" type="button" onClick={() => props.onRoute(selected.listing.sellerLocationId)}><Icon name="pin" size={17}/>Маршрут</button>
          {!selected.inspected ? <button className="phone-secondary-action" type="button" onClick={() => props.onScheduleInspection(selected.listing.id)}>{selected.scheduled ? 'Осмотр назначен' : 'Назначить осмотр'}</button> : null}
          {!selected.inspected ? <button className="phone-primary-action" type="button" disabled={!selected.isAtSeller} onClick={() => props.onInspect(selected.listing.id)}>Осмотреть</button> : <button className="phone-primary-action" type="button" disabled={!selected.isAtSeller || Boolean(vehicle)} onClick={() => props.onBuyUsed(selected.listing.id)}>Купить</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="phone-app-page phone-screen-enter vehicle-app-page">
      <div className="phone-app-banner phone-app-banner--auto"><Icon name="car" size={27}/><div><strong>Авто</strong><small>Объявления, дилеры и твоя машина</small></div></div>
      <div className="phone-filter-row vehicle-filter-row">
        <button className={tab === 'used' ? 'active' : ''} type="button" onClick={() => setTab('used')}>С пробегом</button>
        <button className={tab === 'new' ? 'active' : ''} type="button" onClick={() => setTab('new')}>Новые</button>
        <button className={tab === 'mine' ? 'active' : ''} type="button" onClick={() => setTab('mine')}>Моя машина</button>
      </div>

      {tab === 'used' ? (
        <div className="vehicle-list">
          <div className="vehicle-market-brand"><b>Авто.ру</b><span>{props.state.vehicles.listings.length} объявлений</span></div>
          {props.state.vehicles.listings.map((entry) => (
            <button className="vehicle-listing-card" key={entry.listing.id} type="button" onClick={() => setSelectedListingId(entry.listing.id)}>
              <span className="vehicle-listing-card__badge">{entry.model.tier}</span>
              <div className="vehicle-listing-card__mark">{entry.model.brand.slice(0, 1)}</div>
              <div><strong>{entry.model.brand} {entry.model.model}</strong><b>{formatRubles(entry.listing.price)}</b><small>{entry.listing.year} · {new Intl.NumberFormat('ru-RU').format(entry.listing.mileageKm)} км · {entry.listing.conditionPercent}%</small></div>
              {entry.inspected ? <em>Проверено</em> : null}
            </button>
          ))}
        </div>
      ) : null}

      {tab === 'new' ? (
        <div className="vehicle-list">
          <div className="vehicle-market-brand"><b>Дилерские центры</b><span>Новые автомобили</span></div>
          {props.state.vehicles.dealerModels.map((entry) => (
            <article className="vehicle-dealer-card" key={entry.model.id}>
              <div className="vehicle-dealer-card__top"><span className="vehicle-listing-card__mark">{entry.model.brand.slice(0, 1)}</span><div><span>{entry.model.tier}</span><h3>{entry.model.brand} {entry.model.model}</h3></div></div>
              <strong>{formatRubles(entry.model.newPrice)}</strong>
              <div className="vehicle-dealer-specs"><span>{entry.model.powerHp} л.с.</span><span>{entry.model.consumptionLitersPer100Km} л/100 км</span><span>ТО {formatRubles(entry.model.baseServiceCost)}</span></div>
              <small>{entry.dealerLocation?.name}<br/>{entry.dealerLocation?.address}</small>
              <div className="phone-inline-actions"><button type="button" onClick={() => props.onRoute(entry.dealerLocationId)}>Маршрут</button><button type="button" disabled={!entry.isAtDealer || !entry.canAfford || Boolean(vehicle)} onClick={() => props.onBuyNew(entry.model.id)}>Купить в салоне</button></div>
            </article>
          ))}
        </div>
      ) : null}

      {tab === 'mine' ? (
        vehicle && ownedModel ? (
          <div className="owned-vehicle-panel">
            <section className="owned-vehicle-hero">
              <span>{vehicle.year}</span><h2>{ownedModel.brand} {ownedModel.model}</h2><p>{vehicle.source === 'dealer' ? 'Куплен новым' : 'Куплен с пробегом'}</p>
            </section>
            <div className="vehicle-metric-grid">
              <div><span>Топливо</span><strong>{vehicle.fuelLiters.toFixed(1)} / {ownedModel.fuelTankLiters} л</strong></div>
              <div><span>Пробег</span><strong>{Math.round(vehicle.odometerKm).toLocaleString('ru-RU')} км</strong></div>
              <div><span>Состояние</span><strong>{vehicle.conditionPercent}%</strong></div>
              <div><span>Надёжность</span><strong>{vehicle.reliabilityPercent}%</strong></div>
            </div>
            <section className="phone-subsection">
              <div className="phone-section-title"><span>Где машина</span><em>{props.state.vehicles.parkedLocation?.name ?? 'Неизвестно'}</em></div>
              <p className="phone-muted">Следующее ТО: {Math.max(0, Math.round(vehicle.nextServiceOdometerKm - vehicle.odometerKm)).toLocaleString('ru-RU')} км.</p>
              {vehicle.knownDefectIds.length ? <div className="vehicle-defect-list">{vehicle.knownDefectIds.map((defect) => <div key={defect}><Icon name="wrench" size={16}/><span>{VEHICLE_DEFECT_LABELS[defect]}</span></div>)}</div> : null}
            </section>
            <div className="vehicle-owner-actions">
              {props.state.vehicles.parkedLocation && props.state.vehicles.parkedLocation.id !== props.state.vehicles.currentLocation?.id ? <button type="button" onClick={() => props.onRoute(props.state.vehicles.parkedLocation!.id)}><Icon name="pin" size={17}/>Добраться до машины</button> : null}
              <button type="button" disabled={!props.state.vehicles.atGasStation || vehicle.parkedLocationId !== props.state.vehicles.currentLocation?.id} onClick={() => props.onRefuel(10)}><Icon name="fuel" size={17}/>Заправить 10 л</button>
              <button type="button" disabled={!props.state.vehicles.atGasStation || vehicle.parkedLocationId !== props.state.vehicles.currentLocation?.id} onClick={() => props.onRefuel(0)}><Icon name="fuel" size={17}/>Полный бак</button>
              <button type="button" disabled={!props.state.vehicles.atService || vehicle.parkedLocationId !== props.state.vehicles.currentLocation?.id} onClick={props.onService}><Icon name="wrench" size={17}/>Пройти ТО</button>
              <button className="vehicle-sell-button" type="button" onClick={props.onSell}>Продать через Авто.ру</button>
            </div>
          </div>
        ) : <div className="phone-empty-state vehicle-empty-state"><Icon name="car" size={34}/><strong>Машины пока нет</strong><span>Выбери подержанный автомобиль или приезжай в дилерский центр.</span></div>
      ) : null}
    </div>
  );
}

