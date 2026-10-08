import test from 'node:test';
import assert from 'node:assert/strict';
import {Board} from '../engine.mjs';
import {FLUX} from '../flux-config.mjs';
import {useAbility} from '../abilities.mjs';

function blank(){const b=new Board(()=>.4);b.grid=b.grid.map(row=>row.map(()=>0));return b;}
function clear(b,count=4){b.grid[11]=Array.from({length:6},(_,x)=>x<count?1:x);b.resolve();b.tick(.43,0);}

test('Glitch Counter awards eight Flux once per clear, across partial and multiple packets',()=>{
  for(const incoming of [[1],[5],[1,1],[1,1,1,1]]){
    const b=blank();for(const amount of incoming)b.receive(amount,10);
    clear(b);assert.equal(b.flux,FLUX.combo[4]+8);
    const counter=b.events.filter(e=>e.type==='counter');assert.equal(counter.length,1);
    const blocked=Math.min(3,incoming.reduce((a,b)=>a+b,0));assert.equal(counter[0].cancelled,blocked);
    assert.equal(b.events[0].attack,3-blocked);
    assert.equal(b.incoming.reduce((n,p)=>n+p.amount,0),incoming.reduce((a,b)=>a+b,0)-blocked);
    b.tick(.01,0);assert.equal(b.flux,12);assert.equal(b.events.filter(e=>e.type==='counter').length,1);
  }
});
test('no Counter bonus for unopposed attacks, three-tile clears, raw queue operations or Pulse',()=>{
  const outgoing=blank();clear(outgoing);assert.equal(outgoing.flux,4);assert.equal(outgoing.events.some(e=>e.type==='counter'),false);
  const small=blank();small.receive(6);clear(small,3);assert.equal(small.flux,2);assert.equal(small.incoming[0].amount,6);
  const b=blank();b.flux=100;b.receive(12);const p={id:'a',board:b},room={mode:'duel',players:new Map([['a',p]])};
  assert.equal(useAbility(p,room,'pulse').cancelled,6);assert.equal(b.flux,65);assert.deepEqual(b.events,[]);
  b.cancel(2);assert.equal(b.flux,65);
});
test('Counter generation follows active Flux multipliers, clamps and remains configurable',()=>{
  for(const [ability,multiplier]of [[null,1],['surge',1.2],['overdrive',1.25]]){
    const b=blank();b.activeAbility=ability;b.abilityRemaining=10;b.receive(20);clear(b);
    assert.ok(Math.abs(b.flux-12*multiplier)<1e-8);
  }
  const capped=blank();capped.flux=98;capped.receive(10);clear(capped);assert.equal(capped.flux,100);
  const b=blank();b.balance={...FLUX,counter:3};b.receive(10);clear(b);assert.equal(b.flux,7);
});
test('ceiling timer stays two seconds even when natural or manually raised stack is saturated',()=>{
  for(const boost of [false,true]){
    const b=blank();b.grid[0][0]=1;b.rise=1;
    for(let i=0;i<39;i++)b.tick(.05,.055,boost);
    assert.equal(b.dead,false);assert.ok(b.danger<2);
    b.tick(.1,.055,boost);assert.equal(b.dead,true);
  }
});
