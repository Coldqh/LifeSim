import { describe, expect, it } from 'vitest';
import { businessPremises } from '../business/premises';
import { careerCompanies, professionalJobs } from '../career';
import { rybinskBusinessPremises } from '../business/rybinskPremises';
import { basicEducationPrograms } from '../education/basicPrograms';
import {
  rybinskDegreePrograms,
  rybinskEducationPrograms,
  rybinskUniversities,
  rybinskUniversitySubjects
} from '../education/rybinskEducation';
import { degreePrograms, universities, universitySubjects } from '../education/universities';
import { medicalServices } from '../healthcare/services';
import { rybinskMedicalServices } from '../healthcare/rybinskServices';
import { basicHousing } from '../housing/basicHousing';
import { rybinskHousing } from '../housing/rybinskHousing';
import { basicJobs } from '../jobs/basicJobs';
import { rybinskJobs } from '../jobs/rybinskJobs';
import { basicShops } from '../shops/basicShops';
import { boxingGyms } from '../sports/boxingGyms';
import { boxingTrainers } from '../sports/boxingTrainers';
import { rybinskBoxingGyms, rybinskBoxingTrainers } from '../sports/rybinskBoxing';
import {
  getAllBoxingGyms,
  getAllBoxingTrainers,
  getAllBusinessPremises,
  getAllCareerCompanies,
  getAllDegreePrograms,
  getAllEducationPrograms,
  getAllHousing,
  getAllJobs,
  getAllMedicalServices,
  getAllShops,
  getAllUniversities,
  getAllUniversitySubjects,
  getBoxingGymById,
  getBoxingTrainerById,
  getBusinessPremisesById,
  getCareerCompanyById,
  getDegreeProgramById,
  getEducationProgramById,
  getHousingById,
  getJobById,
  getJobsForCity,
  getJobsForLocation,
  getMedicalServiceById,
  getShopById,
  getUniversityById,
  getUniversitySubjectById
} from './contentSelectors';
import { cityRegistry, moscowCity, rybinskCity, yaroslavlCity } from './index';

const ids = <T extends { id: unknown }>(values: readonly T[]) => values.map((entry) => String(entry.id));

describe('city content selectors', () => {
  it('preserves legacy catalogue order and appends Rybinsk content', () => {
    expect(new Set(ids(getAllJobs()))).toEqual(new Set([...ids(basicJobs), ...ids(rybinskJobs), ...ids(professionalJobs)]));
    expect(getAllJobs()).toHaveLength(new Set([...ids(basicJobs), ...ids(rybinskJobs), ...ids(professionalJobs)]).size);
    expect(ids(getAllHousing())).toEqual([...ids(basicHousing), ...ids(rybinskHousing)]);
    expect(ids(getAllShops())).toEqual(ids(basicShops));
    expect(ids(getAllEducationPrograms())).toEqual([...ids(basicEducationPrograms), ...ids(rybinskEducationPrograms)]);
    expect(ids(getAllUniversities())).toEqual([...ids(universities), ...ids(rybinskUniversities)]);
    expect(ids(getAllDegreePrograms())).toEqual([...ids(degreePrograms), ...ids(rybinskDegreePrograms)]);
    expect(ids(getAllUniversitySubjects())).toEqual([...ids(universitySubjects), ...ids(rybinskUniversitySubjects)]);
    expect(ids(getAllMedicalServices())).toEqual([...ids(medicalServices), ...ids(rybinskMedicalServices)]);
    expect(ids(getAllBoxingGyms())).toEqual([...ids(boxingGyms), ...ids(rybinskBoxingGyms)]);
    expect(ids(getAllBoxingTrainers())).toEqual([...ids(boxingTrainers), ...ids(rybinskBoxingTrainers)]);
    expect(ids(getAllBusinessPremises())).toEqual([...ids(businessPremises), ...ids(rybinskBusinessPremises)]);
    expect(ids(getAllCareerCompanies())).toEqual(ids(careerCompanies));
  });

  it('scopes jobs through the registered city packs', () => {
    const moscowJobs = getJobsForCity(moscowCity.id);
    const yaroslavlJobs = getJobsForCity(yaroslavlCity.id);
    const rybinskJobsForCity = getJobsForCity(rybinskCity.id);

    expect(moscowJobs.length).toBeGreaterThan(0);
    expect(yaroslavlJobs.length).toBeGreaterThan(0);
    expect(rybinskJobsForCity.length).toBeGreaterThan(0);
    expect(moscowJobs.every((job) => cityRegistry.getLocation(job.locationId)?.cityId === moscowCity.id)).toBe(true);
    expect(yaroslavlJobs.every((job) => cityRegistry.getLocation(job.locationId)?.cityId === yaroslavlCity.id)).toBe(true);
    expect(rybinskJobsForCity.every((job) => cityRegistry.getLocation(job.locationId)?.cityId === rybinskCity.id)).toBe(true);
    expect(getJobsForLocation(rybinskJobsForCity[0]?.locationId).map((job) => job.id)).toContain(rybinskJobsForCity[0]?.id);
  });

  it('resolves runtime definitions from the city registry catalogues', () => {
    const job = getAllJobs()[0];
    const housing = getAllHousing()[0];
    const shop = getAllShops()[0];
    const course = getAllEducationPrograms()[0];
    const university = getAllUniversities()[0];
    const degree = getAllDegreePrograms()[0];
    const subject = getAllUniversitySubjects()[0];
    const service = getAllMedicalServices()[0];
    const gym = getAllBoxingGyms()[0];
    const trainer = getAllBoxingTrainers()[0];
    const premises = getAllBusinessPremises()[0];
    const company = getAllCareerCompanies()[0];

    expect(getJobById(job?.id)).toBe(job);
    expect(getHousingById(housing?.id)).toBe(housing);
    expect(getShopById(shop?.id)).toBe(shop);
    expect(getEducationProgramById(course?.id)).toBe(course);
    expect(getUniversityById(university?.id)).toBe(university);
    expect(getDegreeProgramById(degree?.id)).toBe(degree);
    expect(getUniversitySubjectById(subject?.id)).toBe(subject);
    expect(getMedicalServiceById(service?.id)).toBe(service);
    expect(getBoxingGymById(gym?.id)).toBe(gym);
    expect(getBoxingTrainerById(trainer?.id)).toBe(trainer);
    expect(getBusinessPremisesById(premises?.id)).toBe(premises);
    expect(getCareerCompanyById(company?.id)).toBe(company);
  });
});
