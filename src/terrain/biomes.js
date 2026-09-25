export const BIOMES = [
  { id: 0, key: "meadow", name: "Meadow", grass: [0.62, 0.74, 0.36], foliage: [0.42, 0.66, 0.3], water: [0.18, 0.48, 0.52], fog: [0.74, 0.84, 0.78], sky: [0.55, 0.74, 0.92], tree: "verdant", density: 0.012, creatures: ["duskhare", "antlorn", "bristleboar"] },
  { id: 1, key: "pine", name: "Pine Forest", grass: [0.34, 0.52, 0.34], foliage: [0.18, 0.4, 0.28], water: [0.16, 0.38, 0.46], fog: [0.62, 0.72, 0.7], sky: [0.48, 0.64, 0.78], tree: "amberpine", density: 0.055, creatures: ["antlorn", "duskhare"] },
  { id: 2, key: "dense", name: "Dense Forest", grass: [0.28, 0.5, 0.24], foliage: [0.16, 0.42, 0.2], water: [0.12, 0.36, 0.34], fog: [0.5, 0.64, 0.52], sky: [0.42, 0.6, 0.7], tree: "verdant", density: 0.08, creatures: ["antlorn", "bristleboar", "mossback"] },
  { id: 3, key: "ancient", name: "Ancient Forest", grass: [0.32, 0.48, 0.28], foliage: [0.22, 0.4, 0.24], water: [0.14, 0.34, 0.36], fog: [0.55, 0.66, 0.58], sky: [0.46, 0.62, 0.68], tree: "ancient", density: 0.02, creatures: ["mossback", "antlorn"] },
  { id: 4, key: "jungle", name: "Tropical Jungle", grass: [0.22, 0.58, 0.2], foliage: [0.1, 0.48, 0.16], water: [0.08, 0.5, 0.46], fog: [0.55, 0.74, 0.58], sky: [0.45, 0.72, 0.78], tree: "lushbark", density: 0.07, creatures: ["bristleboar"] },
  { id: 5, key: "desert", name: "Desert", grass: [0.78, 0.68, 0.4], foliage: [0.55, 0.5, 0.28], water: [0.2, 0.48, 0.55], fog: [0.86, 0.76, 0.56], sky: [0.62, 0.74, 0.9], tree: "spine", density: 0.004, creatures: ["dunestalker"] },
  { id: 6, key: "red_desert", name: "Red Desert", grass: [0.72, 0.42, 0.28], foliage: [0.55, 0.32, 0.2], water: [0.28, 0.4, 0.42], fog: [0.78, 0.56, 0.42], sky: [0.7, 0.55, 0.48], tree: "spine", density: 0.003, creatures: ["dunestalker"] },
  { id: 7, key: "savannah", name: "Savannah", grass: [0.72, 0.68, 0.32], foliage: [0.55, 0.52, 0.22], water: [0.22, 0.46, 0.5], fog: [0.82, 0.78, 0.58], sky: [0.62, 0.74, 0.88], tree: "silverwood", density: 0.008, creatures: ["antlorn", "bristleboar"] },
  { id: 8, key: "swamp", name: "Swamp", grass: [0.36, 0.42, 0.22], foliage: [0.28, 0.36, 0.18], water: [0.16, 0.28, 0.18], fog: [0.5, 0.56, 0.42], sky: [0.48, 0.58, 0.52], tree: "mirewood", density: 0.02, creatures: ["mirelurker", "bristleboar"] },
  { id: 9, key: "frozen", name: "Frozen Plains", grass: [0.78, 0.84, 0.86], foliage: [0.6, 0.72, 0.7], water: [0.45, 0.62, 0.7], fog: [0.82, 0.88, 0.92], sky: [0.62, 0.74, 0.86], tree: null, density: 0, creatures: ["duskhare"] },
  { id: 10, key: "snow_forest", name: "Snow Forest", grass: [0.72, 0.8, 0.78], foliage: [0.42, 0.55, 0.5], water: [0.4, 0.58, 0.68], fog: [0.74, 0.82, 0.86], sky: [0.55, 0.68, 0.82], tree: "amberpine", density: 0.04, creatures: ["duskhare", "antlorn"] },
  { id: 11, key: "alpine", name: "Alpine Mountains", grass: [0.7, 0.78, 0.74], foliage: [0.4, 0.52, 0.46], water: [0.4, 0.6, 0.7], fog: [0.78, 0.84, 0.9], sky: [0.5, 0.66, 0.86], tree: "amberpine", density: 0.01, creatures: ["cliffgoat"] },
  { id: 12, key: "rocky", name: "Rocky Mountains", grass: [0.5, 0.52, 0.42], foliage: [0.36, 0.42, 0.3], water: [0.28, 0.42, 0.5], fog: [0.68, 0.7, 0.72], sky: [0.5, 0.62, 0.78], tree: "dead", density: 0.006, creatures: ["cliffgoat"] },
  { id: 13, key: "canyon", name: "Canyonlands", grass: [0.68, 0.46, 0.3], foliage: [0.48, 0.34, 0.2], water: [0.3, 0.42, 0.4], fog: [0.78, 0.6, 0.46], sky: [0.7, 0.58, 0.5], tree: "dead", density: 0.004, creatures: ["dunestalker"] },
  { id: 14, key: "mushroom", name: "Mushroom Valley", grass: [0.48, 0.36, 0.5], foliage: [0.55, 0.28, 0.48], water: [0.28, 0.26, 0.42], fog: [0.62, 0.5, 0.66], sky: [0.52, 0.48, 0.7], tree: "mushroom", density: 0.03, creatures: ["duskhare"] },
  { id: 15, key: "crystal", name: "Crystal Valley", grass: [0.46, 0.62, 0.66], foliage: [0.4, 0.7, 0.74], water: [0.3, 0.55, 0.68], fog: [0.62, 0.74, 0.8], sky: [0.5, 0.66, 0.82], tree: "crystal", density: 0.012, creatures: ["isleglider"] },
  { id: 16, key: "volcanic", name: "Volcanic Region", grass: [0.32, 0.24, 0.22], foliage: [0.28, 0.16, 0.12], water: [0.35, 0.2, 0.12], fog: [0.42, 0.28, 0.24], sky: [0.45, 0.28, 0.22], tree: "dead", density: 0.006, creatures: ["dunestalker"] },
  { id: 17, key: "ashlands", name: "Ashlands", grass: [0.34, 0.32, 0.3], foliage: [0.28, 0.26, 0.24], water: [0.28, 0.3, 0.32], fog: [0.48, 0.46, 0.44], sky: [0.42, 0.4, 0.4], tree: "dead", density: 0.008, creatures: ["dunestalker"] },
  { id: 18, key: "coast", name: "Coastal Region", grass: [0.58, 0.7, 0.4], foliage: [0.4, 0.58, 0.32], water: [0.12, 0.5, 0.58], fog: [0.7, 0.82, 0.84], sky: [0.52, 0.72, 0.9], tree: "verdant", density: 0.006, creatures: ["pebblecrab", "reedfin"] },
  { id: 19, key: "coral", name: "Coral Ocean", grass: [0.7, 0.66, 0.48], foliage: [0.3, 0.62, 0.5], water: [0.05, 0.55, 0.58], fog: [0.55, 0.78, 0.8], sky: [0.4, 0.7, 0.88], tree: null, density: 0, creatures: ["reedfin"] },
  { id: 20, key: "deep_ocean", name: "Deep Ocean", grass: [0.4, 0.42, 0.4], foliage: [0.2, 0.32, 0.3], water: [0.04, 0.18, 0.32], fog: [0.4, 0.55, 0.64], sky: [0.32, 0.5, 0.68], tree: null, density: 0, creatures: ["reedfin", "gloomfin"] },
  { id: 21, key: "mangrove", name: "Mangrove Wetlands", grass: [0.34, 0.46, 0.26], foliage: [0.22, 0.4, 0.22], water: [0.12, 0.36, 0.3], fog: [0.58, 0.68, 0.56], sky: [0.5, 0.66, 0.68], tree: "mirewood", density: 0.035, creatures: ["mirelurker", "reedfin"] },
  { id: 22, key: "flowers", name: "Flower Fields", grass: [0.66, 0.76, 0.38], foliage: [0.5, 0.68, 0.32], water: [0.18, 0.5, 0.55], fog: [0.78, 0.84, 0.76], sky: [0.58, 0.76, 0.92], tree: "verdant", density: 0.004, creatures: ["duskhare", "swift"] },
  { id: 23, key: "open_sea", name: "Open Sea", grass: [0.55, 0.58, 0.42], foliage: [0.3, 0.48, 0.36], water: [0.08, 0.36, 0.52], fog: [0.58, 0.72, 0.8], sky: [0.42, 0.64, 0.86], tree: null, density: 0, creatures: ["reedfin", "gloomfin"] },
  { id: 24, key: "ember_wastes", name: "Ember Wastes", grass: [0.28, 0.16, 0.12], foliage: [0.4, 0.16, 0.08], water: [0.7, 0.22, 0.05], fog: [0.42, 0.18, 0.1], sky: [0.32, 0.1, 0.06], tree: "dead", density: 0.004, creatures: ["ashmaw"] },
  { id: 25, key: "cinder_peaks", name: "Cinder Peaks", grass: [0.22, 0.14, 0.12], foliage: [0.32, 0.12, 0.08], water: [0.65, 0.18, 0.05], fog: [0.36, 0.14, 0.1], sky: [0.28, 0.08, 0.06], tree: null, density: 0, creatures: ["ashmaw"] },
  { id: 26, key: "sky_garden", name: "Sky Garden", grass: [0.58, 0.78, 0.62], foliage: [0.62, 0.78, 0.86], water: [0.45, 0.7, 0.82], fog: [0.78, 0.84, 0.92], sky: [0.62, 0.78, 0.96], tree: "silverwood", density: 0.03, creatures: ["isleglider", "swift"] },
  { id: 27, key: "sky_void", name: "Open Sky", grass: [0.7, 0.78, 0.86], foliage: [0.6, 0.74, 0.9], water: [0.5, 0.7, 0.86], fog: [0.7, 0.8, 0.94], sky: [0.55, 0.74, 0.98], tree: null, density: 0, creatures: ["isleglider"] },
];

export const BIOME_BY_ID = BIOMES;
export const BIOME_BY_KEY = Object.fromEntries(BIOMES.map((b) => [b.key, b]));

export function biomeById(id) {
  return BIOMES[id] || BIOMES[0];
}

const LAND = ["meadow", "pine", "dense", "ancient", "jungle", "desert", "red_desert", "savannah", "swamp", "frozen", "snow_forest", "flowers", "mushroom", "crystal", "volcanic", "ashlands", "canyon"];

export function pickBiome(sample, dim) {
  if (dim === 1) return sample.mountain > 0.55 ? BIOME_BY_KEY.cinder_peaks : BIOME_BY_KEY.ember_wastes;
  if (dim === 2) return sample.island ? BIOME_BY_KEY.sky_garden : BIOME_BY_KEY.sky_void;
  const { temp, humid, height, slope, erosion, weird, sea, mountain } = sample;
  if (height < sea - 14) return temp > 0.62 ? BIOME_BY_KEY.coral : BIOME_BY_KEY.deep_ocean;
  if (height < sea - 3) return temp > 0.66 && height > sea - 10 ? BIOME_BY_KEY.coral : BIOME_BY_KEY.open_sea;
  if (height <= sea + 2 && slope < 0.55) {
    if (temp > 0.68 && humid > 0.62) return BIOME_BY_KEY.mangrove;
    return BIOME_BY_KEY.coast;
  }
  if (height > sea + 34 || mountain > 0.62) return temp < 0.34 ? BIOME_BY_KEY.alpine : BIOME_BY_KEY.rocky;
  if (weird > 0.72 && humid > 0.5 && temp > 0.35 && temp < 0.7) return BIOME_BY_KEY.mushroom;
  if (weird > 0.78 && temp < 0.55 && humid > 0.28) return BIOME_BY_KEY.crystal;
  if (weird > 0.68 && temp > 0.8 && humid < 0.4) return BIOME_BY_KEY.volcanic;
  if (weird > 0.6 && temp > 0.66 && humid < 0.28 && erosion > 0.4) return BIOME_BY_KEY.ashlands;
  if (erosion > 0.72 && humid < 0.38 && height > sea + 6 && temp > 0.45) return BIOME_BY_KEY.canyon;
  if (temp < 0.16) return humid > 0.45 ? BIOME_BY_KEY.snow_forest : BIOME_BY_KEY.frozen;
  if (temp < 0.28 && humid > 0.4 && height > sea + 8) return BIOME_BY_KEY.snow_forest;
  let best = BIOME_BY_KEY.meadow;
  let bestD = 1e9;
  for (const key of LAND) {
    const b = BIOME_BY_KEY[key];
    if (key === "alpine" || key === "rocky" || key === "canyon" || key === "volcanic" || key === "ashlands" || key === "mushroom" || key === "crystal") continue;
    const bt = key === "desert" || key === "red_desert" ? 0.9 : key === "jungle" || key === "mangrove" ? 0.82 : key === "savannah" ? 0.76 : key === "frozen" || key === "snow_forest" ? 0.12 : key === "pine" ? 0.38 : key === "swamp" ? 0.6 : key === "flowers" ? 0.58 : key === "ancient" || key === "dense" ? 0.5 : 0.55;
    const bh = key === "desert" ? 0.08 : key === "red_desert" ? 0.16 : key === "savannah" ? 0.3 : key === "swamp" || key === "jungle" || key === "dense" ? 0.82 : key === "pine" ? 0.48 : key === "ancient" ? 0.66 : key === "flowers" ? 0.55 : 0.5;
    const d = (temp - bt) * (temp - bt) * 1.4 + (humid - bh) * (humid - bh);
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  if (best.key === "meadow" && humid > 0.48 && humid < 0.68 && temp > 0.5 && temp < 0.68 && sample.flowerNoise > 0.35) return BIOME_BY_KEY.flowers;
  return best;
}

export function surfaceFor(biome, sample) {
  const h = sample.height;
  const sea = sample.sea;
  const slope = sample.slope;
  if (sample.dim === 1) {
    if (h < sample.lavaSea) return { surface: "basalt", soil: "basalt", top: "ash" };
    if (slope > 0.55 || sample.mountain > 0.4) return { surface: "basalt", soil: "basalt", top: "scorched" };
    return { surface: "ash", soil: "basalt", top: "ash" };
  }
  if (sample.dim === 2) {
    return { surface: "cloudstone", soil: "stone", top: "grass" };
  }
  if (h < sea - 2) {
    if (biome.key === "coral" && h > sea - 8) return { surface: "sand", soil: "sand", top: "sand", coral: true };
    if (h < sea - 18) return { surface: "gravel", soil: "stone", top: "gravel" };
    return { surface: "sand", soil: "sand", top: "sand" };
  }
  if (biome.key === "desert") return { surface: "sand", soil: "sand", top: "sand" };
  if (biome.key === "red_desert" || biome.key === "canyon") return { surface: "red_sand", soil: "red_sand", top: slope > 0.5 ? "red_sandstone" : "red_sand" };
  if (biome.key === "swamp" || biome.key === "mangrove") return { surface: "mud", soil: "mud", top: "mud" };
  if (biome.key === "frozen" || biome.key === "snow_forest" || biome.key === "alpine") return { surface: "dirt", soil: "dirt", top: "snow" };
  if (biome.key === "rocky" && (slope > 0.35 || h > sea + 28)) return { surface: "stone", soil: "stone", top: "stone" };
  if (biome.key === "volcanic") return { surface: "basalt", soil: "basalt", top: slope > 0.4 ? "scorched" : "ash" };
  if (biome.key === "ashlands") return { surface: "ash", soil: "basalt", top: "ash" };
  if (biome.key === "mushroom") return { surface: "mycelium", soil: "dirt", top: "mycelium" };
  if (biome.key === "crystal" && slope > 0.4) return { surface: "stone", soil: "stone", top: "stone" };
  if (biome.key === "savannah") return { surface: "dry_earth", soil: "dirt", top: slope > 0.55 ? "stone" : "dry_earth" };
  if (biome.key === "pine" || biome.key === "ancient" || biome.key === "dense") {
    if (slope > 0.62) return { surface: "stone", soil: "dirt", top: "stone" };
    return { surface: "forest_floor", soil: "dirt", top: "forest_floor" };
  }
  if (slope > 0.7) return { surface: "stone", soil: "dirt", top: "stone" };
  if (h <= sea + 3) return { surface: "sand", soil: "sand", top: "sand" };
  return { surface: "grass", soil: "dirt", top: "grass" };
}

export function climateComfort(biome) {
  if (!biome) return 0;
  if (biome.key === "desert" || biome.key === "red_desert" || biome.key === "volcanic" || biome.key === "ashlands" || biome.key === "ember_wastes" || biome.key === "cinder_peaks") return 1;
  if (biome.key === "frozen" || biome.key === "snow_forest" || biome.key === "alpine") return -1;
  return 0;
}
