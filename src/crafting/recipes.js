import { itemMatches, PLANKS, LOGS, getItem } from "../items/registry.js";

export const RECIPES = [];

function shaped(id, pattern, key, result, count = 1, station = "inventory") {
  RECIPES.push({ id, type: "shaped", station, pattern, key, result: { item: result, count } });
}

function shapeless(id, items, result, count = 1, station = "inventory") {
  RECIPES.push({ id, type: "shapeless", station, items, result: { item: result, count } });
}

shaped("planks", ["L"], { L: "log" }, "verdant_planks", 4);
shaped("sticks", ["P", "P"], { P: "planks" }, "stick", 4);
shaped("field_bench", ["PP", "PP"], { P: "planks" }, "field_bench", 1);
shaped("kiln", ["CCC", "C C", "CCC"], { C: "cobble" }, "kiln", 1, "bench");
shaped("coffer", ["PPP", "P P", "PPP"], { P: "planks" }, "coffer", 1, "bench");
shaped("torch", ["C", "S"], { C: "char", S: "stick" }, "torch", 4);
shaped("torch_fiber", ["F", "S"], { F: "fiber", S: "stick" }, "torch", 1);
shaped("ladder", ["S S", "SSS", "S S"], { S: "stick" }, "ladder", 3, "bench");
shaped("door", ["PP", "PP", "PP"], { P: "planks" }, "door", 3, "bench");
shaped("gate", ["SPS", "SPS"], { S: "stick", P: "planks" }, "gate", 1, "bench");
shaped("fence", ["PSP", "PSP"], { P: "planks", S: "stick" }, "fence", 3, "bench");
shaped("bed", ["FF", "PP", "PP"], { F: "fiber", P: "planks" }, "bed", 1, "bench");
shaped("campfire", [" S ", "SFS", "LLL"], { S: "stick", F: "fiber", L: "log" }, "campfire", 1);
shaped("bowl", ["P P", " P "], { P: "planks" }, "bowl", 4);
shaped("cup", ["C C", " C "], { C: "clay_ball" }, "clay_cup", 1);
shaped("paper", ["FF", "FF"], { F: "fiber" }, "paper", 2);
shaped("cord", ["F", "F", "F"], { F: "fiber" }, "string", 2);
shaped("chart", ["PPP", "PCP", "PPP"], { P: "paper", C: "wayfinder" }, "chart", 1, "bench");
shaped("wayfinder", [" C ", "CSC", " C "], { C: "cuprite", S: "sunmetal" }, "wayfinder", 1, "bench");
shaped("waterskin", [" F ", "L L", " L "], { F: "fiber", L: "hide" }, "waterskin", 1, "bench");
shaped("rod", ["  S", " SF", "S F"], { S: "stick", F: "fiber" }, "rod", 1, "bench");
shaped("bow", [" FS", "F S", " FS"], { F: "fiber", S: "stick" }, "bow", 1, "bench");
shaped("arrow", [" F ", " S ", " G "], { F: "flint", S: "stick", G: "feather" }, "arrow", 4);
shaped("ward", ["PPP", "PFP", " P "], { P: "planks", F: "fiber" }, "ward", 1, "bench");
shaped("spear", ["  F", " S ", "S  "], { F: "ferrite", S: "stick" }, "spear", 1, "bench");
shaped("lever", ["S", "C"], { S: "stick", C: "cobble" }, "lever", 1);
shaped("wire", ["C", "R"], { C: "cuprite", R: "fiber" }, "spark_wire", 8, "bench");
shaped("plate", ["SS"], { S: "stone_brick" }, "plate", 1, "bench");
shaped("sensor", [" C ", "CRC", "CCC"], { C: "cobble", R: "cuprite" }, "sensor", 1, "bench");
shaped("timer", ["C", "R", "C"], { C: "cobble", R: "cuprite" }, "timer", 1, "bench");
shaped("piston", ["PPP", "CFC", "CRC"], { P: "planks", C: "cobble", F: "ferrite", R: "cuprite" }, "piston", 1, "bench");
shaped("conveyor", ["FFF", "CCC"], { F: "ferrite", C: "cobble" }, "conveyor", 4, "bench");
shaped("seeder", [" F ", "PCP", " R "], { F: "fiber", P: "planks", C: "coffer", R: "slime" }, "seeder", 1, "bench");
shaped("lamp", [" G ", "GDG", " C "], { G: "glass", D: "glow_dust", C: "cuprite" }, "lamp", 1, "bench");
shaped("spark_door", ["FF", "FF", "FF"], { F: "ferrite" }, "spark_door", 1, "bench");
shaped("glass_block", ["GG", "GG"], { G: "glass" }, "glass", 1);
shaped("brick_block", ["BB", "BB"], { B: "brick_item" }, "brick", 1);
shaped("clay_block", ["CC", "CC"], { C: "clay_ball" }, "clay", 1);
shaped("snow_block", ["SS", "SS"], { S: "snow" }, "snow", 1);
shaped("sandstone", ["SS", "SS"], { S: "sand" }, "sandstone", 1);
shaped("glow_torch", ["G", "S"], { G: "glow_dust", S: "stick" }, "torch", 2);
shaped("ember_key", [" C ", "NPN", " C "], { C: "cinderite", N: "nightglass", P: "prismite" }, "ember_key", 1, "bench");
shaped("sky_key", [" S ", "PCP", " S "], { S: "prism_shard", P: "prismite", C: "cloudstone" }, "sky_key", 1, "bench");
shaped("burst", [" F ", "CGC", " F "], { F: "flint", C: "char", G: "sand" }, "burst_charge", 2, "bench");
shaped("suncloak", ["S S", "SHS", "FFF"], { S: "scale", H: "hide", F: "fiber" }, "suncloak", 1, "bench");
shaped("bread", ["FFF"], { F: "flour" }, "bread", 1);
shaped("dough", ["F", "W"], { F: "flour", W: "waterskin_full" }, "dough", 1);
shaped("flour", ["GG", "GG"], { G: "grain" }, "flour", 1);
shaped("stew", ["M", "R", "B"], { M: "cooked_meat", R: "rootbulb", B: "bowl" }, "stew", 1);
shaped("wall", ["CCC", "CCC"], { C: "cobble" }, "wall", 6, "bench");
shaped("pillar", ["P", "P", "P"], { P: "polished" }, "pillar", 3, "bench");
shaped("mossy", ["M", "B"], { M: "moss", B: "stone_brick" }, "mossy_brick", 1);
shaped("polished", ["SS", "SS"], { S: "stone" }, "polished", 4, "bench");
shaped("tiles", ["PP", "PP"], { P: "polished" }, "tiles", 4, "bench");
shaped("stone_brick", ["CC", "CC"], { C: "cobble" }, "stone_brick", 4);
shaped("mud_brick_block", ["MM", "MM"], { M: "mud" }, "mud_brick", 4);
shaped("hoe_fiber", ["FF", " S", " S"], { F: "fiber", S: "stick" }, "wood_hoe", 1);

const TOOL_PATTERNS = {
  pick: ["MMM", " S ", " S "],
  axe: ["MM", "MS", " S"],
  shovel: ["M", "S", "S"],
  hoe: ["MM", " S", " S"],
  blade: ["M", "M", "S"],
};
const TIER_MAT = {
  wood: "planks",
  stone: "cobble",
  cuprite: "cuprite",
  ferrite: "ferrite",
  lumenite: "lumenite",
  prismite: "prismite",
};
for (const [tier, mat] of Object.entries(TIER_MAT)) {
  for (const [tool, pattern] of Object.entries(TOOL_PATTERNS)) {
    shaped(
      tier + "_" + tool,
      pattern,
      { M: mat, S: "stick" },
      tier + "_" + tool,
      1,
      tier === "wood" ? "inventory" : "bench"
    );
  }
}

for (const mat of ["verdant_planks", "amberpine_planks", "lushbark_planks", "silverwood_planks", "mirewood_planks", "cobble", "stone_brick", "polished", "sandstone", "brick", "mud_brick", "ash_brick", "cloudstone", "basalt", "deepstone", "plaster_white", "plaster_charcoal"]) {
  shaped(mat + "_slab", ["MMM"], { M: mat }, mat + "_slab", 6, "bench");
  shaped(mat + "_stair", ["M  ", "MM ", "MMM"], { M: mat }, mat + "_stair", 4, "bench");
}

shapeless("planks_any", ["log"], "verdant_planks", 4);
shapeless("fiber_grass", ["tallgrass"], "fiber", 1);
shapeless("sticks_planks", ["planks"], "stick", 2);
shapeless("mud_brick_item", ["mud", "fiber"], "mud_brick", 1);
shapeless("char_blockish", ["char", "char", "char", "char"], "ash", 1);

const DYES = [
  ["flower_amber", "plaster_amber"],
  ["flower_blue", "plaster_blue"],
  ["flower_white", "plaster_white"],
  ["flower_pink", "plaster_red"],
  ["berries", "plaster_red"],
  ["cinderite", "plaster_charcoal"],
  ["prism_shard", "plaster_violet"],
  ["glow_dust", "plaster_green"],
];
for (const [dye, out] of DYES) {
  shapeless("dye_" + out + "_" + dye, ["clay", dye], out, 1, "bench");
  shapeless("dye2_" + out + "_" + dye, ["plaster_white", dye], out, 1);
}

shapeless("hide_cowl", ["hide", "hide", "fiber"], "hide_cowl", 1, "bench");
shapeless("hide_coat", ["hide", "hide", "hide", "hide", "fiber"], "hide_coat", 1, "bench");
shapeless("hide_trousers", ["hide", "hide", "hide", "fiber"], "hide_trousers", 1, "bench");
shapeless("hide_boots", ["hide", "hide"], "hide_boots", 1, "bench");
shaped("ferrite_cowl", ["FFF", "F F"], { F: "ferrite" }, "ferrite_cowl", 1, "bench");
shaped("ferrite_coat", ["F F", "FFF", "FFF"], { F: "ferrite" }, "ferrite_coat", 1, "bench");
shaped("ferrite_trousers", ["FFF", "F F", "F F"], { F: "ferrite" }, "ferrite_trousers", 1, "bench");
shaped("ferrite_boots", ["F F", "F F"], { F: "ferrite" }, "ferrite_boots", 1, "bench");
shaped("chitin_coat", ["C C", "CCC", "CCC"], { C: "chitin" }, "chitin_coat", 1, "bench");
shaped("chitin_cowl", ["CCC", "C C"], { C: "chitin" }, "chitin_cowl", 1, "bench");
shaped("prismite_coat", ["P P", "PPP", "PPP"], { P: "prismite" }, "prismite_coat", 1, "bench");
shaped("prismite_cowl", ["PPP", "P P"], { P: "prismite" }, "prismite_cowl", 1, "bench");
shaped("ingot_cuprite", ["CC", "CC"], { C: "cuprite" }, "cuprite_block", 1, "bench");
shaped("ingot_ferrite", ["FF", "FF"], { F: "ferrite" }, "ferrite_block", 1, "bench");
shaped("ingot_lumenite", ["LL", "LL"], { L: "lumenite" }, "lumenite_block", 1, "bench");
shaped("ingot_sun", ["SS", "SS"], { S: "sunmetal" }, "sunmetal_block", 1, "bench");
shaped("ingot_prism", ["PP", "PP"], { P: "prismite" }, "prismite_block", 1, "bench");
shaped("ingot_deep", ["DD", "DD"], { D: "deepcore" }, "deepcore_block", 1, "bench");
shaped("ingot_cinder", ["CC", "CC"], { C: "cinderite" }, "cinderite_block", 1, "bench");
shapeless("uncraft_cuprite", ["cuprite_block"], "cuprite", 4);
shapeless("uncraft_ferrite", ["ferrite_block"], "ferrite", 4);
shapeless("growth", ["glow_dust", "fiber"], "growth_salt", 2);

RECIPES.push({ id: "repair", type: "repair", station: "bench" });

export const KILN_RECIPES = [
  { in: "raw_cuprite", out: "cuprite", time: 7 },
  { in: "raw_ferrite", out: "ferrite", time: 8 },
  { in: "raw_lumenite", out: "lumenite", time: 9 },
  { in: "raw_sunmetal", out: "sunmetal", time: 9 },
  { in: "prismite_ore", out: "prismite", time: 10 },
  { in: "sand", out: "glass", time: 7 },
  { in: "clay_ball", out: "brick_item", time: 6 },
  { in: "clay", out: "brick", time: 8 },
  { in: "raw_meat", out: "cooked_meat", time: 6 },
  { in: "fish", out: "cooked_fish", time: 6 },
  { in: "kelp", out: "kelp", time: 4 },
  { in: "dough", out: "bread", time: 6 },
  { in: "log", out: "char", time: 6 },
  { in: "mushroom_bite", out: "mushroom_bite", time: 4 },
  { in: "cinderite", out: "cinder_tea", time: 5 },
  { in: "cobble", out: "stone", time: 6 },
];

export const FUEL = {
  char: 48,
  stick: 4,
  kelp: 8,
  planks: 10,
  log: 15,
  sapling: 4,
  fiber: 2,
  bowl: 4,
  coalish: 48,
};

export function fuelTime(key) {
  if (!key) return 0;
  if (FUEL[key]) return FUEL[key];
  if (key.endsWith("_planks")) return 10;
  if (key.endsWith("_log")) return 15;
  if (key.endsWith("_sapling")) return 4;
  if (key === "verdant_planks") return 10;
  const item = getItem(key);
  return item && item.fuel ? item.fuel : 0;
}

function gridGet(grid, size, x, y) {
  if (x < 0 || y < 0 || x >= size || y >= size) return null;
  return grid[y * size + x] || null;
}

function fitsShaped(grid, size, recipe, ox, oy, mirror) {
  const pat = recipe.pattern;
  const h = pat.length;
  const w = Math.max(...pat.map((row) => row.length));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x - ox;
      const py = y - oy;
      let need = null;
      if (py >= 0 && py < h && px >= 0 && px < w) {
        const row = pat[py];
        const sx = mirror ? w - 1 - px : px;
        const ch = sx >= 0 && sx < row.length ? row[sx] : " ";
        if (ch !== " ") need = recipe.key[ch];
      }
      const got = gridGet(grid, size, x, y);
      const gotKey = got ? got.key : null;
      if (!itemMatches(gotKey, need)) return false;
    }
  }
  return true;
}

export function matchCraft(grid, size, station) {
  const cells = [];
  for (let i = 0; i < size * size; i++) cells.push(grid[i] || null);
  for (const recipe of RECIPES) {
    if (recipe.station === "bench" && station !== "bench") continue;
    if (recipe.type === "repair") {
      const found = matchRepair(cells);
      if (found) return found;
      continue;
    }
    if (recipe.type === "shapeless") {
      if (matchShapeless(cells, recipe)) return { recipe, result: { ...recipe.result } };
    } else if (recipe.type === "shaped") {
      const pat = recipe.pattern;
      const h = pat.length;
      const w = Math.max(...pat.map((row) => row.length));
      if (w > size || h > size) continue;
      let ok = false;
      for (let mirror = 0; mirror < 2 && !ok; mirror++) {
        for (let oy = 0; oy <= size - h && !ok; oy++) {
          for (let ox = 0; ox <= size - w && !ok; ox++) {
            if (fitsShaped(cells, size, recipe, ox, oy, mirror)) ok = true;
          }
        }
      }
      if (ok) {
        let result = { ...recipe.result };
        if (result.item === "verdant_planks") {
          const log = cells.find((c) => c && itemMatches(c.key, "log"));
          if (log) result = { item: log.key.replace("_log", "_planks"), count: result.count };
        }
        return { recipe, result };
      }
    }
  }
  return null;
}

function matchShapeless(cells, recipe) {
  const need = recipe.items.slice();
  const got = cells.filter(Boolean).map((c) => c.key);
  if (got.length !== need.length) return false;
  const used = new Array(need.length).fill(false);
  for (const g of got) {
    let found = false;
    for (let i = 0; i < need.length; i++) {
      if (used[i]) continue;
      if (itemMatches(g, need[i])) {
        used[i] = true;
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

function matchRepair(cells) {
  const filled = cells.filter(Boolean);
  if (filled.length !== 2) return null;
  const tool = filled.find((c) => getItem(c.key) && getItem(c.key).durability);
  const mat = filled.find((c) => c !== tool);
  if (!tool || !mat) return null;
  const def = getItem(tool.key);
  if (!def.repairMat) return null;
  if (!itemMatches(mat.key, def.repairMat) && mat.key !== def.repairMat) return null;
  if ((tool.dur || 0) >= (tool.maxDur || def.durability)) return null;
  return {
    recipe: { id: "repair", type: "repair" },
    result: { item: tool.key, count: 1, repair: true, dur: Math.min(def.durability, (tool.dur || 0) + Math.ceil(def.durability * 0.45)) },
  };
}

export function consumeCraft(grid, match) {
  if (match.recipe.type === "repair") {
    let spentTool = false;
    let spentMat = false;
    for (let i = 0; i < grid.length; i++) {
      const c = grid[i];
      if (!c) continue;
      const def = getItem(c.key);
      if (!spentTool && def && def.durability && def.repairMat) {
        grid[i] = null;
        spentTool = true;
      } else if (!spentMat) {
        c.count -= 1;
        if (c.count <= 0) grid[i] = null;
        spentMat = true;
      }
    }
    return;
  }
  for (let i = 0; i < grid.length; i++) {
    const c = grid[i];
    if (!c) continue;
    c.count -= 1;
    if (c.count <= 0) grid[i] = null;
  }
}

export function kilnRecipeFor(key) {
  if (!key) return null;
  for (const r of KILN_RECIPES) {
    if (itemMatches(key, r.in) || key === r.in) return r;
  }
  return null;
}

export function recipesForStation(station) {
  return RECIPES.filter((r) => r.type !== "repair" && (r.station === station || r.station === "inventory" || station === "bench"));
}

export function canCraftFromInventory(recipe, slots) {
  if (!recipe || recipe.type === "repair") return false;
  const have = new Map();
  for (const s of slots) {
    if (!s) continue;
    have.set(s.key, (have.get(s.key) || 0) + s.count);
  }
  const need = new Map();
  if (recipe.type === "shapeless") {
    for (const n of recipe.items) {
      const k = Array.isArray(n) ? n[0] : n;
      need.set(k, (need.get(k) || 0) + 1);
    }
  } else {
    for (const row of recipe.pattern) {
      for (const ch of row) {
        if (ch === " ") continue;
        const n = recipe.key[ch];
        const k = Array.isArray(n) ? n[0] : n;
        need.set(k, (need.get(k) || 0) + 1);
      }
    }
  }
  for (const [k, c] of need) {
    if (k === "planks") {
      const sum = PLANKS.reduce((a, p) => a + (have.get(p) || 0), 0);
      if (sum < c) return false;
    } else if (k === "log") {
      const sum = LOGS.reduce((a, p) => a + (have.get(p) || 0), 0);
      if (sum < c) return false;
    } else if ((have.get(k) || 0) < c) return false;
  }
  return true;
}

export { PLANKS, LOGS };
