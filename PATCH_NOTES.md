# LifeSim — Vehicles & Ownership Vertical Slice

## Patch Type
FEATURE_MVP

## Added
- Phone app `Авто` with a used-car marketplace styled as Auto.ru.
- Seven persistent used-car listings with inspection, hidden defects and market refresh.
- Eight new-car offers split between mass-market and premium physical dealerships.
- Real vehicle model names from LADA Granta through Mercedes-Benz S-Class and Porsche Cayenne.
- One owned vehicle with fuel, odometer, condition, reliability, defects, parking location and service interval.
- Personal car transport option for location and district travel.
- Fuel consumption, paid parking, gas stations, maintenance and resale.
- Seven new Moscow automotive locations inside existing districts.
- Save migration from v18 to v19.

## Balance Note
Vehicle prices, specifications, fuel prices, service costs and reliability are gameplay values. They are approximate and are not a live market quotation.

## Verification
- npm run typecheck — PASS
- npm run verify:lock — PASS
- npm run build — PASS
- vehicle core smoke test — PASS
