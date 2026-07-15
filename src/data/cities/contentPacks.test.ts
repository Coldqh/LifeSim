import { describe, expect, it } from 'vitest';
import { getCityContentBundle } from './contentSelectors';
import { cityRegistry, moscowCity, rybinskCity, yaroslavlCity } from './index';

describe('registered city content packs', () => {
  it('resolves Moscow gameplay catalogues through one city pack', () => {
    const bundle = getCityContentBundle(moscowCity.id);

    expect(bundle).toBeDefined();
    expect(bundle?.jobs.length).toBeGreaterThan(0);
    expect(bundle?.shops.length).toBeGreaterThan(0);
    expect(bundle?.universities.length).toBeGreaterThan(0);
    expect(bundle?.universitySubjects.length).toBeGreaterThan(0);
    expect(bundle?.medicalServices.length).toBeGreaterThan(0);
    expect(bundle?.sportFacilities.length).toBeGreaterThan(0);
    expect(bundle?.boxingGyms.length).toBeGreaterThan(0);
    expect(bundle?.businessPremises.length).toBeGreaterThan(0);
    expect(bundle?.careerCompanies.length).toBeGreaterThan(0);
    expect(bundle?.transportNodes.length).toBeGreaterThan(0);
    expect(bundle?.completeness?.missingCategories).toEqual([]);
  });

  it('exposes Yaroslavl content and reports systems that still need content', () => {
    const bundle = getCityContentBundle(yaroslavlCity.id);

    expect(bundle).toBeDefined();
    expect(bundle?.jobs.length).toBeGreaterThan(0);
    expect(bundle?.shops.length).toBeGreaterThan(0);
    expect(bundle?.universities.length).toBeGreaterThan(0);
    expect(bundle?.degreePrograms.length).toBeGreaterThan(0);
    expect(bundle?.universitySubjects.length).toBeGreaterThan(0);
    expect(bundle?.careerCompanies.length).toBeGreaterThan(0);
    expect(bundle?.transportNodes.length).toBeGreaterThan(0);
    expect(bundle?.completeness?.missingCategories).toContain('healthcare');
    expect(bundle?.completeness?.missingCategories).toContain('business');
  });


  it('registers Rybinsk as a complete playable city pack', () => {
    const bundle = getCityContentBundle(rybinskCity.id);

    expect(bundle).toBeDefined();
    expect(bundle?.jobs.length).toBeGreaterThanOrEqual(8);
    expect(bundle?.housing.length).toBeGreaterThanOrEqual(6);
    expect(bundle?.universities.length).toBeGreaterThan(0);
    expect(bundle?.medicalServices.length).toBeGreaterThan(0);
    expect(bundle?.boxingGyms.length).toBeGreaterThan(0);
    expect(bundle?.businessPremises.length).toBeGreaterThan(0);
    expect(bundle?.careerCompanies.length).toBeGreaterThan(0);
    expect(bundle?.transportNodes.length).toBeGreaterThanOrEqual(2);
    expect(bundle?.completeness?.missingCategories).toEqual([]);
  });

  it('keeps aggregate content indexes deduplicated across city packs', () => {
    const shopIds = cityRegistry.content.shops.map((shop) => String(shop.id));

    expect(new Set(shopIds).size).toBe(shopIds.length);
    expect(cityRegistry.getContentForCity(moscowCity.id)).toBeDefined();
    expect(cityRegistry.getContentForCity(yaroslavlCity.id)).toBeDefined();
    expect(cityRegistry.getContentForCity(rybinskCity.id)).toBeDefined();
  });
});
