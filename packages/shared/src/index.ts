/**
 * @sg100/shared — public surface for the SquidGame100 MineCraft protocol.
 *
 * Everything the client and server must agree on lives here: version, config,
 * deterministic RNG, and the wire message schema. Importing from the root
 * re-exports the stable contract used across the network boundary.
 */

export * from './blocks.js';
export * from './blockRegistry.js';
export * from './blockProperties.js';
export * from './blockStates.js';
export * from './config.js';
export * from './rng.js';
export * from './protocol.js';
export * from './textureUrls.js';
export * from './items.js';
export * from './inventory.js';
export * from './crafting.js';
export * from './furnaceRecipes.js';
export * from './lightEngine.js';
export * from './fluids.js';
export * from './mobs.js';
export * from './weather.js';
export * from './tappables.js';
