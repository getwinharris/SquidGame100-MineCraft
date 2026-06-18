/**
 * Stage 0 placeholder scene.
 *
 * Renders a themed ground plane and a slowly rotating "guard mask" sphere in
 * the Squid Game palette. The real voxel engine (chunked world, greedy meshing
 * in a worker) replaces this in Stage 1; the signature here (`createScene`)
 * stays stable so the entry point does not change.
 */

import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from 'three';

const PINK = 0xff2d6f;
const GREEN = 0x00a86b;
const INK = 0x0b1f3a;

/**
 * Boot the render loop onto the given canvas. Returns a teardown that cancels
 * animation and disposes GPU resources — called on HMR dispose in dev.
 */
export function createScene(canvas: HTMLCanvasElement): () => void {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene: Scene = new Scene();
  scene.background = new Color(INK);
  scene.fog = new Fog(INK, 18, 60);

  const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 3, 8);
  camera.lookAt(0, 1, 0);

  const ambient = new AmbientLight(0xffffff, 0.55);
  scene.add(ambient);

  const sun = new DirectionalLight(0xffffff, 1.1);
  sun.position.set(5, 10, 4);
  scene.add(sun);

  // Themed ground (green tracksuit turf).
  const ground = new Mesh(
    new PlaneGeometry(60, 60),
    new MeshStandardMaterial({ color: GREEN, roughness: 0.9 }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Placeholder "guard" orb — pink, slowly rotating. A stand-in for the
  // Young-hee doll and guard NPCs that arrive in Stage 2.
  const guard = new Mesh(
    new SphereGeometry(1.4, 32, 24),
    new MeshStandardMaterial({ color: PINK, roughness: 0.5, metalness: 0.1 }),
  );
  guard.position.set(0, 1.6, 0);
  scene.add(guard);

  const onResize = (): void => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };
  window.addEventListener('resize', onResize);

  let raf = 0;
  let elapsed = 0;

  const update = (dt: number): void => {
    elapsed += dt;
    guard.rotation.y = elapsed * 0.5;
    guard.position.y = 1.6 + Math.sin(elapsed * 1.4) * 0.15;
    camera.position.x = Math.sin(elapsed * 0.2) * 8;
    camera.lookAt(0, 1.4, 0);
  };

  const render = (): void => {
    renderer.render(scene, camera);
  };

  window.render_game_to_text = (): string =>
    JSON.stringify({
      coordinateSystem: 'world units; origin at arena center; +x right, +y up, +z toward camera start',
      mode: 'stage0-foundation',
      camera: {
        x: round(camera.position.x),
        y: round(camera.position.y),
        z: round(camera.position.z),
      },
      entities: [
        {
          id: 'guard-placeholder',
          kind: 'sphere',
          x: round(guard.position.x),
          y: round(guard.position.y),
          z: round(guard.position.z),
          color: 'pink',
        },
      ],
      networkHud: document.getElementById('status')?.textContent ?? '',
    });

  window.advanceTime = (ms: number): void => {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i++) update(1 / 60);
    render();
  };

  const animate = (): void => {
    raf = requestAnimationFrame(animate);
    update(1 / 60);
    render();
  };
  animate();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    scene.traverse((o) => {
      const m = o as Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as MeshStandardMaterial | undefined;
      if (mat) {
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat.dispose();
      }
    });
    const r = renderer as WebGLRenderer;
    r.dispose();
    delete window.render_game_to_text;
    delete window.advanceTime;
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}
