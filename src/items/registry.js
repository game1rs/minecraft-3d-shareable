import { allBlocks, getBlockByKey } from "../blocks/registry.js";

const items = Object.create(null);

function define(partial) {
  const it = {
    stack: 64,
    category: "material",
    rarity: "common",
    desc: "",
    color: [0.7, 0.66, 0.58],
    toolType: null,
    tier: 0,
    speed: 1,
    damage: 1,
    durability: 0,
    food: 0,
    sat: 0,
    effect: null,
    block: null,
    placeable: false,
    fuel: 0,
    ...partial,
  };
  if (!it.desc) it.desc = it.name + ".";
  items[it.key] = it;
  return it;
}

for (const b of allBlocks()) {
  if (!b.placeable) continue;
  define({
    key: b.key,
    name: b.name,
    category: "block",
    stack: b.stack || 64,
    color: b.color,
    desc: b.desc,
    block: b.key,
    placeable: true,
    rarity: b.minTier >= 4 ? "mythic" : b.minTier >= 3 ? "epic" : b.minTier >= 2 ? "rare" : "common",
    fuel: b.flammable ? (b.key.includes("planks") ? 10 : b.key.includes("log") ? 15 : b.key.includes("sapling") ? 4 : 6) : 0,
  });
}

const EXTRA = [
  ["fiber", "Fiber", "material", [0.62, 0.58, 0.36], "Dry grass and reed, ready to bind or press."],
  ["stick", "Stick", "material", [0.55, 0.4, 0.22], "A straight length of wood."],
  ["flint", "Flint", "material", [0.35, 0.35, 0.36], "A sharp grey shard from gravel."],
  ["clay_ball", "Clay Lump", "material", [0.62, 0.64, 0.68], "Wet clay. Four make a block. One makes a cup."],
  ["clay_cup", "Clay Cup", "material", [0.58, 0.5, 0.42], "A small fired cup."],
  ["brick_item", "Brick", "material", [0.62, 0.32, 0.24], "A single fired brick."],
  ["char", "Char", "material", [0.18, 0.17, 0.16], "Kiln-born fuel. It burns long."],
  ["paper", "Paper", "material", [0.86, 0.84, 0.76], "Pressed fiber. Charts begin here."],
  ["string", "Cord", "material", [0.8, 0.8, 0.74], "Twisted fiber. Bows and beds ask for it."],
  ["raw_cuprite", "Raw Cuprite", "material", [0.3, 0.62, 0.5], "Green ore, still in its stone jacket.", "uncommon"],
  ["raw_ferrite", "Raw Ferrite", "material", [0.55, 0.4, 0.34], "Heavy rust-colored ore.", "uncommon"],
  ["raw_lumenite", "Raw Lumenite", "material", [0.7, 0.76, 0.8], "A cool metallic lump.", "rare"],
  ["raw_sunmetal", "Raw Sunmetal", "material", [0.84, 0.64, 0.28], "Warm flakes that catch noon.", "rare"],
  ["cuprite", "Cuprite Ingot", "material", [0.28, 0.66, 0.52], "Smelted cuprite. Tools and wire start here.", "uncommon"],
  ["ferrite", "Ferrite Ingot", "material", [0.62, 0.64, 0.66], "The backbone metal of a serious camp.", "uncommon"],
  ["lumenite", "Lumenite Ingot", "material", [0.82, 0.86, 0.9], "Pale, hard, and a little proud.", "rare"],
  ["sunmetal", "Sunmetal Ingot", "material", [0.9, 0.72, 0.3], "A warm ingot. Compasses love it.", "rare"],
  ["prismite", "Prismite", "material", [0.55, 0.78, 0.95], "A cut crystal from deep ore or a grown cluster.", "epic"],
  ["deepcore", "Deepcore", "material", [0.4, 0.16, 0.48], "A dense heart-stone from the lowest rock.", "mythic"],
  ["cinderite", "Cinderite", "material", [0.8, 0.28, 0.12], "Volcanic metal. It stays warm in the hand.", "rare"],
  ["prism_shard", "Prism Shard", "material", [0.6, 0.85, 0.95], "A chip of living crystal.", "rare"],
  ["glow_dust", "Glow Dust", "material", [0.5, 0.9, 0.75], "Soft light in a pinch of powder.", "uncommon"],
  ["hide", "Hide", "material", [0.55, 0.4, 0.28], "Cured-enough skin from a wild thing."],
  ["antler", "Antler", "material", [0.72, 0.66, 0.52], "A shed or a taken branch of bone."],
  ["horn", "Horn", "material", [0.7, 0.68, 0.6], "A cliffgoat horn. Tough and hollow."],
  ["feather", "Feather", "material", [0.85, 0.86, 0.84], "A canopy swift left this behind."],
  ["fang", "Fang", "material", [0.86, 0.84, 0.78], "A long tooth. Not a trophy you asked for."],
  ["chitin", "Chitin", "material", [0.3, 0.34, 0.28], "Cavewhelk plate. It turns a blow."],
  ["glow_gland", "Glow Gland", "material", [0.45, 0.9, 0.55], "A living lamp from the deep.", "uncommon"],
  ["slime", "Mire Gel", "material", [0.35, 0.55, 0.3], "Sticky, faintly green, useful in a seeder."],
  ["scale", "Cinder Scale", "material", [0.7, 0.32, 0.16], "Ashmaw armor. Heat slides off it.", "rare"],
  ["membrane", "Light Membrane", "material", [0.7, 0.82, 0.95], "A thin wing-skin from an isleglider.", "rare"],
  ["dark_residue", "Night Residue", "material", [0.2, 0.16, 0.22], "What a nightlurker leaves in the grass."],
  ["kelp", "Dried Kelp", "material", [0.2, 0.4, 0.28], "Leathery and salty. It burns, and it feeds a little."],
  ["berries", "Brambleberries", "food", [0.7, 0.18, 0.28], "Tart handfuls. They take the edge off hunger."],
  ["grain", "Grain Ear", "food", [0.78, 0.66, 0.32], "A heavy ear. Mill it, or eat it plain."],
  ["seed_grain", "Grain Seed", "material", [0.62, 0.55, 0.28], "Plant on tilled soil."],
  ["seed_root", "Root Seed", "material", [0.5, 0.4, 0.24], "A knobbly seed for a root row."],
  ["rootbulb", "Rootbulb", "food", [0.72, 0.5, 0.28], "A crisp underground fruit."],
  ["flour", "Flour", "food", [0.86, 0.82, 0.7], "Milled grain."],
  ["dough", "Dough", "food", [0.8, 0.7, 0.5], "Flour and water, waiting on a kiln."],
  ["bread", "Trail Bread", "food", [0.72, 0.5, 0.28], "Dense, dry, and trustworthy."],
  ["stew", "Wild Stew", "food", [0.5, 0.32, 0.18], "A bowl that warms the ribs."],
  ["mushroom_bite", "Cap Bite", "food", [0.62, 0.42, 0.3], "A raw mushroom. Better cooked, still edible."],
  ["raw_meat", "Raw Cut", "food", [0.7, 0.32, 0.3], "Uncooked meat. It will do, and you will regret it a little."],
  ["cooked_meat", "Seared Cut", "food", [0.55, 0.28, 0.18], "Proper food. The day gets longer after this."],
  ["fish", "Riverfish", "food", [0.55, 0.62, 0.66], "Silver and slight. Cook it if you can."],
  ["cooked_fish", "Grilled Fish", "food", [0.72, 0.58, 0.4], "Flaky, hot, and kind to a swimmer."],
  ["cinder_tea", "Cinder Tea", "food", [0.7, 0.28, 0.14], "A bitter cup. Heat will ignore you for a while.", "rare"],
  ["arrow", "Arrow", "combat", [0.6, 0.5, 0.32], "A straight quarrel for the bow."],
  ["waterskin", "Waterskin", "tool", [0.4, 0.48, 0.62], "Right-click water to fill. Right-click again to pour a source."],
  ["waterskin_full", "Filled Waterskin", "tool", [0.2, 0.45, 0.7], "A skin of river. Pour it, or drink."],
  ["wayfinder", "Wayfinder", "tool", [0.7, 0.55, 0.28], "Points toward the place you first woke.", "uncommon"],
  ["chart", "Waychart", "tool", [0.8, 0.76, 0.64], "Opens the explored map. Press M, or use it.", "uncommon"],
  ["ember_key", "Ember Key", "tool", [0.85, 0.3, 0.1], "Wakes a nightglass frame into an Ember Gate.", "epic"],
  ["sky_key", "Sky Key", "tool", [0.6, 0.8, 0.95], "Wakes a cloudstone frame into a Sky Gate.", "epic"],
  ["burst_charge", "Burst Charge", "tool", [0.7, 0.28, 0.18], "Throw it. After a breath, soft blocks leave."],
  ["suncloak", "Suncloak", "armor", [0.78, 0.5, 0.28], "A scale-lined wrap. Heat arrives more slowly.", "rare"],
  ["bowl", "Wood Bowl", "material", [0.55, 0.4, 0.24], "Holds a stew."],
  ["tarnished_buckle", "Tarnished Buckle", "material", [0.45, 0.4, 0.32], "Junk from a patient river. Sometimes the rod brings this."],
  ["growth_salt", "Verdant Dust", "material", [0.45, 0.75, 0.4], "Right-click a crop to hurry it.", "uncommon"],
];

for (const row of EXTRA) {
  const [key, name, category, color, desc, rarity] = row;
  const foodKeys = {
    berries: [2, 1],
    grain: [2, 1],
    rootbulb: [3, 2],
    flour: [1, 0],
    dough: [2, 1],
    bread: [6, 5],
    stew: [8, 8, "warm"],
    mushroom_bite: [2, 1],
    raw_meat: [2, 1, "hunger"],
    cooked_meat: [8, 7],
    fish: [2, 1],
    cooked_fish: [6, 5, "gills"],
    cinder_tea: [2, 1, "heatward"],
    kelp: [1, 0],
  };
  const food = foodKeys[key];
  define({
    key,
    name,
    category: food ? "food" : category,
    color,
    desc,
    rarity: rarity || (category === "food" ? "common" : "common"),
    food: food ? food[0] : 0,
    sat: food ? food[1] : 0,
    effect: food && food[2] ? food[2] : null,
    stack: key.includes("key") || key === "waterskin" || key === "waterskin_full" || key === "wayfinder" || key === "chart" || key === "suncloak" ? 1 : key === "burst_charge" ? 16 : 64,
    fuel: key === "char" ? 48 : key === "kelp" ? 8 : key === "stick" ? 4 : 0,
    armorSlot: key === "suncloak" ? "chest" : null,
    defense: key === "suncloak" ? 2 : 0,
    heatWard: key === "suncloak" ? 0.55 : 0,
  });
}

const TIERS = [
  { id: "wood", name: "Wood", mat: "verdant_planks", tier: 0, speed: 2.6, dmg: 3, dur: 80, color: [0.55, 0.38, 0.22], rarity: "common" },
  { id: "stone", name: "Stone", mat: "cobble", tier: 1, speed: 4.2, dmg: 4, dur: 160, color: [0.55, 0.54, 0.5], rarity: "common" },
  { id: "cuprite", name: "Cuprite", mat: "cuprite", tier: 2, speed: 5.6, dmg: 5, dur: 280, color: [0.28, 0.62, 0.5], rarity: "uncommon" },
  { id: "ferrite", name: "Ferrite", mat: "ferrite", tier: 3, speed: 7, dmg: 6, dur: 520, color: [0.62, 0.64, 0.66], rarity: "uncommon" },
  { id: "lumenite", name: "Lumenite", mat: "lumenite", tier: 4, speed: 8.4, dmg: 7, dur: 900, color: [0.8, 0.86, 0.9], rarity: "rare" },
  { id: "prismite", name: "Prismite", mat: "prismite", tier: 5, speed: 10, dmg: 8, dur: 1400, color: [0.55, 0.78, 0.95], rarity: "epic" },
];

const TOOLS = [
  ["pick", "Pick", 0],
  ["axe", "Hatchet", 1],
  ["shovel", "Spade", 0],
  ["hoe", "Hoe", 0],
  ["blade", "Blade", 2],
];

for (const tier of TIERS) {
  for (const [type, label, bonus] of TOOLS) {
    define({
      key: tier.id + "_" + type,
      name: tier.name + " " + label,
      category: "tool",
      stack: 1,
      toolType: type === "blade" ? "blade" : type,
      tier: tier.tier,
      speed: tier.speed,
      damage: tier.dmg + bonus,
      durability: tier.dur,
      color: tier.color,
      rarity: tier.rarity,
      repairMat: tier.mat,
      desc: tier.name + " " + label.toLowerCase() + ". Tier " + tier.tier + ". It will wear, and it can be repaired at a bench.",
    });
  }
}

define({
  key: "spear",
  name: "Ferrite Spear",
  category: "combat",
  stack: 1,
  toolType: "blade",
  tier: 3,
  speed: 1,
  damage: 7,
  durability: 320,
  range: 3.4,
  color: [0.62, 0.64, 0.66],
  rarity: "uncommon",
  repairMat: "ferrite",
  desc: "A longer reach. Throw is for arrows; this stays in the hand and bites farther.",
});
define({
  key: "bow",
  name: "Bow",
  category: "combat",
  stack: 1,
  toolType: "bow",
  tier: 0,
  speed: 1,
  damage: 7,
  durability: 280,
  color: [0.5, 0.36, 0.22],
  rarity: "common",
  repairMat: "fiber",
  desc: "Hold right-click to draw. Release to loose an arrow. Damage follows the draw.",
});
define({
  key: "ward",
  name: "Ward",
  category: "combat",
  stack: 1,
  toolType: "shield",
  tier: 1,
  speed: 1,
  damage: 1,
  durability: 240,
  color: [0.5, 0.42, 0.28],
  rarity: "common",
  repairMat: "verdant_planks",
  desc: "Hold right-click to brace. A blow you are facing lands softer.",
});
define({
  key: "rod",
  name: "Fishing Rod",
  category: "tool",
  stack: 1,
  toolType: "rod",
  tier: 0,
  speed: 1,
  damage: 1,
  durability: 120,
  color: [0.45, 0.34, 0.2],
  rarity: "common",
  repairMat: "stick",
  desc: "Cast into water. Wait for the bite, then reel. Early reels catch nothing.",
});

const ARMOR = [
  ["hide", "Hide", 1, 90, [0.55, 0.4, 0.28], "common", 0.35, 0],
  ["ferrite", "Ferrite", 2, 220, [0.6, 0.62, 0.64], "uncommon", 0, 0],
  ["chitin", "Chitin", 2, 180, [0.32, 0.36, 0.3], "uncommon", 0.1, 0.1],
  ["prismite", "Prismite", 3, 340, [0.55, 0.75, 0.9], "epic", 0.25, 0.25],
];
const SLOTS = [
  ["cowl", "Cowl", "head", 0.8],
  ["coat", "Coat", "chest", 1.3],
  ["trousers", "Trousers", "legs", 1.1],
  ["boots", "Boots", "feet", 0.7],
];
for (const [id, name, defense, dur, color, rarity, cold, heat] of ARMOR) {
  for (const [slotId, slotName, slot, mul] of SLOTS) {
    define({
      key: id + "_" + slotId,
      name: name + " " + slotName,
      category: "armor",
      stack: 1,
      durability: dur,
      defense: defense * mul,
      armorSlot: slot,
      color,
      rarity,
      coldWard: cold,
      heatWard: heat,
      repairMat: id === "hide" ? "hide" : id === "chitin" ? "chitin" : id === "prismite" ? "prismite" : "ferrite",
      desc: name + " protection for the " + slot + ". It wears down when it saves you.",
    });
  }
}

export function getItem(key) {
  return items[key] || null;
}

export function allItems() {
  return Object.values(items);
}

export function isBlockItem(item) {
  return !!(item && item.placeable && getBlockByKey(item.block || item.key));
}

export function itemMatches(got, need) {
  if (!need) return !got;
  if (!got) return false;
  if (Array.isArray(need)) return need.includes(got);
  if (need === "planks") return typeof got === "string" && got.endsWith("_planks");
  if (need === "log") return typeof got === "string" && got.endsWith("_log");
  if (need === "sapling") return typeof got === "string" && got.endsWith("_sapling");
  if (need === "stone_like") return got === "cobble" || got === "stone" || got === "stone_brick";
  return got === need;
}

export const PLANKS = ["verdant_planks", "amberpine_planks", "lushbark_planks", "silverwood_planks", "mirewood_planks"];
export const LOGS = ["verdant_log", "amberpine_log", "lushbark_log", "silverwood_log", "mirewood_log"];

export const MAX_STACK = 64;

export function makeStack(key, count = 1, durOrExtra = 0, maxDur = 0) {
  const def = getItem(key);
  if (!def) return null;
  let dur = 0;
  let mDur = def.durability || 0;
  let extra = null;
  if (typeof durOrExtra === 'object' && durOrExtra !== null) {
    extra = durOrExtra;
    if (extra.dur != null) dur = extra.dur;
    if (extra.maxDur != null) mDur = extra.maxDur;
  } else {
    dur = durOrExtra | 0;
    if (maxDur) mDur = maxDur | 0;
  }
  const stack = { key, count: count | 0, dur, maxDur: mDur };
  if (extra) {
    for (const k in extra) {
      if (k !== 'dur' && k !== 'maxDur') stack[k] = extra[k];
    }
  }
  return stack;
}

export function getItemDef(key) {
  return getItem(key);
}

export function stackKey(stack) {
  return stack ? stack.key : null;
}

export { items };
