import {spawn} from 'node:child_process';
import {Board} from '../engine.mjs';
import {createGameServer} from '../server.mjs';
let boards=0;
// Each start constructs the common seed, host, then CPU. Only the CPU begins
// near its normal danger deadline; no production command mutates test state.
const boardFactory=()=>{const b=new Board(()=>.4);b.grid=b.grid.map((row,y)=>row.map((_,x)=>1+(x+y)%4));if(boards++%3===2)b.danger=1.99;return b;};
const game=createGameServer({port:0,host:'127.0.0.1',boardFactory});
try{
 const url=await game.listen();
 await new Promise((resolve,reject)=>{
  const child=spawn('godot',['--headless','--path','godot','--script','res://tests/rematch_smoke.gd','--','--server',url],{stdio:['ignore','pipe','pipe']});let output='';
  child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
  const timer=setTimeout(()=>{child.kill();reject(Error('Rematch timeout\n'+output));},45000);
  child.on('error',e=>{clearTimeout(timer);reject(e)});
  child.on('close',code=>{clearTimeout(timer);console.log(output.trim());if(code||/SCRIPT ERROR|ERROR:/.test(output)||!output.includes('GODOT_REMATCH_OK'))reject(Error('Native rematch failed'));else resolve()});
 });
}finally{await game.close();}
