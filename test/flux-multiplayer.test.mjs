import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameServer} from '../server.mjs';
import {Board} from '../engine.mjs';
import {FLUX} from '../flux-config.mjs';

async function setup(t,{balance=FLUX,boardFactory:customBoardFactory}={}){
  const boardFactory=()=>{if(customBoardFactory)return customBoardFactory();const b=new Board(()=>.4,balance);b.grid=b.grid.map(row=>row.map(()=>0));b.grid[11]=[1,2,3,4,1,2];b.flux=100;b.receive(12,100);return b;};
  const game=createGameServer({port:0,host:'127.0.0.1',balance,boardFactory}),url=await game.listen(),sockets=[];
  t.after(async()=>{for(const ws of sockets)ws.close();await game.close();});
  async function client(){
    const ws=new WebSocket(url.replace('http:','ws:')+'/socket');sockets.push(ws);
    const messages=[];ws.addEventListener('message',event=>messages.push(JSON.parse(event.data)));
    const wait=async(type,predicate=()=>true)=>{const deadline=Date.now()+6000;while(Date.now()<deadline){const i=messages.findIndex(m=>m.type===type&&predicate(m));if(i>=0)return messages.splice(i,1)[0];await new Promise(r=>setTimeout(r,10));}throw Error(`Timed out: ${type}`);};
    const hello=await wait('hello');return {ws,hello,wait,send:msg=>ws.send(JSON.stringify(msg))};
  }
  return {game,url,client};
}
test('server ignores forged Flux, costs, duration and targets; requests are idempotent across resume',async t=>{
  const {client}=await setup(t),a=await client();assert.equal(a.hello.fluxConfig.pulse.cost,35);assert.equal(a.hello.startProtocol,1);
  a.send({type:'session',resumable:true});a.send({type:'create',mode:'duel',bots:1,quick:true});await a.wait('start');await a.wait('state',s=>s.countdown===0);
  const pulse={type:'ability',ability:'pulse',requestId:'pulse-1',flux:999,cost:0,target:'cpu',cancelled:999};
  a.send(pulse);assert.equal((await a.wait('pulse')).cancelled,6);const spent=await a.wait('state',s=>s.self.flux===65);assert.equal(spent.self.incoming[0].amount,6);
  a.ws.close();await new Promise(r=>setTimeout(r,120));
  const resumed=await client();resumed.send({type:'resume',token:'invalid'});await resumed.wait('resumeRejected');
  resumed.send({type:'resume',token:a.hello.resumeToken});assert.equal((await resumed.wait('resumed')).id,a.hello.id);await resumed.wait('start',s=>s.resumed);
  resumed.send(pulse);resumed.send({type:'move',dx:1,dy:0});const state=await resumed.wait('state',s=>s.self.cursor.x===3);
  assert.equal(state.self.flux,65);assert.equal(state.self.incoming[0].amount,6);assert.ok(state.elapsed>=spent.elapsed);assert.equal(state.players.find(p=>p.id===a.hello.id).dead,false);
  await resumed.wait('state',s=>s.self.abilities.pulse);
  resumed.send({type:'ability',ability:'pulse',requestId:'pulse-2'});await resumed.wait('state',s=>s.self.flux===30);
  resumed.send({type:'ability',ability:'shift',requestId:'shift-denied',flux:100});await resumed.wait('abilityRejected');
  resumed.send({type:'move',dx:-1,dy:0});assert.equal((await resumed.wait('state',s=>s.self.cursor.x===2&&s.self.flux===30)).self.flux,30);
});
test('Surge synchronizes as authoritative state in all four modes including 99 seats',async t=>{
  const {client}=await setup(t);
  for(const [mode,bots]of [['duel',1],['quad',3],['teams',3],['battle',98]]){
    const a=await client();a.send({type:'create',mode,bots,quick:true});await a.wait('start');let s=await a.wait('state',s=>s.countdown===0);assert.equal(s.players.length,bots+1);
    a.send({type:'ability',ability:'surge',requestId:'surge',duration:1000});await a.wait('ability',s=>s.ability==='surge');s=await a.wait('state',s=>s.self.activeAbility==='surge');
    assert.equal(s.self.flux,25);assert.ok(s.self.abilityRemaining>7&&s.self.abilityRemaining<=8);assert.equal(s.self.abilities.overdrive,false);
    a.send({type:'ability',ability:'surge',requestId:'surge-repeat'});await a.wait('abilityRejected');a.send({type:'leave'});await a.wait('left');
  }
});
test('expired resume tokens cannot recover abandoned rooms or stale ability state',async t=>{
  const balance=structuredClone(FLUX);balance.reconnectSeconds=.2;
  const {client}=await setup(t,{balance}),a=await client();a.send({type:'session',resumable:true});a.send({type:'create',bots:1,quick:true});await a.wait('start');a.ws.close();
  await new Promise(r=>setTimeout(r,350));const b=await client();b.send({type:'resume',token:a.hello.resumeToken});await b.wait('resumeRejected');
  b.send({type:'create',bots:1,quick:true});await b.wait('start');const state=await b.wait('state');assert.equal(state.self.flux,100);assert.equal(state.self.activeAbility,null);
});
test('Glitch Counter rewards originate from an authoritative clear, never a forged client event',async t=>{
  const boardFactory=()=>{const b=new Board(()=>.4);b.grid=b.grid.map(r=>r.map(()=>0));b.grid[11]=[1,1,2,1,3,4];b.grid[9][2]=b.grid[10][2]=1;b.receive(6,100);return b;};
  const {client}=await setup(t,{boardFactory}),a=await client();
  assert.equal(a.hello.fluxConfig.counter,8);
  a.send({type:'create',mode:'duel',bots:1,quick:true});await a.wait('start');await a.wait('state',s=>s.countdown===0);
  a.send({type:'counter',reward:999,flux:100});a.send({type:'move',dx:0,dy:1});a.send({type:'move',dx:0,dy:1});a.send({type:'swap'});
  const counter=await a.wait('counter');assert.equal(counter.reward,8);assert.equal(counter.cancelled,4);
  const state=await a.wait('state',s=>s.self.flux===15);assert.equal(state.self.score,50);
  assert.equal(state.self.charge,15);assert.equal(state.self.incoming[0].amount,2);
});
test('quick rematch preserves room setup and resets authoritative match state twice',async t=>{
  let boards=0;
  const boardFactory=()=>{const b=new Board(()=>.4);b.grid=b.grid.map((r,y)=>r.map((_,x)=>1+(x+y)%4));if(boards++%3===2)b.danger=1.99;return b;};
  const {client}=await setup(t,{boardFactory}),a=await client();
  a.send({type:'create',mode:'battle',bots:1,difficulty:'easy',ruleset:'rush',quick:true});
  const room=(await a.wait('lobby')).room;let previousId;
  for(let round=0;round<3;round++){
    const start=await a.wait('start');assert.notEqual(start.matchId,previousId);previousId=start.matchId;assert.equal(start.bots,1);assert.equal(start.ruleset,'rush');
    const initial=await a.wait('state',s=>s.matchId===start.matchId);assert.equal(initial.self.score,0);assert.equal(initial.self.flux,0);assert.equal(initial.self.activeAbility,null);assert.equal(initial.self.kos,0);
    await a.wait('finished');
    if(round<2){a.send({type:'rematch',quick:true});const lobby=await a.wait('lobby',s=>s.state==='waiting');assert.equal(lobby.room,room);assert.equal(lobby.botCount,1);assert.equal(lobby.difficulty,'easy');}
  }
});
