import { HEIGHT, SEA } from "../engine/constants.js";
import { BlockId, packBlock } from "../blocks/registry.js";
import { mixSeed, RNG } from "../engine/math.js";

const REGION = 9;

export function structuresNear(seed, cx, cz, dim, settings, columnFn) {
  if (!settings.structures || dim === 2) return dim === 2 ? skyAltars(seed, cx, cz, settings, columnFn) : [];
  const list = [];
  const rx = Math.floor(cx / REGION);
  const rz = Math.floor(cz / REGION);
  for (let x = rx - 1; x <= rx + 1; x++) {
    for (let z = rz - 1; z <= rz + 1; z++) {
      const s = rollStructure(seed, x, z, dim, settings, columnFn);
      if (!s) continue;
      const minX = cx * 16 - 2;
      const maxX = cx * 16 + 18;
      const minZ = cz * 16 - 2;
      const maxZ = cz * 16 + 18;
      if (s.x + s.radius < minX || s.x - s.radius > maxX || s.z + s.radius < minZ || s.z - s.radius > maxZ) continue;
      list.push(s);
    }
  }
  return list;
}

function skyAltars(seed, cx, cz, settings, columnFn) {
  if (!settings.structures) return [];
  const list = [];
  const rx = Math.floor(cx / 8);
  const rz = Math.floor(cz / 8);
  for (let x = rx - 1; x <= rx + 1; x++) {
    for (let z = rz - 1; z <= rz + 1; z++) {
      const rng = new RNG(mixSeed(seed, x, z, 90));
      if (rng.next() > 0.12) continue;
      const wx = x * 8 * 16 + 40 + rng.int(48);
      const wz = z * 8 * 16 + 40 + rng.int(48);
      const col = columnFn(wx, wz, 2);
      if (!col.island) continue;
      list.push({ type: "altar", x: wx, z: wz, y: col.height, radius: 6, rot: rng.int(4), loot: 2, dim: 2 });
    }
  }
  return list.filter((s) => Math.abs(s.x - cx * 16) < 24 && Math.abs(s.z - cz * 16) < 24);
}

function rollStructure(seed, rx, rz, dim, settings, columnFn) {
  const rng = new RNG(mixSeed(seed, rx, rz, 40 + dim));
  if (dim === 1) {
    if (rng.next() > 0.16) return null;
    const x = rx * REGION * 16 + 24 + rng.int(80);
    const z = rz * REGION * 16 + 24 + rng.int(80);
    const col = columnFn(x, z, 1);
    if (col.height < 40) return null;
    return { type: "fortress", x, z, y: col.height, radius: 12, rot: rng.int(4), loot: 3, dim };
  }
  if (rng.next() > 0.2) return null;
  const x = rx * REGION * 16 + 20 + rng.int(90);
  const z = rz * REGION * 16 + 20 + rng.int(90);
  const col = columnFn(x, z, 0);
  const b = col.biome;
  let type = "camp";
  if (col.height < SEA - 4) type = rng.next() < 0.5 ? "ocean_ruin" : null;
  else if (b === "desert" || b === "red_desert") type = rng.next() < 0.5 ? "buried" : "shrine";
  else if (b === "meadow" || b === "flowers") type = rng.next() < 0.45 ? "village" : rng.next() < 0.5 ? "cabin" : "camp";
  else if (b === "rocky" || b === "alpine" || col.mountain > 0.4) type = rng.next() < 0.55 ? "tower" : "mine";
  else if (b === "ancient" || b === "crystal" || b === "dense") type = rng.next() < 0.5 ? "shrine" : "ruin";
  else if (b === "swamp" || b === "mangrove") type = "ruin";
  else type = rng.pick(["cabin", "camp", "ruin", "tower"]);
  if (!type) return null;
  if (type === "village" && col.slope > 0.28) type = "cabin";
  if ((type === "cabin" || type === "camp" || type === "village") && (col.height < SEA + 2 || col.slope > 0.45)) return null;
  const radius = type === "village" ? 22 : type === "fortress" ? 12 : type === "tower" ? 5 : 8;
  return { type, x, z, y: col.height, radius, rot: rng.int(4), loot: type === "shrine" || type === "buried" ? 2 : 1, dim, biome: b };
}

export function footprintAt(seed, x, z, dim, settings, columnFn) {
  if (!settings.structures) return false;
  const near = structuresNear(seed, Math.floor(x / 16), Math.floor(z / 16), dim, settings, columnFn);
  for (const s of near) {
    if (Math.abs(s.x - x) <= s.radius && Math.abs(s.z - z) <= s.radius) return true;
  }
  return false;
}

export function stampStructure(s, set, get) {
  const rng = new RNG(mixSeed(s.x, s.z, s.type.length, 3));
  if (s.type === "cabin") cabin(s, set, get, rng);
  else if (s.type === "tower") tower(s, set, get, rng);
  else if (s.type === "ruin") ruin(s, set, get, rng);
  else if (s.type === "camp") camp(s, set, get, rng);
  else if (s.type === "shrine") shrine(s, set, get, rng);
  else if (s.type === "mine") mine(s, set, get, rng);
  else if (s.type === "village") village(s, set, get, rng);
  else if (s.type === "buried") buried(s, set, get, rng);
  else if (s.type === "ocean_ruin") oceanRuin(s, set, get, rng);
  else if (s.type === "fortress") fortress(s, set, get, rng);
  else if (s.type === "altar") altar(s, set, get, rng);
}

function put(set, x, y, z, id) {
  if (y <= 0 || y >= HEIGHT - 1) return;
  set(x, y, z, id);
}

function clearBox(set, x0, y0, z0, x1, y1, z1) {
  for (let y = y0; y <= y1; y++) {
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) put(set, x, y, z, 0);
    }
  }
}

function fill(set, x0, y0, z0, x1, y1, z1, id) {
  for (let y = y0; y <= y1; y++) {
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) put(set, x, y, z, id);
    }
  }
}

function frame(set, x0, y0, z0, x1, y1, z1, id) {
  for (let y = y0; y <= y1; y++) {
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        const edge = x === x0 || x === x1 || z === z0 || z === z1 || y === y0 || y === y1;
        if (edge) put(set, x, y, z, id);
      }
    }
  }
}

function doorPair(set, x, y, z, meta) {
  put(set, x, y, z, packBlock(BlockId.DOOR, meta));
  put(set, x, y + 1, z, packBlock(BlockId.DOOR, meta | 8));
}

function coffer(set, x, y, z, tier) {
  put(set, x, y, z, packBlock(BlockId.COFFER, 1 | ((tier & 7) << 1)));
}

function cabin(s, set, get, rng) {
  const x = s.x - 2;
  const z = s.z - 2;
  const y = s.y;
  const wood = rng.next() < 0.5 ? BlockId.VERDANT_PLANKS : BlockId.AMBERPINE_PLANKS;
  const log = rng.next() < 0.5 ? BlockId.VERDANT_LOG : BlockId.AMBERPINE_LOG;
  fill(set, x, y, z, x + 4, y, z + 4, wood);
  clearBox(set, x, y + 1, z, x + 4, y + 4, z + 4);
  frame(set, x, y + 1, z, x + 4, y + 3, z + 4, wood);
  fill(set, x, y + 4, z, x + 4, y + 4, z + 4, log);
  for (let i = 0; i < 5; i++) {
    put(set, x + i, y + 1, z, wood);
    put(set, x + i, y + 1, z + 4, wood);
    put(set, x, y + 1, z + i, wood);
    put(set, x + 4, y + 1, z + i, wood);
  }
  doorPair(set, x + 2, y + 1, z, 0);
  put(set, x + 1, y + 2, z, BlockId.GLASS);
  put(set, x + 3, y + 2, z, BlockId.GLASS);
  put(set, x + 3, y + 1, z + 2, BlockId.FIELD_BENCH);
  put(set, x + 1, y + 1, z + 3, BlockId.BED);
  coffer(set, x + 3, y + 1, z + 3, s.loot || 1);
  put(set, x + 2, y + 2, z + 3, BlockId.TORCH);
  put(set, x + 2, y - 1, z + 2, BlockId.COBBLE);
}

function tower(s, set, get, rng) {
  const h = 8 + rng.int(5);
  const x = s.x - 1;
  const z = s.z - 1;
  const y = s.y;
  for (let dy = 0; dy <= h; dy++) {
    for (let dz = 0; dz < 3; dz++) {
      for (let dx = 0; dx < 3; dx++) {
        const edge = dx === 0 || dz === 0 || dx === 2 || dz === 2;
        if (dy === 0) put(set, x + dx, y, z + dz, BlockId.STONE_BRICK);
        else if (edge && dy < h) put(set, x + dx, y + dy, z + dz, dy % 4 === 0 ? BlockId.POLISHED : BlockId.STONE_BRICK);
        else put(set, x + dx, y + dy, z + dz, 0);
      }
    }
    put(set, x + 1, y + dy, z + 1, dy === h ? BlockId.STONE_BRICK : BlockId.LADDER);
  }
  put(set, x, y + 2, z, BlockId.GLASS);
  coffer(set, x + 1, y + h, z, 2);
  put(set, x + 2, y + h, z + 2, BlockId.TORCH);
}

function ruin(s, set, get, rng) {
  const x = s.x - 3;
  const z = s.z - 3;
  const y = s.y;
  for (let dz = 0; dz < 7; dz++) {
    for (let dx = 0; dx < 7; dx++) {
      const edge = dx === 0 || dz === 0 || dx === 6 || dz === 6;
      if (!edge) continue;
      const hh = rng.int(4);
      for (let dy = 0; dy <= hh; dy++) {
        if (rng.next() < 0.2) continue;
        put(set, x + dx, y + dy, z + dz, rng.next() < 0.3 ? BlockId.MOSSY_BRICK : BlockId.STONE_BRICK);
      }
    }
  }
  if (rng.next() < 0.8) coffer(set, s.x, y, s.z, 1);
  put(set, s.x + 2, y, s.z - 1, BlockId.MOSS);
}

function camp(s, set, get, rng) {
  const y = s.y + 1;
  put(set, s.x, y, s.z, BlockId.CAMPFIRE);
  put(set, s.x + 2, y, s.z, BlockId.BED);
  put(set, s.x - 2, y, s.z + 1, BlockId.BED);
  coffer(set, s.x + 1, y, s.z + 2, 1);
  put(set, s.x - 1, y, s.z - 2, packBlock(BlockId.VERDANT_LOG, 1));
  put(set, s.x, y, s.z - 2, packBlock(BlockId.VERDANT_LOG, 1));
}

function shrine(s, set, get, rng) {
  const x = s.x;
  const z = s.z;
  const y = s.y;
  for (let dz = -2; dz <= 2; dz++) {
    for (let dx = -2; dx <= 2; dx++) {
      put(set, x + dx, y, z + dz, BlockId.POLISHED);
      if (Math.abs(dx) === 2 && Math.abs(dz) === 2) {
        put(set, x + dx, y + 1, z + dz, BlockId.PILLAR);
        put(set, x + dx, y + 2, z + dz, BlockId.PILLAR);
        put(set, x + dx, y + 3, z + dz, BlockId.STONE_BRICK);
      }
    }
  }
  put(set, x, y + 1, z, BlockId.PRISMITE_BLOCK);
  coffer(set, x, y + 1, z + 1, 2);
  put(set, x, y + 2, z - 2, BlockId.LAMP);
}

function mine(s, set, get, rng) {
  const x = s.x;
  const z = s.z;
  let y = s.y;
  put(set, x, y + 1, z, BlockId.TORCH);
  for (let i = 0; i < 14; i++) {
    y--;
    if (y < 8) break;
    clearBox(set, x - 1, y, z - 1, x + 1, y + 2, z + 1);
    if (i % 3 === 0) {
      put(set, x - 1, y, z - 1, BlockId.AMBERPINE_LOG);
      put(set, x + 1, y, z - 1, BlockId.AMBERPINE_LOG);
      put(set, x - 1, y, z + 1, BlockId.AMBERPINE_LOG);
      put(set, x + 1, y, z + 1, BlockId.AMBERPINE_LOG);
      put(set, x, y + 1, z, BlockId.LADDER);
    }
    if (rng.next() < 0.35) put(set, x + 2, y, z, BlockId.FERRITE_ORE);
    if (rng.next() < 0.2) put(set, x - 2, y, z, BlockId.CUPRITE_ORE);
  }
  coffer(set, x + 1, y, z, 2);
  put(set, x, y + 1, z + 1, BlockId.TORCH);
}

function village(s, set, get, rng) {
  const spots = [[0, 0], [8, 2], [-7, 4], [3, -8], [-4, -6]];
  for (const [dx, dz] of spots) {
    cabin({ ...s, x: s.x + dx, z: s.z + dz, y: s.y, loot: 1, radius: 4 }, set, get, rng);
  }
  const y = s.y;
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) put(set, s.x + 14 + dx, y, s.z + dz, BlockId.COBBLE);
  }
  put(set, s.x + 14, y, s.z, BlockId.WATER);
  put(set, s.x + 14, y - 1, s.z, BlockId.STONE);
  for (let i = -6; i <= 6; i++) {
    put(set, s.x + i, y, s.z, BlockId.GRAVEL);
    put(set, s.x, y, s.z + i, BlockId.GRAVEL);
  }
}

function buried(s, set, get, rng) {
  const y = Math.max(8, s.y - 4);
  fill(set, s.x - 1, y, s.z - 1, s.x + 1, y, s.z + 1, BlockId.SANDSTONE);
  coffer(set, s.x, y + 1, s.z, 2);
  put(set, s.x, y + 2, s.z, BlockId.SAND);
  put(set, s.x + 1, y + 2, s.z, BlockId.SAND);
}

function oceanRuin(s, set, get, rng) {
  const y = s.y;
  frame(set, s.x - 2, y, s.z - 2, s.x + 2, y + 3, s.z + 2, BlockId.STONE_BRICK);
  clearBox(set, s.x - 1, y + 1, s.z - 1, s.x + 1, y + 2, s.z + 1);
  coffer(set, s.x, y + 1, s.z, 2);
  put(set, s.x, y + 1, s.z + 1, BlockId.PRISMITE_ORE);
}

function fortress(s, set, get, rng) {
  const x = s.x - 5;
  const z = s.z - 5;
  const y = s.y;
  fill(set, x, y, z, x + 10, y, z + 10, BlockId.BASALT);
  frame(set, x, y + 1, z, x + 10, y + 5, z + 10, BlockId.ASH_BRICK);
  clearBox(set, x + 1, y + 1, z + 1, x + 9, y + 4, z + 9);
  fill(set, x, y + 6, z, x + 10, y + 6, z + 10, BlockId.BASALT);
  doorPair(set, x + 5, y + 1, z, 0);
  put(set, x + 5, y + 1, z + 8, BlockId.CAMPFIRE);
  coffer(set, x + 8, y + 1, z + 8, 3);
  put(set, x + 2, y + 2, z + 2, BlockId.LAMP);
  put(set, x + 8, y + 3, z + 2, BlockId.CINDERITE_ORE);
  for (let i = 0; i < 4; i++) put(set, x + 1 + i, y + 1, z + 5, BlockId.LAVA);
}

function altar(s, set, get, rng) {
  const y = s.y;
  for (let dz = -2; dz <= 2; dz++) {
    for (let dx = -2; dx <= 2; dx++) put(set, s.x + dx, y, s.z + dz, BlockId.CLOUDSTONE);
  }
  put(set, s.x, y + 1, s.z, BlockId.PRISMITE_BLOCK);
  put(set, s.x + 2, y + 1, s.z + 2, BlockId.PILLAR);
  put(set, s.x - 2, y + 1, s.z - 2, BlockId.PILLAR);
  put(set, s.x + 2, y + 2, s.z + 2, BlockId.CRYSTAL);
  coffer(set, s.x, y + 1, s.z + 2, 3);
}

export function lootFor(tier, rng) {
  const common = [
    ["bread", 2], ["torch", 6], ["fiber", 8], ["berries", 4], ["stick", 6], ["cooked_meat", 2], ["seed_grain", 3],
  ];
  const uncommon = [
    ["cuprite", 3], ["ferrite", 2], ["waterskin", 1], ["arrow", 8], ["char", 6], ["wayfinder", 1],
  ];
  const rare = [
    ["prismite", 1], ["lumenite", 2], ["sunmetal", 1], ["ember_key", 1], ["burst_charge", 2], ["glow_dust", 4],
  ];
  const slots = [];
  const n = 3 + rng.int(4) + tier;
  for (let i = 0; i < n; i++) {
    const roll = rng.next();
    let pick = common[rng.int(common.length)];
    if (tier >= 2 && roll > 0.55) pick = uncommon[rng.int(uncommon.length)];
    if (tier >= 3 && roll > 0.82) pick = rare[rng.int(rare.length)];
    if (tier >= 2 && roll > 0.7 && roll <= 0.82) pick = uncommon[rng.int(uncommon.length)];
    slots.push({ key: pick[0], count: pick[1], dur: 0, maxDur: 0 });
  }
  return slots;
}
