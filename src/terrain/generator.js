import { CHUNK, HEIGHT, SEA, idx, DIM } from "../engine/constants.js";
import { Noise } from "./noise.js";
import { mixSeed, RNG, hash2, clamp } from "../engine/math.js";
import { BIOME_BY_KEY, BIOMES, pickBiome, surfaceFor } from "./biomes.js";
import { BlockId, packBlock } from "../blocks/registry.js";
import { writeTree, treeRNG } from "./trees.js";
import { structuresNear, stampStructure, lootFor } from "./structures.js";
import { CaveGen } from "./caves.js";

export const defaultWorldSettings = {
  structures: true,
  creatures: true,
  weather: true,
  dayNight: true,
  caves: true,
  size: "normal",
};

function columnSample(noises, x, z, dim) {
  const { cont, tempN, humidN, mountN, weirdN, erodeN, ridgeN, warpN } = noises;
  let fx = x * 0.0011;
  let fz = z * 0.0011;
  if (dim === 0) {
    const wx = warpN.simplex2(x * 0.003, z * 0.003) * 40;
    const wz = warpN.simplex2(x * 0.003 + 100, z * 0.003 + 200) * 40;
    fx = (x + wx) * 0.0011;
    fz = (z + wz) * 0.0011;
  }
  let height = cont.fbm2(fx, fz, 5) * 0.5 + 0.5;
  height = Math.pow(height, 1.35);
  const baseSea = SEA;
  const temp = tempN.fbm2(x * 0.0009, z * 0.0009, 4) * 0.5 + 0.5;
  const humid = humidN.fbm2(x * 0.0009 + 500, z * 0.0009 + 200, 4) * 0.5 + 0.5;
  const mountain = mountN.fbm2(x * 0.0006, z * 0.0006, 4) * 0.5 + 0.5;
  const weird = weirdN.fbm2(x * 0.0016 + 200, z * 0.0016 + 100, 3) * 0.5 + 0.5;
  const erosion = erodeN.fbm2(x * 0.0012, z * 0.0012, 4) * 0.5 + 0.5;
  const ridged = ridgeN.ridged2(x * 0.0022, z * 0.0022, 2);

  let h = baseSea + 8;
  if (dim === 0) {
    const plain = (height - 0.42) * 58;
    const mtn = Math.max(0, mountain - 0.55) * 92;
    const ridge = Math.max(0, ridged - 0.42) * 28;
    const erode = (1 - erosion) * 8;
    h = baseSea + plain + mtn + ridge + erode;
    if (height < 0.35) h = baseSea - 2 + (height - 0.2) * 24;
    h += cont.simplex2(x * 0.04, z * 0.04) * 1.2;
    h += cont.simplex2(x * 0.12, z * 0.12) * 0.35;
  } else if (dim === 1) {
    const hf = cont.fbm2(x * 0.002, z * 0.002, 4) * 0.5 + 0.5;
    h = 28 + hf * 36 + mountN.fbm2(x * 0.004, z * 0.004, 3) * 12;
    h += cont.simplex2(x * 0.08, z * 0.08) * 1.1;
  } else {
    const islandNoise = cont.fbm2(x * 0.004, z * 0.004, 4) * 0.5 + 0.5;
    const isl = weirdN.fbm2(x * 0.001, z * 0.001, 3) * 0.5 + 0.5;
    const island = isl > 0.58 && islandNoise > 0.48;
    if (island) h = 78 + islandNoise * 16 + cont.simplex2(x * 0.08, z * 0.08) * 2;
    else h = -1;
    return {
      height: Math.floor(h),
      temp,
      humid,
      mountain,
      weird,
      erosion,
      slope: 0,
      sea: SEA,
      island,
      ridged,
      base: h,
    };
  }
  h = Math.floor(clamp(h, 6, HEIGHT - 20));
  const slope = Math.abs(cont.simplex2(x * 0.08, z * 0.08)) + Math.abs(mountN.simplex2(x * 0.08 + 10, z * 0.08 + 10)) * 0.5;
  return {
    height: h,
    temp,
    humid,
    mountain,
    weird,
    erosion,
    slope,
    sea: SEA,
    ridged,
    base: h,
    island: true,
  };
}

export class WorldGenerator {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.cont = new Noise(this.seed ^ 1);
    this.tempN = new Noise(this.seed ^ 2);
    this.humidN = new Noise(this.seed ^ 3);
    this.mountN = new Noise(this.seed ^ 4);
    this.weirdN = new Noise(this.seed ^ 5);
    this.erodeN = new Noise(this.seed ^ 6);
    this.ridgeN = new Noise(this.seed ^ 7);
    this.warpN = new Noise(this.seed ^ 8);
    this.detailN = new Noise(this.seed ^ 9);
    this.caves = new CaveGen(this.seed);
    this.noises = {
      cont: this.cont,
      tempN: this.tempN,
      humidN: this.humidN,
      mountN: this.mountN,
      weirdN: this.weirdN,
      erodeN: this.erodeN,
      ridgeN: this.ridgeN,
      warpN: this.warpN,
    };
  }

  column(x, z, dim = 0) {
    const s = columnSample(this.noises, x, z, dim);
    const biome = pickBiome(s, dim);
    return { ...s, biome: biome.key, biomeId: biome.id };
  }

  generateChunk(cx, cz, dim = 0, settings = defaultWorldSettings) {
    const blocks = new Uint16Array(CHUNK * CHUNK * HEIGHT);
    const biomeArr = new Uint8Array(CHUNK * CHUNK);
    const heightArr = new Uint8Array(CHUNK * CHUNK);
    const get = (lx, y, lz) => {
      if (lx < 0 || lx >= CHUNK || lz < 0 || lz >= CHUNK || y < 0 || y >= HEIGHT) return 0;
      return blocks[idx(lx, y, lz)];
    };
    const set = (lx, y, lz, id) => {
      if (lx < 0 || lx >= CHUNK || lz < 0 || lz >= CHUNK || y < 0 || y >= HEIGHT) return;
      blocks[idx(lx, y, lz)] = id;
    };

    const cols = new Array(CHUNK * CHUNK);
    for (let z = 0; z < CHUNK; z++) {
      for (let x = 0; x < CHUNK; x++) {
        const wx = cx * CHUNK + x;
        const wz = cz * CHUNK + z;
        const col = this.column(wx, wz, dim);
        const i = x + (z << 4);
        cols[i] = col;
        biomeArr[i] = col.biomeId;
        heightArr[i] = clamp(col.height, 0, 255);
      }
    }

    for (let z = 0; z < CHUNK; z++) {
      for (let x = 0; x < CHUNK; x++) {
        const wx = cx * CHUNK + x;
        const wz = cz * CHUNK + z;
        const col = cols[x + (z << 4)];
        const h = col.height;
        if (dim === 2 && !col.island) {
          if (settings.structures && this.detailN.simplex2(wx * 0.03, wz * 0.03) > 0.72) {
            set(x, 74, z, BlockId.CLOUDSTONE);
          }
          continue;
        }
        const biome = BIOME_BY_KEY[col.biome] || BIOMES[0];
        const surf = surfaceFor(biome.key, h, col.sea, col.slope);
        for (let y = 0; y <= h; y++) {
          let id = 0;
          if (y === 0) id = BlockId.BEDROCK;
          else if (y < h - 6) {
            if (dim === 1) {
              if (y < h - 12) id = y < 14 ? BlockId.BASALT : BlockId.DEEPSTONE;
              else id = BlockId.SCORCHED;
            } else {
              id = y < 12 ? BlockId.DEEPSTONE : BlockId.STONE;
            }
          } else if (y < h - 1) {
            if (dim === 1) id = BlockId.SCORCHED;
            else id = surf.mid;
          } else if (y < h) {
            id = surf.top === BlockId.GRASS && dim === 0 && col.slope > 0.9 ? BlockId.DIRT : surf.top;
          } else {
            id = surf.top;
          }
          if (y === h && id === BlockId.GRASS && (biome.key === "frozen" || biome.key === "snow_forest" || biome.key === "alpine")) {
            if (hash2(wx, wz) > 0.35) {
              set(x, y + 1, z, BlockId.SNOW_CAP);
            }
          }
          if (id) set(x, y, z, id);
        }
        if (h < SEA) {
          for (let y = h + 1; y <= SEA; y++) {
            if (dim === 1) {
              if (y <= h + 1 && this.detailN.simplex2(wx * 0.1, wz * 0.1) > 0.2) set(x, y, z, BlockId.LAVA);
            } else {
              set(x, y, z, BlockId.WATER);
            }
          }
        }
        if (dim === 0 && h >= SEA) {
          if (biome.key === "beach" || biome.key === "coast") {
            if (h <= SEA + 1) set(x, h, z, BlockId.SAND);
          }
        }
        if (dim === 1) {
          if (h > 0 && this.detailN.simplex2(wx * 0.12, wz * 0.12) > 0.76) {
            set(x, h + 1, z, BlockId.MAGMA);
          }
        }
        const oreNoise = this.detailN.simplex3(wx * 0.07, 0, wz * 0.07);
        for (let y = 5; y < Math.min(h - 2, 48); y++) {
          if ((get(x, y, z) & 0x3ff) !== BlockId.STONE && (get(x, y, z) & 0x3ff) !== BlockId.DEEPSTONE) continue;
          const n = this.detailN.simplex3(wx * 0.09, y * 0.09, wz * 0.09);
          if (n > 0.78) {
            const depthFactor = 1 - y / 48;
            if (depthFactor > 0.7 && oreNoise > 0.5) set(x, y, z, BlockId.FERRITE_ORE);
            else if (depthFactor > 0.5 && this.detailN.simplex3(wx * 0.12 + 100, y * 0.12, wz * 0.12) > 0.6) set(x, y, z, BlockId.CUPRITE_ORE);
          }
          if (y < 20 && this.detailN.simplex3(wx * 0.11 + 200, y * 0.11, wz * 0.11) > 0.76) set(x, y, z, BlockId.LUMENITE_ORE);
          if (y < 12 && this.detailN.simplex3(wx * 0.13 + 300, y * 0.13, wz * 0.13) > 0.82) set(x, y, z, BlockId.PRISMITE_ORE);
          if (y < 8 && this.detailN.simplex3(wx * 0.14 + 400, y * 0.14, wz * 0.14) > 0.86) set(x, y, z, BlockId.DEEPCORE_ORE);
        }
      }
    }

    if (settings.caves && dim !== 2) {
      for (let z = 0; z < CHUNK; z++) {
        for (let x = 0; x < CHUNK; x++) {
          const wx = cx * CHUNK + x;
          const wz = cz * CHUNK + z;
          const col = cols[x + (z << 4)];
          this.caves.carveColumn(wx, wz, col.height, get, set);
        }
      }
      for (let z = 0; z < CHUNK; z++) {
        for (let x = 0; x < CHUNK; x++) {
          const h = cols[x + (z << 4)].height;
          for (let y = 5; y < Math.min(h, 48); y++) {
            if ((get(x, y, z) & 0x3ff) !== 0) continue;
            const above = get(x, y + 1, z) & 0x3ff;
            if (above === 0) continue;
            if (this.caves.cheese(cx * CHUNK + x, y, cz * CHUNK + z)) {
              set(x, y, z, 0);
            }
          }
        }
      }
    }

    if (dim === 0) {
      const decoRng = new RNG(mixSeed(this.seed, cx, cz, 7));
      for (let z = 0; z < CHUNK; z++) {
        for (let x = 0; x < CHUNK; x++) {
          const i = x + (z << 4);
          const col = cols[i];
          if (col.height < SEA - 2) {
            const wx = cx * CHUNK + x;
            const wz = cz * CHUNK + z;
            const reef = this.detailN.fbm2(wx * 0.08, wz * 0.08, 3);
            if (reef > 0.35 && col.biome === "coral") {
              const y = col.height;
              if ((get(x, y, z) & 0x3ff) !== 0) {
                const r = decoRng.next();
                let id = BlockId.CORAL_PEACH;
                if (r < 0.33) id = BlockId.CORAL_TEAL;
                else if (r < 0.66) id = BlockId.CORAL_CREAM;
                if (decoRng.next() < 0.5) set(x, y + 1, z, id);
                if (decoRng.next() < 0.25) set(x, y + 2, z, id);
              }
            }
            if (col.biome !== "deep_ocean" && decoRng.next() < 0.04) {
              set(x, col.height + 1, z, BlockId.SEAGRASS);
            }
            if (decoRng.next() < 0.015) set(x, col.height + 1, z, BlockId.KELP);
            continue;
          }
          if (col.height < SEA) continue;
          const biome = BIOME_BY_KEY[col.biome];
          if (!biome) continue;
          const topType = get(x, col.height, z) & 0x3ff;
          if (topType === BlockId.WATER || topType === BlockId.LAVA) continue;
          if (topType === BlockId.SAND && biome.key !== "desert" && biome.key !== "red_desert") {
            if (decoRng.next() < 0.015) set(x, col.height + 1, z, BlockId.DEADBUSH);
            continue;
          }
          const density = biome.density * (settings.size === "large" ? 1.2 : settings.size === "small" ? 0.6 : 1);
          if (biome.tree && decoRng.next() < density) {
            if (col.slope > 0.55) continue;
            const trng = treeRNG(this.seed, cx * CHUNK + x, cz * CHUNK + z);
            writeTree(
              (gx, gy, gz, id) => {
                const lx = gx - cx * CHUNK;
                const lz = gz - cz * CHUNK;
                if (lx < -8 || lx >= CHUNK + 8 || lz < -8 || lz >= CHUNK + 8 || gy < 0 || gy >= HEIGHT) return;
                if (lx >= 0 && lx < CHUNK && lz >= 0 && lz < CHUNK) set(lx, gy, lz, id);
              },
              (gx, gy, gz) => {
                const lx = gx - cx * CHUNK;
                const lz = gz - cz * CHUNK;
                if (lx < 0 || lx >= CHUNK || lz < 0 || lz >= CHUNK || gy < 0 || gy >= HEIGHT) return 1;
                return get(lx, gy, lz);
              },
              cx * CHUNK + x,
              col.height,
              cz * CHUNK + z,
              biome.tree,
              trng
            );
          } else {
            const r = decoRng.next();
            if (r < 0.05) {
              if (biome.key === "flowers") {
                const fl = [BlockId.FLOWER_AMBER, BlockId.FLOWER_BLUE, BlockId.FLOWER_WHITE, BlockId.FLOWER_PINK][Math.floor(decoRng.next() * 4)];
                set(x, col.height + 1, z, fl);
              } else if (r < 0.025) {
                set(x, col.height + 1, z, BlockId.TALLGRASS);
              } else if (r < 0.035) {
                const fl = decoRng.next() < 0.5 ? BlockId.FLOWER_AMBER : BlockId.FLOWER_BLUE;
                set(x, col.height + 1, z, fl);
              }
            }
            if (biome.key === "mushroom" && decoRng.next() < 0.03) {
              set(x, col.height + 1, z, decoRng.next() < 0.5 ? BlockId.MUSHROOM_RED : BlockId.MUSHROOM_TAN);
            }
          }
        }
      }
    }

    if (settings.structures) {
      const colFn = (wx, wz, d) => this.column(wx, wz, d);
      const structs = structuresNear(this.seed, cx, cz, dim, settings, colFn);
      for (const s of structs) {
        stampStructure(
          s,
          (gx, gy, gz, id) => {
            const lx = gx - cx * CHUNK;
            const lz = gz - cz * CHUNK;
            if (lx < 0 || lx >= CHUNK || lz < 0 || lz >= CHUNK || gy < 0 || gy >= HEIGHT) return;
            set(lx, gy, lz, id);
          },
          (gx, gy, gz) => {
            const lx = gx - cx * CHUNK;
            const lz = gz - cz * CHUNK;
            if (lx < 0 || lx >= CHUNK || lz < 0 || lz >= CHUNK || gy < 0 || gy >= HEIGHT) return 0;
            return get(lx, gy, lz);
          }
        );
      }
    }

    const light = new Uint8Array(CHUNK * CHUNK * HEIGHT);
    const sky = new Uint8Array(CHUNK * CHUNK * HEIGHT);
    for (let z = 0; z < CHUNK; z++) {
      for (let x = 0; x < CHUNK; x++) {
        let lvl = 15;
        const h = cols[x + (z << 4)].height;
        for (let y = HEIGHT - 1; y >= 0; y--) {
          const i = idx(x, y, z);
          const t = blocks[i] & 0x3ff;
          if (t === 0 || t === BlockId.SNOW_CAP) {
            sky[i] = lvl;
          } else {
            const op = t === BlockId.WATER || t === BlockId.GLASS || t === BlockId.ICE ? 1 : t === BlockId.AMBERPINE_LEAVES || t === BlockId.VERDANT_LEAVES || t === BlockId.LUSHBARK_LEAVES || t === BlockId.SILVERWOOD_LEAVES || t === BlockId.MIREWOOD_LEAVES ? 1 : 15;
            if (op >= 15) lvl = 0;
            else if (lvl > 0) {
              lvl = Math.max(0, lvl - Math.max(1, op));
            }
            sky[i] = 0;
          }
          if (y > h + 1 && t === 0) sky[i] = 15;
        }
      }
    }

    return {
      cx,
      cz,
      dim,
      x: cx * CHUNK,
      z: cz * CHUNK,
      blocks,
      light,
      sky,
      biome: biomeArr,
      height: heightArr,
      version: 0,
    };
  }

  findSpawn() {
    const rng = new RNG(this.seed);
    let best = null;
    let bestScore = -1e9;
    for (let r = 0; r < 64; r++) {
      const ang = (r / 64) * Math.PI * 2 + rng.next() * 0.5;
      const rad = 40 + r * 18 + rng.next() * 30;
      const x = Math.floor(Math.cos(ang) * rad);
      const z = Math.floor(Math.sin(ang) * rad);
      const col = this.column(x, z, 0);
      if (col.height < SEA + 2) continue;
      if (col.height > SEA + 28) continue;
      if (col.slope > 0.35) continue;
      const biome = BIOME_BY_KEY[col.biome];
      if (!biome) continue;
      if (["deep_ocean", "open_sea", "coral", "desert", "red_desert", "volcanic", "ashlands", "rocky", "alpine", "canyon"].includes(biome.key)) continue;
      const score = 100 - col.slope * 40 - Math.abs(col.temp - 0.5) * 10 - Math.abs(col.humid - 0.55) * 10 + (biome.key === "meadow" ? 20 : 0) + (biome.key === "flowers" ? 18 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = { x, z, y: col.height + 2, biome: biome.key };
      }
      if (r > 20 && bestScore > 80) break;
    }
    if (!best) {
      const col = this.column(0, 0, 0);
      best = { x: 0, z: 0, y: col.height + 3, biome: col.biome };
    }
    return best;
  }
}
