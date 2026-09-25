import { HEIGHT, SEA } from "../engine/constants.js";
import { Noise } from "./noise.js";
import { mixSeed } from "../engine/math.js";

export class CaveGen {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.n3 = new Noise(this.seed ^ 0x5a5a5a);
    this.n2 = new Noise(this.seed ^ 0x1234567);
  }

  carveColumn(x, z, colHeight, get, set) {
    const wx = x;
    const wz = z;
    const base = colHeight;
    if (base < 10) return;
    const wormSeed = mixSeed(this.seed, wx >> 2, wz >> 2, 99);
    let rngState = wormSeed;
    const rand = () => {
      rngState ^= rngState << 13;
      rngState >>>= 0;
      rngState ^= rngState >>> 17;
      rngState ^= rngState << 5;
      rngState >>>= 0;
      return (rngState >>> 0) / 4294967296;
    };
    if (rand() > 0.14) return;
    const depth = Math.floor(rand() * (base - 10)) + 8;
    const startY = Math.floor(rand() * Math.min(40, base - 12)) + 8;
    let cx = wx + (rand() - 0.5) * 8;
    let cy = startY + rand() * 10;
    let cz = wz + (rand() - 0.5) * 8;
    let vx = (rand() - 0.5) * 0.9;
    let vy = (rand() - 0.5) * 0.5;
    let vz = (rand() - 0.5) * 0.9;
    let rad = 1.8 + rand() * 2.2;
    const steps = 24 + Math.floor(rand() * 28);
    for (let s = 0; s < steps; s++) {
      cx += vx;
      cy += vy;
      cz += vz;
      vx += (rand() - 0.5) * 0.28;
      vy += (rand() - 0.5) * 0.18 - 0.02;
      vz += (rand() - 0.5) * 0.28;
      const sp = Math.hypot(vx, vy, vz);
      if (sp > 1.2) {
        const sc = 1.2 / sp;
        vx *= sc;
        vy *= sc;
        vz *= sc;
      }
      rad += (rand() - 0.5) * 0.22;
      if (rad < 1.1) rad = 1.1;
      if (rad > 4.2) rad = 4.2;
      if (cy < 4 || cy > HEIGHT - 10) continue;
      if (Math.abs(cx - wx) > 9 || Math.abs(cz - wz) > 9) continue;
      const ir = Math.ceil(rad);
      for (let dy = -ir; dy <= ir; dy++) {
        const y = Math.floor(cy + dy);
        if (y < 2 || y >= base + 8) continue;
        if (y > colHeight + 4 && y > SEA + 4) continue;
        for (let dz = -ir; dz <= ir; dz++) {
          for (let dx = -ir; dx <= ir; dx++) {
            const d2 = dx * dx + dy * dy * 1.1 + dz * dz;
            if (d2 > rad * rad + 0.5) continue;
            const lx = Math.floor(cx + dx) - (Math.floor(wx / 16) * 16);
            const lz = Math.floor(cz + dz) - (Math.floor(wz / 16) * 16);
            const at = { x: lx, z: lz, y };
            if (at.x < -6 || at.x >= 22 || at.z < -6 || at.z >= 22) continue;
            if (at.x >= 0 && at.x < 16 && at.z >= 0 && at.z < 16) {
              const cur = get(at.x, y, at.z);
              const t = cur & 0x3ff;
              if (t === 10 || t === 0) continue;
              if (y === colHeight && t !== 0) continue;
              if (y > colHeight - 2 && y > SEA) continue;
              set(at.x, y, at.z, 0);
            }
          }
        }
      }
      if (s % 6 === 0) {
        const n = this.n3.simplex3(cx * 0.08, cy * 0.08, cz * 0.08);
        if (n > 0.55 && cy < 18) {
          const lx = Math.floor(cx) - Math.floor(wx / 16) * 16;
          const lz = Math.floor(cz) - Math.floor(wz / 16) * 16;
          if (lx >= 0 && lx < 16 && lz >= 0 && lz < 16) set(lx, Math.floor(cy), lz, 23);
        }
      }
    }
  }

  cheese(x, y, z) {
    const s = 0.055;
    const n = this.n3.simplex3(x * s, y * s * 1.2, z * s);
    const f = this.n3.fbm3(x * 0.018, y * 0.03, z * 0.018, 3);
    const mask = (y - 8) / 40;
    const t = n * 0.65 + f * 0.35;
    return t > 0.62 + mask * 0.22;
  }
}
