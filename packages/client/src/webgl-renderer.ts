// Raw WebGL 2.0 voxel renderer — zero dependencies

export interface Renderer {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  uMvp: WebGLUniformLocation;
  uTexture: WebGLUniformLocation;
  aPos: number;
  aUv: number;
  textures: Map<number, WebGLTexture>;
}

export function initRenderer(canvas: HTMLCanvasElement): Renderer | null {
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

  return { gl, program, uMvp, uTexture, aPos, aUv, textures: new Map() };
}

export function resizeRenderer(r: Renderer, w: number, h: number): void {
  r.gl.viewport(0, 0, w, h);
}

export function createPerspective(fovY: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fovY / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect; m[5] = f;
  m[10] = (far + near) / (near - far); m[11] = -1;
  m[14] = 2 * far * near / (near - far);
  return m;
}

export function lookAt(eyeX: number, eyeY: number, eyeZ: number, cx: number, cy: number, cz: number, upX: number, upY: number, upZ: number): Float32Array {
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

export function mulMat4(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[i + k*4] * b[k + j*4];
      out[i + j*4] = sum;
    }
  return out;
}

// --- Block face geometry ---

const FACE_VERTS: [number,number,number, number,number,number, number,number,number, number,number,number][] = [
  // [x,y,z, x,y,z, x,y,z, x,y,z]
  // +x
  [1,0,0, 1,1,0, 1,1,1, 1,0,1],
  // -x
  [0,0,1, 0,1,1, 0,1,0, 0,0,0],
  // +y (top)
  [0,1,1, 1,1,1, 1,1,0, 0,1,0],
  // -y (bottom)
  [1,0,1, 0,0,1, 0,0,0, 1,0,0],
  // +z
  [1,0,1, 1,1,1, 0,1,1, 0,0,1],
  // -z
  [0,0,0, 0,1,0, 1,1,0, 1,0,0],
];

const FACE_UVS: [number,number, number,number, number,number, number,number][] = [
  [0,0, 1,0, 1,1, 0,1],
  [0,0, 1,0, 1,1, 0,1],
  [0,0, 1,0, 1,1, 0,1],
  [0,0, 1,0, 1,1, 0,1],
  [0,0, 1,0, 1,1, 0,1],
  [0,0, 1,0, 1,1, 0,1],
];

export interface ChunkMesh {
  vao: WebGLVertexArrayObject;
  indexCount: number;
}

export function buildChunkMesh(r: Renderer, blocks: Uint16Array, cx: number, cz: number, getBlock: (x: number, y: number, z: number) => number, isSolid: (id: number) => boolean): ChunkMesh | null {
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
        if (blockId === 0) continue; // air

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
          const u = FACE_UVS[f];
          const base = idx * 4;
          for (let v = 0; v < 4; v++) {
            positions.push(lx + verts[v*3], ly + verts[v*3+1], lz + verts[v*3+2]);
            uvs.push(u[v*2], u[v*2+1]);
          }
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

export function renderChunkMesh(r: Renderer, mesh: ChunkMesh, mvp: Float32Array): void {
  const gl = r.gl;
  gl.uniformMatrix4fv(r.uMvp, false, mvp);
  gl.bindVertexArray(mesh.vao);
  gl.drawElements(gl.TRIANGLES, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
  gl.bindVertexArray(null);
}

export function deleteChunkMesh(r: Renderer, mesh: ChunkMesh): void {
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
