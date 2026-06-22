/**
 * Project-wide tunable constants shared by client and server.
 *
 * Keep these server-authoritative where they affect gameplay: the server is the
 * source of truth for room/match rules, and the client mirrors them for UI.
 */

export const PROJECT_NAME = 'MineCraft';

/** Protocol version. Bump on any breaking change to message shapes. */
export const PROTOCOL_VERSION = 1;

/** Game mode: survival (full mechanics) or creative (flight, instant break). */
export type GameMode = 'survival' | 'creative';

/** Maximum concurrent players in a single room/match (the "100" in SquidGame100). */
export const MAX_PLAYERS_PER_ROOM = 100;

/** Server simulation tick rate, in Hz. Snapshots are produced at this cadence. */
export const SERVER_TICK_HZ = 20;

/** Milliseconds per server tick (derived from SERVER_TICK_HZ). */
export const SERVER_TICK_MS = 1000 / SERVER_TICK_HZ;

/** Snapshot broadcast cadence, in Hz. May be lower than the tick rate. */
export const SNAPSHOT_HZ = 20;

/** Voxel/chunk constants. Shared so client & server agree on world geometry. */
export const CHUNK_SIZE = 16;
export const WORLD_HEIGHT = 256;

/** Default ports for local dev (overridable via env in each package). */
export const DEFAULT_PORTS = {
  client: 5173,
  serverHttp: 8080,
  serverWs: 8080,
} as const;
