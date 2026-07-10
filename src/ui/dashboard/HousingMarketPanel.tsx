import { useMemo, useState } from 'react';
import { formatRubles } from '../../core/economy';
import type { DistrictId, LocationId } from '../../types/ids';
import type {
  Housing,
  HousingAffordability,
  HousingId,
  HousingKind,
  HousingMarketState,
  RentalContract
} from '../../types/housing';
import type { District, Location } from '../../types/location';
import type { TravelModeId } from '../../types/transport';
import type { LocationTravelOption } from '../../types/travel';
import { Icon } from '../icons';
import { HousingScene } from '../visuals';
import { TransportOptionCard } from './TransportOptionCard';

export type HousingListingView = {
  housing: Housing;
  location?: Location;
  district?: District;
  route?: LocationTravelOption;
  affordability: HousingAffordability;
  isViewed: boolean;
  isScheduled: boolean;
  isAtLocation: boolean;
};

export type HousingMarketPanelState = {
  currentHousing?: Housing;
  currentDistrict?: District;
  contract: RentalContract;
  market: HousingMarketState;
  listings: HousingListingView[];
  daysUntilRefresh: number;
};

type HousingMarketPanelProps = {
  state: HousingMarketPanelState;
  currentLocationId?: LocationId;
  onMoveLocation: (locationId: LocationId, modeId: TravelModeId) => void;
  onScheduleViewing: (housingId: HousingId) => void;
  onViewHousing: (housingId: HousingId) => void;
  onRentHousing: (housingId: HousingId) => void;
};

const KIND_LABELS: Record<HousingKind, string> = {
  bed_space: 'Койко-место',
  room: 'Комната',
  studio: 'Студия',
  one_room: 'Однокомнатная'
};

const CONDITION_LABELS: Record<Housing['condition'], string> = {
  poor: 'Плохое',
  standard: 'Обычное',
  good: 'Хорошее',
  excellent: 'Отличное'
};

function ListingStatus({ listing }: { listing: HousingListingView }) {
  if (listing.isViewed) return <span className="housing-listing-status housing-listing-status--viewed">Осмотрено</span>;
  if (listing.isScheduled) return <span className="housing-listing-status housing-listing-status--scheduled">Просмотр назначен</span>;
  return <span className="housing-listing-status">Активно</span>;
}

export function HousingMarketPanel({
  state,
  currentLocationId,
  onMoveLocation,
  onScheduleViewing,
  onViewHousing,
  onRentHousing
}: HousingMarketPanelProps) {
  const [districtFilter, setDistrictFilter] = useState<DistrictId | 'all'>('all');
  const [kindFilter, setKindFilter] = useState<HousingKind | 'all'>('all');
  const [maxRent, setMaxRent] = useState<number>(30000);
  const [selectedHousingId, setSelectedHousingId] = useState<HousingId>();

  const districts = useMemo(() => {
    const map = new Map<DistrictId, District>();
    state.listings.forEach((listing) => {
      if (listing.district) map.set(listing.district.id, listing.district);
    });
    return [...map.values()];
  }, [state.listings]);

  const filteredListings = useMemo(() => state.listings.filter((listing) => (
    (districtFilter === 'all' || listing.housing.districtId === districtFilter)
    && (kindFilter === 'all' || listing.housing.kind === kindFilter)
    && listing.housing.rentPerWeek <= maxRent
  )), [state.listings, districtFilter, kindFilter, maxRent]);

  const selected = state.listings.find((listing) => listing.housing.id === selectedHousingId);

  function handleTravel(modeId: TravelModeId): void {
    if (!selected?.location) return;
    onMoveLocation(selected.location.id, modeId);
  }

  return (
    <div className="housing-market-layout">
      <section className="panel housing-contract-panel visual-panel">
        <HousingScene imageSrc={state.currentHousing?.imageSrc} />
        <div className="housing-contract-panel__content">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Текущий договор</span>
              <h2>{state.currentHousing?.name ?? 'Нет жилья'}</h2>
              <p>{state.currentHousing?.address ?? 'Адрес не указан'}</p>
            </div>
            <span className="status-label">Оплата: день {state.contract.nextPaymentDay}</span>
          </div>

          {state.currentHousing ? (
            <dl className="data-ledger housing-market-ledger">
              <div><dt>Район</dt><dd>{state.currentDistrict?.name ?? '—'}</dd><small>{state.currentHousing.areaSqm} м²</small></div>
              <div><dt>Аренда</dt><dd>{formatRubles(state.currentHousing.rentPerWeek)}</dd><small>в неделю</small></div>
              <div><dt>Залог</dt><dd>{formatRubles(state.contract.depositPaid)}</dd><small>возврат при переезде</small></div>
              <div><dt>Комфорт</dt><dd>{state.currentHousing.comfort}</dd><small>из 100</small></div>
            </dl>
          ) : null}
        </div>
      </section>

      <section className="panel housing-market-panel visual-panel">
        <div className="section-heading">
          <div><span className="section-kicker">Рынок аренды</span><h2>Объявления</h2></div>
          <div className="housing-market-refresh"><span>Обновление</span><strong>через {state.daysUntilRefresh} дн.</strong></div>
        </div>

        <div className="housing-filters">
          <label>
            <span>Район</span>
            <select value={districtFilter} onChange={(event) => setDistrictFilter(event.target.value as DistrictId | 'all')}>
              <option value="all">Все районы</option>
              {districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
            </select>
          </label>
          <label>
            <span>Тип</span>
            <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as HousingKind | 'all')}>
              <option value="all">Любой</option>
              {Object.entries(KIND_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          <label className="housing-rent-filter">
            <span>До {formatRubles(maxRent)} / нед.</span>
            <input min="3000" max="30000" step="1000" type="range" value={maxRent} onChange={(event) => setMaxRent(Number(event.target.value))} />
          </label>
        </div>

        <div className="housing-listing-grid">
          {filteredListings.map((listing) => (
            <article className="housing-listing-card" key={listing.housing.id}>
              <button className="housing-listing-card__image" type="button" onClick={() => setSelectedHousingId(listing.housing.id)}>
                {listing.housing.imageSrc ? <img alt="" src={listing.housing.imageSrc} /> : null}
                <ListingStatus listing={listing} />
                <span className="housing-listing-card__comfort"><Icon name="sparkle" size={14} /> {listing.housing.comfort}</span>
              </button>
              <div className="housing-listing-card__body">
                <div><span>{listing.district?.name ?? 'Москва'}</span><h3>{listing.housing.name}</h3><p>{listing.housing.address}</p></div>
                <dl>
                  <div><dt>Тип</dt><dd>{KIND_LABELS[listing.housing.kind]}</dd></div>
                  <div><dt>Площадь</dt><dd>{listing.housing.areaSqm} м²</dd></div>
                  <div><dt>Состояние</dt><dd>{CONDITION_LABELS[listing.housing.condition]}</dd></div>
                </dl>
                <footer>
                  <div><strong>{formatRubles(listing.housing.rentPerWeek)}</strong><span>в неделю</span></div>
                  <button type="button" onClick={() => setSelectedHousingId(listing.housing.id)}>Подробнее <Icon name="arrow" size={14} /></button>
                </footer>
              </div>
            </article>
          ))}
        </div>

        {filteredListings.length === 0 ? <div className="empty-state compact-empty-state">Нет объявлений по выбранным фильтрам</div> : null}
      </section>

      {selected ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedHousingId(undefined)}>
          <div className="housing-details-dialog" role="dialog" aria-modal="true" aria-label={selected.housing.name} onMouseDown={(event) => event.stopPropagation()}>
            <button className="icon-button housing-details-dialog__close" aria-label="Закрыть" type="button" onClick={() => setSelectedHousingId(undefined)}><Icon name="close" size={20} /></button>
            <div className="housing-details-dialog__image">
              {selected.housing.imageSrc ? <img alt="" src={selected.housing.imageSrc} /> : null}
              <ListingStatus listing={selected} />
            </div>
            <div className="housing-details-dialog__content">
              <span className="section-kicker">{selected.district?.name ?? 'Москва'} · {KIND_LABELS[selected.housing.kind]}</span>
              <h2>{selected.housing.name}</h2>
              <p className="housing-details-dialog__address"><Icon name="pin" size={15} /> {selected.housing.address}</p>
              <p>{selected.housing.description}</p>

              <dl className="housing-details-specs">
                <div><dt>Площадь</dt><dd>{selected.housing.areaSqm} м²</dd></div>
                <div><dt>Состояние</dt><dd>{CONDITION_LABELS[selected.housing.condition]}</dd></div>
                <div><dt>Комфорт</dt><dd>{selected.housing.comfort}/100</dd></div>
                <div><dt>Коммунальные</dt><dd>{formatRubles(selected.housing.dailyUtilities)}/день</dd></div>
              </dl>

              <div className="housing-cost-breakdown">
                <div><span>Первая неделя</span><strong>{formatRubles(selected.housing.rentPerWeek)}</strong></div>
                <div><span>Залог</span><strong>{formatRubles(selected.housing.deposit)}</strong></div>
                <div><span>Переезд</span><strong>{formatRubles(selected.housing.movingCost)}</strong></div>
                {selected.affordability.depositRefund > 0 ? <div className="text-positive"><span>Возврат старого залога</span><strong>−{formatRubles(selected.affordability.depositRefund)}</strong></div> : null}
                <div className="housing-cost-breakdown__total"><span>Нужно сейчас</span><strong>{formatRubles(selected.affordability.netCost)}</strong></div>
              </div>

              {!selected.isScheduled && !selected.isViewed ? (
                <button className="primary-action-button" type="button" onClick={() => onScheduleViewing(selected.housing.id)}>
                  Назначить просмотр
                </button>
              ) : null}

              {selected.isScheduled && !selected.isAtLocation ? (
                <div className="housing-route-block">
                  <div><span className="section-kicker">Просмотр назначен</span><h3>Добраться до адреса</h3></div>
                  <div className="transport-options">
                    {selected.route?.transportOptions.map((option) => <TransportOptionCard key={option.modeId} option={option} onSelect={handleTravel} />)}
                  </div>
                </div>
              ) : null}

              {selected.isScheduled && selected.isAtLocation ? (
                <button className="primary-action-button" type="button" onClick={() => onViewHousing(selected.housing.id)}>
                  Осмотреть · 40 мин
                </button>
              ) : null}

              {selected.isViewed ? (
                <div className="housing-rent-action">
                  {!selected.affordability.canAfford ? <p className="unavailable-reason">{selected.affordability.failure}</p> : null}
                  <button className="primary-action-button" disabled={!selected.affordability.canAfford} type="button" onClick={() => onRentHousing(selected.housing.id)}>
                    Арендовать и переехать · 2 ч
                  </button>
                </div>
              ) : null}

              {selected.location?.id === currentLocationId && selected.isScheduled ? <small className="housing-location-note">Ты находишься по адресу просмотра.</small> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
