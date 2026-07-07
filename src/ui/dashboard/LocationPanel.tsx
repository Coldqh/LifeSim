import { useState } from 'react';
import { formatRubles } from '../../core/economy';
import type { Job } from '../../types/job';
import type { DistrictId, JobId, LocationId } from '../../types/ids';
import type { TravelModeId } from '../../types/transport';
import type { City, District, Location } from '../../types/location';
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
  const selectedDistrictOption = districtTravelOptions.find((option) => option.district.id === selectedDistrictId);

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

      <div className="location-panel__block">
        <h3>Текущее место</h3>
        <div className="current-location-card">
          <strong>{location?.name ?? 'Место не найдено'}</strong>
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
