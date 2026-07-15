import type { BoxingGym } from '../../types/boxing';
import type { BusinessPremises } from '../../types/business';
import type { EducationProgram } from '../../types/education';
import type { MedicalService } from '../../types/healthcare';
import type {
  BoxingGymId,
  BusinessPremisesId,
  CityId,
  DegreeProgramId,
  EducationProgramId,
  JobId,
  LocationId,
  MedicalServiceId,
  ShopId,
  UniversityId,
  UniversitySubjectId
} from '../../types/ids';
import type { Housing, HousingId } from '../../types/housing';
import type { Job } from '../../types/job';
import type { Shop } from '../../types/product';
import type {
  DegreeProgramDefinition,
  UniversityDefinition,
  UniversitySubjectDefinition
} from '../../types/university';
import { cityRegistry } from './index';

function copy<T>(values: readonly T[]): T[] {
  return [...values];
}

function createIdIndex<T>(values: readonly T[], getId: (value: T) => string): ReadonlyMap<string, T> {
  return new Map(values.map((value) => [getId(value), value]));
}

const jobsById = createIdIndex(cityRegistry.content.jobs, (entry) => String(entry.id));
const housingById = createIdIndex(cityRegistry.content.housing, (entry) => String(entry.id));
const shopsById = createIdIndex(cityRegistry.content.shops, (entry) => String(entry.id));
const educationProgramsById = createIdIndex(cityRegistry.content.educationPrograms, (entry) => String(entry.id));
const universitiesById = createIdIndex(cityRegistry.content.universities, (entry) => String(entry.id));
const degreeProgramsById = createIdIndex(cityRegistry.content.degreePrograms, (entry) => String(entry.id));
const universitySubjectsById = createIdIndex(cityRegistry.content.universitySubjects, (entry) => String(entry.id));
const medicalServicesById = createIdIndex(cityRegistry.content.medicalServices, (entry) => String(entry.id));
const boxingGymsById = createIdIndex(cityRegistry.content.boxingGyms, (entry) => String(entry.id));
const businessPremisesById = createIdIndex(cityRegistry.content.businessPremises, (entry) => String(entry.id));

export function getCityContentBundle(cityId: CityId) {
  const pack = cityRegistry.getPack(cityId);
  if (!pack) return undefined;

  return {
    pack,
    completeness: cityRegistry.getCompletenessForCity(cityId),
    jobs: copy(pack.content.jobs),
    housing: copy(pack.content.housing),
    shops: copy(pack.content.shops),
    educationPrograms: copy(pack.content.educationPrograms),
    universities: copy(pack.content.universities),
    degreePrograms: copy(pack.content.degreePrograms),
    universitySubjects: copy(pack.content.universitySubjects),
    medicalServices: copy(pack.content.medicalServices),
    sportFacilities: pack.content.sportFacilityLocationIds
      .map((locationId) => cityRegistry.getLocation(locationId))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    boxingGyms: copy(pack.content.boxingGyms),
    businessPremises: copy(pack.content.businessPremises),
    transportNodes: pack.content.transportNodeLocationIds
      .map((locationId) => cityRegistry.getLocation(locationId))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    eventIds: copy(pack.content.eventIds)
  };
}

export const getAllJobs = (): Job[] => copy(cityRegistry.content.jobs);
export const getJobsForCity = (cityId: CityId): Job[] => copy(cityRegistry.getContentForCity(cityId)?.jobs ?? []);
export const getJobsForLocation = (locationId: LocationId | undefined): Job[] => locationId
  ? cityRegistry.content.jobs.filter((job) => job.locationId === locationId)
  : [];
export const getJobById = (jobId: JobId | undefined): Job | undefined => jobId
  ? jobsById.get(String(jobId))
  : undefined;

export const getAllHousing = (): Housing[] => copy(cityRegistry.content.housing);
export const getHousingForCity = (cityId: CityId): Housing[] => copy(cityRegistry.getContentForCity(cityId)?.housing ?? []);
export const getHousingForLocation = (locationId: LocationId | undefined): Housing | undefined => locationId
  ? cityRegistry.content.housing.find((housing) => housing.locationId === locationId)
  : undefined;
export const getHousingById = (housingId: HousingId | undefined): Housing | undefined => housingId
  ? housingById.get(String(housingId))
  : undefined;

export const getAllShops = (): Shop[] => copy(cityRegistry.content.shops);
export const getShopsForCity = (cityId: CityId): Shop[] => copy(cityRegistry.getContentForCity(cityId)?.shops ?? []);
export const getShopById = (shopId: ShopId | undefined): Shop | undefined => shopId
  ? shopsById.get(String(shopId))
  : undefined;

export const getAllEducationPrograms = (): EducationProgram[] => copy(cityRegistry.content.educationPrograms);
export const getEducationProgramsForCity = (cityId: CityId): EducationProgram[] => copy(cityRegistry.getContentForCity(cityId)?.educationPrograms ?? []);
export const getEducationProgramsForLocation = (locationId: LocationId | undefined): EducationProgram[] => locationId
  ? cityRegistry.content.educationPrograms.filter((program) => program.locationId === locationId)
  : [];
export const getEducationProgramById = (programId: EducationProgramId | undefined): EducationProgram | undefined => programId
  ? educationProgramsById.get(String(programId))
  : undefined;

export const getAllUniversities = (): UniversityDefinition[] => copy(cityRegistry.content.universities);
export const getUniversitiesForCity = (cityId: CityId): UniversityDefinition[] => copy(cityRegistry.getContentForCity(cityId)?.universities ?? []);
export const getUniversityById = (universityId: UniversityId | undefined): UniversityDefinition | undefined => universityId
  ? universitiesById.get(String(universityId))
  : undefined;

export const getAllDegreePrograms = (): DegreeProgramDefinition[] => copy(cityRegistry.content.degreePrograms);
export const getDegreeProgramsForCity = (cityId: CityId): DegreeProgramDefinition[] => copy(cityRegistry.getContentForCity(cityId)?.degreePrograms ?? []);
export const getDegreeProgramById = (programId: DegreeProgramId | undefined): DegreeProgramDefinition | undefined => programId
  ? degreeProgramsById.get(String(programId))
  : undefined;

export const getAllUniversitySubjects = (): UniversitySubjectDefinition[] => copy(cityRegistry.content.universitySubjects);
export const getUniversitySubjectsForCity = (cityId: CityId): UniversitySubjectDefinition[] => copy(cityRegistry.getContentForCity(cityId)?.universitySubjects ?? []);
export const getUniversitySubjectById = (subjectId: UniversitySubjectId | undefined): UniversitySubjectDefinition | undefined => subjectId
  ? universitySubjectsById.get(String(subjectId))
  : undefined;

export const getAllMedicalServices = (): MedicalService[] => copy(cityRegistry.content.medicalServices);
export const getMedicalServicesForCity = (cityId: CityId): MedicalService[] => copy(cityRegistry.getContentForCity(cityId)?.medicalServices ?? []);
export const getMedicalServiceById = (serviceId: MedicalServiceId | undefined): MedicalService | undefined => serviceId
  ? medicalServicesById.get(String(serviceId))
  : undefined;

export const getAllBoxingGyms = (): BoxingGym[] => copy(cityRegistry.content.boxingGyms);
export const getBoxingGymsForCity = (cityId: CityId): BoxingGym[] => copy(cityRegistry.getContentForCity(cityId)?.boxingGyms ?? []);
export const getBoxingGymById = (gymId: BoxingGymId | undefined): BoxingGym | undefined => gymId
  ? boxingGymsById.get(String(gymId))
  : undefined;
export const getBoxingGymByLocationId = (locationId: LocationId | undefined): BoxingGym | undefined => locationId
  ? cityRegistry.content.boxingGyms.find((gym) => gym.locationId === locationId)
  : undefined;

export const getAllBusinessPremises = (): BusinessPremises[] => copy(cityRegistry.content.businessPremises);
export const getBusinessPremisesForCity = (cityId: CityId): BusinessPremises[] => copy(cityRegistry.getContentForCity(cityId)?.businessPremises ?? []);
export const getBusinessPremisesById = (premisesId: BusinessPremisesId | undefined): BusinessPremises | undefined => premisesId
  ? businessPremisesById.get(String(premisesId))
  : undefined;
