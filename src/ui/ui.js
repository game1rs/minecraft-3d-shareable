import { getItemDef } from "../items/registry.js";
import { getBlockDef } from "../blocks/registry.js";
import { sortInventory } from "../inventory/inventory.js";
import { RECIPES, KILN_RECIPES, matchCraft, consumeCraft, fuelTime } from "../crafting/recipes.js";

export class UI {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById("ui-root");
    this.hud = document.getElementById("hud");
    this.menu = document.getElementById("menu");
    this.inventoryEl = document.getElementById("inventory");
    this.hotbarEl = document.getElementById("hotbar");
    this.healthEl = document.getElementById("health");
    this.hungerEl = document.getElementById("hunger");
    this.crosshair = document.getElementById("crosshair");
    this.debugEl = document.getElementById("debug");
    this.chatEl = document.getElementById("chat");
    this.tooltipEl = document.getElementById("tooltip");
    this.craftEl = document.getElementById("crafting");
    this.pauseEl = document.getElementById("pause");
    this.settingsEl = document.getElementById("settings");
    this.worldListEl = document.getElementById("world-list");
    this.createWorldEl = document.getElementById("create-world");
    this.howtoEl = document.getElementById("howto");

    this.invOpen = false;
    this.craftOpen = false;
    this.pauseOpen = false;
    this.drag = null;
    this.search = "";
    this.category = "all";

    this.setupEvents();
  }

  setupEvents() {
    window.addEventListener("mousemove", (e) => {
      if (this.drag && this.drag.el) {
        this.drag.el.style.left = e.clientX + 12 + "px";
        this.drag.el.style.top = e.clientY + 12 + "px";
      }
      if (this.tooltipEl && this.tooltipEl.style.display !== "none") {
        this.tooltipEl.style.left = e.clientX + 14 + "px";
        this.tooltipEl.style.top = e.clientY + 14 + "px";
      }
    });
    const search = document.getElementById("craft-search");
    if (search) {
      search.addEventListener("input", () => {
        this.search = search.value.toLowerCase();
        this.renderCrafting();
      });
    }
  }

  showMenu() {
    this.menu.style.display = "flex";
    this.hud.style.display = "none";
    this.inventoryEl.style.display = "none";
    this.pauseEl.style.display = "none";
    this.settingsEl.style.display = "none";
    this.createWorldEl.style.display = "none";
    this.worldListEl.style.display = "none";
    this.howtoEl.style.display = "none";
    if (this.game.canvas) {
      this.game.canvas.style.pointerEvents = "none";
      this.game.canvas.style.zIndex = "0";
    }
    document.exitPointerLock?.();
  }

  showHUD() {
    this.menu.style.display = "none";
    this.hud.style.display = "block";
    this.pauseEl.style.display = "none";
    this.settingsEl.style.display = "none";
    this.createWorldEl.style.display = "none";
    this.worldListEl.style.display = "none";
    this.howtoEl.style.display = "none";
    this.inventoryEl.style.display = this.invOpen ? "flex" : "none";
    if (this.game.canvas) {
      this.game.canvas.style.pointerEvents = "auto";
      this.game.canvas.style.zIndex = "0";
    }
  }

  showPause() {
    this.pauseEl.style.display = "flex";
    this.pauseOpen = true;
    if (this.game.canvas) this.game.canvas.style.pointerEvents = "none";
    document.exitPointerLock?.();
  }

  hidePause() {
    this.pauseEl.style.display = "none";
    this.pauseOpen = false;
    if (this.game.canvas) this.game.canvas.style.pointerEvents = "auto";
    if (this.game.running) this.game.canvas.requestPointerLock?.();
  }

  showOverlay(el) {
    if (el) el.style.display = "flex";
    if (this.game.canvas) this.game.canvas.style.pointerEvents = "none";
  }

  hideOverlay(el) {
    if (el) el.style.display = "none";
    if (this.game.canvas) this.game.canvas.style.pointerEvents = "auto";
  }

  toggleInventory() {
    this.invOpen = !this.invOpen;
    this.inventoryEl.style.display = this.invOpen ? "flex" : "none";
    if (this.invOpen) {
      if (this.game.canvas) this.game.canvas.style.pointerEvents = "none";
      document.exitPointerLock?.();
      this.renderInventory();
    } else {
      if (this.game.canvas) this.game.canvas.style.pointerEvents = "auto";
      if (this.game.running) this.game.canvas.requestPointerLock?.();
    }
  }

  renderHotbar(inv) {
    if (!this.hotbarEl) return;
    this.hotbarEl.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const slot = document.createElement("div");
      slot.className = "hotbar-slot" + (i === inv.selected ? " selected" : "");
      const stack = inv.get(i);
      if (stack) {
        const def = getItemDef(stack.key);
        slot.innerHTML = `<div class="item-icon" data-key="${stack.key}">${def ? def.name.slice(0, 2) : stack.key.slice(0, 2)}</div><div class="item-count">${stack.count > 1 ? stack.count : ""}</div>`;
        if (stack.maxDur > 0) {
          const pct = 1 - stack.dur / stack.maxDur;
          slot.innerHTML += `<div class="dur-bar"><div style="width:${pct * 100}%"></div></div>`;
        }
      }
      slot.addEventListener("mouseenter", (e) => this.showTooltip(e, inv.get(i)));
      slot.addEventListener("mouseleave", () => this.hideTooltip());
      this.hotbarEl.appendChild(slot);
    }
  }

  renderInventory() {
    const inv = this.game.session.inventory;
    const grid = this.inventoryEl.querySelector(".inv-grid");
    if (!grid) return;
    grid.innerHTML = "";
    for (let i = 0; i < inv.size; i++) {
      const slot = document.createElement("div");
      slot.className = "inv-slot";
      slot.dataset.index = i;
      const stack = inv.get(i);
      if (stack) {
        const def = getItemDef(stack.key);
        const name = def ? def.name : stack.key;
        slot.innerHTML = `<div class="item-icon">${name.slice(0, 2)}</div><div class="item-count">${stack.count > 1 ? stack.count : ""}</div>`;
        if (stack.maxDur > 0) {
          const pct = 1 - stack.dur / stack.maxDur;
          slot.innerHTML += `<div class="dur-bar"><div style="width:${pct * 100}%"></div></div>`;
        }
      }
      slot.addEventListener("mousedown", (e) => this.onSlotMouseDown(e, i));
      slot.addEventListener("mouseenter", (e) => this.showTooltip(e, inv.get(i)));
      slot.addEventListener("mouseleave", () => this.hideTooltip());
      slot.addEventListener("mouseup", (e) => this.onSlotMouseUp(e, i));
      grid.appendChild(slot);
    }
    this.renderCrafting();
    this.renderHotbar(inv);
  }

  onSlotMouseDown(e, index) {
    const inv = this.game.session.inventory;
    const stack = inv.get(index);
    if (e.button === 0) {
      if (stack) {
        this.drag = { from: index, stack: { ...stack }, el: null };
        const el = document.createElement("div");
        el.className = "drag-ghost";
        el.textContent = stack.key.slice(0, 2) + (stack.count > 1 ? " " + stack.count : "");
        el.style.position = "fixed";
        el.style.pointerEvents = "none";
        el.style.zIndex = "9999";
        el.style.left = e.clientX + 12 + "px";
        el.style.top = e.clientY + 12 + "px";
        document.body.appendChild(el);
        this.drag.el = el;
      }
    } else if (e.button === 2) {
      e.preventDefault();
      if (stack) {
        const empty = inv.slots.findIndex((s) => !s);
        if (empty >= 0) {
          inv.split(index, empty);
          this.renderInventory();
        }
      }
    }
  }

  onSlotMouseUp(e, index) {
    if (!this.drag) return;
    const inv = this.game.session.inventory;
    const from = this.drag.from;
    if (from === index) {
      if (this.drag.el) this.drag.el.remove();
      this.drag = null;
      return;
    }
    const targetStack = inv.get(index);
    const fromStack = inv.get(from);
    if (!fromStack) {
      if (this.drag.el) this.drag.el.remove();
      this.drag = null;
      return;
    }
    if (!targetStack) {
      inv.set(index, fromStack);
      inv.set(from, null);
    } else if (targetStack.key === fromStack.key && targetStack.maxDur === 0) {
      const def = getItemDef(fromStack.key);
      const max = def?.stack ?? 64;
      const space = max - targetStack.count;
      if (space > 0) {
        const mv = Math.min(space, fromStack.count);
        targetStack.count += mv;
        fromStack.count -= mv;
        if (fromStack.count <= 0) inv.set(from, null);
        else inv.set(from, fromStack);
        inv.set(index, targetStack);
      } else {
        inv.swap(from, index);
      }
    } else {
      inv.swap(from, index);
    }
    if (this.drag.el) this.drag.el.remove();
    this.drag = null;
    this.renderInventory();
  }

  showTooltip(e, stack) {
    if (!stack || !this.tooltipEl) return;
    const def = getItemDef(stack.key);
    const blockDef = getBlockDef(stack.key);
    const bDef = blockDef || null;
    const name = def ? def.name : bDef ? bDef.name : stack.key;
    const desc = def ? def.desc : bDef ? bDef.desc : "";
    this.tooltipEl.innerHTML = `<div class="tt-name">${name}</div><div class="tt-desc">${desc}</div><div class="tt-meta">${stack.count} × ${def?.stack ?? 64}${stack.maxDur ? ` | ${stack.maxDur - stack.dur}/${stack.maxDur}` : ""}</div>`;
    this.tooltipEl.style.display = "block";
    this.tooltipEl.style.left = e.clientX + 14 + "px";
    this.tooltipEl.style.top = e.clientY + 14 + "px";
  }

  hideTooltip() {
    if (this.tooltipEl) this.tooltipEl.style.display = "none";
  }

  renderCrafting() {
    if (!this.craftEl) return;
    const gridEl = this.craftEl.querySelector(".craft-grid");
    const outEl = this.craftEl.querySelector(".craft-output");
    const listEl = this.craftEl.querySelector(".craft-list");
    if (!gridEl || !outEl || !listEl) return;

    const inv = this.game.session.inventory;
    const size = 3;
    if (!this.craftMatrix) this.craftMatrix = new Array(9).fill(null);

    gridEl.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const slot = document.createElement("div");
      slot.className = "craft-slot";
      const st = this.craftMatrix[i];
      if (st) slot.textContent = st.key.slice(0, 2) + (st.count > 1 ? " " + st.count : "");
      slot.addEventListener("click", () => {
        const sel = inv.hotbarStack();
        if (sel && !this.craftMatrix[i]) {
          this.craftMatrix[i] = { key: sel.key, count: 1 };
          inv.remove(sel.key, 1);
          this.renderInventory();
        } else if (this.craftMatrix[i]) {
          inv.add(this.craftMatrix[i].key, this.craftMatrix[i].count);
          this.craftMatrix[i] = null;
          this.renderInventory();
        }
      });
      gridEl.appendChild(slot);
    }

    const matched = matchCraft(this.craftMatrix, size, null);
    outEl.innerHTML = "";
    if (matched) {
      const def = getItemDef(matched.out.key);
      const d = document.createElement("div");
      d.className = "craft-out";
      d.textContent = (def ? def.name : matched.out.key) + " ×" + matched.out.count;
      d.addEventListener("click", () => {
        if (inv.canAdd(matched.out.key, matched.out.count)) {
          consumeCraft(this.craftMatrix, size, matched);
          inv.add(matched.out.key, matched.out.count);
          this.renderInventory();
        }
      });
      outEl.appendChild(d);
    }

    listEl.innerHTML = "";
    const filtered = RECIPES.filter((r) => {
      if (this.search && !r.out.key.includes(this.search) && !r.out.key.includes(this.search.toLowerCase())) return false;
      if (this.category !== "all") {
        const idef = getItemDef(r.out.key);
        if (!idef || idef.category !== this.category) return false;
      }
      return true;
    }).slice(0, 60);
    for (const rec of filtered) {
      const div = document.createElement("div");
      div.className = "craft-recipe";
      const def = getItemDef(rec.out.key);
      div.textContent = (def ? def.name : rec.out.key) + " ×" + rec.out.count;
      div.addEventListener("click", () => {
        if (rec.shaped) {
          this.craftMatrix = new Array(9).fill(null);
          for (let y = 0; y < rec.h; y++) {
            for (let x = 0; x < rec.w; x++) {
              const k = rec.pattern[y][x];
              if (!k) continue;
              const idx = y * 3 + x;
              this.craftMatrix[idx] = { key: k, count: 1 };
            }
          }
          this.renderInventory();
        }
      });
      listEl.appendChild(div);
    }
  }

  updateHUD() {
    const session = this.game.session;
    const player = this.game.player;
    if (this.healthEl) {
      const hp = session.playerData.health;
      this.healthEl.innerHTML = "";
      for (let i = 0; i < 10; i++) {
        const full = hp >= (i + 1) * 2;
        const half = hp === i * 2 + 1;
        const d = document.createElement("div");
        d.className = "heart " + (full ? "full" : half ? "half" : "empty");
        this.healthEl.appendChild(d);
      }
    }
    if (this.hungerEl) {
      const hg = session.playerData.hunger;
      this.hungerEl.innerHTML = "";
      for (let i = 0; i < 10; i++) {
        const full = hg >= (i + 1) * 2;
        const half = hg === i * 2 + 1;
        const d = document.createElement("div");
        d.className = "hunger " + (full ? "full" : half ? "half" : "empty");
        this.hungerEl.appendChild(d);
      }
    }
    if (this.debugEl && this.game.settings.showFps) {
      const s = this.game.stats;
      this.debugEl.style.display = "block";
      this.debugEl.innerHTML = `FPS ${s.fps.toFixed(0)} | ${s.frameMs.toFixed(1)}ms | draws ${s.draws} tris ${s.tris} | chunks ${s.chunks} ents ${s.entities} | ${player.x.toFixed(1)} ${player.y.toFixed(1)} ${player.z.toFixed(1)} | biome ${s.biome} | seed ${this.game.seed} | ${s.dim}`;
    } else if (this.debugEl) {
      this.debugEl.style.display = "none";
    }
  }

  renderWorldList(worlds) {
    if (!this.worldListEl) return;
    const list = this.worldListEl.querySelector(".worlds");
    if (!list) return;
    list.innerHTML = "";
    for (const w of worlds) {
      const div = document.createElement("div");
      div.className = "world-entry";
      div.innerHTML = `<div class="w-name">${w.name}</div><div class="w-meta">${w.mode} | ${w.seedStr} | ${new Date(w.updated).toLocaleString()}</div>`;
      const play = document.createElement("button");
      play.textContent = "PLAY";
      play.addEventListener("click", () => this.game.loadWorld(w.id));
      const del = document.createElement("button");
      del.textContent = "DELETE";
      del.addEventListener("click", async () => {
        if (confirm("Delete " + w.name + "?")) {
          const { deleteWorld } = await import("../save/save.js");
          await deleteWorld(w.id);
          this.game.showWorlds();
        }
      });
      div.appendChild(play);
      div.appendChild(del);
      list.appendChild(div);
    }
  }

  bindMenuButtons(game) {
    const playBtn = document.getElementById("btn-play");
    const createBtn = document.getElementById("btn-create");
    const loadBtn = document.getElementById("btn-load");
    const settingsBtn = document.getElementById("btn-settings");
    const howtoBtn = document.getElementById("btn-howto");
    if (playBtn) playBtn.onclick = () => game.quickPlay();
    if (createBtn) createBtn.onclick = () => game.showCreateWorld();
    if (loadBtn) loadBtn.onclick = () => game.showWorlds();
    if (settingsBtn) settingsBtn.onclick = () => game.showSettings();
    if (howtoBtn) howtoBtn.onclick = () => game.showHowto();

    const resumeBtn = document.getElementById("btn-resume");
    const saveExitBtn = document.getElementById("btn-save-exit");
    const pauseSettingsBtn = document.getElementById("btn-pause-settings");
    if (resumeBtn) resumeBtn.onclick = () => this.hidePause();
    if (saveExitBtn) saveExitBtn.onclick = () => game.saveAndExit();
    if (pauseSettingsBtn) pauseSettingsBtn.onclick = () => game.showSettings(true);

    const settingsBack = document.getElementById("btn-settings-back");
    if (settingsBack) settingsBack.onclick = () => {
      if (this.pauseOpen) this.showPause();
      else this.showMenu();
      this.settingsEl.style.display = "none";
    };
    const worldBack = document.getElementById("btn-worlds-back");
    if (worldBack) worldBack.onclick = () => this.showMenu();
    const createBack = document.getElementById("btn-create-back");
    if (createBack) createBack.onclick = () => this.showMenu();
    const howtoBack = document.getElementById("btn-howto-back");
    if (howtoBack) howtoBack.onclick = () => this.showMenu();
    const createConfirm = document.getElementById("btn-create-confirm");
    if (createConfirm) createConfirm.onclick = () => game.createWorldFromForm();
  }
}
