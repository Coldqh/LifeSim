import type { BoxingGym } from '../../types/boxing';
import type { BusinessPremises } from '../../types/business';
import type { EducationProgram } from '../../types/education';
import type { MedicalService } from '../../types/healthcare';
import type { CityId, EventId } from '../../types/ids';
import type { Housing } from '../../types/housing';
import type { Job } from '../../types/job';
import type { District, Location } from '../../types/location';
import type { Shop } from '../../types/product';
import type { DegreeProgramDefinition, UniversityDefinition } from '../../types/university';
import type { CityContent } from './registry';

const SPORT_LOCATION_TYPES = new Set<Location['type']>(['boxing_gym', 'fitness', 'pool', 'sport_ground']);
const TRANSPORT_LOCATION_TYPES = new Set<Location['type']>(['train_station', 'bus_station']);

function uniqueById<T>(values: readonly T[], getId: (value: T) => string): T[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = getId(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueByString<T>(values: readonly T[]): T[] {
  return uniqueById(values, String);
}

export type BuildCityContentInput = {
  cityId: CityId;
  districts: readonly District[];
  locations: readonly Location[];
  jobs: readonly Job[];
  housing: readonly Housing[];
  shops: readonly Shop[];
  educationPrograms: readonly EducationProgram[];
  universities: readonly UniversityDefinition[];
  degreePrograms: readonly DegreeProgramDefinition[];
  medicalServices: readonly MedicalService[];
  boxingGyms: readonly BoxingGym[];
  businessPremises: readonly BusinessPremises[];
  eventIds?: readonly EventId[];
};

export function buildCityContent(input: BuildCityContentInput): CityContent {
  const districtIds = new Set(input.districts.map((district) => String(district.id)));
  const locationIds = new Set(input.locations.map((location) => String(location.id)));
  const knownShopById = new Map(input.shops.map((shop) => [String(shop.id), shop]));

  for (const location of input.locations) {
    if (location.cityId !== input.cityId) {
      throw new Error(`Location ${String(location.id)} does not belong to city ${String(input.cityId)}.`);
    }
    if (!districtIds.has(String(location.districtId))) {
      throw new Error(`Location ${String(location.id)} points outside city ${String(input.cityId)} districts.`);
    }
    if (location.shopId && !knownShopById.has(String(location.shopId))) {
      throw new Error(`Location ${String(location.id)} references unknown shop ${String(location.shopId)}.`);
    }
  }

  const cityUniversities = input.universities.filter((university) => university.cityId === input.cityId);
  const universityIds = new Set(cityUniversities.map((university) => String(university.id)));
  const referencedShopIds = uniqueByString(
    input.locations.flatMap((location) => location.shopId ? [location.shopId] : [])
  );

  return {
    jobs: input.jobs.filter((job) => locationIds.has(String(job.locationId))),
    housing: input.housing.filter((entry) => (
      locationIds.has(String(entry.locationId)) && districtIds.has(String(entry.districtId))
    )),
    shops: referencedShopIds
      .map((shopId) => knownShopById.get(String(shopId)))
      .filter((shop): shop is Shop => Boolean(shop)),
    educationPrograms: input.educationPrograms.filter((program) => locationIds.has(String(program.locationId))),
    universities: cityUniversities,
    degreePrograms: input.degreePrograms.filter((program) => universityIds.has(String(program.universityId))),
    medicalServices: input.medicalServices.filter((service) => locationIds.has(String(service.clinicLocationId))),
    sportFacilityLocationIds: input.locations
      .filter((location) => SPORT_LOCATION_TYPES.has(location.type))
      .map((location) => location.id),
    boxingGyms: input.boxingGyms.filter((gym) => locationIds.has(String(gym.locationId))),
    businessPremises: input.businessPremises.filter((premises) => (
      locationIds.has(String(premises.locationId)) && districtIds.has(String(premises.districtId))
    )),
    transportNodeLocationIds: input.locations
      .filter((location) => TRANSPORT_LOCATION_TYPES.has(location.type))
      .map((location) => location.id),
    eventIds: uniqueByString(input.eventIds ?? [])
  };
}
