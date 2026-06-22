/**
 * Crafting recipe system — shaped and shapeless recipes.
 * Matches Minecraft Java Edition crafting mechanics.
 */

import { ITEM } from './items.js';
import { BLOCK } from './blocks.js';

// ─── Recipe Types ──────────────────────────────────────────────────────────────

export type CraftingPattern = (number | null)[][];

export interface ShapedRecipe {
  type: 'shaped';
  pattern: CraftingPattern;  // 2D grid of item/block IDs (null = empty)
  key: Record<string, number>; // letter → item/block ID mapping
  result: { itemId: number; count: number };
  group?: string; // for recipe book grouping
}

export interface ShapelessRecipe {
  type: 'shapeless';
  ingredients: number[]; // list of item/block IDs required
  result: { itemId: number; count: number };
  group?: string;
}

export type CraftingRecipe = ShapedRecipe | ShapelessRecipe;

// ─── Recipe Book ───────────────────────────────────────────────────────────────

const recipes: CraftingRecipe[] = [];

export function registerRecipe(recipe: CraftingRecipe): void {
  recipes.push(recipe);
}

export function getRecipes(): readonly CraftingRecipe[] {
  return recipes;
}

// ─── Recipe Matching ───────────────────────────────────────────────────────────

/**
 * Check if a 3×3 (or 2×2) crafting grid matches a shaped recipe.
 * The pattern is checked against the top-left corner of the grid.
 */
function matchShaped(
  grid: (number | null)[][],
  recipe: ShapedRecipe,
  gridWidth: number,
  gridHeight: number,
): boolean {
  const pattern = recipe.pattern;
  const patternHeight = pattern.length;
  const patternWidth = pattern[0]?.length ?? 0;

  if (patternWidth > gridWidth || patternHeight > gridHeight) return false;

  // Try each possible offset
  for (let oy = 0; oy <= gridHeight - patternHeight; oy++) {
    for (let ox = 0; ox <= gridWidth - patternWidth; ox++) {
      let match = true;
      for (let py = 0; py < patternHeight && match; py++) {
        for (let px = 0; px < patternWidth && match; px++) {
          const gridItem = grid[oy + py]?.[ox + px] ?? null;
          const patternItem = pattern[py]?.[px] ?? null;
          if (gridItem !== patternItem) match = false;
        }
      }
      if (match) return true;
    }
  }
  return false;
}

/**
 * Check if a crafting grid matches a shapeless recipe.
 */
function matchShapeless(
  grid: (number | null)[][],
  recipe: ShapelessRecipe,
): boolean {
  const flatGrid = grid.flat().filter((x): x is number => x !== null);
  const needed = [...recipe.ingredients];

  if (flatGrid.length !== needed.length) return false;

  for (const item of flatGrid) {
    const idx = needed.indexOf(item);
    if (idx === -1) return false;
    needed.splice(idx, 1);
  }

  return needed.length === 0;
}

/**
 * Find matching recipe for a crafting grid.
 * Returns the output item if a recipe matches, null otherwise.
 */
export function findRecipe(
  grid: (number | null)[][],
  gridWidth: number,
  gridHeight: number,
): { itemId: number; count: number } | null {
  for (const recipe of recipes) {
    if (recipe.type === 'shaped') {
      if (matchShaped(grid, recipe, gridWidth, gridHeight)) {
        return recipe.result;
      }
    } else {
      if (matchShapeless(grid, recipe)) {
        return recipe.result;
      }
    }
  }
  return null;
}

// ─── Fuel Values ───────────────────────────────────────────────────────────────

/** Burn time in seconds for fuel items. */
export const FUEL_TIMES: Record<number, number> = {
  [ITEM.COAL]: 8,
  [ITEM.CHARCOAL]: 8,
  [ITEM.BLAZE_ROD]: 12,
  [ITEM.STICK]: 0.5,
  [BLOCK.OAK_PLANKS]: 0.75,
  [BLOCK.SPRUCE_PLANKS]: 0.75,
  [BLOCK.BIRCH_PLANKS]: 0.75,
  [BLOCK.JUNGLE_PLANKS]: 0.75,
  [BLOCK.ACACIA_PLANKS]: 0.75,
  [BLOCK.DARK_OAK_PLANKS]: 0.75,
  [BLOCK.CHERRY_PLANKS]: 0.75,
  [BLOCK.BAMBOO_PLANKS]: 0.75,
  [BLOCK.MANGROVE_PLANKS]: 0.75,
  [BLOCK.CRIMSON_PLANKS]: 0.75,
  [BLOCK.WARPED_PLANKS]: 0.75,
  [ITEM.BOOK]: 0.75,
  [BLOCK.BOOKSHELF]: 0.75,
  [BLOCK.CRAFTING_TABLE]: 0.75,
  [BLOCK.CHEST]: 0.75,
  [BLOCK.BARREL]: 0.75,
  [BLOCK.TRAPPED_CHEST]: 0.75,
  [BLOCK.ENDER_CHEST]: 0.75,
  [BLOCK.DAYLIGHT_DETECTOR]: 0.75,
  [BLOCK.JUKEBOX]: 0.75,
  [ITEM.BANNER_ITEM]: 0.75,
  [ITEM.BOW]: 0.75,
  [ITEM.FISHING_ROD]: 0.75,
  [ITEM.BOWL]: 0.75,
  [ITEM.WOODEN_SWORD]: 0.75,
  [ITEM.WOODEN_PICKAXE]: 0.75,
  [ITEM.WOODEN_AXE]: 0.75,
  [ITEM.WOODEN_SHOVEL]: 0.75,
  [ITEM.WOODEN_HOE]: 0.75,
  [BLOCK.COAL_BLOCK]: 80,
  [BLOCK.HAY_BALE]: 20,
  [BLOCK.DRIED_KELP_BLOCK]: 20,
  [BLOCK.SCAFFOLDING]: 0.25,
  [BLOCK.BAMBOO_MOSAIC]: 0.75,
  [BLOCK.BAMBOO_MOSAIC_STAIRS]: 0.75,
  [BLOCK.BAMBOO_MOSAIC_SLAB]: 0.75,
  [BLOCK.BAMBOO_BLOCK]: 0.75,
};

/**
 * Get burn time for a fuel item.
 */
export function getFuelTime(itemId: number): number {
  return FUEL_TIMES[itemId] ?? 0;
}

// ─── Smelting Recipes ──────────────────────────────────────────────────────────

export interface SmeltingRecipe {
  input: number;       // item/block ID
  result: { itemId: number; count: number };
  experience: number;  // XP gained per smelt
  group?: string;
}

const smeltingRecipes: SmeltingRecipe[] = [];

export function registerSmeltingRecipe(recipe: SmeltingRecipe): void {
  smeltingRecipes.push(recipe);
}

export function getSmeltingRecipes(): readonly SmeltingRecipe[] {
  return smeltingRecipes;
}

export function findSmeltingRecipe(inputId: number): SmeltingRecipe | undefined {
  return smeltingRecipes.find(r => r.input === inputId);
}

// ─── Initialize All Recipes ────────────────────────────────────────────────────

export function initRecipes(): void {
  // === PLANKS FROM LOGS ===
  const logToPlank: [number, number][] = [
    [BLOCK.OAK_LOG, BLOCK.OAK_PLANKS],
    [BLOCK.SPRUCE_LOG, BLOCK.SPRUCE_PLANKS],
    [BLOCK.BIRCH_LOG, BLOCK.BIRCH_PLANKS],
    [BLOCK.JUNGLE_LOG, BLOCK.JUNGLE_PLANKS],
    [BLOCK.ACACIA_LOG, BLOCK.ACACIA_PLANKS],
    [BLOCK.DARK_OAK_LOG, BLOCK.DARK_OAK_PLANKS],
    [BLOCK.CHERRY_LOG, BLOCK.CHERRY_PLANKS],
    [BLOCK.MANGROVE_LOG, BLOCK.MANGROVE_PLANKS],
    [BLOCK.BAMBOO_BLOCK, BLOCK.BAMBOO_PLANKS],
    [BLOCK.CRIMSON_STEM, BLOCK.CRIMSON_PLANKS],
    [BLOCK.WARPED_STEM, BLOCK.WARPED_PLANKS],
  ];

  for (const [log, plank] of logToPlank) {
    registerRecipe({
      type: 'shapeless',
      ingredients: [log],
      result: { itemId: plank, count: 4 },
      group: 'planks',
    });
  }

  // === STICKS (2 planks → 4 sticks) ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.OAK_PLANKS, null],
      [BLOCK.OAK_PLANKS, null],
    ],
    key: {},
    result: { itemId: ITEM.STICK, count: 4 },
    group: 'sticks',
  });

  // === TORCHES (stick + coal) ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.COAL, null],
      [ITEM.STICK, null],
    ],
    key: {},
    result: { itemId: BLOCK.TORCH, count: 4 },
    group: 'torches',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.CHARCOAL, null],
      [ITEM.STICK, null],
    ],
    key: {},
    result: { itemId: BLOCK.TORCH, count: 4 },
    group: 'torches',
  });

  // === CRAFTING TABLE (4 planks) ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.OAK_PLANKS, BLOCK.OAK_PLANKS],
      [BLOCK.OAK_PLANKS, BLOCK.OAK_PLANKS],
    ],
    key: {},
    result: { itemId: BLOCK.CRAFTING_TABLE, count: 1 },
    group: 'crafting',
  });

  // === CHEST (8 planks) ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.OAK_PLANKS, BLOCK.OAK_PLANKS, BLOCK.OAK_PLANKS],
      [BLOCK.OAK_PLANKS, null, BLOCK.OAK_PLANKS],
      [BLOCK.OAK_PLANKS, BLOCK.OAK_PLANKS, BLOCK.OAK_PLANKS],
    ],
    key: {},
    result: { itemId: BLOCK.CHEST, count: 1 },
    group: 'chest',
  });

  // === FURNACE (8 cobblestone) ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.COBBLESTONE, BLOCK.COBBLESTONE, BLOCK.COBBLESTONE],
      [BLOCK.COBBLESTONE, null, BLOCK.COBBLESTONE],
      [BLOCK.COBBLESTONE, BLOCK.COBBLESTONE, BLOCK.COBBLESTONE],
    ],
    key: {},
    result: { itemId: BLOCK.FURNACE, count: 1 },
    group: 'furnace',
  });

  // === WOODEN TOOLS ===
  // Sword
  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.OAK_PLANKS],
      [BLOCK.OAK_PLANKS],
      [ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.WOODEN_SWORD, count: 1 },
    group: 'weapons',
  });

  // Pickaxe
  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.OAK_PLANKS, BLOCK.OAK_PLANKS, BLOCK.OAK_PLANKS],
      [null, ITEM.STICK, null],
      [null, ITEM.STICK, null],
    ],
    key: {},
    result: { itemId: ITEM.WOODEN_PICKAXE, count: 1 },
    group: 'tools',
  });

  // Axe
  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.OAK_PLANKS, BLOCK.OAK_PLANKS],
      [BLOCK.OAK_PLANKS, ITEM.STICK],
      [null, ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.WOODEN_AXE, count: 1 },
    group: 'tools',
  });

  // Shovel
  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.OAK_PLANKS],
      [ITEM.STICK],
      [ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.WOODEN_SHOVEL, count: 1 },
    group: 'tools',
  });

  // Hoe
  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.OAK_PLANKS, BLOCK.OAK_PLANKS],
      [null, ITEM.STICK],
      [null, ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.WOODEN_HOE, count: 1 },
    group: 'tools',
  });

  // === STONE TOOLS ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.COBBLESTONE, BLOCK.COBBLESTONE, BLOCK.COBBLESTONE],
      [null, ITEM.STICK, null],
      [null, ITEM.STICK, null],
    ],
    key: {},
    result: { itemId: ITEM.STONE_PICKAXE, count: 1 },
    group: 'tools',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.COBBLESTONE],
      [BLOCK.COBBLESTONE],
      [ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.STONE_SWORD, count: 1 },
    group: 'weapons',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.COBBLESTONE, BLOCK.COBBLESTONE],
      [BLOCK.COBBLESTONE, ITEM.STICK],
      [null, ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.STONE_AXE, count: 1 },
    group: 'tools',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.COBBLESTONE],
      [ITEM.STICK],
      [ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.STONE_SHOVEL, count: 1 },
    group: 'tools',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.COBBLESTONE, BLOCK.COBBLESTONE],
      [null, ITEM.STICK],
      [null, ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.STONE_HOE, count: 1 },
    group: 'tools',
  });

  // === IRON TOOLS ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.IRON_INGOT, ITEM.IRON_INGOT, ITEM.IRON_INGOT],
      [null, ITEM.STICK, null],
      [null, ITEM.STICK, null],
    ],
    key: {},
    result: { itemId: ITEM.IRON_PICKAXE, count: 1 },
    group: 'tools',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.IRON_INGOT],
      [ITEM.IRON_INGOT],
      [ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.IRON_SWORD, count: 1 },
    group: 'weapons',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.IRON_INGOT, ITEM.IRON_INGOT],
      [ITEM.IRON_INGOT, ITEM.STICK],
      [null, ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.IRON_AXE, count: 1 },
    group: 'tools',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.IRON_INGOT],
      [ITEM.STICK],
      [ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.IRON_SHOVEL, count: 1 },
    group: 'tools',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.IRON_INGOT, ITEM.IRON_INGOT],
      [null, ITEM.STICK],
      [null, ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.IRON_HOE, count: 1 },
    group: 'tools',
  });

  // === DIAMOND TOOLS ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.DIAMOND, ITEM.DIAMOND, ITEM.DIAMOND],
      [null, ITEM.STICK, null],
      [null, ITEM.STICK, null],
    ],
    key: {},
    result: { itemId: ITEM.DIAMOND_PICKAXE, count: 1 },
    group: 'tools',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.DIAMOND],
      [ITEM.DIAMOND],
      [ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.DIAMOND_SWORD, count: 1 },
    group: 'weapons',
  });

  // Diamond Axe
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.DIAMOND, ITEM.DIAMOND],
      [ITEM.DIAMOND, ITEM.STICK],
      [null, ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.DIAMOND_AXE, count: 1 },
    group: 'tools',
  });

  // Diamond Shovel
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.DIAMOND],
      [ITEM.STICK],
      [ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.DIAMOND_SHOVEL, count: 1 },
    group: 'tools',
  });

  // Diamond Hoe
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.DIAMOND, ITEM.DIAMOND],
      [null, ITEM.STICK],
      [null, ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.DIAMOND_HOE, count: 1 },
    group: 'tools',
  });

  // === GOLDEN TOOLS ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.GOLD_INGOT, ITEM.GOLD_INGOT, ITEM.GOLD_INGOT],
      [null, ITEM.STICK, null],
      [null, ITEM.STICK, null],
    ],
    key: {},
    result: { itemId: ITEM.GOLDEN_PICKAXE, count: 1 },
    group: 'tools',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.GOLD_INGOT],
      [ITEM.GOLD_INGOT],
      [ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.GOLDEN_SWORD, count: 1 },
    group: 'weapons',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.GOLD_INGOT, ITEM.GOLD_INGOT],
      [ITEM.GOLD_INGOT, ITEM.STICK],
      [null, ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.GOLDEN_AXE, count: 1 },
    group: 'tools',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.GOLD_INGOT],
      [ITEM.STICK],
      [ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.GOLDEN_SHOVEL, count: 1 },
    group: 'tools',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.GOLD_INGOT, ITEM.GOLD_INGOT],
      [null, ITEM.STICK],
      [null, ITEM.STICK],
    ],
    key: {},
    result: { itemId: ITEM.GOLDEN_HOE, count: 1 },
    group: 'tools',
  });

  // === ARMOR ===
  // Iron Helmet
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.IRON_INGOT, ITEM.IRON_INGOT, ITEM.IRON_INGOT],
      [ITEM.IRON_INGOT, null, ITEM.IRON_INGOT],
    ],
    key: {},
    result: { itemId: ITEM.IRON_HELMET, count: 1 },
    group: 'armor',
  });

  // Iron Chestplate
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.IRON_INGOT, null, ITEM.IRON_INGOT],
      [ITEM.IRON_INGOT, ITEM.IRON_INGOT, ITEM.IRON_INGOT],
      [ITEM.IRON_INGOT, ITEM.IRON_INGOT, ITEM.IRON_INGOT],
    ],
    key: {},
    result: { itemId: ITEM.IRON_CHESTPLATE, count: 1 },
    group: 'armor',
  });

  // Iron Leggings
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.IRON_INGOT, ITEM.IRON_INGOT, ITEM.IRON_INGOT],
      [ITEM.IRON_INGOT, null, ITEM.IRON_INGOT],
      [ITEM.IRON_INGOT, null, ITEM.IRON_INGOT],
    ],
    key: {},
    result: { itemId: ITEM.IRON_LEGGINGS, count: 1 },
    group: 'armor',
  });

  // Iron Boots
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.IRON_INGOT, null, ITEM.IRON_INGOT],
      [ITEM.IRON_INGOT, null, ITEM.IRON_INGOT],
    ],
    key: {},
    result: { itemId: ITEM.IRON_BOOTS, count: 1 },
    group: 'armor',
  });

  // === LEATHER ARMOR ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.LEATHER, ITEM.LEATHER, ITEM.LEATHER],
      [ITEM.LEATHER, null, ITEM.LEATHER],
    ],
    key: {},
    result: { itemId: ITEM.LEATHER_HELMET, count: 1 },
    group: 'armor',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.LEATHER, null, ITEM.LEATHER],
      [ITEM.LEATHER, ITEM.LEATHER, ITEM.LEATHER],
      [ITEM.LEATHER, ITEM.LEATHER, ITEM.LEATHER],
    ],
    key: {},
    result: { itemId: ITEM.LEATHER_CHESTPLATE, count: 1 },
    group: 'armor',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.LEATHER, ITEM.LEATHER, ITEM.LEATHER],
      [ITEM.LEATHER, null, ITEM.LEATHER],
      [ITEM.LEATHER, null, ITEM.LEATHER],
    ],
    key: {},
    result: { itemId: ITEM.LEATHER_LEGGINGS, count: 1 },
    group: 'armor',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.LEATHER, null, ITEM.LEATHER],
      [ITEM.LEATHER, null, ITEM.LEATHER],
    ],
    key: {},
    result: { itemId: ITEM.LEATHER_BOOTS, count: 1 },
    group: 'armor',
  });

  // === DIAMOND ARMOR ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.DIAMOND, ITEM.DIAMOND, ITEM.DIAMOND],
      [ITEM.DIAMOND, null, ITEM.DIAMOND],
    ],
    key: {},
    result: { itemId: ITEM.DIAMOND_HELMET, count: 1 },
    group: 'armor',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.DIAMOND, null, ITEM.DIAMOND],
      [ITEM.DIAMOND, ITEM.DIAMOND, ITEM.DIAMOND],
      [ITEM.DIAMOND, ITEM.DIAMOND, ITEM.DIAMOND],
    ],
    key: {},
    result: { itemId: ITEM.DIAMOND_CHESTPLATE, count: 1 },
    group: 'armor',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.DIAMOND, ITEM.DIAMOND, ITEM.DIAMOND],
      [ITEM.DIAMOND, null, ITEM.DIAMOND],
      [ITEM.DIAMOND, null, ITEM.DIAMOND],
    ],
    key: {},
    result: { itemId: ITEM.DIAMOND_LEGGINGS, count: 1 },
    group: 'armor',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.DIAMOND, null, ITEM.DIAMOND],
      [ITEM.DIAMOND, null, ITEM.DIAMOND],
    ],
    key: {},
    result: { itemId: ITEM.DIAMOND_BOOTS, count: 1 },
    group: 'armor',
  });

  // === GOLDEN ARMOR ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.GOLD_INGOT, ITEM.GOLD_INGOT, ITEM.GOLD_INGOT],
      [ITEM.GOLD_INGOT, null, ITEM.GOLD_INGOT],
    ],
    key: {},
    result: { itemId: ITEM.GOLDEN_HELMET, count: 1 },
    group: 'armor',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.GOLD_INGOT, null, ITEM.GOLD_INGOT],
      [ITEM.GOLD_INGOT, ITEM.GOLD_INGOT, ITEM.GOLD_INGOT],
      [ITEM.GOLD_INGOT, ITEM.GOLD_INGOT, ITEM.GOLD_INGOT],
    ],
    key: {},
    result: { itemId: ITEM.GOLDEN_CHESTPLATE, count: 1 },
    group: 'armor',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.GOLD_INGOT, ITEM.GOLD_INGOT, ITEM.GOLD_INGOT],
      [ITEM.GOLD_INGOT, null, ITEM.GOLD_INGOT],
      [ITEM.GOLD_INGOT, null, ITEM.GOLD_INGOT],
    ],
    key: {},
    result: { itemId: ITEM.GOLDEN_LEGGINGS, count: 1 },
    group: 'armor',
  });

  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.GOLD_INGOT, null, ITEM.GOLD_INGOT],
      [ITEM.GOLD_INGOT, null, ITEM.GOLD_INGOT],
    ],
    key: {},
    result: { itemId: ITEM.GOLDEN_BOOTS, count: 1 },
    group: 'armor',
  });

  // === BUCKETS (3 iron ingots) ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [null, ITEM.IRON_INGOT, null],
      [ITEM.IRON_INGOT, null, ITEM.IRON_INGOT],
    ],
    key: {},
    result: { itemId: ITEM.BUCKET, count: 1 },
    group: 'misc',
  });

  // === SHIELD (iron + planks) ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [ITEM.IRON_INGOT, BLOCK.OAK_PLANKS, null],
      [ITEM.IRON_INGOT, BLOCK.OAK_PLANKS, BLOCK.OAK_PLANKS],
      [null, BLOCK.OAK_PLANKS, null],
    ],
    key: {},
    result: { itemId: ITEM.SHIELD, count: 1 },
    group: 'combat',
  });

  // === BED (3 wool + 3 planks) ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.WHITE_WOOL, BLOCK.WHITE_WOOL, BLOCK.WHITE_WOOL],
      [BLOCK.OAK_PLANKS, BLOCK.OAK_PLANKS, BLOCK.OAK_PLANKS],
    ],
    key: {},
    result: { itemId: 1, count: 1 }, // TODO: bed item
    group: 'decorations',
  });

  // === BREAD (3 wheat) ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.WHEAT, BLOCK.WHEAT, BLOCK.WHEAT],
    ],
    key: {},
    result: { itemId: ITEM.BREAD, count: 1 },
    group: 'food',
  });

  // === COOKIE (wheat + cocoa) ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [BLOCK.WHEAT, ITEM.COCOA_BEANS, BLOCK.WHEAT],
    ],
    key: {},
    result: { itemId: ITEM.COOKIE, count: 8 },
    group: 'food',
  });

  // === SHEARS (2 iron ingots) ===
  registerRecipe({
    type: 'shaped',
    pattern: [
      [null, ITEM.IRON_INGOT],
      [ITEM.IRON_INGOT, null],
    ],
    key: {},
    result: { itemId: ITEM.SHEARS, count: 1 },
    group: 'tools',
  });

  // === FLINT AND STEEL (iron + flint) ===
  registerRecipe({
    type: 'shapeless',
    ingredients: [ITEM.IRON_INGOT, ITEM.FLINT],
    result: { itemId: ITEM.FLINT_AND_STEEL, count: 1 },
    group: 'tools',
  });

  // === SMELTING RECIPES ===
  // Ores
  registerSmeltingRecipe({ input: BLOCK.IRON_ORE, result: { itemId: ITEM.IRON_INGOT, count: 1 }, experience: 0.7 });
  registerSmeltingRecipe({ input: BLOCK.GOLD_ORE, result: { itemId: ITEM.GOLD_INGOT, count: 1 }, experience: 1.0 });
  registerSmeltingRecipe({ input: BLOCK.DIAMOND_ORE, result: { itemId: ITEM.DIAMOND, count: 1 }, experience: 1.0 });
  registerSmeltingRecipe({ input: BLOCK.EMERALD_ORE, result: { itemId: ITEM.EMERALD, count: 1 }, experience: 1.0 });
  registerSmeltingRecipe({ input: BLOCK.LAPIS_ORE, result: { itemId: ITEM.LAPIS_LAZULI, count: 4 }, experience: 0.2 });
  registerSmeltingRecipe({ input: BLOCK.REDSTONE_ORE, result: { itemId: ITEM.REDSTONE_DUST, count: 4 }, experience: 0.3 });
  registerSmeltingRecipe({ input: BLOCK.COPPER_ORE, result: { itemId: ITEM.COPPER_INGOT, count: 1 }, experience: 0.7 });
  registerSmeltingRecipe({ input: BLOCK.NETHER_GOLD_ORE, result: { itemId: ITEM.GOLD_INGOT, count: 1 }, experience: 1.0 });
  registerSmeltingRecipe({ input: BLOCK.QUARTZ_ORE, result: { itemId: ITEM.QUARTZ, count: 1 }, experience: 0.2 });

  // Food
  registerSmeltingRecipe({ input: ITEM.RAW_BEEF, result: { itemId: ITEM.COOKED_BEEF, count: 1 }, experience: 0.35 });
  registerSmeltingRecipe({ input: ITEM.PORKCHOP, result: { itemId: ITEM.COOKED_PORKCHOP, count: 1 }, experience: 0.35 });
  registerSmeltingRecipe({ input: ITEM.RAW_CHICKEN, result: { itemId: ITEM.COOKED_CHICKEN, count: 1 }, experience: 0.35 });
  registerSmeltingRecipe({ input: ITEM.MUTTON, result: { itemId: ITEM.COOKED_MUTTON, count: 1 }, experience: 0.35 });
  registerSmeltingRecipe({ input: ITEM.COD, result: { itemId: ITEM.COOKED_COD, count: 1 }, experience: 0.35 });
  registerSmeltingRecipe({ input: ITEM.SALMON, result: { itemId: ITEM.COOKED_SALMON, count: 1 }, experience: 0.35 });
  registerSmeltingRecipe({ input: ITEM.POTATO, result: { itemId: ITEM.BAKED_POTATO, count: 1 }, experience: 0.35 });
  registerSmeltingRecipe({ input: ITEM.RAW_RABBIT, result: { itemId: ITEM.COOKED_RABBIT, count: 1 }, experience: 0.35 });

  // Misc
  registerSmeltingRecipe({ input: BLOCK.SAND, result: { itemId: BLOCK.GLASS, count: 1 }, experience: 0.1 });
  registerSmeltingRecipe({ input: BLOCK.COBBLESTONE, result: { itemId: BLOCK.STONE, count: 1 }, experience: 0.1 });
  registerSmeltingRecipe({ input: ITEM.COAL, result: { itemId: ITEM.CHARCOAL, count: 1 }, experience: 0.1 });
  registerSmeltingRecipe({ input: BLOCK.CLAY, result: { itemId: BLOCK.BRICK, count: 1 }, experience: 0.3 });
  registerSmeltingRecipe({ input: BLOCK.CACTUS, result: { itemId: ITEM.GREEN_DYE ?? ITEM.BONE_MEAL, count: 1 }, experience: 0.2 }); // green dye TODO
  registerSmeltingRecipe({ input: ITEM.CLAY_BALL, result: { itemId: BLOCK.BRICK, count: 1 }, experience: 0.3 });
  registerSmeltingRecipe({ input: ITEM.IRON_NUGGET, result: { itemId: ITEM.IRON_INGOT, count: 1 }, experience: 0.1 });
  registerSmeltingRecipe({ input: ITEM.GOLD_NUGGET, result: { itemId: ITEM.GOLD_INGOT, count: 1 }, experience: 0.1 });
  registerSmeltingRecipe({ input: BLOCK.WET_SPONGE, result: { itemId: BLOCK.SPONGE, count: 1 }, experience: 0.15 });
  registerSmeltingRecipe({ input: ITEM.DRIED_KELP_ITEM, result: { itemId: ITEM.DRIED_KELP_ITEM, count: 1 }, experience: 0.1 });
  registerSmeltingRecipe({ input: BLOCK.NETHERRACK, result: { itemId: ITEM.NETHERITE_SCRAP, count: 1 }, experience: 1.0 }); // ancient debris smelt
}
