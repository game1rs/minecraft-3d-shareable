import { hashSeed } from "../engine/math.js";
import { BlockId, getBlockDef } from "../blocks/registry.js";
import { saveChunkDelta, saveExtra, loadChunkDeltas, loadExtra, saveWorldMeta } from "../save/save.js";
import { Inventory } from "../inventory/inventory.js";
import { defaultWorldSettings } from "../terrain/generator.js";

export class WorldSession {
  constructor(meta) {
    this.meta = meta;
    this.seed = meta.seed >>> 0;
    this.id = meta.id;
    this.dim = 0;
    this.settings = { ...defaultWorldSettings, ...(meta.settings || {}) };
    this.deltas = new Map();
    this.chunkDeltas = new Map();
    this.playerData = {
      x: 0, y: 80, z: 0, yaw: 0, pitch: 0,
      health: 20, hunger: 20, stamina: 100,
      xp: 0, level: 0,
    };
    this.inventory = new Inventory();
    this.time = meta.time || 0;
    this.dayTime = meta.dayTime || 0.25;
    this.weather = { rain: 0, thunder: 0, wind: [0, 0, 0] };
    this.spawn = meta.spawn || null;
    this.dirtyChunks = new Set();
    this.autosaveTimer = 0;
    this.mode = meta.mode || "survival";
    this.difficulty = meta.difficulty || "normal";
  }

  async load() {
    try {
      const deltas = await loadChunkDeltas(this.id);
      this.chunkDeltas = deltas;
    } catch (e) {
      console.warn("Delta load failed", e);
      this.chunkDeltas = new Map();
    }
    try {
      const pd = await loadExtra(this.id, "player");
      if (pd) this.playerData = { ...this.playerData, ...pd };
      const inv = await loadExtra(this.id, "inv");
      if (inv) this.inventory.fromJSON(inv);
      const t = await loadExtra(this.id, "time");
      if (t) {
        this.time = t.time || 0;
        this.dayTime = t.dayTime ?? this.dayTime;
      }
    } catch (e) {
      console.warn("Player load failed", e);
    }
  }

  applyDeltasToChunk(chunk) {
    const key = chunk.dim + ":" + chunk.cx + ":" + chunk.cz;
    const delta = this.chunkDeltas.get(key);
    if (!delta) return;
    for (const ch of delta) {
      const { x, y, z, id } = ch;
      if (x < 0 || x >= 16 || z < 0 || z >= 16 || y < 0 || y >= 128) continue;
      chunk.set(x, y, z, id);
    }
  }

  recordChange(cx, cz, dim, x, y, z, id) {
    const key = dim + ":" + cx + ":" + cz;
    let arr = this.chunkDeltas.get(key);
    if (!arr) {
      arr = [];
      this.chunkDeltas.set(key, arr);
    }
    const existing = arr.find((e) => e.x === x && e.y === y && e.z === z);
    if (existing) existing.id = id;
    else arr.push({ x, y, z, id });
    this.dirtyChunks.add(key);
  }

  async autosave(chunkManager) {
    const now = performance.now();
    if (now - this.autosaveTimer < 8000) return;
    this.autosaveTimer = now;
    const saves = [];
    for (const key of this.dirtyChunks) {
      const [dim, cx, cz] = key.split(":").map(Number);
      const delta = this.chunkDeltas.get(key);
      if (!delta) continue;
      saves.push(saveChunkDelta(this.id, cx, cz, dim, delta));
    }
    this.dirtyChunks.clear();
    await Promise.allSettled(saves);
    await saveExtra(this.id, "player", this.playerData);
    await saveExtra(this.id, "inv", this.inventory.toJSON());
    await saveExtra(this.id, "time", { time: this.time, dayTime: this.dayTime });
    this.meta.time = this.time;
    this.meta.dayTime = this.dayTime;
    await saveWorldMeta(this.meta);
  }

  async saveNow() {
    const saves = [];
    for (const [key, delta] of this.chunkDeltas) {
      const [dim, cx, cz] = key.split(":").map(Number);
      saves.push(saveChunkDelta(this.id, cx, cz, dim, delta));
    }
    await Promise.allSettled(saves);
    await saveExtra(this.id, "player", this.playerData);
    await saveExtra(this.id, "inv", this.inventory.toJSON());
    await saveExtra(this.id, "time", { time: this.time, dayTime: this.dayTime });
    await saveWorldMeta({ ...this.meta, time: this.time, dayTime: this.dayTime });
  }
}

export function makeWorldMeta({ name, seedStr, mode, difficulty, settings }) {
  const seed = hashSeed(seedStr || (Math.random() * 1e9) | 0);
  return {
    id: "world_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
    name: name || "New World",
    seed,
    seedStr: seedStr || String(seed),
    mode: mode || "survival",
    difficulty: difficulty || "normal",
    settings: settings || { ...defaultWorldSettings },
    created: Date.now(),
    updated: Date.now(),
    time: 0,
    dayTime: 0.25,
    spawn: null,
    version: 1,
  };
}
