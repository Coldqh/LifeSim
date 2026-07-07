import { useState } from 'react';
import type { DistrictId, LocationId } from '../../types/ids';
import type { TravelModeId } from '../../types/transport';
import type { City, District, Location } from '../../types/location';
import type { DistrictTravelOption, LocationTravelOption } from '../../types/travel';
import { LocationTravelModal } from './LocationTravelModal';
import { TransportOptionCard } from './TransportOptionCard';

type LocationPanelProps = {
  city?: City;
  district?: District;
  location?: Location;
  districtTravelOptions: DistrictTravelOption[];
  locationTravelOptions: LocationTravelOption[];
  onMoveDistrict: (districtId: DistrictId, modeId: TravelModeId) => void;
  onMoveLocation: (locationId: LocationId, modeId: TravelModeId) => void;
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
