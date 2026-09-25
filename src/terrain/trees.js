import { HEIGHT } from "../engine/constants.js";
import { BlockId, packBlock } from "../blocks/registry.js";
import { mixSeed, RNG } from "../engine/math.js";

const LOG = {
  amberpine: BlockId.AMBERPINE_LOG,
  verdant: BlockId.VERDANT_LOG,
  lushbark: BlockId.LUSHBARK_LOG,
  silverwood: BlockId.SILVERWOOD_LOG,
  mirewood: BlockId.MIREWOOD_LOG,
  ancient: BlockId.VERDANT_LOG,
  dead: BlockId.SILVERWOOD_LOG,
  mushroom: BlockId.MUSHROOM_STEM,
};
const LEAF = {
  amberpine: BlockId.AMBERPINE_LEAVES,
  verdant: BlockId.VERDANT_LEAVES,
  lushbark: BlockId.LUSHBARK_LEAVES,
  silverwood: BlockId.SILVERWOOD_LEAVES,
  mirewood: BlockId.MIREWOOD_LEAVES,
  ancient: BlockId.VERDANT_LEAVES,
  dead: 0,
  mushroom: BlockId.MUSHROOM_CAP,
};

function canReplace(id) {
  const t = id & 0x3ff;
  return t === 0 || t === BlockId.TALLGRASS || t === BlockId.FLOWER_AMBER || t === BlockId.FLOWER_BLUE || t === BlockId.FLOWER_WHITE || t === BlockId.FLOWER_PINK || t === BlockId.BUSH || t === BlockId.DEADBUSH || t === BlockId.SNOW_CAP || t === BlockId.VINE;
}

export function writeTree(set, get, x, y, z, type, rng) {
  if (type === "spine") return writeSpine(set, get, x, y, z, rng);
  if (type === "crystal") return writeCrystal(set, get, x, y, z, rng);
  if (type === "mushroom") return writeMushroom(set, get, x, y, z, rng);
  if (type === "dead") return writeDead(set, get, x, y, z, rng);
  const log = LOG[type] || BlockId.VERDANT_LOG;
  const leaf = LEAF[type] || BlockId.VERDANT_LEAVES;
  const tall = type === "ancient" ? rng.int(6) + 11 : type === "lushbark" ? rng.int(5) + 9 : type === "amberpine" ? rng.int(4) + 7 : rng.int(3) + 5;
  const thick = type === "ancient" ? 1 : 0;
  for (let dy = 1; dy <= tall; dy++) {
    for (let dx = -thick; dx <= thick; dx++) {
      for (let dz = -thick; dz <= thick; dz++) {
        if (thick && Math.abs(dx) + Math.abs(dz) === 2 && rng.next() < 0.4) continue;
        place(set, get, x + dx, y + dy, z + dz, log, true);
      }
    }
  }
  if (type === "amberpine") {
    const radius = 2 + rng.int(2);
    for (let dy = tall - 5; dy <= tall + 1; dy++) {
      const r = dy >= tall ? 1 : Math.max(1, radius - Math.floor((dy - (tall - 5)) / 2));
      ball(set, get, x, y + dy, z, r, leaf, 0.15);
    }
  } else if (type === "lushbark") {
    ball(set, get, x, y + tall - 1, z, 3, leaf, 0.2);
    ball(set, get, x, y + tall + 1, z, 2, leaf, 0.1);
    for (let i = 0; i < 3; i++) {
      const bx = x + rng.int(5) - 2;
      const bz = z + rng.int(5) - 2;
      const by = y + 4 + rng.int(tall - 5);
      place(set, get, bx, by, bz, packBlock(log, 1), true);
      ball(set, get, bx, by + 1, bz, 2, leaf, 0.25);
    }
    if (rng.next() < 0.7) {
      for (let dy = y + 2; dy < y + tall; dy += 2) {
        place(set, get, x + 1, dy, z, BlockId.VINE, false);
        place(set, get, x - 1, dy + 1, z, BlockId.VINE, false);
      }
    }
  } else if (type === "mirewood") {
    const lean = rng.int(3) - 1;
    for (let dy = 1; dy <= tall; dy++) {
      place(set, get, x + Math.floor(lean * dy / tall), y + dy, z, log, true);
    }
    ball(set, get, x + lean, y + tall, z, 2, leaf, 0.3);
    for (let i = 0; i < 4; i++) {
      const dx = [1, -1, 0, 0][i];
      const dz = [0, 0, 1, -1][i];
      place(set, get, x + dx, y + 1, z + dz, log, true);
    }
  } else {
    const r = type === "ancient" ? 4 : type === "silverwood" ? 2 : 3;
    ball(set, get, x, y + tall, z, r, leaf, type === "silverwood" ? 0.4 : 0.18);
    if (type === "ancient" || rng.next() < 0.55) {
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      const count = type === "ancient" ? 3 : 1 + rng.int(2);
      for (let i = 0; i < count; i++) {
        const d = dirs[rng.int(4)];
        const by = y + 3 + rng.int(Math.max(1, tall - 4));
        place(set, get, x + d[0], by, z + d[1], packBlock(log, d[0] ? 1 : 2), true);
        place(set, get, x + d[0] * 2, by, z + d[1] * 2, packBlock(log, d[0] ? 1 : 2), true);
        ball(set, get, x + d[0] * 2, by + 1, z + d[1] * 2, 2, leaf, 0.3);
      }
    }
  }
  if (type === "ancient" && rng.next() < 0.45) {
    const len = 3 + rng.int(3);
    for (let i = 1; i <= len; i++) place(set, get, x + 3 + i, y + 1, z + 1, packBlock(log, 1), true);
  }
}

function writeDead(set, get, x, y, z, rng) {
  const h = 3 + rng.int(4);
  for (let dy = 1; dy <= h; dy++) place(set, get, x, y + dy, z, BlockId.SILVERWOOD_LOG, true);
  if (rng.next() < 0.5) place(set, get, x + 1, y + h - 1, z, packBlock(BlockId.SILVERWOOD_LOG, 1), true);
}

function writeSpine(set, get, x, y, z, rng) {
  const h = 2 + rng.int(4);
  for (let dy = 1; dy <= h; dy++) place(set, get, x, y + dy, z, BlockId.SPINEPLANT, true);
  if (h > 2 && rng.next() < 0.6) {
    const arm = rng.next() < 0.5 ? 1 : -1;
    place(set, get, x + arm, y + 2, z, BlockId.SPINEPLANT, true);
    place(set, get, x + arm, y + 3, z, BlockId.SPINEPLANT, true);
  }
}

function writeCrystal(set, get, x, y, z, rng) {
  const h = 2 + rng.int(4);
  for (let dy = 1; dy <= h; dy++) place(set, get, x, y + dy, z, BlockId.CRYSTAL, true);
  place(set, get, x + 1, y + 1, z, BlockId.CRYSTAL, false);
  place(set, get, x, y + 2, z - 1, BlockId.CRYSTAL, false);
  if (rng.next() < 0.5) place(set, get, x - 1, y + 1, z + 1, BlockId.GLOWFUNGUS, false);
}

function writeMushroom(set, get, x, y, z, rng) {
  const h = 4 + rng.int(3);
  for (let dy = 1; dy <= h; dy++) place(set, get, x, y + dy, z, BlockId.MUSHROOM_STEM, true);
  const r = 2 + rng.int(2);
  for (let dz = -r; dz <= r; dz++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dz * dz > r * r + 1) continue;
      place(set, get, x + dx, y + h, z + dz, BlockId.MUSHROOM_CAP, true);
      if (Math.abs(dx) + Math.abs(dz) >= r - 1) place(set, get, x + dx, y + h - 1, z + dz, BlockId.MUSHROOM_CAP, false);
    }
  }
}

function ball(set, get, x, y, z, r, leaf, skip) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        const d2 = dx * dx + dy * dy * 1.3 + dz * dz;
        if (d2 > r * r + 0.5) continue;
        if (d2 > (r - 1) * (r - 1) && Math.abs((x + dx) * 13 + (z + dz) * 7 + y) % 7 === 0) continue;
        if (skip && ((dx * 17 + dy * 3 + dz * 11 + x + z) & 7) === 0 && d2 > 2) continue;
        place(set, get, x + dx, y + dy, z + dz, leaf, false);
      }
    }
  }
}

function place(set, get, x, y, z, id, force) {
  if (y <= 0 || y >= HEIGHT - 1) return;
  const cur = get ? get(x, y, z) : 0;
  if (!force && !canReplace(cur)) return;
  if (force && cur && (cur & 0x3ff) === BlockId.BEDROCK) return;
  set(x, y, z, id);
}

export function treeHash(seed, x, z) {
  return mixSeed(seed, x, z, 11);
}

export function treeRNG(seed, x, z) {
  return new RNG(treeHash(seed, x, z) || 1);
}
