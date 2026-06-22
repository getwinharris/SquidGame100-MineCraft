/**
 * Block state properties — directional placement, door states, waterlogged, etc.
 * These properties determine how blocks can be placed and what states they track.
 */

import { BLOCK } from './blocks.js';

export type BlockStateProperty =
  | 'facing'
  | 'hinge'
  | 'open'
  | 'powered'
  | 'half'
  | 'waterlogged'
  | 'axis'
  | 'level'
  | 'age'
  | 'snowy'
  | 'type'
  | 'shape'
  | 'lit'
  | 'signal_fire'
  | 'has_bottle_0'
  | 'has_bottle_1'
  | 'has_bottle_2'
  | 'rotation'
  | 'conditional'
  | 'extended'
  | 'disarmed'
  | 'triggered'
  | 'eye'
  | 'inverted'
  | 'mode'
  | 'segments'
  | 'delay'
  | 'facing'
  | 'lit'
  | 'occupied'
  | 'part'
  | 'mode'
  | 'charges'
  | 'stage'
  | 'moisture'
  | 'distance'
  | 'persistent'
  | 'waterlogged'
  | 'thickness'
  | 'tip'
  | 'bud_powered';

export type Facing = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';
export type Axis = 'x' | 'y' | 'z';
export type Half = 'upper' | 'lower';
export type Hinge = 'left' | 'right';
export type SlabType = 'top' | 'bottom' | 'double';
export type StairShape = 'straight' | 'inner_left' | 'inner_right' | 'outer_left' | 'outer_right';
export type WallHeight = 'none' | 'low' | 'tall';

export interface BlockStateDef {
  blockId: number;
  properties: Record<string, string | number>;
  defaultState: Record<string, string | number>;
}

/**
 * Block state definitions for blocks that have special placement rules.
 */
export const BLOCK_STATE_DEFS: Record<number, {
  properties: string[];
  defaults: Record<string, string | number>;
  directional?: boolean;
  openable?: boolean;
  waterloggable?: boolean;
}> = {
  // === DOORS ===
  [BLOCK.OAK_DOOR]: {
    properties: ['facing', 'half', 'hinge', 'open', 'powered'],
    defaults: { facing: 'north', half: 'lower', hinge: 'left', open: 'false', powered: 'false' },
    directional: true,
    openable: true,
  },
  [BLOCK.IRON_DOOR]: {
    properties: ['facing', 'half', 'hinge', 'open', 'powered'],
    defaults: { facing: 'north', half: 'lower', hinge: 'left', open: 'false', powered: 'false' },
    directional: true,
    openable: true,
  },
  [BLOCK.SPRUCE_DOOR]: {
    properties: ['facing', 'half', 'hinge', 'open', 'powered'],
    defaults: { facing: 'north', half: 'lower', hinge: 'left', open: 'false', powered: 'false' },
    directional: true,
    openable: true,
  },
  [BLOCK.BIRCH_DOOR]: {
    properties: ['facing', 'half', 'hinge', 'open', 'powered'],
    defaults: { facing: 'north', half: 'lower', hinge: 'left', open: 'false', powered: 'false' },
    directional: true,
    openable: true,
  },
  [BLOCK.JUNGLE_DOOR]: {
    properties: ['facing', 'half', 'hinge', 'open', 'powered'],
    defaults: { facing: 'north', half: 'lower', hinge: 'left', open: 'false', powered: 'false' },
    directional: true,
    openable: true,
  },
  [BLOCK.ACACIA_DOOR]: {
    properties: ['facing', 'half', 'hinge', 'open', 'powered'],
    defaults: { facing: 'north', half: 'lower', hinge: 'left', open: 'false', powered: 'false' },
    directional: true,
    openable: true,
  },
  [BLOCK.DARK_OAK_DOOR]: {
    properties: ['facing', 'half', 'hinge', 'open', 'powered'],
    defaults: { facing: 'north', half: 'lower', hinge: 'left', open: 'false', powered: 'false' },
    directional: true,
    openable: true,
  },
  [BLOCK.CHERRY_DOOR]: {
    properties: ['facing', 'half', 'hinge', 'open', 'powered'],
    defaults: { facing: 'north', half: 'lower', hinge: 'left', open: 'false', powered: 'false' },
    directional: true,
    openable: true,
  },
  [BLOCK.BAMBOO_DOOR]: {
    properties: ['facing', 'half', 'hinge', 'open', 'powered'],
    defaults: { facing: 'north', half: 'lower', hinge: 'left', open: 'false', powered: 'false' },
    directional: true,
    openable: true,
  },
  [BLOCK.MANGROVE_DOOR]: {
    properties: ['facing', 'half', 'hinge', 'open', 'powered'],
    defaults: { facing: 'north', half: 'lower', hinge: 'left', open: 'false', powered: 'false' },
    directional: true,
    openable: true,
  },
  [BLOCK.CRIMSON_DOOR]: {
    properties: ['facing', 'half', 'hinge', 'open', 'powered'],
    defaults: { facing: 'north', half: 'lower', hinge: 'left', open: 'false', powered: 'false' },
    directional: true,
    openable: true,
  },
  [BLOCK.WARPED_DOOR]: {
    properties: ['facing', 'half', 'hinge', 'open', 'powered'],
    defaults: { facing: 'north', half: 'lower', hinge: 'left', open: 'false', powered: 'false' },
    directional: true,
    openable: true,
  },
  [BLOCK.COPPER_DOOR]: {
    properties: ['facing', 'half', 'hinge', 'open', 'powered'],
    defaults: { facing: 'north', half: 'lower', hinge: 'left', open: 'false', powered: 'false' },
    directional: true,
    openable: true,
  },

  // === TRAPDOORS ===
  [BLOCK.OAK_TRAPDOOR]: {
    properties: ['facing', 'half', 'open', 'powered', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', open: 'false', powered: 'false', waterlogged: 'false' },
    directional: true,
    openable: true,
    waterloggable: true,
  },
  [BLOCK.IRON_TRAPDOOR]: {
    properties: ['facing', 'half', 'open', 'powered', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', open: 'false', powered: 'false', waterlogged: 'false' },
    directional: true,
    openable: true,
    waterloggable: true,
  },
  [BLOCK.CHERRY_TRAPDOOR]: {
    properties: ['facing', 'half', 'open', 'powered', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', open: 'false', powered: 'false', waterlogged: 'false' },
    directional: true,
    openable: true,
    waterloggable: true,
  },
  [BLOCK.BAMBOO_TRAPDOOR]: {
    properties: ['facing', 'half', 'open', 'powered', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', open: 'false', powered: 'false', waterlogged: 'false' },
    directional: true,
    openable: true,
    waterloggable: true,
  },
  [BLOCK.CRIMSON_TRAPDOOR]: {
    properties: ['facing', 'half', 'open', 'powered', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', open: 'false', powered: 'false', waterlogged: 'false' },
    directional: true,
    openable: true,
    waterloggable: true,
  },
  [BLOCK.WARPED_TRAPDOOR]: {
    properties: ['facing', 'half', 'open', 'powered', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', open: 'false', powered: 'false', waterlogged: 'false' },
    directional: true,
    openable: true,
    waterloggable: true,
  },
  [BLOCK.SPRUCE_TRAPDOOR]: {
    properties: ['facing', 'half', 'open', 'powered', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', open: 'false', powered: 'false', waterlogged: 'false' },
    directional: true,
    openable: true,
    waterloggable: true,
  },
  [BLOCK.BIRCH_TRAPDOOR]: {
    properties: ['facing', 'half', 'open', 'powered', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', open: 'false', powered: 'false', waterlogged: 'false' },
    directional: true,
    openable: true,
    waterloggable: true,
  },
  [BLOCK.JUNGLE_TRAPDOOR]: {
    properties: ['facing', 'half', 'open', 'powered', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', open: 'false', powered: 'false', waterlogged: 'false' },
    directional: true,
    openable: true,
    waterloggable: true,
  },
  [BLOCK.ACACIA_TRAPDOOR]: {
    properties: ['facing', 'half', 'open', 'powered', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', open: 'false', powered: 'false', waterlogged: 'false' },
    directional: true,
    openable: true,
    waterloggable: true,
  },
  [BLOCK.DARK_OAK_TRAPDOOR]: {
    properties: ['facing', 'half', 'open', 'powered', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', open: 'false', powered: 'false', waterlogged: 'false' },
    directional: true,
    openable: true,
    waterloggable: true,
  },
  [BLOCK.MANGROVE_TRAPDOOR]: {
    properties: ['facing', 'half', 'open', 'powered', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', open: 'false', powered: 'false', waterlogged: 'false' },
    directional: true,
    openable: true,
    waterloggable: true,
  },

  // === FURNACES ===
  [BLOCK.FURNACE]: {
    properties: ['facing', 'lit'],
    defaults: { facing: 'north', lit: 'false' },
    directional: true,
  },
  [BLOCK.SMOKER]: {
    properties: ['facing', 'lit'],
    defaults: { facing: 'north', lit: 'false' },
    directional: true,
  },
  [BLOCK.BLAST_FURNACE]: {
    properties: ['facing', 'lit'],
    defaults: { facing: 'north', lit: 'false' },
    directional: true,
  },

  // === CHESTS ===
  [BLOCK.CHEST]: {
    properties: ['facing', 'type', 'waterlogged'],
    defaults: { facing: 'north', type: 'single', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },
  [BLOCK.TRAPPED_CHEST]: {
    properties: ['facing', 'type', 'waterlogged'],
    defaults: { facing: 'north', type: 'single', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },
  [BLOCK.ENDER_CHEST]: {
    properties: ['facing', 'waterlogged'],
    defaults: { facing: 'north', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },

  // === STAIRS ===
  [BLOCK.OAK_STAIRS]: {
    properties: ['facing', 'half', 'shape', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },
  [BLOCK.COBBLESTONE_STAIRS]: {
    properties: ['facing', 'half', 'shape', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },
  [BLOCK.STONE_BRICK_STAIRS]: {
    properties: ['facing', 'half', 'shape', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },
  [BLOCK.NETHER_BRICK_STAIRS]: {
    properties: ['facing', 'half', 'shape', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },
  [BLOCK.QUARTZ_STAIRS]: {
    properties: ['facing', 'half', 'shape', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },
  [BLOCK.PURPUR_STAIRS]: {
    properties: ['facing', 'half', 'shape', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },
  [BLOCK.PRISMARINE_STAIRS]: {
    properties: ['facing', 'half', 'shape', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },
  [BLOCK.DARK_PRISMARINE_STAIRS]: {
    properties: ['facing', 'half', 'shape', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },
  [BLOCK.PRISMARINE_BRICK_STAIRS]: {
    properties: ['facing', 'half', 'shape', 'waterlogged'],
    defaults: { facing: 'north', half: 'bottom', shape: 'straight', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },

  // === SLABS ===
  [BLOCK.OAK_SLAB]: {
    properties: ['type', 'waterlogged'],
    defaults: { type: 'bottom', waterlogged: 'false' },
    waterloggable: true,
  },
  [BLOCK.COBBLESTONE_SLAB]: {
    properties: ['type', 'waterlogged'],
    defaults: { type: 'bottom', waterlogged: 'false' },
    waterloggable: true,
  },
  [BLOCK.STONE_SLAB]: {
    properties: ['type', 'waterlogged'],
    defaults: { type: 'bottom', waterlogged: 'false' },
    waterloggable: true,
  },
  [BLOCK.BRICK_SLAB]: {
    properties: ['type', 'waterlogged'],
    defaults: { type: 'bottom', waterlogged: 'false' },
    waterloggable: true,
  },
  [BLOCK.STONE_BRICK_SLAB]: {
    properties: ['type', 'waterlogged'],
    defaults: { type: 'bottom', waterlogged: 'false' },
    waterloggable: true,
  },
  [BLOCK.NETHER_BRICK_SLAB]: {
    properties: ['type', 'waterlogged'],
    defaults: { type: 'bottom', waterlogged: 'false' },
    waterloggable: true,
  },
  [BLOCK.QUARTZ_SLAB]: {
    properties: ['type', 'waterlogged'],
    defaults: { type: 'bottom', waterlogged: 'false' },
    waterloggable: true,
  },

  // === BUTTONS ===
  [BLOCK.STONE_BUTTON]: {
    properties: ['face', 'facing', 'powered'],
    defaults: { face: 'wall', facing: 'north', powered: 'false' },
    directional: true,
  },
  [BLOCK.OAK_BUTTON]: {
    properties: ['face', 'facing', 'powered'],
    defaults: { face: 'wall', facing: 'north', powered: 'false' },
    directional: true,
  },

  // === PRESSURE PLATES ===
  [BLOCK.OAK_PRESSURE_PLATE]: {
    properties: ['powered'],
    defaults: { powered: 'false' },
  },
  [BLOCK.STONE_PRESSURE_PLATE]: {
    properties: ['powered'],
    defaults: { powered: 'false' },
  },
  [BLOCK.LIGHT_WEIGHTED_PRESSURE_PLATE]: {
    properties: ['power'],
    defaults: { power: 0 },
  },
  [BLOCK.HEAVY_WEIGHTED_PRESSURE_PLATE]: {
    properties: ['power'],
    defaults: { power: 0 },
  },

  // === REDSTONE ===
  [BLOCK.LEVER]: {
    properties: ['face', 'facing', 'powered'],
    defaults: { face: 'wall', facing: 'north', powered: 'false' },
    directional: true,
  },
  [BLOCK.REPEATER]: {
    properties: ['delay', 'facing', 'locked', 'powered'],
    defaults: { delay: 1, facing: 'north', locked: 'false', powered: 'false' },
    directional: true,
  },
  [BLOCK.COMPARATOR]: {
    properties: ['facing', 'mode', 'powered'],
    defaults: { facing: 'north', mode: 'compare', powered: 'false' },
    directional: true,
  },
  [BLOCK.REDSTONE_LAMP]: {
    properties: ['lit'],
    defaults: { lit: 'false' },
  },
  [BLOCK.DAYLIGHT_DETECTOR]: {
    properties: ['inverted', 'power'],
    defaults: { inverted: 'false', power: 0 },
  },

  // === FENCES ===
  [BLOCK.OAK_FENCE]: {
    properties: ['east', 'north', 'south', 'waterlogged', 'west'],
    defaults: { east: 'false', north: 'false', south: 'false', waterlogged: 'false', west: 'false' },
    waterloggable: true,
  },
  [BLOCK.OAK_FENCE_GATE]: {
    properties: ['facing', 'in_wall', 'open', 'powered'],
    defaults: { facing: 'north', in_wall: 'false', open: 'false', powered: 'false' },
    directional: true,
    openable: true,
  },

  // === WALLS ===
  [BLOCK.COBBLESTONE_WALL]: {
    properties: ['east', 'north', 'south', 'up', 'waterlogged', 'west'],
    defaults: { east: 'none', north: 'none', south: 'none', up: 'true', waterlogged: 'false', west: 'none' },
    waterloggable: true,
  },

  // === FARMLAND ===
  [BLOCK.FARMLAND]: {
    properties: ['moisture'],
    defaults: { moisture: 0 },
  },

  // === CROPS ===
  [BLOCK.WHEAT]: {
    properties: ['age'],
    defaults: { age: 0 },
  },

  // === MUSHROOMS ===
  // (no blockstate properties, but placed on specific surfaces)

  // === LADDERS ===
  [BLOCK.LADDER]: {
    properties: ['facing', 'waterlogged'],
    defaults: { facing: 'north', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },

  // === VINE ===
  [BLOCK.VINE]: {
    properties: ['east', 'north', 'south', 'waterlogged', 'west'],
    defaults: { east: 'false', north: 'false', south: 'false', waterlogged: 'false', west: 'false' },
    waterloggable: true,
  },

  // === TORCH ===
  [BLOCK.TORCH]: {
    properties: ['facing'],
    defaults: { facing: 'south' },
  },
  [BLOCK.REDSTONE_TORCH]: {
    properties: ['facing', 'lit'],
    defaults: { facing: 'south', lit: 'true' },
  },

  // === CAMPFIRE ===
  [BLOCK.CAMPFIRE]: {
    properties: ['facing', 'lit', 'signal_fire', 'waterlogged'],
    defaults: { facing: 'north', lit: 'true', signal_fire: 'false', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },
  [BLOCK.SOUL_CAMPFIRE]: {
    properties: ['facing', 'lit', 'signal_fire', 'waterlogged'],
    defaults: { facing: 'north', lit: 'true', signal_fire: 'false', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },

  // === BREWING STAND ===
  [BLOCK.BREWING_STAND]: {
    properties: ['has_bottle_0', 'has_bottle_1', 'has_bottle_2'],
    defaults: { has_bottle_0: 'false', has_bottle_1: 'false', has_bottle_2: 'false' },
  },

  // === ANVIL ===
  [BLOCK.ANVIL]: {
    properties: ['facing'],
    defaults: { facing: 'south' },
    directional: true,
  },

  // === HOPPER ===
  [BLOCK.HOPPER]: {
    properties: ['enabled', 'facing'],
    defaults: { enabled: 'true', facing: 'down' },
    directional: true,
  },

  // === BANNER ===
  [BLOCK.BANNER]: {
    properties: ['rotation'],
    defaults: { rotation: 0 },
  },

  // === SKULL ===
  [BLOCK.SKULL]: {
    properties: ['rotation'],
    defaults: { rotation: 0 },
  },

  // === END_ROD ===
  [BLOCK.END_ROD]: {
    properties: ['facing'],
    defaults: { facing: 'up' },
    directional: true,
  },

  // === LIGHTNING_ROD ===
  [BLOCK.LIGHTNING_ROD]: {
    properties: ['facing', 'powered', 'waterlogged'],
    defaults: { facing: 'up', powered: 'false', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },

  // === CONDUIT ===
  [BLOCK.CONDUIT]: {
    properties: ['waterlogged'],
    defaults: { waterlogged: 'false' },
    waterloggable: true,
  },

  // === BARREL ===
  [BLOCK.BARREL]: {
    properties: ['facing', 'open'],
    defaults: { facing: 'north', open: 'false' },
    directional: true,
    openable: true,
  },

  // === DECORATED_POT ===
  [BLOCK.DECORATED_POT]: {
    properties: ['facing', 'waterlogged'],
    defaults: { facing: 'north', waterlogged: 'false' },
    directional: true,
    waterloggable: true,
  },

  // === SCULK SENSOR ===
  [BLOCK.SCULK_SENSOR]: {
    properties: ['power', 'sculk_sensor_phase', 'waterlogged'],
    defaults: { power: 0, sculk_sensor_phase: 0, waterlogged: 'false' },
    waterloggable: true,
  },

  // === COPPER BULB ===
  [BLOCK.COPPER_BULB]: {
    properties: ['lit', 'powered'],
    defaults: { lit: 'false', powered: 'false' },
  },
};

/**
 * Get block state properties for a block.
 */
export function getBlockStateDef(blockId: number) {
  return BLOCK_STATE_DEFS[blockId] ?? null;
}

/**
 * Create a default state for a block.
 */
export function createDefaultState(blockId: number): Record<string, string | number> | null {
  const def = BLOCK_STATE_DEFS[blockId];
  if (!def) return null;
  return { ...def.defaults };
}

/**
 * Check if a block is directional (placed facing a direction).
 */
export function isDirectional(blockId: number): boolean {
  return BLOCK_STATE_DEFS[blockId]?.directional ?? false;
}

/**
 * Check if a block can be toggled open/closed.
 */
export function isOpenable(blockId: number): boolean {
  return BLOCK_STATE_DEFS[blockId]?.openable ?? false;
}

/**
 * Check if a block can be waterlogged.
 */
export function isWaterloggable(blockId: number): boolean {
  return BLOCK_STATE_DEFS[blockId]?.waterloggable ?? false;
}
