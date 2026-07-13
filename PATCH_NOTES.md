# LifeSim — Smartphone & Diegetic UI Vertical Slice

Overlay the contents of this archive onto `C:\LifeSim`.

## Included

- Diegetic smartphone shell with desktop side presentation and full-screen mobile mode.
- Home screen, notifications, messages, calendar, jobs and maps apps.
- Persistent phone state in the main save (`lifesim.gameState.v17`).
- Job application pipeline: submit → wait → invite/reject → calendar → in-person interview → employment.
- Job location route planning and transport selection through the phone.
- Existing city vacancy buttons now open the vacancy in the phone instead of hiring instantly.

## Verification

- `npm run verify:lock`
- `npm run typecheck`
- `npm run build`
