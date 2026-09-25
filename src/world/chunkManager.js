import { CHUNK, chunkKey, worldToChunk } from "../engine/constants.js";
import { ChunkColumn } from "./chunk.js";
import { meshChunk } from "./mesher.js";
import { propagateSkyLight, propagateBlockLight, relightColumn } from "../lighting/light.js";

export class ChunkManager {
  constructor(seed, settings, tileMap) {
    this.seed = seed >>> 0;
    this.settings = settings;
    this.tileMap = tileMap;
    this.chunks = new Map();
    this.meshes = new Map();
    this.pending = new Map();
    this.requested = new Set();
    this.workers = [];
    this.workerCount = Math.min(4, Math.max(2, (navigator.hardwareConcurrency || 4) - 1));
    this.nextId = 1;
    this.callbacks = new Map();
    this.genQueue = [];
    this.meshQueue = [];
    this.meshBudget = 3;
    this.lastPlayerChunk = { x: 0, z: 0 };
    this.dim = 0;
    this.onChunkReady = null;
    this.initWorkers();
  }

  initWorkers() {
    for (let i = 0; i < this.workerCount; i++) {
      const w = new Worker(new URL("../workers/terrainWorker.js", import.meta.url), { type: "module" });
      w.onmessage = (e) => this.handleWorker(e.data, w);
      w.postMessage({ type: "init", seed: this.seed });
      w.busy = false;
      this.workers.push(w);
    }
  }

  handleWorker(msg, worker) {
    worker.busy = false;
    if (msg.type === "chunk") {
      const key = chunkKey(msg.cx, msg.cz, msg.dim);
      this.requested.delete(key);
      this.pending.delete(msg.id);
      if (msg.dim !== this.dim) return;
      try {
        const chunk = ChunkColumn.fromTransfer(msg.data);
        this.chunks.set(key, chunk);
        this.meshQueue.push(key);
        if (this.onChunkReady) this.onChunkReady(chunk);
        const cb = this.callbacks.get(msg.id);
        if (cb) {
          cb(chunk);
          this.callbacks.delete(msg.id);
        }
      } catch (err) {
        console.warn("Chunk decode failed", err);
      }
      this.pump();
    } else if (msg.type === "error") {
      this.requested.delete(chunkKey(msg.cx, msg.cz, msg.dim));
      this.pending.delete(msg.id);
      console.warn("Worker chunk error", msg.error);
      this.pump();
    } else if (msg.type === "spawn" || msg.type === "column") {
      const cb = this.callbacks.get(msg.id);
      if (cb) {
        cb(msg.spawn || msg.col);
        this.callbacks.delete(msg.id);
      }
      this.pending.delete(msg.id);
      this.pump();
    }
  }

  pump() {
    if (this.genQueue.length === 0) return;
    for (const w of this.workers) {
      if (w.busy) continue;
      const req = this.genQueue.shift();
      if (!req) break;
      w.busy = true;
      this.pending.set(req.id, req);
      w.postMessage(req);
      if (this.genQueue.length === 0) break;
    }
  }

  requestChunk(cx, cz, dim = 0, priority = 0) {
    const key = chunkKey(cx, cz, dim);
    if (this.chunks.has(key) || this.requested.has(key)) return;
    this.requested.add(key);
    const id = this.nextId++;
    const req = { type: "chunk", cx, cz, dim, id, seed: this.seed, settings: this.settings, priority };
    this.genQueue.push(req);
    this.genQueue.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    this.pump();
  }

  requestSpawn() {
    return new Promise((res) => {
      const id = this.nextId++;
      this.callbacks.set(id, res);
      const req = { type: "spawn", id, seed: this.seed };
      this.pending.set(id, req);
      this.genQueue.unshift(req);
      this.pump();
    });
  }

  updatePlayerPos(x, z, renderDistance) {
    const pcx = worldToChunk(x);
    const pcz = worldToChunk(z);
    const moved = pcx !== this.lastPlayerChunk.x || pcz !== this.lastPlayerChunk.z;
    this.lastPlayerChunk.x = pcx;
    this.lastPlayerChunk.z = pcz;

    const dist = renderDistance;
    const needed = [];
    for (let dz = -dist; dz <= dist; dz++) {
      for (let dx = -dist; dx <= dist; dx++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        const d2 = dx * dx + dz * dz;
        if (d2 > dist * dist + 2) continue;
        const key = chunkKey(cx, cz, this.dim);
        if (!this.chunks.has(key) && !this.requested.has(key)) {
          const pri = d2 + (Math.abs(dx) < 2 && Math.abs(dz) < 2 ? -10 : 0);
          needed.push({ cx, cz, pri });
        }
      }
    }
    needed.sort((a, b) => a.pri - b.pri);
    for (const n of needed) this.requestChunk(n.cx, n.cz, this.dim, n.pri);

    if (moved) {
      for (const key of this.chunks.keys()) {
        const [d, cx, cz] = key.split(":").map(Number);
        if (d !== this.dim) continue;
        const dx = cx - pcx;
        const dz = cz - pcz;
        if (dx * dx + dz * dz > (dist + 3) * (dist + 3)) {
          this.chunks.delete(key);
          this.meshes.delete(key);
        }
      }
    }
  }

  getChunk(cx, cz, dim = this.dim) {
    return this.chunks.get(chunkKey(cx, cz, dim)) || null;
  }

  getBlock(wx, wy, wz, dim = this.dim) {
    const cx = worldToChunk(wx);
    const cz = worldToChunk(wz);
    const ch = this.getChunk(cx, cz, dim);
    if (!ch) return 0;
    const lx = ((wx | 0) & 15);
    const lz = ((wz | 0) & 15);
    const y = wy | 0;
    if (y < 0 || y >= 128) return 0;
    return ch.get(lx, y, lz);
  }

  setBlock(wx, wy, wz, id, dim = this.dim) {
    const cx = worldToChunk(wx);
    const cz = worldToChunk(wz);
    const ch = this.getChunk(cx, cz, dim);
    if (!ch) return false;
    const lx = ((wx | 0) & 15);
    const lz = ((wz | 0) & 15);
    const y = wy | 0;
    if (y < 0 || y >= 128) return false;
    ch.set(lx, y, lz, id);
    this.meshQueue.push(chunkKey(cx, cz, dim));
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dz === 0) continue;
        if ((lx + dx < 0 || lx + dx >= CHUNK) || (lz + dz < 0 || lz + dz >= CHUNK)) {
          const nk = chunkKey(cx + (lx + dx < 0 ? -1 : lx + dx >= CHUNK ? 1 : 0), cz + (lz + dz < 0 ? -1 : lz + dz >= CHUNK ? 1 : 0), dim);
          if (this.chunks.has(nk)) this.meshQueue.push(nk);
        }
      }
    }
    return true;
  }

  collectNeighbors(cx, cz, dim = this.dim) {
    const get = (dx, dz) => this.chunks.get(chunkKey(cx + dx, cz + dz, dim)) || null;
    return {
      nx: get(-1, 0),
      px: get(1, 0),
      nz: get(0, -1),
      pz: get(0, 1),
      nxnz: get(-1, -1),
      nxpz: get(-1, 1),
      pxnz: get(1, -1),
      pxpz: get(1, 1),
    };
  }

  processMeshQueue(max = this.meshBudget) {
    let count = 0;
    const seen = new Set();
    while (this.meshQueue.length > 0 && count < max) {
      const key = this.meshQueue.shift();
      if (seen.has(key)) continue;
      seen.add(key);
      const chunk = this.chunks.get(key);
      if (!chunk) continue;
      try {
        const [d, cx, cz] = key.split(":").map(Number);
        const neighbors = this.collectNeighbors(cx, cz, d);
        if (!neighbors.nx || !neighbors.px || !neighbors.nz || !neighbors.pz) {
          if (this.meshQueue.length < 80) this.meshQueue.push(key);
          continue;
        }
        const mesh = meshChunk(chunk, neighbors, this.tileMap);
        this.meshes.set(key, { mesh, x: cx * CHUNK, z: cz * CHUNK, cx, cz, dim: d, version: chunk.version });
        count++;
      } catch (err) {
        console.warn("Mesh failed for", key, err);
      }
    }
    return count;
  }

  getMeshesInFrustum(planes, camY) {
    const out = [];
    for (const [key, entry] of this.meshes) {
      const minX = entry.x;
      const maxX = entry.x + CHUNK;
      const minZ = entry.z;
      const maxZ = entry.z + CHUNK;
      const minY = 0;
      const maxY = 128;
      let inside = true;
      for (let i = 0; i < 6; i++) {
        const a = planes[i * 4];
        const b = planes[i * 4 + 1];
        const c = planes[i * 4 + 2];
        const d = planes[i * 4 + 3];
        const x = a >= 0 ? maxX : minX;
        const y = b >= 0 ? maxY : minY;
        const z = c >= 0 ? maxZ : minZ;
        if (a * x + b * y + c * z + d < 0) {
          inside = false;
          break;
        }
      }
      if (inside) out.push(entry);
    }
    out.sort((a, b) => {
      const da = (a.x - camY) * (a.x - camY) + (a.z - camY) * (a.z - camY);
      const db = (b.x - camY) * (b.x - camY) + (b.z - camY) * (b.z - camY);
      return da - db;
    });
    return out;
  }

  dispose() {
    for (const w of this.workers) w.terminate();
    this.workers = [];
    this.chunks.clear();
    this.meshes.clear();
  }
}
