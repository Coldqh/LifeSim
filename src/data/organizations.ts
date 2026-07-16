import type { OrganizationDefinition } from '../types/organization';
import type { OrganizationId } from '../types/ids';
import { careerCompanies } from './career/companies';
import { getAllJobs, getAllUniversities } from './cities/contentSelectors';
import { cityRegistry } from './cities';

const organizationId = (value: string) => value as OrganizationId;
const jobs = getAllJobs();
const universities = getAllUniversities();
const employerLocations = new Map<string, typeof jobs>();
for (const job of jobs) { const key = String(job.locationId); const entries = employerLocations.get(key) ?? []; entries.push(job); employerLocations.set(key, entries); }
const employerDefinitions: OrganizationDefinition[] = [];
for (const [rawLocationId, locationJobs] of employerLocations.entries()) {
  const location = cityRegistry.getLocation(locationJobs[0]?.locationId); if (!location) continue;
  const company = careerCompanies.find((entry) => locationJobs.some((job) => job.companyId === entry.id));
  const targetStaff = Math.max(3, locationJobs.length * 2);
  employerDefinitions.push({ id: organizationId(`organization_employer_${rawLocationId}`), kind: 'employer', name: company?.name ?? location.name, cityId: location.cityId, locationId: location.id, companyId: company?.id, jobIds: locationJobs.map((job) => job.id), targetStaff, baseWeeklyRevenue: 70_000 + targetStaff * 12_000, baseWeeklyExpenses: 55_000 + targetStaff * 9_000 });
}
const universityDefinitions: OrganizationDefinition[] = universities.map((university) => ({ id: organizationId(`organization_university_${String(university.id)}`), kind: 'university', name: university.shortName, cityId: university.cityId, locationId: university.locationId, universityId: university.id, targetStaff: 12, baseWeeklyRevenue: 210_000, baseWeeklyExpenses: 185_000 }));
const commerceDefinitions: OrganizationDefinition[] = cityRegistry.locations.filter((location) => Boolean(location.shopId)).map((location) => { const targetStaff = location.type === 'mall' || location.type === 'food_court' ? 8 : location.type === 'restaurant' ? 6 : 4; return { id: organizationId(`organization_commerce_${String(location.id)}`), kind: 'commerce' as const, name: location.name, cityId: location.cityId, locationId: location.id, targetStaff, baseWeeklyRevenue: 45_000 + targetStaff * 11_000, baseWeeklyExpenses: 38_000 + targetStaff * 8_500 }; });
export const organizationDefinitions: OrganizationDefinition[] = [...employerDefinitions, ...universityDefinitions, ...commerceDefinitions];
export function getOrganizationDefinitionById(id: OrganizationId | undefined) { return organizationDefinitions.find((entry) => entry.id === id); }
export function getOrganizationsForLocation(locationId: string | undefined) { return organizationDefinitions.filter((entry) => String(entry.locationId) === String(locationId)); }
export function getOrganizationForJob(jobId: string | undefined) { return organizationDefinitions.find((entry) => entry.kind === 'employer' && entry.jobIds?.some((id) => String(id) === String(jobId))); }
export function getOrganizationForUniversity(universityId: string | undefined) { return organizationDefinitions.find((entry) => entry.kind === 'university' && String(entry.universityId) === String(universityId)); }
export function getCommerceOrganizationForLocation(locationId: string | undefined) { return organizationDefinitions.find((entry) => entry.kind === 'commerce' && String(entry.locationId) === String(locationId)); }
