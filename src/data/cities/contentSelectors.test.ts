import { describe, expect, it } from 'vitest';
import { businessPremises } from '../business/premises';
import { basicEducationPrograms } from '../education/basicPrograms';
import { degreePrograms, universities, universitySubjects } from '../education/universities';
import { medicalServices } from '../healthcare/services';
import { basicHousing } from '../housing/basicHousing';
import { basicJobs } from '../jobs/basicJobs';
import { basicShops } from '../shops/basicShops';
import { boxingGyms } from '../sports/boxingGyms';
import {
  getAllBoxingGyms,
  getAllBusinessPremises,
  getAllDegreePrograms,
  getAllEducationPrograms,
  getAllHousing,
  getAllJobs,
  getAllMedicalServices,
  getAllShops,
  getAllUniversities,
  getAllUniversitySubjects,
  getBoxingGymById,
  getBusinessPremisesById,
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
import { cityRegistry, moscowCity, yaroslavlCity } from './index';

const ids = <T extends { id: unknown }>(values: readonly T[]) => values.map((entry) => String(entry.id));

describe('city content selectors', () => {
  it('preserves the current aggregate catalogue order and contents', () => {
    expect(ids(getAllJobs())).toEqual(ids(basicJobs));
    expect(ids(getAllHousing())).toEqual(ids(basicHousing));
    expect(ids(getAllShops())).toEqual(ids(basicShops));
    expect(ids(getAllEducationPrograms())).toEqual(ids(basicEducationPrograms));
    expect(ids(getAllUniversities())).toEqual(ids(universities));
    expect(ids(getAllDegreePrograms())).toEqual(ids(degreePrograms));
    expect(ids(getAllUniversitySubjects())).toEqual(ids(universitySubjects));
    expect(ids(getAllMedicalServices())).toEqual(ids(medicalServices));
    expect(ids(getAllBoxingGyms())).toEqual(ids(boxingGyms));
    expect(ids(getAllBusinessPremises())).toEqual(ids(businessPremises));
  });

  it('scopes jobs through the registered city packs', () => {
    const moscowJobs = getJobsForCity(moscowCity.id);
    const yaroslavlJobs = getJobsForCity(yaroslavlCity.id);

    expect(moscowJobs.length).toBeGreaterThan(0);
    expect(yaroslavlJobs.length).toBeGreaterThan(0);
    expect(moscowJobs.every((job) => cityRegistry.getLocation(job.locationId)?.cityId === moscowCity.id)).toBe(true);
    expect(yaroslavlJobs.every((job) => cityRegistry.getLocation(job.locationId)?.cityId === yaroslavlCity.id)).toBe(true);
    expect(getJobsForLocation(yaroslavlJobs[0]?.locationId).map((job) => job.id)).toContain(yaroslavlJobs[0]?.id);
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
    const premises = getAllBusinessPremises()[0];

    expect(getJobById(job?.id)).toBe(job);
    expect(getHousingById(housing?.id)).toBe(housing);
    expect(getShopById(shop?.id)).toBe(shop);
    expect(getEducationProgramById(course?.id)).toBe(course);
    expect(getUniversityById(university?.id)).toBe(university);
    expect(getDegreeProgramById(degree?.id)).toBe(degree);
    expect(getUniversitySubjectById(subject?.id)).toBe(subject);
    expect(getMedicalServiceById(service?.id)).toBe(service);
    expect(getBoxingGymById(gym?.id)).toBe(gym);
    expect(getBusinessPremisesById(premises?.id)).toBe(premises);
  });
});
