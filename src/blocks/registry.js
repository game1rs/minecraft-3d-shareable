import { FLAG } from "../engine/constants.js";

const byId = new Array(512);
const byKey = Object.create(null);

function define(partial) {
  const b = {
    hardness: 1,
    tool: "none",
    minTier: 0,
    soft: true,
    sound: "stone",
    light: 0,
    opacity: 15,
    render: "solid",
    collision: "solid",
    friction: 0.78,
    blast: 3,
    drops: null,
    tags: [],
    shape: "cube",
    tint: "none",
    rough: 0.86,
    metal: 0,
    emit: 0,
    color: [0.5, 0.5, 0.5],
    tile: "stone",
    tileTop: null,
    tileSide: null,
    tileBottom: null,
    replaceable: false,
    unbreakable: false,
    liquid: false,
    climb: false,
    flammable: false,
    axis: false,
    functional: null,
    placeable: true,
    stack: 64,
    category: "block",
    desc: "",
    ...partial,
  };
  if (b.render === "none") {
    b.opacity = 0;
    b.collision = "none";
    b.placeable = false;
  }
  if (b.render === "cutout" || b.render === "cross") {
    b.opacity = b.opacity === 15 ? 1 : b.opacity;
  }
  if (b.render === "water" || b.render === "glass") b.opacity = Math.min(b.opacity, 2);
  if (b.collision === "none" || b.collision === "liquid" || b.collision === "ladder") {
    if (b.opacity === 15 && b.render !== "solid") b.opacity = 1;
  }
  if (b.drops == null && b.placeable && b.render !== "none") b.drops = [{ item: b.key, count: 1 }];
  if (!b.desc) b.desc = b.name + ".";
  byId[b.id] = b;
  byKey[b.key] = b;
  return b;
}

define({ id: 0, key: "air", name: "Air", render: "none", hardness: 0, opacity: 0, blast: 0, placeable: false, drops: [] });

define({ id: 1, key: "grass", name: "Grass", tile: "grass_side", tileTop: "grass_top", tileBottom: "dirt", color: [0.45, 0.66, 0.3], hardness: 0.55, tool: "shovel", soft: true, sound: "grass", tint: "grass", rough: 0.9, drops: [{ item: "dirt", count: 1 }], desc: "A living skin of roots and blades." });
define({ id: 2, key: "dirt", name: "Dirt", tile: "dirt", color: [0.45, 0.32, 0.2], hardness: 0.5, tool: "shovel", soft: true, sound: "dirt", rough: 0.95, desc: "Dark soil. It holds water and seed." });
define({ id: 3, key: "stone", name: "Stone", tile: "stone", color: [0.5, 0.5, 0.48], hardness: 2.3, tool: "pick", soft: false, minTier: 0, sound: "stone", blast: 6, drops: [{ item: "cobble", count: 1 }], desc: "Old bedrock-weathered rock. Breaks into cobble." });
define({ id: 4, key: "sand", name: "Sand", tile: "sand", color: [0.82, 0.74, 0.52], hardness: 0.5, tool: "shovel", soft: true, sound: "sand", friction: 0.62, tags: ["falling"], desc: "Fine wind-sorted grains. It falls if unsupported." });
define({ id: 5, key: "gravel", name: "Gravel", tile: "gravel", color: [0.5, 0.48, 0.44], hardness: 0.6, tool: "shovel", soft: true, sound: "gravel", tags: ["falling"], drops: [{ item: "flint", count: 1, chance: 0.12 }, { item: "gravel", count: 1, chance: 0.88 }], desc: "Loose stone. Sometimes hides a flint edge." });
define({ id: 6, key: "clay", name: "Clay", tile: "clay", color: [0.62, 0.64, 0.68], hardness: 0.6, tool: "shovel", soft: true, sound: "mud", drops: [{ item: "clay_ball", count: 4 }], desc: "Heavy river clay. Four lumps to a block." });
define({ id: 7, key: "snow", name: "Snow", tile: "snow", color: [0.9, 0.93, 0.95], hardness: 0.35, tool: "shovel", soft: true, sound: "snow", friction: 0.7, rough: 0.7, desc: "Packed winter. Quiet underfoot." });
define({ id: 8, key: "ice", name: "Ice", tile: "ice", color: [0.7, 0.84, 0.9], hardness: 0.5, tool: "pick", soft: true, sound: "glass", render: "glass", collision: "solid", friction: 0.04, rough: 0.08, opacity: 2, blast: 0.5, desc: "Slick and blue. You will not stop quickly." });
define({ id: 9, key: "mud", name: "Mud", tile: "mud", color: [0.32, 0.26, 0.18], hardness: 0.55, tool: "shovel", soft: true, sound: "mud", friction: 0.35, desc: "Sucking wetland soil. It slows a stride." });
define({ id: 10, key: "bedrock", name: "Bedrock", tile: "bedrock", color: [0.16, 0.16, 0.17], hardness: -1, unbreakable: true, tool: "none", soft: false, blast: 999, sound: "stone", desc: "The floor of the world. It does not yield." });
define({ id: 11, key: "forest_floor", name: "Forest Floor", tile: "forest_floor", tileTop: "forest_floor", tileBottom: "dirt", color: [0.32, 0.4, 0.22], hardness: 0.55, tool: "shovel", soft: true, sound: "grass", tint: "foliage", drops: [{ item: "dirt", count: 1 }], desc: "Needle-duff and leaf mould." });
define({ id: 12, key: "dry_earth", name: "Dry Earth", tile: "dry_earth", color: [0.62, 0.5, 0.3], hardness: 0.55, tool: "shovel", soft: true, sound: "dirt", desc: "Sun-baked savannah soil." });
define({ id: 13, key: "red_sand", name: "Red Sand", tile: "red_sand", color: [0.72, 0.4, 0.26], hardness: 0.5, tool: "shovel", soft: true, sound: "sand", friction: 0.62, tags: ["falling"], desc: "Iron-stained dunes." });
define({ id: 14, key: "ash", name: "Ash", tile: "ash", color: [0.28, 0.26, 0.25], hardness: 0.45, tool: "shovel", soft: true, sound: "sand", tags: ["falling"], desc: "What the vents leave behind." });
define({ id: 15, key: "basalt", name: "Basalt", tile: "basalt", color: [0.22, 0.2, 0.22], hardness: 2.6, tool: "pick", soft: false, minTier: 0, sound: "stone", blast: 8, desc: "Columnar volcanic stone." });
define({ id: 16, key: "nightglass", name: "Nightglass", tile: "nightglass", color: [0.08, 0.07, 0.1], hardness: 8, tool: "pick", soft: false, minTier: 3, sound: "stone", blast: 40, rough: 0.35, desc: "A black volcanic glass. Frames the road to Emberdepth." });
define({ id: 17, key: "moss", name: "Moss", tile: "moss", color: [0.28, 0.46, 0.26], hardness: 0.4, tool: "shovel", soft: true, sound: "grass", tint: "foliage", desc: "A soft green cloth on stone." });
define({ id: 18, key: "coarse_dirt", name: "Coarse Dirt", tile: "coarse", color: [0.4, 0.3, 0.2], hardness: 0.55, tool: "shovel", soft: true, sound: "dirt", desc: "Gritty soil that refuses grass." });
define({ id: 19, key: "sandstone", name: "Sandstone", tile: "sandstone", color: [0.78, 0.68, 0.46], hardness: 1.8, tool: "pick", soft: false, minTier: 0, sound: "stone", desc: "Wind pressed into shelves." });
define({ id: 20, key: "red_sandstone", name: "Red Sandstone", tile: "red_sandstone", color: [0.68, 0.36, 0.24], hardness: 1.8, tool: "pick", soft: false, minTier: 0, sound: "stone", desc: "Canyon stone, warm even at dusk." });
define({ id: 21, key: "deepstone", name: "Deepstone", tile: "deepstone", color: [0.28, 0.3, 0.32], hardness: 3.2, tool: "pick", soft: false, minTier: 1, sound: "stone", blast: 8, drops: [{ item: "cobble", count: 1 }], desc: "The dark rock under the water table." });
define({ id: 22, key: "magma", name: "Magma", tile: "magma", color: [0.7, 0.22, 0.08], hardness: 1.6, tool: "pick", soft: false, minTier: 0, sound: "stone", light: 6, emit: 0.7, tags: ["hot"], desc: "A crust over slow fire. Stand elsewhere." });
define({ id: 23, key: "lava", name: "Lava", tile: "lava", color: [0.95, 0.35, 0.05], hardness: -1, unbreakable: true, render: "solid", collision: "liquid", liquid: true, opacity: 15, light: 15, emit: 1, sound: "stone", tags: ["hot"], blast: 20, desc: "Slow fire. It does not forgive a misstep." });
define({ id: 24, key: "water", name: "Water", tile: "water", color: [0.15, 0.4, 0.55], hardness: 0.2, render: "water", collision: "liquid", liquid: true, opacity: 1, soft: true, sound: "wet", rough: 0.05, replaceable: true, drops: [], desc: "Cold, clear, and heavier than it looks." });
define({ id: 25, key: "mycelium", name: "Mycelium", tile: "mycelium", tileTop: "mycelium", tileBottom: "dirt", color: [0.45, 0.38, 0.5], hardness: 0.55, tool: "shovel", soft: true, sound: "grass", drops: [{ item: "dirt", count: 1 }], desc: "A pale net of fungal threads." });
define({ id: 26, key: "snow_cap", name: "Snow Cap", tile: "snow", color: [0.92, 0.95, 0.96], hardness: 0.15, tool: "shovel", soft: true, sound: "snow", render: "model", shape: "snow", collision: "none", opacity: 0, desc: "A thin winter film." });
define({ id: 27, key: "packed_ice", name: "Packed Ice", tile: "packed_ice", color: [0.62, 0.78, 0.86], hardness: 1.2, tool: "pick", soft: false, minTier: 0, sound: "glass", friction: 0.08, rough: 0.2, desc: "Old ice, dense enough to build with." });
define({ id: 28, key: "cloudstone", name: "Cloudstone", tile: "cloudstone", color: [0.78, 0.8, 0.84], hardness: 1.5, tool: "pick", soft: false, minTier: 0, sound: "stone", rough: 0.55, desc: "Pale stone from the floating gardens." });
define({ id: 29, key: "scorched", name: "Scorched Rock", tile: "scorched", color: [0.3, 0.18, 0.14], hardness: 2.4, tool: "pick", soft: false, minTier: 0, sound: "stone", desc: "Heat-cracked rock, still warm." });

const WOODS = [
  ["amberpine", "Amberpine", [0.42, 0.28, 0.16], [0.18, 0.38, 0.26]],
  ["verdant", "Verdant", [0.45, 0.32, 0.18], [0.28, 0.5, 0.22]],
  ["lushbark", "Lushbark", [0.36, 0.26, 0.14], [0.14, 0.42, 0.18]],
  ["silverwood", "Silverwood", [0.72, 0.7, 0.64], [0.55, 0.66, 0.48]],
  ["mirewood", "Mirewood", [0.32, 0.26, 0.2], [0.24, 0.36, 0.2]],
];
WOODS.forEach((w, i) => {
  const [key, name, bark, leaf] = w;
  const base = 30 + i * 4;
  define({ id: base, key: key + "_log", name: name + " Log", tile: key + "_side", tileTop: key + "_top", tileSide: key + "_side", color: bark, hardness: 1.7, tool: "axe", soft: true, sound: "wood", flammable: true, axis: true, blast: 2, desc: "A trunk of " + name.toLowerCase() + ". Axis follows the face you build on." });
  define({ id: base + 1, key: key + "_leaves", name: name + " Leaves", tile: key + "_leaves", color: leaf, hardness: 0.25, tool: "none", soft: true, sound: "grass", render: "cutout", collision: "none", opacity: 1, tint: "foliage", flammable: true, drops: [{ item: key + "_sapling", count: 1, chance: 0.08 }, { item: "stick", count: 1, chance: 0.12 }], desc: "A breathing canopy." });
  define({ id: base + 2, key: key + "_planks", name: name + " Planks", tile: key + "_planks", color: bark.map((c) => Math.min(1, c + 0.12)), hardness: 1.4, tool: "axe", soft: true, sound: "wood", flammable: true, blast: 2, desc: "Sawn boards, ready for a wall or a tool." });
  define({ id: base + 3, key: key + "_sapling", name: name + " Sapling", tile: "sapling", color: leaf, hardness: 0.05, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, replaceable: true, tint: "foliage", flammable: true, tags: ["sapling", key], desc: "Give it sky and time. It remembers how to be a tree." });
});

define({ id: 50, key: "tallgrass", name: "Wildgrass", tile: "tallgrass", color: [0.45, 0.66, 0.3], hardness: 0.02, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, replaceable: true, tint: "grass", drops: [{ item: "fiber", count: 1, chance: 0.45 }], desc: "Knee-high grass. Good for fiber." });
define({ id: 51, key: "flower_amber", name: "Amberbloom", tile: "flower_amber", color: [0.9, 0.62, 0.22], hardness: 0.02, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, replaceable: true, drops: [{ item: "flower_amber", count: 1 }], desc: "A warm meadow flower. It dyes plaster amber." });
define({ id: 52, key: "flower_blue", name: "Rillflower", tile: "flower_blue", color: [0.3, 0.48, 0.86], hardness: 0.02, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, replaceable: true, drops: [{ item: "flower_blue", count: 1 }], desc: "A blue flower that follows wet ground." });
define({ id: 53, key: "flower_white", name: "Moonpetal", tile: "flower_white", color: [0.9, 0.9, 0.86], hardness: 0.02, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, replaceable: true, drops: [{ item: "flower_white", count: 1 }], desc: "Pale petals, bright at dusk." });
define({ id: 54, key: "flower_pink", name: "Thornrose", tile: "flower_pink", color: [0.86, 0.45, 0.55], hardness: 0.02, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, replaceable: true, drops: [{ item: "flower_pink", count: 1 }], desc: "A low wild rose." });
define({ id: 55, key: "bush", name: "Brush", tile: "bush", color: [0.3, 0.48, 0.24], hardness: 0.15, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, tint: "foliage", drops: [{ item: "stick", count: 1, chance: 0.4 }, { item: "fiber", count: 1, chance: 0.4 }], desc: "A stubborn shrub." });
define({ id: 56, key: "reed", name: "River Reed", tile: "reed", color: [0.45, 0.58, 0.28], hardness: 0.1, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, tags: ["reed"], drops: [{ item: "fiber", count: 1 }], desc: "Grows beside water. Fiber for bindings and paper." });
define({ id: 57, key: "mushroom_red", name: "Cinder Cap", tile: "mushroom_red", color: [0.7, 0.22, 0.18], hardness: 0.05, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, replaceable: true, drops: [{ item: "mushroom_bite", count: 1 }], desc: "A small red cap. Edible, barely." });
define({ id: 58, key: "mushroom_tan", name: "Loam Cap", tile: "mushroom_tan", color: [0.62, 0.5, 0.32], hardness: 0.05, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, replaceable: true, drops: [{ item: "mushroom_bite", count: 1 }], desc: "A tan mushroom of damp shade." });
define({ id: 59, key: "mushroom_stem", name: "Giant Stem", tile: "mushroom_stem", color: [0.82, 0.78, 0.7], hardness: 0.8, tool: "axe", soft: true, sound: "wood", desc: "The stalk of a valley giant." });
define({ id: 60, key: "mushroom_cap", name: "Giant Cap", tile: "mushroom_cap", color: [0.62, 0.24, 0.28], hardness: 0.7, tool: "axe", soft: true, sound: "wood", desc: "Spongy and vast." });
define({ id: 61, key: "spineplant", name: "Spineplant", tile: "spineplant", color: [0.3, 0.5, 0.26], hardness: 0.4, sound: "wood", render: "model", shape: "spine", collision: "spine", tags: ["hurt"], desc: "A desert column of thorns. Touching it costs blood." });
define({ id: 62, key: "deadbush", name: "Dead Brush", tile: "deadbush", color: [0.48, 0.38, 0.24], hardness: 0.05, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, replaceable: true, drops: [{ item: "stick", count: 1, chance: 0.5 }], desc: "A dry reminder of rain." });
define({ id: 63, key: "glowfungus", name: "Glow Fungus", tile: "glowfungus", color: [0.45, 0.85, 0.7], hardness: 0.05, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, light: 8, emit: 0.8, drops: [{ item: "glow_dust", count: 1, chance: 0.6 }, { item: "mushroom_bite", count: 1, chance: 0.4 }], desc: "Cave light that does not burn a hand." });
define({ id: 64, key: "crystal", name: "Prism Cluster", tile: "crystal", color: [0.55, 0.8, 0.9], hardness: 1.4, tool: "pick", soft: false, minTier: 2, sound: "glass", render: "model", shape: "crystal", collision: "none", opacity: 0, light: 10, emit: 0.75, rough: 0.15, drops: [{ item: "prism_shard", count: 1 }, { item: "glow_dust", count: 1, chance: 0.3 }], desc: "A grown prism. It hums if you listen." });
define({ id: 65, key: "vine", name: "Creeper Vine", tile: "vine", color: [0.22, 0.45, 0.2], hardness: 0.15, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, tint: "foliage", climb: true, desc: "A climbing vine. You can scale it." });
define({ id: 66, key: "berry_bush", name: "Bramble Bush", tile: "berry", color: [0.3, 0.45, 0.22], hardness: 0.15, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, tags: ["berry"], desc: "Right-click a ripe bush to take brambleberries." });
define({ id: 67, key: "kelp", name: "Tidekelp", tile: "kelp", color: [0.15, 0.45, 0.3], hardness: 0.1, sound: "wet", render: "cross", shape: "cross", collision: "none", opacity: 0, tags: ["kelp"], drops: [{ item: "kelp", count: 1 }], desc: "A salt ribbon. It can be dried for fuel." });
define({ id: 68, key: "coral_peach", name: "Peach Coral", tile: "coral_peach", color: [0.9, 0.55, 0.42], hardness: 0.7, tool: "pick", soft: true, sound: "stone", desc: "A warm reef lattice. Original to these seas." });
define({ id: 69, key: "coral_teal", name: "Teal Coral", tile: "coral_teal", color: [0.2, 0.65, 0.6], hardness: 0.7, tool: "pick", soft: true, sound: "stone", desc: "Cool-water coral, branching like frost." });
define({ id: 70, key: "coral_cream", name: "Cream Coral", tile: "coral_cream", color: [0.86, 0.8, 0.62], hardness: 0.7, tool: "pick", soft: true, sound: "stone", desc: "Pale coral of shallow shelves." });
define({ id: 71, key: "seagrass", name: "Seagrass", tile: "seagrass", color: [0.2, 0.5, 0.32], hardness: 0.02, sound: "wet", render: "cross", shape: "cross", collision: "none", opacity: 0, replaceable: true, desc: "A green comb under the tide." });

define({ id: 80, key: "cuprite_ore", name: "Cuprite Ore", tile: "cuprite_ore", color: [0.4, 0.55, 0.48], hardness: 2.6, tool: "pick", soft: false, minTier: 1, sound: "stone", drops: [{ item: "raw_cuprite", count: 1 }], desc: "Green-veined ore. A stone pick will free it." });
define({ id: 81, key: "ferrite_ore", name: "Ferrite Ore", tile: "ferrite_ore", color: [0.55, 0.42, 0.36], hardness: 3, tool: "pick", soft: false, minTier: 1, sound: "stone", drops: [{ item: "raw_ferrite", count: 1 }], desc: "Rusty iron-kin. Smelt it in a kiln." });
define({ id: 82, key: "lumenite_ore", name: "Lumenite Ore", tile: "lumenite_ore", color: [0.55, 0.6, 0.66], hardness: 3.3, tool: "pick", soft: false, minTier: 2, sound: "stone", drops: [{ item: "raw_lumenite", count: 1 }], desc: "A cool silver ore. Needs a cuprite pick." });
define({ id: 83, key: "sunmetal_ore", name: "Sunmetal Ore", tile: "sunmetal_ore", color: [0.7, 0.58, 0.28], hardness: 3.4, tool: "pick", soft: false, minTier: 2, sound: "stone", drops: [{ item: "raw_sunmetal", count: 1 }], desc: "Warm flakes in stone. Uncommon, and worth the shaft." });
define({ id: 84, key: "prismite_ore", name: "Prismite Ore", tile: "prismite_ore", color: [0.45, 0.55, 0.7], hardness: 3.8, tool: "pick", soft: false, minTier: 3, sound: "stone", light: 3, emit: 0.25, drops: [{ item: "prismite", count: 1 }], desc: "Rare crystal ore. A ferrite pick can bite it." });
define({ id: 85, key: "deepcore_ore", name: "Deepcore Ore", tile: "deepcore_ore", color: [0.35, 0.2, 0.4], hardness: 4.6, tool: "pick", soft: false, minTier: 4, sound: "stone", drops: [{ item: "deepcore", count: 1 }], desc: "The deep rare. Only lumenite tools bring it home." });
define({ id: 86, key: "cinderite_ore", name: "Cinderite Ore", tile: "cinderite_ore", color: [0.55, 0.22, 0.12], hardness: 3.2, tool: "pick", soft: false, minTier: 2, sound: "stone", light: 4, emit: 0.35, drops: [{ item: "cinderite", count: 1 }], desc: "Volcanic ore. Found in hot country and Emberdepth." });
define({ id: 87, key: "cuprite_block", name: "Cuprite Block", tile: "cuprite_block", color: [0.35, 0.62, 0.52], hardness: 3, tool: "pick", soft: false, minTier: 1, sound: "metal", metal: 0.7, rough: 0.35, desc: "A stored mass of cuprite." });
define({ id: 88, key: "ferrite_block", name: "Ferrite Block", tile: "ferrite_block", color: [0.55, 0.56, 0.58], hardness: 4, tool: "pick", soft: false, minTier: 1, sound: "metal", metal: 0.85, rough: 0.4, desc: "Solid ferrite. Heavy, honest metal." });
define({ id: 89, key: "lumenite_block", name: "Lumenite Block", tile: "lumenite_block", color: [0.75, 0.8, 0.84], hardness: 4, tool: "pick", soft: false, minTier: 2, sound: "metal", metal: 0.9, rough: 0.25, desc: "A pale mirror of a block." });
define({ id: 90, key: "sunmetal_block", name: "Sunmetal Block", tile: "sunmetal_block", color: [0.86, 0.68, 0.28], hardness: 3.5, tool: "pick", soft: false, minTier: 2, sound: "metal", metal: 1, rough: 0.28, desc: "Warm gold-kin, stacked for a treasury or a roof." });
define({ id: 91, key: "prismite_block", name: "Prismite Block", tile: "prismite_block", color: [0.55, 0.75, 0.95], hardness: 4.5, tool: "pick", soft: false, minTier: 3, sound: "glass", metal: 0.2, rough: 0.12, light: 6, emit: 0.4, desc: "A cut block of prismite. It holds a quiet light." });
define({ id: 92, key: "deepcore_block", name: "Deepcore Block", tile: "deepcore_block", color: [0.28, 0.12, 0.32], hardness: 6, tool: "pick", soft: false, minTier: 4, sound: "metal", metal: 0.5, rough: 0.3, emit: 0.2, desc: "The rarest solid. It drinks light and gives a little back." });
define({ id: 93, key: "cinderite_block", name: "Cinderite Block", tile: "cinderite_block", color: [0.7, 0.28, 0.12], hardness: 3.5, tool: "pick", soft: false, minTier: 2, sound: "metal", light: 7, emit: 0.55, desc: "Banked volcanic metal." });

define({ id: 100, key: "cobble", name: "Cobble", tile: "cobble", color: [0.46, 0.44, 0.42], hardness: 2, tool: "pick", soft: false, minTier: 0, sound: "stone", blast: 6, desc: "Field stone. The first honest wall." });
define({ id: 101, key: "stone_brick", name: "Stone Brick", tile: "stone_brick", color: [0.52, 0.51, 0.48], hardness: 2.2, tool: "pick", soft: false, minTier: 0, sound: "stone", blast: 7, desc: "Cut and coursed. Castles start here." });
define({ id: 102, key: "mossy_brick", name: "Mossy Brick", tile: "mossy_brick", color: [0.4, 0.48, 0.38], hardness: 2.1, tool: "pick", soft: false, minTier: 0, sound: "stone", desc: "Brick that has kept a garden's company." });
define({ id: 103, key: "polished", name: "Polished Stone", tile: "polished", color: [0.62, 0.62, 0.6], hardness: 2.3, tool: "pick", soft: false, minTier: 0, sound: "stone", rough: 0.45, desc: "A floor that answers a boot." });
define({ id: 104, key: "tiles", name: "Stone Tiles", tile: "tiles", color: [0.58, 0.56, 0.52], hardness: 2.3, tool: "pick", soft: false, minTier: 0, sound: "stone", rough: 0.4, desc: "Tight tiles for halls and courtyards." });
define({ id: 105, key: "glass", name: "Glass", tile: "glass", color: [0.75, 0.84, 0.86], hardness: 0.35, sound: "glass", render: "glass", collision: "solid", opacity: 1, rough: 0.05, blast: 0.3, drops: [], desc: "Kiln-born sheet. It breaks without a gift." });
define({ id: 106, key: "lamp", name: "Lamp", tile: "lamp", color: [1, 0.9, 0.7], hardness: 0.4, sound: "glass", light: 15, emit: 0.95, rough: 0.3, functional: "lamp", desc: "A steady room sun. Spark can dim it." });
define({ id: 107, key: "brick", name: "Brick", tile: "brick", color: [0.62, 0.32, 0.24], hardness: 2, tool: "pick", soft: false, minTier: 0, sound: "stone", desc: "Fired clay, red as a kiln mouth." });
define({ id: 108, key: "mud_brick", name: "Mud Brick", tile: "mud_brick", color: [0.48, 0.36, 0.26], hardness: 1.5, tool: "pick", soft: true, sound: "stone", desc: "Dried mud, good for warm walls." });
define({ id: 109, key: "ash_brick", name: "Ash Brick", tile: "ash_brick", color: [0.32, 0.3, 0.3], hardness: 1.8, tool: "pick", soft: false, minTier: 0, sound: "stone", desc: "Pressed ash and slag." });

const PLASTERS = [
  ["white", "White", [0.9, 0.89, 0.86]],
  ["cream", "Cream", [0.9, 0.84, 0.7]],
  ["red", "Red", [0.7, 0.32, 0.28]],
  ["blue", "Blue", [0.32, 0.42, 0.68]],
  ["green", "Green", [0.32, 0.5, 0.36]],
  ["amber", "Amber", [0.78, 0.52, 0.24]],
  ["charcoal", "Charcoal", [0.22, 0.21, 0.2]],
  ["violet", "Violet", [0.46, 0.34, 0.58]],
];
PLASTERS.forEach((p, i) => {
  define({ id: 110 + i, key: "plaster_" + p[0], name: p[1] + " Plaster", tile: "plaster_" + p[0], color: p[2], hardness: 1.2, tool: "pick", soft: true, sound: "stone", rough: 0.7, desc: "Tinted wall plaster." });
});

define({ id: 130, key: "field_bench", name: "Field Bench", tile: "bench", tileTop: "bench_top", color: [0.5, 0.36, 0.22], hardness: 2, tool: "axe", soft: true, sound: "wood", functional: "bench", desc: "A 3×3 craft. Right-click to work. Crouch-place to build against it." });
define({ id: 131, key: "kiln", name: "Kiln", tile: "kiln", tileTop: "kiln_top", color: [0.4, 0.38, 0.36], hardness: 3, tool: "pick", soft: false, minTier: 0, sound: "stone", functional: "kiln", light: 0, desc: "Smelts ore, cooks meat, fires clay. Feed it wood or char." });
define({ id: 132, key: "coffer", name: "Coffer", tile: "coffer", tileTop: "coffer_top", color: [0.48, 0.34, 0.2], hardness: 2, tool: "axe", soft: true, sound: "wood", functional: "coffer", desc: "Twenty-seven slots of kept things." });
define({ id: 133, key: "door", name: "Wood Door", tile: "door", color: [0.5, 0.36, 0.22], hardness: 2, tool: "axe", soft: true, sound: "wood", render: "model", shape: "door", collision: "door", opacity: 1, functional: "door", desc: "A two-block door. Right-click to swing it." });
define({ id: 134, key: "spark_door", name: "Spark Door", tile: "spark_door", color: [0.55, 0.56, 0.58], hardness: 4, tool: "pick", soft: false, minTier: 1, sound: "metal", render: "model", shape: "door", collision: "door", opacity: 1, functional: "spark_door", metal: 0.6, desc: "Opens only while spark power reaches it." });
define({ id: 135, key: "ladder", name: "Ladder", tile: "ladder", color: [0.55, 0.4, 0.24], hardness: 0.4, tool: "axe", soft: true, sound: "wood", render: "model", shape: "ladder", collision: "ladder", opacity: 0, climb: true, desc: "Climb with forward or jump. Crouch to descend." });
define({ id: 136, key: "torch", name: "Torch", tile: "torch", color: [0.9, 0.7, 0.3], hardness: 0.05, sound: "wood", render: "model", shape: "torch", collision: "none", opacity: 0, light: 14, emit: 1, functional: "torch", desc: "A pocket of day. Place it on floors or walls." });
define({ id: 137, key: "lever", name: "Spark Lever", tile: "lever", color: [0.45, 0.32, 0.2], hardness: 0.4, sound: "wood", render: "model", shape: "lever", collision: "none", opacity: 0, functional: "lever", desc: "A power source. Right-click to throw it." });
define({ id: 138, key: "spark_wire", name: "Spark Wire", tile: "spark_wire", color: [0.6, 0.2, 0.16], hardness: 0.1, sound: "stone", render: "model", shape: "wire", collision: "none", opacity: 0, functional: "wire", desc: "Carries spark. Power fades one step per block." });
define({ id: 139, key: "sensor", name: "Motion Sensor", tile: "sensor", color: [0.3, 0.55, 0.5], hardness: 0.5, tool: "pick", soft: true, sound: "stone", functional: "sensor", desc: "Emits spark while a body is near." });
define({ id: 140, key: "timer", name: "Interval Relay", tile: "timer", color: [0.45, 0.4, 0.32], hardness: 0.5, tool: "pick", soft: true, sound: "stone", functional: "timer", desc: "Pulses spark on a steady interval." });
define({ id: 141, key: "piston", name: "Pusher", tile: "piston", color: [0.5, 0.48, 0.4], hardness: 1.5, tool: "pick", soft: true, sound: "stone", functional: "piston", desc: "When powered, pushes up to four blocks. Sticky: it pulls one back." });
define({ id: 142, key: "piston_head", name: "Pusher Head", tile: "piston_head", color: [0.55, 0.5, 0.4], hardness: -1, unbreakable: true, placeable: false, render: "model", shape: "piston_head", collision: "solid", drops: [], desc: "The arm of a pusher." });
define({ id: 143, key: "conveyor", name: "Hauler", tile: "conveyor", color: [0.35, 0.36, 0.38], hardness: 1.2, tool: "pick", soft: true, sound: "metal", functional: "conveyor", metal: 0.4, desc: "Slides dropped items along its facing, into a coffer if one waits." });
define({ id: 144, key: "plate", name: "Tread Plate", tile: "plate", color: [0.55, 0.52, 0.45], hardness: 0.4, tool: "pick", soft: true, sound: "stone", render: "model", shape: "plate", collision: "plate", functional: "plate", desc: "Emits spark while something stands on it." });
define({ id: 145, key: "bed", name: "Bedroll", tile: "bed", color: [0.55, 0.28, 0.28], hardness: 0.4, tool: "axe", soft: true, sound: "cloth", render: "model", shape: "bed", collision: "slab", functional: "bed", desc: "Right-click to anchor spawn. At night, if it is safe, you may sleep to dawn." });
define({ id: 146, key: "campfire", name: "Campfire", tile: "campfire", color: [0.85, 0.4, 0.12], hardness: 0.8, tool: "axe", soft: true, sound: "wood", light: 12, emit: 0.9, functional: "campfire", tags: ["hot"], desc: "Warmth, light, and a place to cook if you are desperate." });
define({ id: 147, key: "farmland", name: "Tilled Soil", tile: "farmland", tileTop: "farmland", color: [0.35, 0.24, 0.14], hardness: 0.5, tool: "shovel", soft: true, sound: "dirt", render: "model", shape: "farmland", collision: "farmland", functional: "farmland", drops: [{ item: "dirt", count: 1 }], desc: "Worked with a hoe. Crops prefer it moist." });
define({ id: 148, key: "crop", name: "Grain Crop", tile: "crop", color: [0.6, 0.7, 0.3], hardness: 0.05, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, tags: ["crop"], drops: [{ item: "grain", count: 1, chance: 0.3 }, { item: "seed_grain", count: 1 }], desc: "A grain row. Harvest when tall, or right-click to take the ear and leave the root." });
define({ id: 149, key: "seeder", name: "Seeder", tile: "seeder", color: [0.4, 0.48, 0.3], hardness: 1.2, tool: "axe", soft: true, sound: "wood", functional: "seeder", desc: "When sparked, plants a seed from an adjacent coffer onto tilled soil." });
define({ id: 150, key: "gate", name: "Gate", tile: "gate", color: [0.5, 0.36, 0.22], hardness: 1.5, tool: "axe", soft: true, sound: "wood", render: "model", shape: "gate", collision: "gate", functional: "gate", desc: "A one-block gate. Right-click to open." });
define({ id: 151, key: "fence", name: "Fence", tile: "fence", color: [0.5, 0.36, 0.22], hardness: 1.4, tool: "axe", soft: true, sound: "wood", render: "model", shape: "fence", collision: "fence", desc: "A post-and-rail fence. It connects to neighbors." });
define({ id: 152, key: "wall", name: "Wall", tile: "wall", color: [0.5, 0.48, 0.45], hardness: 2, tool: "pick", soft: false, minTier: 0, sound: "stone", render: "model", shape: "wall", collision: "wall", desc: "A low connecting wall." });
define({ id: 153, key: "pillar", name: "Pillar", tile: "pillar", color: [0.62, 0.6, 0.56], hardness: 2, tool: "pick", soft: false, minTier: 0, sound: "stone", render: "model", shape: "pillar", collision: "pillar", desc: "A slender column. You can slip beside it." });
define({ id: 154, key: "portal_ember", name: "Ember Gate", tile: "portal_ember", color: [0.9, 0.3, 0.08], hardness: -1, unbreakable: true, render: "model", shape: "portal", collision: "none", opacity: 0, light: 11, emit: 1, functional: "portal", desc: "A burning doorway. Step through." });
define({ id: 155, key: "portal_sky", name: "Sky Gate", tile: "portal_sky", color: [0.6, 0.8, 1], hardness: -1, unbreakable: true, render: "model", shape: "portal", collision: "none", opacity: 0, light: 10, emit: 0.8, functional: "portal", desc: "A pale doorway into the floating realm." });
define({ id: 156, key: "root_crop", name: "Root Crop", tile: "rootcrop", color: [0.4, 0.55, 0.28], hardness: 0.05, sound: "grass", render: "cross", shape: "cross", collision: "none", opacity: 0, tags: ["crop"], drops: [{ item: "rootbulb", count: 1, chance: 0.4 }, { item: "seed_root", count: 1 }], desc: "A root crop. Moist soil fattens it." });

export const VARIANT_MATS = [
  "verdant_planks", "amberpine_planks", "lushbark_planks", "silverwood_planks", "mirewood_planks",
  "cobble", "stone_brick", "polished", "sandstone", "brick", "mud_brick", "ash_brick",
  "cloudstone", "basalt", "deepstone", "plaster_white", "plaster_charcoal",
];

VARIANT_MATS.forEach((key, i) => {
  const base = byKey[key];
  define({
    id: 180 + i,
    key: key + "_slab",
    name: base.name + " Slab",
    tile: base.tile,
    tileTop: base.tileTop || base.tile,
    tileSide: base.tileSide || base.tile,
    color: base.color,
    hardness: base.hardness,
    tool: base.tool,
    soft: base.soft,
    minTier: base.minTier,
    sound: base.sound,
    render: "model",
    shape: "slab",
    collision: "slab",
    rough: base.rough,
    metal: base.metal,
    desc: "A half-block of " + base.name.toLowerCase() + ". Place against a matching half to make a whole.",
  });
  define({
    id: 210 + i,
    key: key + "_stair",
    name: base.name + " Stairs",
    tile: base.tile,
    tileTop: base.tileTop || base.tile,
    tileSide: base.tileSide || base.tile,
    color: base.color,
    hardness: base.hardness,
    tool: base.tool,
    soft: base.soft,
    minTier: base.minTier,
    sound: base.sound,
    render: "model",
    shape: "stairs",
    collision: "stairs",
    rough: base.rough,
    metal: base.metal,
    desc: "Stairs of " + base.name.toLowerCase() + ". They face you when placed.",
  });
});

export const BlockId = Object.fromEntries(Object.values(byKey).map((b) => [b.key.toUpperCase(), b.id]));

export function getBlockDef(id) {
  return byId[id & 0x3ff] || byId[0];
}

export function getBlockByKey(key) {
  return byKey[key] || null;
}

export function blockType(id) {
  return id & 0x3ff;
}

export function blockMeta(id) {
  return (id >> 10) & 0x3f;
}

export function packBlock(type, meta = 0) {
  return (type & 0x3ff) | ((meta & 0x3f) << 10);
}

export function allBlocks() {
  return byId.filter(Boolean);
}

export function isSolidDef(def) {
  if (!def) return false;
  return def.collision === "solid" || def.collision === "slab" || def.collision === "stairs" || def.collision === "fence" || def.collision === "wall" || def.collision === "pillar" || def.collision === "door" || def.collision === "gate" || def.collision === "farmland" || def.collision === "spine" || def.collision === "plate";
}

export function lightOpacity(def) {
  if (!def) return 0;
  if (def.opacity >= 15) return 15;
  return def.opacity | 0;
}

export const OPACITY = new Uint8Array(512);
export const EMIT = new Uint8Array(512);
for (const b of byId) {
  if (!b) continue;
  OPACITY[b.id] = b.opacity;
  EMIT[b.id] = b.light;
}

export function faceTileKey(def, meta, dir) {
  if (!def) return "stone";
  if (def.axis) {
    const axis = meta & 3;
    const cap = (axis === 0 && (dir === 2 || dir === 3)) || (axis === 1 && (dir === 0 || dir === 1)) || (axis === 2 && (dir === 4 || dir === 5));
    if (cap && def.tileTop) return def.tileTop;
    if (!cap && def.tileSide) return def.tileSide;
    return def.tile;
  }
  if (dir === 2 && def.tileTop) return def.tileTop;
  if (dir === 3 && (def.tileBottom || def.tileTop)) return def.tileBottom || def.tile;
  if ((dir === 0 || dir === 1 || dir === 4 || dir === 5) && def.tileSide) return def.tileSide;
  return def.tile;
}

export function materialFlag(def) {
  if (!def) return 0;
  let f = 0;
  if (def.render === "cutout" || def.render === "cross") f |= FLAG.CUTOUT;
  if (def.key === "lava" || def.key === "magma") f |= FLAG.LAVA;
  if (def.tint && def.tint !== "none") f |= FLAG.TINT;
  if (def.metal > 0.4) f |= FLAG.METAL;
  if (def.render === "glass" || def.key === "ice") f |= FLAG.GLASS;
  if (def.render === "cross" || def.key.includes("leaves") || def.key === "tallgrass" || def.key === "vine" || def.key === "seagrass" || def.key === "kelp" || def.key === "reed") f |= FLAG.FOLIAGE;
  return f;
}

export { byId, byKey };
