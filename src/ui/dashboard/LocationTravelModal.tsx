import type { LocationId } from '../../types/ids';
import type { LocationTravelOption } from '../../types/travel';

type LocationTravelModalProps = {
  options: LocationTravelOption[];
  onMoveLocation: (locationId: LocationId) => void;
  onClose: () => void;
};

export function LocationTravelModal({ options, onMoveLocation, onClose }: LocationTravelModalProps) {
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
              className={`location-card ${option.isCurrent ? 'location-card--active' : ''}`}
              disabled={option.isCurrent}
              key={option.location.id}
              type="button"
              onClick={() => {
                onMoveLocation(option.location.id);
                onClose();
              }}
            >
              <span>{option.location.name}</span>
              <small>{option.location.description}</small>
              <strong>{option.isCurrent ? 'Ты здесь' : `${option.durationMinutes} мин`}</strong>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
