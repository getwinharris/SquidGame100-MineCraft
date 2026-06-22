# P1: Glass block hardness wrong (1 instead of 0.3)

**Wiki URL:** https://minecraft.wiki/w/Glass
**Gap type:** correctness
**Priority:** P1

## Implementation behavior

In `blockProperties.ts`, glass has `hardness: 1`.

## Wiki behavior

Glass has hardness 0.3 on the wiki. This makes glass break fairly quickly with any tool, but not instantly by hand (instantly with Efficiency V diamond/netherite or gold+haste).

## Impact

Glass takes too long to mine. It should break in ~1 second by hand, but our code makes it comparable to stone (hardness 1.5). This affects building with glass and breaking windows.
