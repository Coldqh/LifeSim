export type Brand<TValue, TBrand extends string> = TValue & { readonly __brand: TBrand };

export type PlayerId = Brand<string, 'PlayerId'>;
export type CountryId = Brand<string, 'CountryId'>;
export type CityId = Brand<string, 'CityId'>;
export type DistrictId = Brand<string, 'DistrictId'>;
export type LocationId = Brand<string, 'LocationId'>;
export type ShopId = Brand<string, 'ShopId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type JobId = Brand<string, 'JobId'>;
export type SkillId = Brand<string, 'SkillId'>;
export type EducationProgramId = Brand<string, 'EducationProgramId'>;
export type SportId = Brand<string, 'SportId'>;
export type LeagueId = Brand<string, 'LeagueId'>;
export type EventId = Brand<string, 'EventId'>;
export type ActionId = Brand<string, 'ActionId'>;
