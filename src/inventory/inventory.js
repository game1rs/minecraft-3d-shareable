import { getBlockByKey } from "../blocks/registry.js";
import { getItemDef, makeStack, MAX_STACK } from "../items/registry.js";

export const HOTBAR = 9;
export const INV_COLS = 9;
export const INV_ROWS = 4;
export const INV_SIZE = HOTBAR + INV_COLS * INV_ROWS;

export class Inventory {
  constructor(size = INV_SIZE) {
    this.size = size;
    this.slots = new Array(size).fill(null);
    this.selected = 0;
    this.rev = 1;
  }

  get(i) {
    return this.slots[i] || null;
  }

  set(i, stack) {
    this.slots[i] = stack ? { ...stack } : null;
    this.rev++;
  }

  clear() {
    this.slots.fill(null);
    this.rev++;
  }

  findStack(key) {
    for (let i = 0; i < this.size; i++) {
      const s = this.slots[i];
      if (s && s.key === key) return i;
    }
    return -1;
  }

  countOf(key) {
    let c = 0;
    for (const s of this.slots) if (s && s.key === key) c += s.count;
    return c;
  }

  canAdd(key, count = 1) {
    const def = getItemDef(key);
    const max = def?.stack ?? MAX_STACK;
    let remain = count;
    for (const s of this.slots) {
      if (!s) {
        remain -= max;
        if (remain <= 0) return true;
      } else if (s.key === key && s.count < max) {
        remain -= max - s.count;
        if (remain <= 0) return true;
      }
    }
    return remain <= 0;
  }

  add(key, count = 1, dur = 0, maxDur = 0) {
    const def = getItemDef(key);
    const max = def?.stack ?? MAX_STACK;
    let remain = count;
    for (let i = 0; i < this.size; i++) {
      const s = this.slots[i];
      if (s && s.key === key && s.count < max && s.maxDur === 0) {
        const add = Math.min(max - s.count, remain);
        s.count += add;
        remain -= add;
        if (remain <= 0) {
          this.rev++;
          return true;
        }
      }
    }
    for (let i = 0; i < this.size; i++) {
      if (!this.slots[i]) {
        const put = Math.min(max, remain);
        this.slots[i] = makeStack(key, put, dur, maxDur);
        remain -= put;
        if (remain <= 0) {
          this.rev++;
          return true;
        }
      }
    }
    this.rev++;
    return remain <= 0;
  }

  removeAt(i, count = 1) {
    const s = this.slots[i];
    if (!s) return false;
    if (s.count <= count) this.slots[i] = null;
    else s.count -= count;
    this.rev++;
    return true;
  }

  remove(key, count = 1) {
    let remain = count;
    for (let i = 0; i < this.size; i++) {
      const s = this.slots[i];
      if (!s || s.key !== key) continue;
      if (s.count <= remain) {
        remain -= s.count;
        this.slots[i] = null;
      } else {
        s.count -= remain;
        remain = 0;
      }
      if (remain <= 0) break;
    }
    this.rev++;
    return remain <= 0;
  }

  swap(a, b) {
    const t = this.slots[a];
    this.slots[a] = this.slots[b];
    this.slots[b] = t;
    this.rev++;
  }

  split(a, b) {
    const sa = this.slots[a];
    if (!sa) return;
    if (!this.slots[b]) {
      const half = Math.floor(sa.count / 2);
      if (half <= 0) return;
      this.slots[b] = { ...sa, count: half };
      sa.count -= half;
      this.rev++;
    } else if (this.slots[b].key === sa.key && this.slots[b].count < (getItemDef(sa.key)?.stack ?? MAX_STACK)) {
      const sb = this.slots[b];
      const max = getItemDef(sa.key)?.stack ?? MAX_STACK;
      const can = max - sb.count;
      const mv = Math.min(1, Math.min(can, sa.count));
      sb.count += mv;
      sa.count -= mv;
      if (sa.count <= 0) this.slots[a] = null;
      this.rev++;
    }
  }

  moveTo(inv2, from, to) {
    const a = this.slots[from];
    const b = inv2.slots[to];
    if (!a) return;
    if (!b) {
      inv2.slots[to] = a;
      this.slots[from] = null;
    } else if (a.key === b.key && a.maxDur === 0) {
      const max = getItemDef(a.key)?.stack ?? MAX_STACK;
      const space = max - b.count;
      if (space > 0) {
        const mv = Math.min(space, a.count);
        b.count += mv;
        a.count -= mv;
        if (a.count <= 0) this.slots[from] = null;
      } else {
        this.swap(from, from);
        const t = this.slots[from];
        this.slots[from] = inv2.slots[to];
        inv2.slots[to] = t;
      }
    } else {
      const t = this.slots[from];
      this.slots[from] = inv2.slots[to];
      inv2.slots[to] = t;
    }
    this.rev++;
    inv2.rev++;
  }

  hotbarStack() {
    return this.slots[this.selected] || null;
  }

  toJSON() {
    return this.slots.map((s) => (s ? { ...s } : null));
  }

  fromJSON(arr) {
    this.slots = new Array(this.size).fill(null);
    for (let i = 0; i < Math.min(arr.length, this.size); i++) {
      const s = arr[i];
      if (s) this.slots[i] = { key: s.key, count: s.count | 0, dur: s.dur | 0, maxDur: s.maxDur | 0 };
    }
    this.rev++;
  }
}

export function sortInventory(inv) {
  const items = inv.slots.filter(Boolean).sort((a, b) => {
    if (a.key < b.key) return -1;
    if (a.key > b.key) return 1;
    return b.count - a.count;
  });
  inv.slots.fill(null);
  for (let i = 0; i < items.length && i < inv.size; i++) inv.slots[i] = items[i];
  inv.rev++;
}
