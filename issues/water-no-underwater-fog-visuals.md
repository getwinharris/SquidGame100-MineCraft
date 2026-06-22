# No underwater fog or visual effects

- **Wiki URL:** https://minecraft.wiki/w/Water#Fog and https://minecraft.wiki/w/Water#Appearance
- **Gap type:** `completeness`
- **Priority:** P2

## Our implementation

`packages/client/src/scene.ts` — no code adjusts fog, render distance, or color when the camera is below water level. No check for the player's head being in a water block.

## Wiki behavior

> "When the camera is inside water, a special fog effect is applied. Initially, this fog is very dense and blocks almost 100% of the view, but it gradually changes to a static fog distance during 30 seconds. The color and view distance are dependent of the biome."

> "The Night Vision and Conduit Power effects increase underwater visibility."

## Impact

Underwater view is the same as above-water view — no fog, no color shift, no visibility reduction. This removes the claustrophobic underwater feel and makes underwater navigation trivial.
