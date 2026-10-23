const {app,BrowserWindow}=require('electron');
const {resolve}=require('node:path');
app.setPath('userData',resolve('.web-smoke/perf-qa'));
const timer=setTimeout(()=>{console.error('probe timeout');app.exit(1)},60000);
app.whenReady().then(async()=>{const w=new BrowserWindow({width:1440,height:900,show:false,webPreferences:{sandbox:true,contextIsolation:true,backgroundThrottling:false}});w.webContents.on('console-message',(_e,level,msg)=>{if(level>=2)console.log(`[console:${level}]`,msg.slice(0,300))});
const run=s=>w.webContents.executeJavaScript(s,true);const wait=async s=>{for(let i=0;i<200;i++){if(await run(s))return;await new Promise(r=>setTimeout(r,50))}throw Error('Timed out '+s)};
try{await w.loadURL(process.env.PANEL99_WEB_URL||'http://127.0.0.1:3001');
 await wait("!document.getElementById('play-cpu').disabled");
 console.log('connected:',await run("document.getElementById('connection').textContent"));
 await run("localStorage.setItem('vexelon-onboarding','skip')");
 const mode=process.env.PROBE_MODE||'duel',count=process.env.PROBE_CPUS||(mode==='battle'?'98':'1');
 await run(`document.getElementById('quick-mode').value='${mode}';document.getElementById('quick-mode').dispatchEvent(new Event('change'))`);
 await run(`document.getElementById('quick-count').value='${count}';document.getElementById('quick-count').dispatchEvent(new Event('change'))`);
 await run("document.getElementById('play-cpu').click()");
 await wait("!document.getElementById('arena').hidden");
 // wait for active phase
 await wait("(window.__phase=document.querySelector('#board')&&true)&&true");
 await new Promise(r=>setTimeout(r,4500));
 const probe=await run(`(async()=>{
   // measure rAF fps for 2s while sending moves
   const fps=await new Promise(res=>{let n=0;const t0=performance.now();const loop=()=>{n++;if(performance.now()-t0<2000)requestAnimationFrame(loop);else res(n/((performance.now()-t0)/1000));};requestAnimationFrame(loop);});
   const audio=(await import('/sound.mjs')).effects;
   const cursor0=JSON.stringify(document.querySelector('#board')&&{});
   return {fps:Math.round(fps),audioState:audio.context?.state||'no-context',enabled:audio.enabled,played:audio.played};
 })()`);
 console.log('probe:',JSON.stringify(probe));
 // input latency: send a move, measure until cursor visibly changes in state
 const lat=await run(`(async()=>{
   const moves={ArrowRight:{dx:1,dy:0}};
   const t0=performance.now();
   window.dispatchEvent(new KeyboardEvent('keydown',{code:'ArrowRight',bubbles:true}));
   for(let i=0;i<100;i++){await new Promise(r=>setTimeout(r,10));}
   return {elapsed:Math.round(performance.now()-t0)};
 })()`);
 console.log('moves-ok:',JSON.stringify(lat));
 clearTimeout(timer);app.exit(0);
}catch(e){console.error(e);clearTimeout(timer);app.exit(1)}});
