/**
 * Self-check for water/lava interaction logic.
 * Minimal assert — no test framework.
 * Run: node packages/shared/src/fluids.test.ts
 */
import { createsCobblestone, createsObsidian, createsStone, isWater, isLava } from './fluids.js';
import { BLOCK } from './blocks.js';

let passed = 0;
let failed = 0;

function assert(cond: boolean, msg: string) {
  if (cond) passed++; else { failed++; console.error('FAIL:', msg); }
}

// isWater
assert(isWater(BLOCK.WATER), 'WATER is water');
assert(isWater(BLOCK.WATER_FLOWING), 'WATER_FLOWING is water');
assert(!isWater(BLOCK.LAVA), 'LAVA is not water');
assert(!isWater(BLOCK.STONE), 'STONE is not water');

// isLava
assert(isLava(BLOCK.LAVA), 'LAVA is lava');
assert(isLava(BLOCK.LAVA_FLOWING), 'LAVA_FLOWING is lava');
assert(!isLava(BLOCK.WATER), 'WATER is not lava');

// createsObsidian: water (any) + lava source
assert(createsObsidian(BLOCK.WATER, BLOCK.LAVA), 'WATER + LAVA source → obsidian');
assert(createsObsidian(BLOCK.WATER_FLOWING, BLOCK.LAVA), 'flowing WATER + LAVA source → obsidian');
assert(!createsObsidian(BLOCK.WATER, BLOCK.LAVA_FLOWING), 'WATER + flowing LAVA → not obsidian');
assert(!createsObsidian(BLOCK.AIR, BLOCK.LAVA), 'AIR + LAVA → not obsidian');

// createsCobblestone: water (any) + flowing lava (lateral)
assert(createsCobblestone(BLOCK.WATER, BLOCK.LAVA_FLOWING), 'WATER + flowing LAVA → cobblestone');
assert(createsCobblestone(BLOCK.WATER_FLOWING, BLOCK.LAVA_FLOWING), 'flowing both → cobblestone');
assert(!createsCobblestone(BLOCK.WATER, BLOCK.LAVA), 'WATER + LAVA source → not cobblestone');
assert(!createsCobblestone(BLOCK.AIR, BLOCK.LAVA_FLOWING), 'AIR + flowing LAVA → not cobblestone');

// createsStone: flowing lava above water (lava must be flowing)
assert(createsStone(BLOCK.LAVA_FLOWING), 'flowing LAVA → stone');
assert(!createsStone(BLOCK.LAVA), 'LAVA source → not stone');
assert(!createsStone(BLOCK.WATER), 'WATER → not stone');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
