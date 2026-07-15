import type { District } from '../../types/location';
import { RYBINSK_DISTRICT_IDS } from '../cities/rybinsk';
import { rybinskLocations } from '../locations/rybinskLocations';

function locationsForDistrict(districtId: District['id']) {
  return rybinskLocations.filter((location) => location.districtId === districtId).map((location) => location.id);
}

export const rybinskDistricts: District[] = [
  {
    id: RYBINSK_DISTRICT_IDS.center,
    cityId: 'rybinsk' as District['cityId'],
    name: 'Центр',
    description: 'Вокзал, набережная, университет, медицина и основные городские сервисы.',
    locationIds: locationsForDistrict(RYBINSK_DISTRICT_IDS.center)
  },
  {
    id: RYBINSK_DISTRICT_IDS.severny,
    cityId: 'rybinsk' as District['cityId'],
    name: 'Северный',
    description: 'Жилой и промышленный район с предприятиями и спортивной инфраструктурой.',
    locationIds: locationsForDistrict(RYBINSK_DISTRICT_IDS.severny)
  },
  {
    id: RYBINSK_DISTRICT_IDS.perebory,
    cityId: 'rybinsk' as District['cityId'],
    name: 'Переборы',
    description: 'Удалённый район у водохранилища с дешёвым жильём, складами и стадионом.',
    locationIds: locationsForDistrict(RYBINSK_DISTRICT_IDS.perebory)
  }
];
