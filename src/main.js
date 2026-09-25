import { Renderer } from "./engine/renderer.js";
import { ChunkManager } from "./world/chunkManager.js";
import { Player } from "./physics/player.js";
import { WorldSession, makeWorldMeta } from "./world/session.js";
import { UI } from "./ui/ui.js";
import { loadSettings, saveSettings, applyPreset, PRESETS } from "./settings/settings.js";
import { AudioEngine } from "./audio/audio.js";
import { ParticleSystem } from "./particles/particles.js";
import { EntityManager } from "./entities/entities.js";
import { Combat } from "./combat/combat.js";
import { listWorlds, getWorldMeta, saveWorldMeta } from "./save/save.js";
import { getBlockDef, BlockId, packBlock } from "./blocks/registry.js";
import { getItemDef } from "./items/registry.js";
import { BALANCE, CHUNK, worldToChunk } from "./engine/constants.js";
import { perspective, lookAt, frustumPlanes } from "./engine/math.js";
import { BIOME_BY_KEY } from "./terrain/biomes.js";

class Game {
  constructor() {
    this.canvas = document.getElementById("game-canvas");
    this.settings = loadSettings();
    this.renderer = null;
    this.chunkManager = null;
    this.player = new Player();
    this.session = null;
    this.ui = null;
    this.audio = new AudioEngine();
    this.particles = new ParticleSystem();
    this.entities = null;
    this.combat = new Combat();
    this.running = false;
    this.seed = 0;
    this.time = 0;
    this.dayTime = 0.25;
    this.lastFrame = 0;
    this.keys = {};
    this.mouse = { x: 0, y: 0, buttons: 0 };
    this.input = { forward: 0, strafe: 0, jump: false, crouch: false, sprint: false };
    this.raycast = { hit: null, last: 0 };
    this.breaking = { active: false, x: 0, y: 0, z: 0, progress: 0, id: 0 };
    this.placePreview = null;
    this.stats = { fps: 0, frameMs: 0, draws: 0, tris: 0, chunks: 0, entities: 0, biome: "meadow", dim: "Overworld" };
    this.frustum = new Float32Array(24);
    this.viewMat = new Float32Array(16);
    this.projMat = new Float32Array(16);
    this.sunDir = [0.4, 0.85, 0.2];
    this.weather = { rain: 0, thunder: 0, wind: [0.6, 0, 0.3] };
    this.damageVignette = 0;
    this.fpsSamples = [];
    this._hurtCooldown = 0;
    this._pendingDamage = 0;
    this._stepTimer = 0;
    this._placeCooldown = 0;
  }

  async init() {
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.id = "game-canvas";
      document.body.appendChild(this.canvas);
    }
    this.ui = new UI(this);
    this.ui.bindMenuButtons(this);
    this.ui.showMenu();
    this.setupInput();
    this.setupSettingsUI();
    try {
      this.renderer = new Renderer(this.canvas, this.settings);
    } catch (e) {
      console.error("Renderer failed", e);
      const msg = document.createElement("div");
      msg.style.cssText = "position:absolute;left:50%;top:60%;transform:translateX(-50%);background:rgba(200,40,40,0.9);color:#fff;padding:12px 18px;border-radius:8px;font-size:13px;z-index:100;pointer-events:none;max-width:480px;text-align:center";
      msg.textContent = "WebGL2 error: " + e.message + " — Menu still works, but 3D view needs WebGL2.";
      document.body.appendChild(msg);
      this.renderer = null;
    }
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      console.warn("WebGL context lost");
      this.running = false;
      alert("Graphics context lost. Reload the page.");
    });
  }

  setupInput() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      if (e.code === this.settings.keyInventory) {
        if (this.running) {
          e.preventDefault();
          this.ui.toggleInventory();
        }
      }
      if (e.code === "Escape") {
        if (this.ui.invOpen) {
          this.ui.toggleInventory();
        } else if (this.running) {
          if (this.ui.pauseOpen) this.ui.hidePause();
          else this.ui.showPause();
        }
      }
      if (e.code === "F3") {
        e.preventDefault();
        this.settings.showFps = !this.settings.showFps;
        saveSettings(this.settings);
      }
      if (e.code.startsWith("Digit")) {
        const n = parseInt(e.code.slice(5)) - 1;
        if (n >= 0 && n < 9 && this.session) {
          this.session.inventory.selected = n;
          this.ui.renderHotbar(this.session.inventory);
        }
      }
      if (e.code === this.settings.keyDrop && this.running) {
        const inv = this.session.inventory;
        const st = inv.hotbarStack();
        if (st) {
          inv.removeAt(inv.selected, 1);
          this.ui.renderHotbar(inv);
          this.ui.renderInventory();
        }
      }
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });
    this.canvas.addEventListener("mousedown", (e) => {
      if (!this.running) return;
      if (this.ui.invOpen || this.ui.pauseOpen) return;
      if (e.button === 0) this.handleLeftClick();
      if (e.button === 2) this.handleRightClick();
      this.mouse.buttons |= 1 << e.button;
    });
    this.canvas.addEventListener("mouseup", (e) => {
      this.mouse.buttons &= ~(1 << e.button);
      this.breaking.active = false;
    });
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    this.canvas.addEventListener("mousemove", (e) => {
      if (!this.running) return;
      if (document.pointerLockElement !== this.canvas) return;
      if (this.ui.invOpen || this.ui.pauseOpen) return;
      const sens = this.settings.sensitivity * 0.0022;
      this.player.yaw -= e.movementX * sens;
      this.player.pitch -= e.movementY * sens * (this.settings.invertY ? -1 : 1);
      const lim = Math.PI * 0.49;
      if (this.player.pitch > lim) this.player.pitch = lim;
      if (this.player.pitch < -lim) this.player.pitch = -lim;
    });
    this.canvas.addEventListener("click", () => {
      if (!this.running) return;
      if (this.ui.invOpen || this.ui.pauseOpen) return;
      if (document.pointerLockElement !== this.canvas) {
        this.canvas.requestPointerLock();
        this.audio.init();
        this.audio.resume();
      }
    });
    window.addEventListener("wheel", (e) => {
      if (!this.running || !this.session) return;
      if (this.ui.invOpen) return;
      let sel = this.session.inventory.selected;
      sel += Math.sign(e.deltaY);
      sel = (sel + 9) % 9;
      this.session.inventory.selected = sel;
      this.ui.renderHotbar(this.session.inventory);
    });
  }

  setupSettingsUI() {
    const el = document.getElementById("settings");
    if (!el) return;
    const presetSel = el.querySelector("#setting-preset");
    if (presetSel) {
      presetSel.innerHTML = Object.keys(PRESETS).map((k) => `<option value="${k}" ${k === this.settings.preset ? "selected" : ""}>${k}</option>`).join("");
      presetSel.onchange = () => {
        applyPreset(presetSel.value, this.settings);
        saveSettings(this.settings);
        this.setupSettingsUI();
      };
    }
    const bindRange = (id, key, min, max, step, display) => {
      const inp = el.querySelector("#" + id);
      if (!inp) return;
      inp.min = min; inp.max = max; inp.step = step;
      inp.value = this.settings[key];
      const out = el.querySelector("#" + id + "-val");
      if (out) out.textContent = display ? display(this.settings[key]) : this.settings[key];
      inp.oninput = () => {
        this.settings[key] = parseFloat(inp.value);
        if (out) out.textContent = display ? display(this.settings[key]) : this.settings[key];
        saveSettings(this.settings);
      };
    };
    bindRange("setting-fov", "fov", 60, 100, 1);
    bindRange("setting-sens", "sensitivity", 0.05, 1, 0.01);
    bindRange("setting-render", "render", 4, 24, 1);
    bindRange("setting-master", "master", 0, 1, 0.05);
    bindRange("setting-music", "music", 0, 1, 0.05);
    bindRange("setting-sfx", "sfx", 0, 1, 0.05);
    bindRange("setting-dpr", "dpr", 0.5, 1.5, 0.05);
    const checks = ["bloom", "viewBob", "headBob", "showCoords", "showFps", "subtitles", "reducedMotion"];
    for (const k of checks) {
      const inp = el.querySelector("#setting-" + k);
      if (inp) {
        inp.checked = !!this.settings[k];
        inp.onchange = () => {
          this.settings[k] = inp.checked;
          saveSettings(this.settings);
        };
      }
    }
  }

  async quickPlay() {
    const worlds = await listWorlds();
    if (worlds.length > 0) {
      await this.loadWorld(worlds[0].id);
    } else {
      const meta = makeWorldMeta({ name: "Quick World", seedStr: String((Math.random() * 1e9) | 0), mode: "survival", difficulty: "normal" });
      await saveWorldMeta(meta);
      await this.loadWorld(meta.id);
    }
  }

  showCreateWorld() {
    this.ui.menu.style.display = "none";
    this.ui.createWorldEl.style.display = "flex";
    if (this.canvas) this.canvas.style.pointerEvents = "none";
    const nameIn = document.getElementById("create-name");
    const seedIn = document.getElementById("create-seed");
    if (nameIn) nameIn.value = "New World";
    if (seedIn) seedIn.value = "";
  }

  async createWorldFromForm() {
    const nameEl = document.getElementById("create-name");
    const seedEl = document.getElementById("create-seed");
    const modeEl = document.getElementById("create-mode");
    const diffEl = document.getElementById("create-diff");
    const name = nameEl ? nameEl.value : "New World";
    const seedStr = seedEl ? seedEl.value : "";
    const mode = modeEl ? modeEl.value : "survival";
    const diff = diffEl ? diffEl.value : "normal";
    const meta = makeWorldMeta({ name, seedStr, mode, difficulty: diff });
    await saveWorldMeta(meta);
    await this.loadWorld(meta.id);
  }

  async showWorlds() {
    this.ui.menu.style.display = "none";
    this.ui.worldListEl.style.display = "flex";
    if (this.canvas) this.canvas.style.pointerEvents = "none";
    const worlds = await listWorlds();
    this.ui.renderWorldList(worlds);
  }

  showSettings(fromPause = false) {
    this.ui.menu.style.display = "none";
    this.ui.pauseEl.style.display = "none";
    this.ui.settingsEl.style.display = "flex";
    if (this.canvas) this.canvas.style.pointerEvents = "none";
    this.setupSettingsUI();
  }

  showHowto() {
    this.ui.menu.style.display = "none";
    this.ui.howtoEl.style.display = "flex";
    if (this.canvas) this.canvas.style.pointerEvents = "none";
  }

  async loadWorld(id) {
    const meta = await getWorldMeta(id);
    if (!meta) {
      alert("World not found");
      return;
    }
    this.seed = meta.seed;
    this.session = new WorldSession(meta);
    await this.session.load();
    this.entities = new EntityManager(this.seed);
    this.chunkManager = new ChunkManager(this.seed, meta.settings || {}, this.renderer.tileMap);
    this.chunkManager.dim = this.session.dim || 0;
    this.chunkManager.onChunkReady = (chunk) => {
      this.session.applyDeltasToChunk(chunk);
    };
    if (this.session.spawn) {
      this.player.setPos(this.session.spawn.x, this.session.spawn.y, this.session.spawn.z);
    } else {
      const spawn = await this.chunkManager.requestSpawn();
      if (spawn) {
        this.player.setPos(spawn.x, spawn.y, spawn.z);
        this.session.spawn = { x: spawn.x, y: spawn.y, z: spawn.z };
        this.session.playerData.x = spawn.x;
        this.session.playerData.y = spawn.y;
        this.session.playerData.z = spawn.z;
        await saveWorldMeta({ ...meta, spawn: this.session.spawn });
      } else {
        this.player.setPos(0, 80, 0);
      }
    }
    if (this.session.playerData.x) {
      this.player.setPos(this.session.playerData.x, this.session.playerData.y, this.session.playerData.z);
      this.player.yaw = this.session.playerData.yaw || 0;
      this.player.pitch = this.session.playerData.pitch || 0;
    }
    if (meta.mode === "creative") {
      this.player.fly = true;
      this.player.noclip = false;
    }
    this.time = this.session.time || 0;
    this.dayTime = this.session.dayTime || 0.25;
    this.running = true;
    this.ui.showHUD();
    this.ui.renderHotbar(this.session.inventory);
    this.canvas.requestPointerLock();
    this.audio.init();
    this.audio.resume();
    this.lastFrame = performance.now();
  }

  async saveAndExit() {
    if (this.session) {
      this.session.playerData.x = this.player.x;
      this.session.playerData.y = this.player.y;
      this.session.playerData.z = this.player.z;
      this.session.playerData.yaw = this.player.yaw;
      this.session.playerData.pitch = this.player.pitch;
      this.session.time = this.time;
      this.session.dayTime = this.dayTime;
      await this.session.saveNow();
    }
    if (this.chunkManager) this.chunkManager.dispose();
    this.running = false;
    this.session = null;
    this.chunkManager = null;
    this.ui.showMenu();
  }

  handleLeftClick() {
    const hit = this.raycast.hit;
    if (!hit) return;
    if (hit.entity) {
      if (this.combat.canAttack()) {
        this.combat.attack();
        const tool = this.session.inventory.hotbarStack();
        const dmg = this.combat.getDamage(tool);
        this.entities.damage(hit.entity.id, dmg);
        this.audio.playTone(220 + Math.random() * 80, 0.12, "square", 0.2);
      }
      return;
    }
    if (hit.block) {
      const { x, y, z, id } = hit.block;
      const t = id & 0x3ff;
      const def = getBlockDef(t);
      if (def && def.unbreakable) return;
      if (this.session.mode === "creative") {
        this.setBlockAndRecord(x, y, z, 0);
        this.audio.playBlockSound(def.sound, [x, y, z], 0.6);
        this.particles.blockBreak(x, y, z, def.color);
        return;
      }
      this.breaking.active = true;
      this.breaking.x = x;
      this.breaking.y = y;
      this.breaking.z = z;
      this.breaking.id = id;
      this.breaking.progress = 0;
    }
  }

  handleRightClick() {
    const hit = this.raycast.hit;
    if (!hit || !hit.block) return;
    if (Date.now() - this._placeCooldown < 150) return;
    this._placeCooldown = Date.now();
    const inv = this.session.inventory;
    const stack = inv.hotbarStack();
    if (!stack) return;
    const itemDef = getItemDef(stack.key);
    if (!itemDef) return;
    if (itemDef.category === "tool" || itemDef.category === "weapon" || itemDef.category === "food") {
      if (itemDef.category === "food") {
        if (this.session.playerData.hunger < 20) {
          inv.removeAt(inv.selected, 1);
          this.session.playerData.hunger = Math.min(20, this.session.playerData.hunger + (itemDef.food || 2));
          this.session.playerData.health = Math.min(20, this.session.playerData.health + 0.5);
          this.ui.renderHotbar(inv);
        }
      }
      return;
    }
    const bx = hit.block.x + hit.face[0];
    const by = hit.block.y + hit.face[1];
    const bz = hit.block.z + hit.face[2];
    const pa = this.player.aabbAt(this.player.x, this.player.y, this.player.z);
    const blockAabb = { minX: bx, minY: by, minZ: bz, maxX: bx + 1, maxY: by + 1, maxZ: bz + 1 };
    if (pa.minX < blockAabb.maxX && pa.maxX > blockAabb.minX && pa.minY < blockAabb.maxY && pa.maxY > blockAabb.minY && pa.minZ < blockAabb.maxZ && pa.maxZ > blockAabb.minZ) return;

    const blockKey = itemDef.block || stack.key;
    let bDef = getBlockDef(blockKey);
    if (!bDef) {
      const byK = getBlockDef(stack.key);
      if (byK) bDef = byK;
    }
    const realDef = bDef || getBlockDef(BlockId.COBBLE);
    let placeId = 0;
    if (realDef) {
      let meta = 0;
      if (realDef.shape === "slab") {
        const existing = this.chunkManager.getBlock(bx, by, bz);
        if ((existing & 0x3ff) === (realDef.id)) {
          const em = existing >> 10;
          if ((em & 1) !== (hit.face[1] === 1 ? 0 : 1)) {
            this.setBlockAndRecord(bx, by, bz, realDef.id);
            if (this.session.mode !== "creative") {
              inv.removeAt(inv.selected, 1);
              this.ui.renderHotbar(inv);
            }
            return;
          }
        }
        if (hit.face[1] === -1) meta = 1;
      }
      if (realDef.shape === "stairs") {
        const yaw = this.player.yaw;
        const facing = yaw > -Math.PI * 0.25 && yaw < Math.PI * 0.25 ? 2 : yaw > Math.PI * 0.25 && yaw < Math.PI * 0.75 ? 3 : yaw < -Math.PI * 0.25 && yaw > -Math.PI * 0.75 ? 1 : 0;
        meta = facing;
        if (hit.face[1] === -1 || (hit.face[1] === 0 && (this.player.eyePos().y - by) > 0.5)) meta |= 4;
      }
      if (realDef.axis) {
        const f = hit.face;
        if (Math.abs(f[0]) === 1) meta = 1;
        else if (Math.abs(f[2]) === 1) meta = 2;
      }
      placeId = packBlock(realDef.id, meta);
    }
    if (!placeId) return;
    this.setBlockAndRecord(bx, by, bz, placeId);
    this.audio.playBlockSound(realDef ? realDef.sound : "stone", [bx, by, bz], 0.5);
    if (this.session.mode !== "creative") {
      inv.removeAt(inv.selected, 1);
      this.ui.renderHotbar(inv);
      this.ui.renderInventory();
    }
  }

  setBlockAndRecord(x, y, z, id) {
    const cx = worldToChunk(x);
    const cz = worldToChunk(z);
    const lx = ((x | 0) & 15);
    const lz = ((z | 0) & 15);
    const dim = this.chunkManager.dim;
    if (this.chunkManager.setBlock(x, y, z, id, dim)) {
      this.session.recordChange(cx, cz, dim, lx, y | 0, lz, id);
    }
  }

  raycastWorld(maxDist = 6) {
    if (!this.chunkManager) return null;
    const eye = this.player.eyePos();
    const dir = [
      -Math.sin(this.player.yaw) * Math.cos(this.player.pitch),
      Math.sin(this.player.pitch),
      -Math.cos(this.player.yaw) * Math.cos(this.player.pitch),
    ];
    const entHit = this.entities.raycast(eye.x, eye.y, eye.z, dir, maxDist);
    if (entHit) return { entity: entHit.entity, dist: entHit.dist };

    let x = Math.floor(eye.x);
    let y = Math.floor(eye.y);
    let z = Math.floor(eye.z);
    const stepX = dir[0] > 0 ? 1 : -1;
    const stepY = dir[1] > 0 ? 1 : -1;
    const stepZ = dir[2] > 0 ? 1 : -1;
    const tDeltaX = Math.abs(1 / (dir[0] || 1e-6));
    const tDeltaY = Math.abs(1 / (dir[1] || 1e-6));
    const tDeltaZ = Math.abs(1 / (dir[2] || 1e-6));
    let tMaxX = ((stepX > 0 ? x + 1 - eye.x : eye.x - x) * tDeltaX);
    let tMaxY = ((stepY > 0 ? y + 1 - eye.y : eye.y - y) * tDeltaY);
    let tMaxZ = ((stepZ > 0 ? z + 1 - eye.z : eye.z - z) * tDeltaZ);
    let face = [0, 0, 0];
    let lastFace = [0, 0, 0];
    let dist = 0;
    for (let i = 0; i < 160; i++) {
      const id = this.chunkManager.getBlock(x, y, z, this.chunkManager.dim);
      if (id !== 0) {
        const t = id & 0x3ff;
        const def = getBlockDef(t);
        if (def && def.collision !== "none" && def.collision !== "liquid") {
          return { block: { x, y, z, id }, face: lastFace, dist };
        }
      }
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        x += stepX;
        dist = tMaxX;
        tMaxX += tDeltaX;
        lastFace = [-stepX, 0, 0];
      } else if (tMaxY < tMaxZ) {
        y += stepY;
        dist = tMaxY;
        tMaxY += tDeltaY;
        lastFace = [0, -stepY, 0];
      } else {
        z += stepZ;
        dist = tMaxZ;
        tMaxZ += tDeltaZ;
        lastFace = [0, 0, -stepZ];
      }
      if (dist > maxDist) break;
    }
    return null;
  }

  updateBreaking(dt) {
    if (!this.breaking.active) return;
    const hit = this.raycast.hit;
    if (!hit || !hit.block || hit.block.x !== this.breaking.x || hit.block.y !== this.breaking.y || hit.block.z !== this.breaking.z) {
      this.breaking.active = false;
      return;
    }
    const def = getBlockDef(this.breaking.id & 0x3ff);
    if (!def) {
      this.breaking.active = false;
      return;
    }
    if (def.unbreakable) return;
    const tool = this.session.inventory.hotbarStack();
    let speed = 1;
    if (tool) {
      const td = getItemDef(tool.key);
      if (td && td.tool) {
        if (def.tool === td.tool || def.tool === "none") {
          speed = td.tier ? (td.tier * 1.6 + 0.6) : 1;
          if (def.soft) speed *= 1.4;
        } else {
          speed = 0.35;
        }
      }
    }
    if (this.session.mode === "creative") speed = 20;
    const hardness = def.hardness < 0 ? 999 : def.hardness;
    this.breaking.progress += dt * speed / Math.max(0.12, hardness);
    if (this.breaking.progress >= 1) {
      this.breaking.active = false;
      this.setBlockAndRecord(this.breaking.x, this.breaking.y, this.breaking.z, 0);
      this.audio.playBlockSound(def.sound, [this.breaking.x, this.breaking.y, this.breaking.z], 0.7);
      this.particles.blockBreak(this.breaking.x, this.breaking.y, this.breaking.z, def.color);
      if (this.session.mode !== "creative" && def.drops) {
        for (const drop of def.drops) {
          if (drop.chance != null && Math.random() > drop.chance) continue;
          this.session.inventory.add(drop.item, drop.count);
        }
        this.ui.renderHotbar(this.session.inventory);
      }
    }
  }

  updateInput(dt) {
    const fwd = (this.keys[this.settings.keyForward] ? 1 : 0) - (this.keys[this.settings.keyBack] ? 1 : 0);
    const strafe = (this.keys[this.settings.keyRight] ? 1 : 0) - (this.keys[this.settings.keyLeft] ? 1 : 0);
    this.input.forward = fwd;
    this.input.strafe = strafe;
    this.input.jump = !!this.keys[this.settings.keyJump];
    this.input.crouch = !!this.keys[this.settings.keyCrouch];
    this.input.sprint = !!this.keys[this.settings.keySprint];
  }

  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.fpsSamples.push(dt);
    if (this.fpsSamples.length > 60) this.fpsSamples.shift();
    const avgDt = this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length;
    this.stats.fps = 1 / (avgDt || 0.016);
    this.stats.frameMs = avgDt * 1000;

    if (!this.running || !this.session || !this.chunkManager) {
      this.renderMenuVista(dt);
      return;
    }

    if (this.ui.pauseOpen) {
      this.renderWorld(dt, true);
      return;
    }
    if (this.ui.invOpen) {
      this.updateInput(dt);
    } else {
      this.updateInput(dt);
    }

    this.time += dt * 0.05;
    this.dayTime += dt * 0.00008;
    if (this.dayTime > 1) this.dayTime -= 1;
    this.session.time = this.time;
    this.session.dayTime = this.dayTime;

    const dayFactor = this.dayTime;
    const sunAng = dayFactor * Math.PI * 2 - Math.PI * 0.5;
    this.sunDir[0] = Math.cos(sunAng) * 0.6;
    this.sunDir[1] = Math.sin(sunAng);
    this.sunDir[2] = Math.cos(sunAng) * 0.2 + 0.2;
    const sunLen = Math.hypot(...this.sunDir);
    this.sunDir[0] /= sunLen; this.sunDir[1] /= sunLen; this.sunDir[2] /= sunLen;

    if (!this.ui.invOpen) this.player.update(dt, this.input, this.chunkManager, this.chunkManager.dim);

    if (this._hurtCooldown > 0) this._hurtCooldown -= dt;
    if (this._pendingDamage > 0 && this._hurtCooldown <= 0.1) {
      this.session.playerData.health -= this._pendingDamage;
      this._pendingDamage = 0;
      this.damageVignette = 1;
      this._hurtCooldown = 0.8;
      if (this.session.playerData.health <= 0) {
        this.session.playerData.health = 20;
        this.player.setPos(this.session.spawn.x, this.session.spawn.y, this.session.spawn.z);
      }
    }
    if (this.damageVignette > 0) this.damageVignette -= dt * 1.2;

    if (this.player.inWater) {
      this.session.playerData.hunger -= dt * 0.02;
    }
    if (this.player.onGround && (this.input.forward || this.input.strafe)) {
      this._stepTimer += dt * (this.input.sprint ? 2.2 : 1);
      if (this._stepTimer > 0.45) {
        this._stepTimer = 0;
        const under = this.chunkManager.getBlock(Math.floor(this.player.x), Math.floor(this.player.y - 0.2), Math.floor(this.player.z), this.chunkManager.dim);
        const def = getBlockDef(under & 0x3ff);
        if (def) this.audio.playStep(def.sound, this.input.sprint);
      }
    }

    this.chunkManager.updatePlayerPos(this.player.x, this.player.z, this.settings.render);
    this.chunkManager.processMeshQueue(this.settings.preset === "potato" ? 2 : this.settings.preset === "extreme" ? 6 : 3);

    this.entities.update(dt, this.player, this.chunkManager, this.chunkManager.dim);
    const biome = this.getBiomeAt(this.player.x, this.player.z);
    this.entities.trySpawnAround(this.player.x, this.player.z, this.chunkManager, this.chunkManager.dim, biome);

    if (this.settings.weather) {
      if (Math.random() < 0.0008) this.weather.rain = Math.random() > 0.5 ? Math.random() * 0.9 : 0;
      if (this.weather.rain > 0.1) {
        this.particles.rain(this.player.eyePos(), Math.floor(this.weather.rain * 40), this.weather.wind);
      }
    }
    this.particles.update(dt);
    this.combat.update(dt);
    this.audio.update(dt, biome?.key || "meadow", this.dayTime, this.weather.rain);
    this.audio.setWeather(this.weather.rain, this.weather.thunder);
    this.audio.setVolumes(this.settings.master, this.settings.music, this.settings.sfx, this.settings.ambient);

    if (now - this.raycast.last > 50) {
      this.raycast.hit = this.raycastWorld(this.settings.reach || BALANCE.reach);
      this.raycast.last = now;
    }
    if (this.mouse.buttons & 1) {
      if (this.raycast.hit && this.raycast.hit.block) {
        if (!this.breaking.active || this.breaking.x !== this.raycast.hit.block.x || this.breaking.y !== this.raycast.hit.block.y || this.breaking.z !== this.raycast.hit.block.z) {
          this.breaking.active = true;
          this.breaking.x = this.raycast.hit.block.x;
          this.breaking.y = this.raycast.hit.block.y;
          this.breaking.z = this.raycast.hit.block.z;
          this.breaking.id = this.raycast.hit.block.id;
          this.breaking.progress = 0;
        }
      }
    }
    this.updateBreaking(dt);

    this.session.playerData.x = this.player.x;
    this.session.playerData.y = this.player.y;
    this.session.playerData.z = this.player.z;
    this.session.playerData.yaw = this.player.yaw;
    this.session.playerData.pitch = this.player.pitch;

    this.session.autosave(this.chunkManager);

    this.renderWorld(dt, false);
    this.ui.updateHUD();
    this.ui.renderHotbar(this.session.inventory);
  }

  getBiomeAt(x, z) {
    const cx = worldToChunk(x);
    const cz = worldToChunk(z);
    const ch = this.chunkManager.getChunk(cx, cz);
    if (!ch) return null;
    const lx = ((x | 0) & 15);
    const lz = ((z | 0) & 15);
    const id = ch.biome[lx + (lz << 4)];
    return BIOME_BY_KEY[Object.keys(BIOME_BY_KEY)[id]] || null;
  }

  renderWorld(dt, paused) {
    const eye = this.player.eyePos();
    const yaw = this.player.yaw;
    const pitch = this.player.pitch;
    const fov = (this.settings.fov * Math.PI) / 180;
    const aspect = this.canvas.width / Math.max(1, this.canvas.height);
    perspective(this.projMat, fov, aspect, 0.08, 600);
    const target = [
      eye.x - Math.sin(yaw) * Math.cos(pitch),
      eye.y + Math.sin(pitch),
      eye.z - Math.cos(yaw) * Math.cos(pitch),
    ];
    lookAt(this.viewMat, [eye.x, eye.y, eye.z], target, [0, 1, 0]);
    const vp = new Float32Array(16);
    const { multiply } = requireMat();
    multiply(vp, this.projMat, this.viewMat);
    frustumPlanes(vp, this.frustum);

    const dayFactor = this.dayTime;
    const isDay = dayFactor > 0.2 && dayFactor < 0.8;
    const sunColor = isDay ? [1.15, 1.05, 0.95] : [0.7, 0.75, 0.95];
    const skyTop = isDay ? [0.42, 0.68, 0.96] : [0.06, 0.08, 0.18];
    const skyHorizon = isDay ? [0.72, 0.85, 0.98] : [0.12, 0.14, 0.28];
    const fogColor = skyHorizon;
    const fogDensity = this.settings.fog * 0.55 * (this.weather.rain > 0.3 ? 1.4 : 1);
    const exposure = 1.75;

    this.renderer.beginFrame(this.viewMat, this.projMat, [eye.x, eye.y, eye.z], this.time * 12, this.sunDir, sunColor, skyTop, skyHorizon, fogColor, dayFactor, fogDensity, this.weather.rain, this.weather.rain > 0.2 ? 1 : 0, exposure, qualityToInt(this.settings.preset));

    const meshes = this.chunkManager.getMeshesInFrustum(this.frustum, eye.y);
    for (const m of meshes) {
      this.renderer.drawChunkMesh(m.mesh, m.x, m.z);
    }
    this.renderer.drawWater(meshes);

    const underwater = this.chunkManager.getBlock(Math.floor(eye.x), Math.floor(eye.y), Math.floor(eye.z), this.chunkManager.dim) === BlockId.WATER;
    this.renderer.endFrame(underwater, this.damageVignette, qualityToInt(this.settings.preset));

    this.stats.draws = this.renderer.stats.draws;
    this.stats.tris = this.renderer.stats.tris;
    this.stats.chunks = meshes.length;
    this.stats.entities = this.entities.entities.length;
    const b = this.getBiomeAt(this.player.x, this.player.z);
    this.stats.biome = b ? b.key : "unknown";
    this.stats.dim = ["Overworld", "Emberdepth", "Aetherisle"][this.chunkManager.dim] || "Overworld";

    if (this.raycast.hit && this.raycast.hit.block) {
      const el = document.getElementById("block-highlight");
      if (el) {
        el.textContent = `${this.raycast.hit.block.x}, ${this.raycast.hit.block.y}, ${this.raycast.hit.block.z} ${getBlockDef(this.raycast.hit.block.id & 0x3ff)?.name || ""} ${this.breaking.active ? Math.floor(this.breaking.progress * 100) + "%" : ""}`;
        el.style.display = "block";
      }
    } else {
      const el = document.getElementById("block-highlight");
      if (el) el.style.display = "none";
    }
  }

  renderMenuVista(dt) {
    if (!this.renderer) return;
    this.time += dt * 0.1;
    const eye = [Math.cos(this.time * 0.15) * 28, 72 + Math.sin(this.time * 0.1) * 2, Math.sin(this.time * 0.15) * 28];
    const target = [0, 58, 0];
    lookAt(this.viewMat, eye, target, [0, 1, 0]);
    const aspect = this.canvas.width / Math.max(1, this.canvas.height);
    perspective(this.projMat, (78 * Math.PI) / 180, aspect, 0.1, 600);
    const vp = new Float32Array(16);
    const { multiply } = requireMat();
    multiply(vp, this.projMat, this.viewMat);
    frustumPlanes(vp, this.frustum);
    this.renderer.beginFrame(this.viewMat, this.projMat, eye, this.time * 6, [0.4, 0.8, 0.2], [1.15, 1.05, 0.95], [0.42, 0.68, 0.96], [0.72, 0.85, 0.98], [0.72, 0.85, 0.98], 0.006, 0.35, 0, 0, 1.75, 2);
    if (this.chunkManager) {
      const meshes = this.chunkManager.getMeshesInFrustum(this.frustum, eye[1]);
      for (const m of meshes) this.renderer.drawChunkMesh(m.mesh, m.x, m.z);
      this.renderer.drawWater(meshes);
    }
    this.renderer.endFrame(false, 0, 2);
  }
}

function qualityToInt(preset) {
  if (preset === "potato") return 0;
  if (preset === "low") return 1;
  if (preset === "medium") return 2;
  if (preset === "high") return 3;
  if (preset === "ultra") return 4;
  return 5;
}

function requireMat() {
  return {
    multiply(out, a, b) {
      const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
      const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
      const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
      let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
      out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
      out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
      out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
      out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      return out;
    },
  };
}

window.addEventListener("DOMContentLoaded", () => {
  const game = new Game();
  window.game = game;
  game.init();
});
