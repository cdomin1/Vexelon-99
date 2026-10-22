import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

test('live queue pools humans into an all-human battle royale and honours leaving',async t=>{
  const port=34000+Math.floor(Math.random()*10000);
  const server=spawn(process.execPath,['server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:String(port),HOST:'127.0.0.1',LIVE_WAIT:'1'},stdio:['ignore','pipe','pipe']});
  t.after(()=>server.kill('SIGTERM'));
  await Promise.race([once(server.stdout,'data'),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Server did not start')),4000))]);
  const sockets=[];
  function client(){
    const ws=new WebSocket(`ws://127.0.0.1:${port}/socket`);ws.addEventListener('open',()=>ws.send(JSON.stringify({type:'session',combatVersion:1})),{once:true});sockets.push(ws);const messages=[];ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));
    const wait=async(type,predicate=()=>true)=>{const deadline=Date.now()+8000;while(Date.now()<deadline){const index=messages.findIndex(m=>m.type===type&&predicate(m));if(index>=0)return messages.splice(index,1)[0];await new Promise(r=>setTimeout(r,15));}throw new Error(`Timed out waiting for ${type}`);};
    return {ws,wait,send:msg=>ws.send(JSON.stringify(msg))};
  }
  t.after(()=>sockets.forEach(s=>s.close()));
  const a=client(),b=client(),c=client();
  await a.wait('hello');await b.wait('hello');await c.wait('hello');
  a.send({type:'live',name:'Solo'});
  assert.deepEqual(await a.wait('live'),{type:'live',players:1,seconds:null});
  b.send({type:'live',name:'Rival'});
  const counting=await a.wait('live',m=>m.players===2&&m.seconds!==null);assert.ok(counting.seconds<=1);
  c.send({type:'live',name:'Late'});
  await a.wait('live',m=>m.players===3);
  c.send({type:'liveLeave'});
  assert.equal((await c.wait('live',m=>m.players===0)).players,0);
  const start=await a.wait('start');assert.equal(start.total,2);assert.equal(start.humans,2);assert.equal(start.bots,0);assert.equal(start.mode,'battle');assert.equal(start.ruleset,'classic');
  const startB=await b.wait('start');assert.equal(startB.humans,2);assert.equal(startB.bots,0);
});
