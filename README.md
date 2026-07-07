# LifeSim

LifeSim is a scalable life RPG / management simulator about a young adult living in a large city.

## Current patch

Architecture baseline only.

## Boundaries

- `src/core/` — pure game systems.
- `src/types/` — domain contracts and shared types.
- `src/data/` — structured game data.
- `src/content/` — player-facing text and scenario material.
- `src/state/` — current player, world, time and UI state.
- `src/ui/` — presentation and user input.

## Scripts

```bash
npm run dev
npm run typecheck
npm run build
```
