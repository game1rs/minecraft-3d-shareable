export class Combat {
  constructor() {
    this.cooldown = 0;
    this.swing = 0;
  }

  update(dt) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.swing > 0) this.swing -= dt * 3;
  }

  canAttack() {
    return this.cooldown <= 0;
  }

  attack() {
    if (!this.canAttack()) return false;
    this.cooldown = 0.45;
    this.swing = 1;
    return true;
  }

  getDamage(tool) {
    if (!tool) return 1;
    const k = tool.key;
    if (k.includes("blade")) {
      if (k.includes("wood")) return 4;
      if (k.includes("cuprite")) return 5;
      if (k.includes("ferrite")) return 6;
      if (k.includes("lumenite")) return 7;
      if (k.includes("sunmetal")) return 7.5;
      if (k.includes("prismite")) return 8;
      if (k.includes("deepcore")) return 9;
      return 4;
    }
    if (k.includes("pick") || k.includes("axe")) return 3;
    if (k.includes("shovel")) return 2;
    return 1;
  }
}
