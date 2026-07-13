# LifeSim — Friendships, Dating & Social Circles Vertical Slice

## Included

- Contact exchange with persistent NPCs after sufficient familiarity.
- Phone Contacts app with filters, relationship state, circles and conversation history.
- Quick messages with cooldowns and relationship effects.
- Seven meeting types: coffee, walk, training, study, restaurant, home evening and date.
- Outgoing invitations, NPC replies, NPC-initiated invitations and calendar integration.
- Physical meetings tied to a location, time, money and player condition.
- Friendship and romance progression with persistent memories and consequences.
- Missed meetings, late cancellations, reminders and relationship penalties.
- Home comfort bonus for home meetings.
- Save migration to `lifesim.gameState.v23`.

## Verification

- `npm run verify:lock` — PASS
- `npm run typecheck` — PASS
- `npm run build` — PASS
- Social-life core smoke test — PASS

## Known technical note

- Production build succeeds, but Vite still warns that the main JS chunk is above 500 kB. Phone apps should be split with lazy loading in a separate architecture patch.

## Suggested commit

`feat: add friendships dating and social circles`
