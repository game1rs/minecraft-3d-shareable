export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.ambientGain = null;
    this.enabled = true;
    this.time = 0;
    this.musicNodes = [];
    this.rainGain = null;
    this.windGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.master);
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.6;
      this.ambientGain.connect(this.master);
    } catch (e) {
      console.warn("Audio init failed", e);
    }
  }

  setVolumes(master, music, sfx, ambient) {
    if (!this.ctx) return;
    if (this.master) this.master.gain.value = master;
    if (this.musicGain) this.musicGain.gain.value = music;
    if (this.sfxGain) this.sfxGain.gain.value = sfx;
    if (this.ambientGain) this.ambientGain.gain.value = ambient;
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  playTone(freq, dur, type = "sine", gain = 0.2, dest = null) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g);
    g.connect(dest || this.sfxGain || this.master);
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  playBlockSound(sound, pos, volume = 1) {
    if (!this.ctx) return;
    const table = {
      grass: [180, 0.18, "triangle"],
      dirt: [120, 0.2, "sine"],
      stone: [90, 0.25, "square"],
      wood: [220, 0.2, "triangle"],
      sand: [300, 0.12, "sine"],
      glass: [800, 0.15, "sine"],
      wet: [200, 0.15, "sine"],
      cloth: [260, 0.14, "triangle"],
      gravel: [150, 0.18, "square"],
      mud: [100, 0.18, "sine"],
      snow: [320, 0.1, "sine"],
    };
    const cfg = table[sound] || table.stone;
    this.playTone(cfg[0] * (0.9 + Math.random() * 0.2), cfg[1], cfg[2], 0.18 * volume);
  }

  playStep(sound, sprint = false) {
    if (!this.ctx) return;
    const f = sound === "grass" ? 160 : sound === "stone" ? 80 : 120;
    this.playTone(f * (sprint ? 1.15 : 1), 0.12, "square", 0.08);
  }

  playMusic(biome, timeOfDay, rain) {
    if (!this.ctx) return;
    if (this.musicNodes.length > 0) return;
    const now = this.ctx.currentTime;
    const baseFreq = biome === "mushroom" ? 110 : biome === "crystal" ? 220 : biome === "desert" ? 98 : 130;
    for (let i = 0; i < 3; i++) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = i === 0 ? "sine" : i === 1 ? "triangle" : "sine";
      o.frequency.value = baseFreq * (i === 0 ? 1 : i === 1 ? 1.5 : 2.01) * (0.98 + Math.random() * 0.04);
      g.gain.value = 0;
      o.connect(g);
      g.connect(this.musicGain);
      g.gain.linearRampToValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.06 / (i + 1), now + 2 + i);
      o.start(now);
      this.musicNodes.push({ o, g, start: now });
    }
    setTimeout(() => this.stopMusic(), 18000 + Math.random() * 12000);
  }

  stopMusic() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const n of this.musicNodes) {
      try {
        n.g.gain.linearRampToValueAtTime(0.001, now + 2);
        n.o.stop(now + 2.2);
      } catch {}
    }
    this.musicNodes = [];
  }

  setWeather(rain, thunder) {
    if (!this.ctx) return;
    if (rain > 0.1) {
      if (!this.rainGain) {
        const bufSize = this.ctx.sampleRate * 2;
        const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1800;
        filter.Q.value = 0.5;
        const g = this.ctx.createGain();
        g.gain.value = 0;
        src.connect(filter);
        filter.connect(g);
        g.connect(this.ambientGain);
        src.start();
        this.rainGain = g;
        this.rainSrc = src;
      }
      this.rainGain.gain.linearRampToValueAtTime(rain * 0.25, this.ctx.currentTime + 1);
    } else if (this.rainGain) {
      this.rainGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
    }
    if (thunder && Math.random() < 0.01) {
      this.playTone(40 + Math.random() * 30, 1.2, "sawtooth", 0.25, this.ambientGain);
      setTimeout(() => this.playTone(60, 0.6, "triangle", 0.18, this.ambientGain), 200 + Math.random() * 600);
    }
  }

  update(dt, biome, timeOfDay, rain) {
    this.time += dt;
    if (this.ctx && Math.random() < 0.0006) {
      this.playMusic(biome, timeOfDay, rain);
    }
  }
}
