import type { LocationId } from '../../types/ids';
import { businessPremises } from '../business/premises';
import { yaroslavlDistricts } from '../districts/yaroslavlDistricts';
import { basicEducationPrograms } from '../education/basicPrograms';
import { degreePrograms, universities } from '../education/universities';
import { medicalServices } from '../healthcare/services';
import { basicHousing } from '../housing/basicHousing';
import { basicJobs } from '../jobs/basicJobs';
import { yaroslavlLocations } from '../locations/yaroslavlLocations';
import { basicShops } from '../shops/basicShops';
import { boxingGyms } from '../sports/boxingGyms';
import { buildCityContent } from './contentPackBuilder';
import { defineCityContentPack } from './registry';
import { yaroslavlCity } from './yaroslavl';

export const yaroslavlContentPack = defineCityContentPack({
  city: yaroslavlCity,
  districts: yaroslavlDistricts,
  locations: yaroslavlLocations,
  defaultArrivalLocationId: 'yar_leninsky_main_station' as LocationId,
  content: buildCityContent({
    cityId: yaroslavlCity.id,
    districts: yaroslavlDistricts,
    locations: yaroslavlLocations,
    jobs: basicJobs,
    housing: basicHousing,
    shops: basicShops,
    educationPrograms: basicEducationPrograms,
    universities,
    degreePrograms,
    medicalServices,
    boxingGyms,
    businessPremises
  })
});
