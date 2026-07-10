import { useMemo, useState } from 'react';
import type { LocationId } from '../../types/ids';
import type { TravelModeId } from '../../types/transport';
import type { LocationTravelOption } from '../../types/travel';
import { Icon } from '../icons';
import { TransportOptionCard } from './TransportOptionCard';

type LocationTravelModalProps = {
  options: LocationTravelOption[];
  initialLocationId?: LocationId;
  onMoveLocation: (locationId: LocationId, modeId: TravelModeId) => void;
  onClose: () => void;
};

export function LocationTravelModal({ options, initialLocationId, onMoveLocation, onClose }: LocationTravelModalProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<LocationId | undefined>(initialLocationId);
  const [search, setSearch] = useState('');
  const selectedOption = options.find((option) => option.location.id === selectedLocationId);
  const normalizedSearch = search.trim().toLowerCase();
  const visibleOptions = useMemo(
    () => options.filter((option) => normalizedSearch.length === 0 || option.location.name.toLowerCase().includes(normalizedSearch)),
    [normalizedSearch, options]
  );

  function handleTravel(modeId: TravelModeId): void {
    if (!selectedOption || selectedOption.isCurrent) return;
    onMoveLocation(selectedOption.location.id, modeId);
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="travel-dialog" role="dialog" aria-modal="true" aria-label="Смена локации" onMouseDown={(event) => event.stopPropagation()}>
        <header className="dialog-header">
          <div>
            <span className="section-kicker">Перемещение</span>
            <h3>Выбор локации</h3>
          </div>
          <button className="icon-button" aria-label="Закрыть" type="button" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="travel-dialog__body">
          <section className="destination-column">
            <label className="search-field">
              <Icon name="search" size={17} />
              <input type="search" value={search} placeholder="Найти место" onChange={(event) => setSearch(event.target.value)} />
            </label>
            <div className="destination-list">
              {visibleOptions.map((option) => (
                <button
                  className={`destination-row ${option.location.id === selectedLocationId ? 'destination-row--selected' : ''}`}
                  disabled={option.isCurrent}
                  key={option.location.id}
                  type="button"
                  onClick={() => setSelectedLocationId(option.location.id)}
                >
                  <span>{option.location.name}</span>
                  <small>{option.isCurrent ? 'Вы здесь' : `от ${option.durationMinutes} мин`}</small>
                  <Icon name="chevron" size={17} />
                </button>
              ))}
            </div>
          </section>

          <section className="transport-column">
            {selectedOption && !selectedOption.isCurrent ? (
              <>
                <div className="transport-column__heading">
                  <span className="section-kicker">Маршрут</span>
                  <h4>{selectedOption.location.name}</h4>
                </div>
                <div className="transport-options">
                  {selectedOption.transportOptions.map((transportOption) => (
                    <TransportOptionCard key={transportOption.modeId} option={transportOption} onSelect={handleTravel} />
                  ))}
                </div>
              </>
            ) : (
              <div className="dialog-empty-state">
                <Icon name="pin" size={28} />
                <strong>Выберите место</strong>
                <span>Способы перемещения появятся здесь.</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
