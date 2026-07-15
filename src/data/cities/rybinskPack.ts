import type { LocationId } from '../../types/ids';
import { rybinskBusinessPremises } from '../business/rybinskPremises';
import { rybinskDistricts } from '../districts/rybinskDistricts';
import {
  rybinskDegreePrograms,
  rybinskEducationPrograms,
  rybinskUniversities,
  rybinskUniversitySubjects
} from '../education/rybinskEducation';
import { rybinskMedicalServices } from '../healthcare/rybinskServices';
import { rybinskHousing } from '../housing/rybinskHousing';
import { rybinskJobs } from '../jobs/rybinskJobs';
import { rybinskLocations } from '../locations/rybinskLocations';
import { basicShops } from '../shops/basicShops';
import { rybinskBoxingGyms, rybinskBoxingTrainers } from '../sports/rybinskBoxing';
import { buildCityContent } from './contentPackBuilder';
import { rybinskCity } from './rybinsk';
import { defineCityContentPack } from './registry';

export const rybinskContentPack = defineCityContentPack({
  city: rybinskCity,
  districts: rybinskDistricts,
  locations: rybinskLocations,
  defaultArrivalLocationId: 'ryb_center_station' as LocationId,
  content: buildCityContent({
    cityId: rybinskCity.id,
    districts: rybinskDistricts,
    locations: rybinskLocations,
    jobs: rybinskJobs,
    housing: rybinskHousing,
    shops: basicShops,
    educationPrograms: rybinskEducationPrograms,
    universities: rybinskUniversities,
    degreePrograms: rybinskDegreePrograms,
    universitySubjects: rybinskUniversitySubjects,
    medicalServices: rybinskMedicalServices,
    boxingGyms: rybinskBoxingGyms,
    boxingTrainers: rybinskBoxingTrainers,
    businessPremises: rybinskBusinessPremises
  })
});
