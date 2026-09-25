export const CHUNK = 16;
export const HEIGHT = 128;
export const SEA = 52;
export const AREA = CHUNK * CHUNK;
export const VOLUME = AREA * HEIGHT;

export const STRIDE = 14;

export function idx(x, y, z) {
  return x + (z << 4) + (y << 8);
}

export function inLocal(x, y, z) {
  return x >= 0 && x < CHUNK && z >= 0 && z < CHUNK && y >= 0 && y < HEIGHT;
}

export const DIM = {
  OVERWORLD: 0,
  EMBER: 1,
  AETHER: 2,
};

export const DIM_NAME = ["Overworld", "Emberdepth", "Aetherisle"];

export const FLAG = {
  FOLIAGE: 1,
  CUTOUT: 2,
  LAVA: 4,
  TINT: 16,
  METAL: 32,
  GLASS: 64,
  DOUBLE: 128,
};

export const BALANCE = {
  gravity: 28,
  jump: 8.85,
  walk: 4.35,
  sprint: 6.85,
  crouch: 1.7,
  swim: 3.15,
  fly: 14,
  climb: 3.4,
  reach: 5.2,
  creativeReach: 8,
  eye: 1.62,
  height: 1.74,
  crouchHeight: 1.28,
  width: 0.6,
  staminaMax: 100,
  healthMax: 20,
  hungerMax: 20,
};

export function chunkKey(cx, cz, dim = 0) {
  return dim + ":" + cx + ":" + cz;
}

export function worldToChunk(n) {
  return Math.floor(n) >> 4;
}

export function worldToLocal(n) {
  return Math.floor(n) & 15;
}
