/**
 * Tappables — Minecraft Earth resource collection system.
 * Exact drop tables from https://minecraft.wiki/w/Earth:Tappable
 *
 * 11 tappable types with 5 rarity tiers:
 *   Common (gray), Uncommon (green), Rare (blue), Epic (purple), Legendary (yellow)
 *
 * Up to 3 items per tappable. Each item has a % chance and min/max count.
 * Mob tappables collect mobs as inventory items (not killing them).
 */

import { BLOCK } from './blocks.js';
import { ITEM } from './items.js';

// ─── Rarity ─────────────────────────────────────────────────────────────────

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#aaaaaa',
  uncommon: '#55ff55',
  rare: '#5555ff',
  epic: '#aa55aa',
  legendary: '#ffff55',
};

// ─── Drop Table Types ───────────────────────────────────────────────────────

export type TappableType =
  | 'chest'
  | 'grass'
  | 'pond'
  | 'stone'
  | 'birch'
  | 'oak'
  | 'spruce'
  | 'chicken'
  | 'cow'
  | 'pig'
  | 'sheep';

export interface TappableDrop {
  itemId: number;
  rarity: Rarity;
  chance: number;
  minCount: number;
  maxCount: number;
}

export interface TappableDefinition {
  type: TappableType;
  label: string;
  drops: TappableDrop[];
  cooldownMs: number;
  /** Block to render as visual */
  blockId: number;
  /** Spawn weight (higher = more common) */
  weight: number;
}

// ─── Exact MCE Drop Tables (from wiki) ──────────────────────────────────────

const I = ITEM;
const B = BLOCK;

export const TAPPABLE_DEFINITIONS: Record<TappableType, TappableDefinition> = {
  // ── Chest Tappables ──────────────────────────────────────────────────────
  chest: {
    type: 'chest',
    label: 'Treasure Chest',
    cooldownMs: 120_000,
    blockId: B.CHEST,
    weight: 8,
    drops: [
      { itemId: I.MCE_ADVENTURE_CRYSTAL_COMMON, rarity: 'common', chance: 0.605, minCount: 1, maxCount: 2 },
      { itemId: I.ACACIA_PLANKS, rarity: 'uncommon', chance: 0.176, minCount: 1, maxCount: 5 },
      { itemId: I.BEETROOT_SEEDS, rarity: 'common', chance: 0.116, minCount: 1, maxCount: 2 },
      { itemId: B.BRICK, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.BONE_MEAL, rarity: 'common', chance: 0.02, minCount: 1, maxCount: 1 },
      { itemId: I.BROWN_DYE, rarity: 'common', chance: 0.004, minCount: 1, maxCount: 1 },
      { itemId: I.BUCKET, rarity: 'rare', chance: 0.011, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_BUCKET_OF_MUD, rarity: 'rare', chance: 0.009, minCount: 1, maxCount: 1 },
      { itemId: I.CLAY_BALL, rarity: 'common', chance: 0.277, minCount: 1, maxCount: 5 },
      { itemId: B.CLAY, rarity: 'common', chance: 0.049, minCount: 1, maxCount: 1 },
      { itemId: I.COBBLESTONE_STAIRS, rarity: 'common', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.COBBLESTONE_WALL, rarity: 'common', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.COBWEB, rarity: 'uncommon', chance: 0.003, minCount: 1, maxCount: 1 },
      { itemId: I.COCOA_BEANS, rarity: 'common', chance: 0.219, minCount: 1, maxCount: 2 },
      { itemId: I.FLINT_AND_STEEL, rarity: 'rare', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.FLOWER_POT, rarity: 'uncommon', chance: 0.026, minCount: 1, maxCount: 1 },
      { itemId: I.GLASS, rarity: 'uncommon', chance: 0.03, minCount: 2, maxCount: 6 },
      { itemId: I.GLOWSTONE_DUST, rarity: 'common', chance: 0.007, minCount: 2, maxCount: 3 },
      { itemId: I.GUNPOWDER, rarity: 'common', chance: 0.011, minCount: 1, maxCount: 3 },
      { itemId: I.INK_SAC, rarity: 'common', chance: 0.173, minCount: 1, maxCount: 2 },
      { itemId: I.IRON_BARS, rarity: 'rare', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.IRON_DOOR, rarity: 'rare', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.LEVER, rarity: 'common', chance: 0.006, minCount: 1, maxCount: 1 },
      { itemId: I.MINECART, rarity: 'epic', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_MOB_OF_ME, rarity: 'rare', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.QUARTZ, rarity: 'epic', chance: 0.011, minCount: 1, maxCount: 2 },
      { itemId: I.NOTE_BLOCK, rarity: 'rare', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.OAK_DOOR, rarity: 'common', chance: 0.02, minCount: 1, maxCount: 1 },
      { itemId: I.OAK_FENCE, rarity: 'common', chance: 0.074, minCount: 1, maxCount: 2 },
      { itemId: I.OAK_FENCE_GATE, rarity: 'common', chance: 0.027, minCount: 1, maxCount: 1 },
      { itemId: I.OAK_PRESSURE_PLATE, rarity: 'common', chance: 0.02, minCount: 1, maxCount: 1 },
      { itemId: I.OAK_STAIRS, rarity: 'common', chance: 0.032, minCount: 1, maxCount: 1 },
      { itemId: I.OAK_PLANKS, rarity: 'common', chance: 0.169, minCount: 1, maxCount: 12 },
      { itemId: I.OAK_SLAB, rarity: 'common', chance: 0.04, minCount: 1, maxCount: 1 },
      { itemId: I.POLISHED_ANDESITE, rarity: 'rare', chance: 0.13, minCount: 1, maxCount: 2 },
      { itemId: I.POLISHED_DIORITE, rarity: 'rare', chance: 0.105, minCount: 1, maxCount: 2 },
      { itemId: I.POLISHED_GRANITE, rarity: 'rare', chance: 0.125, minCount: 1, maxCount: 2 },
      { itemId: I.POWERED_RAIL, rarity: 'rare', chance: 0.001, minCount: 2, maxCount: 2 },
      { itemId: I.RAIL, rarity: 'rare', chance: 0.019, minCount: 1, maxCount: 3 },
      { itemId: I.REDSTONE_LAMP, rarity: 'epic', chance: 0.003, minCount: 1, maxCount: 1 },
      { itemId: I.REDSTONE_REPEATER, rarity: 'epic', chance: 0.009, minCount: 1, maxCount: 1 },
      { itemId: I.REDSTONE_TORCH, rarity: 'epic', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.SLIMEBALL, rarity: 'common', chance: 0.049, minCount: 1, maxCount: 2 },
      { itemId: I.STONE_BRICK, rarity: 'uncommon', chance: 0.006, minCount: 1, maxCount: 2 },
      { itemId: I.TNT, rarity: 'rare', chance: 0.01, minCount: 1, maxCount: 1 },
      { itemId: I.TORCH, rarity: 'uncommon', chance: 0.027, minCount: 1, maxCount: 5 },
    ],
  },

  // ── Grass Tappables ──────────────────────────────────────────────────────
  grass: {
    type: 'grass',
    label: 'Grass',
    cooldownMs: 20_000,
    blockId: B.GRASS,
    weight: 35,
    drops: [
      { itemId: I.ACACIA_SAPLING, rarity: 'uncommon', chance: 0.047, minCount: 1, maxCount: 1 },
      { itemId: I.ALLIUM, rarity: 'common', chance: 0.015, minCount: 1, maxCount: 1 },
      { itemId: I.AZURE_BLUET, rarity: 'common', chance: 0.038, minCount: 1, maxCount: 1 },
      { itemId: I.BLUE_ORCHID, rarity: 'common', chance: 0.028, minCount: 1, maxCount: 1 },
      { itemId: I.WHEAT_SEEDS, rarity: 'common', chance: 0.026, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_BOLD_STRIPED_RABBIT, rarity: 'uncommon', chance: 0.013, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_BUTTERCUP, rarity: 'common', chance: 0.091, minCount: 1, maxCount: 2 },
      { itemId: I.MCE_CHICKEN, rarity: 'common', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: B.COARSE_DIRT, rarity: 'common', chance: 0.009, minCount: 1, maxCount: 5 },
      { itemId: I.DANDELION, rarity: 'common', chance: 0.134, minCount: 1, maxCount: 2 },
      { itemId: I.DIRT, rarity: 'common', chance: 0.252, minCount: 2, maxCount: 7 },
      { itemId: I.GRAVEL, rarity: 'common', chance: 0.249, minCount: 2, maxCount: 12 },
      { itemId: I.FERN, rarity: 'common', chance: 0.068, minCount: 1, maxCount: 2 },
      { itemId: I.MCE_FRECKLED_RABBIT, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.GRASS, rarity: 'common', chance: 0.124, minCount: 2, maxCount: 4 },
      { itemId: I.MCE_HARELEQUIN_RABBIT, rarity: 'uncommon', chance: 0.021, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_JUMBO_RABBIT, rarity: 'uncommon', chance: 0.017, minCount: 1, maxCount: 1 },
      { itemId: I.JUNGLE_SAPLING, rarity: 'rare', chance: 0.051, minCount: 1, maxCount: 1 },
      { itemId: I.LILY_OF_THE_VALLEY, rarity: 'common', chance: 0.085, minCount: 1, maxCount: 2 },
      { itemId: I.LILY_PAD, rarity: 'common', chance: 0.247, minCount: 1, maxCount: 2 },
      { itemId: I.MCE_MELON_GOLEM, rarity: 'uncommon', chance: 0.011, minCount: 1, maxCount: 1 },
      { itemId: I.MELON_SEEDS, rarity: 'common', chance: 0.038, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_MUDDY_FOOT_RABBIT, rarity: 'uncommon', chance: 0.007, minCount: 1, maxCount: 1 },
      { itemId: I.MYCELIUM, rarity: 'rare', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.ORANGE_TULIP, rarity: 'common', chance: 0.054, minCount: 1, maxCount: 1 },
      { itemId: I.OXEYE_DAISY, rarity: 'common', chance: 0.07, minCount: 1, maxCount: 2 },
      { itemId: I.CARVED_PUMPKIN, rarity: 'uncommon', chance: 0.063, minCount: 1, maxCount: 2 },
      { itemId: I.PUMPKIN_SEEDS, rarity: 'common', chance: 0.038, minCount: 1, maxCount: 2 },
      { itemId: I.PINK_TULIP, rarity: 'common', chance: 0.047, minCount: 1, maxCount: 1 },
      { itemId: I.POPPY, rarity: 'common', chance: 0.168, minCount: 1, maxCount: 2 },
      { itemId: I.RED_MUSHROOM, rarity: 'common', chance: 0.19, minCount: 1, maxCount: 4 },
      { itemId: I.RED_TULIP, rarity: 'common', chance: 0.095, minCount: 1, maxCount: 2 },
      { itemId: I.ROSE_BUSH, rarity: 'common', chance: 0.19, minCount: 1, maxCount: 2 },
      { itemId: I.SUNFLOWER, rarity: 'common', chance: 0.216, minCount: 1, maxCount: 2 },
      { itemId: I.MCE_VESTED_RABBIT, rarity: 'uncommon', chance: 0.02, minCount: 1, maxCount: 1 },
      { itemId: I.WHITE_TULIP, rarity: 'common', chance: 0.115, minCount: 1, maxCount: 2 },
      { itemId: I.WATER_BUCKET, rarity: 'rare', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_VILER_WITCH, rarity: 'common', chance: 0.001, minCount: 1, maxCount: 1 },
    ],
  },

  // ── Pond Tappables ───────────────────────────────────────────────────────
  pond: {
    type: 'pond',
    label: 'Water Source',
    cooldownMs: 25_000,
    blockId: B.WATER,
    weight: 20,
    drops: [
      { itemId: I.ACACIA_SAPLING, rarity: 'uncommon', chance: 0.028, minCount: 1, maxCount: 2 },
      { itemId: I.WHEAT_SEEDS, rarity: 'common', chance: 0.025, minCount: 1, maxCount: 1 },
      { itemId: I.ALLIUM, rarity: 'common', chance: 0.013, minCount: 1, maxCount: 1 },
      { itemId: I.AZURE_BLUET, rarity: 'common', chance: 0.039, minCount: 1, maxCount: 2 },
      { itemId: I.MCE_BOLD_STRIPED_RABBIT, rarity: 'uncommon', chance: 0.016, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_BUTTERCUP, rarity: 'common', chance: 0.082, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_CHICKEN, rarity: 'common', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.DANDELION, rarity: 'common', chance: 0.105, minCount: 1, maxCount: 2 },
      { itemId: I.DIRT, rarity: 'common', chance: 0.25, minCount: 2, maxCount: 8 },
      { itemId: I.FERN, rarity: 'common', chance: 0.066, minCount: 1, maxCount: 4 },
      { itemId: I.MCE_FRECKLED_RABBIT, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_GLOW_SQUID, rarity: 'uncommon', chance: 0.037, minCount: 1, maxCount: 1 },
      { itemId: I.GRASS, rarity: 'common', chance: 0.097, minCount: 2, maxCount: 5 },
      { itemId: I.MCE_HARELEQUIN_RABBIT, rarity: 'uncommon', chance: 0.03, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_JUMBO_RABBIT, rarity: 'uncommon', chance: 0.024, minCount: 1, maxCount: 1 },
      { itemId: I.JUNGLE_SAPLING, rarity: 'rare', chance: 0.033, minCount: 1, maxCount: 2 },
      { itemId: I.LILY_OF_THE_VALLEY, rarity: 'common', chance: 0.078, minCount: 1, maxCount: 2 },
      { itemId: I.LILY_PAD, rarity: 'common', chance: 0.23, minCount: 1, maxCount: 2 },
      { itemId: I.GRAVEL, rarity: 'common', chance: 0.173, minCount: 2, maxCount: 8 },
      { itemId: I.MCE_MELON_GOLEM, rarity: 'uncommon', chance: 0.018, minCount: 1, maxCount: 1 },
      { itemId: I.MELON_SEEDS, rarity: 'common', chance: 0.021, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_MUDDY_FOOT_RABBIT, rarity: 'uncommon', chance: 0.007, minCount: 1, maxCount: 1 },
      { itemId: I.MYCELIUM, rarity: 'rare', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.ORANGE_TULIP, rarity: 'common', chance: 0.051, minCount: 1, maxCount: 2 },
      { itemId: I.BLUE_ORCHID, rarity: 'common', chance: 0.045, minCount: 1, maxCount: 1 },
      { itemId: I.OXEYE_DAISY, rarity: 'common', chance: 0.096, minCount: 1, maxCount: 2 },
      { itemId: I.CLAY_BALL, rarity: 'common', chance: 0.093, minCount: 1, maxCount: 3 },
      { itemId: I.CARVED_PUMPKIN, rarity: 'uncommon', chance: 0.066, minCount: 1, maxCount: 2 },
      { itemId: I.PUMPKIN_SEEDS, rarity: 'common', chance: 0.039, minCount: 1, maxCount: 2 },
      { itemId: I.PINK_TULIP, rarity: 'common', chance: 0.051, minCount: 1, maxCount: 2 },
      { itemId: I.POPPY, rarity: 'common', chance: 0.152, minCount: 1, maxCount: 2 },
      { itemId: I.RED_MUSHROOM, rarity: 'common', chance: 0.157, minCount: 1, maxCount: 2 },
      { itemId: I.RED_TULIP, rarity: 'common', chance: 0.076, minCount: 1, maxCount: 2 },
      { itemId: I.ROSE_BUSH, rarity: 'common', chance: 0.166, minCount: 1, maxCount: 2 },
      { itemId: I.COD, rarity: 'common', chance: 0.022, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_TROPICAL_SLIME, rarity: 'rare', chance: 0.004, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_VESTED_RABBIT, rarity: 'uncommon', chance: 0.024, minCount: 1, maxCount: 1 },
      { itemId: I.WHITE_TULIP, rarity: 'common', chance: 0.112, minCount: 1, maxCount: 2 },
      { itemId: I.WATER_BUCKET, rarity: 'rare', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_VILER_WITCH, rarity: 'common', chance: 0.001, minCount: 1, maxCount: 1 },
    ],
  },

  // ── Stone Tappables ──────────────────────────────────────────────────────
  stone: {
    type: 'stone',
    label: 'Stone',
    cooldownMs: 30_000,
    blockId: B.STONE,
    weight: 30,
    drops: [
      { itemId: B.ANDESITE, rarity: 'uncommon', chance: 0.279, minCount: 1, maxCount: 4 },
      { itemId: I.RED_MUSHROOM, rarity: 'common', chance: 0.519, minCount: 1, maxCount: 4 },
      { itemId: I.COBBLESTONE, rarity: 'common', chance: 0.456, minCount: 2, maxCount: 16 },
      { itemId: B.DIORITE, rarity: 'uncommon', chance: 0.293, minCount: 1, maxCount: 4 },
      { itemId: I.FLINT, rarity: 'uncommon', chance: 0.099, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_FURNACE_GOLEM, rarity: 'rare', chance: 0.004, minCount: 1, maxCount: 1 },
      { itemId: B.GRANITE, rarity: 'uncommon', chance: 0.41, minCount: 1, maxCount: 4 },
      { itemId: I.GRAVEL, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.REDSTONE, rarity: 'common', chance: 0.093, minCount: 1, maxCount: 2 },
      { itemId: I.SAND, rarity: 'common', chance: 0.381, minCount: 2, maxCount: 15 },
      { itemId: I.MCE_SKELETON_WOLF, rarity: 'rare', chance: 0.002, minCount: 1, maxCount: 1 },
      { itemId: B.STONE, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_VILER_WITCH, rarity: 'rare', chance: 0.001, minCount: 1, maxCount: 1 },
    ],
  },

  // ── Birch Tappables ──────────────────────────────────────────────────────
  birch: {
    type: 'birch',
    label: 'Birch Tree',
    cooldownMs: 35_000,
    blockId: B.BIRCH_LOG,
    weight: 25,
    drops: [
      { itemId: B.BIRCH_LEAVES, rarity: 'common', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: B.BIRCH_LOG, rarity: 'common', chance: 0.81, minCount: 2, maxCount: 8 },
      { itemId: I.BIRCH_SAPLING, rarity: 'common', chance: 0.658, minCount: 1, maxCount: 2 },
    ],
  },

  // ── Oak Tappables ────────────────────────────────────────────────────────
  oak: {
    type: 'oak',
    label: 'Oak Tree',
    cooldownMs: 35_000,
    blockId: B.OAK_LOG,
    weight: 25,
    drops: [
      { itemId: B.OAK_LEAVES, rarity: 'common', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: B.OAK_LOG, rarity: 'common', chance: 0.935, minCount: 2, maxCount: 8 },
      { itemId: I.OAK_SAPLING, rarity: 'common', chance: 0.403, minCount: 1, maxCount: 2 },
      { itemId: I.MCE_CHICKEN, rarity: 'common', chance: 0.02, minCount: 1, maxCount: 1 },
    ],
  },

  // ── Spruce Tappables ─────────────────────────────────────────────────────
  spruce: {
    type: 'spruce',
    label: 'Spruce Tree',
    cooldownMs: 35_000,
    blockId: B.SPRUCE_LOG,
    weight: 25,
    drops: [
      { itemId: B.SPRUCE_LEAVES, rarity: 'common', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: B.SPRUCE_LOG, rarity: 'common', chance: 0.791, minCount: 2, maxCount: 8 },
      { itemId: I.SPRUCE_SAPLING, rarity: 'common', chance: 0.7, minCount: 1, maxCount: 2 },
    ],
  },

  // ── Chicken Tappables ────────────────────────────────────────────────────
  chicken: {
    type: 'chicken',
    label: 'Chicken',
    cooldownMs: 40_000,
    blockId: B.GRASS,
    weight: 12,
    drops: [
      { itemId: I.MCE_CHICKEN, rarity: 'common', chance: 0.798, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_AMBER_CHICKEN, rarity: 'uncommon', chance: 0.021, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_MIDNIGHT_CHICKEN, rarity: 'uncommon', chance: 0.046, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_STORMY_CHICKEN, rarity: 'uncommon', chance: 0.072, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_BRONZED_CHICKEN, rarity: 'uncommon', chance: 0.021, minCount: 1, maxCount: 1 },
      { itemId: I.MCECLUCKSHROOM, rarity: 'rare', chance: 0.02, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_FANCY_CHICKEN, rarity: 'rare', chance: 0.021, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_SKEWBALD_CHICKEN, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_GOLD_CRESTED_CHICKEN, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.FEATHER, rarity: 'common', chance: 0.456, minCount: 1, maxCount: 2 },
      { itemId: I.EGG, rarity: 'common', chance: 0.041, minCount: 1, maxCount: 2 },
    ],
  },

  // ── Cow Tappables ────────────────────────────────────────────────────────
  cow: {
    type: 'cow',
    label: 'Cow',
    cooldownMs: 40_000,
    blockId: B.GRASS,
    weight: 12,
    drops: [
      { itemId: I.MCE_COW, rarity: 'common', chance: 0.776, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_ALBINO_COW, rarity: 'uncommon', chance: 0.046, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_ASHEN_COW, rarity: 'uncommon', chance: 0.081, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_SUNSET_COW, rarity: 'uncommon', chance: 0.025, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_COOKIE_COW, rarity: 'uncommon', chance: 0.024, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_WOOLY_COW, rarity: 'uncommon', chance: 0.041, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_PINTO_COW, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_MOOBLOOM, rarity: 'rare', chance: 0.006, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_MOOLIP, rarity: 'rare', chance: 0.006, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_CREAM_COW, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_DAIRY_COW, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_UMBRA_COW, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
    ],
  },

  // ── Pig Tappables ────────────────────────────────────────────────────────
  pig: {
    type: 'pig',
    label: 'Pig',
    cooldownMs: 40_000,
    blockId: B.GRASS,
    weight: 12,
    drops: [
      { itemId: I.MCE_PIG, rarity: 'uncommon', chance: 0.795, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_PALE_PIG, rarity: 'uncommon', chance: 0.055, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_PIEBALD_PIG, rarity: 'uncommon', chance: 0.052, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_SPOTTED_PIG, rarity: 'uncommon', chance: 0.028, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_PINK_FOOTED_PIG, rarity: 'uncommon', chance: 0.065, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_MUDDY_PIG, rarity: 'epic', chance: 0.005, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_MOTTLED_PIG, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_SOOTY_PIG, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
    ],
  },

  // ── Sheep Tappables ──────────────────────────────────────────────────────
  sheep: {
    type: 'sheep',
    label: 'Sheep',
    cooldownMs: 40_000,
    blockId: B.GRASS,
    weight: 12,
    drops: [
      { itemId: I.MCE_WHITE_SHEEP, rarity: 'common', chance: 0.784, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_FLECKED_SHEEP, rarity: 'uncommon', chance: 0.077, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_INKY_SHEEP, rarity: 'uncommon', chance: 0.025, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_ROCKY_SHEEP, rarity: 'uncommon', chance: 0.039, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_PATCHED_SHEEP, rarity: 'uncommon', chance: 0.054, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_HORNED_SHEEP, rarity: 'rare', chance: 0.011, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_RAINBOW_SHEEP, rarity: 'epic', chance: 0.01, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_FUZZY_SHEEP, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
      { itemId: I.MCE_LONG_NOSE_SHEEP, rarity: 'uncommon', chance: 0.001, minCount: 1, maxCount: 1 },
    ],
  },
};

// ─── Active Tappable in World ──────────────────────────────────────────────

export interface Tappable {
  id: string;
  type: TappableType;
  x: number;
  y: number;
  z: number;
  collectedAt: number;
  meshId?: number;
}

// ─── Roll Functions ────────────────────────────────────────────────────────

/** Roll a random tappable type based on weights */
export function rollTappableType(): TappableType {
  const types = Object.values(TAPPABLE_DEFINITIONS);
  const totalWeight = types.reduce((s, d) => s + d.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const def of types) {
    roll -= def.weight;
    if (roll <= 0) return def.type;
  }
  return 'stone';
}

/** Roll drops for a tappable — up to 3 items, each with its own % chance */
export function rollTappableDrops(type: TappableType): { itemId: number; count: number; rarity: Rarity }[] {
  const def = TAPPABLE_DEFINITIONS[type];
  const drops: { itemId: number; count: number; rarity: Rarity }[] = [];

  for (const drop of def.drops) {
    if (drops.length >= 3) break; // MCE max 3 items per tappable
    if (Math.random() <= drop.chance) {
      const count = drop.minCount + Math.floor(Math.random() * (drop.maxCount - drop.minCount + 1));
      drops.push({ itemId: drop.itemId, count, rarity: drop.rarity });
    }
  }

  return drops;
}

/** Check if a tappable is active (not on cooldown) */
export function isTappableActive(tappable: Tappable, now: number): boolean {
  if (tappable.collectedAt === 0) return true;
  const def = TAPPABLE_DEFINITIONS[tappable.type];
  return now - tappable.collectedAt >= def.cooldownMs;
}

// ─── Chunk Generation ──────────────────────────────────────────────────────

/** Generate tappable positions for a chunk */
export function generateTappablesForChunk(cx: number, cz: number, chunkW: number, chunkD: number): Tappable[] {
  const tappables: Tappable[] = [];
  const seed = cx * 73856093 ^ cz * 19349663;
  const prng = mulberry32(seed);

  const count = 2 + Math.floor(prng() * 4);
  for (let i = 0; i < count; i++) {
    const lx = Math.floor(prng() * chunkW);
    const lz = Math.floor(prng() * chunkD);
    const wx = cx * chunkW + lx;
    const wz = cz * chunkD + lz;
    const type = rollTappableType();

    tappables.push({
      id: `${cx},${cz},${i}`,
      type,
      x: wx,
      y: 0,
      z: wz,
      collectedAt: 0,
    });
  }

  return tappables;
}

/** Simple mulberry32 PRNG */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
