import { useMemo, useState } from 'react';
import { formatRubles } from '../../core/economy';
import type { Job } from '../../types/job';
import type { DistrictId, JobId, LocationId } from '../../types/ids';
import type { TravelModeId } from '../../types/transport';
import type { City, District, Location, LocationType } from '../../types/location';
import type { DistrictTravelOption, LocationTravelOption } from '../../types/travel';
import { LocationTravelModal } from './LocationTravelModal';
import { TransportOptionCard } from './TransportOptionCard';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type LocationJobView = {
  job: Job;
  location?: Location;
  district?: District;
  isCurrentJob: boolean;
  completedShifts: number;
  jobExperience: number;
  experienceRemaining: number;
  canApply: boolean;
  applicationFailure?: string;
  canWorkShift: boolean;
  shiftFailure?: string;
};

type LocationPanelProps = {
  city?: City;
  district?: District;
  location?: Location;
  districtTravelOptions: DistrictTravelOption[];
  locationTravelOptions: LocationTravelOption[];
  locationJobs: LocationJobView[];
  onMoveDistrict: (districtId: DistrictId, modeId: TravelModeId) => void;
  onMoveLocation: (locationId: LocationId, modeId: TravelModeId) => void;
  onApplyForJob: (jobId: JobId) => void;
};

type LocationCategoryFilter = 'all' | 'food' | 'shops' | 'jobs' | 'health' | 'sport' | 'service';

type LocationMarker = 'Магазин' | 'Вакансии' | 'Еда' | 'Здоровье' | 'Спорт' | 'Услуги';

const LOCATION_FILTERS: Array<{ id: LocationCategoryFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'food', label: 'Еда' },
  { id: 'shops', label: 'Магазины' },
  { id: 'jobs', label: 'Работа' },
  { id: 'health', label: 'Здоровье' },
  { id: 'sport', label: 'Спорт' },
  { id: 'service', label: 'Услуги' }
];

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  home: 'Дом',
  shop: 'Магазин',
  cafe: 'Кафе',
  workplace: 'Работа',
  business_center: 'Бизнес-центр',
  park: 'Парк',
  sport_ground: 'Спортплощадка',
  service: 'Услуги',
  warehouse: 'Склад',
  fitness: 'Фитнес',
  coworking: 'Коворкинг',
  clinic: 'Клиника',
  pharmacy: 'Аптека',
  restaurant: 'Ресторан',
  food_court: 'Фудкорт',
  pickup_point: 'Пункт выдачи',
  mall: 'ТЦ',
  electronics_store: 'Техника',
  clothing_store: 'Одежда',
  bank: 'Банк',
  education_center: 'Обучение',
  sports_store: 'Спорттовары',
  boxing_gym: 'Бокс',
  pool: 'Бассейн',
  other: 'Другое'
};

const FOOD_TYPES: LocationType[] = ['cafe', 'restaurant', 'food_court'];
const HEALTH_TYPES: LocationType[] = ['pharmacy', 'clinic'];
const SPORT_TYPES: LocationType[] = ['fitness', 'sport_ground', 'sports_store', 'boxing_gym', 'pool'];
const SERVICE_TYPES: LocationType[] = [
  'service',
  'coworking',
  'bank',
  'pickup_point',
  'mall',
  'electronics_store',
  'clothing_store',
  'education_center',
  'warehouse',
  'business_center'
];

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (hours > 0 && restMinutes > 0) return `${hours} ч ${restMinutes} мин`;
  if (hours > 0) return `${hours} ч`;

  return `${restMinutes} мин`;
}

function getVacancyEffects(job: Job): EffectListItem[] {
  return [
    {
      label: 'Деньги',
      value: job.effects.moneyDelta,
      unit: '₽',
      tone: 'positive'
    },
    {
      label: 'Опыт',
      value: job.experiencePerShift,
      unit: 'XP',
      tone: 'positive'
    },
    {
      label: 'Время',
      value: -job.shiftDurationMinutes,
      unit: 'мин',
      tone: 'negative'
    },
    ...createNeedsEffectItems(job.effects.needsDelta)
  ];
}

function getLocationMarkers(location: Location): LocationMarker[] {
  const markers: LocationMarker[] = [];

  if (location.shopId) markers.push('Магазин');
  if (location.jobIds && location.jobIds.length > 0) markers.push('Вакансии');
  if (FOOD_TYPES.includes(location.type)) markers.push('Еда');
  if (HEALTH_TYPES.includes(location.type)) markers.push('Здоровье');
  if (SPORT_TYPES.includes(location.type)) markers.push('Спорт');
  if (SERVICE_TYPES.includes(location.type)) markers.push('Услуги');

  return markers;
}

function matchesFilter(location: Location, filter: LocationCategoryFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'shops') return Boolean(location.shopId);
  if (filter === 'jobs') return Boolean(location.jobIds?.length);
  if (filter === 'food') return FOOD_TYPES.includes(location.type);
  if (filter === 'health') return HEALTH_TYPES.includes(location.type);
  if (filter === 'sport') return SPORT_TYPES.includes(location.type);
  if (filter === 'service') return SERVICE_TYPES.includes(location.type);

  return true;
}

function getMinTravelTimeLabel(option: LocationTravelOption): string {
  if (option.isCurrent) return 'Текущее место';
  if (option.transportOptions.length === 0) return `от ${option.durationMinutes} мин`;

  const minDuration = Math.min(...option.transportOptions.map((transportOption) => transportOption.durationMinutes));
  return `от ${minDuration} мин`;
}

export function LocationPanel({
  city,
  district,
  location,
  districtTravelOptions,
  locationTravelOptions,
  locationJobs,
  onMoveDistrict,
  onMoveLocation,
  onApplyForJob
}: LocationPanelProps) {
  const [isDistrictPickerOpen, setIsDistrictPickerOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [selectedDistrictId, setSelectedDistrictId] = useState<DistrictId | undefined>();
  const [locationFilter, setLocationFilter] = useState<LocationCategoryFilter>('all');
  const [locationSearch, setLocationSearch] = useState('');
  const selectedDistrictOption = districtTravelOptions.find((option) => option.district.id === selectedDistrictId);
  const normalizedSearch = locationSearch.trim().toLowerCase();

  const filteredLocationOptions = useMemo(
    () =>
      locationTravelOptions.filter((option) => {
        const optionLocation = option.location;
        const matchesSearch = normalizedSearch.length === 0 || optionLocation.name.toLowerCase().includes(normalizedSearch);

        return matchesSearch && matchesFilter(optionLocation, locationFilter);
      }),
    [locationFilter, locationTravelOptions, normalizedSearch]
  );

  function openDistrictPicker(): void {
    setSelectedDistrictId(undefined);
    setIsDistrictPickerOpen(true);
  }

  function handleDistrictTravel(modeId: TravelModeId): void {
    if (!selectedDistrictOption || selectedDistrictOption.isCurrent || !selectedDistrictOption.defaultLocation) return;

    onMoveDistrict(selectedDistrictOption.district.id, modeId);
    setIsDistrictPickerOpen(false);
    setSelectedDistrictId(undefined);
  }

  return (
    <section className="panel location-panel">
      <div className="panel__header location-panel__header">
        <div>
          <p className="panel__eyebrow">Город</p>
          <h2 className="panel__title">{city?.name ?? 'Город не найден'}</h2>
          <p className="location-panel__current">
            {district?.name ?? 'Район не найден'} · {location?.name ?? 'Место не найдено'}
          </p>
        </div>
        <div className="location-panel__actions">
          <button className="secondary-button" type="button" onClick={openDistrictPicker}>
            Сменить район
          </button>
          <button className="secondary-button" type="button" onClick={() => setIsLocationPickerOpen(true)}>
            Сменить локацию
          </button>
        </div>
      </div>

      <div className="city-current-block">
        <div>
          <p className="panel__eyebrow">Текущее место</p>
          <strong>{location?.name ?? 'Место не найдено'}</strong>
        </div>
        <dl>
          <div>
            <dt>Район</dt>
            <dd>{district?.name ?? '—'}</dd>
          </div>
          <div>
            <dt>Тип</dt>
            <dd>{location ? LOCATION_TYPE_LABELS[location.type] : '—'}</dd>
          </div>
          <div>
            <dt>Метки</dt>
            <dd>{location ? getLocationMarkers(location).join(' / ') || '—' : '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="location-browser">
        <div className="location-browser__header">
          <div>
            <p className="panel__eyebrow">Локации района</p>
            <h3>{district?.name ?? 'Район не найден'}</h3>
          </div>
          <label className="location-search">
            <span>Поиск</span>
            <input
              type="search"
              value={locationSearch}
              placeholder="Название места"
              onChange={(event) => setLocationSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="location-filters" aria-label="Фильтры локаций">
          {LOCATION_FILTERS.map((filter) => (
            <button
              className={`location-filter ${filter.id === locationFilter ? 'location-filter--active' : ''}`}
              key={filter.id}
              type="button"
              onClick={() => setLocationFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="location-table" role="table" aria-label="Локации района">
          <div className="location-table__row location-table__row--head" role="row">
            <span role="columnheader">Название</span>
            <span role="columnheader">Тип</span>
            <span role="columnheader">Метки</span>
            <span role="columnheader">Переход</span>
          </div>

          {filteredLocationOptions.length > 0 ? (
            filteredLocationOptions.map((option) => {
              const markers = getLocationMarkers(option.location);

              return (
                <div
                  className={`location-table__row ${option.isCurrent ? 'location-table__row--current' : ''}`}
                  key={option.location.id}
                  role="row"
                >
                  <span role="cell">{option.location.name}</span>
                  <span role="cell">{LOCATION_TYPE_LABELS[option.location.type]}</span>
                  <span className="location-table__markers" role="cell">
                    {markers.length > 0 ? markers.join(' / ') : '—'}
                  </span>
                  <span role="cell">{getMinTravelTimeLabel(option)}</span>
                </div>
              );
            })
          ) : (
            <div className="location-table__empty">Нет мест по выбранному фильтру.</div>
          )}
        </div>
      </div>

      {locationJobs.length > 0 ? (
        <div className="location-panel__block">
          <h3>Вакансии здесь</h3>
          <div className="job-list location-job-list">
            {locationJobs.map((view) => (
              <article className={`job-card ${view.isCurrentJob ? 'job-card--active' : ''}`} key={view.job.id}>
                <div>
                  <p className="panel__eyebrow">{view.location?.name ?? 'Место не найдено'}</p>
                  <h3>{view.job.title}</h3>
                </div>

                <dl className="job-card__meta">
                  <div>
                    <dt>Смена</dt>
                    <dd>{formatDuration(view.job.shiftDurationMinutes)}</dd>
                  </div>
                  <div>
                    <dt>Оплата</dt>
                    <dd>{formatRubles(view.job.wagePerShift)}</dd>
                  </div>
                  <div>
                    <dt>Опыт</dt>
                    <dd>+{view.job.experiencePerShift} XP</dd>
                  </div>
                </dl>

                <EffectList items={getVacancyEffects(view.job)} />

                <div className="job-card__actions">
                  <button
                    className="secondary-button"
                    disabled={view.isCurrentJob || !view.canApply}
                    type="button"
                    onClick={() => onApplyForJob(view.job.id)}
                  >
                    {view.isCurrentJob ? 'Текущая работа' : 'Устроиться'}
                  </button>
                </div>

                {!view.canApply && !view.isCurrentJob ? <p className="job-card__warning">{view.applicationFailure}</p> : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {isDistrictPickerOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="district-modal" role="dialog" aria-modal="true" aria-label="Смена района">
            <div className="district-modal__header">
              <div>
                <p className="panel__eyebrow">Перемещение</p>
                <h3>Выбери район</h3>
              </div>
              <button className="secondary-button" type="button" onClick={() => setIsDistrictPickerOpen(false)}>
                Закрыть
              </button>
            </div>

            <div className="location-list">
              {districtTravelOptions.map((option) => (
                <button
                  className={`location-chip ${option.isCurrent || option.district.id === selectedDistrictId ? 'location-chip--active' : ''}`}
                  disabled={option.isCurrent || !option.defaultLocation}
                  key={option.district.id}
                  type="button"
                  onClick={() => setSelectedDistrictId(option.district.id)}
                >
                  <span>{option.district.name}</span>
                  <strong>{option.isCurrent ? 'Ты здесь' : `от ${option.durationMinutes} мин`}</strong>
                </button>
              ))}
            </div>

            {selectedDistrictOption && !selectedDistrictOption.isCurrent ? (
              <div className="transport-section">
                <p className="panel__eyebrow">Как добраться?</p>
                <h4>{selectedDistrictOption.district.name}</h4>
                <div className="transport-options">
                  {selectedDistrictOption.transportOptions.map((transportOption) => (
                    <TransportOptionCard
                      key={transportOption.modeId}
                      option={transportOption}
                      onSelect={handleDistrictTravel}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {isLocationPickerOpen ? (
        <LocationTravelModal
          options={locationTravelOptions}
          onClose={() => setIsLocationPickerOpen(false)}
          onMoveLocation={onMoveLocation}
        />
      ) : null}
    </section>
  );
}
