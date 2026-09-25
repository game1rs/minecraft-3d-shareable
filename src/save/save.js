const DB_NAME = "blockwild_save";
const DB_VER = 4;

function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("worlds")) db.createObjectStore("worlds", { keyPath: "id" });
      if (!db.objectStoreNames.contains("chunks")) {
        const s = db.createObjectStore("chunks", { keyPath: "key" });
        s.createIndex("worldId", "worldId", { unique: false });
      }
      if (!db.objectStoreNames.contains("extras")) db.createObjectStore("extras", { keyPath: "key" });
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function listWorlds() {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("worlds", "readonly");
    const req = tx.objectStore("worlds").getAll();
    req.onsuccess = () => res(req.result.sort((a, b) => b.updated - a.updated));
    req.onerror = () => rej(req.error);
  });
}

export async function saveWorldMeta(meta) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("worlds", "readwrite");
    meta.updated = Date.now();
    tx.objectStore("worlds").put(meta);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function getWorldMeta(id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("worlds", "readonly");
    const req = tx.objectStore("worlds").get(id);
    req.onsuccess = () => res(req.result || null);
    req.onerror = () => rej(req.error);
  });
}

export async function deleteWorld(id) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(["worlds", "chunks", "extras"], "readwrite");
    tx.objectStore("worlds").delete(id);
    const idx = tx.objectStore("chunks").index("worldId");
    const range = IDBKeyRange.only(id);
    const curReq = idx.openCursor(range);
    curReq.onsuccess = () => {
      const cur = curReq.result;
      if (cur) {
        cur.delete();
        cur.continue();
      }
    };
    const ex = tx.objectStore("extras");
    ex.delete(id + ":player");
    ex.delete(id + ":inv");
    ex.delete(id + ":stats");
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function saveChunkDelta(worldId, cx, cz, dim, blocksDelta) {
  const key = worldId + ":" + dim + ":" + cx + ":" + cz;
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("chunks", "readwrite");
    tx.objectStore("chunks").put({ key, worldId, cx, cz, dim, delta: blocksDelta, updated: Date.now() });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function loadChunkDeltas(worldId) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("chunks", "readonly");
    const idx = tx.objectStore("chunks").index("worldId");
    const req = idx.getAll(IDBKeyRange.only(worldId));
    req.onsuccess = () => {
      const map = new Map();
      for (const r of req.result) {
        const k = r.dim + ":" + r.cx + ":" + r.cz;
        map.set(k, r.delta);
      }
      res(map);
    };
    req.onerror = () => rej(req.error);
  });
}

export async function saveExtra(worldId, name, data) {
  const key = worldId + ":" + name;
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("extras", "readwrite");
    tx.objectStore("extras").put({ key, worldId, name, data, updated: Date.now() });
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export async function loadExtra(worldId, name) {
  const key = worldId + ":" + name;
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("extras", "readonly");
    const req = tx.objectStore("extras").get(key);
    req.onsuccess = () => res(req.result ? req.result.data : null);
    req.onerror = () => rej(req.error);
  });
}

export function compressDelta(changes) {
  if (!changes || changes.length === 0) return null;
  return changes;
}

export function decompressDelta(delta) {
  return delta || [];
}
