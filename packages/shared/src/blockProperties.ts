/**
 * Block properties — hardness, light, transparency, tool, gravity, flammability.
 * 
 * Breaking formula follows https://minecraft.wiki/w/Breaking#Speed
 */
import { BLOCK } from './blocks.js';
import { getItemProperties } from './items.js';

export type ToolType = 'none' | 'pickaxe' | 'axe' | 'shovel' | 'hoe' | 'shears' | 'sword';

export interface BlockProperties {
  hardness: number;
  resistance: number;
  lightLevel: number;
  transparent: boolean;
  solid: boolean;
  liquid: boolean;
  gravity: boolean;
  flammable: boolean;
  requiredTool: ToolType;
  minToolTier: number;
  replaceable: boolean;
  ticks: boolean;
  silkTouch: boolean;
}

const P: Record<number, BlockProperties> = {};

function b(h: number, r: number, l: number, t: boolean, s: boolean, li: boolean, g: boolean, f: boolean, tool: ToolType, tier: number, rep = false, ticks = false, silkTouch = false): BlockProperties {
  return { hardness: h, resistance: r, lightLevel: l, transparent: t, solid: s, liquid: li, gravity: g, flammable: f, requiredTool: tool, minToolTier: tier, replaceable: rep, ticks, silkTouch };
}

P[BLOCK.AIR] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.STONE] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.GRASS] = b(0.6,0.6,0,false,true,false,false,false,'shovel',0);
P[BLOCK.DIRT] = b(0.5,0.5,0,false,true,false,false,false,'shovel',0);
P[BLOCK.COBBLESTONE] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.OAK_PLANKS] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.OAK_LOG] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.OAK_LEAVES] = b(0.2,0.2,0,true,false,false,false,true,'shears',0,false,false,true);
P[BLOCK.BEDROCK] = b(-1,3600000,0,false,true,false,false,false,'none',0);
P[BLOCK.WATER] = b(100,500,0,true,false,false,false,false,'none',0,true);
P[BLOCK.LAVA] = b(100,500,15,true,false,false,true,false,'none',0,true);
P[BLOCK.SAND] = b(0.5,0.5,0,false,true,false,true,false,'shovel',0);
P[BLOCK.GRAVEL] = b(0.6,0.6,0,false,true,false,true,false,'shovel',0);
P[BLOCK.IRON_ORE] = b(3,3,0,false,true,false,false,false,'pickaxe',1);
P[BLOCK.COAL_ORE] = b(3,3,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.GOLD_ORE] = b(3,3,0,false,true,false,false,false,'pickaxe',2);
P[BLOCK.DIAMOND_ORE] = b(3,3,0,false,true,false,false,false,'pickaxe',2);
P[BLOCK.REDSTONE_ORE] = b(3,3,0,false,true,false,false,false,'pickaxe',2);
P[BLOCK.LAPIS_ORE] = b(3,3,0,false,true,false,false,false,'pickaxe',1);
P[BLOCK.OBSIDIAN] = b(50,1200,0,false,true,false,false,false,'pickaxe',3);
P[BLOCK.NETHERRACK] = b(0.4,0.4,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.SOUL_SAND] = b(0.5,0.5,0,false,true,false,false,false,'shovel',0);
P[BLOCK.GLOWSTONE] = b(0.3,0.3,15,true,false,false,false,false,'none',0);
P[BLOCK.STONE_BRICK] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.BRICK] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.TNT] = b(0,0,0,false,true,false,false,true,'none',0);
P[BLOCK.BOOKSHELF] = b(1.5,1.5,0,false,true,false,false,true,'axe',0);
P[BLOCK.SNOW] = b(0.2,0.2,0,false,true,false,false,false,'shovel',0);
P[BLOCK.ICE] = b(0.5,0.5,0,true,false,false,false,false,'pickaxe',0);
P[BLOCK.CLAY] = b(0.6,0.6,0,false,true,false,false,false,'shovel',0);
P[BLOCK.CACTUS] = b(0.4,0.4,0,false,true,false,false,false,'none',0);
P[BLOCK.SANDSTONE] = b(0.8,0.8,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.IRON_BLOCK] = b(5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.DIAMOND_BLOCK] = b(5,6,0,false,true,false,false,false,'pickaxe',1);
P[BLOCK.GOLD_BLOCK] = b(3,6,0,false,true,false,false,false,'pickaxe',1);
P[BLOCK.EMERALD_ORE] = b(3,3,0,false,true,false,false,false,'pickaxe',2);
P[BLOCK.EMERALD_BLOCK] = b(5,6,0,false,true,false,false,false,'pickaxe',1);
P[BLOCK.LAPIS_BLOCK] = b(3,3,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.REDSTONE_BLOCK] = b(5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.COAL_BLOCK] = b(5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.CRAFTING_TABLE] = b(2.5,2.5,0,false,true,false,false,true,'axe',0);
P[BLOCK.FURNACE] = b(3.5,3.5,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.CHEST] = b(2.5,2.5,0,false,true,false,false,true,'axe',0);
P[BLOCK.TORCH] = b(0,0,14,true,false,false,false,true,'none',0,true);
P[BLOCK.LADDER] = b(0.4,0.4,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.LEVER] = b(0.5,0.5,0,true,false,false,false,false,'none',0,true);
P[BLOCK.OAK_STAIRS] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.COBBLESTONE_STAIRS] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.OAK_DOOR] = b(3,3,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.IRON_DOOR] = b(5,6,0,true,false,false,false,false,'pickaxe',0,true);
P[BLOCK.OAK_FENCE] = b(2,3,0,true,false,false,false,true,'axe',0);
P[BLOCK.OAK_FENCE_GATE] = b(2,3,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.OAK_PRESSURE_PLATE] = b(0.5,0.5,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.STONE_PRESSURE_PLATE] = b(0.5,0.5,0,true,false,false,false,false,'pickaxe',0,true);
P[BLOCK.STONE_BUTTON] = b(0.5,0.5,0,true,false,false,false,false,'none',0,true);
P[BLOCK.REDSTONE_TORCH] = b(0,0,7,true,false,false,false,false,'none',0,true);
P[BLOCK.PUMPKIN] = b(1,1,0,false,true,false,false,false,'axe',0);
P[BLOCK.MELON] = b(1,1,0,false,true,false,false,false,'axe',0);
P[BLOCK.MYCELIUM] = b(0.6,0.6,0,false,true,false,false,false,'shovel',0);
P[BLOCK.ENCHANTING_TABLE] = b(5,1200,7,false,true,false,false,false,'pickaxe',0);
P[BLOCK.BREWING_STAND] = b(0.5,0.5,1,false,true,false,false,false,'pickaxe',0);
P[BLOCK.END_STONE] = b(3,9,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.DRAGON_EGG] = b(3,9,1,false,true,false,false,false,'pickaxe',2);
P[BLOCK.NETHER_BRICK] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.NETHER_WART] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.NETHER_BRICK_FENCE] = b(2,6,0,true,false,false,false,false,'pickaxe',0);
P[BLOCK.NETHER_BRICK_STAIRS] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.BEACON] = b(3,3,15,true,true,false,false,false,'none',0);
P[BLOCK.COBBLESTONE_WALL] = b(2,6,0,true,false,false,false,false,'pickaxe',0);
P[BLOCK.ANVIL] = b(5,1200,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.HOPPER] = b(3,4.8,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.QUARTZ_BLOCK] = b(0.8,0.8,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.QUARTZ_ORE] = b(3,3,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.QUARTZ_STAIRS] = b(0.8,0.8,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.ACTIVATOR_RAIL] = b(0.7,6,0,true,false,false,false,false,'pickaxe',0,true);
P[BLOCK.DETECTOR_RAIL] = b(0.7,6,0,true,false,false,false,false,'pickaxe',0,true);
P[BLOCK.POWERED_RAIL] = b(0.7,6,0,true,false,false,false,false,'pickaxe',0,true);
P[BLOCK.TRIPWIRE_HOOK] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.TRIPWIRE] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.COMMAND_BLOCK] = b(-1,3600000,0,false,true,false,false,false,'none',0);
P[BLOCK.HAY_BALE] = b(0.5,0.5,0,false,true,false,false,true,'hoe',0);
P[BLOCK.HARDENED_CLAY] = b(1.25,6.5,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.PACKED_ICE] = b(0.5,0.5,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.PRISMARINE] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.SEA_LANTERN] = b(0.3,0.3,15,true,false,false,false,false,'pickaxe',0);
P[BLOCK.SLIME_BLOCK] = b(0,0,0,true,true,false,false,false,'none',0);
P[BLOCK.BARRIER] = b(-1,6000001,0,true,true,false,false,false,'none',0);
P[BLOCK.REDSTONE_LAMP] = b(0.3,0.3,0,true,false,false,false,false,'pickaxe',0);
P[BLOCK.ENDER_CHEST] = b(22.5,600,7,true,true,false,false,false,'pickaxe',0);
P[BLOCK.SPRUCE_PLANKS] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.BIRCH_PLANKS] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.JUNGLE_PLANKS] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.ACACIA_PLANKS] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.DARK_OAK_PLANKS] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.SPRUCE_LOG] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.BIRCH_LOG] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.JUNGLE_LOG] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.ACACIA_LOG] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.DARK_OAK_LOG] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.SPRUCE_LEAVES] = b(0.2,0.2,0,true,false,false,false,true,'shears',0,false,false,true);
P[BLOCK.BIRCH_LEAVES] = b(0.2,0.2,0,true,false,false,false,true,'shears',0,false,false,true);
P[BLOCK.JUNGLE_LEAVES] = b(0.2,0.2,0,true,false,false,false,true,'shears',0,false,false,true);
P[BLOCK.ACACIA_LEAVES] = b(0.2,0.2,0,true,false,false,false,true,'shears',0,false,false,true);
P[BLOCK.DARK_OAK_LEAVES] = b(0.2,0.2,0,true,false,false,false,true,'shears',0,false,false,true);
P[BLOCK.GRANITE] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.DIORITE] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.ANDESITE] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.COARSE_DIRT] = b(0.5,0.5,0,false,true,false,false,false,'shovel',0);
P[BLOCK.PODZOL] = b(0.5,0.5,0,false,true,false,false,false,'shovel',0);
P[BLOCK.POLISHED_GRANITE] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.POLISHED_DIORITE] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.POLISHED_ANDESITE] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.RED_SANDSTONE] = b(0.8,0.8,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.RED_SANDSTONE_STAIRS] = b(0.8,0.8,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.SPRUCE_STAIRS] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.BIRCH_STAIRS] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.JUNGLE_STAIRS] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.ACACIA_STAIRS] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.DARK_OAK_STAIRS] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.SPRUCE_DOOR] = b(3,3,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.BIRCH_DOOR] = b(3,3,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.JUNGLE_DOOR] = b(3,3,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.ACACIA_DOOR] = b(3,3,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.DARK_OAK_DOOR] = b(3,3,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.SPRUCE_FENCE] = b(2,3,0,true,false,false,false,true,'axe',0);
P[BLOCK.BIRCH_FENCE] = b(2,3,0,true,false,false,false,true,'axe',0);
P[BLOCK.JUNGLE_FENCE] = b(2,3,0,true,false,false,false,true,'axe',0);
P[BLOCK.ACACIA_FENCE] = b(2,3,0,true,false,false,false,true,'axe',0);
P[BLOCK.DARK_OAK_FENCE] = b(2,3,0,true,false,false,false,true,'axe',0);
P[BLOCK.SPRUCE_FENCE_GATE] = b(2,3,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.BIRCH_FENCE_GATE] = b(2,3,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.JUNGLE_FENCE_GATE] = b(2,3,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.ACACIA_FENCE_GATE] = b(2,3,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.DARK_OAK_FENCE_GATE] = b(2,3,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.END_STONE_BRICKS] = b(3,9,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.PURPUR_BLOCK] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.PURPUR_PILLAR] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.PURPUR_STAIRS] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.PURPUR_SLAB] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.CHORUS_PLANT] = b(0.4,0.4,0,false,true,false,false,false,'none',0);
P[BLOCK.CHORUS_FLOWER] = b(0.4,0.4,0,false,true,false,false,false,'none',0);
P[BLOCK.END_ROD] = b(0,0,14,true,false,false,false,false,'none',0,true);
P[BLOCK.IRON_TRAPDOOR] = b(5,6,0,true,false,false,false,false,'pickaxe',0,true);
P[BLOCK.OAK_TRAPDOOR] = b(3,3,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.OAK_SLAB] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.COBBLESTONE_SLAB] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.STONE_SLAB] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.BRICK_SLAB] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.STONE_BRICK_SLAB] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.NETHER_BRICK_SLAB] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.QUARTZ_SLAB] = b(0.8,0.8,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.SPRUCE_SLAB] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.BIRCH_SLAB] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.JUNGLE_SLAB] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.ACACIA_SLAB] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.DARK_OAK_SLAB] = b(2,3,0,false,true,false,false,true,'axe',0);
P[BLOCK.RED_SANDSTONE_SLAB] = b(0.8,0.8,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.PRISMARINE_SLAB] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.DARK_PRISMARINE] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.DARK_PRISMARINE_SLAB] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.DARK_PRISMARINE_STAIRS] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.PRISMARINE_STAIRS] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.PRISMARINE_BRICKS] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.PRISMARINE_BRICK_SLAB] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.PRISMARINE_BRICK_STAIRS] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.MOSSY_COBBLESTONE] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.MOSSY_STONE_BRICK] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.SMOOTH_STONE] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.SMOOTH_SANDSTONE] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.SMOOTH_RED_SANDSTONE] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.CHISELED_STONE_BRICKS] = b(1.5,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.CHISELED_SANDSTONE] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.CHISELED_RED_SANDSTONE] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.CUT_SANDSTONE] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.CUT_RED_SANDSTONE] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.RED_NETHER_BRICK] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.BONE_BLOCK] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.TERRACOTTA] = b(1.25,6.5,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.NETHER_WART_BLOCK] = b(1,1,0,false,true,false,false,false,'hoe',0);
P[BLOCK.WET_SPONGE] = b(0.6,0.6,0,false,true,false,false,false,'none',0);
P[BLOCK.MELON_STEM] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.PUMPKIN_STEM] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.VINE] = b(0.2,0.2,0,true,false,false,false,true,'shears',0,true,false,true);
P[BLOCK.LILY_PAD] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.COCOA] = b(0.2,0.2,0,true,false,false,false,false,'none',0,true);
P[BLOCK.FARMLAND] = b(0.6,0.6,0,false,true,false,false,false,'shovel',0);
P[BLOCK.WHEAT] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.FROSTED_ICE] = b(0.5,0.5,0,true,false,false,false,false,'none',0);
P[BLOCK.SUGARCANE] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.DAYLIGHT_DETECTOR] = b(2,2,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.COMPARATOR] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.REPEATER] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.TRAPPED_CHEST] = b(2.5,2.5,0,false,true,false,false,true,'axe',0);
P[BLOCK.FLOWER_POT] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.CARROT] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.POTATO] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.BEETROOT] = b(0,0,0,true,false,false,false,false,'none',0,true);
P[BLOCK.SKULL] = b(1,1,0,true,false,false,false,false,'pickaxe',0,true);
P[BLOCK.BANNER] = b(1,1,0,true,false,false,false,true,'axe',0,true);
P[BLOCK.LIGHT_WEIGHTED_PRESSURE_PLATE] = b(0.5,0.5,0,true,false,false,false,false,'pickaxe',0,true);
P[BLOCK.HEAVY_WEIGHTED_PRESSURE_PLATE] = b(0.5,0.5,0,true,false,false,false,false,'pickaxe',0,true);
P[BLOCK.SPONGE] = b(0.6,0.6,0,false,true,false,false,false,'none',0);
P[BLOCK.CRAFTING_TABLE2] = P[BLOCK.CRAFTING_TABLE]!;
P[BLOCK.WOOD] = P[BLOCK.OAK_LOG]!;
P[BLOCK.BLACK] = b(2,3,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.TEAL] = b(2,3,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.METAL] = b(5,6,0,false,true,false,false,false,'pickaxe',1);
P[BLOCK.GOLD] = b(3,6,0,false,true,false,false,false,'pickaxe',2);
P[BLOCK.BLOOD] = b(0.5,0.5,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.GLASS] = b(0.3,0.3,0,true,true,false,false,false,'none',0,false,false,true); // wiki-source: https://minecraft.wiki/w/Glass
P[BLOCK.PINK_WALL] = b(2,6,0,false,true,false,false,false,'pickaxe',0);
P[BLOCK.CONCRETE] = b(1.8,6,0,false,true,false,false,false,'pickaxe',0);

// Terracotta colors
for (const id of [273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289]) {
  P[id] = b(1.25,6.5,0,false,true,false,false,false,'pickaxe',0);
}
// Glazed terracotta
for (const id of [290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305]) {
  P[id] = b(1.4,7,0,false,true,false,false,false,'pickaxe',0);
}
// Wool colors
for (const id of [306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321]) {
  P[id] = b(0.8,0.8,0,false,true,false,false,true,'none',0); // wiki-source: https://minecraft.wiki/w/Wool
}

P[BLOCK.DRIED_KELP_BLOCK] = b(0.5,2.5,0,false,true,false,false,true,'none',0); // wiki-source: https://minecraft.wiki/w/Dried_Kelp_Block
P[BLOCK.TARGET] = b(0.5,0.5,0,false,true,false,false,true,'none',0); // wiki-source: https://minecraft.wiki/w/Target
P[BLOCK.COBWEB] = b(4,4,0,true,false,false,false,false,'shears',0); // wiki-source: https://minecraft.wiki/w/Cobweb

export function getBlockProperties(blockId: number): BlockProperties {
  return P[blockId] ?? b(1,1,0,false,true,false,false,false,'none',0,false,false,false);
}

/**
 * Wiki formula: https://minecraft.wiki/w/Breaking#Speed
 * 
 * speedMultiplier = baseToolSpeed + efficiency^2 + 1 (if correct tool)
 *   then apply haste, fatigue, underwater, not-on-ground penalties
 * damage = speedMultiplier / hardness
 * if canHarvest: damage /= 30, else: damage /= 100
 * if damage >= 1: instant break (0 ticks)
 * ticks = ceil(1 / damage), seconds = ticks / 20
 * 
 * Status effect params have defaults of 0/false for callers that don't need them yet.
 */
export function getHarvestTime(
  blockId: number,
  toolId: number,
  toolType: ToolType,
  toolTier: number,
  efficiencyLevel = 0,
  hasteLevel = 0,
  conduitPowerLevel = 0,
  miningFatigueLevel = 0,
  underwater = false,
  hasAquaAffinity = false,
  onGround = true
): number {
  const props = getBlockProperties(blockId);

  // Unbreakable
  if (props.hardness < 0) return Infinity;

  // Instant break (hardness 0)
  if (props.hardness === 0) return 0;

  // Cobweb instant break with shears or sword
  // wiki-source: https://minecraft.wiki/w/Cobweb#Breaking
  if (blockId === BLOCK.COBWEB && (toolType === 'shears' || toolType === 'sword')) return 0;

  // === Determine base mining speed from tool item component ===
  let isCorrectToolType = toolType !== 'none' && toolType === props.requiredTool;

  // Sword-specific: swords are effective on certain blocks
  // wiki-source: https://minecraft.wiki/w/Sword#Breaking
  if (toolType === 'sword' && !isCorrectToolType) {
    const isSwordEffective =
      blockId === BLOCK.BAMBOO ||
      blockId === BLOCK.COCOA ||
      blockId === BLOCK.MELON ||
      blockId === BLOCK.PUMPKIN ||
      blockId === BLOCK.VINE ||
      blockId === BLOCK.SWEET_BERRY_BUSH ||
      // All leaf blocks
      blockId === BLOCK.OAK_LEAVES || blockId === BLOCK.SPRUCE_LEAVES ||
      blockId === BLOCK.BIRCH_LEAVES || blockId === BLOCK.JUNGLE_LEAVES ||
      blockId === BLOCK.ACACIA_LEAVES || blockId === BLOCK.DARK_OAK_LEAVES ||
      blockId === BLOCK.AZALEA_LEAVES || blockId === BLOCK.CHERRY_LEAVES ||
      // Wool blocks (306-321)
      (blockId >= 306 && blockId <= 321);
    if (isSwordEffective) {
      isCorrectToolType = true;
    }
  }

  let baseSpeed = 1;
  if (isCorrectToolType) {
    const itemProps = getItemProperties(toolId);
    baseSpeed = itemProps?.miningSpeed ?? 1;
  }

  // Sword-specific: bamboo gets 30× speed (overrides base 1.5)
  if (toolType === 'sword' && blockId === BLOCK.BAMBOO) {
    baseSpeed = 30;
  }

  // Efficiency — only applies with correct tool
  if (efficiencyLevel > 0 && isCorrectToolType) {
    baseSpeed += efficiencyLevel * efficiencyLevel + 1;
  }

  let speedMultiplier = baseSpeed;

  // Haste / Conduit Power
  const haste = Math.max(hasteLevel, conduitPowerLevel);
  if (haste > 0) {
    speedMultiplier *= 1 + 0.2 * haste;
  }

  // Mining Fatigue (Java Edition: hardcoded ×0.3 per level, capped at level IV)
  for (let i = 0; i < Math.min(miningFatigueLevel, 4); i++) {
    speedMultiplier *= 0.3;
  }

  // Underwater without Aqua Affinity: 5× penalty
  if (underwater && !hasAquaAffinity) {
    speedMultiplier /= 5;
  }

  // Not on ground: 5× penalty
  if (!onGround) {
    speedMultiplier /= 5;
  }

  // === Determine if the block can be harvested with current tool ===
  // Pickaxe-required blocks need a pickaxe of sufficient tier to drop anything.
  // Shovel/axe/hoe/shears blocks drop items even without the tool (tool only speeds up).
  const canHarvest =
    props.requiredTool !== 'pickaxe' ||
    (toolType === 'pickaxe' && toolTier >= props.minToolTier);

  // === Damage per tick ===
  let damage = speedMultiplier / props.hardness;

  if (canHarvest) {
    damage /= 30;
  } else {
    damage /= 100;
  }

  // Instant break
  if (damage >= 1) return 0;

  // Convert to ticks (rounded up), then seconds
  const ticks = Math.ceil(1 / damage);
  return ticks / 20;
}

export function getMiningSpeed(
  blockId: number,
  toolId: number,
  toolType: ToolType,
  toolTier: number,
  efficiencyLevel = 0,
  hasteLevel = 0,
  conduitPowerLevel = 0,
  miningFatigueLevel = 0,
  underwater = false,
  hasAquaAffinity = false,
  onGround = true
): number {
  const harvestTime = getHarvestTime(blockId, toolId, toolType, toolTier, efficiencyLevel, hasteLevel, conduitPowerLevel, miningFatigueLevel, underwater, hasAquaAffinity, onGround);
  if (harvestTime === 0) return Infinity;
  if (harvestTime === Infinity) return 0;
  return 1 / harvestTime;
}
