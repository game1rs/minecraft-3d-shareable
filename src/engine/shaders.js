export const chunkVert = `#version 300 es
precision highp float;
precision highp int;
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aUv;
layout(location=2) in float aNormal;
layout(location=3) in float aAo;
layout(location=4) in float aSky;
layout(location=5) in float aBlock;
layout(location=6) in float aTile;
layout(location=7) in float aBiome;
layout(location=8) in float aRough;
layout(location=9) in float aEmit;
layout(location=10) in float aFlag;

uniform mat4 uView;
uniform mat4 uProj;
uniform mat4 uModel;
uniform vec3 uCamPos;
uniform float uTime;
uniform float uWaterTime;
uniform vec3 uSunDir;
uniform float uFogDensity;
uniform float uExposure;

out vec2 vUv;
out vec3 vWorld;
out vec3 vNormal;
out float vAo;
out float vSky;
out float vBlock;
out float vTile;
out float vBiome;
out float vRough;
out float vEmit;
out float vFlag;
out float vDist;
out vec3 vViewDir;

void main(){
  vec3 pos = aPos;
  float tile = aTile;
  if(int(tile)==13 || int(tile)==25){
    if(aNormal==2.0){
      pos.x += sin(pos.x*0.6 + uWaterTime*1.2 + pos.z*0.4)*0.06;
      pos.z += cos(pos.z*0.6 + uWaterTime*1.0 + pos.x*0.3)*0.06;
      pos.y += sin((pos.x+pos.z)*0.5 + uWaterTime*1.4)*0.04;
    }
  }
  vec4 world = uModel * vec4(pos,1.0);
  vWorld = world.xyz;
  vUv = aUv;
  vNormal = vec3(0.0);
  if(int(aNormal)==0) vNormal = vec3(1,0,0);
  else if(int(aNormal)==1) vNormal = vec3(-1,0,0);
  else if(int(aNormal)==2) vNormal = vec3(0,1,0);
  else if(int(aNormal)==3) vNormal = vec3(0,-1,0);
  else if(int(aNormal)==4) vNormal = vec3(0,0,1);
  else vNormal = vec3(0,0,-1);
  if(int(aNormal)==6) vNormal = vec3(0,1,0);
  vAo = aAo/3.0;
  vSky = aSky/15.0;
  vBlock = aBlock/15.0;
  vTile = aTile;
  vBiome = aBiome;
  vRough = aRough;
  vEmit = aEmit;
  vFlag = aFlag;
  vec4 view = uView * world;
  vDist = length(view.xyz);
  vViewDir = normalize(uCamPos - world.xyz);
  gl_Position = uProj * view;
}
`;

export const chunkFrag = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp sampler2DArray;
uniform sampler2DArray uAtlas;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uSkyColor;
uniform vec3 uFogColor;
uniform float uTime;
uniform float uFogDensity;
uniform float uExposure;
uniform float uRain;
uniform float uWet;
uniform vec3 uCamPos;
uniform float uDayFactor;
uniform int uQuality;

in vec2 vUv;
in vec3 vWorld;
in vec3 vNormal;
in float vAo;
in float vSky;
in float vBlock;
in float vTile;
in float vBiome;
in float vRough;
in float vEmit;
in float vFlag;
in float vDist;
in vec3 vViewDir;

out vec4 outColor;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }

vec3 aces(vec3 x){
  float a=2.51; float b=0.03; float c=2.43; float d=0.59; float e=0.14;
  return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.0,1.0);
}

void main(){
  int tile = int(vTile+0.5);
  vec3 base = texture(uAtlas, vec3(vUv, float(tile))).rgb;
  if(base.r < 0.02 && base.g < 0.02 && base.b < 0.02){
    discard;
  }
  float cutout = step(0.5, mod(floor(vFlag/2.0),2.0));
  float lava = step(0.5, mod(floor(vFlag/4.0),2.0));
  float tint = step(0.5, mod(floor(vFlag/16.0),2.0));
  float metal = step(0.5, mod(floor(vFlag/32.0),2.0));
  float glass = step(0.5, mod(floor(vFlag/64.0),2.0));

  vec3 albedo = base;
  if(tint>0.5){
    vec3 grassTint = vec3(0.55,0.72,0.38);
    if(int(vBiome)==5 || int(vBiome)==6) grassTint = vec3(0.72,0.66,0.38);
    if(int(vBiome)==9 || int(vBiome)==10) grassTint = vec3(0.82,0.88,0.9);
    if(int(vBiome)==8) grassTint = vec3(0.42,0.52,0.28);
    if(int(vBiome)==15) grassTint = vec3(0.52,0.78,0.82);
    albedo *= mix(vec3(1.0), grassTint*1.25, 0.55);
  }

  float NdotL = max(dot(vNormal, normalize(uSunDir)), 0.0);
  float skyLight = max(vSky, 0.08);
  float blockLight = vBlock;
  float ao = mix(0.75,1.0,vAo);

  vec3 sun = uSunColor * NdotL * skyLight * 1.85;
  vec3 sky = uSkyColor * (0.55 + 0.45*max(dot(vNormal, vec3(0,1,0)),0.0)) * skyLight * 1.15;
  vec3 block = vec3(1.0,0.68,0.32) * blockLight * 2.4;

  vec3 ambient = albedo * 0.28 * skyLight;
  vec3 diffuse = albedo * (sun + sky + block*0.9) * ao + ambient;

  float rough = clamp(vRough,0.05,0.95);
  vec3 halfDir = normalize(normalize(uSunDir)+vViewDir);
  float specPow = mix(128.0, 8.0, rough);
  float spec = pow(max(dot(halfDir, vNormal),0.0), specPow) * (1.0-rough) * 0.25 * skyLight * step(0.1, NdotL);
  vec3 specular = uSunColor * spec * (metal>0.5? albedo : vec3(1.0));

  vec3 emissive = vec3(0.0);
  if(vEmit>0.01){
    emissive = albedo * vEmit * (1.2 + blockLight);
    if(tile==13) emissive = vec3(0.18,0.55,0.72)*0.6;
    if(lava>0.5) emissive = vec3(1.0,0.35,0.06)*1.5;
  }

  vec3 color = diffuse + specular + emissive;

  float wet = uWet * (1.0 - metal) * (1.0 - glass) * skyLight;
  color = mix(color, color*0.86 + vec3(0.08,0.12,0.16), wet*0.35);
  color += vec3(wet*0.5);

  float fog = 1.0 - exp(-vDist * uFogDensity * (0.55 + uRain*0.9));
  fog = clamp(fog,0.0,0.92);
  vec3 fogCol = mix(uFogColor, uSkyColor*0.9, 0.25 + uDayFactor*0.25);
  color = mix(color, fogCol, fog);

  float distFade = clamp(1.0 - (vDist-180.0)/120.0, 0.0,1.0);
  if(uQuality>=3) color *= distFade*0.15 + 0.85;

  color = aces(color * uExposure);
  color = pow(color, vec3(1.0/2.2));

  float alpha = 1.0;
  if(int(vTile)==13){
    alpha = 0.72 + sin(vWorld.x*0.6 + uTime*0.6)*0.04 + cos(vWorld.z*0.6 + uTime*0.5)*0.04;
    alpha = clamp(alpha,0.55,0.85);
    color = mix(color, vec3(0.18,0.55,0.68), 0.22);
    float fres = pow(1.0 - max(dot(vNormal, vViewDir),0.0), 3.0)*0.45;
    color += vec3(fres);
  }
  if(glass>0.5){
    alpha = 0.35;
  }
  if(cutout>0.5 && tile!=13){
    if(base.r+base.g+base.b < 0.15) discard;
  }

  outColor = vec4(color, alpha);
}
`;

export const skyVert = `#version 300 es
precision highp float;
precision highp int;
layout(location=0) in vec2 aPos;
out vec2 vUv;
out vec3 vDir;
uniform mat4 uInvProj;
uniform mat4 uInvView;
void main(){
  vUv = aPos*0.5+0.5;
  vec4 p = uInvProj * vec4(aPos,0.0,1.0);
  p = p / p.w;
  vec4 d = uInvView * vec4(p.xyz,0.0);
  vDir = normalize(d.xyz);
  gl_Position = vec4(aPos,0.999,1.0);
}
`;

export const skyFrag = `#version 300 es
precision highp float;
precision highp int;
in vec2 vUv;
in vec3 vDir;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform vec3 uFogColor;
uniform float uTime;
uniform float uDay;
uniform float uRain;
uniform float uCloudCover;
out vec4 outColor;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p); vec2 f=fract(p);
  float a=hash(i); float b=hash(i+vec2(1,0)); float c=hash(i+vec2(0,1)); float d=hash(i+vec2(1,1));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm(vec2 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; }
  return v;
}

void main(){
  vec3 dir = normalize(vDir);
  float sunDot = dot(dir, normalize(uSunDir));
  float horizon = pow(1.0 - max(dir.y,0.0), 3.0);
  vec3 sky = mix(uSkyTop, uSkyHorizon, horizon);
  float sun = pow(max(sunDot,0.0), 128.0)*1.8 + pow(max(sunDot,0.0), 16.0)*0.35;
  sky += uSunColor * sun * 0.9;
  vec2 cloudUv = dir.xz / (dir.y*0.6+0.6);
  cloudUv *= 1.5;
  cloudUv += uTime*0.015;
  float cloud = fbm(cloudUv*1.2);
  float cloud2 = fbm(cloudUv*2.4 + 3.1);
  float cl = smoothstep(0.45,0.75, cloud) * smoothstep(0.2,0.8, cloud2) * uCloudCover;
  cl *= (1.0 - horizon*0.6);
  sky = mix(sky, vec3(0.92,0.93,0.96), cl*0.55);
  sky = mix(sky, uFogColor*0.85, uRain*0.55);
  float stars = 0.0;
  if(uDay < 0.25 || uDay > 0.75){
    float s = hash(dir.xz*400.0);
    if(s>0.9975) stars = pow(s, 20.0)*3.0 * (1.0 - max(dir.y,0.0));
  }
  sky += vec3(stars);
  float moon = pow(max(dot(dir, -normalize(uSunDir)),0.0), 256.0)*0.6;
  sky += vec3(moon*0.35);
  outColor = vec4(sky,1.0);
}
`;

export const waterVert = `#version 300 es
precision highp float;
precision highp int;
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aUv;
uniform mat4 uView;
uniform mat4 uProj;
uniform mat4 uModel;
uniform float uTime;
out vec2 vUv;
out vec3 vWorld;
void main(){
  vec3 p=aPos;
  p.x+=sin(p.x*0.6+uTime*1.2 + p.z*0.4)*0.06;
  p.z+=cos(p.z*0.6+uTime*1.0 + p.x*0.3)*0.06;
  p.y+=sin((p.x+p.z)*0.5+uTime*1.4)*0.04;
  vec4 w=uModel*vec4(p,1.0);
  vWorld=w.xyz;
  vUv=aUv;
  gl_Position=uProj*uView*w;
}
`;

export const waterFrag = `#version 300 es
precision highp float;
precision highp int;
in vec2 vUv;
in vec3 vWorld;
uniform float uTime;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uCamPos;
out vec4 outColor;
void main(){
  float wave = sin(vWorld.x*0.8 + uTime*1.1)*0.5 + cos(vWorld.z*0.8 + uTime*0.9)*0.5;
  vec3 col = vec3(0.12+wave*0.02, 0.42+wave*0.05, 0.62+wave*0.06);
  float dist = length(vWorld - uCamPos);
  float fog = 1.0 - exp(-dist * uFogDensity*1.2);
  col = mix(col, uFogColor, clamp(fog,0.0,0.85));
  outColor = vec4(col, 0.72);
}
`;

export const postVert = `#version 300 es
precision highp float;
precision highp int;
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){
  vUv = aPos*0.5+0.5;
  gl_Position = vec4(aPos,0.0,1.0);
}
`;

export const postFrag = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uExposure;
uniform float uTime;
uniform float uVignette;
uniform float uUnderwater;
uniform float uDamage;
uniform int uQuality;
out vec4 outColor;
void main(){
  vec3 col = texture(uScene, vUv).rgb;
  vec3 bloom = texture(uBloom, vUv).rgb;
  if(uQuality>=2){
    col += bloom * 0.55;
  } else if(uQuality>=1){
    col += bloom * 0.35;
  }
  if(uUnderwater>0.5){
    float wave = sin(vUv.y*24.0 + uTime*3.0)*0.002;
    vec3 uw = texture(uScene, vUv + vec2(wave,0.0)).rgb;
    col = mix(col, uw*vec3(0.2,0.55,0.72), 0.35);
    col = mix(col, vec3(0.08,0.35,0.52), 0.25);
    float caust = sin(vUv.x*28.0 + uTime*2.0)*cos(vUv.y*22.0 + uTime*1.7)*0.5+0.5;
    col += vec3(0.1,0.35,0.45)*caust*0.18;
  }
  float vig = dot(vUv-0.5, vUv-0.5)*uVignette;
  col *= 1.0 - vig;
  if(uDamage>0.01){
    float edge = length(vUv-0.5)*1.8;
    float dmg = smoothstep(0.4,1.0,edge) * uDamage;
    col = mix(col, vec3(0.8,0.05,0.05), dmg*0.55);
  }
  outColor = vec4(col,1.0);
}
`;

export const quadVert = postVert;

export const bloomFrag = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uDir;
out vec4 outColor;
void main(){
  vec3 c = vec3(0.0);
  float w[5];
  w[0]=0.227027; w[1]=0.1945946; w[2]=0.1216216; w[3]=0.054054; w[4]=0.016216;
  c += texture(uTex, vUv).rgb * w[0];
  for(int i=1;i<5;i++){
    c += texture(uTex, vUv + uDir*float(i)).rgb * w[i];
    c += texture(uTex, vUv - uDir*float(i)).rgb * w[i];
  }
  outColor = vec4(c,1.0);
}
`;

export const brightFrag = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
in vec2 vUv;
uniform sampler2D uScene;
uniform float uThreshold;
out vec4 outColor;
void main(){
  vec3 col = texture(uScene, vUv).rgb;
  float bright = dot(col, vec3(0.2126,0.7152,0.0722));
  float t = smoothstep(uThreshold, uThreshold+0.5, bright);
  outColor = vec4(col * t,1.0);
}
`;
