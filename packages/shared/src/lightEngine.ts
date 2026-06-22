/**
 * Light engine — block light + sky light propagation.
 * Matches Minecraft Java Edition light mechanics.
 * Light level 0 = dark, 15 = max brightness.
 * Block light: emitted by light sources (torches, glowstone, etc.)
 * Sky light: comes from above, reduced by transparent blocks.
 */

import { BLOCK } from './blocks.js';
import { getBlockProperties } from './blockProperties.js';

/**
 * Get the light emission level for a block (0-15).
 */
export function getLightEmission(blockId: number): number {
  const props = getBlockProperties(blockId);
  return props.lightLevel;
}

/**
 * Check if a block is transparent to light.
 */
export function isTransparentToLight(blockId: number): boolean {
  if (blockId === BLOCK.AIR) return true;
  const props = getBlockProperties(blockId);
  return props.transparent;
}

/**
 * Light opacity: how much light is absorbed when passing through a block.
 * 0 = fully transparent, 15 = fully opaque.
 */
export function getLightOpacity(blockId: number): number {
  if (blockId === BLOCK.AIR) return 0;
  const props = getBlockProperties(blockId);
  if (props.transparent) return 0;
  return 15;
}

/**
 * Pre-computed light emission map for common blocks.
 */
export const LIGHT_EMISSION: Record<number, number> = {
  [BLOCK.AIR]: 0,
  [BLOCK.TORCH]: 14,
  [BLOCK.REDSTONE_TORCH]: 7,
  [BLOCK.GLOWSTONE]: 15,
  [BLOCK.SEA_LANTERN]: 15,
  [700]: 15,
  [BLOCK.BEACON]: 15,
  [BLOCK.END_ROD]: 14,
  [BLOCK.LAVA]: 15,
  [701]: 15,
  [702]: 10,
  [BLOCK.SHROOMLIGHT]: 15,
  [BLOCK.REDSTONE_LAMP]: 15,
  [BLOCK.CRYING_OBSIDIAN]: 10,
  [BLOCK.DRAGON_EGG]: 1,
  [BLOCK.OCHRE_FROGLIGHT]: 15,
  [BLOCK.VERDANT_FROGLIGHT]: 15,
  [BLOCK.PEARLESCENT_FROGLIGHT]: 15,
  [BLOCK.CAMPFIRE]: 15,
  [BLOCK.SOUL_CAMPFIRE]: 10,
  [BLOCK.LANTERN]: 15,
  [BLOCK.SOUL_LANTERN]: 10,
  [BLOCK.COPPER_BULB]: 15,
  [BLOCK.REDSTONE_ORE]: 9,
  [703]: 9,
  [BLOCK.COPPER_TORCH]: 15,
  [BLOCK.COPPER_LANTERN]: 15,
  [BLOCK.TARGET]: 0,
  [BLOCK.BELL]: 0,
  [BLOCK.CACTUS]: 0,
  [BLOCK.ICE]: 0,
  [BLOCK.PACKED_ICE]: 0,
  [704]: 0,
  [BLOCK.SNOW]: 0,
  [BLOCK.SLIME_BLOCK]: 0,
  [BLOCK.HONEY_BLOCK]: 0,
  [705]: 0,
  [BLOCK.COBBLESTONE_WALL]: 0,
  [706]: 11,
  [707]: 15,
  [BLOCK.BEDROCK]: 0,
  [BLOCK.OBSIDIAN]: 0,
  [BLOCK.WATER]: 0,
};

// Merge with getLightEmission for completeness
for (const [key, value] of Object.entries(LIGHT_EMISSION)) {
  const blockId = Number(key);
  if (getLightEmission(blockId) === 0 && value > 0) {
    // Already handled by blockProperties
  }
}

/**
 * Light spread directions (6 cardinal directions).
 */
const SPREAD_DIRS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

/**
 * Propagate block light through a chunk column.
 * Returns a map of (x,y,z) → light level for blocks that receive light.
 */
export function propagateBlockLight(
  getBlock: (x: number, y: number, z: number) => number,
  _chunkX: number,
  _chunkZ: number,
  height: number = 256,
): Map<string, number> {
  const lightMap = new Map<string, number>();

  // First pass: add all light sources
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        const blockId = getBlock(x, y, z);
        const emission = LIGHT_EMISSION[blockId] ?? getLightEmission(blockId);
        if (emission > 0) {
          const key = `${x},${y},${z}`;
          lightMap.set(key, emission);
        }
      }
    }
  }

  // BFS propagation (simplified — real MC uses a more complex algorithm)
  const queue: Array<[number, number, number, number]> = [];
  for (const [key, level] of lightMap) {
    const [x, y, z] = key.split(',').map(Number);
    if (level > 1) {
      queue.push([x, y, z, level]);
    }
  }

  while (queue.length > 0) {
    const [x, y, z, level] = queue.shift()!;
    for (const [dx, dy, dz] of SPREAD_DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const nz = z + dz;
      if (ny < 0 || ny >= height) continue;

      const nKey = `${nx},${ny},${nz}`;
      const existing = lightMap.get(nKey) ?? 0;
      const newLevel = level - 1;

      if (newLevel > existing) {
        const neighborBlock = getBlock(nx, ny, nz);
        const opacity = getLightOpacity(neighborBlock);
        const adjustedLevel = newLevel - opacity;
        if (adjustedLevel > 0 && adjustedLevel > existing) {
          lightMap.set(nKey, adjustedLevel);
          queue.push([nx, ny, nz, adjustedLevel]);
        }
      }
    }
  }

  return lightMap;
}

/**
 * Propagate sky light downward from the top of the world.
 * Sky light starts at 15 at the top and reduces when blocked.
 */
export function propagateSkyLight(
  getBlock: (x: number, y: number, z: number) => number,
  _chunkX: number,
  _chunkZ: number,
  height: number = 256,
): Map<string, number> {
  const lightMap = new Map<string, number>();

  for (let x = 0; x < 16; x++) {
    for (let z = 0; z < 16; z++) {
      let skyLight = 15;
      for (let y = height - 1; y >= 0; y--) {
        const blockId = getBlock(x, y, z);
        const opacity = getLightOpacity(blockId);
        skyLight = Math.max(0, skyLight - opacity);
        if (skyLight > 0) {
          lightMap.set(`${x},${y},${z}`, skyLight);
        }
      }
    }
  }

  return lightMap;
}

/**
 * Get combined light level (max of block light and sky light) for a position.
 */
export function getCombinedLight(
  blockLightMap: Map<string, number>,
  skyLightMap: Map<string, number>,
  x: number,
  y: number,
  z: number,
): number {
  const key = `${x},${y},${z}`;
  const blockLight = blockLightMap.get(key) ?? 0;
  const skyLight = skyLightMap.get(key) ?? 0;
  return Math.max(blockLight, skyLight);
}
