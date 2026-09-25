export const PRESETS = {
  potato: { render: 4, shadow: 0, fog: 0.018, bloom: false, ao: false, water: 0, clouds: 0, dpr: 0.7, viewBob: false, fov: 72, chunk: 4, particles: 0.25, vsync: false },
  low: { render: 6, shadow: 0, fog: 0.014, bloom: false, ao: true, water: 0, clouds: 0.2, dpr: 0.9, viewBob: true, fov: 78, chunk: 6, particles: 0.5, vsync: false },
  medium: { render: 8, shadow: 0, fog: 0.011, bloom: true, ao: true, water: 1, clouds: 0.45, dpr: 1, viewBob: true, fov: 80, chunk: 8, particles: 0.75, vsync: true },
  high: { render: 12, shadow: 1, fog: 0.008, bloom: true, ao: true, water: 2, clouds: 0.6, dpr: 1.15, viewBob: true, fov: 82, chunk: 12, particles: 1, vsync: true },
  ultra: { render: 16, shadow: 1, fog: 0.006, bloom: true, ao: true, water: 2, clouds: 0.7, dpr: 1.35, viewBob: true, fov: 84, chunk: 16, particles: 1, vsync: true },
  extreme: { render: 24, shadow: 1, fog: 0.0045, bloom: true, ao: true, water: 2, clouds: 0.8, dpr: 1.5, viewBob: true, fov: 86, chunk: 24, particles: 1, vsync: true },
};

export const DEFAULT_SETTINGS = {
  preset: "medium",
  render: 8,
  fov: 80,
  sensitivity: 0.35,
  invertY: false,
  dpr: 1,
  fog: 0.011,
  bloom: true,
  ao: true,
  water: 1,
  shadow: 0,
  clouds: 0.45,
  chunk: 8,
  particles: 0.75,
  viewBob: true,
  headBob: true,
  shake: true,
  uiScale: 1,
  subtitles: false,
  colorSafe: false,
  highContrast: false,
  reducedMotion: false,
  master: 0.7,
  music: 0.5,
  sfx: 0.8,
  ambient: 0.6,
  vsync: true,
  showFps: false,
  showCoords: false,
  autoJump: false,
  reach: 5.2,
  keyForward: "KeyW",
  keyBack: "KeyS",
  keyLeft: "KeyA",
  keyRight: "KeyD",
  keyJump: "Space",
  keySprint: "ShiftLeft",
  keyCrouch: "ControlLeft",
  keyInventory: "KeyE",
  keyInteract: "KeyF",
  keyDrop: "KeyQ",
  keyChat: "KeyT",
};

export function detectPreset() {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) return "potato";
  const debug = gl.getExtension("WEBGL_debug_renderer_info");
  let gpu = "";
  if (debug) {
    try { gpu = gl.getParameter(debug.UNMASKED_RENDERER_WEBGL).toLowerCase(); } catch {}
  }
  const mem = navigator.deviceMemory || 4;
  const cores = navigator.hardwareConcurrency || 4;
  const mobile = /Mobi|Android/i.test(navigator.userAgent);
  if (mobile) return mem < 4 ? "potato" : "low";
  if (mem <= 4 || cores <= 4 || gpu.includes("intel")) return "low";
  if (mem <= 8) return "medium";
  if (gpu.includes("nvidia") && (gpu.includes("3060") || gpu.includes("3070") || gpu.includes("4060") || gpu.includes("4070"))) return "ultra";
  if (gpu.includes("nvidia") && (gpu.includes("3080") || gpu.includes("3090") || gpu.includes("4080") || gpu.includes("4090"))) return "extreme";
  return "high";
}

export function applyPreset(name, target) {
  const p = PRESETS[name] || PRESETS.medium;
  target.render = p.render;
  target.fog = p.fog;
  target.bloom = p.bloom;
  target.ao = p.ao;
  target.water = p.water;
  target.clouds = p.clouds;
  target.dpr = p.dpr;
  target.viewBob = p.viewBob;
  target.fov = p.fov;
  target.chunk = p.chunk;
  target.particles = p.particles;
  target.vsync = p.vsync;
  target.preset = name;
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem("blockwild_settings");
    if (!raw) {
      const s = { ...DEFAULT_SETTINGS };
      const preset = detectPreset();
      applyPreset(preset, s);
      return s;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s) {
  try { localStorage.setItem("blockwild_settings", JSON.stringify(s)); } catch {}
}
