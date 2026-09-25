import { WorldGenerator } from "../src/terrain/generator.js";
import { ChunkColumn } from "../src/world/chunk.js";
import { meshChunk } from "../src/world/mesher.js";
import { BlockId } from "../src/blocks/registry.js";

const seed = 1337;
const gen = new WorldGenerator(seed);
console.log("Generating chunk 0,0...");
const data = gen.generateChunk(0, 0, 0, { structures: true, caves: true });
console.log(`Blocks: ${data.blocks.length}, non-air: ${data.blocks.filter(b=>b!==0).length}, height avg ${data.height.reduce((a,b)=>a+b,0)/data.height.length|0}`);
const chunk = ChunkColumn.fromTransfer(data);
const tileMap = { stone:0, dirt:1, grass_top:2, grass_side:3, sand:4, water:5, glass:6 };
const neighbors = { nx: { blocks: new Uint16Array(16*16*128), sky: new Uint8Array(16*16*128).fill(15), light: new Uint8Array(16*16*128) }, px: { blocks: new Uint16Array(16*16*128), sky: new Uint8Array(16*16*128).fill(15), light: new Uint8Array(16*16*128) }, nz: { blocks: new Uint16Array(16*16*128), sky: new Uint8Array(16*16*128).fill(15), light: new Uint8Array(16*16*128) }, pz: { blocks: new Uint16Array(16*16*128), sky: new Uint8Array(16*16*128).fill(15), light: new Uint8Array(16*16*128) }, nxnz:null,nxpz:null,pxnz:null,pxpz:null };
try{
  const mesh = meshChunk(chunk, neighbors, tileMap);
  const tris = (mesh.solid ? mesh.solid.length/14/3 : 0) + (mesh.cutout?mesh.cutout.length/14/3:0);
  console.log(`Mesh OK tris ~${tris|0}`);
}catch(e){
  console.error("Mesh failed", e);
  process.exit(1);
}
console.log("Spawn search...");
const spawn = gen.findSpawn();
console.log("Spawn", spawn);
console.log("Test OK");
