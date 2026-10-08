import {spawn} from 'node:child_process';
import {createGameServer} from '../server.mjs';
const game=createGameServer({port:0,host:'127.0.0.1',training:true});
try{
  const url=await game.listen();
  await new Promise((resolve,reject)=>{
    const child=spawn('godot',['--headless','--path','godot','--script','res://tests/combat_smoke.gd','--','--server',url],{stdio:['ignore','pipe','pipe']});
    let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
    const timer=setTimeout(()=>{child.kill();reject(Error('Native combat timeout\n'+output));},30000);
    child.on('error',e=>{clearTimeout(timer);reject(e);});
    child.on('close',code=>{clearTimeout(timer);console.log(output.trim());if(code||/SCRIPT ERROR|ERROR:/.test(output)||!output.includes('GODOT_COMBAT_OK'))reject(Error('Native combat failed'));else resolve();});
  });
}finally{await game.close();}
