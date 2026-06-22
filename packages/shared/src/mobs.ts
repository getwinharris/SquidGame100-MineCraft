/**
 * Mob definitions — properties, AI goals, spawning rules.
 * Matches Minecraft Java Edition mob behavior.
 */

export type MobCategory = 'passive' | 'neutral' | 'hostile' | 'boss' | 'utility';

export type MobType =
  // Passive
  | 'cow' | 'pig' | 'sheep' | 'chicken' | 'rabbit'
  | 'horse' | 'donkey' | 'mule' | 'llama'
  | 'cat' | 'wolf' | 'fox' | 'bee'
  | 'axolotl' | 'dolphin' | 'turtle' | 'squid' | 'glow_squid'
  | 'bat' | 'parrot' | 'ocelot'
  | 'frog' | 'tadpole' | 'allay'
  | 'sniffer' | 'armadillo' | 'camel'
  // Minecraft Earth exclusive
  | 'muddy_pig' | 'dyed_cat' | 'moobloom' | 'pink_wool_sheep' | 'jumbo_chicken'
  // Neutral
  | 'enderman' | 'iron_golem' | 'snow_golem'
  | 'wolf' | 'bee' | 'piglin'
  // Hostile
  | 'zombie' | 'skeleton' | 'creeper' | 'spider'
  | 'cave_spider' | 'witch' | 'blaze' | 'ghast'
  | 'slime' | 'magma_cube' | 'phantom'
  | 'drowned' | 'husk' | 'stray'
  | 'wither_skeleton' | 'piglin_brute'
  | 'vindicator' | 'evoker' | 'vex'
  | 'pillager' | 'ravager'
  | 'warden' | 'breeze' | 'bogged'
  | 'shulker' | 'silverfish' | 'endermite'
  // Boss
  | 'ender_dragon' | 'wither'
  // Utility
  | 'villager' | 'wandering_trader';

export interface MobProperties {
  type: MobType;
  category: MobCategory;
  displayName: string;
  maxHealth: number;
  movementSpeed: number;        // blocks per second
  attackDamage: number;
  attackRange: number;          // blocks
  followRange: number;          // blocks
  knockbackResistance: number;  // 0-1
  armor: number;                // armor points
  experience: number;           // XP dropped
  babySpeedMultiplier: number;
  followDistance: number;       // for tamed
  hostile: boolean;
  burnsInSunlight: boolean;
  despawn: boolean;             // can despawn naturally
  persistent: boolean;          // never despawn
  flying: boolean;
  swimming: boolean;
  waterBreathing: boolean;
  fireResistant: boolean;
  size: { width: number; height: number; eyeHeight: number };
  drops: Array<{ id: number; count: number; chance: number }>;
  sound: {
    idle?: string;
    hurt?: string;
    death?: string;
    ambient?: string;
  };
  hostileTo: MobType[];
  breedableWith?: MobType[];
  foodItems?: number[];
  maxSpawnGroupSize: number;
  spawnBiomes?: string[];
  spawnLightLevel?: { min: number; max: number };
  spawnInSky?: boolean;
  spawnInCaves?: boolean;
  spawnOnSurface?: boolean;
}

/**
 * Mob property registry.
 */
export const MOB_PROPERTIES: Record<MobType, MobProperties> = {
  // === PASSIVE MOBS ===
  cow: {
    type: 'cow', category: 'passive', displayName: 'Cow',
    maxHealth: 10, movementSpeed: 0.25, attackDamage: 0, attackRange: 0,
    followRange: 8, knockbackResistance: 0, armor: 0, experience: 1,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: false,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.9, height: 1.4, eyeHeight: 1.2 },
    drops: [{ id: 367, count: 1, chance: 1 }, { id: 334, count: 1, chance: 1 }],
    sound: { idle: 'entity.cow.ambient', hurt: 'entity.cow.hurt', death: 'entity.cow.death' },
    hostileTo: [], breedableWith: ['cow'], foodItems: [297, 319, 363, 365, 392],
    maxSpawnGroupSize: 8, spawnBiomes: ['plains', 'sunflower_plains', 'savanna', 'taiga', 'forest'],
    spawnLightLevel: { min: 7, max: 15 }, spawnOnSurface: true,
  },
  pig: {
    type: 'pig', category: 'passive', displayName: 'Pig',
    maxHealth: 10, movementSpeed: 0.25, attackDamage: 0, attackRange: 0,
    followRange: 8, knockbackResistance: 0, armor: 0, experience: 1,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: false,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.9, height: 0.9, eyeHeight: 0.6 },
    drops: [{ id: 319, count: 1, chance: 1 }],
    sound: { idle: 'entity.pig.ambient', hurt: 'entity.pig.hurt', death: 'entity.pig.death' },
    hostileTo: [], breedableWith: ['pig'], foodItems: [297, 319, 363, 365, 392],
    maxSpawnGroupSize: 8, spawnBiomes: ['plains', 'sunflower_plains', 'taiga', 'forest', 'swamp'],
    spawnLightLevel: { min: 7, max: 15 }, spawnOnSurface: true,
  },
  sheep: {
    type: 'sheep', category: 'passive', displayName: 'Sheep',
    maxHealth: 8, movementSpeed: 0.25, attackDamage: 0, attackRange: 0,
    followRange: 8, knockbackResistance: 0, armor: 0, experience: 1,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: false,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.9, height: 1.3, eyeHeight: 1.1 },
    drops: [{ id: 359, count: 1, chance: 1 }, { id: 42, count: 1, chance: 0.85 }],
    sound: { idle: 'entity.sheep.ambient', hurt: 'entity.sheep.hurt', death: 'entity.sheep.death' },
    hostileTo: [], breedableWith: ['sheep'], foodItems: [297, 319, 363, 365, 392],
    maxSpawnGroupSize: 8, spawnBiomes: ['plains', 'sunflower_plains', 'taiga', 'savanna', 'desert'],
    spawnLightLevel: { min: 7, max: 15 }, spawnOnSurface: true,
  },
  chicken: {
    type: 'chicken', category: 'passive', displayName: 'Chicken',
    maxHealth: 4, movementSpeed: 0.25, attackDamage: 0, attackRange: 0,
    followRange: 8, knockbackResistance: 0, armor: 0, experience: 1,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: false,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.4, height: 0.7, eyeHeight: 0.56 },
    drops: [{ id: 288, count: 1, chance: 0.5 }, { id: 344, count: 1, chance: 0.5 }],
    sound: { idle: 'entity.chicken.ambient', hurt: 'entity.chicken.hurt', death: 'entity.chicken.death' },
    hostileTo: [], breedableWith: ['chicken'], foodItems: [297, 361],
    maxSpawnGroupSize: 4, spawnBiomes: ['plains', 'sunflower_plains', 'taiga', 'forest', 'jungle'],
    spawnLightLevel: { min: 7, max: 15 }, spawnOnSurface: true,
  },
  rabbit: {
    type: 'rabbit', category: 'passive', displayName: 'Rabbit',
    maxHealth: 3, movementSpeed: 0.3, attackDamage: 0, attackRange: 0,
    followRange: 8, knockbackResistance: 0, armor: 0, experience: 1,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: false,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.4, height: 0.5, eyeHeight: 0.4 },
    drops: [{ id: 416, count: 1, chance: 1 }, { id: 288, count: 1, chance: 0.5 }],
    sound: { idle: 'entity.rabbit.ambient', hurt: 'entity.rabbit.hurt', death: 'entity.rabbit.death' },
    hostileTo: [], breedableWith: ['rabbit'], foodItems: [297, 361, 392],
    maxSpawnGroupSize: 3, spawnBiomes: ['desert', 'taiga', 'snowy_tundra', 'flower_forest'],
    spawnLightLevel: { min: 7, max: 15 }, spawnOnSurface: true,
  },
  wolf: {
    type: 'wolf', category: 'neutral', displayName: 'Wolf',
    maxHealth: 8, movementSpeed: 0.3, attackDamage: 4, attackRange: 2,
    followRange: 16, knockbackResistance: 0, armor: 0, experience: 1,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: false,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: true, waterBreathing: false, fireResistant: false,
    size: { width: 0.6, height: 0.85, eyeHeight: 0.7 },
    drops: [{ id: 288, count: 1, chance: 0.33 }],
    sound: { idle: 'entity.wolf.ambient', hurt: 'entity.wolf.hurt', death: 'entity.wolf.death' },
    hostileTo: ['sheep', 'rabbit', 'fox'], breedableWith: ['wolf'], foodItems: [319, 363, 365, 375, 392, 412],
    maxSpawnGroupSize: 8, spawnBiomes: ['forest', 'taiga', 'roofed_forest'],
    spawnLightLevel: { min: 7, max: 15 }, spawnOnSurface: true,
  },
  cat: {
    type: 'cat', category: 'passive', displayName: 'Cat',
    maxHealth: 10, movementSpeed: 0.3, attackDamage: 0, attackRange: 0,
    followRange: 16, knockbackResistance: 0, armor: 0, experience: 3,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: false,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.6, height: 0.7, eyeHeight: 0.6 },
    drops: [{ id: 288, count: 1, chance: 0.33 }],
    sound: { idle: 'entity.cat.ambient', hurt: 'entity.cat.hurt', death: 'entity.cat.death' },
    hostileTo: [], breedableWith: ['cat'], foodItems: [335, 349, 366],
    maxSpawnGroupSize: 1, spawnBiomes: ['village'],
    spawnLightLevel: { min: 7, max: 15 }, spawnOnSurface: true,
  },
  villager: {
    type: 'villager', category: 'utility', displayName: 'Villager',
    maxHealth: 20, movementSpeed: 0.25, attackDamage: 0, attackRange: 0,
    followRange: 48, knockbackResistance: 0, armor: 0, experience: 0,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: false,
    burnsInSunlight: false, despawn: false, persistent: true,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.6, height: 1.95, eyeHeight: 1.62 },
    drops: [],
    sound: { idle: 'entity.villager.ambient', hurt: 'entity.villager.hurt', death: 'entity.villager.death' },
    hostileTo: [], breedableWith: ['villager'], foodItems: [297, 319, 363, 365, 392],
    maxSpawnGroupSize: 4, spawnBiomes: ['village'],
    spawnLightLevel: { min: 7, max: 15 }, spawnOnSurface: true,
  },

  // === HOSTILE MOBS ===
  zombie: {
    type: 'zombie', category: 'hostile', displayName: 'Zombie',
    maxHealth: 20, movementSpeed: 0.23, attackDamage: 3, attackRange: 2,
    followRange: 40, knockbackResistance: 0, armor: 2, experience: 5,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: true,
    burnsInSunlight: true, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.6, height: 1.95, eyeHeight: 1.62 },
    drops: [{ id: 288, count: 0, chance: 0 }, { id: 367, count: 1, chance: 0.85 }],
    sound: { idle: 'entity.zombie.ambient', hurt: 'entity.zombie.hurt', death: 'entity.zombie.death' },
    hostileTo: ['villager', 'iron_golem', 'player'],
    maxSpawnGroupSize: 4, spawnBiomes: ['overworld'],
    spawnLightLevel: { min: 0, max: 7 }, spawnOnSurface: true, spawnInCaves: true,
  },
  skeleton: {
    type: 'skeleton', category: 'hostile', displayName: 'Skeleton',
    maxHealth: 20, movementSpeed: 0.25, attackDamage: 2, attackRange: 16,
    followRange: 16, knockbackResistance: 0, armor: 0, experience: 5,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: true,
    burnsInSunlight: true, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.6, height: 1.99, eyeHeight: 1.62 },
    drops: [{ id: 262, count: 2, chance: 1 }, { id: 287, count: 0, chance: 0.33 }],
    sound: { idle: 'entity.skeleton.ambient', hurt: 'entity.skeleton.hurt', death: 'entity.skeleton.death' },
    hostileTo: ['villager', 'iron_golem', 'player'],
    maxSpawnGroupSize: 4, spawnBiomes: ['overworld'],
    spawnLightLevel: { min: 0, max: 7 }, spawnOnSurface: true, spawnInCaves: true,
  },
  creeper: {
    type: 'creeper', category: 'hostile', displayName: 'Creeper',
    maxHealth: 20, movementSpeed: 0.25, attackDamage: 0, attackRange: 3,
    followRange: 16, knockbackResistance: 0, armor: 0, experience: 5,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: true,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.6, height: 1.7, eyeHeight: 1.52 },
    drops: [{ id: 289, count: 1, chance: 1 }],
    sound: { idle: 'entity.creeper.ambient', hurt: 'entity.creeper.hurt', death: 'entity.creeper.death' },
    hostileTo: ['player', 'iron_golem'],
    maxSpawnGroupSize: 4, spawnBiomes: ['overworld'],
    spawnLightLevel: { min: 0, max: 7 }, spawnOnSurface: true, spawnInCaves: true,
  },
  spider: {
    type: 'spider', category: 'hostile', displayName: 'Spider',
    maxHealth: 16, movementSpeed: 0.3, attackDamage: 2, attackRange: 2,
    followRange: 16, knockbackResistance: 0, armor: 0, experience: 5,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: true,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 1.4, height: 0.9, eyeHeight: 0.65 },
    drops: [{ id: 287, count: 0, chance: 0.33 }, { id: 377, count: 1, chance: 0.1 }],
    sound: { idle: 'entity.spider.ambient', hurt: 'entity.spider.hurt', death: 'entity.spider.death' },
    hostileTo: ['player', 'iron_golem', 'wolf'],
    maxSpawnGroupSize: 4, spawnBiomes: ['overworld'],
    spawnLightLevel: { min: 0, max: 7 }, spawnOnSurface: true, spawnInCaves: true,
  },
  enderman: {
    type: 'enderman', category: 'neutral', displayName: 'Enderman',
    maxHealth: 40, movementSpeed: 0.3, attackDamage: 7, attackRange: 3,
    followRange: 64, knockbackResistance: 0, armor: 0, experience: 5,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: false,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.6, height: 2.9, eyeHeight: 2.55 },
    drops: [{ id: 368, count: 1, chance: 1 }],
    sound: { idle: 'entity.enderman.ambient', hurt: 'entity.enderman.hurt', death: 'entity.enderman.death' },
    hostileTo: ['player'],
    maxSpawnGroupSize: 1, spawnBiomes: ['overworld', 'end'],
    spawnLightLevel: { min: 0, max: 7 }, spawnOnSurface: true, spawnInCaves: true,
  },
  blaze: {
    type: 'blaze', category: 'hostile', displayName: 'Blaze',
    maxHealth: 20, movementSpeed: 0.23, attackDamage: 4, attackRange: 16,
    followRange: 48, knockbackResistance: 0, armor: 0, experience: 10,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: true,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: true, swimming: false, waterBreathing: false, fireResistant: true,
    size: { width: 0.6, height: 1.8, eyeHeight: 1.5 },
    drops: [{ id: 378, count: 1, chance: 0.5 }],
    sound: { idle: 'entity.blaze.ambient', hurt: 'entity.blaze.hurt', death: 'entity.blaze.death' },
    hostileTo: ['player', 'iron_golem', 'snow_golem'],
    maxSpawnGroupSize: 3, spawnBiomes: ['nether'],
    spawnLightLevel: { min: 0, max: 11 }, spawnInCaves: false,
  },
  ghast: {
    type: 'ghast', category: 'hostile', displayName: 'Ghast',
    maxHealth: 10, movementSpeed: 0.3, attackDamage: 0, attackRange: 16,
    followRange: 64, knockbackResistance: 0, armor: 0, experience: 5,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: true,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: true, swimming: false, waterBreathing: false, fireResistant: true,
    size: { width: 4.0, height: 4.0, eyeHeight: 3.5 },
    drops: [{ id: 289, count: 1, chance: 1 }],
    sound: { idle: 'entity.ghast.ambient', hurt: 'entity.ghast.hurt', death: 'entity.ghast.death' },
    hostileTo: ['player'],
    maxSpawnGroupSize: 1, spawnBiomes: ['nether'],
    spawnLightLevel: { min: 0, max: 7 },
  },
  witch: {
    type: 'witch', category: 'hostile', displayName: 'Witch',
    maxHealth: 26, movementSpeed: 0.25, attackDamage: 0, attackRange: 8,
    followRange: 16, knockbackResistance: 0, armor: 0, experience: 5,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: true,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.6, height: 1.95, eyeHeight: 1.62 },
    drops: [{ id: 370, count: 1, chance: 1 }],
    sound: { idle: 'entity.witch.ambient', hurt: 'entity.witch.hurt', death: 'entity.witch.death' },
    hostileTo: ['player', 'iron_golem'],
    maxSpawnGroupSize: 1, spawnBiomes: ['swamp', 'forest'],
    spawnLightLevel: { min: 0, max: 7 }, spawnOnSurface: true,
  },
  slime: {
    type: 'slime', category: 'hostile', displayName: 'Slime',
    maxHealth: 16, movementSpeed: 0.3, attackDamage: 0, attackRange: 2,
    followRange: 16, knockbackResistance: 0, armor: 0, experience: 1,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: true,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: true, waterBreathing: false, fireResistant: false,
    size: { width: 2.04, height: 2.04, eyeHeight: 0.0 },
    drops: [{ id: 341, count: 1, chance: 1 }],
    sound: { idle: 'entity.slime.squish', hurt: 'entity.slime.hurt', death: 'entity.slime.death' },
    hostileTo: ['player', 'iron_golem'],
    maxSpawnGroupSize: 4, spawnBiomes: ['swamp', 'plains'],
    spawnLightLevel: { min: 0, max: 7 }, spawnOnSurface: true, spawnInCaves: true,
  },
  phantom: {
    type: 'phantom', category: 'hostile', displayName: 'Phantom',
    maxHealth: 20, movementSpeed: 0.25, attackDamage: 6, attackRange: 2,
    followRange: 64, knockbackResistance: 0, armor: 0, experience: 5,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: true,
    burnsInSunlight: true, despawn: true, persistent: false,
    flying: true, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.9, height: 1.2, eyeHeight: 0.6 },
    drops: [{ id: 450, count: 1, chance: 1 }],
    sound: { idle: 'entity.phantom.ambient', hurt: 'entity.phantom.hurt', death: 'entity.phantom.death' },
    hostileTo: ['player'],
    maxSpawnGroupSize: 6, spawnBiomes: ['overworld'],
    spawnLightLevel: { min: 0, max: 15 }, spawnInSky: true,
  },
  drowned: {
    type: 'drowned', category: 'hostile', displayName: 'Drowned',
    maxHealth: 20, movementSpeed: 0.23, attackDamage: 3, attackRange: 2,
    followRange: 40, knockbackResistance: 0, armor: 2, experience: 5,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: true,
    burnsInSunlight: true, despawn: true, persistent: false,
    flying: false, swimming: true, waterBreathing: true, fireResistant: false,
    size: { width: 0.6, height: 1.95, eyeHeight: 1.62 },
    drops: [{ id: 288, count: 0, chance: 0.33 }, { id: 367, count: 1, chance: 0.85 }],
    sound: { idle: 'entity.drowned.ambient', hurt: 'entity.drowned.hurt', death: 'entity.drowned.death' },
    hostileTo: ['player', 'villager', 'iron_golem'],
    maxSpawnGroupSize: 4, spawnBiomes: ['overworld'],
    spawnLightLevel: { min: 0, max: 7 }, spawnOnSurface: true, spawnInCaves: true,
  },
  warden: {
    type: 'warden', category: 'hostile', displayName: 'Warden',
    maxHealth: 500, movementSpeed: 0.5, attackDamage: 30, attackRange: 16,
    followRange: 16, knockbackResistance: 1, armor: 0, experience: 5,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: true,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.9, height: 2.9, eyeHeight: 2.7 },
    drops: [{ id: 449, count: 1, chance: 1 }],
    sound: { idle: 'entity.warden.ambient', hurt: 'entity.warden.hurt', death: 'entity.warden.death' },
    hostileTo: ['player', 'allay', 'axolotl'],
    maxSpawnGroupSize: 1, spawnBiomes: ['deep_dark'],
    spawnLightLevel: { min: 0, max: 15 }, spawnInCaves: true,
  },

  // === BOSS MOBS ===
  ender_dragon: {
    type: 'ender_dragon', category: 'boss', displayName: 'Ender Dragon',
    maxHealth: 200, movementSpeed: 0.3, attackDamage: 10, attackRange: 3,
    followRange: 64, knockbackResistance: 1, armor: 0, experience: 12000,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: true,
    burnsInSunlight: false, despawn: false, persistent: true,
    flying: true, swimming: false, waterBreathing: true, fireResistant: true,
    size: { width: 16.0, height: 8.0, eyeHeight: 4.0 },
    drops: [{ id: 127, count: 1, chance: 1 }],
    sound: { idle: 'entity.ender_dragon.flap', hurt: 'entity.ender_dragon.hurt', death: 'entity.ender_dragon.death' },
    hostileTo: ['player', 'iron_golem'],
    maxSpawnGroupSize: 1, spawnBiomes: ['end'],
    spawnLightLevel: { min: 0, max: 15 },
  },
  wither: {
    type: 'wither', category: 'boss', displayName: 'Wither',
    maxHealth: 300, movementSpeed: 0.3, attackDamage: 10, attackRange: 3,
    followRange: 64, knockbackResistance: 1, armor: 0, experience: 50,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: true,
    burnsInSunlight: false, despawn: false, persistent: true,
    flying: true, swimming: false, waterBreathing: true, fireResistant: true,
    size: { width: 0.9, height: 3.5, eyeHeight: 2.7 },
    drops: [{ id: 440, count: 1, chance: 1 }],
    sound: { idle: 'entity.wither.ambient', hurt: 'entity.wither.hurt', death: 'entity.wither.death' },
    hostileTo: ['player', 'iron_golem', 'villager', 'zombie', 'skeleton', 'wither_skeleton'],
    maxSpawnGroupSize: 1, spawnBiomes: [],
    spawnLightLevel: { min: 0, max: 15 },
  },
  // Minecraft Earth exclusive mobs
  muddy_pig: {
    type: 'muddy_pig', category: 'passive', displayName: 'Muddy Pig',
    maxHealth: 10, movementSpeed: 0.25, attackDamage: 0, attackRange: 0,
    followRange: 8, knockbackResistance: 0, armor: 0, experience: 1,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: false,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.9, height: 0.9, eyeHeight: 0.6 },
    drops: [{ id: 319, count: 1, chance: 1 }],
    sound: { idle: 'entity.pig.ambient', hurt: 'entity.pig.hurt', death: 'entity.pig.death' },
    hostileTo: [], breedableWith: ['pig'], foodItems: [297, 319, 363, 365, 392],
    maxSpawnGroupSize: 4, spawnBiomes: ['swamp', 'mangrove_swamp'],
    spawnLightLevel: { min: 7, max: 15 }, spawnOnSurface: true,
  },
  dyed_cat: {
    type: 'dyed_cat', category: 'passive', displayName: 'Dyed Cat',
    maxHealth: 10, movementSpeed: 0.3, attackDamage: 0, attackRange: 0,
    followRange: 16, knockbackResistance: 0, armor: 0, experience: 3,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: false,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.6, height: 0.7, eyeHeight: 0.65 },
    drops: [],
    sound: { idle: 'entity.cat.ambient', hurt: 'entity.cat.hurt', death: 'entity.cat.death' },
    hostileTo: [], breedableWith: ['cat'], foodItems: [334, 349, 366],
    maxSpawnGroupSize: 1, spawnBiomes: ['village'],
    spawnLightLevel: { min: 7, max: 15 }, spawnOnSurface: true,
  },
  moobloom: {
    type: 'moobloom', category: 'passive', displayName: 'Moobloom',
    maxHealth: 10, movementSpeed: 0.2, attackDamage: 0, attackRange: 0,
    followRange: 8, knockbackResistance: 0, armor: 0, experience: 3,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: false,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.9, height: 1.4, eyeHeight: 1.2 },
    drops: [{ id: 335, count: 1, chance: 1 }, { id: 344, count: 1, chance: 0.05 }],
    sound: { idle: 'entity.cow.ambient', hurt: 'entity.cow.hurt', death: 'entity.cow.death' },
    hostileTo: [], breedableWith: ['cow'], foodItems: [297, 319, 363, 365, 392],
    maxSpawnGroupSize: 4, spawnBiomes: ['flower_forest', 'meadow'],
    spawnLightLevel: { min: 7, max: 15 }, spawnOnSurface: true,
  },
  pink_wool_sheep: {
    type: 'pink_wool_sheep', category: 'passive', displayName: 'Pink Wool Sheep',
    maxHealth: 8, movementSpeed: 0.25, attackDamage: 0, attackRange: 0,
    followRange: 8, knockbackResistance: 0, armor: 0, experience: 1,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: false,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.9, height: 1.3, eyeHeight: 1.1 },
    drops: [{ id: 359, count: 1, chance: 1 }, { id: 42, count: 1, chance: 0.85 }],
    sound: { idle: 'entity.sheep.ambient', hurt: 'entity.sheep.hurt', death: 'entity.sheep.death' },
    hostileTo: [], breedableWith: ['sheep'], foodItems: [297, 319, 363, 365, 392],
    maxSpawnGroupSize: 4, spawnBiomes: ['meadow', 'flower_forest'],
    spawnLightLevel: { min: 7, max: 15 }, spawnOnSurface: true,
  },
  jumbo_chicken: {
    type: 'jumbo_chicken', category: 'passive', displayName: 'Jumbo Chicken',
    maxHealth: 8, movementSpeed: 0.25, attackDamage: 0, attackRange: 0,
    followRange: 8, knockbackResistance: 0, armor: 0, experience: 3,
    babySpeedMultiplier: 0.5, followDistance: 0, hostile: false,
    burnsInSunlight: false, despawn: true, persistent: false,
    flying: false, swimming: false, waterBreathing: false, fireResistant: false,
    size: { width: 0.8, height: 1.4, eyeHeight: 1.1 },
    drops: [{ id: 288, count: 3, chance: 1 }, { id: 344, count: 1, chance: 0.5 }],
    sound: { idle: 'entity.chicken.ambient', hurt: 'entity.chicken.hurt', death: 'entity.chicken.death' },
    hostileTo: [], breedableWith: ['chicken'], foodItems: [297, 361],
    maxSpawnGroupSize: 2, spawnBiomes: ['meadow', 'sunflower_plains'],
    spawnLightLevel: { min: 7, max: 15 }, spawnOnSurface: true,
  },
} as any;

/**
 * Get mob properties by type.
 */
export function getMobProperties(type: MobType): MobProperties | undefined {
  return MOB_PROPERTIES[type];
}

/**
 * Get all hostile mob types.
 */
export function getHostileMobs(): MobType[] {
  return Object.values(MOB_PROPERTIES)
    .filter(m => m.hostile)
    .map(m => m.type);
}

/**
 * Get all passive mob types.
 */
export function getPassiveMobs(): MobType[] {
  return Object.values(MOB_PROPERTIES)
    .filter(m => !m.hostile && m.category === 'passive')
    .map(m => m.type);
}

/**
 * Check if a mob spawns in the given biome.
 */
export function canSpawnInBiome(type: MobType, biome: string): boolean {
  const props = MOB_PROPERTIES[type];
  if (!props) return false;
  return props.spawnBiomes?.includes(biome) ?? false;
}

/**
 * Check if a mob should burn in sunlight.
 */
export function shouldBurnInSunlight(type: MobType): boolean {
  return MOB_PROPERTIES[type]?.burnsInSunlight ?? false;
}
