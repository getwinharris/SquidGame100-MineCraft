/**
 * Wiki-format JSON block model and blockstate types.
 * Matches the Minecraft Wiki schema for JSON resources.
 * See: https://minecraft.wiki/w/Model
 */

/** A texture reference like "#all" or "minecraft:block/stone" */
export type TextureRef = string;

/** A face direction key */
export type FaceDirection = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';

/** UV coordinates [x1, y1, x2, y2] in 16ths of a block */
export type UV = [number, number, number, number];

/** Rotation in 90-degree increments */
export type Rotation90 = 0 | 90 | 180 | 270;

/** Rotation in 45-degree increments for display transforms */
export type Rotation45 = -45 | -22 | 0 | 22 | 45;

/** Face definition in a block model element */
export interface BlockFace {
  texture?: TextureRef;
  uv?: UV;
  cullface?: FaceDirection;
  tintindex?: number;
  rotation?: Rotation90;
}

/** An element (cuboid) in a block model */
export interface BlockElement {
  from: [number, number, number];
  to: [number, number, number];
  rotation?: {
    origin: [number, number, number];
    axis: 'x' | 'y' | 'z';
    angle: Rotation90;
    rescale?: boolean;
  };
  shade?: boolean;
  faces?: Partial<Record<FaceDirection, BlockFace>>;
}

/** Display transform for item/block rendering */
export interface DisplayTransform {
  rotation?: [number, number, number];
  translation?: [number, number, number];
  scale?: [number, number, number];
}

/** A Minecraft Wiki JSON block model */
export interface BlockModel {
  parent?: string;
  textures?: Record<string, TextureRef>;
  elements?: BlockElement[];
  display?: Record<string, DisplayTransform>;
  ambientocclusion?: boolean;
}

/** A variant in a blockstate file */
export interface BlockStateVariant {
  model: string;
  x?: Rotation90;
  y?: Rotation90;
  uvlock?: boolean;
  weight?: number;
}

/** A multipart case in a blockstate file */
export interface BlockStateMultipartCase {
  when?: Record<string, string | string[]>;
  apply: BlockStateVariant | BlockStateVariant[];
}

/** A Minecraft Wiki JSON blockstate file */
export interface BlockState {
  variants?: Record<string, BlockStateVariant | BlockStateVariant[]>;
  multipart?: BlockStateMultipartCase[];
}

/** Runtime info for a registered block */
export interface BlockInfo {
  id: number;
  name: string;
  namespace: string;
  model: BlockModel;
  state: BlockState;
  transparent: boolean;
  solid: boolean;
  liquid: boolean;
  lightLevel: number;
  hardness: number;
  resistance: number;
  requiresTool: boolean;
  jumpFactor: number;
  speedFactor: number;
}

/** Registry of all block models and states */
export class BlockRegistry {
  private models = new Map<string, BlockModel>();
  private states = new Map<string, BlockState>();
  private info = new Map<string, BlockInfo>();
  private idToName = new Map<number, string>();
  private nameToId = new Map<string, number>();

  register(id: number, name: string, model: BlockModel, state: BlockState): void {
    this.models.set(name, model);
    this.states.set(name, state);
    this.idToName.set(id, name);
    this.nameToId.set(name, id);

    const [namespace, localName] = name.includes(':') ? name.split(':') : ['minecraft', name];
    this.info.set(name, {
      id,
      name: localName,
      namespace,
      model,
      state,
      transparent: false,
      solid: true,
      liquid: false,
      lightLevel: 0,
      hardness: 0,
      resistance: 0,
      requiresTool: false,
      jumpFactor: 1.0,
      speedFactor: 1.0,
    });
  }

  getModel(name: string): BlockModel | undefined {
    return this.models.get(name);
  }

  getState(name: string): BlockState | undefined {
    return this.states.get(name);
  }

  getInfo(name: string): BlockInfo | undefined {
    return this.info.get(name);
  }

  getInfoById(id: number): BlockInfo | undefined {
    const name = this.idToName.get(id);
    return name ? this.info.get(name) : undefined;
  }

  getId(name: string): number | undefined {
    return this.nameToId.get(name);
  }

  getName(id: number): string | undefined {
    return this.idToName.get(id);
  }

  has(name: string): boolean {
    return this.models.has(name);
  }

  hasId(id: number): boolean {
    return this.idToName.has(id);
  }

  resolveTexture(modelName: string, textureKey: string): string | undefined {
    const model = this.models.get(modelName);
    if (!model) return undefined;
    if (model.textures?.[textureKey]) {
      const ref = model.textures[textureKey];
      if (ref.startsWith('#')) {
        return this.resolveTexture(modelName, ref.slice(1));
      }
      return ref;
    }
    if (model.parent) {
      return this.resolveTexture(model.parent, textureKey);
    }
    return undefined;
  }
}

/** Shared singleton registry */
export const blockRegistry = new BlockRegistry();
