import test from 'node:test';import assert from 'node:assert/strict';
import {Board} from '../engine.mjs';import {COMBAT,reversalTarget,chainPersonality} from '../combat-config.mjs';import {TrainingSession,cascadeBoard} from '../training-session.mjs';
const blank=()=>{const b=new Board(()=>.4);b.grid=b.grid.map(r=>r.map(()=>0));return b;};
function clear(b,{chain=2,count=3,origin='input'}={}){b.grid[11]=Array.from({length:6},(_,i)=>i<count?1:0);b.resolve(origin);b.chain=chain;b.tick(.43,0);return b.events.splice(0);}
test('incoming and Danger remain paused in clear, fall and grace while reversal cooldown advances',()=>{
 for(const phase of ['clear','fall','grace']){const b=blank();b.phase=phase;b.timer=1;b.grid[0][0]=1;b.danger=.9;b.receive(6);b.reversalCooldown=3;b.tick(.1,0);assert.equal(b.incoming[0].delay,4);assert.equal(b.danger,.9);assert.equal(b.reversalCooldown,2.9);}
 const b=blank();b.receive(6,.1);b.tick(.1,0);assert.equal(b.incoming.length,0);assert.equal(b.garbageBlocks.length,1);
});
test('queue remains FIFO including expired later packets; partial cancellation preserves metadata and timer',()=>{
 const b=blank();b.receive(8,2,{sourceId:'a',sourceSeat:2});b.receive(6,.1,{sourceId:'b'});b.tick(.2,0);assert.equal(b.incoming.length,2);const id=b.incoming[0].id;b.cancel(3);assert.equal(b.incoming[0].amount,5);assert.equal(b.incoming[0].delay,1.8);assert.equal(b.incoming[0].id,id);assert.equal(b.incoming[0].originalAmount,8);
});
test('Reversal boundaries, minimum return, full packet requirement, chain gate and loop prevention',()=>{
 for(const [delay,amount,chain,reflected,want] of [[1,6,2,false,3],[1.001,6,2,false,0],[0,6,2,false,3],[.5,7,2,false,0],[.5,5,2,false,0],[.5,6,1,false,0],[.5,6,2,true,0]]){const b=blank();b.receive(amount,delay,{sourceId:'a',reflected});const events=clear(b,{chain});assert.equal(events.find(e=>e.type==='reversalIntent')?.amount||0,want);assert.equal(events.filter(e=>e.type==='counter').length,chain>=2?1:0);}
});
test('Reversal takes oldest eligible packet once, caps at six and never multiplies its reward',()=>{
 const b=blank();b.activeAbility='overdrive';b.abilityRemaining=10;b.receive(12,.5,{sourceId:'first'});b.receive(6,.5,{sourceId:'second'});const e=clear(b,{chain:4,count:6});assert.deepEqual(e.filter(e=>e.type==='reversalIntent').map(e=>[e.sourceId,e.amount]),[['first',6]]);assert.equal(b.reversalCooldown,8);assert.equal(e.filter(e=>e.type==='counter').length,1);assert.equal(b.flux,(10+22+8)*1.25);
 b.receive(6,.5,{sourceId:'again'});assert.ok(!clear(b).some(e=>e.type==='reversalIntent'));
});
test('Pulse/raw cancel cannot reverse; a previous partial reduction uses remaining units',()=>{
 const b=blank();b.receive(12,.5,{sourceId:'a'});b.cancel(6);assert.equal(b.reversalCooldown,0);assert.equal(b.events.length,0);assert.equal(clear(b).find(e=>e.type==='reversalIntent').amount,3);
});
test('invalid Reversal source never retargets, including dead, disconnected and friendly participants',()=>{
 const p={id:'p',team:'a',board:blank()},source={id:'s',team:'b',board:blank(),socket:{writable:true}},room={mode:'teams',players:new Map([['p',p],['s',source]])};
 assert.equal(reversalTarget(p,room,'s'),source);for(const edit of [{disconnectedAt:1},{team:'a'},{socket:null}]){const saved={...source};Object.assign(source,edit);assert.equal(reversalTarget(p,room,'s'),null);Object.assign(source,saved);}source.board.dead=true;assert.equal(reversalTarget(p,room,'s'),null);assert.equal(reversalTarget(p,room,'missing'),null);
});
test('Cascade requires actual fall provenance, fires once per chain and adds no rewards',()=>{
 const b=cascadeBoard();b.swap();for(let i=0;i<50;i++)b.tick(.05,0);assert.equal(b.events.filter(e=>e.type==='cascade').length,1);const clears=b.events.filter(e=>e.type==='clear');assert.deepEqual(clears.map(e=>e.chain),[1,2,3]);assert.equal(b.score,clears.reduce((n,e)=>n+e.count*10*e.chain,0));
 const input=blank();assert.ok(!clear(input,{chain:3,origin:'input'}).some(e=>e.type==='cascade'));const conversion=blank();assert.ok(!clear(conversion,{chain:3,origin:'conversion'}).some(e=>e.type==='cascade'));
});
test('personality tiers do not split or change normal attack budgets',()=>{
 for(const chain of [2,3,4,5,6,8]){const b=blank();const e=clear(b,{chain}).find(e=>e.type==='clear');assert.equal(e.attack,(chain-1)*6);assert.equal(e.personality,chainPersonality(chain));}assert.equal(COMBAT.phase,2);
});
test('advanced lessons require real actions and support restart; Practice scenarios remain isolated',()=>{
 for(const lesson of [7,8,9]){const messages=[],s=new TrainingSession({mode:'tutorial',lesson,emit:e=>messages.push(e)});assert.equal(s.done,false);s.handle({type:'swap'});for(let i=0;i<50;i++)s.tick(.05);if(lesson===7){assert.equal(s.done,false);s.handle({type:'swap'});for(let i=0;i<50;i++)s.tick(.05)}assert.equal(s.done,true,`lesson ${lesson}`);s.handle({type:'trainingControl',action:'restart'});assert.equal(s.done,false);}
 const p=new TrainingSession();p.handle({type:'trainingControl',action:'reversal'});assert.equal(p.player.board.incoming[0].sourceId,'training-rival');const competitive=blank();assert.equal(competitive.incoming.length,0);assert.equal(competitive.flux,0);
});

test('advanced lessons allow reading before the first swap without expiring the counter window',()=>{
 for(const lesson of [7,8]){const t=new TrainingSession({mode:'tutorial',lesson});const delay=t.player.board.incoming[0].delay;for(let i=0;i<200;i++)t.tick(.1);assert.equal(t.player.board.incoming[0].delay,delay);t.handle({type:'swap'});for(let i=0;i<50;i++)t.tick(.1);assert.ok(t.actions.has('swap'));}
});
test('web queue HUD elements referenced by the renderer exist exactly once',async()=>{
 const {readFile}=await import('node:fs/promises');const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 for(const id of ['incoming-queue','reversal-status'])assert.equal(html.split(`id="${id}"`).length-1,1);
});
