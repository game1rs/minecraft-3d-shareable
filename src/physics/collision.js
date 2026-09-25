import { BlockId, getBlockDef } from "../blocks/registry.js";
import { BALANCE } from "../engine/constants.js";

export function getBlockSolid(wx, wy, wz, chunkManager, dim) {
  const id = chunkManager.getBlock(wx, wy, wz, dim);
  if (!id) return null;
  const t = id & 0x3ff;
  const def = getBlockDef(t);
  if (!def) return null;
  if (def.collision === "none") return null;
  if (def.collision === "liquid") return { def, liquid: true, id };
  return { def, id, meta: id >> 10 };
}

export function aabbForBlock(wx, wy, wz, info) {
  if (!info) return null;
  const def = info.def;
  const meta = info.meta;
  if (def.collision === "liquid" || def.collision === "none") return null;
  if (def.collision === "solid") return { minX: wx, minY: wy, minZ: wz, maxX: wx + 1, maxY: wy + 1, maxZ: wz + 1 };
  if (def.collision === "slab") {
    const bottom = (meta & 1) === 0;
    return bottom
      ? { minX: wx, minY: wy, minZ: wz, maxX: wx + 1, maxY: wy + 0.5, maxZ: wz + 1 }
      : { minX: wx, minY: wy + 0.5, minZ: wz, maxX: wx + 1, maxY: wy + 1, maxZ: wz + 1 };
  }
  if (def.collision === "stairs") {
    const facing = meta & 3;
    const half = meta & 4 ? 0.5 : 0;
    const slabs = [];
    slabs.push({ minX: wx, minY: wy + half, minZ: wz, maxX: wx + 1, maxY: wy + half + 0.5, maxZ: wz + 1 });
    if (facing === 0) slabs.push({ minX: wx, minY: wy + half + 0.5, minZ: wz, maxX: wx + 1, maxY: wy + half + 1, maxZ: wz + 0.5 });
    else if (facing === 1) slabs.push({ minX: wx, minY: wy + half + 0.5, minZ: wz + 0.5, maxX: wx + 1, maxY: wy + half + 1, maxZ: wz + 1 });
    else if (facing === 2) slabs.push({ minX: wx, minY: wy + half + 0.5, minZ: wz, maxX: wx + 0.5, maxY: wy + half + 1, maxZ: wz + 1 });
    else slabs.push({ minX: wx + 0.5, minY: wy + half + 0.5, minZ: wz, maxX: wx + 1, maxY: wy + half + 1, maxZ: wz + 1 });
    return slabs;
  }
  if (def.collision === "fence" || def.collision === "wall") {
    return { minX: wx + 0.25, minY: wy, minZ: wz + 0.25, maxX: wx + 0.75, maxY: wy + 1.5, maxZ: wz + 0.75 };
  }
  if (def.collision === "door") {
    const open = (meta & 4) !== 0;
    const facing = meta & 3;
    if (open) {
      if (facing === 0) return { minX: wx, minY: wy, minZ: wz + 0.8125, maxX: wx + 1, maxY: wy + 1, maxZ: wz + 1 };
      if (facing === 1) return { minX: wx, minY: wy, minZ: wz, maxX: wx + 0.1875, maxY: wy + 1, maxZ: wz + 1 };
      if (facing === 2) return { minX: wx, minY: wy, minZ: wz, maxX: wx + 1, maxY: wy + 1, maxZ: wz + 0.1875 };
      return { minX: wx + 0.8125, minY: wy, minZ: wz, maxX: wx + 1, maxY: wy + 1, maxZ: wz + 1 };
    }
    if (facing === 0 || facing === 2) return { minX: wx, minY: wy, minZ: wz + 0.375, maxX: wx + 1, maxY: wy + 1, maxZ: wz + 0.625 };
    return { minX: wx + 0.375, minY: wy, minZ: wz, maxX: wx + 0.625, maxY: wy + 1, maxZ: wz + 1 };
  }
  if (def.collision === "farmland") return { minX: wx, minY: wy, minZ: wz, maxX: wx + 1, maxY: wy + 0.9375, maxZ: wz + 1 };
  if (def.collision === "plate") return { minX: wx + 0.0625, minY: wy, minZ: wz + 0.0625, maxX: wx + 0.9375, maxY: wy + 0.0625, maxZ: wz + 0.9375 };
  if (def.collision === "ladder") return null;
  if (def.collision === "spine") return { minX: wx + 0.125, minY: wy, minZ: wz + 0.125, maxX: wx + 0.875, maxY: wy + 1, maxZ: wz + 0.875 };
  return { minX: wx, minY: wy, minZ: wz, maxX: wx + 1, maxY: wy + 1, maxZ: wz + 1 };
}

export function intersectAABB(a, b) {
  return a.minX < b.maxX && a.maxX > b.minX && a.minY < b.maxY && a.maxY > b.minY && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

export function collectColliders(chunkManager, aabb, dim) {
  const minX = Math.floor(aabb.minX - 0.5);
  const maxX = Math.floor(aabb.maxX + 0.5);
  const minY = Math.floor(aabb.minY - 0.5);
  const maxY = Math.floor(aabb.maxY + 0.5);
  const minZ = Math.floor(aabb.minZ - 0.5);
  const maxZ = Math.floor(aabb.maxZ + 0.5);
  const out = [];
  for (let y = minY; y <= maxY; y++) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        const info = getBlockSolid(x, y, z, chunkManager, dim);
        if (!info || info.liquid) continue;
        const boxes = aabbForBlock(x, y, z, info);
        if (!boxes) continue;
        if (Array.isArray(boxes)) {
          for (const b of boxes) if (intersectAABB(aabb, b)) out.push(b);
        } else {
          if (intersectAABB(aabb, boxes)) out.push(boxes);
        }
      }
    }
  }
  return out;
}

export function checkLiquid(chunkManager, aabb, dim) {
  const cx = Math.floor((aabb.minX + aabb.maxX) * 0.5);
  const cy = Math.floor((aabb.minY + aabb.maxY) * 0.5);
  const cz = Math.floor((aabb.minZ + aabb.maxZ) * 0.5);
  for (let y = Math.floor(aabb.minY); y <= Math.floor(aabb.maxY); y++) {
    for (let z = Math.floor(aabb.minZ); z <= Math.floor(aabb.maxZ); z++) {
      for (let x = Math.floor(aabb.minX); x <= Math.floor(aabb.maxX); x++) {
        const id = chunkManager.getBlock(x, y, z, dim);
        const t = id & 0x3ff;
        if (t === BlockId.WATER) return { water: true, lava: false };
        if (t === BlockId.LAVA) return { water: false, lava: true };
      }
    }
  }
  return { water: false, lava: false };
}
