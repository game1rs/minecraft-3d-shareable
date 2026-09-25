import { buildAtlas, createAtlasTexture } from "./textures.js";
import {
  chunkVert,
  chunkFrag,
  skyVert,
  skyFrag,
  postVert,
  postFrag,
  bloomFrag,
  brightFrag,
} from "./shaders.js";
import { CHUNK, HEIGHT } from "./constants.js";

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    console.error("Shader compile error", log, src.slice(0, 400));
    throw new Error("Shader compile failed: " + log);
  }
  return s;
}

function program(gl, vsSrc, fsSrc) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(p));
    throw new Error("Program link failed");
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return p;
}

export class Renderer {
  constructor(canvas, settings) {
    this.canvas = canvas;
    this.settings = settings;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: true,
      stencil: false,
      desynchronized: true,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;
    this.atlasInfo = buildAtlas();
    this.tileMap = this.atlasInfo.tileMap;
    this.atlasTex = createAtlasTexture(gl, this.atlasInfo);

    this.chunkProg = program(gl, chunkVert, chunkFrag);
    this.skyProg = program(gl, skyVert, skyFrag);
    this.postProg = program(gl, postVert, postFrag);
    this.brightProg = program(gl, postVert, brightFrag);
    this.bloomProg = program(gl, postVert, bloomFrag);

    this.setupQuad();
    this.setupFramebuffers();
    this.setupChunkState();

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.sunDir = [0.4, 0.85, 0.2];
    this.view = new Float32Array(16);
    this.proj = new Float32Array(16);
    this.model = new Float32Array(16);
    for (let i = 0; i < 16; i++) this.model[i] = i % 5 === 0 ? 1 : 0;

    this.time = 0;
    this.frame = 0;
    this.stats = { draws: 0, tris: 0, chunks: 0 };
  }

  setupQuad() {
    const gl = this.gl;
    const quadVerts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    this.quadVbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
    this.quadVao = gl.createVertexArray();
    gl.bindVertexArray(this.quadVao);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  setupFramebuffers() {
    const gl = this.gl;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const makeTex = (filter = gl.LINEAR) => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      return t;
    };
    const canFloat = gl.getExtension("EXT_color_buffer_float");
    this.canFloat = !!canFloat;
    const internal = canFloat ? gl.RGBA16F : gl.RGBA8;
    const type = canFloat ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
    const mk = () => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, gl.RGBA, type, null);
      return t;
    };
    this.sceneTex = mk();
    this.sceneFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.sceneTex, 0);
    const depthRb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRb);
    this.depthRb = depthRb;

    this.brightTex = mk();
    this.brightFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.brightFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.brightTex, 0);

    const bw = Math.max(1, w >> 1);
    const bh = Math.max(1, h >> 1);
    const mkSmall = () => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, bw, bh, 0, gl.RGBA, type, null);
      return t;
    };
    this.bloomA = mkSmall();
    this.bloomB = mkSmall();
    this.bloomFboA = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFboA);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.bloomA, 0);
    this.bloomFboB = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFboB);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.bloomB, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.fbW = w;
    this.fbH = h;
    this.bloomW = bw;
    this.bloomH = bh;
  }

  resize() {
    const gl = this.gl;
    const dpr = Math.min(window.devicePixelRatio || 1, this.settings.dpr || 1.5);
    const w = Math.floor(this.canvas.clientWidth * dpr);
    const h = Math.floor(this.canvas.clientHeight * dpr);
    if (w === this.fbW && h === this.fbH) return;
    this.canvas.width = w;
    this.canvas.height = h;
    gl.deleteFramebuffer(this.sceneFbo);
    gl.deleteFramebuffer(this.brightFbo);
    gl.deleteFramebuffer(this.bloomFboA);
    gl.deleteFramebuffer(this.bloomFboB);
    gl.deleteTexture(this.sceneTex);
    gl.deleteTexture(this.brightTex);
    gl.deleteTexture(this.bloomA);
    gl.deleteTexture(this.bloomB);
    gl.deleteRenderbuffer(this.depthRb);
    this.setupFramebuffers();
  }

  setupChunkState() {
    const gl = this.gl;
    this.chunkVao = gl.createVertexArray();
    this.chunkVbo = gl.createBuffer();
    gl.bindVertexArray(this.chunkVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.chunkVbo);
    const stride = 14 * 4;
    let off = 0;
    const attrs = [
      [0, 3],
      [1, 2],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
      [6, 1],
      [7, 1],
      [8, 1],
      [9, 1],
      [10, 1],
    ];
    for (let i = 0; i < attrs.length; i++) {
      const [loc, size] = attrs[i];
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, off);
      off += size * 4;
    }
    gl.bindVertexArray(null);
  }

  beginFrame(viewMat, projMat, camPos, time, sunDir, sunColor, skyTop, skyHorizon, fogColor, dayFactor, fogDensity, rain, wet, exposure, quality) {
    this.view.set(viewMat);
    this.proj.set(projMat);
    this.time = time;
    this.sunDir = sunDir.slice();
    this.stats.draws = 0;
    this.stats.tris = 0;
    this.stats.chunks = 0;
    const gl = this.gl;
    this.resize();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFbo);
    gl.viewport(0, 0, this.fbW, this.fbH);
    gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.disable(gl.BLEND);
    gl.depthMask(true);
    this.drawSky(sunDir, sunColor, skyTop, skyHorizon, fogColor, time, dayFactor, rain);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(this.chunkProg);
    gl.bindVertexArray(this.chunkVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.atlasTex);
    const locs = this.chunkLocs || (this.chunkLocs = {
      view: gl.getUniformLocation(this.chunkProg, "uView"),
      proj: gl.getUniformLocation(this.chunkProg, "uProj"),
      model: gl.getUniformLocation(this.chunkProg, "uModel"),
      camPos: gl.getUniformLocation(this.chunkProg, "uCamPos"),
      time: gl.getUniformLocation(this.chunkProg, "uTime"),
      waterTime: gl.getUniformLocation(this.chunkProg, "uWaterTime"),
      sunDir: gl.getUniformLocation(this.chunkProg, "uSunDir"),
      sunColor: gl.getUniformLocation(this.chunkProg, "uSunColor"),
      skyColor: gl.getUniformLocation(this.chunkProg, "uSkyColor"),
      fogColor: gl.getUniformLocation(this.chunkProg, "uFogColor"),
      fogDensity: gl.getUniformLocation(this.chunkProg, "uFogDensity"),
      rain: gl.getUniformLocation(this.chunkProg, "uRain"),
      wet: gl.getUniformLocation(this.chunkProg, "uWet"),
      exposure: gl.getUniformLocation(this.chunkProg, "uExposure"),
      dayFactor: gl.getUniformLocation(this.chunkProg, "uDayFactor"),
      atlas: gl.getUniformLocation(this.chunkProg, "uAtlas"),
      quality: gl.getUniformLocation(this.chunkProg, "uQuality"),
    });
    gl.uniformMatrix4fv(locs.view, false, this.view);
    gl.uniformMatrix4fv(locs.proj, false, this.proj);
    gl.uniform3fv(locs.camPos, camPos);
    gl.uniform1f(locs.time, time);
    gl.uniform1f(locs.waterTime, time);
    gl.uniform3fv(locs.sunDir, sunDir);
    gl.uniform3fv(locs.sunColor, sunColor);
    gl.uniform3fv(locs.skyColor, skyHorizon);
    gl.uniform3fv(locs.fogColor, fogColor);
    gl.uniform1f(locs.fogDensity, fogDensity);
    gl.uniform1f(locs.rain, rain);
    gl.uniform1f(locs.wet, wet);
    gl.uniform1f(locs.exposure, exposure);
    gl.uniform1f(locs.dayFactor, dayFactor);
    gl.uniform1i(locs.atlas, 0);
    gl.uniform1i(locs.quality, quality | 0);
  }

  drawSky(sunDir, sunColor, skyTop, skyHorizon, fogColor, time, dayFactor, rain) {
    const gl = this.gl;
    gl.useProgram(this.skyProg);
    gl.bindVertexArray(this.quadVao);
    gl.disable(gl.DEPTH_TEST);
    const locs = this.skyLocs || (this.skyLocs = {
      invProj: gl.getUniformLocation(this.skyProg, "uInvProj"),
      invView: gl.getUniformLocation(this.skyProg, "uInvView"),
      sunDir: gl.getUniformLocation(this.skyProg, "uSunDir"),
      sunColor: gl.getUniformLocation(this.skyProg, "uSunColor"),
      skyTop: gl.getUniformLocation(this.skyProg, "uSkyTop"),
      skyHorizon: gl.getUniformLocation(this.skyProg, "uSkyHorizon"),
      fogColor: gl.getUniformLocation(this.skyProg, "uFogColor"),
      time: gl.getUniformLocation(this.skyProg, "uTime"),
      day: gl.getUniformLocation(this.skyProg, "uDay"),
      rain: gl.getUniformLocation(this.skyProg, "uRain"),
      cloudCover: gl.getUniformLocation(this.skyProg, "uCloudCover"),
    });
    const invProj = invertMat4(this.proj);
    const invView = invertMat4(this.view);
    gl.uniformMatrix4fv(locs.invProj, false, invProj);
    gl.uniformMatrix4fv(locs.invView, false, invView);
    gl.uniform3fv(locs.sunDir, sunDir);
    gl.uniform3fv(locs.sunColor, sunColor);
    gl.uniform3fv(locs.skyTop, skyTop);
    gl.uniform3fv(locs.skyHorizon, skyHorizon);
    gl.uniform3fv(locs.fogColor, fogColor);
    gl.uniform1f(locs.time, time);
    gl.uniform1f(locs.day, dayFactor);
    gl.uniform1f(locs.rain, rain);
    gl.uniform1f(locs.cloudCover, 0.55 + rain * 0.35);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.enable(gl.DEPTH_TEST);
  }

  drawChunkMesh(mesh, worldX, worldZ) {
    if (!mesh) return;
    const gl = this.gl;
    const model = this.model;
    model[12] = worldX;
    model[14] = worldZ;
    gl.uniformMatrix4fv(this.chunkLocs.model, false, model);
    const drawBucket = (buf) => {
      if (!buf || buf.length === 0) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.chunkVbo);
      gl.bufferData(gl.ARRAY_BUFFER, buf, gl.DYNAMIC_DRAW);
      const tris = buf.length / 14 / 3;
      gl.drawArrays(gl.TRIANGLES, 0, buf.length / 14);
      this.stats.draws++;
      this.stats.tris += tris;
    };
    if (mesh.solid) drawBucket(mesh.solid);
    if (mesh.cutout) {
      gl.disable(gl.CULL_FACE);
      drawBucket(mesh.cutout);
      gl.enable(gl.CULL_FACE);
    }
    if (mesh.model) {
      gl.disable(gl.CULL_FACE);
      drawBucket(mesh.model);
      gl.enable(gl.CULL_FACE);
    }
    this.stats.chunks++;
  }

  drawWater(chunks) {
    const gl = this.gl;
    for (const { mesh, x, z } of chunks) {
      if (!mesh || !mesh.water) continue;
      const model = this.model;
      model[12] = x;
      model[14] = z;
      gl.uniformMatrix4fv(this.chunkLocs.model, false, model);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.chunkVbo);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.water, gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.water.length / 14);
      this.stats.draws++;
      this.stats.tris += mesh.water.length / 14 / 3;
    }
  }

  endFrame(underwater, damage, quality) {
    const gl = this.gl;
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.fbW, this.fbH);
    this.applyBloom(quality);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.postProg);
    gl.bindVertexArray(this.quadVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomA);
    const locs = this.postLocs || (this.postLocs = {
      scene: gl.getUniformLocation(this.postProg, "uScene"),
      bloom: gl.getUniformLocation(this.postProg, "uBloom"),
      exposure: gl.getUniformLocation(this.postProg, "uExposure"),
      time: gl.getUniformLocation(this.postProg, "uTime"),
      vignette: gl.getUniformLocation(this.postProg, "uVignette"),
      underwater: gl.getUniformLocation(this.postProg, "uUnderwater"),
      damage: gl.getUniformLocation(this.postProg, "uDamage"),
      quality: gl.getUniformLocation(this.postProg, "uQuality"),
    });
    gl.uniform1i(locs.scene, 0);
    gl.uniform1i(locs.bloom, 1);
    gl.uniform1f(locs.exposure, 1);
    gl.uniform1f(locs.time, this.time);
    gl.uniform1f(locs.vignette, 0.45);
    gl.uniform1f(locs.underwater, underwater ? 1 : 0);
    gl.uniform1f(locs.damage, damage);
    gl.uniform1i(locs.quality, quality | 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.enable(gl.DEPTH_TEST);
  }

  applyBloom(quality) {
    const gl = this.gl;
    if (quality < 1) {
      gl.bindTexture(gl.TEXTURE_2D, this.bloomA);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFboA);
      gl.viewport(0, 0, this.bloomW, this.bloomH);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.brightFbo);
    gl.viewport(0, 0, this.fbW, this.fbH);
    gl.useProgram(this.brightProg);
    gl.bindVertexArray(this.quadVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTex);
    const bLoc = this.brightLocs || (this.brightLocs = {
      tex: gl.getUniformLocation(this.brightProg, "uScene"),
      thr: gl.getUniformLocation(this.brightProg, "uThreshold"),
    });
    gl.uniform1i(bLoc.tex, 0);
    gl.uniform1f(bLoc.thr, 0.85);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFboA);
    gl.viewport(0, 0, this.bloomW, this.bloomH);
    gl.useProgram(this.bloomProg);
    gl.bindVertexArray(this.quadVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.brightTex);
    const blLoc = this.bloomLocs || (this.bloomLocs = {
      tex: gl.getUniformLocation(this.bloomProg, "uTex"),
      dir: gl.getUniformLocation(this.bloomProg, "uDir"),
    });
    gl.uniform1i(blLoc.tex, 0);
    gl.uniform2f(blLoc.dir, 1 / this.bloomW, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFboB);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomA);
    gl.uniform2f(blLoc.dir, 0, 1 / this.bloomH);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    const tmp = this.bloomA;
    this.bloomA = this.bloomB;
    this.bloomB = tmp;
    const tmpF = this.bloomFboA;
    this.bloomFboA = this.bloomFboB;
    this.bloomFboB = tmpF;

    if (quality >= 3) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFboB);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.bloomA);
      gl.uniform2f(blLoc.dir, 1 / this.bloomW, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFboA);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.bloomB);
      gl.uniform2f(blLoc.dir, 0, 1 / this.bloomH);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }
}

function invertMat4(m) {
  const out = new Float32Array(16);
  const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
  const a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7];
  const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];
  const a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return out;
  det = 1 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}
