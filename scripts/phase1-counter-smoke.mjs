import {spawn} from 'node:child_process';
import {Board} from '../engine.mjs';
import {createGameServer} from '../server.mjs';
const boardFactory=()=>{const b=new Board(()=>.4);b.grid=b.grid.map(r=>r.map(()=>0));b.grid[11]=[1,1,2,1,3,4];b.grid[9][2]=b.grid[10][2]=1;b.receive(6,100);return b;};
const game=createGameServer({port:0,host:'127.0.0.1',boardFactory});
try{
  const url=await game.listen();
  await new Promise((resolve,reject)=>{
    const child=spawn('godot',['--headless','--path','godot','--script','res://tests/counter_smoke.gd','--','--server',url],{stdio:['ignore','pipe','pipe']});
    let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
    const timer=setTimeout(()=>{child.kill();reject(Error('Native counter timeout\n'+output));},20000);
    child.on('error',e=>{clearTimeout(timer);reject(e);});
    child.on('close',code=>{clearTimeout(timer);console.log(output.trim());if(code||/SCRIPT ERROR|ERROR:/.test(output)||!output.includes('GODOT_COUNTER_OK'))reject(Error('Native counter failed'));else resolve();});
  });
}finally{await game.close();}
