# Water current/pushing mechanics missing

- **Wiki URL:** https://minecraft.wiki/w/Water#Current
- **Gap type:** `completeness`
- **Priority:** P1

## Our implementation

`packages/shared/src/fluids.ts:31-76` — `getFlowDirection` computes a flow direction but is never called. There is no code that applies water current velocity to entities (players or mobs).

`packages/client/src/scene.ts:941-968` — `updatePlayer` has no water interaction. No water drag, no current-based velocity alteration.

## Wiki behavior

> "Water with a current pushes players and mobs at a speed of about 1.39 meters per second, or 25 blocks every 18 seconds."

> "The horizontal current in a water block is based on a vector sum of the flows to and from that block from its four horizontal neighbors... 16 horizontal directions are possible."

> "Swimming in water is considerably slower against currents, but faster when going with the current."

## Impact

Players can walk against water currents without any resistance. Water currents would be needed for water transport systems (boat highways, item elevators) and for realistic water behavior.
