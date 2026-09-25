import { CHUNK, HEIGHT, idx } from "../engine/constants.js";
import { BlockId, OPACITY, EMIT } from "../blocks/registry.js";

const DIRS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

export function propagateSkyLight(chunk, neighbors) {
  const { blocks, sky } = chunk;
  const queue = [];
  let head = 0;

  for (let z = 0; z < CHUNK; z++) {
    for (let x = 0; x < CHUNK; x++) {
      let light = 15;
      for (let y = HEIGHT - 1; y >= 0; y--) {
        const i = idx(x, y, z);
        const t = blocks[i] & 0x3ff;
        if (t === 0 || t === BlockId.SNOW_CAP) {
          if (sky[i] < light) sky[i] = light;
        } else {
          const op = OPACITY[t] ?? 15;
          if (op >= 15) light = 0;
          else if (light > 0) light = Math.max(0, light - Math.max(1, op));
          sky[i] = 0;
        }
        if (sky[i] > 0) queue.push(i);
      }
    }
  }

  while (head < queue.length) {
    const cur = queue[head++];
    const lvl = sky[cur];
    if (lvl <= 1) continue;
    const x = cur & 15;
    const z = (cur >> 4) & 15;
    const y = cur >> 8;
    for (const [dx, dy, dz] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const nz = z + dz;
      if (ny < 0 || ny >= HEIGHT) continue;
      if (nx >= 0 && nx < CHUNK && nz >= 0 && nz < CHUNK) {
        const ni = idx(nx, ny, nz);
        if (sky[ni] >= lvl - 1) continue;
        const nt = blocks[ni] & 0x3ff;
        if (nt !== 0) {
          const op = OPACITY[nt] ?? 15;
          if (op >= 15) continue;
          if (op > 1 && lvl - 1 - op < 1) continue;
        }
        const nextLvl = Math.max(0, lvl - 1 - (nt === 0 ? 0 : OPACITY[nt] ?? 0));
        if (nextLvl <= 0) continue;
        if (nextLvl > sky[ni]) {
          sky[ni] = nextLvl;
          queue.push(ni);
        }
      } else {
        const nb = neighborAt(neighbors, nx, nz);
        if (!nb) continue;
        const nnx = (nx + CHUNK) & 15;
        const nnz = (nz + CHUNK) & 15;
        const ni = idx(nnx, ny, nnz);
        if (nb.sky[ni] >= lvl - 1) continue;
        const nt = nb.blocks[ni] & 0x3ff;
        if (nt !== 0) {
          const op = OPACITY[nt] ?? 15;
          if (op >= 15) continue;
        }
        const nextLvl = Math.max(0, lvl - 1);
        if (nextLvl > nb.sky[ni]) {
          nb.sky[ni] = nextLvl;
        }
      }
    }
  }
}

export function propagateBlockLight(chunk, neighbors) {
  const { blocks, light } = chunk;
  light.fill(0);
  const queue = [];
  let head = 0;
  for (let i = 0; i < blocks.length; i++) {
    const t = blocks[i] & 0x3ff;
    const e = EMIT[t] ?? 0;
    if (e > 0) {
      light[i] = e;
      queue.push(i);
    }
  }
  while (head < queue.length) {
    const cur = queue[head++];
    const lvl = light[cur];
    if (lvl <= 1) continue;
    const x = cur & 15;
    const z = (cur >> 4) & 15;
    const y = cur >> 8;
    for (const [dx, dy, dz] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      const nz = z + dz;
      if (ny < 0 || ny >= HEIGHT) continue;
      if (nx >= 0 && nx < CHUNK && nz >= 0 && nz < CHUNK) {
        const ni = idx(nx, ny, nz);
        if (light[ni] >= lvl - 1) continue;
        const nt = blocks[ni] & 0x3ff;
        if (nt !== 0) {
          const op = OPACITY[nt] ?? 15;
          if (op >= 15) continue;
        }
        const nextLvl = lvl - 1 - (OPACITY[blocks[ni] & 0x3ff] ?? 0) * 0.15;
        const nl = Math.floor(nextLvl);
        if (nl <= 0) continue;
        if (nl > light[ni]) {
          light[ni] = nl;
          queue.push(ni);
        }
      } else {
        const nb = neighborAt(neighbors, nx, nz);
        if (!nb) continue;
        const nnx = (nx + CHUNK) & 15;
        const nnz = (nz + CHUNK) & 15;
        const ni = idx(nnx, ny, nnz);
        if (nb.light[ni] >= lvl - 1) continue;
        const nt = nb.blocks[ni] & 0x3ff;
        if (nt !== 0) {
          const op = OPACITY[nt] ?? 15;
          if (op >= 15) continue;
        }
        const nl = lvl - 1;
        if (nl > nb.light[ni]) nb.light[ni] = nl;
      }
    }
  }
}

function neighborAt(neighbors, x, z) {
  if (!neighbors) return null;
  if (x < 0 && z < 0) return neighbors.nxnz;
  if (x < 0 && z >= CHUNK) return neighbors.nxpz;
  if (x >= CHUNK && z < 0) return neighbors.pxnz;
  if (x >= CHUNK && z >= CHUNK) return neighbors.pxpz;
  if (x < 0) return neighbors.nx;
  if (x >= CHUNK) return neighbors.px;
  if (z < 0) return neighbors.nz;
  if (z >= CHUNK) return neighbors.pz;
  return null;
}

export function relightColumn(chunk) {
  const { blocks, sky } = chunk;
  for (let z = 0; z < CHUNK; z++) {
    for (let x = 0; x < CHUNK; x++) {
      let light = 15;
      for (let y = HEIGHT - 1; y >= 0; y--) {
        const i = idx(x, y, z);
        const t = blocks[i] & 0x3ff;
        if (t === 0) {
          sky[i] = light;
        } else {
          const op = OPACITY[t] ?? 15;
          if (op >= 15) light = 0;
          else light = Math.max(0, light - Math.max(1, op));
          sky[i] = 0;
        }
      }
    }
  }
}

export function computeAO(neighborSolid) {
  const s1 = neighborSolid[0] ? 1 : 0;
  const s2 = neighborSolid[1] ? 1 : 0;
  const s3 = neighborSolid[2] ? 1 : 0;
  if (s1 && s2) return 0;
  return 3 - (s1 + s2 + s3);
}
