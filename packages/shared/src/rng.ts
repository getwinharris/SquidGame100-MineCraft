/**
 * Deterministic, seedable PRNG (mulberry32).
 *
 * The server seeds world generation and match events deterministically so that
 * every client renders the same world and so spectators/late joiners agree on
 * state. Output is a float in [0, 1) — same sequence for the same seed.
 *
 * Not cryptographically secure; use only for gameplay determinism.
 */

export type Rng = {
  /** Next float in [0, 1). */
  next(): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** Original seed (for repro/debug). */
  readonly seed: number;
};

/** Create a deterministic PRNG from a 32-bit integer seed. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const state = { seed: a };

  const next = (): number => {
    // mulberry32
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => {
    return Math.floor(next() * (max - min + 1)) + min;
  };

  return { next, int, get seed() { return state.seed; } };
}

/** Hash a string seed (e.g. a room code) into a 32-bit integer. */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
