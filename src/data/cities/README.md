# Adding a city

A city is registered as one `CityContentPack`. The pack owns the city geometry and a content bundle for every city-scoped gameplay system. The registry indexes the pack, validates location references and exposes a completeness report before the game starts.

## 1. Create the city data

Create the city, districts, locations and domain data in their existing folders:

- jobs;
- housing;
- shops used by city locations;
- courses and universities;
- medical services;
- sport facilities;
- business premises;
- city events when available.

Reusable definitions such as products, shop templates, skills and generic sport rules remain shared global catalogues.

## 2. Create one pack file

Create `src/data/cities/<cityName>Pack.ts`:

```ts
export const newCityContentPack = defineCityContentPack({
  city: newCity,
  districts: newCityDistricts,
  locations: newCityLocations,
  defaultArrivalLocationId: 'new_city_main_station' as LocationId,
  content: buildCityContent({
    cityId: newCity.id,
    districts: newCityDistricts,
    locations: newCityLocations,
    jobs: newCityJobs,
    housing: newCityHousing,
    shops: sharedShopCatalogue,
    educationPrograms: newCityCourses,
    universities: newCityUniversities,
    degreePrograms: newCityDegreePrograms,
    universitySubjects: newCityUniversitySubjects,
    medicalServices: newCityMedicalServices,
    boxingGyms: newCityBoxingGyms,
    businessPremises: newCityBusinessPremises,
    eventIds: newCityEventIds
  })
});
```

The builder assigns entries through their city locations and university ownership. It also rejects unknown shop references and content that points outside the city.

## 3. Register the pack

Add the pack to `src/data/cities/index.ts`:

```ts
export const cityRegistry = createCityRegistry([
  moscowContentPack,
  yaroslavlContentPack,
  newCityContentPack
]);
```

The registry and completeness report require no UI changes. Runtime systems read through `src/data/cities/contentSelectors.ts`, while source catalogues remain responsible only for defining data.

## 4. Check completeness

```ts
cityRegistry.getCompletenessForCity(newCity.id);
```

The report covers:

- jobs;
- housing;
- shops;
- education;
- healthcare;
- sports;
- business;
- transport.

A missing category is allowed for a deliberately limited city, but it is visible in tests and development tools.

## 5. Connect the city

In `src/data/intercity/routes.ts`:

- use `createScheduledRoutePair(...)` for train or bus routes in both directions;
- use `createBidirectionalRoadConnections(...)` for car travel;
- add temporary accommodation only when the city needs it.

Use `getCityContentBundle(cityId)` for a complete city view, or the focused selectors such as `getJobsForCity`, `getHousingForCity`, `getMedicalServicesForCity` and `getBoxingGymsForCity`.

## Runtime access rule

Game state, commands, selectors and UI must not read the legacy global arrays directly. They use `contentSelectors.ts`. The original catalogue modules remain exported as authoring sources for pack construction and backward-compatible external imports.
