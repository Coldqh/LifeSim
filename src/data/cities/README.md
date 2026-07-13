# Adding a city

A city is registered as one `CityContentPack`. The registry builds indexed city, district and location catalogues and validates all references when the app starts.

## 1. Create city data

Create the city, its districts and locations in the existing `cities/`, `districts/` and `locations/` folders.

## 2. Register one pack

Add one entry to `src/data/cities/index.ts`:

```ts
defineCityContentPack({
  city: newCity,
  districts: newCityDistricts,
  locations: newCityLocations,
  defaultArrivalLocationId: 'new_city_main_station' as LocationId
})
```

The default arrival location is used by car travel and future route integrations.

## 3. Connect the city

In `src/data/intercity/routes.ts`:

- use `createScheduledRoutePair(...)` for train or bus routes in both directions;
- use `createBidirectionalRoadConnections(...)` for car travel;
- add temporary accommodation only when the city needs it.

No selector, controller or phone UI changes are required for additional destinations.
