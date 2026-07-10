import { useMemo, useState } from 'react';
import type { LocationId } from '../../types/ids';
import type { TravelModeId } from '../../types/transport';
import type { LocationTravelOption } from '../../types/travel';
import type { ScheduleStatus } from '../../types/schedule';
import { Icon } from '../icons';
import { LocationScene } from '../visuals';
import { TransportOptionCard } from './TransportOptionCard';

type LocationTravelModalProps = {
  options: LocationTravelOption[];
  initialLocationId?: LocationId;
  scheduleStatuses: Record<string, ScheduleStatus>;
  onMoveLocation: (locationId: LocationId, modeId: TravelModeId) => void;
  onClose: () => void;
};

export function LocationTravelModal({ options, initialLocationId, scheduleStatuses, onMoveLocation, onClose }: LocationTravelModalProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<LocationId | undefined>(initialLocationId);
  const [search, setSearch] = useState('');
  const selectedOption = options.find((option) => option.location.id === selectedLocationId);
  const normalizedSearch = search.trim().toLowerCase();
  const visibleOptions = useMemo(
    () => options.filter((option) => normalizedSearch.length === 0 || `${option.location.name} ${option.location.address}`.toLowerCase().includes(normalizedSearch)),
    [normalizedSearch, options]
  );

  function handleTravel(modeId: TravelModeId): void {
    if (!selectedOption || selectedOption.isCurrent) return;
    onMoveLocation(selectedOption.location.id, modeId);
    onClose();
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="travel-dialog travel-dialog--premium" role="dialog" aria-modal="true" aria-label="Смена локации" onMouseDown={(event) => event.stopPropagation()}>
        <header className="dialog-header">
          <div><span className="section-kicker">Перемещение</span><h3>Выбор локации</h3></div>
          <button className="icon-button" aria-label="Закрыть" type="button" onClick={onClose}><Icon name="close" size={20} /></button>
        </header>

        <div className="travel-dialog__body">
          <section className="destination-column">
            <label className="search-field">
              <Icon name="search" size={17} />
              <input type="search" value={search} placeholder="Найти место" onChange={(event) => setSearch(event.target.value)} />
            </label>
            <div className="destination-list">
              {visibleOptions.map((option) => {
                const scheduleStatus = scheduleStatuses[option.location.id];
                return (
                <button
                  className={`destination-row ${option.location.id === selectedLocationId ? 'destination-row--selected' : ''}`}
                  disabled={option.isCurrent}
                  key={option.location.id}
                  type="button"
                  onClick={() => setSelectedLocationId(option.location.id)}
                >
                  <div className="destination-row__identity">
                    <span>{option.location.name}</span>
                    <small>{option.location.address}</small>
                    {scheduleStatus ? (
                      <em className={scheduleStatus.isOpen ? 'schedule-inline schedule-inline--open' : 'schedule-inline schedule-inline--closed'}>
                        {scheduleStatus.label}
                      </em>
                    ) : null}
                  </div>
                  <small>{option.isCurrent ? 'Вы здесь' : `от ${option.durationMinutes} мин`}</small>
                  <Icon name="chevron" size={17} />
                </button>
                );
              })}
            </div>
          </section>

          <section className="transport-column">
            {selectedOption && !selectedOption.isCurrent ? (
              <>
                <LocationScene type={selectedOption.location.type} title={selectedOption.location.name} subtitle={selectedOption.location.address} />
                <div className="transport-column__heading"><span className="section-kicker">Маршрут</span><h4>Как добраться</h4></div>
                <div className="transport-options">
                  {selectedOption.transportOptions.map((transportOption) => (
                    <TransportOptionCard key={transportOption.modeId} option={transportOption} onSelect={handleTravel} />
                  ))}
                </div>
              </>
            ) : (
              <div className="dialog-empty-state visual-empty-state">
                <div className="empty-state__halo"><Icon name="pin" size={28} /></div>
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
