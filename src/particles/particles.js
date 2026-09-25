export class ParticleSystem {
  constructor(max = 600) {
    this.max = max;
    this.particles = [];
    this.pool = [];
  }

  spawn(x, y, z, vx, vy, vz, life, size, color, type = "dust") {
    if (this.particles.length >= this.max) return;
    let p = this.pool.pop();
    if (!p) p = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0, size: 0, color: [1, 1, 1], type: "dust" };
    p.x = x; p.y = y; p.z = z;
    p.vx = vx; p.vy = vy; p.vz = vz;
    p.life = life; p.maxLife = life;
    p.size = size;
    p.color[0] = color[0]; p.color[1] = color[1]; p.color[2] = color[2];
    p.type = type;
    this.particles.push(p);
  }

  blockBreak(x, y, z, color) {
    for (let i = 0; i < 10; i++) {
      this.spawn(
        x + 0.5 + (Math.random() - 0.5) * 0.6,
        y + 0.5 + (Math.random() - 0.5) * 0.6,
        z + 0.5 + (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 3,
        Math.random() * 2 + 1,
        (Math.random() - 0.5) * 3,
        0.5 + Math.random() * 0.5,
        0.12,
        color,
        "dust"
      );
    }
  }

  rain(pos, count, wind) {
    for (let i = 0; i < count; i++) {
      const x = pos.x + (Math.random() - 0.5) * 24;
      const z = pos.z + (Math.random() - 0.5) * 24;
      const y = pos.y + 12 + Math.random() * 6;
      this.spawn(x, y, z, wind[0] * 0.5 + (Math.random() - 0.5) * 0.5, -9 - Math.random() * 3, wind[2] * 0.5, 1.4, 0.04, [0.5, 0.6, 0.9], "rain");
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.pool.push(p);
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= dt * (p.type === "rain" ? 0 : 9.8) * 0.35;
      p.vx *= Math.pow(0.85, dt * 10);
      p.vz *= Math.pow(0.85, dt * 10);
    }
  }
}

export class SimpleMeshParticles {
  constructor(gl) {
    this.gl = gl;
    this.verts = new Float32Array(600 * 6 * 8);
  }

  build(particles, view, proj) {
    return particles.length;
  }
}
