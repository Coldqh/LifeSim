import { useState } from 'react';
import type { DistrictId, LocationId } from '../../types/ids';
import type { City, District, Location } from '../../types/location';
import type { DistrictTravelOption, LocationTravelOption } from '../../types/travel';
import { LocationTravelModal } from './LocationTravelModal';

type LocationPanelProps = {
  city?: City;
  district?: District;
  location?: Location;
  districtTravelOptions: DistrictTravelOption[];
  locationTravelOptions: LocationTravelOption[];
  onMoveDistrict: (districtId: DistrictId) => void;
  onMoveLocation: (locationId: LocationId) => void;
};

export function LocationPanel({
  city,
  district,
  location,
  districtTravelOptions,
  locationTravelOptions,
  onMoveDistrict,
  onMoveLocation
}: LocationPanelProps) {
  const [isDistrictPickerOpen, setIsDistrictPickerOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

  function handleDistrictSelect(districtId: DistrictId): void {
    onMoveDistrict(districtId);
    setIsDistrictPickerOpen(false);
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
          <button className="secondary-button" type="button" onClick={() => setIsDistrictPickerOpen(true)}>
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
          <span>{location?.description ?? 'Описание недоступно.'}</span>
        </div>
      </div>

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
                  className={`location-chip ${option.isCurrent ? 'location-chip--active' : ''}`}
                  disabled={option.isCurrent || !option.defaultLocation}
                  key={option.district.id}
                  type="button"
                  onClick={() => handleDistrictSelect(option.district.id)}
                >
                  <span>{option.district.name}</span>
                  <small>{option.district.description}</small>
                  <strong>{option.isCurrent ? 'Ты здесь' : `${option.durationMinutes} мин`}</strong>
                </button>
              ))}
            </div>
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
