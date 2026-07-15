import { describe, expect, it } from 'vitest';
import type { BoxingGym } from '../../types/boxing';
import type { BusinessPremises } from '../../types/business';
import type { EducationProgram } from '../../types/education';
import type { MedicalService } from '../../types/healthcare';
import type {
  BoxingGymId,
  BusinessPremisesId,
  CityId,
  CountryId,
  DegreeProgramId,
  DistrictId,
  EducationProgramId,
  JobId,
  LocationId,
  MedicalServiceId,
  ShopId,
  UniversityId
} from '../../types/ids';
import type { Housing, HousingId } from '../../types/housing';
import type { Job } from '../../types/job';
import type { City, District, Location } from '../../types/location';
import type { Shop } from '../../types/product';
import type { DegreeProgramDefinition, UniversityDefinition } from '../../types/university';
import { buildCityContent } from './contentPackBuilder';
import { createCityRegistry, defineCityContentPack } from './registry';

const asId = <T>(value: string) => value as T;

function createSyntheticCity() {
  const cityId = asId<CityId>('synthetic_city');
  const districtId = asId<DistrictId>('synthetic_center');
  const stationId = asId<LocationId>('synthetic_station');
  const workplaceId = asId<LocationId>('synthetic_workplace');
  const homeId = asId<LocationId>('synthetic_home');
  const clinicId = asId<LocationId>('synthetic_clinic');
  const universityLocationId = asId<LocationId>('synthetic_university');
  const gymLocationId = asId<LocationId>('synthetic_boxing_gym');
  const shopId = asId<ShopId>('synthetic_shop');

  const locations: Location[] = [
    { id: stationId, cityId, districtId, name: 'Station', address: '1', type: 'train_station', description: '', availableActionIds: [] },
    { id: workplaceId, cityId, districtId, name: 'Work', address: '2', type: 'workplace', description: '', availableActionIds: [], shopId },
    { id: homeId, cityId, districtId, name: 'Home', address: '3', type: 'home', description: '', availableActionIds: [] },
    { id: clinicId, cityId, districtId, name: 'Clinic', address: '4', type: 'clinic', description: '', availableActionIds: [] },
    { id: universityLocationId, cityId, districtId, name: 'University', address: '5', type: 'university', description: '', availableActionIds: [] },
    { id: gymLocationId, cityId, districtId, name: 'Gym', address: '6', type: 'boxing_gym', description: '', availableActionIds: [] }
  ];
  const district: District = {
    id: districtId,
    cityId,
    name: 'Center',
    description: '',
    locationIds: locations.map((location) => location.id)
  };
  const city: City = {
    id: cityId,
    countryId: asId<CountryId>('country'),
    name: 'Synthetic',
    description: '',
    districtIds: [districtId]
  };

  const universityId = asId<UniversityId>('synthetic_university_definition');
  const degreeProgramId = asId<DegreeProgramId>('synthetic_degree');
  const content = buildCityContent({
    cityId,
    districts: [district],
    locations,
    jobs: [{ id: asId<JobId>('synthetic_job'), locationId: workplaceId } as Job],
    housing: [{ id: asId<HousingId>('synthetic_housing'), locationId: homeId, districtId } as Housing],
    shops: [{ id: shopId, name: 'Shop', description: '', productIds: [] } as Shop],
    educationPrograms: [{ id: asId<EducationProgramId>('synthetic_course'), locationId: universityLocationId } as EducationProgram],
    universities: [{ id: universityId, cityId, locationId: universityLocationId, programIds: [degreeProgramId] } as UniversityDefinition],
    degreePrograms: [{ id: degreeProgramId, universityId } as DegreeProgramDefinition],
    medicalServices: [{ id: asId<MedicalServiceId>('synthetic_medical'), clinicLocationId: clinicId } as MedicalService],
    boxingGyms: [{ id: asId<BoxingGymId>('synthetic_gym'), locationId: gymLocationId } as BoxingGym],
    businessPremises: [{ id: asId<BusinessPremisesId>('synthetic_premises'), locationId: workplaceId, districtId } as BusinessPremises]
  });

  return { city, district, locations, stationId, content };
}

describe('buildCityContent', () => {
  it('connects all supported city systems through one pack', () => {
    const synthetic = createSyntheticCity();
    const registry = createCityRegistry([
      defineCityContentPack({
        city: synthetic.city,
        districts: [synthetic.district],
        locations: synthetic.locations,
        defaultArrivalLocationId: synthetic.stationId,
        content: synthetic.content
      })
    ]);

    expect(synthetic.content.jobs.map((entry) => entry.id)).toEqual(['synthetic_job']);
    expect(synthetic.content.housing.map((entry) => entry.id)).toEqual(['synthetic_housing']);
    expect(synthetic.content.shops.map((entry) => entry.id)).toEqual(['synthetic_shop']);
    expect(synthetic.content.educationPrograms.map((entry) => entry.id)).toEqual(['synthetic_course']);
    expect(synthetic.content.universities.map((entry) => entry.id)).toEqual(['synthetic_university_definition']);
    expect(synthetic.content.degreePrograms.map((entry) => entry.id)).toEqual(['synthetic_degree']);
    expect(synthetic.content.medicalServices.map((entry) => entry.id)).toEqual(['synthetic_medical']);
    expect(synthetic.content.boxingGyms.map((entry) => entry.id)).toEqual(['synthetic_gym']);
    expect(synthetic.content.businessPremises.map((entry) => entry.id)).toEqual(['synthetic_premises']);
    expect(synthetic.content.transportNodeLocationIds).toEqual(['synthetic_station']);
    expect(registry.getCompletenessForCity(synthetic.city.id)?.missingCategories).toEqual([]);
  });
});
