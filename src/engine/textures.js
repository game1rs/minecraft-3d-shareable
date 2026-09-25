import { RNG, hash2 } from "./math.js";

const SIZE = 64;
const TILES = [
  "stone",
  "dirt",
  "grass_top",
  "grass_side",
  "sand",
  "gravel",
  "clay",
  "snow",
  "ice",
  "mud",
  "bedrock",
  "forest_floor",
  "dry_earth",
  "red_sand",
  "ash",
  "basalt",
  "nightglass",
  "moss",
  "coarse",
  "sandstone",
  "red_sandstone",
  "deepstone",
  "scorched",
  "magma",
  "lava",
  "water",
  "mycelium",
  "packed_ice",
  "cloudstone",
  "amberpine_side",
  "amberpine_top",
  "amberpine_planks",
  "amberpine_leaves",
  "verdant_side",
  "verdant_top",
  "verdant_planks",
  "verdant_leaves",
  "lushbark_side",
  "lushbark_top",
  "lushbark_planks",
  "lushbark_leaves",
  "silverwood_side",
  "silverwood_top",
  "silverwood_planks",
  "silverwood_leaves",
  "mirewood_side",
  "mirewood_top",
  "mirewood_planks",
  "mirewood_leaves",
  "tallgrass",
  "flower_amber",
  "flower_blue",
  "flower_white",
  "flower_pink",
  "bush",
  "reed",
  "mushroom_red",
  "mushroom_tan",
  "mushroom_stem",
  "mushroom_cap",
  "spineplant",
  "deadbush",
  "glowfungus",
  "crystal",
  "vine",
  "berry",
  "kelp",
  "coral_peach",
  "coral_teal",
  "coral_cream",
  "seagrass",
  "cuprite_ore",
  "ferrite_ore",
  "lumenite_ore",
  "sunmetal_ore",
  "prismite_ore",
  "deepcore_ore",
  "cinderite_ore",
  "cuprite_block",
  "ferrite_block",
  "lumenite_block",
  "sunmetal_block",
  "prismite_block",
  "deepcore_block",
  "cinderite_block",
  "cobble",
  "stone_brick",
  "mossy_brick",
  "polished",
  "tiles",
  "glass",
  "lamp",
  "brick",
  "mud_brick",
  "ash_brick",
  "plaster_white",
  "plaster_cream",
  "plaster_red",
  "plaster_blue",
  "plaster_green",
  "plaster_amber",
  "plaster_charcoal",
  "plaster_violet",
  "bench",
  "bench_top",
  "kiln",
  "kiln_top",
  "coffer",
  "coffer_top",
  "door",
  "spark_door",
  "ladder",
  "torch",
  "lever",
  "spark_wire",
  "sensor",
  "timer",
  "piston",
  "piston_head",
  "conveyor",
  "plate",
  "bed",
  "campfire",
  "farmland",
  "crop",
  "seeder",
  "gate",
  "fence",
  "wall",
  "pillar",
  "portal_ember",
  "portal_sky",
  "rootcrop",
  "sapling",
];

function randForTile(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return new RNG(h || 1);
}

function fill(ctx, r, g, b) {
  ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
  ctx.fillRect(0, 0, SIZE, SIZE);
}

function noisePixel(rng, amp) {
  return (rng.next() - 0.5) * amp;
}

function drawBase(ctx, key, rng) {
  const palette = {
    stone: [88, 88, 84],
    dirt: [92, 66, 42],
    grass_top: [86, 128, 58],
    grass_side: [92, 76, 46],
    sand: [196, 176, 124],
    gravel: [112, 108, 104],
    clay: [148, 156, 162],
    snow: [228, 236, 240],
    ice: [170, 206, 224],
    mud: [62, 52, 40],
    bedrock: [28, 28, 30],
    forest_floor: [54, 72, 44],
    dry_earth: [140, 116, 76],
    red_sand: [172, 92, 64],
    ash: [52, 48, 46],
    basalt: [36, 34, 38],
    nightglass: [18, 16, 24],
    moss: [56, 92, 56],
    coarse: [86, 66, 48],
    sandstone: [188, 164, 112],
    red_sandstone: [164, 84, 60],
    deepstone: [48, 52, 56],
    scorched: [64, 42, 38],
    magma: [160, 60, 24],
    lava: [230, 90, 16],
    water: [30, 96, 132],
    mycelium: [92, 78, 102],
    packed_ice: [146, 186, 206],
    cloudstone: [188, 194, 202],
    amberpine_side: [92, 62, 36],
    amberpine_top: [84, 56, 32],
    amberpine_planks: [124, 86, 48],
    amberpine_leaves: [48, 96, 68],
    verdant_side: [96, 68, 40],
    verdant_top: [88, 62, 36],
    verdant_planks: [132, 94, 52],
    verdant_leaves: [56, 112, 48],
    lushbark_side: [76, 56, 32],
    lushbark_top: [68, 50, 28],
    lushbark_planks: [108, 78, 44],
    lushbark_leaves: [32, 104, 44],
    silverwood_side: [168, 164, 152],
    silverwood_top: [160, 156, 144],
    silverwood_planks: [184, 176, 160],
    silverwood_leaves: [124, 152, 112],
    mirewood_side: [68, 56, 44],
    mirewood_top: [62, 50, 40],
    mirewood_planks: [92, 76, 60],
    mirewood_leaves: [56, 84, 52],
  };
  const base = palette[key] || [128, 128, 128];
  if (palette[key]) {
    fill(ctx, base[0], base[1], base[2]);
    const img = ctx.getImageData(0, 0, SIZE, SIZE);
    const d = img.data;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = (y * SIZE + x) * 4;
        const n = hash2(x * 1.7 + rng.s, y * 1.7 + rng.s * 0.7);
        const n2 = hash2(x * 0.23, y * 0.23 + key.length);
        const v = (n - 0.5) * 34 + (n2 - 0.5) * 18;
        const crack = Math.sin(x * 0.25) * Math.cos(y * 0.31) * 6;
        d[i] = Math.max(0, Math.min(255, d[i] + v + crack));
        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + v + crack));
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + v + crack));
      }
    }
    if (key.includes("planks")) {
      for (let y = 0; y < SIZE; y += 16) {
        for (let x = 0; x < SIZE; x++) {
          const i = (y * SIZE + x) * 4;
          if (y > 0) {
            d[i] -= 12;
            d[i + 1] -= 12;
            d[i + 2] -= 12;
          }
        }
      }
      for (let y = 0; y < SIZE; y++) {
        const stripe = Math.sin(y * 0.35 + rng.next() * 0.2) * 4;
        for (let x = 0; x < SIZE; x++) {
          const i = (y * SIZE + x) * 4;
          d[i] = Math.max(0, Math.min(255, d[i] + stripe));
          d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + stripe));
          d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + stripe));
        }
      }
    }
    if (key.includes("ore")) {
      for (let k = 0; k < 14; k++) {
        const cx = rng.int(SIZE);
        const cy = rng.int(SIZE);
        const rad = 2 + rng.int(4);
        const col = key.includes("cuprite") ? [60, 160, 120] : key.includes("ferrite") ? [180, 120, 90] : key.includes("lumenite") ? [200, 210, 220] : key.includes("sunmetal") ? [220, 180, 60] : key.includes("prismite") ? [120, 180, 240] : key.includes("cinderite") ? [220, 80, 30] : [160, 80, 200];
        for (let dy = -rad; dy <= rad; dy++) {
          for (let dx = -rad; dx <= rad; dx++) {
            if (dx * dx + dy * dy > rad * rad) continue;
            const xx = cx + dx;
            const yy = cy + dy;
            if (xx < 0 || xx >= SIZE || yy < 0 || yy >= SIZE) continue;
            const ii = (yy * SIZE + xx) * 4;
            d[ii] = col[0];
            d[ii + 1] = col[1];
            d[ii + 2] = col[2];
          }
        }
      }
    }
    if (key.includes("grass_top") || key.includes("mycelium")) {
      for (let i = 0; i < 200; i++) {
        const xx = rng.int(SIZE);
        const yy = rng.int(SIZE);
        const ii = (yy * SIZE + xx) * 4;
        d[ii] += 10;
        d[ii + 1] += 18;
        d[ii + 2] -= 6;
      }
    }
    if (key === "water") {
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const ii = (y * SIZE + x) * 4;
          const wave = Math.sin(x * 0.18) * Math.cos(y * 0.16) * 10 + Math.sin((x + y) * 0.08) * 8;
          d[ii] = Math.max(0, Math.min(255, 20 + wave * 0.6));
          d[ii + 1] = Math.max(0, Math.min(255, 90 + wave));
          d[ii + 2] = Math.max(0, Math.min(255, 132 + wave * 1.1));
        }
      }
    }
    if (key === "lava") {
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const ii = (y * SIZE + x) * 4;
          const n = Math.sin(x * 0.12 + rng.s * 0.001) * Math.cos(y * 0.14) * 30 + (rng.next() - 0.5) * 20;
          d[ii] = Math.max(0, Math.min(255, 210 + n));
          d[ii + 1] = Math.max(0, Math.min(255, 72 + n * 0.4));
          d[ii + 2] = Math.max(0, Math.min(255, 12 + n * 0.1));
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    if (key.includes("side") && key.includes("pine")) {
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      for (let y = 0; y < SIZE; y += 12) {
        ctx.fillRect(0, y, SIZE, 2);
      }
    }
    return;
  }
  if (key.includes("brick")) {
    fill(ctx, 92, 88, 84);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let y = 0; y < SIZE; y += 16) {
      ctx.fillRect(0, y, SIZE, 2);
      for (let x = 0; x < SIZE; x += 32) {
        const off = (y / 16) % 2 === 0 ? 0 : 16;
        ctx.fillRect(x + off, y, 2, 16);
      }
    }
    return;
  }
  if (key.includes("plaster")) {
    const cols = {
      plaster_white: [228, 226, 220],
      plaster_cream: [228, 212, 178],
      plaster_red: [178, 82, 72],
      plaster_blue: [82, 108, 172],
      plaster_green: [82, 128, 92],
      plaster_amber: [198, 132, 62],
      plaster_charcoal: [56, 54, 52],
      plaster_violet: [118, 86, 148],
    };
    const c = cols[key] || [200, 200, 200];
    fill(ctx, c[0], c[1], c[2]);
    const img = ctx.getImageData(0, 0, SIZE, SIZE);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (rng.next() - 0.5) * 12;
      d[i] = Math.max(0, Math.min(255, d[i] + v));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + v));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + v));
    }
    ctx.putImageData(img, 0, 0);
    return;
  }
  if (key.includes("glass") || key === "ice") {
    fill(ctx, 190, 212, 220);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(4, 4, SIZE - 8, 3);
    ctx.fillRect(4, 10, 3, SIZE - 14);
    return;
  }
  if (key.includes("leaves")) {
    fill(ctx, 54, 110, 54);
    const img = ctx.getImageData(0, 0, SIZE, SIZE);
    const d = img.data;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const ii = (y * SIZE + x) * 4;
        const n = hash2(x * 0.7, y * 0.7 + key.length);
        if (n < 0.18) {
          d[ii + 3] = 0;
        } else {
          d[ii] += (n - 0.5) * 26;
          d[ii + 1] += (n - 0.5) * 30;
          d[ii + 2] += (n - 0.5) * 18;
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    return;
  }
  if (key.startsWith("flower") || key === "tallgrass" || key === "bush" || key === "reed" || key === "sapling" || key === "mushroom" || key === "vine" || key === "seagrass" || key === "kelp" || key === "deadbush" || key === "glowfungus" || key === "berry" || key === "crop" || key === "rootcrop") {
    fill(ctx, 0, 0, 0);
    return;
  }
  fill(ctx, 120 + rng.int(40), 110 + rng.int(40), 100 + rng.int(40));
  const img = ctx.getImageData(0, 0, SIZE, SIZE);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (rng.next() - 0.5) * 20;
    d[i] += v;
    d[i + 1] += v;
    d[i + 2] += v;
  }
  ctx.putImageData(img, 0, 0);
}

export function buildAtlas() {
  const canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  if (!canvas) {
    return { tiles: TILES, width: SIZE, height: SIZE, layers: TILES.length, data: null, tileMap: Object.fromEntries(TILES.map((k, i) => [k, i])) };
  }
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const layers = TILES.length;
  const atlas = new Uint8Array(SIZE * SIZE * 4 * layers);
  const tileMap = {};
  for (let l = 0; l < layers; l++) {
    const key = TILES[l];
    tileMap[key] = l;
    const rng = randForTile(key);
    drawBase(ctx, key, rng);
    const img = ctx.getImageData(0, 0, SIZE, SIZE);
    const src = img.data;
    const dstOff = l * SIZE * SIZE * 4;
    for (let i = 0; i < src.length; i++) atlas[dstOff + i] = src[i];
  }
  return { tiles: TILES, width: SIZE, height: SIZE, layers, data: atlas, tileMap };
}

export function createAtlasTexture(gl, atlas) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
  if (atlas.data) {
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA8, atlas.width, atlas.height, atlas.layers, 0, gl.RGBA, gl.UNSIGNED_BYTE, atlas.data);
  } else {
    const empty = new Uint8Array(atlas.width * atlas.height * 4 * atlas.layers);
    for (let i = 0; i < empty.length; i += 4) {
      empty[i] = 120;
      empty[i + 1] = 120;
      empty[i + 2] = 120;
      empty[i + 3] = 255;
    }
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA8, atlas.width, atlas.height, atlas.layers, 0, gl.RGBA, gl.UNSIGNED_BYTE, empty);
  }
  gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
  gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
  return tex;
}
