/**
 * SquidGame100 MineCraft — Stage 1+ Scene
 *
 * Squid Game Island rendered as Minecraft-style voxel blocks.
 * First-person controller, voxel world, Squid Game mini-game logic.
 *
 * Theme:
 *   - Pink / Magenta guards with black masks
 *   - Teal / Green tracksuits for players
 *   - Dark navy ink sky
 *   - Iconic Squid Game locations: dorm, playground, bridge, vault
 */

import {
  BoxGeometry,
  Color,
  DirectionalLight,
  Fog,
  InstancedMesh,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  Object3D,
  PointLight,
  HemisphereLight,
  Group,
} from 'three';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  PINK:      0xff2d6f,
  GREEN:     0x00a86b,
  INK:       0x0b1f3a,
  GOLD:      0xffd700,
  BLACK:     0x111111,
  CONCRETE:  0xaaaaaa,
  STONE:     0x777788,
  WOOD:      0x8b6914,
  SAND:      0xc8b560,
  BLOOD:     0x8b0000,
  OCEAN:     0x001a3d,
  TEAL:      0x008080,
  LAMP:      0xffeeaa,
};

// ─── Block Types ──────────────────────────────────────────────────────────────
const BLOCK = {
  AIR: 0, STONE: 1, GRASS: 2, SAND: 3, WOOD: 4,
  PINK_WALL: 5, CONCRETE: 6, METAL: 7, GOLD: 8,
  BLOOD: 9, GLASS: 10, TEAL: 11, BLACK: 12,
} as const;
type BlockId = (typeof BLOCK)[keyof typeof BLOCK];

const BLOCK_COLORS: Record<number, number> = {
  [BLOCK.STONE]: C.STONE, [BLOCK.GRASS]: C.GREEN,
  [BLOCK.SAND]: C.SAND, [BLOCK.WOOD]: C.WOOD,
  [BLOCK.PINK_WALL]: C.PINK, [BLOCK.CONCRETE]: C.CONCRETE,
  [BLOCK.METAL]: 0x667788, [BLOCK.GOLD]: C.GOLD,
  [BLOCK.BLOOD]: C.BLOOD, [BLOCK.GLASS]: 0x88ccff,
  [BLOCK.TEAL]: C.TEAL, [BLOCK.BLACK]: C.BLACK,
};

// ─── World ────────────────────────────────────────────────────────────────────
const WORLD_W = 80, WORLD_H = 24, WORLD_D = 80;
const world = new Uint8Array(WORLD_W * WORLD_H * WORLD_D);

function getBlock(x: number, y: number, z: number): number {
  if (x < 0 || x >= WORLD_W || y < 0 || y >= WORLD_H || z < 0 || z >= WORLD_D) return BLOCK.STONE;
  return world[y * WORLD_W * WORLD_D + z * WORLD_W + x];
}
function setBlock(x: number, y: number, z: number, id: BlockId): void {
  if (x < 0 || x >= WORLD_W || y < 0 || y >= WORLD_H || z < 0 || z >= WORLD_D) return;
  world[y * WORLD_W * WORLD_D + z * WORLD_W + x] = id;
}
function fill(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, id: BlockId): void {
  for (let y = y1; y <= y2; y++)
    for (let z = z1; z <= z2; z++)
      for (let x = x1; x <= x2; x++) setBlock(x, y, z, id);
}

// ─── Squid Game Island Builder ────────────────────────────────────────────────
function buildSquidGameIsland(): void {
  fill(2,0,2, WORLD_W-3,0,WORLD_D-3, BLOCK.STONE); // island base
  fill(10,1,10, 70,1,70, BLOCK.CONCRETE); // compound ground
  fill(2,1,2, 9,1,77, BLOCK.GRASS);   fill(71,1,2, 77,1,77, BLOCK.GRASS);
  fill(2,1,2, 77,1,9, BLOCK.GRASS);   fill(2,1,71, 77,1,77, BLOCK.GRASS);

  // Pink compound walls
  fill(10,2,10, 70,5,10, BLOCK.PINK_WALL); fill(10,2,70, 70,5,70, BLOCK.PINK_WALL);
  fill(10,2,10, 10,5,70, BLOCK.PINK_WALL); fill(70,2,10, 70,5,70, BLOCK.PINK_WALL);
  fill(10,6,10, 70,6,10, BLOCK.BLACK); fill(10,6,70, 70,6,70, BLOCK.BLACK);
  fill(10,6,10, 10,6,70, BLOCK.BLACK); fill(70,6,10, 70,6,70, BLOCK.BLACK);
  fill(38,2,10, 42,5,10, BLOCK.AIR); // gate opening

  // Dormitory
  fill(12,2,13, 30,2,35, BLOCK.CONCRETE); fill(12,2,13, 12,8,35, BLOCK.PINK_WALL);
  fill(30,2,13, 30,8,35, BLOCK.PINK_WALL); fill(12,2,13, 30,8,13, BLOCK.PINK_WALL);
  fill(12,2,35, 30,8,35, BLOCK.PINK_WALL); fill(12,9,13, 30,9,35, BLOCK.CONCRETE);
  setBlock(15,5,13, BLOCK.GLASS); setBlock(16,5,13, BLOCK.GLASS);
  setBlock(20,5,13, BLOCK.GLASS); setBlock(21,5,13, BLOCK.GLASS);
  setBlock(25,5,13, BLOCK.GLASS); setBlock(26,5,13, BLOCK.GLASS);
  fill(20,2,13, 21,3,13, BLOCK.AIR); // dorm door
  fill(13,5,14, 29,5,34, BLOCK.CONCRETE); // bunk level

  // Playground — sand arena
  fill(32,1,32, 52,1,52, BLOCK.SAND);
  fill(32,2,32, 52,2,32, BLOCK.PINK_WALL); fill(32,2,52, 52,2,52, BLOCK.PINK_WALL);
  fill(32,2,32, 32,2,52, BLOCK.PINK_WALL); fill(52,2,32, 52,2,52, BLOCK.PINK_WALL);
  // Start/end lines
  fill(32,2,33, 52,2,33, BLOCK.GOLD);
  fill(32,2,51, 52,2,51, BLOCK.BLOOD);
  // Doll pedestal (Young-hee)
  fill(39,1,48, 45,1,52, BLOCK.STONE);
  fill(40,2,49, 44,5,51, BLOCK.TEAL);
  fill(41,6,49, 43,7,51, BLOCK.GOLD);
  fill(41,8,50, 43,8,50, BLOCK.BLACK);

  // Staircase tower
  fill(55,1,13, 68,1,30, BLOCK.CONCRETE); fill(55,2,13, 55,14,30, BLOCK.PINK_WALL);
  fill(68,2,13, 68,14,30, BLOCK.PINK_WALL); fill(55,2,13, 68,14,13, BLOCK.PINK_WALL);
  fill(55,2,30, 68,14,30, BLOCK.PINK_WALL); fill(55,15,13, 68,15,30, BLOCK.BLACK);
  for (let s = 0; s < 12; s++) {
    fill(57+Math.floor(s/3), 2+s, 15+(s%3)*4, 61+Math.floor(s/3), 2+s, 18+(s%3)*4, BLOCK.CONCRETE);
  }

  // Glass bridge
  for (let i = 0; i < 16; i++) {
    const bt = (i % 3 !== 2) ? BLOCK.GLASS : BLOCK.TEAL;
    const sx = (i % 2 === 0) ? 36 : 38;
    setBlock(sx, 4+Math.floor(i/2), 56+i, bt);
    setBlock(sx+1, 4+Math.floor(i/2), 56+i, bt);
  }

  // Gold vault / prize room
  fill(55,1,55, 68,1,68, BLOCK.GOLD); fill(55,2,55, 55,6,68, BLOCK.GOLD);
  fill(68,2,55, 68,6,68, BLOCK.GOLD); fill(55,2,55, 68,6,55, BLOCK.GOLD);
  fill(55,2,68, 68,6,68, BLOCK.GOLD); fill(55,7,55, 68,7,68, BLOCK.GOLD);
  fill(60,2,60, 63,4,63, BLOCK.GOLD); // prize pig
  fill(61,2,55, 62,3,55, BLOCK.AIR);  // vault door

  // Lamp posts
  for (const [lx,lz] of [[20,28],[20,50],[50,28],[50,50],[35,20],[35,62],[55,42]] as [number,number][]) {
    setBlock(lx,2,lz, BLOCK.BLACK); setBlock(lx,3,lz, BLOCK.BLACK);
    setBlock(lx,4,lz, BLOCK.BLACK); setBlock(lx,5,lz, BLOCK.GOLD);
  }

  // Guard patrol teal strips
  fill(11,2,15, 11,2,69, BLOCK.TEAL); fill(69,2,15, 69,2,69, BLOCK.TEAL);
  fill(15,2,11, 69,2,11, BLOCK.TEAL); fill(15,2,69, 69,2,69, BLOCK.TEAL);
}

// ─── Mesh Builder ─────────────────────────────────────────────────────────────
function buildWorldMesh(scene: Scene): void {
  const counts = new Map<number, number>();
  for (let y = 0; y < WORLD_H; y++) for (let z = 0; z < WORLD_D; z++) for (let x = 0; x < WORLD_W; x++) {
    const id = getBlock(x, y, z); if (id === BLOCK.AIR) continue;
    if (getBlock(x+1,y,z)===BLOCK.AIR||getBlock(x-1,y,z)===BLOCK.AIR||
        getBlock(x,y+1,z)===BLOCK.AIR||getBlock(x,y-1,z)===BLOCK.AIR||
        getBlock(x,y,z+1)===BLOCK.AIR||getBlock(x,y,z-1)===BLOCK.AIR)
      counts.set(id, (counts.get(id)??0)+1);
  }
  const geo = new BoxGeometry(1,1,1);
  const meshes = new Map<number,{mesh:InstancedMesh,count:number}>();
  for (const [id, cnt] of counts) {
    const mat = new MeshLambertMaterial({ color: BLOCK_COLORS[id]??0xff00ff });
    if (id===BLOCK.GLASS) { mat.transparent=true; mat.opacity=0.55; }
    const im = new InstancedMesh(geo, mat, cnt);
    im.castShadow = true; im.receiveShadow = true;
    scene.add(im); meshes.set(id, {mesh:im, count:0});
  }
  const dummy = new Object3D();
  for (let y = 0; y < WORLD_H; y++) for (let z = 0; z < WORLD_D; z++) for (let x = 0; x < WORLD_W; x++) {
    const id = getBlock(x,y,z); if (id===BLOCK.AIR) continue;
    if (!(getBlock(x+1,y,z)===BLOCK.AIR||getBlock(x-1,y,z)===BLOCK.AIR||
          getBlock(x,y+1,z)===BLOCK.AIR||getBlock(x,y-1,z)===BLOCK.AIR||
          getBlock(x,y,z+1)===BLOCK.AIR||getBlock(x,y,z-1)===BLOCK.AIR)) continue;
    const e = meshes.get(id); if (!e) continue;
    dummy.position.set(x,y,z); dummy.updateMatrix();
    e.mesh.setMatrixAt(e.count++, dummy.matrix);
  }
  for (const e of meshes.values()) e.mesh.instanceMatrix.needsUpdate = true;
}

// ─── Guard NPCs ───────────────────────────────────────────────────────────────
interface Guard { group:Group; body:Mesh; waypoints:Vector3[]; wpIdx:number; speed:number; }

function createGuard(scene:Scene, x:number, z:number, wps:[number,number][]): Guard {
  const group = new Group();
  const body = new Mesh(new BoxGeometry(0.6,1.0,0.4), new MeshStandardMaterial({color:C.PINK}));
  body.position.y = 1.5; group.add(body);
  const head = new Mesh(new SphereGeometry(0.28,16,12), new MeshStandardMaterial({color:C.BLACK}));
  head.position.y = 2.2; group.add(head);
  const sym = new Mesh(new SphereGeometry(0.1,8,6), new MeshStandardMaterial({color:C.GOLD}));
  sym.position.set(0,2.25,0.28); group.add(sym);
  group.position.set(x,1,z); scene.add(group);
  return { group, body, waypoints: wps.map(([wx,wz])=>new Vector3(wx,1,wz)), wpIdx:0, speed:1.5+Math.random()*0.5 };
}

function updateGuards(guards:Guard[], dt:number): void {
  for (const g of guards) {
    const tgt = g.waypoints[g.wpIdx];
    const dir = tgt.clone().sub(g.group.position); dir.y=0;
    if (dir.length()<0.3) { g.wpIdx=(g.wpIdx+1)%g.waypoints.length; }
    else { dir.normalize(); g.group.position.addScaledVector(dir,g.speed*dt); g.group.rotation.y=Math.atan2(dir.x,dir.z); }
    g.body.rotation.z = Math.sin(Date.now()*0.005+g.wpIdx)*0.05;
  }
}

// ─── Player ───────────────────────────────────────────────────────────────────
interface PlayerState {
  pos:Vector3; vel:Vector3; yaw:number; pitch:number; onGround:boolean;
  keys:Set<string>; isPointerLocked:boolean; health:number;
  eliminated:boolean; gamePhase:string; phaseTimer:number; moving:boolean;
}
function initPlayer(): PlayerState {
  return { pos:new Vector3(40,4,14), vel:new Vector3(), yaw:0, pitch:0,
    onGround:false, keys:new Set(), isPointerLocked:false, health:100,
    eliminated:false, gamePhase:'lobby', phaseTimer:30, moving:false };
}

const GRAVITY=-22, JUMP_VEL=8, WALK_SPEED=5, HEAD_H=1.65, PW=0.35;

function solid(id:number): boolean { return id!==BLOCK.AIR&&id!==BLOCK.GLASS; }
function aabb(x:number,y:number,z:number): boolean {
  return ([[-PW,0,-PW],[PW,0,-PW],[-PW,0,PW],[PW,0,PW],
           [-PW,1,-PW],[PW,1,-PW],[-PW,1,PW],[PW,1,PW]] as [number,number,number][])
    .some(([dx,dy,dz])=>solid(getBlock(Math.floor(x+dx),Math.floor(y+dy),Math.floor(z+dz))));
}

function updatePlayer(p:PlayerState, dt:number): void {
  if (p.eliminated) return;
  const spd = p.keys.has('ShiftLeft')?WALK_SPEED*1.8:WALK_SPEED;
  const fw=new Vector3(-Math.sin(p.yaw),0,-Math.cos(p.yaw));
  const rt=new Vector3(Math.cos(p.yaw),0,-Math.sin(p.yaw));
  const mv=new Vector3();
  if(p.keys.has('KeyW')||p.keys.has('ArrowUp'))   mv.add(fw);
  if(p.keys.has('KeyS')||p.keys.has('ArrowDown')) mv.sub(fw);
  if(p.keys.has('KeyA')||p.keys.has('ArrowLeft')) mv.sub(rt);
  if(p.keys.has('KeyD')||p.keys.has('ArrowRight'))mv.add(rt);
  p.moving = mv.length()>0.01;
  if(p.moving) mv.normalize().multiplyScalar(spd);
  if((p.keys.has('Space')||p.keys.has('KeyE'))&&p.onGround){p.vel.y=JUMP_VEL;p.onGround=false;}
  p.vel.y+=GRAVITY*dt; p.vel.y=Math.max(p.vel.y,-40);
  p.pos.x+=(mv.x+p.vel.x)*dt;
  if(aabb(p.pos.x,p.pos.y-HEAD_H,p.pos.z)){p.pos.x-=(mv.x+p.vel.x)*dt;p.vel.x=0;}
  p.pos.z+=(mv.z+p.vel.z)*dt;
  if(aabb(p.pos.x,p.pos.y-HEAD_H,p.pos.z)){p.pos.z-=(mv.z+p.vel.z)*dt;p.vel.z=0;}
  p.pos.y+=p.vel.y*dt;
  if(aabb(p.pos.x,p.pos.y-HEAD_H,p.pos.z)){if(p.vel.y<0)p.onGround=true;p.pos.y-=p.vel.y*dt;p.vel.y=0;}
  else p.onGround=false;
  if(p.pos.y<-2){p.health=0;p.eliminated=true;}
  p.pos.x=Math.max(0.5,Math.min(WORLD_W-0.5,p.pos.x));
  p.pos.z=Math.max(0.5,Math.min(WORLD_D-0.5,p.pos.z));
}

// ─── Game State ───────────────────────────────────────────────────────────────
interface GS {
  phase:'lobby'|'greenlight'|'redlight'|'eliminated'|'won';
  dollLooking:boolean; phaseTimer:number; dollAngle:number;
  dollTurning:boolean; elim:number; survivors:number;
}
function mkGS(): GS {
  return {phase:'lobby',dollLooking:false,phaseTimer:5,dollAngle:0,dollTurning:false,elim:0,survivors:99};
}

function updateGame(gs:GS, p:PlayerState, doll:Group, dt:number): string {
  if (gs.phase==='lobby') {
    gs.phaseTimer-=dt;
    if(gs.phaseTimer<=0){gs.phase='greenlight';gs.phaseTimer=8;}
    return `<span class="gold">⬛ SQUID GAME 100 ⬛</span><br>
            <span class="green">WASD Move · SPACE Jump · Mouse Look</span><br>
            <span class="pink">Starting in ${Math.ceil(gs.phaseTimer)}s…</span>`;
  }
  if (gs.phase==='greenlight') {
    gs.phaseTimer-=dt; gs.dollLooking=false;
    gs.dollAngle+=dt*1.2; doll.rotation.y=Math.PI+Math.sin(gs.dollAngle)*0.1;
    if(gs.phaseTimer<=0){gs.phase='redlight';gs.phaseTimer=4+Math.random()*3;gs.dollTurning=true;gs.dollAngle=0;}
    return `<span class="green">🟢 GREEN LIGHT — Move freely!</span><br>
            <span class="white">Survivors: ${gs.survivors} | Eliminated: ${gs.elim}</span>`;
  }
  if (gs.phase==='redlight') {
    gs.phaseTimer-=dt;
    if(gs.dollTurning){
      gs.dollAngle+=dt*4;
      doll.rotation.y=Math.PI+Math.PI*Math.min(1,gs.dollAngle/1.5);
      if(gs.dollAngle>1.5){gs.dollTurning=false;gs.dollLooking=true;gs.dollAngle=0;}
    }
    if(gs.dollLooking&&p.moving){
      p.health=0;p.eliminated=true;gs.elim++;gs.survivors=Math.max(0,gs.survivors-1);
      gs.phase='eliminated';
      return `<span class="pink">💀 ELIMINATED — You moved during Red Light!</span>`;
    }
    if(gs.phaseTimer<=0&&!p.eliminated){
      gs.phase='greenlight';gs.phaseTimer=6+Math.random()*4;gs.dollTurning=false;gs.dollLooking=false;
    }
    return `<span class="pink">🔴 RED LIGHT — DON'T MOVE!</span><br>
            <span class="white">Survivors: ${gs.survivors} | Eliminated: ${gs.elim}</span>`;
  }
  if (gs.phase==='eliminated') {
    return `<span class="pink">💀 ELIMINATED</span><br>
            <span class="white">You moved during Red Light.</span><br>
            <span class="green">Press R to respawn</span>`;
  }
  if (gs.phase==='won') {
    return `<span class="gold">🏆 WINNER! You reached the Prize Vault!</span>`;
  }
  // Check vault win
  if(!p.eliminated&&p.pos.x>55&&p.pos.x<68&&p.pos.z>55&&p.pos.z<68) gs.phase='won';
  return '';
}

// ─── createScene (main export) ────────────────────────────────────────────────
export function createScene(canvas: HTMLCanvasElement): () => void {
  const renderer = new WebGLRenderer({canvas, antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;

  const scene = new Scene();
  scene.background = new Color(C.INK);
  scene.fog = new Fog(C.INK, 30, 90);

  const camera = new PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.05, 200);

  // Lighting
  scene.add(new HemisphereLight(0x334466, 0x001122, 0.6));
  const sun = new DirectionalLight(0xffeedd, 1.4);
  sun.position.set(20,40,20); sun.castShadow=true;
  sun.shadow.mapSize.width=1024; sun.shadow.mapSize.height=1024;
  scene.add(sun);
  const pinkFill = new PointLight(C.PINK, 0.8, 60);
  pinkFill.position.set(40,10,40); scene.add(pinkFill);

  // World
  buildSquidGameIsland();
  buildWorldMesh(scene);

  // Ocean
  const ocean = new Mesh(new PlaneGeometry(200,200), new MeshLambertMaterial({color:C.OCEAN}));
  ocean.rotation.x=-Math.PI/2; ocean.position.set(40,-1,40); scene.add(ocean);

  // Lamp lights
  for (const [lx,lz] of [[20,28],[20,50],[50,28],[50,50],[35,20],[35,62],[55,42]] as [number,number][]) {
    const pl = new PointLight(C.LAMP,1.8,12); pl.position.set(lx,6,lz); scene.add(pl);
  }

  // Doll (Young-hee)
  const doll = new Group();
  const dBody=new Mesh(new BoxGeometry(1,2,0.6),new MeshStandardMaterial({color:C.TEAL}));
  dBody.position.y=2; doll.add(dBody);
  const dHead=new Mesh(new SphereGeometry(0.55,16,12),new MeshStandardMaterial({color:C.GOLD}));
  dHead.position.y=3.3; doll.add(dHead);
  const dEye1=new Mesh(new SphereGeometry(0.12,8,6),new MeshStandardMaterial({color:C.BLACK}));
  dEye1.position.set(0.2,3.4,0.5); doll.add(dEye1);
  const dEye2=dEye1.clone(); dEye2.position.set(-0.2,3.4,0.5); doll.add(dEye2);
  const dHair=new Mesh(new SphereGeometry(0.18,8,6),new MeshStandardMaterial({color:C.BLACK}));
  dHair.position.set(0.55,3.5,0); doll.add(dHair);
  const dHair2=dHair.clone(); dHair2.position.set(-0.55,3.5,0); doll.add(dHair2);
  doll.position.set(42,1.5,50); doll.rotation.y=Math.PI; scene.add(doll);
  const dollLight=new PointLight(C.BLOOD,0,8); dollLight.position.set(0,2.5,1); doll.add(dollLight);

  // Guards
  const guards: Guard[] = [
    createGuard(scene,20,40,[[20,40],[20,55],[30,55],[30,40]]),
    createGuard(scene,60,25,[[60,25],[60,40],[65,40],[65,25]]),
    createGuard(scene,15,20,[[15,20],[15,65],[11,65],[11,20]]),
    createGuard(scene,69,40,[[69,20],[69,65]]),
  ];

  const player = initPlayer();
  const gs = mkGS();

  const hudEl      = document.getElementById('game-hud');
  const crossEl    = document.getElementById('crosshair');
  const overlayEl  = document.getElementById('phase-overlay');

  // Pointer lock
  const onPD=()=>{ if(!player.isPointerLocked) canvas.requestPointerLock(); };
  const onPLC=()=>{ player.isPointerLocked=document.pointerLockElement===canvas;
    if(crossEl) crossEl.style.display=player.isPointerLocked?'block':'none'; };
  canvas.addEventListener('click',onPD);
  document.addEventListener('pointerlockchange',onPLC);

  // Mouse look
  const onMM=(e:MouseEvent)=>{
    if(!player.isPointerLocked)return;
    player.yaw-=e.movementX*0.002; player.pitch-=e.movementY*0.002;
    player.pitch=Math.max(-Math.PI/2+0.05,Math.min(Math.PI/2-0.05,player.pitch));
  };
  document.addEventListener('mousemove',onMM);

  // Keys
  const onKD=(e:KeyboardEvent)=>{
    player.keys.add(e.code);
    if(e.code==='KeyR'&&player.eliminated){
      player.pos.set(40,4,14); player.vel.set(0,0,0);
      player.health=100; player.eliminated=false;
      gs.phase='lobby'; gs.phaseTimer=3; gs.dollLooking=false;
    }
  };
  const onKU=(e:KeyboardEvent)=>player.keys.delete(e.code);
  document.addEventListener('keydown',onKD);
  document.addEventListener('keyup',onKU);

  const onResize=()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight,false);
  };
  window.addEventListener('resize',onResize);

  let raf=0, lastT=performance.now(), flash=0;

  const animate=()=>{
    raf=requestAnimationFrame(animate);
    const now=performance.now(), dt=Math.min((now-lastT)/1000,0.05); lastT=now;
    updateGuards(guards,dt);
    const hudText=updateGame(gs,player,doll,dt);
    dollLight.intensity=gs.dollLooking?3:0;
    if(!player.eliminated) updatePlayer(player,dt);
    camera.position.copy(player.pos);
    camera.rotation.order='YXZ';
    camera.rotation.y=player.yaw; camera.rotation.x=player.pitch;
    if(hudEl) hudEl.innerHTML=hudText;
    flash+=dt;
    if(overlayEl){
      if(gs.phase==='redlight'&&gs.dollLooking)
        overlayEl.style.background=`rgba(255,0,50,${0.12+0.06*Math.sin(flash*8)})`;
      else if(gs.phase==='greenlight') overlayEl.style.background='rgba(0,168,107,0.05)';
      else overlayEl.style.background='transparent';
    }
    renderer.render(scene,camera);
  };
  animate();

  window.render_game_to_text=():string=>JSON.stringify({
    mode:'squidgame-voxel', phase:gs.phase, health:player.health,
    eliminated:player.eliminated, survivors:gs.survivors,
    playerPos:{x:Math.round(player.pos.x),y:Math.round(player.pos.y),z:Math.round(player.pos.z)},
  });
  window.advanceTime=(ms:number):void=>{
    const steps=Math.max(1,Math.round(ms/(1000/60)));
    for(let i=0;i<steps;i++){updatePlayer(player,1/60);updateGuards(guards,1/60);}
    renderer.render(scene,camera);
  };

  return ()=>{
    cancelAnimationFrame(raf);
    canvas.removeEventListener('click',onPD);
    document.removeEventListener('pointerlockchange',onPLC);
    document.removeEventListener('mousemove',onMM);
    document.removeEventListener('keydown',onKD);
    document.removeEventListener('keyup',onKU);
    window.removeEventListener('resize',onResize);
    scene.traverse((o)=>{
      const m=o as Mesh; if(m.geometry) m.geometry.dispose();
      const mt=m.material; if(mt){if(Array.isArray(mt))mt.forEach(x=>(x as MeshStandardMaterial).dispose());else(mt as MeshStandardMaterial).dispose();}
    });
    renderer.dispose();
    delete window.render_game_to_text; delete window.advanceTime;
  };
}

declare global {
  interface Window {
    render_game_to_text?:()=>string;
    advanceTime?:(ms:number)=>void;
  }
}
