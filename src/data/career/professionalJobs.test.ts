import { describe, expect, it } from 'vitest';
import { cityRegistry } from '../cities';
import { getCareerCompanyById } from '../cities/contentSelectors';
import { professionalJobs } from './professionalJobs';

describe('professional career content', () => {
  it('registers professional vacancies with companies, interviews and degree requirements', () => {
    expect(professionalJobs.length).toBeGreaterThanOrEqual(5);

    for (const job of professionalJobs) {
      const location = cityRegistry.getLocation(job.locationId);
      const company = getCareerCompanyById(job.companyId);
      expect(location).toBeDefined();
      expect(company).toBeDefined();
      expect(company?.cityId).toBe(location?.cityId);
      expect(job.employmentType).toBe('professional');
      expect(job.applicationMode).toBe('interview');
      expect(job.probationDays).toBeGreaterThan(0);
      expect(
        (job.requirements?.acceptedDegreeProgramIds?.length ?? 0)
        + (job.requirements?.requiredCareerTags?.length ?? 0)
      ).toBeGreaterThan(0);
    }
  });
});
