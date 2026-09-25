import { WorldGenerator, defaultWorldSettings } from "../terrain/generator.js";

let gen = null;
let seed = 0;

self.onmessage = (e) => {
  const msg = e.data;
  if (msg.type === "init") {
    seed = msg.seed >>> 0;
    gen = new WorldGenerator(seed);
    self.postMessage({ type: "ready", seed });
  } else if (msg.type === "chunk") {
    try {
      if (!gen) gen = new WorldGenerator(msg.seed ?? seed);
      const settings = { ...defaultWorldSettings, ...(msg.settings || {}) };
      const data = gen.generateChunk(msg.cx, msg.cz, msg.dim || 0, settings);
      self.postMessage(
        {
          type: "chunk",
          cx: msg.cx,
          cz: msg.cz,
          dim: msg.dim || 0,
          id: msg.id,
          data,
        },
        [data.blocks.buffer, data.light.buffer, data.sky.buffer, data.biome.buffer, data.height.buffer]
      );
    } catch (err) {
      self.postMessage({ type: "error", cx: msg.cx, cz: msg.cz, dim: msg.dim, id: msg.id, error: err.message + "\n" + err.stack });
    }
  } else if (msg.type === "column") {
    try {
      if (!gen) gen = new WorldGenerator(msg.seed ?? seed);
      const col = gen.column(msg.x, msg.z, msg.dim || 0);
      self.postMessage({ type: "column", x: msg.x, z: msg.z, dim: msg.dim, id: msg.id, col });
    } catch (err) {
      self.postMessage({ type: "error", x: msg.x, z: msg.z, id: msg.id, error: err.message });
    }
  } else if (msg.type === "spawn") {
    try {
      if (!gen) gen = new WorldGenerator(msg.seed ?? seed);
      const spawn = gen.findSpawn();
      self.postMessage({ type: "spawn", id: msg.id, spawn });
    } catch (err) {
      self.postMessage({ type: "error", id: msg.id, error: err.message });
    }
  }
};
