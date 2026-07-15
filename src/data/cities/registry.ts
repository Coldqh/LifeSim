import type { BoxingGym, BoxingTrainer } from '../../types/boxing';
import type { BusinessPremises } from '../../types/business';
import type { CareerCompany } from '../../types/career';
import type { EducationProgram } from '../../types/education';
import type { MedicalService } from '../../types/healthcare';
import type { CityId, DistrictId, EventId, LocationId } from '../../types/ids';
import type { Housing } from '../../types/housing';
import type { Job } from '../../types/job';
import type { City, District, Location } from '../../types/location';
import type { Shop } from '../../types/product';
import type { DegreeProgramDefinition, UniversityDefinition, UniversitySubjectDefinition } from '../../types/university';

export type CityContentCategory =
  | 'jobs'
  | 'housing'
  | 'shops'
  | 'education'
  | 'healthcare'
  | 'sports'
  | 'business'
  | 'career'
  | 'transport';

export type CityContent = {
  jobs: readonly Job[];
  housing: readonly Housing[];
  shops: readonly Shop[];
  educationPrograms: readonly EducationProgram[];
  universities: readonly UniversityDefinition[];
  degreePrograms: readonly DegreeProgramDefinition[];
  universitySubjects: readonly UniversitySubjectDefinition[];
  medicalServices: readonly MedicalService[];
  sportFacilityLocationIds: readonly LocationId[];
  boxingGyms: readonly BoxingGym[];
  boxingTrainers: readonly BoxingTrainer[];
  businessPremises: readonly BusinessPremises[];
  careerCompanies: readonly CareerCompany[];
  transportNodeLocationIds: readonly LocationId[];
  eventIds: readonly EventId[];
};

export type CityContentCompleteness = {
  cityId: CityId;
  counts: {
    jobs: number;
    housing: number;
    shops: number;
    education: number;
    healthcare: number;
    sports: number;
    business: number;
    career: number;
    transport: number;
  };
  availableCategories: CityContentCategory[];
  missingCategories: CityContentCategory[];
};

export type CityContentPack = {
  city: City;
  districts: readonly District[];
  locations: readonly Location[];
  defaultArrivalLocationId: LocationId;
  content: CityContent;
};

export type CityContentPackDefinition = Omit<CityContentPack, 'content'> & {
  content?: Partial<CityContent>;
};

export type CityRegistry = {
  packs: readonly CityContentPack[];
  cities: readonly City[];
  districts: readonly District[];
  locations: readonly Location[];
  content: CityContent;
  getPack: (cityId: CityId) => CityContentPack | undefined;
  getCity: (cityId: CityId) => City | undefined;
  getDistrict: (districtId: DistrictId) => District | undefined;
  getLocation: (locationId: LocationId | undefined) => Location | undefined;
  getDefaultArrivalLocationId: (cityId: CityId) => LocationId | undefined;
  getDistrictsForCity: (cityId: CityId) => District[];
  getLocationsForCity: (cityId: CityId) => Location[];
  getLocationsForDistrict: (districtId: DistrictId) => Location[];
  getContentForCity: (cityId: CityId) => CityContent | undefined;
  getCompletenessForCity: (cityId: CityId) => CityContentCompleteness | undefined;
};

const EMPTY_CONTENT: CityContent = {
  jobs: [],
  housing: [],
  shops: [],
  educationPrograms: [],
  universities: [],
  degreePrograms: [],
  universitySubjects: [],
  medicalServices: [],
  sportFacilityLocationIds: [],
  boxingGyms: [],
  boxingTrainers: [],
  businessPremises: [],
  careerCompanies: [],
  transportNodeLocationIds: [],
  eventIds: []
};

function normalizeContent(content: Partial<CityContent> | undefined): CityContent {
  return {
    jobs: [...(content?.jobs ?? [])],
    housing: [...(content?.housing ?? [])],
    shops: [...(content?.shops ?? [])],
    educationPrograms: [...(content?.educationPrograms ?? [])],
    universities: [...(content?.universities ?? [])],
    degreePrograms: [...(content?.degreePrograms ?? [])],
    universitySubjects: [...(content?.universitySubjects ?? [])],
    medicalServices: [...(content?.medicalServices ?? [])],
    sportFacilityLocationIds: [...(content?.sportFacilityLocationIds ?? [])],
    boxingGyms: [...(content?.boxingGyms ?? [])],
    boxingTrainers: [...(content?.boxingTrainers ?? [])],
    businessPremises: [...(content?.businessPremises ?? [])],
    careerCompanies: [...(content?.careerCompanies ?? [])],
    transportNodeLocationIds: [...(content?.transportNodeLocationIds ?? [])],
    eventIds: [...(content?.eventIds ?? [])]
  };
}

export function defineCityContentPack(pack: CityContentPackDefinition): CityContentPack {
  return {
    ...pack,
    content: normalizeContent(pack.content)
  };
}

function assertUnique<T>(items: readonly T[], getId: (item: T) => string, label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    const id = getId(item);
    if (seen.has(id)) throw new Error(`Duplicate ${label} id: ${id}`);
    seen.add(id);
  }
}

function assertUniqueContent(pack: CityContentPack): void {
  const cityLabel = String(pack.city.id);
  assertUnique(pack.content.jobs, (entry) => String(entry.id), `${cityLabel} job`);
  assertUnique(pack.content.housing, (entry) => String(entry.id), `${cityLabel} housing`);
  assertUnique(pack.content.shops, (entry) => String(entry.id), `${cityLabel} shop`);
  assertUnique(pack.content.educationPrograms, (entry) => String(entry.id), `${cityLabel} education program`);
  assertUnique(pack.content.universities, (entry) => String(entry.id), `${cityLabel} university`);
  assertUnique(pack.content.degreePrograms, (entry) => String(entry.id), `${cityLabel} degree program`);
  assertUnique(pack.content.universitySubjects, (entry) => String(entry.id), `${cityLabel} university subject`);
  assertUnique(pack.content.medicalServices, (entry) => String(entry.id), `${cityLabel} medical service`);
  assertUnique(pack.content.sportFacilityLocationIds, String, `${cityLabel} sport facility`);
  assertUnique(pack.content.boxingGyms, (entry) => String(entry.id), `${cityLabel} boxing gym`);
  assertUnique(pack.content.boxingTrainers, (entry) => String(entry.id), `${cityLabel} boxing trainer`);
  assertUnique(pack.content.businessPremises, (entry) => String(entry.id), `${cityLabel} business premises`);
  assertUnique(pack.content.careerCompanies, (entry) => String(entry.id), `${cityLabel} career company`);
  assertUnique(pack.content.transportNodeLocationIds, String, `${cityLabel} transport node`);
  assertUnique(pack.content.eventIds, String, `${cityLabel} event`);
}

function assertPackLocation(pack: CityContentPack, locationId: LocationId, label: string): void {
  if (!pack.locations.some((location) => location.id === locationId)) {
    throw new Error(`City ${String(pack.city.id)} ${label} points outside its city pack: ${String(locationId)}.`);
  }
}

function validateCityContent(pack: CityContentPack): void {
  assertUniqueContent(pack);
  const districtIds = new Set(pack.districts.map((district) => String(district.id)));
  const shopIds = new Set(pack.content.shops.map((shop) => String(shop.id)));
  const universityIds = new Set(pack.content.universities.map((university) => String(university.id)));
  const universitySubjectIds = new Set(pack.content.universitySubjects.map((subject) => String(subject.id)));
  const boxingTrainerIds = new Set(pack.content.boxingTrainers.map((trainer) => String(trainer.id)));
  const careerCompanyIds = new Set(pack.content.careerCompanies.map((company) => String(company.id)));

  for (const location of pack.locations) {
    if (location.shopId && !shopIds.has(String(location.shopId))) {
      throw new Error(`City ${String(pack.city.id)} location ${String(location.id)} references shop outside its content pack.`);
    }
  }
  for (const job of pack.content.jobs) {
    assertPackLocation(pack, job.locationId, `job ${String(job.id)}`);
    if (job.companyId && !careerCompanyIds.has(String(job.companyId))) {
      throw new Error(`Job ${String(job.id)} references company outside its city pack.`);
    }
  }
  for (const housing of pack.content.housing) {
    assertPackLocation(pack, housing.locationId, `housing ${String(housing.id)}`);
    if (!districtIds.has(String(housing.districtId))) {
      throw new Error(`City ${String(pack.city.id)} housing ${String(housing.id)} points outside its districts.`);
    }
  }
  for (const program of pack.content.educationPrograms) {
    assertPackLocation(pack, program.locationId, `education program ${String(program.id)}`);
  }
  for (const university of pack.content.universities) {
    if (university.cityId !== pack.city.id) {
      throw new Error(`University ${String(university.id)} belongs to another city.`);
    }
    assertPackLocation(pack, university.locationId, `university ${String(university.id)}`);
  }
  for (const degreeProgram of pack.content.degreePrograms) {
    if (!universityIds.has(String(degreeProgram.universityId))) {
      throw new Error(`Degree program ${String(degreeProgram.id)} points outside city universities.`);
    }
    for (const subjectId of degreeProgram.subjectIds) {
      if (!universitySubjectIds.has(String(subjectId))) {
        throw new Error(`Degree program ${String(degreeProgram.id)} references subject outside city education content.`);
      }
    }
  }
  for (const service of pack.content.medicalServices) {
    assertPackLocation(pack, service.clinicLocationId, `medical service ${String(service.id)}`);
  }
  for (const locationId of pack.content.sportFacilityLocationIds) {
    assertPackLocation(pack, locationId, 'sport facility');
  }
  for (const gym of pack.content.boxingGyms) {
    assertPackLocation(pack, gym.locationId, `boxing gym ${String(gym.id)}`);
    for (const trainerId of gym.trainerIds ?? []) {
      if (!boxingTrainerIds.has(String(trainerId))) {
        throw new Error(`Boxing gym ${String(gym.id)} references trainer outside its city pack.`);
      }
    }
  }
  for (const premises of pack.content.businessPremises) {
    assertPackLocation(pack, premises.locationId, `business premises ${String(premises.id)}`);
    if (!districtIds.has(String(premises.districtId))) {
      throw new Error(`City ${String(pack.city.id)} business premises ${String(premises.id)} points outside its districts.`);
    }
  }
  for (const company of pack.content.careerCompanies) {
    if (company.cityId !== pack.city.id) {
      throw new Error(`Career company ${String(company.id)} belongs to another city.`);
    }
    assertPackLocation(pack, company.locationId, `career company ${String(company.id)}`);
  }
  for (const locationId of pack.content.transportNodeLocationIds) {
    assertPackLocation(pack, locationId, 'transport node');
  }
}

function mergeUniqueById<T>(packs: readonly CityContentPack[], select: (pack: CityContentPack) => readonly T[], getId: (entry: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const pack of packs) {
    for (const entry of select(pack)) {
      const id = getId(entry);
      if (seen.has(id)) continue;
      seen.add(id);
      result.push(entry);
    }
  }
  return result;
}

function createCompleteness(pack: CityContentPack): CityContentCompleteness {
  const counts: CityContentCompleteness['counts'] = {
    jobs: pack.content.jobs.length,
    housing: pack.content.housing.length,
    shops: pack.content.shops.length,
    education: pack.content.educationPrograms.length + pack.content.degreePrograms.length,
    healthcare: pack.content.medicalServices.length,
    sports: pack.content.sportFacilityLocationIds.length,
    business: pack.content.businessPremises.length,
    career: pack.content.careerCompanies.length,
    transport: pack.content.transportNodeLocationIds.length
  };
  const categories = Object.keys(counts) as CityContentCategory[];
  return {
    cityId: pack.city.id,
    counts,
    availableCategories: categories.filter((category) => counts[category] > 0),
    missingCategories: categories.filter((category) => counts[category] === 0)
  };
}

export function createCityRegistry(packs: readonly CityContentPack[]): CityRegistry {
  assertUnique(packs, (pack) => String(pack.city.id), 'city');

  const cities = packs.map((pack) => pack.city);
  const districts = packs.flatMap((pack) => [...pack.districts]);
  const locations = packs.flatMap((pack) => [...pack.locations]);

  assertUnique(districts, (district) => String(district.id), 'district');
  assertUnique(locations, (location) => String(location.id), 'location');

  const packByCityId = new Map(packs.map((pack) => [pack.city.id, pack]));
  const cityById = new Map(cities.map((city) => [city.id, city]));
  const districtById = new Map(districts.map((district) => [district.id, district]));
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const districtsByCityId = new Map(packs.map((pack) => [pack.city.id, [...pack.districts]]));
  const locationsByCityId = new Map(packs.map((pack) => [pack.city.id, [...pack.locations]]));
  const locationsByDistrictId = new Map(districts.map((district) => [
    district.id,
    locations.filter((location) => location.districtId === district.id)
  ]));
  const completenessByCityId = new Map(packs.map((pack) => [pack.city.id, createCompleteness(pack)]));

  for (const pack of packs) {
    const cityDistrictIds = new Set(pack.city.districtIds.map(String));
    const packDistrictIds = new Set(pack.districts.map((district) => String(district.id)));

    if (cityDistrictIds.size !== packDistrictIds.size || [...cityDistrictIds].some((id) => !packDistrictIds.has(id))) {
      throw new Error(`City ${String(pack.city.id)} districtIds do not match its city pack.`);
    }

    for (const district of pack.districts) {
      if (district.cityId !== pack.city.id) {
        throw new Error(`District ${String(district.id)} belongs to another city.`);
      }
      for (const locationId of district.locationIds) {
        const location = locationById.get(locationId);
        if (!location || location.cityId !== pack.city.id || location.districtId !== district.id) {
          throw new Error(`District ${String(district.id)} points to an invalid location ${String(locationId)}.`);
        }
      }
    }

    for (const location of pack.locations) {
      if (location.cityId !== pack.city.id) {
        throw new Error(`Location ${String(location.id)} belongs to another city.`);
      }
      if (!packDistrictIds.has(String(location.districtId))) {
        throw new Error(`Location ${String(location.id)} points to a district outside its city pack.`);
      }
    }

    const arrivalLocation = locationById.get(pack.defaultArrivalLocationId);
    if (!arrivalLocation || arrivalLocation.cityId !== pack.city.id) {
      throw new Error(`City ${String(pack.city.id)} has an invalid default arrival location.`);
    }

    validateCityContent(pack);
  }

  const content: CityContent = {
    jobs: mergeUniqueById(packs, (pack) => pack.content.jobs, (entry) => String(entry.id)),
    housing: mergeUniqueById(packs, (pack) => pack.content.housing, (entry) => String(entry.id)),
    shops: mergeUniqueById(packs, (pack) => pack.content.shops, (entry) => String(entry.id)),
    educationPrograms: mergeUniqueById(packs, (pack) => pack.content.educationPrograms, (entry) => String(entry.id)),
    universities: mergeUniqueById(packs, (pack) => pack.content.universities, (entry) => String(entry.id)),
    degreePrograms: mergeUniqueById(packs, (pack) => pack.content.degreePrograms, (entry) => String(entry.id)),
    universitySubjects: mergeUniqueById(packs, (pack) => pack.content.universitySubjects, (entry) => String(entry.id)),
    medicalServices: mergeUniqueById(packs, (pack) => pack.content.medicalServices, (entry) => String(entry.id)),
    sportFacilityLocationIds: mergeUniqueById(packs, (pack) => pack.content.sportFacilityLocationIds, String),
    boxingGyms: mergeUniqueById(packs, (pack) => pack.content.boxingGyms, (entry) => String(entry.id)),
    boxingTrainers: mergeUniqueById(packs, (pack) => pack.content.boxingTrainers, (entry) => String(entry.id)),
    businessPremises: mergeUniqueById(packs, (pack) => pack.content.businessPremises, (entry) => String(entry.id)),
    careerCompanies: mergeUniqueById(packs, (pack) => pack.content.careerCompanies, (entry) => String(entry.id)),
    transportNodeLocationIds: mergeUniqueById(packs, (pack) => pack.content.transportNodeLocationIds, String),
    eventIds: mergeUniqueById(packs, (pack) => pack.content.eventIds, String)
  };

  return {
    packs: [...packs],
    cities,
    districts,
    locations,
    content,
    getPack: (cityId) => packByCityId.get(cityId),
    getCity: (cityId) => cityById.get(cityId),
    getDistrict: (districtId) => districtById.get(districtId),
    getLocation: (locationId) => locationId ? locationById.get(locationId) : undefined,
    getDefaultArrivalLocationId: (cityId) => packByCityId.get(cityId)?.defaultArrivalLocationId,
    getDistrictsForCity: (cityId) => [...(districtsByCityId.get(cityId) ?? [])],
    getLocationsForCity: (cityId) => [...(locationsByCityId.get(cityId) ?? [])],
    getLocationsForDistrict: (districtId) => [...(locationsByDistrictId.get(districtId) ?? [])],
    getContentForCity: (cityId) => packByCityId.get(cityId)?.content,
    getCompletenessForCity: (cityId) => completenessByCityId.get(cityId)
  };
}
