# LifeSim — Personal Finance, Banking & Payments Vertical Slice

## Patch type

FEATURE_MVP + UI/UX INTEGRATION

## Included

- personal bank account, cash, savings and pending salary;
- weekly salary payout instead of instant shift income;
- transaction history with categories;
- savings goals and automatic salary saving;
- upcoming housing and business payments;
- debt summary from housing and business;
- Bank app inside the diegetic phone;
- desktop navigation moved into a slide-out drawer;
- phone launcher no longer covers main navigation;
- interactive Moscow SVG map with Presnya, Tverskoy, Khamovniki and Danilovsky;
- district click opens travel options and uses existing travel controller;
- save migration to lifesim.gameState.v18.

## Install

Extract this archive over C:\LifeSim.

```powershell
cd C:\LifeSim; npm run verify:lock
cd C:\LifeSim; npm run typecheck
cd C:\LifeSim; npm run build
cd C:\LifeSim; npm run dev
```

## Commit

```powershell
cd C:\LifeSim; git status
cd C:\LifeSim; git add .
cd C:\LifeSim; git commit -m "feat: add personal finance and phone map"
cd C:\LifeSim; git push
```
