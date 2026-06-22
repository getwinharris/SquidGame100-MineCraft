/**
 * MineCraft — Real Earth World Engine
 *
 * 1 block = 1 square foot.
 * Earth surface area = 5.49 × 10^15 ft² (5.49 quadrillion blocks).
 * World generates from real Earth elevation/biome data.
 * Streaming: only chunks around player are loaded.
 */

import {
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  Fog,
  InstancedMesh,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
  Object3D,
  HemisphereLight,
  Group,
  Raycaster,
  Vector2,
  Matrix4,
  LineSegments,
  EdgesGeometry,
  LineBasicMaterial,
  NearestFilter,
  SRGBColorSpace,
} from 'three';
import { BLOCK, getTextureUrl, getItemTextureFile, generateTappablesForChunk, rollTappableDrops, isTappableActive, TAPPABLE_DEFINITIONS, getBlockProperties, getHarvestTime, getItemProperties, ITEM, Inventory, SLOT, findRecipe, findFurnaceSmeltingRecipes, MOB_PROPERTIES, tickFluid, getFlowDirection, createsCobblestone, createsObsidian, createsStone, isWater, isLava } from '@sg100/shared';
import type { Tappable, ToolType, MobType, GameMode } from '@sg100/shared';
import { placeAllLandmarks } from './landmarks.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const W = {
  CHUNK_W: 16,
  CHUNK_H: 256,
  CHUNK_D: 16,
  RENDER_DISTANCE: 8,
  SEA_LEVEL: 64,
  GROUND_LEVEL: 62,
};

type BlockId = (typeof BLOCK)[keyof typeof BLOCK];

// ─── World Storage ────────────────────────────────────────────────────────────
interface Chunk {
  cx: number;
  cz: number;
  blocks: Uint16Array;
  dirty: boolean;
  mesh?: InstancedMesh;
}

const chunks = new Map<string, Chunk>();

function chunkKey(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

function getChunk(cx: number, cz: number): Chunk | undefined {
  return chunks.get(chunkKey(cx, cz));
}

function getOrCreateChunk(cx: number, cz: number): Chunk {
  const key = chunkKey(cx, cz);
  let chunk = chunks.get(key);
  if (!chunk) {
    chunk = {
      cx, cz,
      blocks: new Uint16Array(W.CHUNK_W * W.CHUNK_H * W.CHUNK_D),
      dirty: true,
    };
    chunks.set(key, chunk);
    generateChunkTerrain(chunk);
  }
  return chunk;
}

function worldToChunk(wx: number, wz: number): [number, number] {
  return [Math.floor(wx / W.CHUNK_W), Math.floor(wz / W.CHUNK_D)];
}

function localIndex(lx: number, ly: number, lz: number): number {
  return ly * W.CHUNK_W * W.CHUNK_D + lz * W.CHUNK_W + lx;
}

function getBlock(wx: number, wy: number, wz: number): number {
  const [cx, cz] = worldToChunk(wx, wz);
  const chunk = getChunk(cx, cz);
  if (!chunk) return BLOCK.AIR;
  const lx = ((wx % W.CHUNK_W) + W.CHUNK_W) % W.CHUNK_W;
  const lz = ((wz % W.CHUNK_D) + W.CHUNK_D) % W.CHUNK_D;
  if (wy < 0 || wy >= W.CHUNK_H) return BLOCK.AIR;
  return chunk.blocks[localIndex(lx, wy, lz)];
}

export function setBlock(wx: number, wy: number, wz: number, id: BlockId): void {
  const [cx, cz] = worldToChunk(wx, wz);
  const chunk = getOrCreateChunk(cx, cz);
  const lx = ((wx % W.CHUNK_W) + W.CHUNK_W) % W.CHUNK_W;
  const lz = ((wz % W.CHUNK_D) + W.CHUNK_D) % W.CHUNK_D;
  if (wy < 0 || wy >= W.CHUNK_H) return;
  chunk.blocks[localIndex(lx, wy, lz)] = id;
  chunk.dirty = true;
  // Mark neighbors dirty if on chunk edge
  if (lx === 0) markChunkDirty(cx - 1, cz);
  if (lx === W.CHUNK_W - 1) markChunkDirty(cx + 1, cz);
  if (lz === 0) markChunkDirty(cx, cz - 1);
  if (lz === W.CHUNK_D - 1) markChunkDirty(cx, cz + 1);
}

function markChunkDirty(cx: number, cz: number): void {
  const chunk = getChunk(cx, cz);
  if (chunk) chunk.dirty = true;
}

// ─── Terrain Generation (Earth-like) ─────────────────────────────────────────
// Simplex-style noise for elevation, temperature, moisture
function hash(x: number, z: number): number {
  let h = x * 374761393 + z * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function smoothNoise(x: number, z: number, scale: number): number {
  const sx = x / scale;
  const sz = z / scale;
  const ix = Math.floor(sx);
  const iz = Math.floor(sz);
  const fx = sx - ix;
  const fz = sz - iz;
  const a = hash(ix, iz);
  const b = hash(ix + 1, iz);
  const c = hash(ix, iz + 1);
  const d = hash(ix + 1, iz + 1);
  const ux = fx * fx * (3 - 2 * fx);
  const uz = fz * fz * (3 - 2 * fz);
  return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
}

function fractalNoise(x: number, z: number, octaves: number, baseScale: number): number {
  let val = 0;
  let amp = 1;
  let freq = 1;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    val += smoothNoise(x * freq, z * freq, baseScale / freq) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return val / max;
}

export function getElevation(wx: number, wz: number): number {
  const continental = fractalNoise(wx, wz, 6, 2048);
  const erosion = fractalNoise(wx + 10000, wz + 10000, 4, 512);
  const detail = fractalNoise(wx + 20000, wz + 20000, 3, 128);
  const h = continental * 0.6 + erosion * 0.3 + detail * 0.1;
  // Map 0..1 to height: sea floor 0..50, land 50..120, mountains 120..200
  if (h < 0.45) return Math.floor(h * 100); // ocean floor
  if (h < 0.55) return W.SEA_LEVEL; // beach
  if (h < 0.8) return Math.floor(W.SEA_LEVEL + (h - 0.55) * 200); // hills
  return Math.floor(W.SEA_LEVEL + 50 + (h - 0.8) * 400); // mountains
}

function getTemperature(wx: number, wz: number): number {
  // Latitude-based: hot at equator, cold at poles
  const lat = Math.abs(wz) / 10000;
  const base = 1 - Math.min(lat, 1);
  const noise = fractalNoise(wx + 30000, wz + 30000, 2, 1024) * 0.3;
  return Math.max(0, Math.min(1, base + noise));
}

function getMoisture(wx: number, wz: number): number {
  return fractalNoise(wx + 40000, wz + 40000, 3, 768);
}

function getBiome(_wx: number, _wz: number, elevation: number, temp: number, moist: number): BlockId {
  if (elevation < W.SEA_LEVEL - 10) return BLOCK.STONE; // deep ocean floor
  if (elevation < W.SEA_LEVEL) return BLOCK.SAND; // ocean floor
  if (elevation === W.SEA_LEVEL) return BLOCK.SAND; // beach
  if (elevation > 140) return BLOCK.SNOW; // high mountains
  if (temp > 0.7 && moist < 0.3) return BLOCK.SAND; // desert
  if (temp < 0.2) return BLOCK.SNOW; // tundra
  if (moist > 0.6 && temp > 0.4) return BLOCK.GRASS; // forest (grass surface with trees)
  if (moist > 0.5) return BLOCK.GRASS; // woodland
  if (elevation > 100) return BLOCK.STONE; // high altitude
  return BLOCK.GRASS; // default temperate
}

function generateChunkTerrain(chunk: Chunk): void {
  const baseX = chunk.cx * W.CHUNK_W;
  const baseZ = chunk.cz * W.CHUNK_D;

  for (let lx = 0; lx < W.CHUNK_W; lx++) {
    for (let lz = 0; lz < W.CHUNK_D; lz++) {
      const wx = baseX + lx;
      const wz = baseZ + lz;
      const elev = getElevation(wx, wz);
      const temp = getTemperature(wx, wz);
      const moist = getMoisture(wx, wz);
      const surface = getBiome(wx, wz, elev, temp, moist);

      for (let y = 0; y < W.CHUNK_H; y++) {
        let block: BlockId = BLOCK.AIR;
        if (y === 0) {
          block = BLOCK.BEDROCK;
        } else if (y < elev - 4) {
          block = BLOCK.STONE;
        } else if (y < elev - 1) {
          block = BLOCK.DIRT;
        } else if (y < elev) {
          block = surface;
        } else if (y <= W.SEA_LEVEL && y > elev) {
          block = BLOCK.WATER;
        }
        chunk.blocks[localIndex(lx, y, lz)] = block;
      }
      
      // Generate trees
      if (surface === BLOCK.OAK_LEAVES || surface === BLOCK.OAK_PLANKS) {
        const treeHash = hash(wx * 13, wz * 17);
        if (treeHash > 0.92) { // ~8% chance for trees
          generateTree(chunk, lx, elev, lz, surface === BLOCK.OAK_LEAVES ? 'oak' : 'birch');
        }
      }
    }
  }
  chunk.dirty = true;
}

function generateTree(chunk: Chunk, lx: number, groundY: number, lz: number, treeType: 'oak' | 'birch'): void {
  const trunkHeight = treeType === 'oak' ? 4 + Math.floor(hash(lx * 7, lz * 11) * 3) : 5 + Math.floor(hash(lx * 7, lz * 11) * 2);
  const logType = treeType === 'oak' ? BLOCK.OAK_LOG : BLOCK.BIRCH_LOG;
  const leafType = treeType === 'oak' ? BLOCK.OAK_LEAVES : BLOCK.BIRCH_LEAVES;
  
  // Place trunk
  for (let y = groundY; y < groundY + trunkHeight && y < W.CHUNK_H; y++) {
    if (lx >= 0 && lx < W.CHUNK_W && lz >= 0 && lz < W.CHUNK_D) {
      chunk.blocks[localIndex(lx, y, lz)] = logType;
    }
  }
  
  // Place leaves (sphere-like shape)
  const leafRadius = 2;
  const leafStart = groundY + trunkHeight - 2;
  const leafEnd = groundY + trunkHeight + 1;
  
  for (let dy = leafStart; dy <= leafEnd; dy++) {
    const radius = dy === leafEnd ? 1 : leafRadius;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (dx === 0 && dz === 0 && dy < groundY + trunkHeight) continue; // skip trunk position
        if (Math.abs(dx) === radius && Math.abs(dz) === radius && hash(dx + lx, dz + lz) > 0.5) continue; // random corners
        
        const newLx = lx + dx;
        const newLz = lz + dz;
        if (newLx >= 0 && newLx < W.CHUNK_W && newLz >= 0 && newLz < W.CHUNK_D && dy >= 0 && dy < W.CHUNK_H) {
          if (chunk.blocks[localIndex(newLx, dy, newLz)] === BLOCK.AIR) {
            chunk.blocks[localIndex(newLx, dy, newLz)] = leafType;
          }
        }
      }
    }
  }
}

// ─── Tappables (Minecraft Earth-style resource nodes) ──────────────────────
const tappables = new Map<string, Tappable>();
const tappableMeshes = new Map<string, Mesh>();
const TAPPABLE_CHECK_RADIUS = 8; // chunks around player to spawn tappables

function spawnTappablesAroundPlayer(px: number, pz: number): void {
  const [pcx, pcz] = worldToChunk(px, pz);
  for (let dx = -TAPPABLE_CHECK_RADIUS; dx <= TAPPABLE_CHECK_RADIUS; dx++) {
    for (let dz = -TAPPABLE_CHECK_RADIUS; dz <= TAPPABLE_CHECK_RADIUS; dz++) {
      const cx = pcx + dx;
      const cz = pcz + dz;
      const key = `${cx},${cz}`;
      if (tappables.has(key)) continue;

      const newTappables = generateTappablesForChunk(cx, cz, W.CHUNK_W, W.CHUNK_D);
      for (const t of newTappables) {
        // Set y based on terrain
        t.y = getElevation(t.x, t.z) + 1;
        tappables.set(t.id, t);
      }
    }
  }
}

function updateTappableMeshes(scene: Scene, playerPos: Vector3, now: number): void {
  // Remove meshes for tappables too far away
  for (const [id, mesh] of tappableMeshes) {
    const t = tappables.get(id);
    if (!t || playerPos.distanceTo(new Vector3(t.x, t.y, t.z)) > 128) {
      scene.remove(mesh);
      (mesh.geometry as BoxGeometry).dispose();
      (mesh.material as MeshStandardMaterial).dispose();
      tappableMeshes.delete(id);
    }
  }

  // Add/update meshes for nearby tappables
  for (const [id, t] of tappables) {
    if (!isTappableActive(t, now)) continue;
    if (playerPos.distanceTo(new Vector3(t.x, t.y, t.z)) > 64) continue;

    let mesh = tappableMeshes.get(id);
    if (!mesh) {
      const def = TAPPABLE_DEFINITIONS[t.type];
      const geo = new BoxGeometry(0.8, 0.8, 0.8);
      const color = getBlockColor(def.blockId);
      const mat = new MeshStandardMaterial({
        color,
        emissive: new Color(color).multiplyScalar(0.3),
        transparent: true,
        opacity: 0.9,
      });
      mesh = new Mesh(geo, mat);
      mesh.position.set(t.x, t.y + 0.5, t.z);
      mesh.userData = { tappableId: id };
      scene.add(mesh);
      tappableMeshes.set(id, mesh);
    }

    // Floating animation
    const time = now / 1000;
    mesh.position.y = t.y + 0.5 + Math.sin(time * 2 + t.x * 0.1) * 0.1;
    mesh.rotation.y = time * 0.5;
  }
}

function collectTappable(tappableId: string): { itemId: number; count: number }[] {
  const t = tappables.get(tappableId);
  if (!t) return [];
  t.collectedAt = Date.now();
  return rollTappableDrops(t.type).map(d => ({ itemId: d.itemId, count: d.count }));
}

function getBlockColor(blockId: number): number {
  const colors: Record<number, number> = {
    [BLOCK.STONE]: 0x777788,
    [BLOCK.GRASS]: 0x00a86b,
    [BLOCK.IRON_ORE]: 0x878686,
    [BLOCK.GOLD_ORE]: 0xbba056,
    [BLOCK.DIAMOND_ORE]: 0x83cfdb,
    [BLOCK.LAPIS_ORE]: 0x3456a2,
    [BLOCK.REDSTONE_ORE]: 0xa42929,
    [BLOCK.EMERALD_ORE]: 0x17dd63,
    [BLOCK.CHEST]: 0xb89460,
    [BLOCK.MOB_SPAWNER]: 0x3a3a3a,
    [BLOCK.WATER]: 0x3f76e4,
    [BLOCK.OAK_LOG]: 0x6a5030,
    [BLOCK.OAK_LEAVES]: 0x3fa53a,
    [BLOCK.COBBLESTONE]: 0x7a7a7a,
    [BLOCK.DIRT]: 0x8b6842,
    [BLOCK.SAND]: 0xc8b560,
    [BLOCK.GRAVEL]: 0x857b73,
    [BLOCK.CLAY]: 0xa0a0b0,
    [BLOCK.SUGARCANE]: 0x85c43c,
  };
  return colors[blockId] ?? 0xaaaaaa;
}

// ─── Mobs (Minecraft Java Edition) ───────────────────────────────────────────
/** Simple mulberry32 PRNG for deterministic mob spawning */
function mulberry32(a: number): () => number {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

interface Mob {
  id: string;
  type: MobType;
  pos: Vector3;
  vel: Vector3;
  health: number;
  maxHealth: number;
  yaw: number;
  onGround: boolean;
  mesh?: Mesh;
  /** AI state */
  aiState: 'idle' | 'wander' | 'flee' | 'chase' | 'attack';
  aiTimer: number;
  /** When this mob was last damaged by player */
  lastAttackedAt: number;
}

const mobs = new Map<string, Mob>();
const mobMeshes = new Map<string, Mesh>();
const MOB_CHECK_RADIUS = 6; // chunks
const MOB_DESPAWN_DISTANCE = 128;
let mobIdCounter = 0;

function getMobColor(type: MobType): number {
  const colors: Record<string, number> = {
    cow: 0x6b4c3b,
    pig: 0xf0a5a2,
    sheep: 0xe7e7e7,
    chicken: 0xf5f5f5,
    rabbit: 0xc4a882,
    zombie: 0x00a86b,
    skeleton: 0xc8c8c8,
    creeper: 0x00a86b,
    spider: 0x4a4a4a,
    enderman: 0x161616,
    witch: 0x4a3a6a,
  };
  return colors[type] ?? 0xaaaaaa;
}

function spawnMob(type: MobType, x: number, y: number, z: number): Mob {
  const props = MOB_PROPERTIES[type];
  if (!props) throw new Error(`Unknown mob type: ${type}`);
  const id = `mob-${mobIdCounter++}`;
  const mob: Mob = {
    id,
    type,
    pos: new Vector3(x, y + 0.5, z),
    vel: new Vector3(),
    health: props.maxHealth,
    maxHealth: props.maxHealth,
    yaw: Math.random() * Math.PI * 2,
    onGround: false,
    aiState: 'idle',
    aiTimer: 2 + Math.random() * 3,
    lastAttackedAt: 0,
  };
  mobs.set(id, mob);
  return mob;
}

function spawnMobsAroundPlayer(px: number, pz: number, daytime: number): void {
  const [pcx, pcz] = worldToChunk(px, pz);
  const isDay = daytime > 0.25 && daytime < 0.75;
  const maxMobs = 20; // More mobs for adventures mode

  if (mobs.size >= maxMobs) return;

  for (let dx = -MOB_CHECK_RADIUS; dx <= MOB_CHECK_RADIUS; dx++) {
    for (let dz = -MOB_CHECK_RADIUS; dz <= MOB_CHECK_RADIUS; dz++) {
      if (mobs.size >= maxMobs) return;
      const cx = pcx + dx;
      const cz = pcz + dz;
      const seed = cx * 73856093 ^ cz * 19349663;
      const prng = mulberry32(seed);
      const roll = prng();

      // Determine mob type based on time of day and biome
      let type: MobType;
      if (isDay) {
        // Passive mobs spawn on grass in daylight
        if (roll < 0.25) type = 'cow';
        else if (roll < 0.45) type = 'pig';
        else if (roll < 0.65) type = 'sheep';
        else if (roll < 0.8) type = 'chicken';
        else if (roll < 0.85) type = 'rabbit';
        else if (roll < 0.88) type = 'muddy_pig'; // Minecraft Earth exclusive
        else if (roll < 0.91) type = 'dyed_cat'; // Minecraft Earth exclusive
        else if (roll < 0.94) type = 'moobloom'; // Minecraft Earth exclusive
        else continue; // skip this chunk
      } else {
        // Adventures mode: more hostile mobs at night
        if (roll < 0.3) type = 'zombie';
        else if (roll < 0.55) type = 'skeleton';
        else if (roll < 0.75) type = 'creeper';
        else if (roll < 0.85) type = 'spider';
        else if (roll < 0.9) type = 'drowned';
        else if (roll < 0.95) type = 'husk';
        else type = 'stray';
      }

      // Find ground level
      const wx = cx * W.CHUNK_W + Math.floor(prng() * W.CHUNK_D);
      const wz = cz * W.CHUNK_D + Math.floor(prng() * W.CHUNK_D);
      const groundY = getElevation(wx, wz);

      // Don't spawn in water or too high
      const blockAtFeet = getBlock(wx, groundY, wz);
      if (blockAtFeet === BLOCK.WATER || blockAtFeet === BLOCK.LAVA) continue;
      if (groundY > W.SEA_LEVEL + 80) continue;

      // Check distance from player
      const dist = Math.sqrt((wx - px) ** 2 + (wz - pz) ** 2);
      if (dist < 24 || dist > 96) continue; // spawn between 24-96 blocks

      spawnMob(type, wx, groundY, wz);
    }
  }
}

function updateMob(mob: Mob, dt: number, playerPos: Vector3, difficulty: string): void {
  const props = MOB_PROPERTIES[mob.type];
  if (!props) return;

  const distToPlayer = mob.pos.distanceTo(playerPos);

  // Difficulty multiplier: Hard = faster/more aggressive, Peaceful = no hostile
  const diffMult = difficulty === 'Hard' ? 1.3 : difficulty === 'Easy' ? 0.8 : 1.0;
  if (difficulty === 'Peaceful' && props.hostile) {
    mob.health = 0; // despawn hostiles in peaceful
    return;
  }

  // AI behavior
  mob.aiTimer -= dt;
  if (mob.aiTimer <= 0) {
    mob.aiTimer = 1 + Math.random() * 4;

    if (props.hostile && distToPlayer < props.followRange) {
      // Hostile: chase player if within follow range
      mob.aiState = 'chase';
    } else if (props.category === 'passive' && distToPlayer < 10) {
      // Passive: flee from player if too close
      mob.aiState = 'flee';
    } else {
      // Wander randomly
      mob.aiState = Math.random() < 0.7 ? 'wander' : 'idle';
    }
  }

  // Apply AI state
  const speed = props.movementSpeed * diffMult;
  switch (mob.aiState) {
    case 'wander': {
      const angle = mob.yaw + (Math.random() - 0.5) * 0.5;
      mob.yaw = angle;
      mob.vel.x = -Math.sin(angle) * speed * 0.5;
      mob.vel.z = -Math.cos(angle) * speed * 0.5;
      break;
    }
    case 'flee': {
      // Run away from player
      const dx = mob.pos.x - playerPos.x;
      const dz = mob.pos.z - playerPos.z;
      mob.yaw = Math.atan2(-dx, -dz);
      mob.vel.x = -Math.sin(mob.yaw) * speed;
      mob.vel.z = -Math.cos(mob.yaw) * speed;
      break;
    }
    case 'chase': {
      // Move toward player
      const dx = playerPos.x - mob.pos.x;
      const dz = playerPos.z - mob.pos.z;
      mob.yaw = Math.atan2(-dx, -dz);
      mob.vel.x = -Math.sin(mob.yaw) * speed;
      mob.vel.z = -Math.cos(mob.yaw) * speed;

      // Attack if close enough
      if (distToPlayer < props.attackRange) {
        mob.aiState = 'attack';
        mob.aiTimer = 0.5;
      }
      break;
    }
    case 'attack': {
      // Deal damage to player
      if (distToPlayer < props.attackRange + 1) {
        // Damage will be applied in the attack timer check
        mob.aiTimer = 1.0; // attack cooldown
        mob.aiState = 'chase';
      }
      break;
    }
    case 'idle':
    default:
      mob.vel.x *= 0.8;
      mob.vel.z *= 0.8;
      break;
  }

  // Apply gravity
  mob.vel.y += GRAVITY * dt;
  mob.vel.y = Math.max(mob.vel.y, -40);

  // Move
  mob.pos.x += mob.vel.x * dt;
  mob.pos.z += mob.vel.z * dt;
  mob.pos.y += mob.vel.y * dt;

  // Ground collision
  const groundY = getElevation(Math.floor(mob.pos.x), Math.floor(mob.pos.z));
  if (mob.pos.y <= groundY + 1) {
    mob.pos.y = groundY + 1;
    mob.vel.y = 0;
    mob.onGround = true;
  } else {
    mob.onGround = false;
  }

  // Despawn if too far
  if (distToPlayer > MOB_DESPAWN_DISTANCE) {
    mob.health = 0; // mark for removal
  }
}

function updateMobMeshes(scene: Scene, playerPos: Vector3): void {
  // Remove meshes for dead/distant mobs
  for (const [id, mesh] of mobMeshes) {
    const mob = mobs.get(id);
    if (!mob || mob.health <= 0 || mob.pos.distanceTo(playerPos) > 64) {
      scene.remove(mesh);
      if (mesh.geometry) (mesh.geometry as BoxGeometry).dispose();
      if (mesh.material) (mesh.material as MeshStandardMaterial).dispose();
      mobMeshes.delete(id);
    }
  }

  // Add/update meshes for nearby mobs
  for (const [id, mob] of mobs) {
    if (mob.health <= 0) continue;
    if (mob.pos.distanceTo(playerPos) > 48) continue;

    let mesh = mobMeshes.get(id);
    if (!mesh) {
      const props = MOB_PROPERTIES[mob.type];
      const w = props?.size.width ?? 0.6;
      const h = props?.size.height ?? 1.8;
      const geo = new BoxGeometry(w, h, w);
      const color = getMobColor(mob.type);
      const mat = new MeshLambertMaterial({ color });
      mesh = new Mesh(geo, mat);
      mesh.position.copy(mob.pos);
      scene.add(mesh);
      mobMeshes.set(id, mesh);
    }

    // Update position
    mesh.position.copy(mob.pos);
    mesh.rotation.y = mob.yaw;
  }
}

// ─── Textures (local assets) ─────────────────────────────────────────────────
const textureLoader = new TextureLoader();
const textureCache = new Map<string, Texture>();
const TEXTURE_SIZE = 16;
const TEXTURE_BLOCK_DIR = '/textures/blocks/';

function loadTexture(path: string): Texture {
  const cached = textureCache.get(path);
  if (cached) return cached;

  const texture = textureLoader.load(
    path,
    undefined,
    undefined,
    () => {
      console.warn(`Failed to load texture: ${path}`);
      textureCache.delete(path);
      const fallback = createSolidTexture(0xff00ff);
      textureCache.set(path, fallback);
    }
  );
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.colorSpace = SRGBColorSpace;
  textureCache.set(path, texture);
  return texture;
}

function getBlockTexture(id: number, face: 'all' | 'top' | 'bottom' | 'side' | 'front'): Texture {
  const file = getTextureUrl(id, face);
  if (!file) {
    return createSolidTexture(0xff00ff);
  }
  return loadTexture(TEXTURE_BLOCK_DIR + file);
}

function createSolidTexture(color: number): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  const texture = new CanvasTexture(canvas);
  texture.magFilter = NearestFilter;
  texture.minFilter = NearestFilter;
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// ─── Mesh Builder ─────────────────────────────────────────────────────────────
let worldMeshes: InstancedMesh[] = [];

function buildChunkMesh(scene: Scene, chunk: Chunk): void {
  const baseX = chunk.cx * W.CHUNK_W;
  const baseZ = chunk.cz * W.CHUNK_D;

  const isExposed = (id: number, wx: number, wy: number, wz: number): boolean =>
    id === BLOCK.WATER
      ? getBlock(wx + 1, wy, wz) !== BLOCK.WATER || getBlock(wx - 1, wy, wz) !== BLOCK.WATER ||
        getBlock(wx, wy + 1, wz) !== BLOCK.WATER || getBlock(wx, wy - 1, wz) !== BLOCK.WATER ||
        getBlock(wx, wy, wz + 1) !== BLOCK.WATER || getBlock(wx, wy, wz - 1) !== BLOCK.WATER
      : getBlock(wx + 1, wy, wz) === BLOCK.AIR || getBlock(wx - 1, wy, wz) === BLOCK.AIR ||
        getBlock(wx, wy + 1, wz) === BLOCK.AIR || getBlock(wx, wy - 1, wz) === BLOCK.AIR ||
        getBlock(wx, wy, wz + 1) === BLOCK.AIR || getBlock(wx, wy, wz - 1) === BLOCK.AIR;

  const counts = new Map<number, number>();
  for (let ly = 0; ly < W.CHUNK_H; ly++) {
    for (let lz = 0; lz < W.CHUNK_D; lz++) {
      for (let lx = 0; lx < W.CHUNK_W; lx++) {
        const id = chunk.blocks[localIndex(lx, ly, lz)];
        if (id === BLOCK.AIR) continue;
        const wx = baseX + lx;
        const wy = ly;
        const wz = baseZ + lz;
        if (!isExposed(id, wx, wy, wz)) continue;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
  }

  const geo = new BoxGeometry(1, 1, 1);
  const meshes = new Map<number, { mesh: InstancedMesh; count: number }>();
  for (const [id, cnt] of counts) {
    const mat = createBlockMaterial(id);
    const im = new InstancedMesh(geo, mat, cnt);
    if (id !== BLOCK.WATER) {
      im.castShadow = true;
      im.receiveShadow = true;
    }
    scene.add(im);
    worldMeshes.push(im);
    meshes.set(id, { mesh: im, count: 0 });
  }

  const dummy = new Object3D();
  for (let ly = 0; ly < W.CHUNK_H; ly++) {
    for (let lz = 0; lz < W.CHUNK_D; lz++) {
      for (let lx = 0; lx < W.CHUNK_W; lx++) {
        const id = chunk.blocks[localIndex(lx, ly, lz)];
        if (id === BLOCK.AIR) continue;
        const wx = baseX + lx;
        const wy = ly;
        const wz = baseZ + lz;
        if (!isExposed(id, wx, wy, wz)) continue;
        const e = meshes.get(id);
        if (!e) continue;
        dummy.position.set(wx, wy, wz);
        dummy.updateMatrix();
        e.mesh.setMatrixAt(e.count++, dummy.matrix);
      }
    }
  }
  for (const e of meshes.values()) e.mesh.instanceMatrix.needsUpdate = true;
}

function sideTopMat(id: number): [MeshLambertMaterial, MeshLambertMaterial] {
  return [
    new MeshLambertMaterial({ map: getBlockTexture(id, 'side') }),
    new MeshLambertMaterial({ map: getBlockTexture(id, 'top') }),
  ];
}

function sideTopBottomMat(id: number): [MeshLambertMaterial, MeshLambertMaterial, MeshLambertMaterial] {
  return [
    new MeshLambertMaterial({ map: getBlockTexture(id, 'side') }),
    new MeshLambertMaterial({ map: getBlockTexture(id, 'top') }),
    new MeshLambertMaterial({ map: getBlockTexture(id, 'bottom') }),
  ];
}

// BoxGeometry face order: [+x, -x, +y, -y, +z, -z] = [right, left, top, bottom, front, back]
const TOP_BOTTOM_LAYOUT = [0, 0, 1, 1, 0, 0] as const; // side,side,top,top,side,side
const TOP_BTM_LAYOUT = [0, 0, 1, 2, 0, 0] as const; // side,side,top,bottom,side,side
function buildMultiMat(sideTop: [MeshLambertMaterial, MeshLambertMaterial], layout: readonly number[]): MeshLambertMaterial[] {
  return layout.map((i: number) => sideTop[i]);
}

function buildMultiMat3(mats: [MeshLambertMaterial, MeshLambertMaterial, MeshLambertMaterial], layout: readonly number[]): MeshLambertMaterial[] {
  return layout.map((i: number) => mats[i]);
}

function createBlockMaterial(id: number): MeshLambertMaterial | MeshLambertMaterial[] {
  switch (id) {
    case BLOCK.GLASS:
      return new MeshLambertMaterial({ map: getBlockTexture(BLOCK.GLASS, 'all'), transparent: true, opacity: 0.48 });
    case BLOCK.WATER:
      return new MeshLambertMaterial({ color: 0x3f76e4, transparent: true, opacity: 0.6, depthWrite: false });
    case BLOCK.LAVA:
      return new MeshLambertMaterial({ color: 0xcf4b0f, transparent: true, opacity: 0.8, emissive: 0xff4400, emissiveIntensity: 0.5 });

    // Grass-like: top / side / bottom all different
    case BLOCK.GRASS:
    case BLOCK.MYCELIUM:
    case BLOCK.PODZOL:
    case BLOCK.CRIMSON_NYLIUM:
    case BLOCK.WARPED_NYLIUM:
      return buildMultiMat3(sideTopBottomMat(id), TOP_BTM_LAYOUT);

    // Furnace-like: top / side / front — no visible bottom
    case BLOCK.FURNACE:
    case BLOCK.SMOKER:
    case BLOCK.BLAST_FURNACE: {
      const [side, top] = sideTopMat(id);
      const front = new MeshLambertMaterial({ map: getBlockTexture(id, 'front') });
      return [side, side, top, top, front, side];
    }

    // Crafting table: top / side distinct, bottom = side
    case BLOCK.CRAFTING_TABLE: {
      const [side, top] = sideTopMat(id);
      return [side, side, top, side, side, side];
    }

    // Pillar/log blocks: top/bottom same, side different
    case BLOCK.OAK_LOG:
    case BLOCK.SPRUCE_LOG:
    case BLOCK.BIRCH_LOG:
    case BLOCK.JUNGLE_LOG:
    case BLOCK.ACACIA_LOG:
    case BLOCK.DARK_OAK_LOG:
    case BLOCK.CHERRY_LOG:
    case BLOCK.MANGROVE_LOG:
    case BLOCK.BAMBOO_BLOCK:
    case BLOCK.STRIPPED_CHERRY_LOG:
    case BLOCK.CRIMSON_STEM:
    case BLOCK.WARPED_STEM:
    case BLOCK.ANCIENT_DEBRIS:
    case BLOCK.BASALT:
    case BLOCK.PURPUR_PILLAR:
      return buildMultiMat(sideTopMat(id), TOP_BOTTOM_LAYOUT);

    // Top/side blocks (bottom = top)
    case BLOCK.TNT:
    case BLOCK.PUMPKIN:
    case BLOCK.MELON:
    case BLOCK.CACTUS:
    case BLOCK.SANDSTONE:
    case BLOCK.RED_SANDSTONE:
    case BLOCK.QUARTZ_BLOCK:
    case BLOCK.HAY_BALE:
    case BLOCK.BONE_BLOCK:
      return buildMultiMat(sideTopMat(id), TOP_BOTTOM_LAYOUT);

    // Blocks with distinct top and side but bottom = planks/dirt
    case BLOCK.BOOKSHELF: {
      const [side, top] = sideTopMat(id);
      const planks = new MeshLambertMaterial({ map: getBlockTexture(BLOCK.BOOKSHELF, 'bottom') });
      return [side, side, top, planks, side, side];
    }

    default:
      return new MeshLambertMaterial({ map: getBlockTexture(id, 'all') });
  }
}

export function rebuildWorldMesh(scene: Scene): void {
  for (const mesh of worldMeshes) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((m) => m.dispose());
    } else {
      mesh.material.dispose();
    }
  }
  worldMeshes = [];
  for (const chunk of chunks.values()) {
    buildChunkMesh(scene, chunk);
    chunk.dirty = false;
  }
}

// ─── Player ───────────────────────────────────────────────────────────────────
interface PlayerState {
  pos: Vector3;
  vel: Vector3;
  yaw: number;
  pitch: number;
  onGround: boolean;
  keys: Set<string>;
  isPointerLocked: boolean;
  health: number;
  hunger: number;
  xp: number;
  xpLevel: number;
  oxygen: number;
  isDead: boolean;
  selectedBlock: BlockId;
  moving: boolean;
  sprinting: boolean;
  daytime: number;
  fallDistance: number;
  gameMode: GameMode;
  flying: boolean;
  _lastSpacePress: number;
  _spaceWasDown: boolean;
}

function initPlayer(): PlayerState {
  return {
    pos: new Vector3(0, 100, 0),
    vel: new Vector3(),
    yaw: 0,
    pitch: 0,
    onGround: false,
    keys: new Set(),
    isPointerLocked: false,
    health: 20,
    hunger: 20,
    xp: 0,
    xpLevel: 0,
    oxygen: 300,
    isDead: false,
    selectedBlock: BLOCK.STONE,
    moving: false,
    sprinting: false,
    daytime: 0.5,
    fallDistance: 0,
    gameMode: 'creative',
    flying: false,
    _lastSpacePress: 0,
    _spaceWasDown: false,
  };
}

const GRAVITY = -22;
const JUMP_VEL = 8;
const WALK_SPEED = 5;
const HEAD_H = 1.65;
const PW = 0.35;

function solid(id: number): boolean {
  return id !== BLOCK.AIR && id !== BLOCK.WATER && id !== BLOCK.LAVA;
}

function aabb(x: number, y: number, z: number): boolean {
  return (
    ([
      [-PW, 0, -PW], [PW, 0, -PW], [-PW, 0, PW], [PW, 0, PW],
      [-PW, 1, -PW], [PW, 1, -PW], [-PW, 1, PW], [PW, 1, PW],
    ] as [number, number, number][])
    .some(([dx, dy, dz]) => solid(getBlock(Math.floor(x + dx), Math.floor(y + dy), Math.floor(z + dz))))
  );
}

function updatePlayer(p: PlayerState, dt: number, difficulty: string = 'Normal'): void {
  const wasOnGround = p.onGround;
  const isSprinting = p.keys.has('ShiftLeft');
  const inWater = getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y), Math.floor(p.pos.z)) === BLOCK.WATER;
  const waterMul = inWater ? 0.5 : 1;
  const spd = (isSprinting ? WALK_SPEED * 1.8 : WALK_SPEED) * waterMul;
  p.sprinting = isSprinting;
  const fw = new Vector3(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
  const rt = new Vector3(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
  const mv = new Vector3();
  if (p.keys.has('KeyW') || p.keys.has('ArrowUp')) mv.add(fw);
  if (p.keys.has('KeyS') || p.keys.has('ArrowDown')) mv.sub(fw);
  if (p.keys.has('KeyA') || p.keys.has('ArrowLeft')) mv.sub(rt);
  if (p.keys.has('KeyD') || p.keys.has('ArrowRight')) mv.add(rt);
  p.moving = mv.length() > 0.01;
  if (p.moving) mv.normalize().multiplyScalar(spd);
  // Creative flight: double-tap space to toggle
  const spaceDown = p.keys.has('Space') || p.keys.has('KeyE');
  const shiftDown = p.keys.has('ShiftLeft') || p.keys.has('ShiftRight');
  if (p.gameMode === 'creative') {
    if (spaceDown && !p._spaceWasDown) {
      if (performance.now() - p._lastSpacePress < 500) {
        p.flying = !p.flying;
      }
      p._lastSpacePress = performance.now();
    }
    p._spaceWasDown = spaceDown;
    if (p.flying) {
      p.vel.y = 0;
      if (spaceDown) p.vel.y = JUMP_VEL;
      else if (shiftDown) p.vel.y = -JUMP_VEL;
      p.fallDistance = 0;
    }
  }
  if (!(p.gameMode === 'creative' && p.flying)) {
    if ((p.keys.has('Space') || p.keys.has('KeyE')) && p.onGround) { p.vel.y = (inWater ? JUMP_VEL * 0.6 : JUMP_VEL); p.onGround = false; }
    p.vel.y += GRAVITY * dt;
    p.vel.y = Math.max(p.vel.y, -40);
  }
  if (inWater) { p.vel.x *= 0.8; p.vel.z *= 0.8; }
  p.pos.x += (mv.x + p.vel.x) * dt;
  if (aabb(p.pos.x, p.pos.y - HEAD_H, p.pos.z)) { p.pos.x -= (mv.x + p.vel.x) * dt; p.vel.x = 0; }
  p.pos.z += (mv.z + p.vel.z) * dt;
  if (aabb(p.pos.x, p.pos.y - HEAD_H, p.pos.z)) { p.pos.z -= (mv.z + p.vel.z) * dt; p.vel.z = 0; }
  p.pos.y += p.vel.y * dt;
  if (aabb(p.pos.x, p.pos.y - HEAD_H, p.pos.z)) {
    if (p.vel.y < 0) p.onGround = true;
    p.pos.y -= p.vel.y * dt;
    p.vel.y = 0;
  } else {
    p.onGround = false;
  }
  // Creative mode: no fall damage
  if (p.gameMode === 'creative') {
    p.fallDistance = 0;
  }
  if (p.vel.y < 0 && !p.onGround) {
    p.fallDistance -= p.vel.y * dt;
  }
  if (wasOnGround === false && p.onGround && p.fallDistance > 0) {
    const wetLanding = inWater || getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y - HEAD_H + 0.5), Math.floor(p.pos.z)) === BLOCK.WATER;
    if (!wetLanding) {
      const damage = Math.max(0, Math.floor(p.fallDistance) - 3);
      if (damage > 0) {
        p.health = Math.max(0, p.health - damage);
      }
    }
    p.fallDistance = 0;
  }
  if (inWater) {
    p.fallDistance = 0;
  }
  // Hunger depletion: sprinting costs hunger (survival only)
  if (p.sprinting && p.moving && p.gameMode === 'survival') {
    p.hunger = Math.max(0, p.hunger - dt * 0.4);
  }
  
  // Difficulty-based health regeneration
  if (difficulty === 'Peaceful') {
    // Peaceful: fast regeneration
    if (p.health < 20) {
      p.health = Math.min(20, p.health + dt * 1.0);
    }
  } else if (difficulty === 'Easy') {
    // Easy: slow regeneration when hunger >= 18
    if (p.hunger >= 18 && p.health < 20) {
      p.health = Math.min(20, p.health + dt * 0.25);
    }
  } else if (difficulty === 'Normal') {
    // Normal: standard regeneration when hunger >= 18
    if (p.hunger >= 18 && p.health < 20) {
      p.health = Math.min(20, p.health + dt * 0.5);
    }
  } else if (difficulty === 'Hard') {
    // Hard: no natural regeneration
  }
  
  // Starvation damage when hunger == 0
  if (p.hunger <= 0) {
    // Difficulty affects starvation damage
    const starvationDamage = difficulty === 'Hard' ? 2.0 : difficulty === 'Normal' ? 1.0 : 0.5;
    p.health = Math.max(0, p.health - dt * starvationDamage);
  }
  if (p.pos.y < -10) { p.pos.y = 100; p.vel.set(0, 0, 0); }
  // Water flow push — getFlowDirection pushes player along current
  const feetBlock = getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y - HEAD_H + 0.5), Math.floor(p.pos.z));
  if (feetBlock === BLOCK.WATER) {
    const flow = getFlowDirection(getBlock, Math.floor(p.pos.x), Math.floor(p.pos.y - HEAD_H + 0.5), Math.floor(p.pos.z));
    if (flow) {
      p.vel.x += flow.dx * dt * 5;
      p.vel.z += flow.dz * dt * 5;
      if (flow.dy < 0) p.vel.y -= dt * 10; // sink in falling water
    }
  }
  
  // Oxygen system: 300 = 15 seconds at 20 ticks/sec
  if (p.gameMode === 'creative') {
    p.oxygen = 300;
  } else if (inWater) {
    p.oxygen -= dt * 20;
    if (p.oxygen <= 0) {
      p.oxygen = 0;
      if (difficulty !== 'Peaceful') {
        p.health = Math.max(0, p.health - dt * 1.0); // 1 HP/sec drowning
      }
    }
  } else {
    p.oxygen = Math.min(300, p.oxygen + dt * 20);
  }
  
  // Check for death
  if (p.health <= 0 && !p.isDead) {
    p.isDead = true;
    window.showDeathScreen?.();
  }
}

// ─── Sound Effects ────────────────────────────────────────────────────────────
class SoundEffects {
  private ctx: AudioContext | null = null;

  init(): void {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    }
  }

  playTone(freq: number, type: OscillatorType, duration: number, delay = 0): void {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }
}

const sounds = new SoundEffects();

// ─── Mining System ───────────────────────────────────────────────────────────
interface MiningState {
  targetX: number;
  targetY: number;
  targetZ: number;
  progress: number;
  total: number;
  blockId: number;
  active: boolean;
}

function getHeldToolType(selectedBlock: number): { toolType: ToolType; toolTier: number; toolId: number } {
  if (selectedBlock >= ITEM.WOODEN_PICKAXE && selectedBlock <= ITEM.NETHERITE_PICKAXE) {
    const props = getItemProperties(selectedBlock);
    return { toolType: 'pickaxe', toolTier: props?.miningLevel ?? 1, toolId: selectedBlock };
  }
  if (selectedBlock >= ITEM.WOODEN_AXE && selectedBlock <= ITEM.NETHERITE_AXE) {
    const props = getItemProperties(selectedBlock);
    return { toolType: 'axe', toolTier: props?.miningLevel ?? 1, toolId: selectedBlock };
  }
  if (selectedBlock >= ITEM.WOODEN_SHOVEL && selectedBlock <= ITEM.NETHERITE_SHOVEL) {
    const props = getItemProperties(selectedBlock);
    return { toolType: 'shovel', toolTier: props?.miningLevel ?? 1, toolId: selectedBlock };
  }
  if (selectedBlock >= ITEM.WOODEN_HOE && selectedBlock <= ITEM.NETHERITE_HOE) {
    const props = getItemProperties(selectedBlock);
    return { toolType: 'hoe', toolTier: props?.miningLevel ?? 1, toolId: selectedBlock };
  }
  if (selectedBlock >= ITEM.WOODEN_SWORD && selectedBlock <= ITEM.NETHERITE_SWORD) {
    return { toolType: 'sword', toolTier: 0, toolId: selectedBlock };
  }
  return { toolType: 'none', toolTier: 0, toolId: 0 };
}

function getBlockDrops(blockId: number): number[] {
  const drops: Record<number, number[]> = {
    [BLOCK.STONE]: [BLOCK.COBBLESTONE],
    [BLOCK.GRASS]: [BLOCK.DIRT],
    [BLOCK.GRANITE]: [BLOCK.GRANITE],
    [BLOCK.DIORITE]: [BLOCK.DIORITE],
    [BLOCK.ANDESITE]: [BLOCK.ANDESITE],
    [BLOCK.DIRT]: [BLOCK.DIRT],
    [BLOCK.COBBLESTONE]: [BLOCK.COBBLESTONE],
    [BLOCK.OAK_LOG]: [BLOCK.OAK_LOG],
    [BLOCK.OAK_LEAVES]: [],
    [BLOCK.IRON_ORE]: [ITEM.RAW_IRON],
    [BLOCK.GOLD_ORE]: [ITEM.RAW_GOLD],
    [BLOCK.DIAMOND_ORE]: [ITEM.DIAMOND],
    [BLOCK.COAL_ORE]: [ITEM.COAL],
    [BLOCK.REDSTONE_ORE]: [ITEM.REDSTONE_DUST],
    [BLOCK.EMERALD_ORE]: [ITEM.EMERALD],
    [BLOCK.LAPIS_ORE]: [ITEM.LAPIS_LAZULI],
    [BLOCK.OAK_PLANKS]: [BLOCK.OAK_PLANKS],
    [BLOCK.OAK_STAIRS]: [BLOCK.OAK_PLANKS],
    [BLOCK.OAK_SLAB]: [BLOCK.OAK_PLANKS],
    [BLOCK.OAK_FENCE]: [BLOCK.OAK_PLANKS],
    [BLOCK.OAK_DOOR]: [BLOCK.OAK_DOOR],
    [BLOCK.OAK_PRESSURE_PLATE]: [BLOCK.OAK_PLANKS],
    [BLOCK.CRAFTING_TABLE]: [BLOCK.CRAFTING_TABLE],
    [BLOCK.FURNACE]: [BLOCK.FURNACE],
    [BLOCK.CHEST]: [BLOCK.CHEST],
    [BLOCK.BEDROCK]: [],
    [BLOCK.WATER]: [],
    [BLOCK.LAVA]: [],
    [BLOCK.SAND]: [BLOCK.SAND],
    [BLOCK.GRAVEL]: [BLOCK.GRAVEL],
    [BLOCK.GOLD_BLOCK]: [BLOCK.GOLD_BLOCK],
    [BLOCK.IRON_BLOCK]: [BLOCK.IRON_BLOCK],
    [BLOCK.DIAMOND_BLOCK]: [BLOCK.DIAMOND_BLOCK],
    [BLOCK.BRICK]: [BLOCK.BRICK],
    [BLOCK.TNT]: [BLOCK.TNT],
    [BLOCK.BOOKSHELF]: [BLOCK.OAK_PLANKS],
    [BLOCK.OBSIDIAN]: [BLOCK.OBSIDIAN],
    [BLOCK.TORCH]: [ITEM.TORCH],
    [BLOCK.GLOWSTONE]: [BLOCK.GLOWSTONE],
    [BLOCK.PUMPKIN]: [BLOCK.PUMPKIN],
    [BLOCK.NETHERRACK]: [BLOCK.NETHERRACK],
    [BLOCK.SOUL_SAND]: [BLOCK.SOUL_SAND],
    [BLOCK.MYCELIUM]: [BLOCK.DIRT],
    [BLOCK.NETHER_BRICK]: [BLOCK.NETHER_BRICK],
    [BLOCK.END_STONE]: [BLOCK.END_STONE],
    [BLOCK.EMERALD_BLOCK]: [BLOCK.EMERALD_BLOCK],
    [BLOCK.REDSTONE_BLOCK]: [BLOCK.REDSTONE_BLOCK],
    [BLOCK.QUARTZ_BLOCK]: [BLOCK.QUARTZ_BLOCK],
    [BLOCK.IRON_DOOR]: [BLOCK.IRON_DOOR],
    [BLOCK.BONE_BLOCK]: [BLOCK.BONE_BLOCK],
    [BLOCK.SEA_LANTERN]: [BLOCK.SEA_LANTERN],
    [BLOCK.SLIME_BLOCK]: [BLOCK.SLIME_BLOCK],
    [BLOCK.MELON]: [BLOCK.MELON],
    [BLOCK.NETHER_BRICK_STAIRS]: [BLOCK.NETHER_BRICK],
    [BLOCK.STONE_BRICK]: [BLOCK.STONE_BRICK],
    [BLOCK.STONE_BRICK_STAIRS]: [BLOCK.STONE_BRICK],
    [BLOCK.COBBLESTONE_STAIRS]: [BLOCK.COBBLESTONE],
    [BLOCK.ACACIA_LOG]: [BLOCK.ACACIA_LOG],
    [BLOCK.DARK_OAK_LOG]: [BLOCK.DARK_OAK_LOG],
    [BLOCK.SPRUCE_LOG]: [BLOCK.SPRUCE_LOG],
    [BLOCK.BIRCH_LOG]: [BLOCK.BIRCH_LOG],
    [BLOCK.JUNGLE_LOG]: [BLOCK.JUNGLE_LOG],
    [BLOCK.ACACIA_PLANKS]: [BLOCK.ACACIA_PLANKS],
    [BLOCK.DARK_OAK_PLANKS]: [BLOCK.DARK_OAK_PLANKS],
    [BLOCK.SPRUCE_PLANKS]: [BLOCK.SPRUCE_PLANKS],
    [BLOCK.BIRCH_PLANKS]: [BLOCK.BIRCH_PLANKS],
    [BLOCK.JUNGLE_PLANKS]: [BLOCK.JUNGLE_PLANKS],
    [BLOCK.BLACKSTONE]: [BLOCK.BLACKSTONE],
    [BLOCK.POLISHED_BLACKSTONE]: [BLOCK.POLISHED_BLACKSTONE],
    [BLOCK.NETHER_GOLD_ORE]: [ITEM.GOLD_NUGGET],
    [BLOCK.QUARTZ_ORE]: [ITEM.QUARTZ],
  };
  return drops[blockId] ?? [blockId];
}

// ─── createScene ──────────────────────────────────────────────────────────────
export function createScene(canvas: HTMLCanvasElement): () => void {
  const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;

  const scene = new Scene();
  scene.background = new Color(0x87ceeb);
  scene.fog = new Fog(0x87ceeb, 60, 120);

  const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 200);

  // Sky color
  scene.background = new Color(0x87ceeb);
  scene.fog = new Fog(0x87ceeb, 60, 120);

  // Lighting
  scene.add(new HemisphereLight(0x87ceeb, 0x8b6842, 0.6));
  const sun = new DirectionalLight(0xffeedd, 1.4);
  sun.position.set(200, 400, 200);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  scene.add(sun);

  // Settings state
  let difficulty = 'Normal';
  let renderDistance = W.RENDER_DISTANCE;

  // Generate initial chunks around player
  const playerChunkX = 0;
  const playerChunkZ = 0;
  for (let dx = -renderDistance; dx <= renderDistance; dx++) {
    for (let dz = -renderDistance; dz <= renderDistance; dz++) {
      getOrCreateChunk(playerChunkX + dx, playerChunkZ + dz);
    }
  }
  rebuildWorldMesh(scene);

  // Place real-world landmarks at GPS coordinates
  placeAllLandmarks(scene);

  // Find ground level for spawn
  const spawnY = getElevation(0, 0) + 2;

  const player = initPlayer();
  player.pos.set(0, spawnY, 0);

  const handPivot = new Group();
  handPivot.position.set(0.52, -0.46, -0.78);
  const sleeve = new MeshLambertMaterial({ color: 0x3b8291 });
  const skin = new MeshLambertMaterial({ color: 0xba7c52 });
  const hand = new Mesh(new BoxGeometry(0.25, 0.58, 0.25), [sleeve, sleeve, skin, sleeve, sleeve, sleeve]);
  hand.rotation.x = -0.5;
  const heldBlock = new Mesh(new BoxGeometry(0.22, 0.22, 0.22), createBlockMaterial(BLOCK.STONE));
  heldBlock.position.set(-0.03, 0.28, -0.12);
  handPivot.add(hand, heldBlock);
  camera.add(handPivot);
  scene.add(camera);
  let handSwing = 0;
  let attackCooldown = 0;
  const mining: MiningState = { targetX: 0, targetY: 0, targetZ: 0, progress: 0, total: 0, blockId: 0, active: false };
  let miningOverlay: Mesh | null = null;
  let fluidTickCounter = 0;

  // Eating state
  let isEating = false;
  let eatingProgress = 0;
  const EATING_DURATION = 1.6; // seconds
  let eatingItem: number | null = null;

  // Inventory
  const inventory = new Inventory();
  const addDropToInventory = (itemId: number) => {
    inventory.addItem(itemId, 1);
  };
  const renderInventorySlots = () => {
    for (let i = 0; i < 27; i++) {
      const slotEl = document.querySelector(`[data-slot="storage-${i}"]`) as HTMLElement | null;
      if (!slotEl) continue;
      const item = inventory.getSlot(SLOT.MAIN_START + i);
      renderSlotItem(slotEl, item);
    }
    for (let i = 0; i < 9; i++) {
      const slotEl = document.querySelector(`[data-slot="hotbar-${i}"]`) as HTMLElement | null;
      if (!slotEl) continue;
      const item = inventory.getSlot(SLOT.HOTBAR_START + i);
      renderSlotItem(slotEl, item);
    }
  };
  const renderSlotItem = (el: HTMLElement, item: { itemId: number; count: number } | null) => {
    el.innerHTML = '';
    if (!item || item.count <= 0) return;
    const file = item.itemId >= 10000 ? getItemTextureFile(item.itemId) : getTextureUrl(item.itemId, 'all');
    if (file) {
      const img = document.createElement('div');
      img.className = 'slot-item';
      img.style.backgroundImage = `url(/textures/items/${file})`;
      el.appendChild(img);
    }
    if (item.count > 1) {
      const count = document.createElement('span');
      count.className = 'slot-count';
      count.textContent = String(item.count);
      el.appendChild(count);
    }
  };

  // Crafting table state
  const craftingGrid: (number | null)[] = [null, null, null, null, null, null, null, null, null];
  let craftingOutput: { itemId: number; count: number } | null = null;

  const updateCraftingOutput = () => {
    const grid2D: (number | null)[][] = [];
    for (let r = 0; r < 3; r++) {
      grid2D.push(craftingGrid.slice(r * 3, r * 3 + 3));
    }
    craftingOutput = findRecipe(grid2D, 3, 3);
    const outEl = document.querySelector('[data-slot="table-out"]') as HTMLElement | null;
    if (outEl) {
      outEl.innerHTML = '';
      if (craftingOutput) {
        const url = getTextureUrl(craftingOutput.itemId, 'all');
        if (url) {
          const img = document.createElement('div');
          img.className = 'slot-item';
          img.style.backgroundImage = `url(${url})`;
          outEl.appendChild(img);
        }
        if (craftingOutput.count > 1) {
          const count = document.createElement('span');
          count.className = 'slot-count';
          count.textContent = String(craftingOutput.count);
          outEl.appendChild(count);
        }
      }
    }
  };

  // Furnace state
  let furnaceInput: { itemId: number; count: number } | null = null;
  let furnaceFuel: { itemId: number; count: number; burnTime: number } | null = null;
  let furnaceOutput: { itemId: number; count: number } | null = null;
  let furnaceProgress = 0;

  // Block highlight
  const highlightGeo = new BoxGeometry(1.02, 1.02, 1.02);
  const edges = new EdgesGeometry(highlightGeo);
  const highlightMat = new LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
  const blockHighlight = new LineSegments(edges, highlightMat);
  blockHighlight.visible = false;
  scene.add(blockHighlight);

  const hudEl = document.getElementById('game-hud');
  const crossEl = document.getElementById('crosshair');

  // Hotbar UI
  const HOTBAR_BLOCKS: BlockId[] = [
    BLOCK.STONE, BLOCK.GRASS, BLOCK.DIRT, BLOCK.COBBLESTONE,
    BLOCK.OAK_PLANKS, BLOCK.OAK_LOG, BLOCK.GOLD_BLOCK, BLOCK.GLASS, BLOCK.OAK_LEAVES
  ];

  // Give player starting items
  HOTBAR_BLOCKS.forEach(blockId => {
    inventory.addItem(blockId, 64);
  });

  const initHotbarIcons = () => {
    for (let i = 0; i < 9; i++) {
      const slotEl = document.getElementById(`slot-${i}`);
      if (!slotEl) continue;
      const preview = slotEl.querySelector('.block-preview') as HTMLElement | null;
      if (!preview) continue;
      const blockId = HOTBAR_BLOCKS[i];
      const url = getTextureUrl(blockId, 'all');
      if (url) {
        preview.style.backgroundImage = `url(${url})`;
        preview.style.backgroundSize = 'contain';
        preview.style.backgroundRepeat = 'no-repeat';
        preview.style.backgroundPosition = 'center';
      }
    }
  };
  initHotbarIcons();

  const updateHotbarUI = () => {
    const idx = HOTBAR_BLOCKS.indexOf(player.selectedBlock);
    for (let i = 0; i < 9; i++) {
      const slotEl = document.getElementById(`slot-${i}`);
      if (slotEl) {
        slotEl.classList.toggle('active', i === idx);
      }
    }
  };

  const onSelectSlot = (e: Event) => {
    const customEvent = e as CustomEvent<{ index: number }>;
    player.selectedBlock = HOTBAR_BLOCKS[customEvent.detail.index];
    heldBlock.material = createBlockMaterial(player.selectedBlock);
    updateHotbarUI();
  };
  window.addEventListener('select-slot', onSelectSlot);

  // Block interaction
  const onMouseDown = (e: MouseEvent) => {
    if (!player.isPointerLocked) return;

    const raycaster = new Raycaster();
    raycaster.far = 6;
    raycaster.setFromCamera(new Vector2(0, 0), camera);
    handSwing = 1;

    const intersects = raycaster.intersectObjects(worldMeshes);

    // Check for mob interaction first
    const mobMeshArr = Array.from(mobMeshes.values());
    const mobIntersects = raycaster.intersectObjects(mobMeshArr);
    if (mobIntersects.length > 0 && e.button === 0) {
      const mobObj = mobIntersects[0].object as Mesh;
      const mobId = Array.from(mobMeshes.entries()).find(([_, m]) => m === mobObj)?.[0];
      if (mobId) {
        const mob = mobs.get(mobId);
        if (mob && mob.health > 0) {
          // Determine damage based on held item
          let damage = 1; // bare hand
          const heldItem = inventory.getSlot(SLOT.HOTBAR_START + inventory.selectedHotbar);
          if (heldItem) {
            const props = getItemProperties(heldItem.itemId);
            if (props?.category === 'weapon') {
              damage = props.damage ?? 4;
            } else if (props?.category === 'tool') {
              damage = 2; // tools do 2 damage
            }
          }
          mob.health -= damage;
          sounds.playTone(150, 'square', 0.1);
          handSwing = 1;
          // Knockback
          const dx = mob.pos.x - player.pos.x;
          const dz = mob.pos.z - player.pos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 0) {
            mob.pos.x += (dx / dist) * 0.5;
            mob.pos.z += (dz / dist) * 0.5;
          }
          // Check for death
          if (mob.health <= 0) {
            const props = MOB_PROPERTIES[mob.type];
            if (props) {
              for (const drop of props.drops) {
                if (Math.random() <= drop.chance) {
                  const count = drop.count || 1;
                  for (let i = 0; i < count; i++) {
                    addDropToInventory(drop.id);
                  }
                }
              }
              player.xp += props.experience;
              if (player.xp >= player.xpLevel * 10 + 10) {
                player.xp = 0;
                player.xpLevel++;
              }
              showNotification(`Killed ${props.displayName} (+${props.experience} XP)`);
            }
          }
          return;
        }
      }
    }

    // Check for tappable interaction first
    const tappableIntersects = raycaster.intersectObjects(Array.from(tappableMeshes.values()));
    if (tappableIntersects.length > 0) {
      const tappableObj = tappableIntersects[0].object as Mesh;
      const tappableId = tappableObj.userData?.tappableId;
      if (tappableId && e.button === 0) {
        const drops = collectTappable(tappableId);
        if (drops.length > 0) {
          let totalXp = 0;
           for (const drop of drops) {
             const name = getItemProperties(drop.itemId)?.displayName ?? `Item ${drop.itemId}`;
             showNotification(`Collected: ${drop.count}x ${name}`);
             totalXp += drop.count;
             // Add to inventory
             inventory.addItem(drop.itemId, drop.count);
           }
          sounds.playTone(400, 'sine', 0.15);
          // Remove tappable mesh
          scene.remove(tappableObj);
          (tappableObj.geometry as BoxGeometry).dispose();
          (tappableObj.material as MeshStandardMaterial).dispose();
          tappableMeshes.delete(tappableId);
          // XP gain
          player.xp += totalXp;
          if (player.xp >= player.xpLevel * 10 + 10) {
            player.xp = 0;
            player.xpLevel++;
          }
        }
        return;
      }
    }

    if (intersects.length > 0) {
      const intersect = intersects[0];
      if (intersect.instanceId === undefined) return;

      const matrix = new Matrix4();
      (intersect.object as InstancedMesh).getMatrixAt(intersect.instanceId, matrix);
      const clickedBlockPos = new Vector3();
      clickedBlockPos.setFromMatrixPosition(matrix);

      const bx = Math.round(clickedBlockPos.x);
      const by = Math.round(clickedBlockPos.y);
      const bz = Math.round(clickedBlockPos.z);

        if (e.button === 0) {
          const blockId = getBlock(bx, by, bz);
          if (blockId !== BLOCK.AIR && blockId !== BLOCK.BEDROCK) {
            // Creative mode: instant block break
            if (player.gameMode === 'creative') {
              breakBlock(bx, by, bz, blockId, scene);
              return;
            }
            const props = getBlockProperties(blockId);
            if (props.hardness < 0) return;
            const { toolType, toolTier, toolId } = getHeldToolType(player.selectedBlock);
            const harvestTime = getHarvestTime(blockId, toolId, toolType, toolTier);
            if (mining.active && mining.targetX === bx && mining.targetY === by && mining.targetZ === bz) {
              mining.progress += 1 / 60;
              if (mining.progress >= mining.total) {
                breakBlock(bx, by, bz, blockId, scene);
                mining.active = false;
                mining.progress = 0;
              }
            } else {
              mining.targetX = bx;
              mining.targetY = by;
              mining.targetZ = bz;
              mining.blockId = blockId;
              mining.progress = 0;
              mining.total = harvestTime;
              mining.active = true;
              // Warn if using wrong tool
              if (props.requiredTool !== 'none' && props.requiredTool !== toolType) {
                showNotification(`Need ${props.requiredTool} to mine this faster`);
              }
              if (!miningOverlay) {
                const geo = new BoxGeometry(1.005, 1.005, 1.005);
                const mat = new MeshStandardMaterial({ 
                  color: 0x000000, 
                  transparent: true, 
                  opacity: 0, 
                  depthTest: true,
                  wireframe: false,
                });
                miningOverlay = new Mesh(geo, mat);
                scene.add(miningOverlay);
              }
              miningOverlay.visible = true;
            }
          }
      } else if (e.button === 2) {
        const blockId = getBlock(bx, by, bz);

        // Bucket collection: collect water with empty bucket
        const collItem = inventory.getSlot(SLOT.HOTBAR_START + inventory.selectedHotbar);
        if (collItem && collItem.itemId === ITEM.BUCKET && blockId === BLOCK.WATER) {
          setBlock(bx, by, bz, BLOCK.AIR);
          collItem.itemId = ITEM.WATER_BUCKET;
          sounds.playTone(300, 'square', 0.1);
          rebuildWorldMesh(scene);
          renderInventorySlots();
          return;
        }

        if (blockId === BLOCK.CRAFTING_TABLE) {
          window.dispatchEvent(new CustomEvent('crafting-table-toggle', { detail: { open: true } }));
          return;
        }
        if (blockId === BLOCK.FURNACE) {
          window.dispatchEvent(new CustomEvent('furnace-toggle', { detail: { open: true } }));
          return;
        }

        // Check if held item is food - start eating
        const foodHeldItem = inventory.getSlot(SLOT.HOTBAR_START + inventory.selectedHotbar);
        if (foodHeldItem && foodHeldItem.count > 0) {
          const foodProps = getItemProperties(foodHeldItem.itemId);
          if (foodProps?.category === 'food' && foodProps.foodPoints) {
            if (!isEating) {
              isEating = true;
              eatingProgress = 0;
              eatingItem = foodHeldItem.itemId;
              showNotification(`Eating ${foodProps.displayName}...`);
              return;
            }
          }
        }

        if (!intersect.face) return;
        const normal = intersect.face.normal.clone();
        const newPos = clickedBlockPos.clone().add(normal);
        const nx = Math.round(newPos.x);
        const ny = Math.round(newPos.y);
        const nz = Math.round(newPos.z);

        if (getBlock(nx, ny, nz) !== BLOCK.AIR) return;

        const overlapX = (player.pos.x - PW < nx + 0.5) && (player.pos.x + PW > nx - 0.5);
        const overlapY = (player.pos.y - HEAD_H < ny + 0.5) && (player.pos.y - HEAD_H + 1.8 > ny - 0.5);
        const overlapZ = (player.pos.z - PW < nz + 0.5) && (player.pos.z + PW > nz - 0.5);
        if (overlapX && overlapY && overlapZ) return;

        // Consume item from inventory
        const blockHeldItem = inventory.getSlot(SLOT.HOTBAR_START + inventory.selectedHotbar);
        if (!blockHeldItem || blockHeldItem.count <= 0) return;

        // Water bucket placement
        if (blockHeldItem.itemId === ITEM.WATER_BUCKET) {
          setBlock(nx, ny, nz, BLOCK.WATER);
          blockHeldItem.itemId = ITEM.BUCKET;
          sounds.playTone(300, 'square', 0.1);
          rebuildWorldMesh(scene);
          renderInventorySlots();
          return;
        }

        setBlock(nx, ny, nz, player.selectedBlock);
        sounds.playTone(300, 'square', 0.1);
        rebuildWorldMesh(scene);

        // Decrease item count
        blockHeldItem.count--;
        if (blockHeldItem.count <= 0) {
          inventory.setSlot(SLOT.HOTBAR_START + inventory.selectedHotbar, null);
        }
        renderInventorySlots();
      }
    }
  };

  const breakBlock = (bx: number, by: number, bz: number, blockId: number, scene: Scene) => {
    setBlock(bx, by, bz, BLOCK.AIR);
    sounds.playTone(200, 'square', 0.1);
    rebuildWorldMesh(scene);
    const drops = getBlockDrops(blockId);
    drops.forEach(itemId => addDropToInventory(itemId));
    if (drops.length > 0) {
      showNotification(`+${drops.length} ${getBlockName(drops[0])}`);
    }
    player.xp += 0.5;
    if (player.xp >= player.xpLevel * 10 + 10) {
      player.xp = 0;
      player.xpLevel++;
    }
    if (miningOverlay) miningOverlay.visible = false;
  };

  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 0 && mining.active) {
      mining.active = false;
      mining.progress = 0;
      if (miningOverlay) miningOverlay.visible = false;
    }
  };

  const onContextMenu = (e: MouseEvent) => e.preventDefault();
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('contextmenu', onContextMenu);

  const onPD = () => {
    if (!player.isPointerLocked) {
      void canvas.requestPointerLock().catch(() => {});
      sounds.init();
    }
  };
  const onPLC = () => {
    player.isPointerLocked = document.pointerLockElement === canvas;
    if (crossEl) crossEl.style.display = player.isPointerLocked ? 'block' : 'none';
  };
  canvas.addEventListener('click', onPD);
  document.addEventListener('pointerlockchange', onPLC);

  const onMM = (e: MouseEvent) => {
    if (!player.isPointerLocked) return;
    player.yaw -= e.movementX * 0.002;
    player.pitch -= e.movementY * 0.002;
    player.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, player.pitch));
  };
  document.addEventListener('mousemove', onMM);

  const onKD = (e: KeyboardEvent) => {
    player.keys.add(e.code);
    const keys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'];
    const keyIdx = keys.indexOf(e.code);
    if (keyIdx !== -1) {
      player.selectedBlock = HOTBAR_BLOCKS[keyIdx];
      heldBlock.material = createBlockMaterial(player.selectedBlock);
      updateHotbarUI();
    }
    if (e.code === 'KeyF') {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void canvas.requestFullscreen();
    }
  };
  const onKU = (e: KeyboardEvent) => player.keys.delete(e.code);
  document.addEventListener('keydown', onKD);
  document.addEventListener('keyup', onKU);

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };
  window.addEventListener('resize', onResize);

  // Settings event listeners
  const onSettingsChange = (e: Event) => {
    const customEvent = e as CustomEvent<{ fov?: number; difficulty?: string; renderDistance?: number }>;
    if (customEvent.detail.fov !== undefined) {
      camera.fov = customEvent.detail.fov;
      camera.updateProjectionMatrix();
    }
    if (customEvent.detail.difficulty !== undefined) {
      difficulty = customEvent.detail.difficulty;
    }
    if (customEvent.detail.renderDistance !== undefined) {
      renderDistance = customEvent.detail.renderDistance;
      W.RENDER_DISTANCE = renderDistance;
    }
  };
  window.addEventListener('settings-change', onSettingsChange);

  // Crafting table toggle
  window.addEventListener('crafting-table-toggle', ((e: CustomEvent<{ open: boolean }>) => {
    if (e.detail.open) {
      // Render crafting grid
      for (let i = 0; i < 9; i++) {
        const slotEl = document.querySelector(`[data-slot="table-${i}"]`) as HTMLElement | null;
        if (!slotEl) continue;
        const itemId = craftingGrid[i];
        if (itemId !== null) {
          const url = getTextureUrl(itemId, 'all');
          if (url) {
            const img = document.createElement('div');
            img.className = 'slot-item';
            img.style.backgroundImage = `url(${url})`;
            slotEl.innerHTML = '';
            slotEl.appendChild(img);
          }
        } else {
          slotEl.innerHTML = '';
        }
      }
      updateCraftingOutput();
      renderInventorySlots();
    }
  }) as EventListener);

  // Furnace toggle
  window.addEventListener('furnace-toggle', ((e: CustomEvent<{ open: boolean }>) => {
    if (e.detail.open) {
      renderInventorySlots();
      // Render furnace slots
      const inEl = document.querySelector('[data-slot="furnace-in"]') as HTMLElement | null;
      const fuelEl = document.querySelector('[data-slot="furnace-fuel"]') as HTMLElement | null;
      const outEl = document.querySelector('[data-slot="furnace-out"]') as HTMLElement | null;
      if (inEl && furnaceInput) {
        inEl.innerHTML = '';
        const url = getTextureUrl(furnaceInput.itemId, 'all');
        if (url) {
          const img = document.createElement('div');
          img.className = 'slot-item';
          img.style.backgroundImage = `url(${url})`;
          inEl.appendChild(img);
        }
      }
      if (fuelEl && furnaceFuel) {
        fuelEl.innerHTML = '';
        const url = getTextureUrl(furnaceFuel.itemId, 'all');
        if (url) {
          const img = document.createElement('div');
          img.className = 'slot-item';
          img.style.backgroundImage = `url(${url})`;
          fuelEl.appendChild(img);
        }
      }
      if (outEl && furnaceOutput) {
        outEl.innerHTML = '';
        const url = getTextureUrl(furnaceOutput.itemId, 'all');
        if (url) {
          const img = document.createElement('div');
          img.className = 'slot-item';
          img.style.backgroundImage = `url(${url})`;
          outEl.appendChild(img);
        }
      }
    }
  }) as EventListener);

  // Respawn event listener
  const onRespawn = () => {
    player.isDead = false;
    player.health = 20;
    player.hunger = 20;
    player.pos.set(0, getElevation(0, 0) + 2, 0);
    player.vel.set(0, 0, 0);
  };
  window.addEventListener('player-respawn', onRespawn);

  // Inventory toggle
  window.addEventListener('inventory-toggle', ((e: CustomEvent<{ open: boolean }>) => {
    if (e.detail.open) renderInventorySlots();
  }) as EventListener);

  // Weather particles
  const weatherParticles: Mesh[] = [];
  const WEATHER_COUNT = 200;
  let weatherType: 'clear' | 'rain' | 'snow' = 'clear';
  const initWeatherParticles = () => {
    const geo = new BoxGeometry(0.05, 0.3, 0.05);
    const mat = new MeshLambertMaterial({ color: 0xccddff, transparent: true, opacity: 0.6 });
    for (let i = 0; i < WEATHER_COUNT; i++) {
      const p = new Mesh(geo, mat);
      p.position.set(
        (Math.random() - 0.5) * 40,
        Math.random() * 30 + 5,
        (Math.random() - 0.5) * 40,
      );
      p.visible = false;
      scene.add(p);
      weatherParticles.push(p);
    }
  };
  initWeatherParticles();

  const updateWeather = (dt: number) => {
    const timeOfDay = player.daytime;
    const isNight = timeOfDay < 0.25 || timeOfDay > 0.75;
    const newType = isNight && Math.random() < 0.001 ? (Math.random() < 0.5 ? 'rain' : 'snow') : 'clear';
    if (newType !== 'clear') weatherType = newType;
    else if (Math.random() < 0.0005) weatherType = 'clear';

    const isPrecip = weatherType === 'rain' || weatherType === 'snow';
    for (const p of weatherParticles) {
      p.visible = isPrecip;
      if (isPrecip) {
        p.position.y -= dt * 20;
        p.position.x = player.pos.x + (Math.random() - 0.5) * 40;
        p.position.z = player.pos.z + (Math.random() - 0.5) * 40;
        if (p.position.y < player.pos.y - 5) {
          p.position.y = player.pos.y + 25 + Math.random() * 5;
        }
      }
    }
  };
  
  // Adventures mode - hostile mobs spawn at night

  let raf = 0, lastT = performance.now();
  const animate = () => {
    raf = requestAnimationFrame(animate);
    const now = performance.now(), dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    attackCooldown = Math.max(0, attackCooldown - dt);
    handSwing = Math.max(0, handSwing - dt * 4.5);
    handPivot.rotation.x = -0.2 + Math.sin(handSwing * Math.PI) * 0.7;

    // Weather
    updateWeather(dt);

    // Furnace tick
    if (furnaceFuel && furnaceFuel.burnTime > 0) {
      furnaceFuel.burnTime -= dt;
      if (furnaceFuel.burnTime <= 0) {
        furnaceFuel.count--;
        if (furnaceFuel.count <= 0) furnaceFuel = null;
      }
      if (furnaceInput && furnaceOutput) {
        const recipes = findFurnaceSmeltingRecipes(furnaceInput.itemId);
        if (recipes.length > 0) {
          furnaceProgress += dt;
          if (furnaceProgress >= 10) {
            furnaceProgress = 0;
            if (furnaceOutput) {
              furnaceOutput.count += recipes[0].count;
            } else {
              furnaceOutput = { itemId: recipes[0].output, count: recipes[0].count };
            }
            furnaceInput.count--;
            if (furnaceInput.count <= 0) furnaceInput = null;
          }
        }
      }
    }

    // Mining progress
    if (mining.active) {
      mining.progress += dt;
      if (miningOverlay) {
        const pct = Math.min(1, mining.progress / mining.total);
        miningOverlay.position.set(mining.targetX, mining.targetY, mining.targetZ);
        // Show crack stages: 0-10% invisible, 10-90% progressive cracks, 90-100% almost broken
        if (pct < 0.1) {
          (miningOverlay.material as MeshStandardMaterial).opacity = 0;
        } else if (pct < 0.9) {
          (miningOverlay.material as MeshStandardMaterial).opacity = (pct - 0.1) * 0.6;
        } else {
          (miningOverlay.material as MeshStandardMaterial).opacity = 0.48 + (pct - 0.9) * 0.5;
        }
      }
      if (mining.progress >= mining.total) {
        const blockId = getBlock(mining.targetX, mining.targetY, mining.targetZ);
        if (blockId !== BLOCK.AIR && blockId !== BLOCK.BEDROCK) {
          breakBlock(mining.targetX, mining.targetY, mining.targetZ, blockId, scene);
        }
        mining.active = false;
        mining.progress = 0;
      }
    }

    // Fluid simulation — every 20 frames (≈1 tick/sec at 60fps)
    fluidTickCounter++;
    if (fluidTickCounter >= 20) {
      fluidTickCounter = 0;
      const updates: { x: number; y: number; z: number; blockId: number }[] = [];
      for (const chunk of chunks.values()) {
        const baseX = chunk.cx * 16;
        const baseZ = chunk.cz * 16;
        for (let ly = 1; ly < 80; ly++) {
          for (let lz = 0; lz < 16; lz++) {
            for (let lx = 0; lx < 16; lx++) {
              const wx = baseX + lx;
              const wz = baseZ + lz;
              const id = chunk.blocks[localIndex(lx, ly, lz)];
              if (!isWater(id) && !isLava(id)) continue;
              // Lava-water interactions per wiki: water+lava source→obsidian, water+flowing lava (lateral)→cobblestone, flowing lava down→stone
              if (isLava(id)) {
                for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
                  const nid = getBlock(wx + dx, ly + dy, wz + dz);
                  if (!isWater(nid)) continue;
                  if (createsObsidian(nid, id)) {
                    updates.push({ x: wx, y: ly, z: wz, blockId: BLOCK.OBSIDIAN });
                  } else if (dy === -1 && createsStone(id)) {
                    updates.push({ x: wx + dx, y: ly + dy, z: wz + dz, blockId: BLOCK.STONE });
                  } else if (createsCobblestone(nid, id)) {
                    updates.push({ x: wx, y: ly, z: wz, blockId: BLOCK.COBBLESTONE });
                  }
                  break;
                }
              } else if (isWater(id)) {
                for (const [dx, dy, dz] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) {
                  const nid = getBlock(wx + dx, ly + dy, wz + dz);
                  if (!isLava(nid)) continue;
                  if (createsObsidian(id, nid)) {
                    updates.push({ x: wx + dx, y: ly + dy, z: wz + dz, blockId: BLOCK.OBSIDIAN });
                  } else if (createsCobblestone(id, nid)) {
                    updates.push({ x: wx + dx, y: ly + dy, z: wz + dz, blockId: BLOCK.COBBLESTONE });
                  }
                  break;
                }
              }
              const fluidUpdates = tickFluid(getBlock, wx, ly, wz);
              updates.push(...fluidUpdates);
            }
          }
        }
      }
      if (updates.length > 0) {
        for (const u of updates) {
          setBlock(u.x, u.y, u.z, u.blockId as BlockId);
        }
        rebuildWorldMesh(scene);
      }
    }

    updatePlayer(player, dt, difficulty);

    // Eating timer
    if (isEating && eatingItem !== null) {
      eatingProgress += dt;
      // Eating animation - hand swings
      handSwing = Math.min(1, eatingProgress / EATING_DURATION);
      if (eatingProgress >= EATING_DURATION) {
        // Complete eating - restore hunger
        const props = getItemProperties(eatingItem);
        if (props?.foodPoints) {
          player.hunger = Math.min(20, player.hunger + props.foodPoints);
          showNotification(`Ate ${props.displayName} (+${props.foodPoints} hunger)`);
        }
        // Consume item
        const heldItem = inventory.getSlot(SLOT.HOTBAR_START + inventory.selectedHotbar);
        if (heldItem && heldItem.itemId === eatingItem) {
          heldItem.count--;
          if (heldItem.count <= 0) {
            inventory.setSlot(SLOT.HOTBAR_START + inventory.selectedHotbar, null);
          }
        }
        isEating = false;
        eatingProgress = 0;
        eatingItem = null;
        renderInventorySlots();
      }
    }

    // Day/night cycle (20 minute cycle matching Minecraft)
    player.daytime = (player.daytime + dt / 1200) % 1.0;
    const sunAngle = player.daytime * Math.PI * 2;
    const sunHeight = Math.sin(sunAngle);
    const nightness = Math.max(0, -sunHeight);
    const dayness = Math.max(0, sunHeight);
    const skyR = Math.floor(0x33 * nightness + 0x87 * dayness);
    const skyG = Math.floor(0x44 * nightness + 0xce * dayness);
    const skyB = Math.floor(0x66 * nightness + 0xeb * dayness);
    const skyColor = (skyR << 16) | (skyG << 8) | skyB;
    scene.background = new Color(skyColor);
    scene.fog = new Fog(skyColor, 60, 120);
    sun.intensity = 0.3 + dayness * 1.1;
    sun.position.set(
      Math.cos(sunAngle) * 400,
      Math.sin(sunAngle) * 400,
      200,
    );

    // Stream chunks
    const [pcx, pcz] = worldToChunk(Math.floor(player.pos.x), Math.floor(player.pos.z));
    let needsRebuild = false;
    for (let dx = -renderDistance; dx <= renderDistance; dx++) {
      for (let dz = -renderDistance; dz <= renderDistance; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        if (!getChunk(cx, cz)) {
          getOrCreateChunk(cx, cz);
          needsRebuild = true;
        }
      }
    }
    if (needsRebuild) rebuildWorldMesh(scene);

    // Update tappables
    spawnTappablesAroundPlayer(player.pos.x, player.pos.z);
    updateTappableMeshes(scene, player.pos, performance.now());

    // Update mobs
    spawnMobsAroundPlayer(player.pos.x, player.pos.z, player.daytime);
    for (const [id, mob] of mobs) {
      updateMob(mob, dt, player.pos, difficulty);
      if (mob.health <= 0) {
        mobs.delete(id);
      }
    }
    updateMobMeshes(scene, player.pos);

    camera.position.copy(player.pos);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;

    // Block highlight
    const raycaster = new Raycaster();
    raycaster.far = 6;
    raycaster.setFromCamera(new Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(worldMeshes);
    if (player.isPointerLocked && intersects.length > 0) {
      const intersect = intersects[0];
      if (intersect.instanceId !== undefined) {
        const matrix = new Matrix4();
        (intersect.object as InstancedMesh).getMatrixAt(intersect.instanceId, matrix);
        const pos = new Vector3();
        pos.setFromMatrixPosition(matrix);
        blockHighlight.position.copy(pos);
        blockHighlight.visible = true;
      } else {
        blockHighlight.visible = false;
      }
    } else {
      blockHighlight.visible = false;
    }

    if (hudEl) {
      const hearts = Math.ceil(Math.max(0, Math.min(20, player.health)) / 2);
      const foodBars = Math.ceil(Math.max(0, Math.min(20, player.hunger)) / 2);
      const heartStr = Array.from({ length: 10 }, (_, i) => `<span class="${i < hearts ? 'full' : ''}" style="color:${i < hearts ? '#df3d37' : '#3a3a3a'}">&#9829;</span>`).join('');
      const foodStr = Array.from({ length: 10 }, (_, i) => `<span style="display:inline-block;width:10px;height:10px;border:2px solid #1b1b1b;border-radius:60% 45% 55% 45%;background:${i < foodBars ? '#bf6b32' : '#3a3a3a'};transform:rotate(-28deg) scale(.85);"></span>`).join('');
      const timeOfDay = player.daytime < 0.25 ? 'Night' : player.daytime < 0.5 ? 'Dawn' : player.daytime < 0.75 ? 'Day' : 'Dusk';
      const oxygenBubbles = player.oxygen < 300
        ? ` · ${Array.from({length: 10}, (_, i) => `<span style="color:${i < Math.ceil(player.oxygen / 30) ? '#55ccff' : '#3a3a3a'}">o</span>`).join('')}`
        : '';
      hudEl.innerHTML = `<span class="green">WASD Move · SPACE Jump · SHIFT Sprint · Mouse Look</span><br>
        <span class="white">X:${Math.floor(player.pos.x)} Y:${Math.floor(player.pos.y)} Z:${Math.floor(player.pos.z)}</span><br>
        <span class="white">Chunks: ${chunks.size} | ${timeOfDay}</span><br>
        <span style="font-size:14px">${heartStr} ${foodStr}${oxygenBubbles}</span>`;
    }
    
    // Update XP bar
    const xpFill = document.getElementById('xp-fill');
    const xpLevel = document.getElementById('xp-level');
    if (xpFill && xpLevel) {
      const xpForNextLevel = player.xpLevel * 10 + 10;
      const xpPercent = (player.xp / xpForNextLevel) * 100;
      xpFill.style.width = `${xpPercent}%`;
      xpLevel.textContent = player.xpLevel.toString();
    }
    renderer.render(scene, camera);
  };
  animate();

  window.render_game_to_text = (): string => JSON.stringify({
    coordinateSystem: 'voxel grid; +x east, +y up, +z south',
    mode: 'earth-world',
    playerPos: { x: Math.floor(player.pos.x), y: Math.floor(player.pos.y), z: Math.floor(player.pos.z) },
    health: player.health,
    hunger: player.hunger,
    oxygen: player.oxygen,
    xp: player.xp,
    xpLevel: player.xpLevel,
    selectedBlock: player.selectedBlock,
    chunksLoaded: chunks.size,
    totalBlocks: '5.49 quadrillion (Earth surface area)',
  });
  window.advanceTime = (ms: number): void => {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i++) {
      attackCooldown = Math.max(0, attackCooldown - 1 / 60);
      handSwing = Math.max(0, handSwing - (1 / 60) * 4.5);
      updatePlayer(player, 1 / 60, difficulty);
    }
    renderer.render(scene, camera);
  };

  return () => {
    cancelAnimationFrame(raf);
    canvas.removeEventListener('click', onPD);
    document.removeEventListener('pointerlockchange', onPLC);
    document.removeEventListener('mousemove', onMM);
    document.removeEventListener('keydown', onKD);
    document.removeEventListener('keyup', onKU);
    window.removeEventListener('resize', onResize);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('contextmenu', onContextMenu);
    window.removeEventListener('select-slot', onSelectSlot);
    scene.remove(blockHighlight);
    highlightGeo.dispose();
    edges.dispose();
    highlightMat.dispose();
    scene.traverse((o) => {
      const m = o as Mesh;
      if (m.geometry) m.geometry.dispose();
      const mt = m.material;
      if (mt) {
        if (Array.isArray(mt)) mt.forEach((x) => (x as MeshStandardMaterial).dispose());
        else (mt as MeshStandardMaterial).dispose();
      }
    });
    renderer.dispose();
    textureCache.forEach((texture) => texture.dispose());
    delete window.render_game_to_text;
    delete window.advanceTime;
  };
}

function getBlockName(blockId: number): string {
  const names: Record<number, string> = {
    [BLOCK.COBBLESTONE]: 'Cobblestone',
    [BLOCK.COAL_ORE]: 'Coal Ore',
    [BLOCK.IRON_ORE]: 'Iron Ore',
    [BLOCK.GOLD_ORE]: 'Gold Ore',
    [BLOCK.DIAMOND_ORE]: 'Diamond Ore',
    [BLOCK.LAPIS_ORE]: 'Lapis Ore',
    [BLOCK.REDSTONE_ORE]: 'Redstone Ore',
    [BLOCK.EMERALD_ORE]: 'Emerald Ore',
    [BLOCK.DIRT]: 'Dirt',
    [BLOCK.OAK_SAPLING]: 'Oak Sapling',
    [BLOCK.WHEAT]: 'Wheat',
    [BLOCK.CARROT]: 'Carrot',
    [BLOCK.DIAMOND]: 'Diamond',
    [BLOCK.IRON_INGOT]: 'Iron Ingot',
    [BLOCK.GOLD_INGOT]: 'Gold Ingot',
    [BLOCK.EMERALD]: 'Emerald',
    [BLOCK.BREAD]: 'Bread',
    [BLOCK.APPLE]: 'Apple',
    [BLOCK.BONE]: 'Bone',
    [BLOCK.STRING]: 'String',
    [BLOCK.ARROW]: 'Arrow',
    [BLOCK.GUNPOWDER]: 'Gunpowder',
    [BLOCK.CLAY]: 'Clay',
    [BLOCK.SAND]: 'Sand',
    [BLOCK.GRAVEL]: 'Gravel',
    [BLOCK.SUGARCANE]: 'Sugar Cane',
    [BLOCK.OAK_LOG]: 'Oak Log',
    [BLOCK.OAK_LEAVES]: 'Oak Leaves',
    [BLOCK.STICK]: 'Stick',
  };
  return names[blockId] ?? `Block ${blockId}`;
}

function showNotification(text: string): void {
  const hud = document.getElementById('hud');
  if (!hud) return;
  const notif = document.createElement('div');
  notif.textContent = text;
  notif.style.cssText = 'position:fixed;bottom:120px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:8px 16px;border-radius:4px;font-size:14px;z-index:1000;pointer-events:none;';
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2000);
}

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
    showDeathScreen?: () => void;
    hideDeathScreen?: () => void;
  }
}
