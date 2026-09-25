import { RNG, mixSeed } from "../engine/math.js";
import { worldToChunk } from "../engine/constants.js";

const TYPES = {
  duskhare: { hp: 6, speed: 3.2, passive: true, size: 0.6, color: [0.6, 0.5, 0.4] },
  antlorn: { hp: 10, speed: 2.8, passive: true, size: 0.9, color: [0.5, 0.4, 0.3] },
  bristleboar: { hp: 14, speed: 2.6, passive: false, neutral: true, size: 1.0, color: [0.4, 0.32, 0.26] },
  cliffgoat: { hp: 12, speed: 3.0, passive: true, size: 0.9, color: [0.8, 0.78, 0.72] },
  reedfin: { hp: 4, speed: 2.2, passive: true, aquatic: true, size: 0.5, color: [0.2, 0.5, 0.6] },
  nightlurker: { hp: 18, speed: 3.4, hostile: true, size: 0.85, color: [0.22, 0.22, 0.26] },
  cavewhelk: { hp: 16, speed: 2.0, hostile: true, size: 1.0, color: [0.35, 0.3, 0.4] },
  mirelurker: { hp: 20, speed: 2.4, hostile: true, size: 1.1, color: [0.24, 0.36, 0.22] },
  dunestalker: { hp: 18, speed: 3.6, hostile: true, size: 0.9, color: [0.7, 0.55, 0.38] },
  ashmaw: { hp: 28, speed: 3.2, hostile: true, size: 1.2, color: [0.5, 0.18, 0.12] },
  isleglider: { hp: 8, speed: 4.5, passive: true, flying: true, size: 1.2, color: [0.7, 0.82, 0.9] },
  swift: { hp: 4, speed: 5, passive: true, flying: true, size: 0.4, color: [0.5, 0.5, 0.6] },
};

export class EntityManager {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.entities = [];
    this.nextId = 1;
    this.time = 0;
  }

  spawn(type, x, y, z) {
    const def = TYPES[type];
    if (!def) return null;
    const e = {
      id: this.nextId++,
      type,
      x, y, z,
      vx: 0, vy: 0, vz: 0,
      yaw: Math.random() * Math.PI * 2,
      hp: def.hp,
      maxHp: def.hp,
      state: "wander",
      stateTime: 0,
      targetX: x, targetZ: z,
      def,
      dead: false,
    };
    this.entities.push(e);
    return e;
  }

  trySpawnAround(playerX, playerZ, chunkManager, dim, biome) {
    if (this.entities.length > 40) return;
    if (Math.random() > 0.02) return;
    const ang = Math.random() * Math.PI * 2;
    const dist = 12 + Math.random() * 18;
    const x = playerX + Math.cos(ang) * dist;
    const z = playerZ + Math.sin(ang) * dist;
    const cx = worldToChunk(x);
    const cz = worldToChunk(z);
    const ch = chunkManager.getChunk(cx, cz, dim);
    if (!ch) return;
    const lx = ((x | 0) & 15);
    const lz = ((z | 0) & 15);
    const h = ch.getHeightLocal(lx, lz);
    const y = h + 1.1;
    const list = biome?.creatures || ["duskhare"];
    if (list.length === 0) return;
    const type = list[Math.floor(Math.random() * list.length)];
    if (!TYPES[type]) return;
    const def = TYPES[type];
    if (def.hostile && Math.random() > 0.5) return;
    if (this.entities.some((e) => Math.hypot(e.x - x, e.z - z) < 6)) return;
    this.spawn(type, x, y, z);
  }

  update(dt, player, chunkManager, dim) {
    this.time += dt;
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (e.dead) {
        this.entities.splice(i, 1);
        continue;
      }
      const distToPlayer = Math.hypot(e.x - player.x, e.z - player.z);
      const lod = distToPlayer < 16 ? 0 : distToPlayer < 32 ? 1 : distToPlayer < 64 ? 2 : 3;
      if (lod === 3 && Math.random() < 0.02) {
        this.entities.splice(i, 1);
        continue;
      }
      if (lod > 1) {
        e.stateTime += dt;
        if (e.stateTime > 5) {
          e.stateTime = 0;
          e.targetX = e.x + (Math.random() - 0.5) * 10;
          e.targetZ = e.z + (Math.random() - 0.5) * 10;
        }
        const dx = e.targetX - e.x;
        const dz = e.targetZ - e.z;
        const len = Math.hypot(dx, dz) || 1;
        e.vx = (dx / len) * e.def.speed * 0.4;
        e.vz = (dz / len) * e.def.speed * 0.4;
        e.x += e.vx * dt;
        e.z += e.vz * dt;
        e.y += e.vy * dt;
        e.vy -= 9.8 * dt;
        if (e.y < 0) e.y = 0;
        continue;
      }

      e.stateTime += dt;
      const toPlayerX = player.x - e.x;
      const toPlayerZ = player.z - e.z;
      const toPlayerDist = Math.hypot(toPlayerX, toPlayerZ);

      if (e.def.hostile) {
        if (toPlayerDist < 16) {
          e.state = "chase";
          e.targetX = player.x;
          e.targetZ = player.z;
        } else if (e.stateTime > 6) {
          e.state = "wander";
          e.targetX = e.x + (Math.random() - 0.5) * 16;
          e.targetZ = e.z + (Math.random() - 0.5) * 16;
          e.stateTime = 0;
        }
      } else {
        if (e.def.neutral && e.hp < e.maxHp && toPlayerDist < 12) {
          e.state = "chase";
          e.targetX = player.x;
          e.targetZ = player.z;
        } else if (e.stateTime > 4 + Math.random() * 4) {
          e.state = "wander";
          e.targetX = e.x + (Math.random() - 0.5) * 12;
          e.targetZ = e.z + (Math.random() - 0.5) * 12;
          e.stateTime = 0;
        }
        if (toPlayerDist < 6 && e.def.passive) {
          e.targetX = e.x - toPlayerX * 0.8;
          e.targetZ = e.z - toPlayerZ * 0.8;
          e.state = "flee";
        }
      }

      const dx = e.targetX - e.x;
      const dz = e.targetZ - e.z;
      const len = Math.hypot(dx, dz) || 1;
      let speed = e.def.speed;
      if (e.state === "flee") speed *= 1.6;
      if (e.state === "chase") speed *= 1.2;
      e.vx = (dx / len) * speed;
      e.vz = (dz / len) * speed;
      if (len < 1.2) {
        e.vx *= 0.2;
        e.vz *= 0.2;
      }
      e.x += e.vx * dt;
      e.z += e.vz * dt;
      if (e.def.flying) {
        e.y += Math.sin(this.time * 1.2 + e.id) * 0.3 * dt + e.vy * dt;
        e.vy *= 0.98;
      } else {
        e.y += e.vy * dt;
        e.vy -= 14 * dt;
        const cx = worldToChunk(e.x);
        const cz = worldToChunk(e.z);
        const ch = chunkManager.getChunk(cx, cz, dim);
        if (ch) {
          const lx = ((e.x | 0) & 15);
          const lz = ((e.z | 0) & 15);
          const gh = ch.getHeightLocal(lx, lz) + 1.0;
          if (e.y < gh) {
            e.y = gh;
            e.vy = 0;
            if (Math.random() < 0.02) e.vy = 4 + Math.random() * 2;
          }
        }
      }
      e.yaw = Math.atan2(-e.vx, -e.vz);

      if (toPlayerDist < 1.2 + e.def.size * 0.5) {
        if (e.def.hostile || (e.def.neutral && e.hp < e.maxHp)) {
          if (player._hurtCooldown <= 0) {
            player._hurtCooldown = 0.6;
            player._pendingDamage = (player._pendingDamage || 0) + 2;
          }
        }
      }
    }
  }

  damage(id, amt) {
    const e = this.entities.find((en) => en.id === id);
    if (!e) return false;
    e.hp -= amt;
    if (e.hp <= 0) e.dead = true;
    return true;
  }

  raycast(x, y, z, dir, maxDist = 6) {
    let best = null;
    let bestDist = maxDist;
    for (const e of this.entities) {
      const dx = e.x - x;
      const dy = e.y + 0.5 - y;
      const dz = e.z - z;
      const dot = dx * dir[0] + dy * dir[1] + dz * dir[2];
      if (dot < 0 || dot > bestDist) continue;
      const px = x + dir[0] * dot;
      const py = y + dir[1] * dot;
      const pz = z + dir[2] * dot;
      const d2 = (px - e.x) ** 2 + (py - (e.y + 0.5)) ** 2 + (pz - e.z) ** 2;
      if (d2 < (e.def.size * 0.7) ** 2) {
        best = e;
        bestDist = dot;
      }
    }
    return best ? { entity: best, dist: bestDist } : null;
  }
}
