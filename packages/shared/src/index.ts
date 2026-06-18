/**
 * @sg100/shared — public surface for the SquidGame100 MineCraft protocol.
 *
 * Everything the client and server must agree on lives here: version, config,
 * deterministic RNG, and the wire message schema. Importing from the root
 * re-exports the stable contract used across the network boundary.
 */

export * from './config.js';
export * from './rng.js';
export * from './protocol.js';
