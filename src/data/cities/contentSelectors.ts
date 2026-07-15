import type { CityId } from '../../types/ids';
import { cityRegistry } from './index';

export function getCityContentBundle(cityId: CityId) {
  const pack = cityRegistry.getPack(cityId);
  if (!pack) return undefined;

  return {
    pack,
    completeness: cityRegistry.getCompletenessForCity(cityId),
    jobs: [...pack.content.jobs],
    housing: [...pack.content.housing],
    shops: [...pack.content.shops],
    educationPrograms: [...pack.content.educationPrograms],
    universities: [...pack.content.universities],
    degreePrograms: [...pack.content.degreePrograms],
    medicalServices: [...pack.content.medicalServices],
    sportFacilities: pack.content.sportFacilityLocationIds
      .map((locationId) => cityRegistry.getLocation(locationId))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    boxingGyms: [...pack.content.boxingGyms],
    businessPremises: [...pack.content.businessPremises],
    transportNodes: pack.content.transportNodeLocationIds
      .map((locationId) => cityRegistry.getLocation(locationId))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    eventIds: [...pack.content.eventIds]
  };
}
