/**
 * Furnace / Smoker / Blast Furnace recipe registry.
 * Smelting: input item → output item, with cook time and XP.
 * Fuel: item/block → burn time in ticks.
 */

import { BLOCK } from './blocks.js';
import { ITEM } from './items.js';

export interface FurnaceSmeltingRecipe {
  input: number;
  output: number;
  count: number;
  experience: number;
  cookTime: number; // ticks (200 = 10 seconds)
  type: 'smelting' | 'smoking' | 'blasting';
}

export interface FuelEntry {
  id: number;
  burnTime: number; // ticks
}

const B = BLOCK;
const I = ITEM;

const smeltingRecipes: FurnaceSmeltingRecipe[] = [
  // ─── ORE SMELTING (smelting) ─────────────────────────────────────────────
  { input: I.RAW_IRON, output: I.IRON_INGOT, count: 1, experience: 0.7, cookTime: 200, type: 'smelting' },
  { input: I.RAW_GOLD, output: I.GOLD_INGOT, count: 1, experience: 1.0, cookTime: 200, type: 'smelting' },
  { input: I.RAW_COPPER, output: I.COPPER_INGOT, count: 1, experience: 0.7, cookTime: 200, type: 'smelting' },
  { input: I.IRON_ORE, output: I.IRON_INGOT, count: 1, experience: 0.7, cookTime: 200, type: 'smelting' },
  { input: I.GOLD_ORE, output: I.GOLD_INGOT, count: 1, experience: 1.0, cookTime: 200, type: 'smelting' },
  { input: I.COPPER_ORE, output: I.COPPER_INGOT, count: 1, experience: 0.7, cookTime: 200, type: 'smelting' },
  { input: I.DIAMOND_ORE, output: I.DIAMOND, count: 1, experience: 1.0, cookTime: 200, type: 'smelting' },
  { input: I.EMERALD_ORE, output: I.EMERALD, count: 1, experience: 1.0, cookTime: 200, type: 'smelting' },
  { input: I.LAPIS_ORE, output: I.LAPIS_LAZULI, count: 1, experience: 0.2, cookTime: 200, type: 'smelting' },
  { input: I.REDSTONE_ORE, output: I.REDSTONE_DUST, count: 1, experience: 0.7, cookTime: 200, type: 'smelting' },
  { input: B.QUARTZ_ORE, output: I.QUARTZ, count: 1, experience: 0.2, cookTime: 200, type: 'smelting' },
  { input: B.NETHER_GOLD_ORE, output: I.GOLD_INGOT, count: 1, experience: 1.0, cookTime: 200, type: 'smelting' },
  { input: B.COAL_ORE, output: I.COAL, count: 1, experience: 0.1, cookTime: 200, type: 'smelting' },

  // Deepslate ores (same as regular ores)
  { input: I.DEEPSLATE_IRON_ORE ?? I.IRON_ORE, output: I.IRON_INGOT, count: 1, experience: 0.7, cookTime: 200, type: 'smelting' },
  { input: I.DEEPSLATE_GOLD_ORE ?? I.GOLD_ORE, output: I.GOLD_INGOT, count: 1, experience: 1.0, cookTime: 200, type: 'smelting' },
  { input: I.DEEPSLATE_COPPER_ORE ?? I.COPPER_ORE, output: I.COPPER_INGOT, count: 1, experience: 0.7, cookTime: 200, type: 'smelting' },
  { input: I.DEEPSLATE_DIAMOND_ORE ?? I.DIAMOND_ORE, output: I.DIAMOND, count: 1, experience: 1.0, cookTime: 200, type: 'smelting' },

  // ─── FOOD SMELTING (smelting) ────────────────────────────────────────────
  { input: I.RAW_BEEF, output: I.COOKED_BEEF, count: 1, experience: 0.35, cookTime: 200, type: 'smelting' },
  { input: I.RAW_PORKCHOP ?? I.PORKCHOP, output: I.COOKED_PORKCHOP, count: 1, experience: 0.35, cookTime: 200, type: 'smelting' },
  { input: I.RAW_CHICKEN, output: I.COOKED_CHICKEN, count: 1, experience: 0.35, cookTime: 200, type: 'smelting' },
  { input: I.RAW_MUTTON, output: I.COOKED_MUTTON, count: 1, experience: 0.35, cookTime: 200, type: 'smelting' },
  { input: I.RAW_RABBIT, output: I.COOKED_RABBIT, count: 1, experience: 0.35, cookTime: 200, type: 'smelting' },
  { input: I.COD, output: I.COOKED_COD, count: 1, experience: 0.35, cookTime: 200, type: 'smelting' },
  { input: I.SALMON, output: I.COOKED_SALMON, count: 1, experience: 0.35, cookTime: 200, type: 'smelting' },
  { input: I.POTATO, output: I.BAKED_POTATO, count: 1, experience: 0.35, cookTime: 200, type: 'smelting' },
  { input: I.KELP, output: I.DRIED_KELP_ITEM, count: 1, experience: 0.1, cookTime: 200, type: 'smelting' },

  // ─── BLOCK SMELTING ──────────────────────────────────────────────────────
  { input: B.SAND, output: B.GLASS, count: 1, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: B.COBBLESTONE, output: B.STONE, count: 1, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: B.STONE, output: B.SMOOTH_STONE, count: 1, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: B.SANDSTONE, output: B.SMOOTH_SANDSTONE, count: 1, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: B.RED_SANDSTONE, output: B.SMOOTH_RED_SANDSTONE, count: 1, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: B.NETHERRACK, output: I.NETHER_BRICK_ITEM ?? B.NETHER_BRICK, count: 1, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: B.CLAY, output: B.HARDENED_CLAY ?? B.TERRACOTTA, count: 1, experience: 0.35, cookTime: 200, type: 'smelting' },

  // ─── CHARCOAL ────────────────────────────────────────────────────────────
  { input: B.OAK_LOG, output: I.CHARCOAL, count: 1, experience: 0.15, cookTime: 200, type: 'smelting' },
  { input: B.SPRUCE_LOG, output: I.CHARCOAL, count: 1, experience: 0.15, cookTime: 200, type: 'smelting' },
  { input: B.BIRCH_LOG, output: I.CHARCOAL, count: 1, experience: 0.15, cookTime: 200, type: 'smelting' },
  { input: B.JUNGLE_LOG, output: I.CHARCOAL, count: 1, experience: 0.15, cookTime: 200, type: 'smelting' },
  { input: B.ACACIA_LOG, output: I.CHARCOAL, count: 1, experience: 0.15, cookTime: 200, type: 'smelting' },
  { input: B.DARK_OAK_LOG, output: I.CHARCOAL, count: 1, experience: 0.15, cookTime: 200, type: 'smelting' },
  { input: B.CHERRY_LOG, output: I.CHARCOAL, count: 1, experience: 0.15, cookTime: 200, type: 'smelting' },
  { input: B.BAMBOO_BLOCK, output: I.CHARCOAL, count: 1, experience: 0.15, cookTime: 200, type: 'smelting' },
  { input: B.MANGROVE_LOG, output: I.CHARCOAL, count: 1, experience: 0.15, cookTime: 200, type: 'smelting' },
  { input: B.CRIMSON_STEM, output: I.CHARCOAL, count: 1, experience: 0.15, cookTime: 200, type: 'smelting' },
  { input: B.WARPED_STEM, output: I.CHARCOAL, count: 1, experience: 0.15, cookTime: 200, type: 'smelting' },


  // ─── CACTUS GREEN ────────────────────────────────────────────────────────
  { input: B.CACTUS, output: I.GREEN_DYE, count: 1, experience: 1.0, cookTime: 200, type: 'smelting' },

  // ─── WET SPONGE ──────────────────────────────────────────────────────────

  { input: B.WET_SPONGE, output: B.SPONGE, count: 1, experience: 0.15, cookTime: 200, type: 'smelting' },
  // ─── ANCIENT DEBRIS ──────────────────────────────────────────────────────
  { input: B.ANCIENT_DEBRIS, output: I.NETHERITE_SCRAP, count: 1, experience: 2.0, cookTime: 200, type: 'smelting' },

  // ─── IRON ARMOR (smelting) ───────────────────────────────────────────────
  { input: I.IRON_HELMET, output: I.IRON_NUGGET, count: 5, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: I.IRON_CHESTPLATE, output: I.IRON_NUGGET, count: 8, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: I.IRON_LEGGINGS, output: I.IRON_NUGGET, count: 7, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: I.IRON_BOOTS, output: I.IRON_NUGGET, count: 4, experience: 0.1, cookTime: 200, type: 'smelting' },

  // ─── GOLD ARMOR (smelting) ───────────────────────────────────────────────
  { input: I.GOLDEN_HELMET, output: I.GOLD_NUGGET, count: 5, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: I.GOLDEN_CHESTPLATE, output: I.GOLD_NUGGET, count: 8, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: I.GOLDEN_LEGGINGS, output: I.GOLD_NUGGET, count: 7, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: I.GOLDEN_BOOTS, output: I.GOLD_NUGGET, count: 4, experience: 0.1, cookTime: 200, type: 'smelting' },

  // ─── SMOKING (food only, 2x faster) ──────────────────────────────────────
  { input: I.RAW_BEEF, output: I.COOKED_BEEF, count: 1, experience: 0.35, cookTime: 100, type: 'smoking' },
  { input: I.RAW_PORKCHOP ?? I.PORKCHOP, output: I.COOKED_PORKCHOP, count: 1, experience: 0.35, cookTime: 100, type: 'smoking' },
  { input: I.RAW_CHICKEN, output: I.COOKED_CHICKEN, count: 1, experience: 0.35, cookTime: 100, type: 'smoking' },
  { input: I.RAW_MUTTON, output: I.COOKED_MUTTON, count: 1, experience: 0.35, cookTime: 100, type: 'smoking' },
  { input: I.RAW_RABBIT, output: I.COOKED_RABBIT, count: 1, experience: 0.35, cookTime: 100, type: 'smoking' },
  { input: I.COD, output: I.COOKED_COD, count: 1, experience: 0.35, cookTime: 100, type: 'smoking' },
  { input: I.SALMON, output: I.COOKED_SALMON, count: 1, experience: 0.35, cookTime: 100, type: 'smoking' },
  { input: I.POTATO, output: I.BAKED_POTATO, count: 1, experience: 0.35, cookTime: 100, type: 'smoking' },
  { input: I.KELP, output: I.DRIED_KELP_ITEM, count: 1, experience: 0.1, cookTime: 100, type: 'smoking' },

  // ─── BLASTING (ores only, 2x faster) ────────────────────────────────────
  { input: I.RAW_IRON, output: I.IRON_INGOT, count: 1, experience: 0.7, cookTime: 100, type: 'blasting' },
  { input: I.RAW_GOLD, output: I.GOLD_INGOT, count: 1, experience: 1.0, cookTime: 100, type: 'blasting' },
  { input: I.RAW_COPPER, output: I.COPPER_INGOT, count: 1, experience: 0.7, cookTime: 100, type: 'blasting' },
  { input: I.IRON_ORE, output: I.IRON_INGOT, count: 1, experience: 0.7, cookTime: 100, type: 'blasting' },
  { input: I.GOLD_ORE, output: I.GOLD_INGOT, count: 1, experience: 1.0, cookTime: 100, type: 'blasting' },
  { input: I.COPPER_ORE, output: I.COPPER_INGOT, count: 1, experience: 0.7, cookTime: 100, type: 'blasting' },
  { input: I.DIAMOND_ORE, output: I.DIAMOND, count: 1, experience: 1.0, cookTime: 100, type: 'blasting' },
  { input: I.EMERALD_ORE, output: I.EMERALD, count: 1, experience: 1.0, cookTime: 100, type: 'blasting' },
  { input: I.LAPIS_ORE, output: I.LAPIS_LAZULI, count: 1, experience: 0.2, cookTime: 100, type: 'blasting' },
  { input: I.REDSTONE_ORE, output: I.REDSTONE_DUST, count: 1, experience: 0.7, cookTime: 100, type: 'blasting' },
  { input: B.QUARTZ_ORE, output: I.QUARTZ, count: 1, experience: 0.2, cookTime: 100, type: 'blasting' },
  { input: B.NETHER_GOLD_ORE, output: I.GOLD_INGOT, count: 1, experience: 1.0, cookTime: 100, type: 'blasting' },
  { input: B.COAL_ORE, output: I.COAL, count: 1, experience: 0.1, cookTime: 100, type: 'blasting' },
  { input: B.ANCIENT_DEBRIS, output: I.NETHERITE_SCRAP, count: 1, experience: 2.0, cookTime: 100, type: 'blasting' },

  // Deepslate ores (blasting)
  { input: I.DEEPSLATE_IRON_ORE ?? I.IRON_ORE, output: I.IRON_INGOT, count: 1, experience: 0.7, cookTime: 100, type: 'blasting' },
  { input: I.DEEPSLATE_GOLD_ORE ?? I.GOLD_ORE, output: I.GOLD_INGOT, count: 1, experience: 1.0, cookTime: 100, type: 'blasting' },
  { input: I.DEEPSLATE_COPPER_ORE ?? I.COPPER_ORE, output: I.COPPER_INGOT, count: 1, experience: 0.7, cookTime: 100, type: 'blasting' },
  { input: I.DEEPSLATE_DIAMOND_ORE ?? I.DIAMOND_ORE, output: I.DIAMOND, count: 1, experience: 1.0, cookTime: 100, type: 'blasting' },

  // Iron/gold armor (blasting)
  { input: I.IRON_HELMET, output: I.IRON_NUGGET, count: 5, experience: 0.1, cookTime: 100, type: 'blasting' },
  { input: I.IRON_CHESTPLATE, output: I.IRON_NUGGET, count: 8, experience: 0.1, cookTime: 100, type: 'blasting' },
  { input: I.IRON_LEGGINGS, output: I.IRON_NUGGET, count: 7, experience: 0.1, cookTime: 100, type: 'blasting' },
  { input: I.IRON_BOOTS, output: I.IRON_NUGGET, count: 4, experience: 0.1, cookTime: 100, type: 'blasting' },
  { input: I.GOLDEN_HELMET, output: I.GOLD_NUGGET, count: 5, experience: 0.1, cookTime: 100, type: 'blasting' },
  { input: I.GOLDEN_CHESTPLATE, output: I.GOLD_NUGGET, count: 8, experience: 0.1, cookTime: 100, type: 'blasting' },
  { input: I.GOLDEN_LEGGINGS, output: I.GOLD_NUGGET, count: 7, experience: 0.1, cookTime: 100, type: 'blasting' },
  { input: I.GOLDEN_BOOTS, output: I.GOLD_NUGGET, count: 4, experience: 0.1, cookTime: 100, type: 'blasting' },

  // ─── CHAINMAIL (blasting) ────────────────────────────────────────────────
  { input: I.CHAINMAIL_HELMET, output: I.IRON_NUGGET, count: 5, experience: 0.1, cookTime: 100, type: 'blasting' },
  { input: I.CHAINMAIL_CHESTPLATE, output: I.IRON_NUGGET, count: 8, experience: 0.1, cookTime: 100, type: 'blasting' },
  { input: I.CHAINMAIL_LEGGINGS, output: I.IRON_NUGGET, count: 7, experience: 0.1, cookTime: 100, type: 'blasting' },
  { input: I.CHAINMAIL_BOOTS, output: I.IRON_NUGGET, count: 4, experience: 0.1, cookTime: 100, type: 'blasting' },

  // âââ CHAINMAIL (smelting) ââââââââââââââââââââââ
  { input: I.CHAINMAIL_HELMET, output: I.IRON_NUGGET, count: 5, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: I.CHAINMAIL_CHESTPLATE, output: I.IRON_NUGGET, count: 8, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: I.CHAINMAIL_LEGGINGS, output: I.IRON_NUGGET, count: 7, experience: 0.1, cookTime: 200, type: 'smelting' },
  { input: I.CHAINMAIL_BOOTS, output: I.IRON_NUGGET, count: 4, experience: 0.1, cookTime: 200, type: 'smelting' },
];

/**
 * Fuel registry — item/block IDs to burn time in ticks.
 * 1 tick = 1/20 second. 200 ticks = 10 seconds.
 */
const fuelEntries: FuelEntry[] = [
  // ─── WOOD-BASED (300 ticks = 15 seconds) ─────────────────────────────────
  { id: B.OAK_PLANKS, burnTime: 300 },
  { id: B.SPRUCE_PLANKS, burnTime: 300 },
  { id: B.BIRCH_PLANKS, burnTime: 300 },
  { id: B.JUNGLE_PLANKS, burnTime: 300 },
  { id: B.ACACIA_PLANKS, burnTime: 300 },
  { id: B.DARK_OAK_PLANKS, burnTime: 300 },
  { id: B.CHERRY_PLANKS, burnTime: 300 },
  { id: B.BAMBOO_PLANKS, burnTime: 300 },
  { id: B.MANGROVE_PLANKS, burnTime: 300 },
  { id: B.CRIMSON_PLANKS, burnTime: 300 },
  { id: B.WARPED_PLANKS, burnTime: 300 },

  // Logs (300 ticks)
  { id: B.OAK_LOG, burnTime: 300 },
  { id: B.SPRUCE_LOG, burnTime: 300 },
  { id: B.BIRCH_LOG, burnTime: 300 },
  { id: B.JUNGLE_LOG, burnTime: 300 },
  { id: B.ACACIA_LOG, burnTime: 300 },
  { id: B.DARK_OAK_LOG, burnTime: 300 },
  { id: B.CHERRY_LOG, burnTime: 300 },
  { id: B.BAMBOO_BLOCK, burnTime: 300 },
  { id: B.MANGROVE_LOG, burnTime: 300 },
  { id: B.CRIMSON_STEM, burnTime: 300 },
  { id: B.WARPED_STEM, burnTime: 300 },

  // Wood (bark all sides) (300 ticks)
  { id: B.OAK_WOOD ?? B.OAK_LOG, burnTime: 300 },
  { id: B.SPRUCE_WOOD ?? B.SPRUCE_LOG, burnTime: 300 },
  { id: B.BIRCH_WOOD ?? B.BIRCH_LOG, burnTime: 300 },
  { id: B.JUNGLE_WOOD ?? B.JUNGLE_LOG, burnTime: 300 },
  { id: B.ACACIA_WOOD ?? B.ACACIA_LOG, burnTime: 300 },
  { id: B.DARK_OAK_WOOD ?? B.DARK_OAK_LOG, burnTime: 300 },
  { id: B.CHERRY_WOOD, burnTime: 300 },
  { id: B.MANGROVE_WOOD ?? B.MANGROVE_LOG, burnTime: 300 },

  // Slabs (150 ticks)
  { id: B.OAK_SLAB, burnTime: 150 },
  { id: B.SPRUCE_SLAB, burnTime: 150 },
  { id: B.BIRCH_SLAB, burnTime: 150 },
  { id: B.JUNGLE_SLAB, burnTime: 150 },
  { id: B.ACACIA_SLAB, burnTime: 150 },
  { id: B.DARK_OAK_SLAB, burnTime: 150 },
  { id: B.CHERRY_SLAB, burnTime: 150 },
  { id: B.BAMBOO_SLAB, burnTime: 150 },
  { id: B.MANGROVE_SLAB, burnTime: 150 },
  { id: B.CRIMSON_SLAB, burnTime: 150 },
  { id: B.WARPED_SLAB, burnTime: 150 },

  // Sticks (100 ticks = 5 seconds)
  { id: I.STICK, burnTime: 100 },

  // Coal/Charcoal (1600 ticks = 80 seconds)
  { id: I.COAL, burnTime: 1600 },
  { id: I.CHARCOAL, burnTime: 1600 },

  // Coal block (16000 ticks = 800 seconds)
  { id: B.COAL_BLOCK, burnTime: 16000 },

  // Lava bucket (20000 ticks = 1000 seconds)
  { id: I.LAVA_BUCKET, burnTime: 20000 },

  // Blaze rod (2400 ticks = 120 seconds)
  { id: I.BLAZE_ROD, burnTime: 2400 },

  // Dried kelp (200 ticks = 10 seconds)
  { id: I.DRIED_KELP_ITEM, burnTime: 200 },
  { id: B.DRIED_KELP_BLOCK, burnTime: 4000 },

  // Bamboo (50 ticks = 2.5 seconds)
  { id: B.BAMBOO, burnTime: 50 },

  // Crafting table/bookshelf/logs as fuel
  { id: B.CRAFTING_TABLE, burnTime: 300 },
  { id: B.BOOKSHELF, burnTime: 300 },

  // Fence (300 ticks)
  { id: B.OAK_FENCE, burnTime: 300 },
  { id: B.SPRUCE_FENCE, burnTime: 300 },
  { id: B.BIRCH_FENCE, burnTime: 300 },
  { id: B.JUNGLE_FENCE, burnTime: 300 },
  { id: B.ACACIA_FENCE, burnTime: 300 },
  { id: B.DARK_OAK_FENCE, burnTime: 300 },
  { id: B.CHERRY_FENCE, burnTime: 300 },
  { id: B.BAMBOO_FENCE, burnTime: 300 },
  { id: B.MANGROVE_FENCE, burnTime: 300 },

  // Fence gates (300 ticks)
  { id: B.OAK_FENCE_GATE, burnTime: 300 },
  { id: B.SPRUCE_FENCE_GATE, burnTime: 300 },
  { id: B.BIRCH_FENCE_GATE, burnTime: 300 },
  { id: B.JUNGLE_FENCE_GATE, burnTime: 300 },
  { id: B.ACACIA_FENCE_GATE, burnTime: 300 },
  { id: B.DARK_OAK_FENCE_GATE, burnTime: 300 },
  { id: B.CHERRY_FENCE_GATE, burnTime: 300 },
  { id: B.BAMBOO_FENCE_GATE, burnTime: 300 },
  { id: B.MANGROVE_FENCE_GATE, burnTime: 300 },

  // Doors (200 ticks)
  { id: B.OAK_DOOR, burnTime: 200 },
  { id: B.SPRUCE_DOOR, burnTime: 200 },
  { id: B.BIRCH_DOOR, burnTime: 200 },
  { id: B.JUNGLE_DOOR, burnTime: 200 },
  { id: B.ACACIA_DOOR, burnTime: 200 },
  { id: B.DARK_OAK_DOOR, burnTime: 200 },
  { id: B.CHERRY_DOOR, burnTime: 200 },
  { id: B.BAMBOO_DOOR, burnTime: 200 },
  { id: B.MANGROVE_DOOR, burnTime: 200 },
  { id: B.CRIMSON_DOOR, burnTime: 200 },
  { id: B.WARPED_DOOR, burnTime: 200 },

  // Trapdoors (300 ticks)
  { id: B.OAK_TRAPDOOR, burnTime: 300 },

  // Signs (200 ticks)
  { id: I.OAK_SIGN, burnTime: 200 },
  { id: I.SPRUCE_SIGN, burnTime: 200 },
  { id: I.BIRCH_SIGN, burnTime: 200 },
  { id: I.JUNGLE_SIGN, burnTime: 200 },
  { id: I.ACACIA_SIGN, burnTime: 200 },
  { id: I.DARK_OAK_SIGN, burnTime: 200 },
  { id: I.CHERRY_SIGN, burnTime: 200 },
  { id: I.BAMBOO_SIGN, burnTime: 200 },
  { id: I.MANGROVE_SIGN, burnTime: 200 },
  { id: I.CRIMSON_SIGN, burnTime: 200 },
  { id: I.WARPED_SIGN, burnTime: 200 },

  // Boat (200 ticks)
  { id: I.OAK_BOAT, burnTime: 1200 },
  { id: I.SPRUCE_BOAT, burnTime: 1200 },
  { id: I.BIRCH_BOAT, burnTime: 1200 },
  { id: I.JUNGLE_BOAT, burnTime: 1200 },
  { id: I.ACACIA_BOAT, burnTime: 1200 },
  { id: I.DARK_OAK_BOAT, burnTime: 1200 },
  { id: I.CHERRY_BOAT, burnTime: 1200 },
  { id: I.BAMBOO_RAFT, burnTime: 1200 },
  { id: I.MANGROVE_BOAT, burnTime: 1200 },

  // Saplings (100 ticks)
  { id: B.OAK_SAPLING ?? 0, burnTime: 100 },
  { id: B.SPRUCE_SAPLING ?? 0, burnTime: 100 },
  { id: B.BIRCH_SAPLING ?? 0, burnTime: 100 },
  { id: B.JUNGLE_SAPLING ?? 0, burnTime: 100 },
  { id: B.ACACIA_SAPLING ?? 0, burnTime: 100 },
  { id: B.DARK_OAK_SAPLING ?? 0, burnTime: 100 },
  { id: B.CHERRY_SAPLING, burnTime: 100 },
  { id: B.AZALEA_SAPLING, burnTime: 100 },
  { id: B.FLOWERING_AZALEA_SAPLING, burnTime: 100 },

  // Wooden tools (200 ticks)
  { id: I.WOODEN_SWORD, burnTime: 200 },
  { id: I.WOODEN_PICKAXE, burnTime: 200 },
  { id: I.WOODEN_AXE, burnTime: 200 },
  { id: I.WOODEN_SHOVEL, burnTime: 200 },
  { id: I.WOODEN_HOE, burnTime: 200 },

  // Chest/barrel (300 ticks)
  { id: B.CHEST, burnTime: 300 },
  { id: B.TRAPPED_CHEST, burnTime: 300 },
  { id: B.BARREL, burnTime: 300 },

  // Crafting-related blocks
  { id: B.CARTOGRAPHY_TABLE, burnTime: 300 },
  { id: B.FLETCHING_TABLE, burnTime: 300 },
  { id: B.LOOM, burnTime: 300 },
  { id: B.SMITHING_TABLE, burnTime: 300 },
  { id: B.COMPOSTER, burnTime: 300 },

  // Note block / Jukebox
  { id: B.JUKEBOX ?? B.CHEST, burnTime: 300 },

  // Bed (300 ticks)
  { id: I.OAK_BED ?? 0, burnTime: 300 },

  // Bow / Crossbow (300 ticks)
  { id: I.BOW, burnTime: 300 },
  { id: I.CROSSBOW, burnTime: 300 },

  // Fishing rod (300 ticks)
  { id: I.FISHING_ROD, burnTime: 300 },

  // Ladder (300 ticks)
  { id: B.LADDER, burnTime: 300 },

  // Scaffolding (300 ticks)
  { id: B.SCAFFOLDING, burnTime: 50 },

  // Banner (300 ticks)
  { id: I.BANNER_ITEM, burnTime: 300 },
];

// Build lookup maps
const fuelMap = new Map<number, number>();
for (const fuel of fuelEntries) {
  if (fuel.id !== 0) fuelMap.set(fuel.id, fuel.burnTime);
}

const smeltingMap = new Map<number, FurnaceSmeltingRecipe[]>();
for (const recipe of smeltingRecipes) {
  const existing = smeltingMap.get(recipe.input);
  if (existing) existing.push(recipe);
  else smeltingMap.set(recipe.input, [recipe]);
}

/**
 * Get burn time in ticks for an item. Returns 0 if not a fuel.
 */
export function getBurnTime(itemId: number): number {
  return fuelMap.get(itemId) ?? 0;
}

/**
 * Find smelting recipes for an input item, optionally filtered by type.
 */
export function findFurnaceSmeltingRecipes(inputId: number, type?: 'smelting' | 'smoking' | 'blasting'): FurnaceSmeltingRecipe[] {
  const recipes = smeltingMap.get(inputId) ?? [];
  if (type) return recipes.filter(r => r.type === type);
  return recipes;
}

/**
 * Get all smelting recipes.
 */
export function getAllFurnaceSmeltingRecipes(): FurnaceSmeltingRecipe[] {
  return smeltingRecipes;
}

/**
 * Get all fuel entries.
 */
export function getAllFuels(): FuelEntry[] {
  return fuelEntries;
}
