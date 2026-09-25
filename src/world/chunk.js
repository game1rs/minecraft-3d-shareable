import { CHUNK, HEIGHT, VOLUME, idx, SEA } from "../engine/constants.js";
import { BlockId } from "../blocks/registry.js";

export class ChunkColumn {
  constructor(cx, cz, dim = 0) {
    this.cx = cx;
    this.cz = cz;
    this.dim = dim;
    this.x = cx * CHUNK;
    this.z = cz * CHUNK;
    this.blocks = new Uint16Array(VOLUME);
    this.light = new Uint8Array(VOLUME);
    this.sky = new Uint8Array(VOLUME);
    this.biome = new Uint8Array(CHUNK * CHUNK);
    this.height = new Uint8Array(CHUNK * CHUNK);
    this.dirty = true;
    this.built = false;
    this.version = 0;
    this.mesh = null;
    this.lastUsed = 0;
  }

  index(x, y, z) {
    return idx(x, y, z);
  }

  get(x, y, z) {
    if (x < 0 || x >= CHUNK || z < 0 || z >= CHUNK || y < 0 || y >= HEIGHT) return 0;
    return this.blocks[idx(x, y, z)];
  }

  set(x, y, z, id) {
    if (x < 0 || x >= CHUNK || z < 0 || z >= CHUNK || y < 0 || y >= HEIGHT) return;
    const i = idx(x, y, z);
    if (this.blocks[i] === id) return;
    this.blocks[i] = id;
    this.dirty = true;
    this.version++;
    const hIdx = x + (z << 4);
    if (y >= this.height[hIdx] && (id & 0x3ff) !== 0) this.height[hIdx] = y;
    else if (y === this.height[hIdx] && (id & 0x3ff) === 0) {
      for (let yy = y - 1; yy >= 0; yy--) {
        if ((this.blocks[idx(x, yy, z)] & 0x3ff) !== 0) {
          this.height[hIdx] = yy;
          break;
        }
        if (yy === 0) this.height[hIdx] = 0;
      }
    }
  }

  getHeightLocal(lx, lz) {
    return this.height[lx + (lz << 4)] | 0;
  }

  fillAir() {
    this.blocks.fill(0);
    this.light.fill(0);
    this.sky.fill(0);
    this.biome.fill(0);
    this.height.fill(0);
  }

  toTransfer() {
    return {
      cx: this.cx,
      cz: this.cz,
      dim: this.dim,
      x: this.x,
      z: this.z,
      blocks: this.blocks,
      light: this.light,
      sky: this.sky,
      biome: this.biome,
      height: this.height,
      version: this.version,
    };
  }

  static fromTransfer(t) {
    const c = new ChunkColumn(t.cx, t.cz, t.dim);
    c.blocks = t.blocks instanceof Uint16Array ? t.blocks : new Uint16Array(t.blocks);
    c.light = t.light instanceof Uint8Array ? t.light : new Uint8Array(t.light);
    c.sky = t.sky instanceof Uint8Array ? t.sky : new Uint8Array(t.sky);
    c.biome = t.biome instanceof Uint8Array ? t.biome : new Uint8Array(t.biome);
    c.height = t.height instanceof Uint8Array ? t.height : new Uint8Array(t.height);
    c.version = t.version | 0;
    c.dirty = true;
    return c;
  }
}

export function emptyNeighbor() {
  const b = new Uint16Array(VOLUME);
  const l = new Uint8Array(VOLUME);
  const s = new Uint8Array(VOLUME);
  s.fill(0);
  return { blocks: b, light: l, sky: s };
}
