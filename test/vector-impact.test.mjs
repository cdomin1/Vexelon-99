import test from 'node:test';
import assert from 'node:assert/strict';
import {BoardAnimations} from '../visuals.mjs';
const clear={type:'effect',count:5,chain:2,positions:[60,61,62,63,64]};
const grid=Array.from({length:12},()=>Array(6).fill(1));
test('impact queues stay bounded during repeated chains and expire',()=>{
  const a=new BoardAnimations();
  for(let n=0;n<20;n++)a.event(clear,grid,0,0);
  assert.equal(a.rings.length,4);assert.equal(a.badges.length,3);assert.ok(a.particles.length<=160);
  const ctx={save(){},restore(){},translate(){},scale(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fillText(){}};
  a.overlay(ctx,1200,grid);assert.equal(a.rings.length,0);assert.equal(a.badges.length,0);assert.equal(a.particles.length,0);
});
test('crowded boards still announce chains and accessibility suppresses motion',()=>{
  for(const options of [{reducedMotion:true},{quality:'minimal'}]){
    const a=new BoardAnimations(options);Object.assign(a,options);a.event(clear,grid,0,0);
    assert.equal(a.rings.length,0);assert.equal(a.particles.length,0);
    const labels=[],scales=[];
    const ctx={save(){},restore(){},translate(){},scale(x){scales.push(x)},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillText(t){labels.push(t)}};
    a.overlay(ctx,100,grid);assert.deepEqual(labels,['CHAIN X2']);assert.deepEqual(scales,[1]);
  }
});
