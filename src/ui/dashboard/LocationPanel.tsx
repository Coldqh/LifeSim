import type { DistrictId, LocationId } from '../../types/ids';
import type { City, District, Location } from '../../types/location';

type LocationPanelProps = {
  city?: City;
  district?: District;
  location?: Location;
  districts: District[];
  locations: Location[];
  onMoveDistrict: (districtId: DistrictId) => void;
  onMoveLocation: (locationId: LocationId) => void;
};

export function LocationPanel({
  city,
  district,
  location,
  districts,
  locations,
  onMoveDistrict,
  onMoveLocation
}: LocationPanelProps) {
  return (
    <section className="panel location-panel">
      <div className="panel__header">
        <p className="panel__eyebrow">Город</p>
        <h2 className="panel__title">{city?.name ?? 'Город не найден'}</h2>
        <p className="location-panel__current">
          {district?.name ?? 'Район не найден'} · {location?.name ?? 'Место не найдено'}
        </p>
      </div>

      <div className="location-panel__block">
        <h3>Районы</h3>
        <div className="location-list">
          {districts.map((candidate) => (
            <button
              className={`location-chip ${candidate.id === district?.id ? 'location-chip--active' : ''}`}
              key={candidate.id}
              type="button"
              onClick={() => onMoveDistrict(candidate.id)}
            >
              <span>{candidate.name}</span>
              <small>{candidate.description}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="location-panel__block">
        <h3>Места</h3>
        <div className="location-list location-list--places">
          {locations.map((candidate) => (
            <button
              className={`location-card ${candidate.id === location?.id ? 'location-card--active' : ''}`}
              key={candidate.id}
              type="button"
              onClick={() => onMoveLocation(candidate.id)}
            >
              <span>{candidate.name}</span>
              <small>{candidate.description}</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
