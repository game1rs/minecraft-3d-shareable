import { CHUNK, HEIGHT, idx } from "../engine/constants.js";
import { BlockId, getBlockDef, faceTileKey, materialFlag, OPACITY } from "../blocks/registry.js";

const STRIDE = 14;

function isOpaque(t) {
  if (t === 0) return false;
  const op = OPACITY[t] ?? 15;
  return op >= 14;
}

function isSolidForFace(t) {
  if (t === 0) return false;
  const def = getBlockDef(t);
  if (!def) return false;
  if (def.render === "none") return false;
  if (def.collision === "none") return false;
  if (def.render === "water") return false;
  if (def.render === "glass") return false;
  if (def.render === "cutout" || def.render === "cross") return false;
  return true;
}

function getBlockAt(chunk, neighbors, x, y, z) {
  if (y < 0 || y >= HEIGHT) return 0;
  if (x >= 0 && x < CHUNK && z >= 0 && z < CHUNK) {
    return chunk.blocks[idx(x, y, z)];
  }
  const nb = neighborAt(neighbors, x, z);
  if (!nb) return 0;
  const lx = (x + CHUNK) & 15;
  const lz = (z + CHUNK) & 15;
  return nb.blocks[idx(lx, y, lz)];
}

function getLightAt(chunk, neighbors, x, y, z, which) {
  if (y < 0 || y >= HEIGHT) return which === "sky" ? 15 : 0;
  if (x >= 0 && x < CHUNK && z >= 0 && z < CHUNK) {
    const i = idx(x, y, z);
    return which === "sky" ? chunk.sky[i] : chunk.light[i];
  }
  const nb = neighborAt(neighbors, x, z);
  if (!nb) return which === "sky" ? 15 : 0;
  const lx = (x + CHUNK) & 15;
  const lz = (z + CHUNK) & 15;
  const i = idx(lx, y, lz);
  return which === "sky" ? nb.sky[i] : nb.light[i];
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

function faceVisible(curType, neighborType) {
  if (neighborType === 0) return true;
  const curDef = getBlockDef(curType & 0x3ff);
  const nbDef = getBlockDef(neighborType & 0x3ff);
  if (!curDef || !nbDef) return true;
  if (curDef.render === "water" && nbDef.render === "water") return false;
  if (nbDef.render === "glass" && curDef.render === "glass" && curDef.tile === nbDef.tile) return false;
  if (isOpaque(neighborType & 0x3ff) && curDef.render === "solid" && nbDef.render === "solid") {
    if ((curType & 0x3ff) === (neighborType & 0x3ff)) return false;
    if (isSolidForFace(neighborType & 0x3ff)) return false;
  }
  if (nbDef.render === "none") return true;
  if (curDef.render === "solid" && nbDef.render === "cutout") return true;
  if (nbDef.opacity >= 14) return false;
  return true;
}

function aoForFace(chunk, neighbors, x, y, z, dir) {
  const solid = (ox, oy, oz) => {
    const id = getBlockAt(chunk, neighbors, x + ox, y + oy, z + oz);
    if (id === 0) return false;
    const t = id & 0x3ff;
    const def = getBlockDef(t);
    if (!def) return false;
    if (def.render === "water" || def.render === "glass") return false;
    if (def.render === "cross" || def.render === "cutout") return false;
    if (def.collision === "none") return false;
    return true;
  };
  let ao = [3, 3, 3, 3];
  if (dir === 2) {
    const y1 = 1;
    const c = [
      [solid(-1, y1, 0), solid(0, y1, -1), solid(-1, y1, -1)],
      [solid(1, y1, 0), solid(0, y1, -1), solid(1, y1, -1)],
      [solid(-1, y1, 0), solid(0, y1, 1), solid(-1, y1, 1)],
      [solid(1, y1, 0), solid(0, y1, 1), solid(1, y1, 1)],
    ];
    ao = c.map((v) => {
      if (v[0] && v[1]) return 0;
      return 3 - (v[0] + v[1] + v[2]);
    });
  } else if (dir === 3) {
    const y1 = -1;
    const c = [
      [solid(-1, y1, 0), solid(0, y1, -1), solid(-1, y1, -1)],
      [solid(1, y1, 0), solid(0, y1, -1), solid(1, y1, -1)],
      [solid(-1, y1, 0), solid(0, y1, 1), solid(-1, y1, 1)],
      [solid(1, y1, 0), solid(0, y1, 1), solid(1, y1, 1)],
    ];
    ao = c.map((v) => {
      if (v[0] && v[1]) return 0;
      return 3 - (v[0] + v[1] + v[2]);
    });
  } else if (dir === 0) {
    const x1 = 1;
    const c = [
      [solid(x1, 0, -1), solid(x1, 1, 0), solid(x1, 1, -1)],
      [solid(x1, 0, 1), solid(x1, 1, 0), solid(x1, 1, 1)],
      [solid(x1, 0, -1), solid(x1, -1, 0), solid(x1, -1, -1)],
      [solid(x1, 0, 1), solid(x1, -1, 0), solid(x1, -1, 1)],
    ];
    ao = c.map((v) => (v[0] && v[1] ? 0 : 3 - (v[0] + v[1] + v[2])));
  } else if (dir === 1) {
    const x1 = -1;
    const c = [
      [solid(x1, 0, -1), solid(x1, 1, 0), solid(x1, 1, -1)],
      [solid(x1, 0, 1), solid(x1, 1, 0), solid(x1, 1, 1)],
      [solid(x1, 0, -1), solid(x1, -1, 0), solid(x1, -1, -1)],
      [solid(x1, 0, 1), solid(x1, -1, 0), solid(x1, -1, 1)],
    ];
    ao = c.map((v) => (v[0] && v[1] ? 0 : 3 - (v[0] + v[1] + v[2])));
  } else if (dir === 4) {
    const z1 = 1;
    const c = [
      [solid(-1, 0, z1), solid(0, 1, z1), solid(-1, 1, z1)],
      [solid(1, 0, z1), solid(0, 1, z1), solid(1, 1, z1)],
      [solid(-1, 0, z1), solid(0, -1, z1), solid(-1, -1, z1)],
      [solid(1, 0, z1), solid(0, -1, z1), solid(1, -1, z1)],
    ];
    ao = c.map((v) => (v[0] && v[1] ? 0 : 3 - (v[0] + v[1] + v[2])));
  } else if (dir === 5) {
    const z1 = -1;
    const c = [
      [solid(-1, 0, z1), solid(0, 1, z1), solid(-1, 1, z1)],
      [solid(1, 0, z1), solid(0, 1, z1), solid(1, 1, z1)],
      [solid(-1, 0, z1), solid(0, -1, z1), solid(-1, -1, z1)],
      [solid(1, 0, z1), solid(0, -1, z1), solid(1, -1, z1)],
    ];
    ao = c.map((v) => (v[0] && v[1] ? 0 : 3 - (v[0] + v[1] + v[2])));
  }
  return ao;
}

function tileIndexFor(tileMap, key) {
  return tileMap[key] ?? tileMap["stone"] ?? 0;
}

export function meshChunk(chunk, neighbors, tileMap) {
  const verts = [];
  const buckets = {
    solid: [],
    cutout: [],
    glass: [],
    water: [],
    cross: [],
    model: [],
  };

  const faceBuffer = new Array(CHUNK * CHUNK).fill(0);
  const visited = new Uint8Array(CHUNK * CHUNK);

  for (let y = 0; y < HEIGHT; y++) {
    for (let dir = 0; dir < 6; dir++) {
      const axis = dir < 2 ? 0 : dir < 4 ? 1 : 2;
      if (axis !== 1) continue;
      const mask = [];
      for (let z = 0; z < CHUNK; z++) {
        for (let x = 0; x < CHUNK; x++) {
          const i = idx(x, y, z);
          const id = chunk.blocks[i];
          if (id === 0) {
            mask[x + z * CHUNK] = 0;
            continue;
          }
          const t = id & 0x3ff;
          const def = getBlockDef(t);
          if (!def || def.render !== "solid") {
            mask[x + z * CHUNK] = 0;
            continue;
          }
          const nx = x + (dir === 0 ? 1 : dir === 1 ? -1 : 0);
          const ny = y + (dir === 2 ? 1 : dir === 3 ? -1 : 0);
          const nz = z + (dir === 4 ? 1 : dir === 5 ? -1 : 0);
          const nid = getBlockAt(chunk, neighbors, nx, ny, nz);
          if (!faceVisible(id, nid)) {
            mask[x + z * CHUNK] = 0;
            continue;
          }
          const tileKey = faceTileKey(def, id >> 10, dir);
          const tileId = tileIndexFor(tileMap, tileKey);
          const skyL = getLightAt(chunk, neighbors, nx, ny, nz, "sky");
          const blkL = getLightAt(chunk, neighbors, nx, ny, nz, "block");
          const biome = chunk.biome[x + (z << 4)] & 0x1f;
          const flag = materialFlag(def);
          const key = (tileId << 12) | (skyL << 8) | (blkL << 4) | (biome << 0) | (flag << 16);
          mask[x + z * CHUNK] = key | (id ? 0x80000000 : 0);
        }
      }
      visited.fill(0);
      for (let z = 0; z < CHUNK; z++) {
        for (let x = 0; x < CHUNK; x++) {
          const idxMask = x + z * CHUNK;
          if (visited[idxMask]) continue;
          const val = mask[idxMask];
          if (!val) continue;
          let w = 1;
          while (x + w < CHUNK && !visited[x + w + z * CHUNK] && mask[x + w + z * CHUNK] === val) w++;
          let h = 1;
          outer: while (z + h < CHUNK) {
            for (let k = 0; k < w; k++) {
              const p = x + k + (z + h) * CHUNK;
              if (visited[p] || mask[p] !== val) break outer;
            }
            h++;
          }
          for (let zz = 0; zz < h; zz++) {
            for (let xx = 0; xx < w; xx++) visited[x + xx + (z + zz) * CHUNK] = 1;
          }
          const tileId = (val >> 12) & 0xfff;
          const skyL = (val >> 8) & 0xf;
          const blkL = (val >> 4) & 0xf;
          const biome = val & 0x1f;
          const flag = (val >> 16) & 0xff;
          emitQuad(
            buckets.solid,
            x,
            y,
            z,
            w,
            h,
            dir,
            tileId,
            skyL,
            blkL,
            biome,
            flag,
            [3, 3, 3, 3]
          );
        }
      }
    }
  }

  for (let y = 0; y < HEIGHT; y++) {
    for (let z = 0; z < CHUNK; z++) {
      for (let x = 0; x < CHUNK; x++) {
        const i = idx(x, y, z);
        const id = chunk.blocks[i];
        if (!id) continue;
        const t = id & 0x3ff;
        const def = getBlockDef(t);
        if (!def) continue;
        if (def.render === "solid" && (y === 0 || y === HEIGHT - 1 ? false : true)) {
          continue;
        }
        if (def.render === "solid") {
          for (let dir = 0; dir < 6; dir++) {
            if (dir === 2 || dir === 3) continue;
            const nx = x + (dir === 0 ? 1 : dir === 1 ? -1 : 0);
            const ny = y + (dir === 2 ? 1 : dir === 3 ? -1 : 0);
            const nz = z + (dir === 4 ? 1 : dir === 5 ? -1 : 0);
            const nid = getBlockAt(chunk, neighbors, nx, ny, nz);
            if (!faceVisible(id, nid)) continue;
            const tileKey = faceTileKey(def, id >> 10, dir);
            const tileId = tileIndexFor(tileMap, tileKey);
            const skyL = getLightAt(chunk, neighbors, nx, ny, nz, "sky");
            const blkL = getLightAt(chunk, neighbors, nx, ny, nz, "block");
            const biome = chunk.biome[x + (z << 4)] & 0x1f;
            const flag = materialFlag(def);
            const ao = aoForFace(chunk, neighbors, x, y, z, dir);
            emitQuad(buckets.solid, x, y, z, 1, 1, dir, tileId, skyL, blkL, biome, flag, ao);
          }
          continue;
        }
        if (def.render === "cutout" || def.render === "glass") {
          const bucket = def.render === "glass" ? buckets.glass : buckets.cutout;
          for (let dir = 0; dir < 6; dir++) {
            const nx = x + (dir === 0 ? 1 : dir === 1 ? -1 : 0);
            const ny = y + (dir === 2 ? 1 : dir === 3 ? -1 : 0);
            const nz = z + (dir === 4 ? 1 : dir === 5 ? -1 : 0);
            const nid = getBlockAt(chunk, neighbors, nx, ny, nz);
            if ((nid & 0x3ff) === t && def.render !== "glass") continue;
            if (!faceVisible(id, nid)) {
              if (def.render === "cutout") {
                if (isOpaque(nid & 0x3ff)) continue;
              } else {
                if ((nid & 0x3ff) !== 0 && (nid & 0x3ff) !== BlockId.WATER) {
                  if (isOpaque(nid & 0x3ff)) continue;
                }
              }
            }
            const tileKey = faceTileKey(def, id >> 10, dir);
            const tileId = tileIndexFor(tileMap, tileKey);
            const skyL = getLightAt(chunk, neighbors, nx, ny, nz, "sky");
            const blkL = getLightAt(chunk, neighbors, nx, ny, nz, "block");
            const biome = chunk.biome[x + (z << 4)] & 0x1f;
            const flag = materialFlag(def);
            const ao = aoForFace(chunk, neighbors, x, y, z, dir);
            emitQuad(bucket, x, y, z, 1, 1, dir, tileId, skyL, blkL, biome, flag, ao);
          }
          continue;
        }
        if (def.render === "water") {
          const top = getBlockAt(chunk, neighbors, x, y + 1, z) & 0x3ff;
          const isTop = top !== BlockId.WATER;
          for (let dir = 0; dir < 6; dir++) {
            if (dir === 2 && !isTop) continue;
            if (dir === 3) continue;
            const nx = x + (dir === 0 ? 1 : dir === 1 ? -1 : 0);
            const ny = y + (dir === 2 ? 1 : dir === 3 ? -1 : 0);
            const nz = z + (dir === 4 ? 1 : dir === 5 ? -1 : 0);
            const nid = getBlockAt(chunk, neighbors, nx, ny, nz);
            const nt = nid & 0x3ff;
            if (nt === BlockId.WATER) continue;
            if (isOpaque(nt) && dir !== 2) continue;
            const tileKey = "water";
            const tileId = tileIndexFor(tileMap, tileKey);
            const skyL = getLightAt(chunk, neighbors, nx, ny, nz, "sky");
            const blkL = getLightAt(chunk, neighbors, nx, ny, nz, "block");
            const biome = chunk.biome[x + (z << 4)] & 0x1f;
            const flag = materialFlag(def);
            const ao = [3, 3, 3, 3];
            emitQuad(buckets.water, x, y, z, 1, 1, dir, tileId, skyL, blkL, biome, flag, ao, isTop);
          }
          continue;
        }
        if (def.render === "cross") {
          const tileKey = def.tile;
          const tileId = tileIndexFor(tileMap, tileKey);
          const skyL = getLightAt(chunk, neighbors, x, y, z, "sky");
          const blkL = getLightAt(chunk, neighbors, x, y, z, "block");
          const biome = chunk.biome[x + (z << 4)] & 0x1f;
          const flag = materialFlag(def);
          emitCross(buckets.cross, x, y, z, tileId, skyL, blkL, biome, flag);
          continue;
        }
        if (def.render === "model") {
          const bucket = buckets.model;
          const tileKey = def.tile;
          const tileId = tileIndexFor(tileMap, tileKey);
          const skyL = getLightAt(chunk, neighbors, x, y + 1, z, "sky");
          const blkL = getLightAt(chunk, neighbors, x, y + 1, z, "block");
          const biome = chunk.biome[x + (z << 4)] & 0x1f;
          const flag = materialFlag(def);
          const meta = id >> 10;
          emitModel(bucket, x, y, z, def, meta, tileId, skyL, blkL, biome, flag);
          continue;
        }
      }
    }
  }

  function finalize(bucketArr) {
    if (bucketArr.length === 0) return null;
    return new Float32Array(bucketArr);
  }

  return {
    solid: finalize(buckets.solid),
    cutout: finalize(buckets.cutout),
    glass: finalize(buckets.glass),
    water: finalize(buckets.water),
    cross: finalize(buckets.cross),
    model: finalize(buckets.model),
  };
}

function emitQuad(arr, x, y, z, w, h, dir, tile, sky, blockL, biome, flag, ao, isTopWater = false) {
  const x0 = x;
  const y0 = y;
  const z0 = z;
  let x1 = x, y1 = y, z1 = z;
  if (dir === 0) {
    x1 = x + 1;
    y1 = y + h;
    z1 = z + w;
  } else if (dir === 1) {
    x1 = x + 1;
    y1 = y + h;
    z1 = z + w;
  } else if (dir === 2) {
    x1 = x + w;
    y1 = y + 1;
    z1 = z + h;
  } else if (dir === 3) {
    x1 = x + w;
    y1 = y + 1;
    z1 = z + h;
  } else if (dir === 4) {
    x1 = x + w;
    y1 = y + h;
    z1 = z + 1;
  } else if (dir === 5) {
    x1 = x + w;
    y1 = y + h;
    z1 = z + 1;
  }
  const positions = quadPositions(dir, x0, y0, z0, x1, y1, z1, isTopWater);
  const uvs = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  const normalId = dir;
  const rough = 0.85;
  const emit = 0;
  for (let i = 0; i < 4; i++) {
    const p = positions[i];
    const uv = uvs[i];
    arr.push(p[0], p[1], p[2]);
    arr.push(uv[0], uv[1]);
    arr.push(normalId, ao[i], sky, blockL, tile, biome, rough, emit, flag);
  }
  const order = ao[0] + ao[2] > ao[1] + ao[3] ? [0, 1, 2, 0, 2, 3] : [0, 3, 2, 0, 2, 1];
  const base = (arr.length / STRIDE) - 4;
  const indices = [];
  for (const o of order) indices.push(base + o);
  return indices;
}

function quadPositions(dir, x0, y0, z0, x1, y1, z1, isTopWater) {
  if (dir === 0) {
    return [
      [x1, y0, z0],
      [x1, y0, z1],
      [x1, y1, z1],
      [x1, y1, z0],
    ];
  }
  if (dir === 1) {
    return [
      [x0, y0, z1],
      [x0, y0, z0],
      [x0, y1, z0],
      [x0, y1, z1],
    ];
  }
  if (dir === 2) {
    const yy = isTopWater ? y1 - 0.12 : y1;
    return [
      [x0, yy, z0],
      [x0, yy, z1],
      [x1, yy, z1],
      [x1, yy, z0],
    ];
  }
  if (dir === 3) {
    return [
      [x0, y0, z1],
      [x0, y0, z0],
      [x1, y0, z0],
      [x1, y0, z1],
    ];
  }
  if (dir === 4) {
    return [
      [x0, y0, z1],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z1],
    ];
  }
  return [
    [x1, y0, z0],
    [x0, y0, z0],
    [x0, y1, z0],
    [x1, y1, z0],
  ];
}

function emitCross(arr, x, y, z, tile, sky, blockL, biome, flag) {
  const cx = x + 0.5;
  const cz = z + 0.5;
  const s = 0.5;
  const quads = [
    [[cx - s, y, cz - s], [cx + s, y, cz + s], [cx + s, y + 1, cz + s], [cx - s, y + 1, cz - s]],
    [[cx + s, y, cz - s], [cx - s, y, cz + s], [cx - s, y + 1, cz + s], [cx + s, y + 1, cz - s]],
  ];
  for (const quad of quads) {
    for (let i = 0; i < 4; i++) {
      const p = quad[i];
      const uv = [[0, 1], [1, 1], [1, 0], [0, 0]][i];
      arr.push(p[0], p[1], p[2], uv[0], uv[1], 6, 3, sky, blockL, tile, biome, 0.9, 0, flag);
    }
  }
}

function emitModel(arr, x, y, z, def, meta, tile, sky, blockL, biome, flag) {
  const shape = def.shape;
  if (shape === "slab") {
    const bottom = (meta & 1) === 0;
    const y0 = bottom ? y : y + 0.5;
    const y1 = bottom ? y + 0.5 : y + 1;
    const faces = [
      [0, x, y0, z, x + 1, y1, z + 1],
      [2, x, y1, z, x + 1, y1, z + 1],
      [3, x, y0, z, x + 1, y0, z + 1],
    ];
    for (const f of faces) {
      const dir = f[0];
      const p = quadPositions(dir, f[1], f[2], f[3], f[4], f[5], f[6], false);
      const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
      for (let i = 0; i < 4; i++) {
        arr.push(p[i][0], p[i][1], p[i][2], uvs[i][0], uvs[i][1], dir, 3, sky, blockL, tile, biome, 0.85, 0, flag);
      }
    }
    return;
  }
  if (shape === "stairs") {
    const facing = meta & 3;
    const half = (meta & 4) ? 1 : 0;
    const yb = half ? 0.5 : 0;
    const yt = half ? 1 : 0.5;
    const quads = [
      [0, 1, 0, 1, yb + 0.5],
      [0, 1, 0, 1, yb],
    ];
    const base = [
      [x, y + yb, z, x + 1, y + yb + 0.5, z + 1],
    ];
    for (const b of base) {
      for (let dir = 0; dir < 6; dir++) {
        if (dir === 2 && half === 0) continue;
        if (dir === 3 && half === 1) continue;
        const p = quadPositions(dir, b[0], b[1], b[2], b[3], b[4], b[5], false);
        const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
        for (let i = 0; i < 4; i++) arr.push(p[i][0], p[i][1], p[i][2], uvs[i][0], uvs[i][1], dir, 3, sky, blockL, tile, biome, 0.85, 0, flag);
      }
    }
    const top = half ? [x, y + 0.5, z, x + 1, y + 1, z + 1] : [x, y + 0.5, z, x + 1, y + 1, z + 1];
    if (facing === 0) top[2] = z + 0.5;
    if (facing === 1) top[5] = z + 0.5;
    if (facing === 2) top[0] = x + 0.5;
    if (facing === 3) top[3] = x + 0.5;
    for (let dir = 0; dir < 6; dir++) {
      const p = quadPositions(dir, top[0], top[1], top[2], top[3], top[4], top[5], false);
      const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
      for (let i = 0; i < 4; i++) arr.push(p[i][0], p[i][1], p[i][2], uvs[i][0], uvs[i][1], dir, 3, sky, blockL, tile, biome, 0.85, 0, flag);
    }
    return;
  }
  if (shape === "torch") {
    const px = x + 0.5;
    const pz = z + 0.5;
    const py = y + 0.1;
    const top = 0.6;
    const faces = [
      [[px - 0.07, py, pz - 0.07], [px + 0.07, py, pz - 0.07], [px + 0.07, py + top, pz - 0.07], [px - 0.07, py + top, pz - 0.07]],
      [[px + 0.07, py, pz + 0.07], [px - 0.07, py, pz + 0.07], [px - 0.07, py + top, pz + 0.07], [px + 0.07, py + top, pz + 0.07]],
      [[px + 0.07, py, pz - 0.07], [px + 0.07, py, pz + 0.07], [px + 0.07, py + top, pz + 0.07], [px + 0.07, py + top, pz - 0.07]],
      [[px - 0.07, py, pz + 0.07], [px - 0.07, py, pz - 0.07], [px - 0.07, py + top, pz - 0.07], [px - 0.07, py + top, pz + 0.07]],
    ];
    for (const quad of faces) {
      for (let i = 0; i < 4; i++) {
        arr.push(quad[i][0], quad[i][1], quad[i][2], [0, 1, 1, 0][i], [1, 1, 0, 0][i], 6, 3, sky, blockL, tile, biome, 0.8, 0, flag);
      }
    }
    return;
  }
  const p = quadPositions(2, x, y, z, x + 1, y + 0.2, z + 1, false);
  const uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
  for (let i = 0; i < 4; i++) arr.push(p[i][0], p[i][1], p[i][2], uvs[i][0], uvs[i][1], 2, 3, sky, blockL, tile, biome, 0.85, 0, flag);
}
