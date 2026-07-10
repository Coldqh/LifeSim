import { useMemo, useState } from 'react';
import { formatRubles } from '../../core/economy';
import type { Job } from '../../types/job';
import type { DistrictId, JobId, LocationId } from '../../types/ids';
import type { TravelModeId } from '../../types/transport';
import type { City, District, Location, LocationType } from '../../types/location';
import type { DistrictTravelOption, LocationTravelOption } from '../../types/travel';
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
  completedShifts: number;
  jobExperience: number;
  experienceRemaining: number;
  canApply: boolean;
  applicationFailure?: string;
  canWorkShift: boolean;
  shiftFailure?: string;
  missingSkillRequirements: Array<{ name: string; currentLevel: number; minLevel: number }>;
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
  home: 'Дом', shop: 'Магазин', cafe: 'Кафе', workplace: 'Работа', business_center: 'Бизнес-центр', park: 'Парк',
  sport_ground: 'Спортплощадка', service: 'Услуги', warehouse: 'Склад', fitness: 'Фитнес', coworking: 'Коворкинг',
  clinic: 'Клиника', pharmacy: 'Аптека', restaurant: 'Ресторан', food_court: 'Фудкорт', pickup_point: 'Пункт выдачи',
  mall: 'ТЦ', electronics_store: 'Техника', clothing_store: 'Одежда', bank: 'Банк', education_center: 'Обучение',
  sports_store: 'Спорттовары', boxing_gym: 'Бокс', pool: 'Бассейн', other: 'Другое'
};

const LOCATION_ICONS: Partial<Record<LocationType, IconName>> = {
  home: 'home', shop: 'shop', cafe: 'coffee', workplace: 'briefcase', business_center: 'building', park: 'sparkle',
  sport_ground: 'gym', service: 'package', warehouse: 'package', fitness: 'gym', coworking: 'building', clinic: 'heart',
  pharmacy: 'medicine', restaurant: 'food', food_court: 'food', pickup_point: 'package', mall: 'shop',
  electronics_store: 'sparkle', clothing_store: 'bag', bank: 'wallet', education_center: 'star', sports_store: 'gym',
  boxing_gym: 'gym', pool: 'water', other: 'pin'
};

const FOOD_TYPES: LocationType[] = ['cafe', 'restaurant', 'food_court'];
const HEALTH_TYPES: LocationType[] = ['pharmacy', 'clinic'];
const SPORT_TYPES: LocationType[] = ['fitness', 'sport_ground', 'sports_store', 'boxing_gym', 'pool'];
const SERVICE_TYPES: LocationType[] = ['service', 'coworking', 'bank', 'pickup_point', 'mall', 'electronics_store', 'clothing_store', 'education_center', 'warehouse', 'business_center'];

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
  onMoveDistrict,
  onMoveLocation,
  onApplyForJob
}: LocationPanelProps) {
  const [isDistrictPickerOpen, setIsDistrictPickerOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [selectedDistrictId, setSelectedDistrictId] = useState<DistrictId | undefined>();
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

  function handleDistrictTravel(modeId: TravelModeId): void {
    if (!selectedDistrictOption || selectedDistrictOption.isCurrent || !selectedDistrictOption.defaultLocation) return;
    onMoveDistrict(selectedDistrictOption.district.id, modeId);
    setIsDistrictPickerOpen(false);
    setSelectedDistrictId(undefined);
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
            <div>
              <span className="section-kicker">Текущий район</span>
              <h2>{district?.name ?? 'Район не найден'}</h2>
              <p>{location?.address ?? `${city?.name ?? 'Город'} · ${location ? LOCATION_TYPE_LABELS[location.type] : '—'}`}</p>
            </div>
          </div>
          <div className="city-command-header__actions">
            <button className="secondary-command-button" type="button" onClick={() => setIsDistrictPickerOpen(true)}>
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
          <div className="location-directory__head" role="row"><span>Место</span><span>Категория</span><span>Возможности</span><span>Маршрут</span></div>
          <div className="location-directory__body">
            {filteredLocationOptions.length > 0 ? filteredLocationOptions.map((option) => {
              const markers = getLocationMarkers(option.location);
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
                  <span role="cell">{LOCATION_TYPE_LABELS[option.location.type]}</span>
                  <span className="location-directory__markers" role="cell">{markers.join(' · ') || '—'}</span>
                  <span className="location-directory__travel" role="cell">{getMinTravelTimeLabel(option)}{!option.isCurrent ? <Icon name="chevron" size={16} /> : null}</span>
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
                    {view.isCurrentJob ? 'Текущая' : 'Устроиться'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {isDistrictPickerOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsDistrictPickerOpen(false)}>
          <div className="travel-dialog" role="dialog" aria-modal="true" aria-label="Смена района" onMouseDown={(event) => event.stopPropagation()}>
            <header className="dialog-header">
              <div><span className="section-kicker">Москва</span><h3>Выбор района</h3></div>
              <button className="icon-button" aria-label="Закрыть" type="button" onClick={() => setIsDistrictPickerOpen(false)}><Icon name="close" size={20} /></button>
            </header>
            <div className="travel-dialog__body">
              <section className="destination-column">
                <div className="destination-list">
                  {districtTravelOptions.map((option) => (
                    <button
                      className={option.district.id === selectedDistrictId ? 'destination-row destination-row--selected' : 'destination-row'}
                      disabled={option.isCurrent || !option.defaultLocation}
                      key={option.district.id}
                      type="button"
                      onClick={() => setSelectedDistrictId(option.district.id)}
                    >
                      <span>{option.district.name}</span>
                      <small>{option.isCurrent ? 'Текущий район' : `от ${option.durationMinutes} мин`}</small>
                      <Icon name="chevron" size={17} />
                    </button>
                  ))}
                </div>
              </section>
              <section className="transport-column">
                {selectedDistrictOption && !selectedDistrictOption.isCurrent ? (
                  <>
                    <div className="transport-column__heading"><span className="section-kicker">Маршрут</span><h4>{selectedDistrictOption.district.name}</h4></div>
                    <div className="transport-options">
                      {selectedDistrictOption.transportOptions.map((option) => <TransportOptionCard key={option.modeId} option={option} onSelect={handleDistrictTravel} />)}
                    </div>
                  </>
                ) : (
                  <div className="dialog-empty-state"><Icon name="city" size={28} /><strong>Выберите район</strong><span>Варианты маршрута появятся здесь.</span></div>
                )}
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {isLocationPickerOpen ? (
        <LocationTravelModal
          initialLocationId={selectedLocationId}
          options={locationTravelOptions}
          onClose={() => { setIsLocationPickerOpen(false); setSelectedLocationId(undefined); }}
          onMoveLocation={onMoveLocation}
        />
      ) : null}
    </section>
  );
}
