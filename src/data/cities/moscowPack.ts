import type { LocationId } from '../../types/ids';
import { careerCompanies, professionalJobs } from '../career';
import { businessPremises } from '../business/premises';
import { moscowDistricts } from '../districts/moscowDistricts';
import { basicEducationPrograms } from '../education/basicPrograms';
import { degreePrograms, universities, universitySubjects } from '../education/universities';
import { medicalServices } from '../healthcare/services';
import { basicHousing } from '../housing/basicHousing';
import { basicJobs } from '../jobs/basicJobs';
import { moscowLocations } from '../locations/moscowLocations';
import { basicShops } from '../shops/basicShops';
import { boxingGyms } from '../sports/boxingGyms';
import { boxingTrainers } from '../sports/boxingTrainers';
import { buildCityContent } from './contentPackBuilder';
import { moscowCity } from './moscow';
import { defineCityContentPack } from './registry';

export const moscowContentPack = defineCityContentPack({
  city: moscowCity,
  districts: moscowDistricts,
  locations: moscowLocations,
  defaultArrivalLocationId: 'msk_tverskoy_yaroslavsky_station' as LocationId,
  content: buildCityContent({
    cityId: moscowCity.id,
    districts: moscowDistricts,
    locations: moscowLocations,
    jobs: [...basicJobs, ...professionalJobs],
    housing: basicHousing,
    shops: basicShops,
    educationPrograms: basicEducationPrograms,
    universities,
    degreePrograms,
    universitySubjects,
    medicalServices,
    boxingGyms,
    boxingTrainers,
    businessPremises,
    careerCompanies
  })
});
