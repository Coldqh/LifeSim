import { useState } from 'react';
import type { LocationId } from '../../types/ids';
import type { TravelModeId } from '../../types/transport';
import type { LocationTravelOption } from '../../types/travel';
import { TransportOptionCard } from './TransportOptionCard';

type LocationTravelModalProps = {
  options: LocationTravelOption[];
  onMoveLocation: (locationId: LocationId, modeId: TravelModeId) => void;
  onClose: () => void;
};

export function LocationTravelModal({ options, onMoveLocation, onClose }: LocationTravelModalProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<LocationId | undefined>();
  const selectedOption = options.find((option) => option.location.id === selectedLocationId);

  function handleTravel(modeId: TravelModeId): void {
    if (!selectedOption || selectedOption.isCurrent) return;

    onMoveLocation(selectedOption.location.id, modeId);
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="district-modal travel-modal" role="dialog" aria-modal="true" aria-label="Смена локации">
        <div className="district-modal__header">
          <div>
            <p className="panel__eyebrow">Перемещение</p>
            <h3>Куда пойти?</h3>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>
            Закрыть
          </button>
        </div>

        <div className="location-list location-list--travel">
          {options.map((option) => (
            <button
              className={`location-card ${option.isCurrent || option.location.id === selectedLocationId ? 'location-card--active' : ''}`}
              disabled={option.isCurrent}
              key={option.location.id}
              type="button"
              onClick={() => setSelectedLocationId(option.location.id)}
            >
              <span>{option.location.name}</span>
              <small>{option.location.description}</small>
              <strong>{option.isCurrent ? 'Ты здесь' : `от ${option.durationMinutes} мин`}</strong>
            </button>
          ))}
        </div>

        {selectedOption && !selectedOption.isCurrent ? (
          <div className="transport-section">
            <p className="panel__eyebrow">Как добраться?</p>
            <h4>{selectedOption.location.name}</h4>
            <div className="transport-options">
              {selectedOption.transportOptions.map((transportOption) => (
                <TransportOptionCard
                  key={transportOption.modeId}
                  option={transportOption}
                  onSelect={handleTravel}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
