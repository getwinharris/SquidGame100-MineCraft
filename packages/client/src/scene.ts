/**
 * MineCraft — Real Earth World Engine (WebGL 2.0)
 *
 * 1 block = 1 square foot.
 * Earth surface area = 5.49 × 10^15 ft² (5.49 quadrillion blocks).
 * World generates from real Earth elevation/biome data.
 * Streaming: only chunks around player are loaded.
 * Renders with raw WebGL 2.0 — zero dependencies.
 */

import { BLOCK, getTextureUrl, getItemTextureFile, generateTappablesForChunk, rollTappableDrops, isTappableActive, getBlockProperties, getHarvestTime, getItemProperties, ITEM, Inventory, SLOT, findRecipe, findFurnaceSmeltingRecipes, MOB_PROPERTIES, tickFluid, getFlowDirection, createsCobblestone, createsObsidian, createsStone, isWater, isLava, createRng } from '@sg100/shared';
import type { Tappable, ToolType, MobType, GameMode } from '@sg100/shared';
import { placeAllLandmarks } from './landmarks.js';
// --- Raw WebGL 2.0 voxel renderer — zero dependencies (inlined) -----------

interface AtlasEntry {
  u: number; v: number;
  uw: number; vh: number;
}

interface Renderer {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  uMvp: WebGLUniformLocation;
  uTexture: WebGLUniformLocation;
  aPos: number;
  aUv: number;
  atlas: WebGLTexture;
  atlasEntries: Map<string, AtlasEntry>;
}

const ATLAS_TILE = 16;
const ATLAS_COLS = 16;

function buildTextureAtlas(gl: WebGL2RenderingContext): { atlas: WebGLTexture; entries: Map<string, AtlasEntry> } {
  const size = ATLAS_TILE * ATLAS_COLS;
  const entries = new Map<string, AtlasEntry>();
  let slotIndex = 0;

  for (let blockId = 1; blockId <= 600; blockId++) {
    const faces: ('all' | 'top' | 'bottom' | 'side' | 'front')[] = ['all', 'top', 'bottom', 'side', 'front'];
    for (const face of faces) {
      const url = getTextureUrl(blockId, face);
      if (!url || entries.has(url)) continue;
      const col = slotIndex % ATLAS_COLS;
      const row = Math.floor(slotIndex / ATLAS_COLS);
      if (row >= ATLAS_COLS) continue;
      entries.set(url, {
        u: col / ATLAS_COLS,
        v: row / ATLAS_COLS,
        uw: 1 / ATLAS_COLS,
        vh: 1 / ATLAS_COLS,
      });
      slotIndex++;
    }
  }

  entries.set('__missing__', { u: (ATLAS_COLS - 1) / ATLAS_COLS, v: (ATLAS_COLS - 1) / ATLAS_COLS, uw: 1 / ATLAS_COLS, vh: 1 / ATLAS_COLS });

  // Canvas for the atlas — fill with magenta/black checkerboard (missing texture pattern)
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      ctx.fillStyle = ((px >> 3) + (py >> 3)) % 2 === 0 ? '#ff00ff' : '#000000';
      ctx.fillRect(px, py, 1, 1);
    }
  }

  // Upload placeholder atlas synchronously
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Load real textures asynchronously and patch into atlas
  const colRowFromEntry = (entry: AtlasEntry): [number, number] => [
    Math.round(entry.u * ATLAS_COLS),
    Math.round(entry.v * ATLAS_COLS),
  ];
  for (const [url, entry] of entries) {
    if (url === '__missing__') continue;
    const img = new Image();
    const [col, row] = colRowFromEntry(entry);
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, col * ATLAS_TILE, row * ATLAS_TILE, ATLAS_TILE, ATLAS_TILE, gl.RGBA, gl.UNSIGNED_BYTE, img);
    };
    img.src = '/textures/blocks/' + url;
  }

  return { atlas: texture, entries };
}

function getAtlasEntry(atlas: Map<string, AtlasEntry>, blockId: number, face: number): AtlasEntry {
  const faceNames: ('all' | 'top' | 'bottom' | 'side' | 'front')[] = ['all', 'top', 'bottom', 'side', 'front'];
  const fallbackFaces: ('side' | 'top' | 'bottom' | 'front')[] = ['side', 'top', 'bottom', 'front'];
  const name = faceNames[face] || 'all';
  const url = getTextureUrl(blockId, name) || getTextureUrl(blockId, 'all');
  if (url) {
    const entry = atlas.get(url);
    if (entry) return entry;
  }
  // Try fallback
  for (const f of fallbackFaces) {
    const u = getTextureUrl(blockId, f);
    if (u) {
      const entry = atlas.get(u);
      if (entry) return entry;
    }
  }
  return atlas.get('__missing__')!;
}

function initRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!gl) { console.error('WebGL 2.0 not supported'); return null; }

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  const vs = compileShader(gl, gl.VERTEX_SHADER, `#version 300 es
in vec3 aPos;
in vec2 aUv;
uniform mat4 uMvp;
out vec2 vUv;
void main() {
  vUv = aUv;
  gl_Position = uMvp * vec4(aPos, 1.0);
}`);

  const fs = compileShader(gl, gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTexture;
out vec4 fragColor;
void main() {
  vec4 tex = texture(uTexture, vUv);
  if (tex.a < 0.5) discard;
  fragColor = tex;
}`);

  if (!vs || !fs) return null;
  const program = linkProgram(gl, vs, fs);
  if (!program) return null;

  gl.useProgram(program);
  const uMvp = gl.getUniformLocation(program, 'uMvp')!;
  const uTexture = gl.getUniformLocation(program, 'uTexture')!;
  const aPos = gl.getAttribLocation(program, 'aPos');
  const aUv = gl.getAttribLocation(program, 'aUv');

  gl.uniform1i(uTexture, 0);

  const atlasData = buildTextureAtlas(gl);

  return { gl, program, uMvp, uTexture, aPos, aUv, atlas: atlasData.atlas, atlasEntries: atlasData.entries };
}

function resizeRenderer(r: Renderer, w: number, h: number): void {
  r.gl.viewport(0, 0, w, h);
}

function createPerspective(fovY: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fovY / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect; m[5] = f;
  m[10] = (far + near) / (near - far); m[11] = -1;
  m[14] = 2 * far * near / (near - far);
  return m;
}

function lookAt(eyeX: number, eyeY: number, eyeZ: number, cx: number, cy: number, cz: number, upX: number, upY: number, upZ: number): Float32Array {
  let zx = eyeX - cx, zy = eyeY - cy, zz = eyeZ - cz;
  const zl = Math.sqrt(zx*zx + zy*zy + zz*zz);
  zx /= zl; zy /= zl; zz /= zl;
  let xx = upY * zz - upZ * zy, xy = upZ * zx - upX * zz, xz = upX * zy - upY * zx;
  const xl = Math.sqrt(xx*xx + xy*xy + xz*xz);
  xx /= xl; xy /= xl; xz /= xl;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  const m = new Float32Array(16);
  m[0] = xx; m[4] = xy; m[8] = xz; m[12] = -(xx*eyeX + xy*eyeY + xz*eyeZ);
  m[1] = yx; m[5] = yy; m[9] = yz; m[13] = -(yx*eyeX + yy*eyeY + yz*eyeZ);
  m[2] = zx; m[6] = zy; m[10] = zz; m[14] = -(zx*eyeX + zy*eyeY + zz*eyeZ);
  m[15] = 1;
  return m;
}

function mulMat4(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[i + k*4] * b[k + j*4];
      out[i + j*4] = sum;
    }
  return out;
}

const FACE_VERTS: [number,number,number, number,number,number, number,number,number, number,number,number][] = [
  [1,0,0, 1,1,0, 1,1,1, 1,0,1],
  [0,0,1, 0,1,1, 0,1,0, 0,0,0],
  [0,1,1, 1,1,1, 1,1,0, 0,1,0],
  [1,0,1, 0,0,1, 0,0,0, 1,0,0],
  [1,0,1, 1,1,1, 0,1,1, 0,0,1],
  [0,0,0, 0,1,0, 1,1,0, 1,0,0],
];

interface ChunkMesh {
  vao: WebGLVertexArrayObject;
  indexCount: number;
}

function buildChunkMesh(r: Renderer, blocks: Uint16Array, cx: number, cz: number, getBlock: (x: number, y: number, z: number) => number, isSolid: (id: number) => boolean): ChunkMesh | null {
  const gl = r.gl;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const w = 16, h = 256, d = 16;
  let idx = 0;

  for (let lx = 0; lx < w; lx++)
    for (let ly = 1; ly < h; ly++)
      for (let lz = 0; lz < d; lz++) {
        const blockId = blocks[ly * w * d + lz * w + lx];
        if (blockId === 0) continue;

        const wx = cx * w + lx, wz = cz * d + lz;
        const faces = [
          getBlock(wx + 1, ly, wz),
          getBlock(wx - 1, ly, wz),
          getBlock(wx, ly + 1, wz),
          getBlock(wx, ly - 1, wz),
          getBlock(wx, ly, wz + 1),
          getBlock(wx, ly, wz - 1),
        ];

        for (let f = 0; f < 6; f++) {
          if (faces[f] !== 0 && isSolid(faces[f])) continue;
          const verts = FACE_VERTS[f];
          const entry = getAtlasEntry(r.atlasEntries, blockId, f);
          const u0 = entry.u, v0 = entry.v, uw = entry.uw, vh = entry.vh;
          const base = idx * 4;
          positions.push(lx + verts[0], ly + verts[1], lz + verts[2]);
          uvs.push(u0, v0);
          positions.push(lx + verts[3], ly + verts[4], lz + verts[5]);
          uvs.push(u0 + uw, v0);
          positions.push(lx + verts[6], ly + verts[7], lz + verts[8]);
          uvs.push(u0 + uw, v0 + vh);
          positions.push(lx + verts[9], ly + verts[10], lz + verts[11]);
          uvs.push(u0, v0 + vh);
          indices.push(base, base+1, base+2, base, base+2, base+3);
          idx++;
        }
      }

  if (idx === 0) return null;

  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  const posBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(r.aPos);
  gl.vertexAttribPointer(r.aPos, 3, gl.FLOAT, false, 0, 0);

  const uvBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(r.aUv);
  gl.vertexAttribPointer(r.aUv, 2, gl.FLOAT, false, 0, 0);

  const idxBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  gl.bindVertexArray(null);
  return { vao, indexCount: indices.length };
}

function renderChunkMesh(r: Renderer, mesh: ChunkMesh, mvp: Float32Array): void {
  const gl = r.gl;
  gl.uniformMatrix4fv(r.uMvp, false, mvp);
  gl.bindVertexArray(mesh.vao);
  gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
  gl.bindVertexArray(null);
}

function deleteChunkMesh(r: Renderer, mesh: ChunkMesh): void {
  const gl = r.gl;
  gl.deleteVertexArray(mesh.vao);
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function linkProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

// --- Vec3 (native replacement for THREE.Vector3) --------------------------
interface Vec3 { x: number; y: number; z: number; }

function v3(x = 0, y = 0, z = 0): Vec3 { return { x, y, z }; }
function v3dist(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
function v3len(a: Vec3): number { return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z); }
function v3scale(a: Vec3, s: number): Vec3 { return v3(a.x * s, a.y * s, a.z * s); }
function v3sub(a: Vec3, b: Vec3): Vec3 { return v3(a.x - b.x, a.y - b.y, a.z - b.z); }
function v3dot(a: Vec3, b: Vec3): number { return a.x * b.x + a.y * b.y + a.z * b.z; }
function v3set(a: Vec3, x: number, y: number, z: number): Vec3 { a.x = x; a.y = y; a.z = z; return a; }

// --- Constants ---------------------------------------------------------------
const W = {
  CHUNK_W: 16,
  CHUNK_H: 256,
  CHUNK_D: 16,
  RENDER_DISTANCE: 8,
  SEA_LEVEL: 64,
  GROUND_LEVEL: 62,
};

type BlockId = (typeof BLOCK)[keyof typeof BLOCK];

// --- World Storage -----------------------------------------------------------
interface Chunk {
  cx: number;
  cz: number;
  blocks: Uint16Array;
  dirty: boolean;
  mesh?: ChunkMesh;
}

const chunks = new Map<string, Chunk>();

let renderer: Renderer | null = null;
let overlayCanvas: HTMLCanvasElement | null = null;
let overlayCtx: CanvasRenderingContext2D | null = null;

function chunkKey(cx: number, cz: number): string {
  return cx + ',' + cz;
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
  if (lx === 0) markChunkDirty(cx - 1, cz);
  if (lx === W.CHUNK_W - 1) markChunkDirty(cx + 1, cz);
  if (lz === 0) markChunkDirty(cx, cz - 1);
  if (lz === W.CHUNK_D - 1) markChunkDirty(cx, cz + 1);
}

function markChunkDirty(cx: number, cz: number): void {
  const chunk = getChunk(cx, cz);
  if (chunk) chunk.dirty = true;
}

export function rebuildWorldMesh(): void {
  // Rebuild WebGL meshes for dirty chunks
  if (!renderer) return;
  for (const [, chunk] of chunks) {
    if (chunk.dirty) {
      if (chunk.mesh) { deleteChunkMesh(renderer, chunk.mesh); chunk.mesh = undefined; }
      const mesh = buildChunkMesh(renderer, chunk.blocks, chunk.cx, chunk.cz, getBlock, isSolid);
      if (mesh) chunk.mesh = mesh;
      chunk.dirty = false;
    }
  }
}

// --- Terrain Generation (Earth-like) ----------------------------------------
function hash(x: number, z: number): number {
  return createRng(x * 374761393 + z * 668265263).next();
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
  if (h < 0.45) return Math.floor(h * 100);
  if (h < 0.55) return W.SEA_LEVEL;
  if (h < 0.8) return Math.floor(W.SEA_LEVEL + (h - 0.55) * 200);
  return Math.floor(W.SEA_LEVEL + 50 + (h - 0.8) * 400);
}

function getTemperature(wx: number, wz: number): number {
  const lat = Math.abs(wz) / 10000;
  const base = 1 - Math.min(lat, 1);
  const noise = fractalNoise(wx + 30000, wz + 30000, 2, 1024) * 0.3;
  return Math.max(0, Math.min(1, base + noise));
}

function getMoisture(wx: number, wz: number): number {
  return fractalNoise(wx + 40000, wz + 40000, 3, 768);
}

function getBiome(_wx: number, _wz: number, elevation: number, temp: number, moist: number): BlockId {
  if (elevation < W.SEA_LEVEL - 10) return BLOCK.STONE;
  if (elevation < W.SEA_LEVEL) return BLOCK.SAND;
  if (elevation === W.SEA_LEVEL) return BLOCK.SAND;
  if (elevation > 140) return BLOCK.SNOW;
  if (temp > 0.7 && moist < 0.3) return BLOCK.SAND;
  if (temp < 0.2) return BLOCK.SNOW;
  if (moist > 0.6 && temp > 0.4) return BLOCK.GRASS;
  if (moist > 0.5) return BLOCK.GRASS;
  if (elevation > 100) return BLOCK.STONE;
  return BLOCK.GRASS;
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

      if (surface === BLOCK.OAK_LEAVES || surface === BLOCK.OAK_PLANKS) {
        const treeHash = hash(wx * 13, wz * 17);
        if (treeHash > 0.92) {
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

  for (let y = groundY; y < groundY + trunkHeight && y < W.CHUNK_H; y++) {
    if (lx >= 0 && lx < W.CHUNK_W && lz >= 0 && lz < W.CHUNK_D) {
      chunk.blocks[localIndex(lx, y, lz)] = logType;
    }
  }

  const leafRadius = 2;
  const leafStart = groundY + trunkHeight - 2;
  const leafEnd = groundY + trunkHeight + 1;

  for (let dy = leafStart; dy <= leafEnd; dy++) {
    const radius = dy === leafEnd ? 1 : leafRadius;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (dx === 0 && dz === 0 && dy < groundY + trunkHeight) continue;
        if (Math.abs(dx) === radius && Math.abs(dz) === radius && hash(dx + lx, dz + lz) > 0.5) continue;

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

// --- Tappables (Minecraft Earth-style resource nodes) -----------------------
const tappables = new Map<string, Tappable>();
const TAPPABLE_CHECK_RADIUS = 8;

function spawnTappablesAroundPlayer(px: number, pz: number): void {
  const [pcx, pcz] = worldToChunk(px, pz);
  for (let dx = -TAPPABLE_CHECK_RADIUS; dx <= TAPPABLE_CHECK_RADIUS; dx++) {
    for (let dz = -TAPPABLE_CHECK_RADIUS; dz <= TAPPABLE_CHECK_RADIUS; dz++) {
      const cx = pcx + dx;
      const cz = pcz + dz;
      const key = cx + ',' + cz;
      if (tappables.has(key)) continue;

      const newTappables = generateTappablesForChunk(cx, cz, W.CHUNK_W, W.CHUNK_D);
      for (const t of newTappables) {
        t.y = getElevation(t.x, t.z) + 1;
        tappables.set(t.id, t);
      }
    }
  }
}

function collectTappable(tappableId: string): { itemId: number; count: number }[] {
  const t = tappables.get(tappableId);
  if (!t) return [];
  t.collectedAt = Date.now();
  return rollTappableDrops(t.type).map(d => ({ itemId: d.itemId, count: d.count }));
}


// --- Mobs (Minecraft Java Edition) ------------------------------------------
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
  pos: Vec3;
  vel: Vec3;
  health: number;
  maxHealth: number;
  yaw: number;
  onGround: boolean;
  aiState: 'idle' | 'wander' | 'flee' | 'chase' | 'attack';
  aiTimer: number;
  lastAttackedAt: number;
}

const mobs = new Map<string, Mob>();
const MOB_CHECK_RADIUS = 6;
const MOB_DESPAWN_DISTANCE = 128;
let mobIdCounter = 0;


function spawnMob(type: MobType, x: number, y: number, z: number): Mob {
  const props = MOB_PROPERTIES[type];
  if (!props) throw new Error('Unknown mob type: ' + type);
  const id = 'mob-' + (mobIdCounter++);
  const mob: Mob = {
    id,
    type,
    pos: v3(x, y + 0.5, z),
    vel: v3(0, 0, 0),
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
  const isDay = daytime < 0.5;
  const maxMobs = 20;

  if (mobs.size >= maxMobs) return;

  for (let dx = -MOB_CHECK_RADIUS; dx <= MOB_CHECK_RADIUS; dx++) {
    for (let dz = -MOB_CHECK_RADIUS; dz <= MOB_CHECK_RADIUS; dz++) {
      if (mobs.size >= maxMobs) return;
      const cx = pcx + dx;
      const cz = pcz + dz;
      const seed = cx * 73856093 ^ cz * 19349663;
      const prng = mulberry32(seed);
      const roll = prng();

      let type: MobType;
      if (isDay) {
        if (roll < 0.25) type = 'cow';
        else if (roll < 0.45) type = 'pig';
        else if (roll < 0.65) type = 'sheep';
        else if (roll < 0.8) type = 'chicken';
        else if (roll < 0.85) type = 'rabbit';
        else if (roll < 0.88) type = 'muddy_pig';
        else if (roll < 0.91) type = 'dyed_cat';
        else if (roll < 0.94) type = 'moobloom';
        else continue;
      } else {
        if (roll < 0.3) type = 'zombie';
        else if (roll < 0.55) type = 'skeleton';
        else if (roll < 0.75) type = 'creeper';
        else if (roll < 0.85) type = 'spider';
        else if (roll < 0.9) type = 'drowned';
        else if (roll < 0.95) type = 'husk';
        else type = 'stray';
      }

      const wx = cx * W.CHUNK_W + Math.floor(prng() * W.CHUNK_D);
      const wz = cz * W.CHUNK_D + Math.floor(prng() * W.CHUNK_D);
      const groundY = getElevation(wx, wz);

      const blockAtFeet = getBlock(wx, groundY, wz);
      if (blockAtFeet === BLOCK.WATER || blockAtFeet === BLOCK.LAVA) continue;
      if (groundY > W.SEA_LEVEL + 80) continue;

      const dist = Math.sqrt((wx - px) ** 2 + (wz - pz) ** 2);
      if (dist < 24 || dist > 96) continue;

      spawnMob(type, wx, groundY, wz);
    }
  }
}

function updateMob(mob: Mob, dt: number, playerPos: Vec3, difficulty: string): void {
  const props = MOB_PROPERTIES[mob.type];
  if (!props) return;

  const distToPlayer = v3dist(mob.pos, playerPos);

  const diffMult = difficulty === 'Hard' ? 1.3 : difficulty === 'Easy' ? 0.8 : 1.0;
  if (difficulty === 'Peaceful' && props.hostile) {
    mob.health = 0;
    return;
  }

  mob.aiTimer -= dt;
  if (mob.aiTimer <= 0) {
    mob.aiTimer = 1 + Math.random() * 4;

    if (props.hostile && distToPlayer < props.followRange) {
      mob.aiState = 'chase';
    } else if (props.category === 'passive' && distToPlayer < 10) {
      mob.aiState = 'flee';
    } else {
      mob.aiState = Math.random() < 0.7 ? 'wander' : 'idle';
    }
  }

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
      const dx = mob.pos.x - playerPos.x;
      const dz = mob.pos.z - playerPos.z;
      mob.yaw = Math.atan2(-dx, -dz);
      mob.vel.x = -Math.sin(mob.yaw) * speed;
      mob.vel.z = -Math.cos(mob.yaw) * speed;
      break;
    }
    case 'chase': {
      const dx = playerPos.x - mob.pos.x;
      const dz = playerPos.z - mob.pos.z;
      mob.yaw = Math.atan2(-dx, -dz);
      mob.vel.x = -Math.sin(mob.yaw) * speed;
      mob.vel.z = -Math.cos(mob.yaw) * speed;

      if (distToPlayer < props.attackRange) {
        mob.aiState = 'attack';
        mob.aiTimer = 0.5;
      }
      break;
    }
    case 'attack': {
      if (distToPlayer < props.attackRange + 1) {
        mob.aiTimer = 1.0;
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

  mob.vel.y += GRAVITY_SEC * dt;
  mob.vel.y = Math.max(mob.vel.y, TERMINAL_VEL_SEC);

  mob.pos.x += mob.vel.x * dt;
  mob.pos.z += mob.vel.z * dt;
  mob.pos.y += mob.vel.y * dt;

  const groundY = getElevation(Math.floor(mob.pos.x), Math.floor(mob.pos.z));
  if (mob.pos.y <= groundY + 1) {
    mob.pos.y = groundY + 1;
    mob.vel.y = 0;
    mob.onGround = true;
  } else {
    mob.onGround = false;
  }

  if (distToPlayer > MOB_DESPAWN_DISTANCE) {
    mob.health = 0;
  }
}

// --- Player -----------------------------------------------------------------
interface PlayerState {
  pos: Vec3;
  vel: Vec3;
  yaw: number;
  pitch: number;
  onGround: boolean;
  keys: Set<string>;
  isPointerLocked: boolean;
  health: number;
  hunger: number;
  saturation: number;
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
  _regenTimer: number;
  _starvationTimer: number;
}

function initPlayer(): PlayerState {
  return {
    pos: v3(0, 100, 0),
    vel: v3(0, 0, 0),
    yaw: 0,
    pitch: 0,
    onGround: false,
    keys: new Set(),
    isPointerLocked: false,
    health: 20,
    hunger: 20,
    saturation: 5,
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
    _regenTimer: 0,
    _starvationTimer: 0,
  };
}

// wiki-source: https://minecraft.wiki/w/Transportation#Vertical_transportation
// Per-tick (50ms) gravity: -0.08 blocks/tick, air friction: ×0.98
// wiki-source: https://minecraft.wiki/w/Player
// Player hitbox: 1.8 blocks tall, 0.6 blocks wide; eye level: 1.62m
// wiki-source: https://minecraft.wiki/w/Transportation#Movement_speed
// Terminal velocity: 3.92 blocks/tick = 78.4 m/s
const TICK_MS = 50;
const TICK_S = 0.05;
// Gravity per tick, converted to per-second for non-tick-based systems
const GRAVITY_SEC = -32;
const TERMINAL_VEL_SEC = -78.4;
// wiki-source: https://minecraft.wiki/w/Transportation#Movement_speed
// Walking speed: 4.317 m/s, Sprint: 5.612 m/s (130% of walk)
// Sneak: 1.295 m/s (30% of walk), Flying: 10.79 m/s
const WALK_SPEED = 4.317;
const SPRINT_MULT = 1.3;
const FLY_SPEED = 10.79;
const EYE_H = 1.62;
const HALF_W = 0.3;

function solid(id: number): boolean {
  return id !== BLOCK.AIR && id !== BLOCK.WATER && id !== BLOCK.LAVA;
}

function aabb(x: number, y: number, z: number): boolean {
  return (
    ([
      [-HALF_W, 0, -HALF_W], [HALF_W, 0, -HALF_W], [-HALF_W, 0, HALF_W], [HALF_W, 0, HALF_W],
      [-HALF_W, 1, -HALF_W], [HALF_W, 1, -HALF_W], [-HALF_W, 1, HALF_W], [HALF_W, 1, HALF_W],
    ] as [number, number, number][])
    .some(([dx, dy, dz]) => solid(getBlock(Math.floor(x + dx), Math.floor(y + dy), Math.floor(z + dz))))
  );
}

// wiki-source: https://minecraft.wiki/w/Damage#Fall_damage
// Formula: damage = max(0, floor((fall_distance - safe_fall_distance) × multiplier))
// Player: safe_fall_distance = 3 blocks, fall_damage_multiplier = 1
function calcFallDamage(fallDist: number): number {
  return Math.max(0, Math.floor((fallDist - 3) * 1));
}

// wiki-source: https://minecraft.wiki/w/Transportation#Vertical_transportation
// Jump initial velocity: v(1) = 0.42 blocks/tick (without Jump Boost)
const JUMP_INITIAL = 0.42;

function tickPlayer(p: PlayerState, difficulty: string): void {
  const wasOnGround = p.onGround;
  const inWater = getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y), Math.floor(p.pos.z)) === BLOCK.WATER;
  const inLava = getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y), Math.floor(p.pos.z)) === BLOCK.LAVA;
  const isSprinting = p.keys.has('ShiftLeft');
  p.sprinting = isSprinting;

  // --- Horizontal movement ---
  const fw = { x: -Math.sin(p.yaw), z: -Math.cos(p.yaw) };
  const rt = { x: Math.cos(p.yaw), z: -Math.sin(p.yaw) };
  let mx = 0, mz = 0;
  if (p.keys.has('KeyW') || p.keys.has('ArrowUp')) { mx += fw.x; mz += fw.z; }
  if (p.keys.has('KeyS') || p.keys.has('ArrowDown')) { mx -= fw.x; mz -= fw.z; }
  if (p.keys.has('KeyA') || p.keys.has('ArrowLeft')) { mx -= rt.x; mz -= rt.z; }
  if (p.keys.has('KeyD') || p.keys.has('ArrowRight')) { mx += rt.x; mz += rt.z; }
  p.moving = Math.sqrt(mx * mx + mz * mz) > 0.01;

  if (p.gameMode !== 'creative' || !p.flying) {
    // wiki-source: https://minecraft.wiki/w/Transportation#Movement_speed
    // Base acceleration: 0.098 blocks/tick, friction 0.546 (most blocks)
    // Simplified: apply target speed directly (matches terminal speed a/(1-r) = 4.317)
    const targetSpeed = isSprinting ? WALK_SPEED * SPRINT_MULT : WALK_SPEED;
    const waterMult = inWater ? 0.5 : 1.0;
    const lavaMult = inLava ? 0.5 : 1.0;
    const mult = waterMult * lavaMult;
    if (p.moving) {
      const len = Math.sqrt(mx * mx + mz * mz);
      const ts = targetSpeed * mult * TICK_S; // blocks per tick
      p.vel.x += (mx / len * ts - p.vel.x) * 0.2;
      p.vel.z += (mz / len * ts - p.vel.z) * 0.2;
    } else {
      p.vel.x *= 0.8;
      p.vel.z *= 0.8;
      if (Math.abs(p.vel.x) < 0.001) p.vel.x = 0;
      if (Math.abs(p.vel.z) < 0.001) p.vel.z = 0;
    }
  }

  // --- Vertical movement ---
  const spaceDown = p.keys.has('Space');
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
      if (spaceDown) p.vel.y = FLY_SPEED * TICK_S;
      else if (shiftDown) p.vel.y = -FLY_SPEED * TICK_S;
      p.fallDistance = 0;
      p.onGround = false;
    }
  }

  if (!(p.gameMode === 'creative' && p.flying)) {
    // wiki-source: https://minecraft.wiki/w/Jumping#Jump_height
    // Jump initial velocity: 0.42 blocks/tick, height: 1.2522 blocks
    if (spaceDown && p.onGround) {
      const jumpVel = inWater ? JUMP_INITIAL * 0.6 : JUMP_INITIAL;
      p.vel.y = jumpVel;
      p.onGround = false;
      if (p.gameMode === 'survival') {
        // wiki-source: https://minecraft.wiki/w/Jumping#Sprint-jumping
        // Exhaustion per jump: 0.05, per sprint-jump: 0.2
        // wiki-source: https://minecraft.wiki/w/Hunger#Mechanics
        const exhaustion = isSprinting ? 0.2 : 0.05;
        if (p.saturation >= exhaustion) {
          p.saturation -= exhaustion;
        } else {
          const remaining = exhaustion - p.saturation;
          p.saturation = 0;
          p.hunger = Math.max(0, p.hunger - remaining);
        }
        p.saturation = Math.min(p.saturation, p.hunger);
      }
    }

    // wiki-source: https://minecraft.wiki/w/Transportation#Vertical_transportation
    // Per-tick: v(t) = 0.98 × (v(t-1) - 0.08)
    p.vel.y = (p.vel.y - 0.08) * 0.98;

    // wiki-source: https://minecraft.wiki/w/Transportation#Movement_speed
    // Terminal velocity: 3.92 blocks/tick = 78.4 m/s
    if (p.vel.y < -3.92) p.vel.y = -3.92;
  }

  // --- Water drag ---
  if (inWater) {
    // wiki-source: https://minecraft.wiki/w/Transportation#Movement_speed
    // Water drag: velocity damped each tick
    p.vel.x *= 0.8;
    p.vel.z *= 0.8;
    p.vel.y *= 0.8;
    p.fallDistance = 0;
  }

  // --- Collision & position update ---
  p.pos.x += p.vel.x;
  if (aabb(p.pos.x, p.pos.y, p.pos.z)) { p.pos.x -= p.vel.x; p.vel.x = 0; }
  p.pos.z += p.vel.z;
  if (aabb(p.pos.x, p.pos.y, p.pos.z)) { p.pos.z -= p.vel.z; p.vel.z = 0; }
  p.pos.y += p.vel.y;
  if (aabb(p.pos.x, p.pos.y, p.pos.z)) {
    if (p.vel.y < 0) p.onGround = true;
    p.pos.y -= p.vel.y;
    p.vel.y = 0;
  } else {
    p.onGround = false;
  }

  // --- Fall distance tracking ---
  if (p.gameMode === 'creative') {
    p.fallDistance = 0;
  } else if (p.vel.y < 0 && !p.onGround) {
    // wiki-source: fall distance tracked in blocks (not time)
    p.fallDistance -= p.vel.y;
  }

  // --- Fall damage ---
  if (wasOnGround === false && p.onGround && p.fallDistance > 0) {
    const wetLanding = inWater || getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y), Math.floor(p.pos.z)) === BLOCK.WATER;
    if (!wetLanding) {
      const damage = calcFallDamage(p.fallDistance);
      // wiki-source: https://minecraft.wiki/w/Damage#Fall_damage
      // A fall of ≥23.5 blocks kills a player at 20HP (the game checks ground before updating fall distance)
      if (damage > 0) {
        p.health = Math.max(0, p.health - damage);
      }
    }
    p.fallDistance = 0;
  }

  // --- Hunger depletion (survival only) ---
  // wiki-source: https://minecraft.wiki/w/Hunger#Mechanics
  // Exhaustion per action: sprint-jump 0.2, jump 0.05, sprint 0.01/block
  if (p.gameMode === 'survival') {
    const passiveExhaustion = 0.0; // walking/sneaking costs 0 hunger since 1.11
    const sprintExhaustion = (p.sprinting && p.moving) ? 0.01 : 0;
    const exhaustion = passiveExhaustion + sprintExhaustion;
    if (exhaustion > 0) {
      if (p.saturation >= exhaustion) {
        p.saturation -= exhaustion;
      } else {
        const remaining = exhaustion - p.saturation;
        p.saturation = 0;
        p.hunger = Math.max(0, p.hunger - remaining);
      }
      p.saturation = Math.min(p.saturation, p.hunger);
    }
  }

  // --- Health regeneration ---
  // wiki-source: https://minecraft.wiki/w/Player#Health_and_hunger_meters
  // Health regenerates by 1HP every 4 seconds when hunger ≥ 18 (no regen below 18)
  if (p.gameMode === 'survival' && p.health > 0 && p.health < 20) {
    if (p.hunger >= 18) {
      p._regenTimer += TICK_MS;
      while (p._regenTimer >= 4000 && p.health < 20 && p.hunger >= 18) {
        p.health = Math.min(20, p.health + 1);
        p.hunger = Math.max(0, p.hunger - 1);
        p._regenTimer -= 4000;
      }
    }
  }

  // Peaceful difficulty auto-regen
  if (difficulty === 'Peaceful' && p.health < 20 && p.health > 0) {
    p.health = Math.min(20, p.health + 0.5 / TICK_S * TICK_MS / 1000);
  }

  // --- Starvation ---
  // wiki-source: https://minecraft.wiki/w/Damage#Starvation
  // Starvation deals 1HP damage per second when hunger = 0
  if (p.gameMode === 'survival' && p.hunger <= 0) {
    p._starvationTimer += TICK_MS;
    while (p._starvationTimer >= 1000 && p.health > 0) {
      p.health = Math.max(0, p.health - 1);
      p._starvationTimer -= 1000;
    }
  }

  // --- Void death ---
  if (p.pos.y < -10) { p.pos.y = 100; v3set(p.vel, 0, 0, 0); }

  // --- Water flow ---
  const feetBlock = getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y), Math.floor(p.pos.z));
  if (feetBlock === BLOCK.WATER) {
    const flow = getFlowDirection(getBlock, Math.floor(p.pos.x), Math.floor(p.pos.y), Math.floor(p.pos.z));
    if (flow) {
      p.vel.x += flow.dx * 0.014;
      p.vel.z += flow.dz * 0.014;
      if (flow.dy < 0) p.vel.y -= 0.02;
    }
  }

  // --- Oxygen ---
  // wiki-source: https://minecraft.wiki/w/Player#Health_and_hunger_meters
  // Player has 300 ticks (15 seconds) of air; depletes at 1/tick when head in water
  const headInWater = getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y + EYE_H), Math.floor(p.pos.z)) === BLOCK.WATER;
  if (p.gameMode === 'creative') {
    p.oxygen = 300;
  } else if (headInWater) {
    p.oxygen = Math.max(0, p.oxygen - 1);
    if (p.oxygen <= 0 && difficulty !== 'Peaceful') {
      // wiki-source: Drowning damage: 1HP per tick when oxygen reaches 0
      p.health = Math.max(0, p.health - 1);
    }
  } else {
    p.oxygen = Math.min(300, p.oxygen + 1);
  }

  if (p.health <= 0 && !p.isDead) {
    p.isDead = true;
    window.showDeathScreen?.();
  }
}

// --- Sound Effects -----------------------------------------------------------
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

// --- Mining System -----------------------------------------------------------
interface MiningState {
  targetX: number;
  targetY: number;
  targetZ: number;
  progress: number;
  total: number;
  blockId: number;
  active: boolean;
}

interface BlockHit {
  x: number;
  y: number;
  z: number;
  normal: Vec3;
  blockId: number;
}

function rayMarch(origin: Vec3, yaw: number, pitch: number, maxDist: number): BlockHit | null {
  const dir = v3(
    -Math.sin(yaw) * Math.cos(pitch),
    -Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch),
  );

  let x = origin.x;
  let y = origin.y;
  let z = origin.z;

  const stepX = dir.x >= 0 ? 1 : -1;
  const stepY = dir.y >= 0 ? 1 : -1;
  const stepZ = dir.z >= 0 ? 1 : -1;

  const tDeltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
  const tDeltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
  const tDeltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;

  let mapX = Math.floor(x);
  let mapY = Math.floor(y);
  let mapZ = Math.floor(z);

  let tMaxX = dir.x !== 0 ? ((dir.x > 0 ? (mapX + 1 - x) : (x - mapX)) / dir.x) : Infinity;
  let tMaxY = dir.y !== 0 ? ((dir.y > 0 ? (mapY + 1 - y) : (y - mapY)) / dir.y) : Infinity;
  let tMaxZ = dir.z !== 0 ? ((dir.z > 0 ? (mapZ + 1 - z) : (z - mapZ)) / dir.z) : Infinity;

  for (let i = 0; i < maxDist * 4; i++) {
    let normal: Vec3;
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      if (tMaxX > maxDist) return null;
      mapX += stepX;
      tMaxX += tDeltaX;
      normal = v3(-stepX, 0, 0);
    } else if (tMaxY < tMaxZ) {
      if (tMaxY > maxDist) return null;
      mapY += stepY;
      tMaxY += tDeltaY;
      normal = v3(0, -stepY, 0);
    } else {
      if (tMaxZ > maxDist) return null;
      mapZ += stepZ;
      tMaxZ += tDeltaZ;
      normal = v3(0, 0, -stepZ);
    }

    const blockId = getBlock(mapX, mapY, mapZ);
    if (blockId !== BLOCK.AIR) {
      return { x: mapX, y: mapY, z: mapZ, normal, blockId };
    }
  }
  return null;
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

// --- WebGL 3D Renderer + Canvas 2D HUD ------------------------------------

function isSolid(id: number): boolean {
  return id !== BLOCK.AIR && id !== BLOCK.WATER;
}


function renderFrameWebGL(canvas: HTMLCanvasElement, player: PlayerState): void {
  if (!renderer) return;
  const gl = renderer.gl;
  const W = canvas.width, H = canvas.height;
  if (W === 0 || H === 0) return;

  const skyCol = interpolateSkyColor(player.daytime);
  const skyR = ((skyCol >> 16) & 0xff) / 255;
  const skyG = ((skyCol >> 8) & 0xff) / 255;
  const skyB = (skyCol & 0xff) / 255;
  gl.clearColor(skyR, skyG, skyB, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const proj = createPerspective(1.2, W / H, 0.1, 512);
  const eyeX = player.pos.x;
  const eyeY = player.pos.y + EYE_H;
  const eyeZ = player.pos.z;
  const yaw = player.yaw;
  const pitch = player.pitch;
  const cx = eyeX + Math.sin(yaw) * Math.cos(pitch);
  const cy = eyeY + Math.sin(pitch);
  const cz = eyeZ + Math.cos(yaw) * Math.cos(pitch);
  const view = lookAt(eyeX, eyeY, eyeZ, cx, cy, cz, 0, 1, 0);
  const mvp = mulMat4(proj, view);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, renderer.atlas);

  for (const [, chunk] of chunks) {
    if (chunk.mesh) renderChunkMesh(renderer, chunk.mesh, mvp);
  }
}

function renderHUD(c: CanvasRenderingContext2D, W: number, H: number, player: PlayerState, _targetHit: BlockHit | null): void {
  c.clearRect(0, 0, W, H);
  const pBX = Math.floor(player.pos.x);
  const pBY = Math.floor(player.pos.y);
  const pBZ = Math.floor(player.pos.z);

  // Crosshair
  c.strokeStyle = '#ffffff';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(W / 2 - 8, H / 2);
  c.lineTo(W / 2 + 8, H / 2);
  c.moveTo(W / 2, H / 2 - 8);
  c.lineTo(W / 2, H / 2 + 8);
  c.stroke();
  c.lineWidth = 1;

  // Coordinates
  c.fillStyle = '#ffffff';
  c.font = '14px monospace';
  c.fillText('X:' + pBX + ' Y:' + pBY + ' Z:' + pBZ, 10, 20);

  // Health hearts
  c.fillStyle = '#df3d37';
  c.font = '18px monospace';
  const hearts = Math.ceil(Math.max(0, player.health) / 2);
  c.fillText('\u2665'.repeat(hearts), 10, 42);
  c.font = '14px monospace';

  // Time + Chunks
  const timeOfDay = player.daytime < 0.1 ? 'Dawn' : player.daytime < 0.4 ? 'Day' : player.daytime < 0.6 ? 'Dusk' : player.daytime < 0.9 ? 'Night' : 'Dawn';
  c.fillStyle = '#ffffff';
  c.fillText('Chunks: ' + chunks.size + ' | ' + timeOfDay, 10, 62);

  // Oxygen
  if (player.oxygen < 300) {
    c.fillStyle = '#55ccff';
    c.fillText('Oxygen: ' + Math.ceil(player.oxygen / 30) + '/10', 10, 82);
  }

  // Hunger
  c.fillStyle = '#bf6b32';
  c.fillText('Hunger: ' + Math.ceil(player.hunger), 10, 102);

  // XP
  c.fillStyle = '#aaaaaa';
  c.fillText('XP: ' + player.xpLevel + ' (' + Math.floor(player.xp) + ')', 10, 122);
}

// Rebuild meshes when chunks are modified

// --- createScene -------------------------------------------------------------
export function createScene(canvas: HTMLCanvasElement): () => void {
  renderer = initRenderer(canvas);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (renderer) resizeRenderer(renderer, canvas.width, canvas.height);

  overlayCanvas = document.createElement('canvas');
  overlayCanvas.id = 'hud';
  overlayCanvas.style.position = 'absolute';
  overlayCanvas.style.top = '0';
  overlayCanvas.style.left = '0';
  overlayCanvas.style.pointerEvents = 'none';
  overlayCanvas.style.zIndex = '10';
  overlayCanvas.width = canvas.width;
  overlayCanvas.height = canvas.height;
  canvas.parentElement?.appendChild(overlayCanvas);
  overlayCtx = overlayCanvas.getContext('2d');
  function resizeOverlay() {
    if (!overlayCanvas || !overlayCtx) return;
    overlayCanvas.width = window.innerWidth;
    overlayCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (renderer) resizeRenderer(renderer, canvas.width, canvas.height);
    resizeOverlay();
  });

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

  // Place real-world landmarks at GPS coordinates
  placeAllLandmarks();

  // Build initial WebGL chunk meshes
  rebuildWorldMesh();

  // Find ground level for spawn
  const spawnY = getElevation(0, 0) + 2;

  const player = initPlayer();
  v3set(player.pos, 0, spawnY, 0);

  let attackCooldown = 0;
  const mining: MiningState = { targetX: 0, targetY: 0, targetZ: 0, progress: 0, total: 0, blockId: 0, active: false };
  let fluidTickCounter = 0;

  // Eating state
  let isEating = false;
  let eatingProgress = 0;
  const EATING_DURATION = 1.6;
  let eatingItem: number | null = null;

  // Inventory
  const inventory = new Inventory();
  const addDropToInventory = (itemId: number) => {
    inventory.addItem(itemId, 1);
  };
  const renderInventorySlots = () => {
    for (let i = 0; i < 27; i++) {
      const slotEl = document.querySelector('[data-slot="storage-' + i + '"]') as HTMLElement | null;
      if (!slotEl) continue;
      const item = inventory.getSlot(SLOT.MAIN_START + i);
      renderSlotItem(slotEl, item);
    }
    for (let i = 0; i < 9; i++) {
      const slotEl = document.querySelector('[data-slot="hotbar-' + i + '"]') as HTMLElement | null;
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
      img.style.backgroundImage = 'url(/textures/items/' + file + ')';
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
          img.style.backgroundImage = 'url(' + url + ')';
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
      const slotEl = document.getElementById('slot-' + i);
      if (!slotEl) continue;
      const preview = slotEl.querySelector('.block-preview') as HTMLElement | null;
      if (!preview) continue;
      const blockId = HOTBAR_BLOCKS[i];
      const url = getTextureUrl(blockId, 'all');
      if (url) {
        preview.style.backgroundImage = 'url(' + url + ')';
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
      const slotEl = document.getElementById('slot-' + i);
      if (slotEl) {
        slotEl.classList.toggle('active', i === idx);
      }
    }
  };

  const onSelectSlot = (e: Event) => {
    const customEvent = e as CustomEvent<{ index: number }>;
    player.selectedBlock = HOTBAR_BLOCKS[customEvent.detail.index];
    updateHotbarUI();
  };
  window.addEventListener('select-slot', onSelectSlot);

  // Block interaction
  const onMouseDown = (e: MouseEvent) => {
    if (!player.isPointerLocked) return;

    const eyePos = v3(player.pos.x, player.pos.y + EYE_H, player.pos.z);
    const hit = rayMarch(eyePos, player.yaw, player.pitch, 6);

    // Check for mob interaction (simple proximity along look direction)
    const lookDir = v3(
      -Math.sin(player.yaw) * Math.cos(player.pitch),
      -Math.sin(player.pitch),
      -Math.cos(player.yaw) * Math.cos(player.pitch),
    );
    let closestMob: Mob | null = null;
    let closestMobDist = Infinity;
    for (const [, mob] of mobs) {
      if (mob.health <= 0) continue;
      const toMob = v3sub(mob.pos, eyePos);
      const t = v3dot(toMob, lookDir);
      if (t < 0 || t > 4) continue;
      const perpDist = v3len(v3sub(toMob, v3scale(lookDir, t)));
      if (perpDist < 1.5 && t < closestMobDist) {
        closestMob = mob;
        closestMobDist = t;
      }
    }

    // Check for tappable interaction
    let closestTappable: Tappable | null = null;
    let closestTappableDist = Infinity;
    for (const [, t] of tappables) {
      if (!isTappableActive(t, performance.now())) continue;
      const toTap = v3sub(v3(t.x, t.y + 0.5, t.z), eyePos);
      const tapT = v3dot(toTap, lookDir);
      if (tapT < 0 || tapT > 4) continue;
      const perpDist = v3len(v3sub(toTap, v3scale(lookDir, tapT)));
      if (perpDist < 1.0 && tapT < closestTappableDist) {
        closestTappable = t;
        closestTappableDist = tapT;
      }
    }

    // Mob interaction
    if (closestMob && e.button === 0 && (!hit || closestMobDist < v3dist(eyePos, v3(hit.x, hit.y, hit.z)))) {
      const mob = closestMob;
      let damage = 1;
      const heldItem = inventory.getSlot(SLOT.HOTBAR_START + inventory.selectedHotbar);
      if (heldItem) {
        const props = getItemProperties(heldItem.itemId);
        if (props?.category === 'weapon') {
          damage = props.damage ?? 4;
        } else if (props?.category === 'tool') {
          damage = 2;
        }
      }
      mob.health -= damage;
      sounds.playTone(150, 'square', 0.1);
      const dx = mob.pos.x - player.pos.x;
      const dz = mob.pos.z - player.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0) {
        mob.pos.x += (dx / dist) * 0.5;
        mob.pos.z += (dz / dist) * 0.5;
      }
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
          showNotification('Killed ' + props.displayName + ' (+' + props.experience + ' XP)');
        }
      }
      return;
    }

    // Tappable interaction
    if (closestTappable && e.button === 0 && (!hit || closestTappableDist < v3dist(eyePos, v3(hit.x, hit.y, hit.z)))) {
      const drops = collectTappable(closestTappable.id);
      if (drops.length > 0) {
        let totalXp = 0;
        for (const drop of drops) {
          const name = getItemProperties(drop.itemId)?.displayName ?? 'Item ' + drop.itemId;
          showNotification('Collected: ' + drop.count + 'x ' + name);
          totalXp += drop.count;
          inventory.addItem(drop.itemId, drop.count);
        }
        sounds.playTone(400, 'sine', 0.15);
        player.xp += totalXp;
        if (player.xp >= player.xpLevel * 10 + 10) {
          player.xp = 0;
          player.xpLevel++;
        }
      }
      return;
    }

    // Block interaction
    if (hit && hit.blockId !== BLOCK.AIR) {
      const bx = hit.x, by = hit.y, bz = hit.z;

      if (e.button === 0) {
        const blockId = getBlock(bx, by, bz);
        if (blockId !== BLOCK.AIR && blockId !== BLOCK.BEDROCK) {
          if (player.gameMode === 'creative') {
            breakBlock(bx, by, bz, blockId);
            return;
          }
          const props = getBlockProperties(blockId);
          if (props.hardness < 0) return;
          const { toolType, toolTier, toolId } = getHeldToolType(player.selectedBlock);
          const harvestTime = getHarvestTime(blockId, toolId, toolType, toolTier);
          if (mining.active && mining.targetX === bx && mining.targetY === by && mining.targetZ === bz) {
            mining.progress += 1 / 60;
            if (mining.progress >= mining.total) {
              breakBlock(bx, by, bz, blockId);
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
            if (props.requiredTool !== 'none' && props.requiredTool !== toolType) {
              showNotification('Need ' + props.requiredTool + ' to mine this faster');
            }
          }
        }
      } else if (e.button === 2) {
        const blockId = getBlock(bx, by, bz);

        const collItem = inventory.getSlot(SLOT.HOTBAR_START + inventory.selectedHotbar);
        if (collItem && collItem.itemId === ITEM.BUCKET && blockId === BLOCK.WATER) {
          setBlock(bx, by, bz, BLOCK.AIR);
          collItem.itemId = ITEM.WATER_BUCKET;
          sounds.playTone(300, 'square', 0.1);
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

        const foodHeldItem = inventory.getSlot(SLOT.HOTBAR_START + inventory.selectedHotbar);
        if (foodHeldItem && foodHeldItem.count > 0) {
          const foodProps = getItemProperties(foodHeldItem.itemId);
          if (foodProps?.category === 'food' && foodProps.foodPoints) {
            if (!isEating) {
              isEating = true;
              eatingProgress = 0;
              eatingItem = foodHeldItem.itemId;
              showNotification('Eating ' + foodProps.displayName + '...');
              return;
            }
          }
        }

        const normal = hit.normal;
        const nx = bx + normal.x;
        const ny = by + normal.y;
        const nz = bz + normal.z;

        if (getBlock(nx, ny, nz) !== BLOCK.AIR) return;

        const overlapX = (player.pos.x - HALF_W < nx + 0.5) && (player.pos.x + HALF_W > nx - 0.5);
        const overlapY = (player.pos.y < ny + 0.5) && (player.pos.y + 1.8 > ny - 0.5);
        const overlapZ = (player.pos.z - HALF_W < nz + 0.5) && (player.pos.z + HALF_W > nz - 0.5);
        if (overlapX && overlapY && overlapZ) return;

        const blockHeldItem = inventory.getSlot(SLOT.HOTBAR_START + inventory.selectedHotbar);
        if (!blockHeldItem || blockHeldItem.count <= 0) return;

        if (blockHeldItem.itemId === ITEM.WATER_BUCKET) {
          setBlock(nx, ny, nz, BLOCK.WATER);
          blockHeldItem.itemId = ITEM.BUCKET;
          sounds.playTone(300, 'square', 0.1);
          renderInventorySlots();
          return;
        }

        setBlock(nx, ny, nz, player.selectedBlock);
        sounds.playTone(300, 'square', 0.1);

        blockHeldItem.count--;
        if (blockHeldItem.count <= 0) {
          inventory.setSlot(SLOT.HOTBAR_START + inventory.selectedHotbar, null);
        }
        renderInventorySlots();
      }
    }
  };

  const breakBlock = (bx: number, by: number, bz: number, blockId: number) => {
    setBlock(bx, by, bz, BLOCK.AIR);
    sounds.playTone(200, 'square', 0.1);
    const drops = getBlockDrops(blockId);
    drops.forEach(itemId => addDropToInventory(itemId));
    if (drops.length > 0) {
      showNotification('+' + drops.length + ' ' + getBlockName(drops[0]));
    }
    player.xp += 0.5;
    if (player.xp >= player.xpLevel * 10 + 10) {
      player.xp = 0;
      player.xpLevel++;
    }
    mining.active = false;
    mining.progress = 0;
  };

  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 0 && mining.active) {
      mining.active = false;
      mining.progress = 0;
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
      updateHotbarUI();
    }
    if (e.code === 'KeyF') {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void canvas.requestFullscreen();
    }
    if (e.code === 'KeyE') {
      if (player.gameMode === 'survival' && !isEating) {
        for (let i = 0; i < 9; i++) {
          const slot = inventory.getSlot(SLOT.HOTBAR_START + i);
          if (slot && slot.count > 0) {
            const props = getItemProperties(slot.itemId);
            if (props?.category === 'food' && props.foodPoints) {
              isEating = true;
              eatingProgress = 0;
              eatingItem = slot.itemId;
              inventory.selectedHotbar = i;
              if (HOTBAR_BLOCKS[inventory.selectedHotbar] !== undefined) {
                player.selectedBlock = HOTBAR_BLOCKS[inventory.selectedHotbar];
              }
              updateHotbarUI();
              showNotification('Eating ' + props.displayName + '...');
              break;
            }
          }
        }
      }
      player.keys.delete('KeyE');
    }
  };
  const onKU = (e: KeyboardEvent) => player.keys.delete(e.code);
  document.addEventListener('keydown', onKD);
  document.addEventListener('keyup', onKU);

  const onResize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', onResize);

  // Settings event listeners
  const onSettingsChange = (e: Event) => {
    const customEvent = e as CustomEvent<{ fov?: number; difficulty?: string; renderDistance?: number }>;
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
      for (let i = 0; i < 9; i++) {
        const slotEl = document.querySelector('[data-slot="table-' + i + '"]') as HTMLElement | null;
        if (!slotEl) continue;
        const itemId = craftingGrid[i];
        if (itemId !== null) {
          const url = getTextureUrl(itemId, 'all');
          if (url) {
            const img = document.createElement('div');
            img.className = 'slot-item';
            img.style.backgroundImage = 'url(' + url + ')';
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
      const inEl = document.querySelector('[data-slot="furnace-in"]') as HTMLElement | null;
      const fuelEl = document.querySelector('[data-slot="furnace-fuel"]') as HTMLElement | null;
      const outEl = document.querySelector('[data-slot="furnace-out"]') as HTMLElement | null;
      if (inEl && furnaceInput) {
        inEl.innerHTML = '';
        const url = getTextureUrl(furnaceInput.itemId, 'all');
        if (url) {
          const img = document.createElement('div');
          img.className = 'slot-item';
          img.style.backgroundImage = 'url(' + url + ')';
          inEl.appendChild(img);
        }
      }
      if (fuelEl && furnaceFuel) {
        fuelEl.innerHTML = '';
        const url = getTextureUrl(furnaceFuel.itemId, 'all');
        if (url) {
          const img = document.createElement('div');
          img.className = 'slot-item';
          img.style.backgroundImage = 'url(' + url + ')';
          fuelEl.appendChild(img);
        }
      }
      if (outEl && furnaceOutput) {
        outEl.innerHTML = '';
        const url = getTextureUrl(furnaceOutput.itemId, 'all');
        if (url) {
          const img = document.createElement('div');
          img.className = 'slot-item';
          img.style.backgroundImage = 'url(' + url + ')';
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
    player.saturation = 5;
    v3set(player.pos, 0, getElevation(0, 0) + 2, 0);
    v3set(player.vel, 0, 0, 0);
  };
  window.addEventListener('player-respawn', onRespawn);

  // Inventory toggle
  window.addEventListener('inventory-toggle', ((e: CustomEvent<{ open: boolean }>) => {
    if (e.detail.open) renderInventorySlots();
  }) as EventListener);

  // Weather particles (canvas-based)
  interface RainDrop { x: number; y: number; z: number; }
  const rainDrops: RainDrop[] = [];
  const WEATHER_COUNT = 200;
  let weatherType: 'clear' | 'rain' | 'snow' = 'clear';
  const initRainDrops = () => {
    for (let i = 0; i < WEATHER_COUNT; i++) {
      rainDrops.push({
        x: (Math.random() - 0.5) * 40,
        y: Math.random() * 30 + 5,
        z: (Math.random() - 0.5) * 40,
      });
    }
  };
  initRainDrops();

  // Track last frame's target for highlight rendering
  let lastTarget: BlockHit | null = null;
  void lastTarget;

    // Tick-based physics (20Hz = 50ms per tick, matching Minecraft Java Edition)
    let raf = 0, lastT = performance.now(), tickAccum = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      tickAccum += Math.min(now - lastT, 100);
      const frameDt = (now - lastT) / 1000;
      lastT = now;
      attackCooldown = Math.max(0, attackCooldown - frameDt);

      while (tickAccum >= TICK_MS) {
        tickPlayer(player, difficulty);
        tickAccum -= TICK_MS;
      }
      const dt = frameDt; // for non-physics timers still using dt

    // Weather
    const timeOfDay = player.daytime;
    const isNight = timeOfDay > 0.5 && timeOfDay < 1;
    const newType = isNight && Math.random() < 0.001 ? (Math.random() < 0.5 ? 'rain' : 'snow') : 'clear';
    if (newType !== 'clear') weatherType = newType;
    else if (Math.random() < 0.0005) weatherType = 'clear';

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
      if (mining.progress >= mining.total) {
        const blockId = getBlock(mining.targetX, mining.targetY, mining.targetZ);
        if (blockId !== BLOCK.AIR && blockId !== BLOCK.BEDROCK) {
          breakBlock(mining.targetX, mining.targetY, mining.targetZ, blockId);
        }
        mining.active = false;
        mining.progress = 0;
      }
    }

    // Fluid simulation - every 20 frames (~1 tick/sec at 60fps)
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
        rebuildWorldMesh();
      }
    }

    // Eating timer
    if (isEating && eatingItem !== null) {
      eatingProgress += frameDt;
      if (eatingProgress >= EATING_DURATION) {
        const props = getItemProperties(eatingItem);
        if (props?.foodPoints) {
          player.hunger = Math.min(20, player.hunger + props.foodPoints);
          player.saturation = Math.min(player.hunger, player.saturation + props.foodPoints * 1.5);
          showNotification('Ate ' + props.displayName + ' (+' + props.foodPoints + ' hunger)');
        }
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

    // Stream chunks
    const [pcx, pcz] = worldToChunk(Math.floor(player.pos.x), Math.floor(player.pos.z));
    for (let dx = -renderDistance; dx <= renderDistance; dx++) {
      for (let dz = -renderDistance; dz <= renderDistance; dz++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        if (!getChunk(cx, cz)) {
          getOrCreateChunk(cx, cz);
        }
      }
    }

    // Update tappables
    spawnTappablesAroundPlayer(player.pos.x, player.pos.z);

    // Update mobs
    spawnMobsAroundPlayer(player.pos.x, player.pos.z, player.daytime);
    for (const [id, mob] of mobs) {
      updateMob(mob, dt, player.pos, difficulty);
      if (mob.health <= 0) {
        mobs.delete(id);
      }
    }

    // Block highlight via ray marching
    const targetHit = player.isPointerLocked ? rayMarch(v3(player.pos.x, player.pos.y + EYE_H, player.pos.z), player.yaw, player.pitch, 6) : null;
    lastTarget = targetHit;

    // Weather update
    const isPrecip = weatherType === 'rain' || weatherType === 'snow';
    for (const p of rainDrops) {
      if (isPrecip) {
        p.y -= dt * 20;
        p.x = player.pos.x + (Math.random() - 0.5) * 40;
        p.z = player.pos.z + (Math.random() - 0.5) * 40;
        if (p.y < player.pos.y - 5) {
          p.y = player.pos.y + 25 + Math.random() * 5;
        }
      }
    }

    // Render 3D world with WebGL, HUD overlay with Canvas 2D
    renderFrameWebGL(canvas, player);
    if (overlayCtx) renderHUD(overlayCtx, canvas.width, canvas.height, player, targetHit);

    // HUD text overlay
    if (hudEl) {
      const hearts = Math.ceil(Math.max(0, Math.min(20, player.health)) / 2);
      const foodBars = Math.ceil(Math.max(0, Math.min(20, player.hunger)) / 2);
      const timeOfDay2 = player.daytime < 0.1 ? 'Dawn' : player.daytime < 0.4 ? 'Day' : player.daytime < 0.6 ? 'Dusk' : player.daytime < 0.9 ? 'Night' : 'Dawn';
      const oxygenBubbles = player.oxygen < 300
        ? ' \u00b7 O2:' + Math.ceil(player.oxygen / 30) + '/10'
        : '';
      hudEl.innerHTML = '<span class="green">WASD Move \u00b7 SPACE Jump \u00b7 SHIFT Sprint \u00b7 Mouse Look</span><br>'
        + '<span class="white">X:' + Math.floor(player.pos.x) + ' Y:' + Math.floor(player.pos.y) + ' Z:' + Math.floor(player.pos.z) + '</span><br>'
        + '<span class="white">Chunks: ' + chunks.size + ' | ' + timeOfDay2 + '</span><br>'
        + '<span style="font-size:14px">'
        + Array.from({ length: 10 }, (_, i) => '<span class="' + (i < hearts ? 'full' : '') + '" style="color:' + (i < hearts ? '#df3d37' : '#3a3a3a') + '">\u2665</span>').join('')
        + ' '
        + Array.from({ length: 10 }, (_, i) => '<span style="display:inline-block;width:10px;height:10px;border:2px solid #1b1b1b;border-radius:60% 45% 55% 45%;background:' + (i < foodBars ? '#bf6b32' : '#3a3a3a') + ';transform:rotate(-28deg) scale(.85);"></span>').join('')
        + oxygenBubbles
        + '</span>';
    }
  };
  animate();

  window.render_game_to_text = (): string => JSON.stringify({
    coordinateSystem: 'voxel grid; +x east, +y up, +z south',
    mode: 'earth-world',
    playerPos: { x: Math.floor(player.pos.x), y: Math.floor(player.pos.y), z: Math.floor(player.pos.z) },
    health: player.health,
    hunger: player.hunger,
    saturation: player.saturation,
    oxygen: player.oxygen,
    xp: player.xp,
    xpLevel: player.xpLevel,
    selectedBlock: player.selectedBlock,
    chunksLoaded: chunks.size,
    totalBlocks: '5.49 quadrillion (Earth surface area)',
  });
  window.advanceTime = (ms: number): void => {
    const steps = Math.max(1, Math.round(ms / TICK_MS));
    for (let i = 0; i < steps; i++) {
      attackCooldown = Math.max(0, attackCooldown - TICK_S);
      tickPlayer(player, difficulty);
    }
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
    if (overlayCanvas && overlayCanvas.parentElement) overlayCanvas.parentElement.removeChild(overlayCanvas);
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
  return names[blockId] ?? 'Block ' + blockId;
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

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
}

function interpolateSkyColor(t: number): number {
  const keyframes: [number, number][] = [
    [0, 0xFF8C5A],
    [0.25, 0x87CEEB],
    [0.5, 0xE37341],
    [0.75, 0x0A0A2E],
    [1, 0xFF8C5A],
  ];
  for (let i = 0; i < keyframes.length - 1; i++) {
    const [t0, c0] = keyframes[i];
    const [t1, c1] = keyframes[i + 1];
    if (t >= t0 && t <= t1) {
      return lerpColor(c0, c1, (t - t0) / (t1 - t0));
    }
  }
  return keyframes[keyframes.length - 1][1];
}

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
    showDeathScreen?: () => void;
    hideDeathScreen?: () => void;
  }
}
