import { BALANCE } from "../engine/constants.js";
import { collectColliders, checkLiquid, getBlockSolid } from "./collision.js";
import { BlockId } from "../blocks/registry.js";

export class Player {
  constructor() {
    this.x = 0;
    this.y = 80;
    this.z = 0;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.inWater = false;
    this.inLava = false;
    this.crouch = false;
    this.sprint = false;
    this.fly = false;
    this.noclip = false;
    this.height = BALANCE.height;
    this.width = BALANCE.width;
    this.eye = BALANCE.eye;
    this.jumping = false;
    this.climbing = false;
    this.swimming = false;
    this.fallStart = 0;
  }

  aabbAt(x, y, z) {
    const w = this.width * 0.5;
    const h = this.crouch ? BALANCE.crouchHeight : this.height;
    return {
      minX: x - w,
      minY: y,
      minZ: z - w,
      maxX: x + w,
      maxY: y + h,
      maxZ: z + w,
    };
  }

  eyePos() {
    const h = this.crouch ? BALANCE.crouchHeight : this.height;
    return { x: this.x, y: this.y + (this.crouch ? h * 0.85 : this.eye), z: this.z };
  }

  update(dt, input, chunkManager, dim) {
    const speedWalk = BALANCE.walk;
    const speedSprint = BALANCE.sprint;
    const speedCrouch = BALANCE.crouch;
    const speedSwim = BALANCE.swim;
    const gravity = this.fly || this.noclip ? 0 : BALANCE.gravity * (dim === 2 ? 0.48 : 1);
    const jumpVel = BALANCE.jump;

    this.crouch = input.crouch && this.onGround && !this.fly;
    this.sprint = input.sprint && !this.crouch && input.forward > 0;

    const aabb = this.aabbAt(this.x, this.y, this.z);
    const liquid = checkLiquid(chunkManager, aabb, dim);
    this.inWater = liquid.water;
    this.inLava = liquid.lava;
    this.climbing = false;
    if (!this.fly && !this.noclip) {
      const lx = Math.floor(this.x);
      const ly = Math.floor(this.y);
      const lz = Math.floor(this.z);
      for (let dy = 0; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            const info = getBlockSolid(lx + dx, ly + dy, lz + dz, chunkManager, dim);
            if (info && info.def.climb) {
              const box = { minX: lx + dx, minY: ly + dy, minZ: lz + dz, maxX: lx + dx + 1, maxY: ly + dy + 1, maxZ: lz + dz + 1 };
              const pa = this.aabbAt(this.x, this.y, this.z);
              if (pa.minX < box.maxX && pa.maxX > box.minX && pa.minZ < box.maxZ && pa.maxZ > box.minZ && pa.minY < box.maxY && pa.maxY > box.minY) {
                this.climbing = true;
              }
            }
          }
        }
      }
    }

    let moveX = 0;
    let moveZ = 0;
    if (input.forward || input.strafe) {
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      const f = input.forward;
      const s = input.strafe;
      moveX = f * -sin + s * cos;
      moveZ = f * -cos - s * sin;
      const len = Math.hypot(moveX, moveZ);
      if (len > 0) {
        moveX /= len;
        moveZ /= len;
      }
    }

    let targetSpeed = this.crouch ? speedCrouch : this.sprint ? speedSprint : speedWalk;
    if (this.inWater) targetSpeed = speedSwim * (this.sprint ? 1.35 : 1);
    if (this.fly) targetSpeed = BALANCE.fly * (this.sprint ? 1.8 : 1);
    if (this.climbing) targetSpeed = BALANCE.climb;

    const accel = this.onGround || this.fly || this.inWater ? 22 : 7;
    const desiredVX = moveX * targetSpeed;
    const desiredVZ = moveZ * targetSpeed;
    this.vx += (desiredVX - this.vx) * Math.min(1, accel * dt);
    this.vz += (desiredVZ - this.vz) * Math.min(1, accel * dt);

    if (this.fly) {
      if (input.jump) this.vy = targetSpeed;
      else if (input.crouch) this.vy = -targetSpeed;
      else this.vy *= Math.pow(0.12, dt);
    } else if (this.climbing) {
      this.vy = 0;
      if (input.jump) this.vy = targetSpeed * 0.9;
      if (input.forward > 0) this.vy = targetSpeed;
      if (input.crouch) this.vy = -targetSpeed;
      this.vy *= 0.98;
      if (this.onGround) this.vy = Math.max(this.vy, 0);
    } else if (this.inWater) {
      this.vy += (input.jump ? 3.5 : input.crouch ? -3.5 : 0) * dt;
      this.vy *= Math.pow(0.15, dt);
      this.vy -= gravity * 0.18 * dt;
      if (this.vy < -2.5) this.vy = -2.5;
    } else {
      this.vy -= gravity * dt;
    }

    if (!this.fly && !this.noclip && input.jump && (this.onGround || this.inWater || this.climbing)) {
      if (this.inWater) this.vy = 3.8;
      else {
        this.vy = jumpVel;
        this.onGround = false;
        this.jumping = true;
      }
    }

    if (this.noclip) {
      this.x += this.vx * dt;
      this.y += (input.jump ? targetSpeed : input.crouch ? -targetSpeed : this.vy) * dt;
      this.z += this.vz * dt;
      this.onGround = false;
      return;
    }

    const steps = Math.ceil(Math.max(Math.abs(this.vx), Math.abs(this.vy), Math.abs(this.vz)) * dt / 0.2) || 1;
    const sdt = dt / steps;
    for (let i = 0; i < steps; i++) {
      this.moveAxis(chunkManager, dim, sdt, 0);
      this.moveAxis(chunkManager, dim, sdt, 1);
      this.moveAxis(chunkManager, dim, sdt, 2);
    }

    if (this.onGround) {
      this.fallStart = this.y;
    }
  }

  moveAxis(chunkManager, dim, dt, axis) {
    let nx = this.x;
    let ny = this.y;
    let nz = this.z;
    if (axis === 0) nx += this.vx * dt;
    if (axis === 1) ny += this.vy * dt;
    if (axis === 2) nz += this.vz * dt;

    const aabb = this.aabbAt(nx, ny, nz);
    const cols = collectColliders(chunkManager, aabb, dim);
    if (cols.length === 0) {
      this.x = nx;
      this.y = ny;
      this.z = nz;
      if (axis === 1) this.onGround = false;
      return;
    }
    if (axis === 0) {
      if (this.vx > 0) {
        let min = Infinity;
        for (const c of cols) if (c.minX < min) min = c.minX;
        this.x = min - this.width * 0.5 - 0.001;
      } else if (this.vx < 0) {
        let max = -Infinity;
        for (const c of cols) if (c.maxX > max) max = c.maxX;
        this.x = max + this.width * 0.5 + 0.001;
      }
      this.vx = 0;
    } else if (axis === 1) {
      if (this.vy > 0) {
        let min = Infinity;
        for (const c of cols) if (c.minY < min) min = c.minY;
        this.y = min - (this.crouch ? BALANCE.crouchHeight : this.height) - 0.001;
        this.vy = 0;
      } else {
        let max = -Infinity;
        for (const c of cols) if (c.maxY > max) max = c.maxY;
        const fallDist = this.fallStart - this.y;
        this.y = max + 0.001;
        if (this.vy < -1) {
          this.onGround = true;
        }
        this.vy = 0;
      }
    } else {
      if (this.vz > 0) {
        let min = Infinity;
        for (const c of cols) if (c.minZ < min) min = c.minZ;
        this.z = min - this.width * 0.5 - 0.001;
      } else if (this.vz < 0) {
        let max = -Infinity;
        for (const c of cols) if (c.maxZ > max) max = c.maxZ;
        this.z = max + this.width * 0.5 + 0.001;
      }
      this.vz = 0;
    }
  }

  setPos(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vx = 0;
    this.vy = 0;
    this.vz = 0;
  }
}
