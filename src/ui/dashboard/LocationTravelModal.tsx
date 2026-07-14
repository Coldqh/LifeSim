import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LocationId } from '../../types/ids';
import type { TravelModeId } from '../../types/transport';
import type { LocationTravelOption } from '../../types/travel';
import type { ScheduleStatus } from '../../types/schedule';
import { Icon } from '../icons';
import { TransportOptionCard } from './TransportOptionCard';

type LocationTravelModalProps = {
  options: LocationTravelOption[];
  initialLocationId?: LocationId;
  scheduleStatuses: Record<string, ScheduleStatus>;
  onMoveLocation: (locationId: LocationId, modeId: TravelModeId) => void;
  onClose: () => void;
};

type TravelStep = 'location' | 'transport';

export function LocationTravelModal({ options, initialLocationId, scheduleStatuses, onMoveLocation, onClose }: LocationTravelModalProps) {
  const initialOption = options.find((option) => option.location.id === initialLocationId);
  const [selectedLocationId, setSelectedLocationId] = useState<LocationId | undefined>(initialLocationId);
  const [step, setStep] = useState<TravelStep>(initialOption && !initialOption.isCurrent ? 'transport' : 'location');
  const [search, setSearch] = useState('');
  const selectedOption = options.find((option) => option.location.id === selectedLocationId);
  const normalizedSearch = search.trim().toLowerCase();
  const visibleOptions = useMemo(
    () => options.filter((option) => normalizedSearch.length === 0 || `${option.location.name} ${option.location.address}`.toLowerCase().includes(normalizedSearch)),
    [normalizedSearch, options]
  );

  function selectLocation(locationId: LocationId): void {
    setSelectedLocationId(locationId);
    setStep('transport');
  }

  function handleTravel(modeId: TravelModeId): void {
    if (!selectedOption || selectedOption.isCurrent) return;
    onMoveLocation(selectedOption.location.id, modeId);
    onClose();
  }

  const selectedSchedule = selectedOption ? scheduleStatuses[selectedOption.location.id] : undefined;

  return createPortal(
    <div className="modal-backdrop modal-backdrop--app" role="presentation" onMouseDown={onClose}>
      <div className="travel-dialog travel-dialog--step" role="dialog" aria-modal="true" aria-label={step === 'location' ? 'Выбор локации' : 'Выбор маршрута'} onMouseDown={(event) => event.stopPropagation()}>
        <header className="dialog-header dialog-header--compact">
          <div className="dialog-header__leading">
            {step === 'transport' ? (
              <button className="icon-button" aria-label="Назад к выбору локации" type="button" onClick={() => setStep('location')}>
                <Icon name="arrow" size={17} />
              </button>
            ) : null}
            <div><span className="section-kicker">Перемещение</span><h3>{step === 'location' ? 'Куда идти' : 'Как добраться'}</h3></div>
          </div>
          <button className="icon-button" aria-label="Закрыть" type="button" onClick={onClose}><Icon name="close" size={18} /></button>
        </header>

        {step === 'location' ? (
          <section className="destination-column travel-step-panel">
            <label className="search-field travel-modal-search">
              <Icon name="search" size={15} />
              <input type="search" value={search} placeholder="Найти место" autoFocus onChange={(event) => setSearch(event.target.value)} />
            </label>
            <div className="destination-list destination-list--modal">
              {visibleOptions.map((option) => {
                const scheduleStatus = scheduleStatuses[option.location.id];
                return (
                  <button
                    className={`destination-row destination-row--compact ${option.location.id === selectedLocationId ? 'destination-row--selected' : ''}`}
                    disabled={option.isCurrent}
                    key={option.location.id}
                    type="button"
                    onClick={() => selectLocation(option.location.id)}
                  >
                    <div className="destination-row__identity">
                      <span>{option.location.name}</span>
                      <small>{option.location.address}</small>
                    </div>
                    <div className="destination-row__meta">
                      {scheduleStatus ? (
                        <em className={scheduleStatus.isOpen ? 'schedule-inline schedule-inline--open' : 'schedule-inline schedule-inline--closed'}>
                          {scheduleStatus.label}
                        </em>
                      ) : null}
                      <small>{option.isCurrent ? 'Вы здесь' : `от ${option.durationMinutes} мин`}</small>
                    </div>
                    <Icon name="chevron" size={15} />
                  </button>
                );
              })}
            </div>
          </section>
        ) : selectedOption && !selectedOption.isCurrent ? (
          <section className="transport-column travel-step-panel">
            <div className="travel-route-summary">
              <div className="travel-route-summary__icon"><Icon name="pin" size={18} /></div>
              <div>
                <strong>{selectedOption.location.name}</strong>
                <span>{selectedOption.location.address}</span>
              </div>
              {selectedSchedule ? (
                <em className={selectedSchedule.isOpen ? 'schedule-inline schedule-inline--open' : 'schedule-inline schedule-inline--closed'}>
                  {selectedSchedule.label}
                </em>
              ) : null}
            </div>
            <div className="transport-options transport-options--modal">
              {selectedOption.transportOptions.map((transportOption) => (
                <TransportOptionCard key={transportOption.modeId} option={transportOption} onSelect={handleTravel} />
              ))}
            </div>
          </section>
        ) : (
          <div className="dialog-empty-state"><Icon name="pin" size={24} /><strong>Локация недоступна</strong></div>
        )}
      </div>
    </div>,
    document.body
  );
}
