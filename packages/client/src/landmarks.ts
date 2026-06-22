import { BLOCK, type BlockId } from '@sg100/shared';
import { setBlock, getElevation, rebuildWorldMesh } from './scene.js';
import type { Scene } from 'three';

export type LandmarkType = 'eiffel_tower' | 'niagara_falls' | 'white_house' | 'taj_mahal';

interface LandmarkDef {
  name: string;
  lat: number;
  lng: number;
  type: LandmarkType;
}

const EARTH_CIRCUM_FT = 131_000_000;
const BLOCKS_PER_DEGREE = EARTH_CIRCUM_FT / 360;
const LANDMARKS: LandmarkDef[] = [
  { name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, type: 'eiffel_tower' },
  { name: 'Niagara Falls', lat: 43.0799, lng: -79.0747, type: 'niagara_falls' },
  { name: 'White House', lat: 38.8977, lng: -77.0365, type: 'white_house' },
  { name: 'Taj Mahal', lat: 27.1751, lng: 78.0421, type: 'taj_mahal' },
];

export function latLngToBlock(lat: number, lng: number): [x: number, z: number] {
  const latRad = lat * Math.PI / 180;
  const x = Math.round(lng * BLOCKS_PER_DEGREE * Math.cos(latRad));
  const z = Math.round(-lat * BLOCKS_PER_DEGREE);
  return [x, z];
}

function fillBox(cx: number, cy: number, cz: number, w: number, h: number, d: number, blockId: BlockId): void {
  for (let dx = -Math.floor(w / 2); dx < Math.ceil(w / 2); dx++) {
    for (let dy = 0; dy < h; dy++) {
      for (let dz = -Math.floor(d / 2); dz < Math.ceil(d / 2); dz++) {
        setBlock(cx + dx, cy + dy, cz + dz, blockId);
      }
    }
  }
}

function fillHollowBox(cx: number, cy: number, cz: number, w: number, h: number, d: number, blockId: BlockId): void {
  for (let dx = -Math.floor(w / 2); dx < Math.ceil(w / 2); dx++) {
    for (let dy = 0; dy < h; dy++) {
      for (let dz = -Math.floor(d / 2); dz < Math.ceil(d / 2); dz++) {
        if (dx === -Math.floor(w / 2) || dx === Math.ceil(w / 2) - 1 ||
            dy === 0 || dy === h - 1 ||
            dz === -Math.floor(d / 2) || dz === Math.ceil(d / 2) - 1) {
          setBlock(cx + dx, cy + dy, cz + dz, blockId);
        }
      }
    }
  }
}

function fillSphere(cx: number, cy: number, cz: number, r: number, blockId: BlockId): void {
  for (let dx = -r; dx <= r; dx++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dz = -r; dz <= r; dz++) {
        if (dx * dx + dy * dy + dz * dz <= r * r) {
          setBlock(cx + dx, cy + dy, cz + dz, blockId);
        }
      }
    }
  }
}

function fillColumn(cx: number, cz: number, baseY: number, height: number, radius: number, blockId: BlockId): void {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        if (dx * dx + dz * dz <= radius * radius) {
          setBlock(cx + dx, baseY + dy, cz + dz, blockId);
        }
      }
    }
  }
}

function placeEiffelTower(cx: number, groundY: number, cz: number): void {
  const totalH = 200;
  const legBaseSpread = 10;
  const legSize = 3;

  for (let y = 0; y < totalH; y++) {
    const progress = y / totalH;
    const spread = Math.round(legBaseSpread * (1 - progress * 0.92));
    const size = Math.max(1, Math.round(legSize * (1 - progress * 0.75)));

    for (let dx = -spread; dx < -spread + size; dx++) {
      for (let dz = -spread; dz < -spread + size; dz++) {
        setBlock(cx + dx, groundY + y, cz + dz, BLOCK.IRON_BLOCK);
        setBlock(cx - dx, groundY + y, cz + dz, BLOCK.IRON_BLOCK);
        setBlock(cx + dx, groundY + y, cz - dz, BLOCK.IRON_BLOCK);
        setBlock(cx - dx, groundY + y, cz - dz, BLOCK.IRON_BLOCK);
      }
    }
  }

  const plat1Y = Math.floor(totalH * 0.33);
  const plat2Y = Math.floor(totalH * 0.66);
  const plat3Y = totalH - 8;

  const filled1 = new Set<string>();
  for (let y = plat1Y - 1; y <= plat1Y; y++) {
    const progress = y / totalH;
    const spread = Math.round(legBaseSpread * (1 - progress * 0.92));
    for (let dx = -spread - 2; dx <= spread + 2; dx++) {
      for (let dz = -spread - 2; dz <= spread + 2; dz++) {
        const key = `${dx},${dz}`;
        if (!filled1.has(key) && !(dx === 0 && dz === 0)) {
          setBlock(cx + dx, groundY + y, cz + dz, BLOCK.GRAY_CONCRETE);
          filled1.add(key);
        }
      }
    }
  }

  const filled2 = new Set<string>();
  for (let y = plat2Y - 1; y <= plat2Y; y++) {
    const progress = y / totalH;
    const spread = Math.round(legBaseSpread * (1 - progress * 0.92));
    for (let dx = -spread - 1; dx <= spread + 1; dx++) {
      for (let dz = -spread - 1; dz <= spread + 1; dz++) {
        const key = `${dx},${dz}`;
        if (!filled2.has(key)) {
          setBlock(cx + dx, groundY + y, cz + dz, BLOCK.GRAY_CONCRETE);
          filled2.add(key);
        }
      }
    }
  }

  const filled3 = new Set<string>();
  for (let y = plat3Y - 1; y <= plat3Y; y++) {
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = -4; dz <= 4; dz++) {
        const key = `${dx},${dz}`;
        if (!filled3.has(key)) {
          setBlock(cx + dx, groundY + y, cz + dz, BLOCK.GRAY_CONCRETE);
          filled3.add(key);
        }
      }
    }
  }

  for (let y = totalH; y < totalH + 30; y++) {
    setBlock(cx, groundY + y, cz, BLOCK.GOLD_BLOCK);
  }
}

function placeNiagaraFalls(cx: number, groundY: number, cz: number): void {
  const width = 100;
  const fallH = 30;
  const halfW = Math.floor(width / 2);

  for (let i = -halfW; i <= halfW; i++) {
    const t = i / halfW;
    const offset = Math.round(15 * (1 - t * t));
    const x = cx + i;
    const z = cz + offset;

    for (let dy = 0; dy < fallH; dy++) {
      setBlock(x, groundY + dy, z, BLOCK.WATER);
    }

    for (let dy = 0; dy <= fallH + 5; dy++) {
      setBlock(x, groundY + dy, cz + offset + 4, BLOCK.MOSSY_COBBLESTONE);
      setBlock(x, groundY + dy, cz + offset - 2, BLOCK.MOSSY_COBBLESTONE);
    }

    for (let dy = 0; dy < 6; dy++) {
      setBlock(x, groundY + fallH + 1 + dy, cz + offset, BLOCK.MOSSY_COBBLESTONE);
      setBlock(x, groundY + fallH + 1 + dy, cz + offset + 1, BLOCK.MOSSY_COBBLESTONE);
    }
  }

  for (let dy = 0; dy < fallH; dy++) {
    for (let i = -20; i <= 20; i += 4) {
      for (let j = 0; j < 3; j++) {
        setBlock(cx + i, groundY + dy, cz - 10 + j, BLOCK.LIGHT_BLUE_STAINED_GLASS);
      }
    }
  }
}

function placeWhiteHouse(cx: number, groundY: number, cz: number): void {
  const w = 60;
  const d = 30;
  const h = 40;
  const hw = Math.floor(w / 2);
  const hd = Math.floor(d / 2);

  fillHollowBox(cx, groundY, cz, w, h, d, BLOCK.QUARTZ_BLOCK);

  const porticoD = 8;
  const porticoW = 14;
  const phw = Math.floor(porticoW / 2);
  for (let dx = -phw; dx <= phw; dx++) {
    fillColumn(cx + dx, cz + hd + 2, groundY, h - 2, 1, BLOCK.WHITE_CONCRETE);
  }

  for (let dx = -phw; dx <= phw; dx++) {
    fillBox(cx + dx, groundY + h - 2, cz + hd + 2, 1, 2, porticoD, BLOCK.WHITE_CONCRETE);
  }

  fillBox(cx, groundY + h - 1, cz, w + 2, 2, d + porticoD + 2, BLOCK.WHITE_CONCRETE);

  const wingW = 15;
  for (let side = -1; side <= 1; side += 2) {
    fillHollowBox(cx + side * Math.floor((w + wingW) / 2), groundY, cz, wingW, h - 5, d - 4, BLOCK.QUARTZ_BLOCK);
    fillBox(cx + side * Math.floor((w + wingW) / 2), groundY + h - 6, cz, wingW, 1, d - 3, BLOCK.WHITE_CONCRETE);
  }

  for (let dy = 1; dy < h - 1; dy += 5) {
    for (let dx = -hw + 2; dx <= hw - 2; dx += 4) {
      setBlock(cx + dx, groundY + dy, cz - hd, BLOCK.GLASS);
      setBlock(cx + dx, groundY + dy, cz + hd, BLOCK.GLASS);
    }
    for (let dz = -hd + 2; dz <= hd - 2; dz += 4) {
      setBlock(cx - hw, groundY + dy, cz + dz, BLOCK.GLASS);
      setBlock(cx + hw, groundY + dy, cz + dz, BLOCK.GLASS);
    }
  }
}

function placeTajMahal(cx: number, groundY: number, cz: number): void {
  const baseW = 40;
  const baseD = 40;
  const baseH = 5;
  const hw = Math.floor(baseW / 2);
  const hd = Math.floor(baseD / 2);

  fillBox(cx, groundY, cz, baseW, baseH, baseD, BLOCK.SMOOTH_STONE);

  fillBox(cx, groundY + baseH, cz, baseW - 4, 20, baseD - 4, BLOCK.QUARTZ_BLOCK);

  for (let dy = 0; dy < 4; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        setBlock(cx + dx, groundY + baseH + 2 + dy, cz + hd - 1 + dz, BLOCK.AIR);
      }
    }
  }

  for (let dx = -2; dx <= 2; dx++) {
    setBlock(cx + dx, groundY + baseH + 1, cz + hd, BLOCK.IRON_BARS);
    setBlock(cx + dx, groundY + baseH + 3, cz + hd, BLOCK.IRON_BARS);
  }

  fillSphere(cx, groundY + baseH + 20, cz, 20, BLOCK.QUARTZ_BLOCK);

  for (let y = groundY + baseH + 20 + 15; y < groundY + baseH + 20 + 20; y++) {
    setBlock(cx, y, cz, BLOCK.GOLD_BLOCK);
  }

  const minaretsRadius = 2;
  const minaretH = 80;
  const minaretSpread = 22;
  const corners: [number, number][] = [
    [-minaretSpread, -minaretSpread],
    [-minaretSpread, minaretSpread],
    [minaretSpread, -minaretSpread],
    [minaretSpread, minaretSpread],
  ];

  for (const [dx, dz] of corners) {
    fillColumn(cx + dx, cz + dz, groundY, minaretH, minaretsRadius, BLOCK.QUARTZ_BLOCK);
    fillSphere(cx + dx, groundY + minaretH, cz + dz, 4, BLOCK.QUARTZ_BLOCK);

    for (let y = groundY + minaretH + 4; y < groundY + minaretH + 8; y++) {
      setBlock(cx + dx, y, cz + dz, BLOCK.GOLD_BLOCK);
    }
  }

  for (let dx = -hw + 4; dx <= hw - 4; dx += 4) {
    for (let f = 1; f <= 3; f++) {
      setBlock(cx + dx, groundY + baseH + 3 + f * 4, cz - hd + 4, BLOCK.QUARTZ_BLOCK);
    }
  }

  for (let i = -hw + 4; i <= hw - 4; i += 6) {
    setBlock(cx + i, groundY + baseH + 3, cz - hd + 3, BLOCK.QUARTZ_BLOCK);
    setBlock(cx + i, groundY + baseH + 7, cz - hd + 3, BLOCK.QUARTZ_BLOCK);
    setBlock(cx + i, groundY + baseH + 11, cz - hd + 3, BLOCK.QUARTZ_BLOCK);
  }
}

export function placeLandmarkStructure(cx: number, groundY: number, cz: number, type: LandmarkType): void {
  switch (type) {
    case 'eiffel_tower':
      placeEiffelTower(cx, groundY, cz);
      break;
    case 'niagara_falls':
      placeNiagaraFalls(cx, groundY, cz);
      break;
    case 'white_house':
      placeWhiteHouse(cx, groundY, cz);
      break;
    case 'taj_mahal':
      placeTajMahal(cx, groundY, cz);
      break;
  }
}

export function placeAllLandmarks(scene: Scene): void {
  for (const lm of LANDMARKS) {
    const [wx, wz] = latLngToBlock(lm.lat, lm.lng);
    const groundY = getElevation(wx, wz);
    placeLandmarkStructure(wx, groundY, wz, lm.type);
  }
  rebuildWorldMesh(scene);
}
