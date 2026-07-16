import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatRubles } from '../../core/economy';
import type { Job } from '../../types/job';
import type { DistrictId, JobId, LocationId } from '../../types/ids';
import type { TravelModeId } from '../../types/transport';
import type { City, District, Location, LocationType } from '../../types/location';
import type { DistrictTravelOption, LocationTravelOption } from '../../types/travel';
import type { ScheduleStatus } from '../../types/schedule';
import type { OpportunityJobView } from '../../types/opportunity';
import { Icon, type IconName } from '../icons';
import { LocationScene } from '../visuals';
import { LocationTravelModal } from './LocationTravelModal';
import { TransportOptionCard } from './TransportOptionCard';
import { createNeedsEffectItems, EffectList, type EffectListItem } from './EffectList';

type LocationJobView = {
  job: Job;
  location?: Location;
  district?: District;
  isCurrentJob: boolean;
  isAtWorkplace: boolean;
  completedShifts: number;
  jobExperience: number;
  experienceRemaining: number;
  canApply: boolean;
  applicationFailure?: string;
  canWorkShift: boolean;
  shiftFailure?: string;
  missingSkillRequirements: Array<{ name: string; currentLevel: number; minLevel: number }>;
  scheduleStatus: ScheduleStatus;
  opportunity: OpportunityJobView;
};

type LocationPanelProps = {
  city?: City;
  district?: District;
  location?: Location;
  districtTravelOptions: DistrictTravelOption[];
  locationTravelOptions: LocationTravelOption[];
  locationJobs: LocationJobView[];
  currentScheduleStatus: ScheduleStatus;
  locationScheduleStatuses: Record<string, ScheduleStatus>;
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
  home: 'Дом', shop: 'Магазин', cafe: 'Кафе', workplace: 'Работа', business_center: 'Бизнес-центр', park: 'Парк',
  sport_ground: 'Спортплощадка', service: 'Услуги', warehouse: 'Склад', fitness: 'Фитнес', coworking: 'Коворкинг',
  clinic: 'Клиника', pharmacy: 'Аптека', restaurant: 'Ресторан', food_court: 'Фудкорт', pickup_point: 'Пункт выдачи',
  mall: 'ТЦ', electronics_store: 'Техника', clothing_store: 'Одежда', bank: 'Банк', education_center: 'Обучение', university: 'Университет',
  sports_store: 'Спорттовары', boxing_gym: 'Бокс', pool: 'Бассейн', car_dealer: 'Автосалон', gas_station: 'АЗС', service_center: 'Автосервис', auto_market: 'Авто с пробегом', train_station: 'Ж/д вокзал', bus_station: 'Автовокзал', hotel: 'Гостиница', hostel: 'Хостел', other: 'Другое'
};

const LOCATION_ICONS: Partial<Record<LocationType, IconName>> = {
  home: 'home', shop: 'shop', cafe: 'coffee', workplace: 'briefcase', business_center: 'building', park: 'sparkle',
  sport_ground: 'gym', service: 'package', warehouse: 'package', fitness: 'gym', coworking: 'building', clinic: 'heart',
  pharmacy: 'medicine', restaurant: 'food', food_court: 'food', pickup_point: 'package', mall: 'shop',
  electronics_store: 'sparkle', clothing_store: 'bag', bank: 'wallet', education_center: 'star', university: 'book', sports_store: 'gym',
  boxing_gym: 'gym', pool: 'water', car_dealer: 'car', gas_station: 'fuel', service_center: 'wrench', auto_market: 'car', train_station: 'metro', bus_station: 'bus', hotel: 'home', hostel: 'home', other: 'pin'
};

const FOOD_TYPES: LocationType[] = ['cafe', 'restaurant', 'food_court'];
const HEALTH_TYPES: LocationType[] = ['pharmacy', 'clinic'];
const SPORT_TYPES: LocationType[] = ['fitness', 'sport_ground', 'sports_store', 'boxing_gym', 'pool'];
const SERVICE_TYPES: LocationType[] = ['service', 'coworking', 'bank', 'pickup_point', 'mall', 'electronics_store', 'clothing_store', 'education_center', 'university', 'warehouse', 'business_center', 'car_dealer', 'gas_station', 'service_center', 'auto_market', 'train_station', 'bus_station', 'hotel', 'hostel'];

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours > 0 && restMinutes > 0) return `${hours} ч ${restMinutes} мин`;
  if (hours > 0) return `${hours} ч`;
  return `${restMinutes} мин`;
}

function getVacancyEffects(job: Job): EffectListItem[] {
  return [
    { label: 'Деньги', value: job.effects.moneyDelta, unit: '₽', tone: 'positive' },
    { label: 'Опыт', value: job.experiencePerShift, unit: 'XP', tone: 'positive' },
    { label: 'Время', value: -job.shiftDurationMinutes, unit: 'мин', tone: 'negative' },
    ...createNeedsEffectItems(job.effects.needsDelta)
  ];
}

function getLocationMarkers(location: Location): LocationMarker[] {
  const markers: LocationMarker[] = [];
  if (location.shopId) markers.push('Магазин');
  if (location.jobIds?.length) markers.push('Вакансии');
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
  if (option.isCurrent) return 'Вы здесь';
  if (option.transportOptions.length === 0) return `от ${option.durationMinutes} мин`;
  return `от ${Math.min(...option.transportOptions.map((transportOption) => transportOption.durationMinutes))} мин`;
}

export function LocationPanel({
  city,
  district,
  location,
  districtTravelOptions,
  locationTravelOptions,
  locationJobs,
  currentScheduleStatus,
  locationScheduleStatuses,
  onMoveDistrict,
  onMoveLocation,
  onApplyForJob
}: LocationPanelProps) {
  const [isDistrictPickerOpen, setIsDistrictPickerOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [selectedDistrictId, setSelectedDistrictId] = useState<DistrictId | undefined>();
  const [districtPickerStep, setDistrictPickerStep] = useState<'district' | 'transport'>('district');
  const [selectedLocationId, setSelectedLocationId] = useState<LocationId | undefined>();
  const [locationFilter, setLocationFilter] = useState<LocationCategoryFilter>('all');
  const [locationSearch, setLocationSearch] = useState('');
  const selectedDistrictOption = districtTravelOptions.find((option) => option.district.id === selectedDistrictId);
  const normalizedSearch = locationSearch.trim().toLowerCase();

  const filteredLocationOptions = useMemo(
    () => locationTravelOptions.filter((option) => {
      const matchesSearch = normalizedSearch.length === 0 || `${option.location.name} ${option.location.address}`.toLowerCase().includes(normalizedSearch);
      return matchesSearch && matchesFilter(option.location, locationFilter);
    }),
    [locationFilter, locationTravelOptions, normalizedSearch]
  );

  function openLocationPicker(locationId?: LocationId): void {
    setSelectedLocationId(locationId);
    setIsLocationPickerOpen(true);
  }

  function openDistrictPicker(): void {
    setSelectedDistrictId(undefined);
    setDistrictPickerStep('district');
    setIsDistrictPickerOpen(true);
  }

  function closeDistrictPicker(): void {
    setIsDistrictPickerOpen(false);
    setSelectedDistrictId(undefined);
    setDistrictPickerStep('district');
  }

  function selectDistrict(districtId: DistrictId): void {
    setSelectedDistrictId(districtId);
    setDistrictPickerStep('transport');
  }

  function handleDistrictTravel(modeId: TravelModeId): void {
    if (!selectedDistrictOption || selectedDistrictOption.isCurrent || !selectedDistrictOption.defaultLocation) return;
    onMoveDistrict(selectedDistrictOption.district.id, modeId);
    closeDistrictPicker();
  }

  return (
    <section className="panel city-browser-panel visual-panel">
      <LocationScene
        type={location?.type}
        title={location?.name ?? 'Место не найдено'}
        subtitle={`${city?.name ?? 'Город'} · ${district?.name ?? 'Район'}`}
      />

      <div className="city-browser-panel__content">
        <header className="city-command-header">
          <div className="city-command-header__identity">
            <div className="city-command-header__icon"><Icon name="pin" size={22} /></div>
            <div className="city-command-header__copy">
              <span className="section-kicker">Текущее место</span>
              <div className="city-command-header__headline">
                <h2>{location?.name ?? 'Место не найдено'}</h2>
                {location ? (
                  <span className={`schedule-badge ${currentScheduleStatus.isOpen ? 'schedule-badge--open' : 'schedule-badge--closed'}`}>
                    {currentScheduleStatus.label}
                  </span>
                ) : null}
              </div>
              <p>{location ? `${location.address} · ${district?.name ?? 'Район'} · ${city?.name ?? 'Город'}` : `${district?.name ?? 'Район'} · ${city?.name ?? 'Город'}`}</p>
            </div>
          </div>
          <div className="city-command-header__actions">
            <button className="secondary-command-button" type="button" onClick={openDistrictPicker}>
              <Icon name="city" size={18} /><span>Район</span>
            </button>
            <button className="primary-command-button primary-command-button--inline premium-cta" type="button" onClick={() => openLocationPicker()}>
              <span>Переместиться</span><Icon name="arrow" size={18} />
            </button>
          </div>
        </header>

        <div className="location-toolbar">
          <label className="search-field location-search-field">
            <Icon name="search" size={17} />
            <input type="search" value={locationSearch} placeholder="Поиск по району" onChange={(event) => setLocationSearch(event.target.value)} />
          </label>
          <div className="segmented-filters" aria-label="Фильтры локаций">
            {LOCATION_FILTERS.map((filter) => (
              <button
                className={filter.id === locationFilter ? 'segmented-filter segmented-filter--active' : 'segmented-filter'}
                key={filter.id}
                type="button"
                onClick={() => setLocationFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="location-directory" role="table" aria-label="Локации района">
          <div className="location-directory__head" role="row"><span>Место</span><span>Статус и маршрут</span><span /></div>
          <div className="location-directory__body">
            {filteredLocationOptions.length > 0 ? filteredLocationOptions.map((option) => {
              const markers = getLocationMarkers(option.location);
              const scheduleStatus = locationScheduleStatuses[option.location.id];
              return (
                <button
                  className={option.isCurrent ? 'location-directory__row location-directory__row--current' : 'location-directory__row'}
                  disabled={option.isCurrent}
                  key={option.location.id}
                  role="row"
                  type="button"
                  onClick={() => openLocationPicker(option.location.id)}
                >
                  <span className="location-directory__name" role="cell">
                    <i><Icon name={LOCATION_ICONS[option.location.type] ?? 'pin'} size={17}/></i>
                    <span className="location-directory__title"><strong>{option.location.name}</strong><small>{option.location.address}</small></span>
                  </span>
                  <span className="location-directory__meta-line" role="cell">
                    <span>{LOCATION_TYPE_LABELS[option.location.type]}</span>
                    {markers.length > 0 ? <span className="location-directory__features">{markers.join(' · ')}</span> : null}
                    {scheduleStatus ? (
                      <small className={scheduleStatus.isOpen ? 'schedule-inline schedule-inline--open' : 'schedule-inline schedule-inline--closed'}>
                        {scheduleStatus.label}
                      </small>
                    ) : null}
                    <span className="location-directory__travel">{getMinTravelTimeLabel(option)}</span>
                  </span>
                  <span className="location-directory__chevron" aria-hidden="true">{!option.isCurrent ? <Icon name="chevron" size={15} /> : null}</span>
                </button>
              );
            }) : <div className="location-directory__empty">Ничего не найдено</div>}
          </div>
        </div>

        {locationJobs.length > 0 ? (
          <section className="vacancy-section">
            <div className="section-heading section-heading--compact">
              <div><span className="section-kicker">Текущее место</span><h3>Вакансии</h3></div>
              <span className="section-counter">{locationJobs.length}</span>
            </div>
            <div className="vacancy-list">
              {locationJobs.map((view) => (
                <article className={view.isCurrentJob ? 'vacancy-row vacancy-row--active interactive-surface' : 'vacancy-row interactive-surface'} key={view.job.id}>
                  <div className="vacancy-row__icon"><Icon name="briefcase" size={18} /></div>
                  <div className="vacancy-row__content">
                    <strong>{view.job.title}</strong>
                    <span>{formatDuration(view.job.shiftDurationMinutes)} · {formatRubles(view.job.wagePerShift)} · +{view.job.experiencePerShift} XP</span>
                    <small className={view.scheduleStatus.isOpen ? 'schedule-inline schedule-inline--open' : 'schedule-inline schedule-inline--closed'}>
                      Смены: {view.scheduleStatus.label}
                    </small>
                    <small className={view.opportunity.available ? 'schedule-inline schedule-inline--open' : 'schedule-inline schedule-inline--closed'}>
                      Вакансия: {view.opportunity.label}
                    </small>
                    <EffectList items={getVacancyEffects(view.job)} />
                    {view.missingSkillRequirements.length > 0 ? (
                      <div className="vacancy-skill-requirements">
                        {view.missingSkillRequirements.map((requirement) => (
                          <span key={requirement.name}>{requirement.name}: {requirement.currentLevel}/{requirement.minLevel}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <button
                    className="row-action-button row-action-button--compact"
                    disabled={view.isCurrentJob || !view.canApply}
                    type="button"
                    onClick={() => onApplyForJob(view.job.id)}
                  >
                    {view.isCurrentJob ? 'Текущая' : 'Открыть в телефоне'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {isDistrictPickerOpen ? createPortal(
        <div className="modal-backdrop modal-backdrop--app" role="presentation" onMouseDown={closeDistrictPicker}>
          <div className="travel-dialog travel-dialog--step" role="dialog" aria-modal="true" aria-label={districtPickerStep === 'district' ? 'Выбор района' : 'Выбор маршрута'} onMouseDown={(event) => event.stopPropagation()}>
            <header className="dialog-header dialog-header--compact">
              <div className="dialog-header__leading">
                {districtPickerStep === 'transport' ? (
                  <button className="icon-button" aria-label="Назад к выбору района" type="button" onClick={() => setDistrictPickerStep('district')}><Icon name="arrow" size={17} /></button>
                ) : null}
                <div><span className="section-kicker">{city?.name ?? 'Город'}</span><h3>{districtPickerStep === 'district' ? 'Выбор района' : 'Как добраться'}</h3></div>
              </div>
              <button className="icon-button" aria-label="Закрыть" type="button" onClick={closeDistrictPicker}><Icon name="close" size={18} /></button>
            </header>
            {districtPickerStep === 'district' ? (
              <section className="destination-column travel-step-panel">
                <div className="destination-list destination-list--modal">
                  {districtTravelOptions.map((option) => (
                    <button
                      className={option.district.id === selectedDistrictId ? 'destination-row destination-row--compact destination-row--selected' : 'destination-row destination-row--compact'}
                      disabled={option.isCurrent || !option.defaultLocation}
                      key={option.district.id}
                      type="button"
                      onClick={() => selectDistrict(option.district.id)}
                    >
                      <div className="destination-row__identity"><span>{option.district.name}</span><small>{option.isCurrent ? 'Текущий район' : `от ${option.durationMinutes} мин`}</small></div>
                      <Icon name="chevron" size={15} />
                    </button>
                  ))}
                </div>
              </section>
            ) : selectedDistrictOption && !selectedDistrictOption.isCurrent ? (
              <section className="transport-column travel-step-panel">
                <div className="travel-route-summary">
                  <div className="travel-route-summary__icon"><Icon name="city" size={18} /></div>
                  <div><strong>{selectedDistrictOption.district.name}</strong><span>{selectedDistrictOption.defaultLocation?.name ?? 'Точка прибытия'}</span></div>
                </div>
                <div className="transport-options transport-options--modal">
                  {selectedDistrictOption.transportOptions.map((option) => <TransportOptionCard key={option.modeId} option={option} onSelect={handleDistrictTravel} />)}
                </div>
              </section>
            ) : null}
          </div>
        </div>,
        document.body
      ) : null}

      {isLocationPickerOpen ? (
        <LocationTravelModal
          initialLocationId={selectedLocationId}
          options={locationTravelOptions}
          scheduleStatuses={locationScheduleStatuses}
          onClose={() => { setIsLocationPickerOpen(false); setSelectedLocationId(undefined); }}
          onMoveLocation={onMoveLocation}
        />
      ) : null}
    </section>
  );
}
