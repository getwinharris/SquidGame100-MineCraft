/**
 * Fluid simulation — water and lava flow.
 * Matches Minecraft Java Edition fluid mechanics.
 * Water: flows 8 blocks horizontally, 4 downward, spreads thin.
 * Lava: flows 8 blocks in nether, 4 in overworld, destroys items.
 */

import { BLOCK } from './blocks.js';

export type FluidType = 'water' | 'lava' | 'none';

export interface FluidState {
  type: FluidType;
  level: number;  // 0-8 for water, 0-8 for lava (8 = source)
  falling: boolean;
}

/**
 * Get the fluid type for a block.
 */
export function getFluidType(blockId: number): FluidType {
  if (blockId === BLOCK.WATER || blockId === BLOCK.WATER_FLOWING) return 'water';
  if (blockId === BLOCK.LAVA || blockId === BLOCK.LAVA_FLOWING) return 'lava';
  return 'none';
}

/** Check if a block ID is any kind of water. */
export function isWater(blockId: number): boolean {
  return blockId === BLOCK.WATER || blockId === BLOCK.WATER_FLOWING;
}

/** Check if a block ID is any kind of lava. */
export function isLava(blockId: number): boolean {
  return blockId === BLOCK.LAVA || blockId === BLOCK.LAVA_FLOWING;
}

/**
 * Get the flow direction from a source block.
 * Returns null if not a fluid, or the direction to flow.
 */
export function getFlowDirection(
  getBlock: (x: number, y: number, z: number) => number,
  x: number,
  y: number,
  z: number,
): { dx: number; dy: number; dz: number } | null {
  const blockId = getBlock(x, y, z);
  const fluidType = getFluidType(blockId);
  if (fluidType === 'none') return null;

  // Check if there's a block below — if so, flow down
  const below = getBlock(x, y - 1, z);
  if (below === BLOCK.AIR || getFluidType(below) !== 'none') {
    return { dx: 0, dy: -1, dz: 0 };
  }

  // Find lowest neighboring level to determine horizontal flow
  let lowestLevel = 8;
  let bestDx = 0;
  let bestDz = 0;

  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
  ];

  for (const [dx, dz] of dirs) {
    const neighborId = getBlock(x + dx, y, z + dz);
    const neighborType = getFluidType(neighborId);
    if (neighborType === fluidType || neighborId === BLOCK.AIR) {
      const neighborLevel = neighborType === fluidType
        ? getFluidLevel(neighborId)
        : 0;
      if (neighborLevel < lowestLevel) {
        lowestLevel = neighborLevel;
        bestDx = dx;
        bestDz = dz;
      }
    }
  }

  if (bestDx !== 0 || bestDz !== 0) {
    return { dx: bestDx, dy: 0, dz: bestDz };
  }

  return null;
}

/**
 * Get fluid level for a block (1-8, 8 = source).
 */
export function getFluidLevel(blockId: number): number {
  if (blockId === BLOCK.WATER || blockId === BLOCK.LAVA) return 8;
  if (blockId === BLOCK.WATER_FLOWING || blockId === BLOCK.LAVA_FLOWING) return 7;
  return 0;
}

/**
 * Max horizontal flow distance for a fluid type.
 */
export function getMaxFlowDistance(fluidType: FluidType): number {
  switch (fluidType) {
    case 'water': return 7;
    case 'lava': return 4; // overworld; 8 in nether
    default: return 0;
  }
}

/**
 * Get the fluid block that should be placed at a given flow level.
 */
export function getFluidBlockAtLevel(fluidType: FluidType, level: number): number {
  if (level <= 0) return BLOCK.AIR;
  if (fluidType === 'water') return level >= 8 ? BLOCK.WATER : BLOCK.WATER_FLOWING;
  if (fluidType === 'lava') return level >= 8 ? BLOCK.LAVA : BLOCK.LAVA_FLOWING;
  return BLOCK.AIR;
}

/**
 * Check if a block should be destroyed by a fluid.
 */
export function isDestroyedByFluid(blockId: number, _fluidType: FluidType): boolean {
  // Air and other fluids are replaced, not destroyed
  if (blockId === BLOCK.AIR) return false;
  if (getFluidType(blockId) !== 'none') return false;

  // Most non-solid blocks are destroyed by flowing fluids
  if (blockId === BLOCK.TORCH) return true;
  if (blockId === BLOCK.REDSTONE_TORCH) return true;
  if (blockId === BLOCK.WHEAT) return true;
  if (blockId === BLOCK.CARROT) return true;
  if (blockId === BLOCK.POTATO) return true;
  if (blockId === BLOCK.BEETROOT) return true;
  if (blockId === BLOCK.SOUL_SAND) return false;
  if (blockId === BLOCK.OBSIDIAN) return false;

  return false;
}

/**
 * Check if water should create cobblestone (water + flowing lava, lateral contact).
 */
export function createsCobblestone(waterBlock: number, lavaBlock: number): boolean {
  return isWater(waterBlock) && lavaBlock === BLOCK.LAVA_FLOWING;
}

/**
 * Check if lava flowing down onto water should create stone.
 */
export function createsStone(lavaBlock: number): boolean {
  return lavaBlock === BLOCK.LAVA_FLOWING;
}

/**
 * Check if water should turn lava source into obsidian (water + lava source).
 */
export function createsObsidian(waterBlock: number, lavaBlock: number): boolean {
  return isWater(waterBlock) && lavaBlock === BLOCK.LAVA;
}

/**
 * Simulate one tick of fluid flow.
 * Returns a list of block updates to apply.
 */
export function tickFluid(
  getBlock: (x: number, y: number, z: number) => number,
  x: number,
  y: number,
  z: number,
): Array<{ x: number; y: number; z: number; blockId: number }> {
  const updates: Array<{ x: number; y: number; z: number; blockId: number }> = [];
  const blockId = getBlock(x, y, z);
  const fluidType = getFluidType(blockId);

  if (fluidType === 'none') return updates;

  // Try flowing down first
  const below = getBlock(x, y - 1, z);
  if (below === BLOCK.AIR) {
    updates.push({ x, y: y - 1, z, blockId: getFluidBlockAtLevel(fluidType, 8) });
    return updates;
  }

  // Flow horizontally
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dx, dz] of dirs) {
    const nx = x + dx;
    const nz = z + dz;
    const neighborId = getBlock(nx, y, nz);
    if (neighborId === BLOCK.AIR) {
      const newLevel = 7; // flowing block has level 7
      if (newLevel > 0) {
        updates.push({ x: nx, y, z: nz, blockId: getFluidBlockAtLevel(fluidType, newLevel) });
      }
    }
  }

  return updates;
}
