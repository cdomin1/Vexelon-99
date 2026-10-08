import {NEO} from './neo-vector.mjs';
import {drawVectorTile,drawGlitch,vectorText} from './vector-geometry.mjs';
import {snap,step} from './presentation-effects.mjs';
export let TILE_STYLES=Object.freeze([null,...NEO.tiles.map(tile=>({...tile,step:tile.color,tint:NEO.colors.surface}))]);
export const colors=['',...TILE_STYLES.slice(1).map(tile=>tile.color),'','#334155'];
export const PANEL_NAMES=['',...TILE_STYLES.slice(1).map(tile=>tile.name)];
export const BAYER_4=Object.freeze([0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5]);
export const ditherPixel=(x,y,density=.5)=>BAYER_4[((y&3)<<2)+(x&3)]<density*16;
export class BoardAnimations {
  constructor({reducedMotion=false,onImpact=()=>{}}={}){this.reducedMotion=reducedMotion;this.flashing=true;this.shakeScale=1;this.onImpact=onImpact;this.reset();}
  reset(){this.particles=[];this.badges=[];this.rings=[];this.drops=new Map();this.projectiles=[];this.swap=null;this.fall=null;this.lastSerial=-1;this.clearKey='';this.clearStarted=0;this.shakeUntil=0;this.lastImpact=0;this.clearFlashes=[];this.breakStarts=new Map();}
  state(self,now=performance.now()){
    if(self.blocks){const live=new Set(self.blocks.map(b=>b.id));for(const id of this.breakStarts.keys())if(!live.has(id))this.breakStarts.delete(id);}
    if(self.fallSerial!==this.lastSerial){this.lastSerial=self.fallSerial;this.fall={moves:self.falls||[],start:now};}
    const key=self.phase==='clear'?self.matches.join(',')+'/'+self.chain+'/'+self.score:'';
    if(key!==this.clearKey){this.clearKey=key;this.clearStarted=now;}
  }
  cursorAt(cursor,_now){return cursor;}
  badge(text,x,y,color,now){this.badges.push({text:text.replaceAll('×','X'),x:180,y:Math.max(18,Math.min(90,y)),color,start:now});this.badges=this.badges.slice(-3);}
  burst(positions,grid,rise,now,intensity=1){
    if(this.reducedMotion||this.quality==='minimal')return;
    if(this.quality==='reduced')positions=positions.slice(0,4);
    for(const p of positions){const y=Math.floor(p/6),x=p%6,c=grid?.[y]?.[x];
      for(let n=0;n<8;n++){const angle=n*Math.PI/4+0,speed=(120+(p%3)*30)*Math.min(1.8,intensity);this.particles.push({x:(x+.5)*60,y:(y+.5-rise)*60,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,color:colors[c>=1&&c<=4?c:1+(p%4)],size:3+(n%2)*3,start:now});}
    }
    if(this.particles.length>160)this.particles=this.particles.slice(-160);
  }
  event(event,grid,rise=0,now=performance.now()){
    if(grid){const top=grid.findIndex(row=>row.some(Boolean));this.freeTop=top<0?12:top;}
    if(event.type==='ability'){this.badge(event.ability.toUpperCase()+'!',180,330,'#00E5FF',now);this.burst([30,35,36,41],grid,rise,now);}
    if(event.type==='pulse'){this.badge(event.assist?'TEAM RESCUE!':'PULSE!',180,330,'#00E5FF',now);this.burst([0,1,2,3,4,5],grid,0,now);}
    if(event.type==='reversal')this.badge('REVERSAL!',180,50,'#00E5FF',now);
    if(event.type==='cascade')this.badge(`CASCADE X${event.chain}`,180,50,'#00E5A3',now);
    if(event.type==='counter')this.badge('GLITCH COUNTER!',180,60,'#00E5FF',now);
    if(event.type==='swap')this.swap={...event,start:now};
    if(event.type==='effect'){
      const positions=event.positions||[],x=positions.length?positions.reduce((n,p)=>n+(p%6+.5)*60,0)/positions.length:180;
      const y=positions.length?Math.min(...positions.map(p=>(Math.floor(p/6)-rise)*60))-10:360;
      this.burst(positions,grid,rise,now+50,1+Math.max(0,(event.chain||1)-1)*.16);
      if(!this.reducedMotion&&this.quality!=='minimal'&&(event.count>3||event.chain>1)){
        const cy=positions.length?positions.reduce((n,p)=>n+(Math.floor(p/6)+.5-rise)*60,0)/positions.length:360;
        this.rings.push({x,y:cy,start:now,score:event.count*10*(event.chain||1),color:event.chain>=3?'#FF3B30':event.chain>1?'#00E5A3':'#FFAE03',strength:Math.min(3,Math.max(event.chain||1,(event.count||3)/4))});this.rings=this.rings.slice(-4);
      }
      if(event.chain>1){this.badge(`CHAIN X${event.chain}${event.personality?' · '+event.personality:''}`,x,y,'#00E5A3',now);}
      else if(event.count>3)this.badge(`${event.count} COMBO!`,x,y,'#FFAE03',now);
      else this.badge(`+${event.count*10}`,x,y,'#F8F9FA',now);
    }
    if(event.type==='garbage')for(const block of event.blocks||[])this.drops.set(block.id,{start:now,impact:false});
    if(event.type==='attack'&&!this.reducedMotion)this.projectiles.push({amount:event.amount,start:now});
    if(event.type==='break')for(const block of event.blocks||[]){this.breakStarts.set(block.id,now);this.badge('BREAK!',(block.x+block.width/2)*60,(block.y-rise)*60-10,'#00E5A3',now);}
    if(event.type==='convert')this.burst(event.positions||[],grid,rise,now);
  }
  blockY(block,now){
    const drop=this.drops.get(block.id);if(!drop)return block.y;
    const t=this.reducedMotion?1:step(now-drop.start,240,7);
    if(t===1&&!drop.impact){drop.impact=true;this.shakeUntil=now+160;this.burst(Array.from({length:block.width},(_,x)=>Math.min(11,block.y+block.height-1)*6+block.x+x),null,0,now);if(now-this.lastImpact>100){this.lastImpact=now;this.onImpact(block);}}
    if(t===1)this.drops.delete(block.id);
    return -block.height+(block.y+block.height)*t*t;
  }
  overlay(context,now,grid=[],rise=0){
    this.particles=this.particles.filter(p=>now-p.start<384);
    if(!this.reducedMotion&&this.quality!=='minimal')for(const p of this.particles){
      const frame=Math.floor((now-p.start)/32);if(frame<0)continue;
      const t=frame*.032;context.fillStyle=frame<2?'#FFFFFF':p.color;
      if(frame>8&&frame%2)continue;
      const px=snap(p.x+p.vx*t),py=snap(p.y+p.vy*t+180*t*t);
      if([py,py+p.size-1].some(y=>[px,px+p.size-1].some(x=>grid[Math.floor(y/60+rise)]?.[Math.floor(x/60)])))continue;
      const tx=px-p.vx*.045,ty=py-p.vy*.045;
      if([0,.5,1].some(t=>grid[Math.floor((py+(ty-py)*t)/60+rise)]?.[Math.floor((px+(tx-px)*t)/60)]))continue;
      context.strokeStyle=p.color;context.lineWidth=1.5;context.beginPath();context.moveTo(px,py);context.lineTo(tx,ty);context.globalAlpha=Math.max(0,1-t/.384);context.stroke();context.globalAlpha=1;
    }
    this.projectiles=this.projectiles.filter(p=>now-p.start<320);
    if(!this.reducedMotion)for(const p of this.projectiles){
      const frame=Math.floor((now-p.start)/32),x=snap(330-frame*18),y=snap(18+Math.min(frame,10-frame)*6);
      context.fillStyle='#000000';context.fillRect(x,y,27,15);context.fillStyle='#FFB81C';context.fillRect(x+3,y+3,21,3);
      context.fillStyle='#38FFFF';context.fillRect(x-9,y+6,6,3);context.fillRect(x-18,y+6,3,3);
    }
    this.rings=this.rings.filter(r=>now-r.start<520);
    if(!this.reducedMotion&&this.quality!=='minimal')for(const r of this.rings){
      const t=Math.max(0,(now-r.start)/520),radius=12+Math.sqrt(t)*70*r.strength;
      context.save();context.strokeStyle=r.color;context.globalAlpha=(1-t)*.9;context.lineWidth=2;
      if(this.flashing&&this.quality!=='reduced'){context.shadowColor=r.color;context.shadowBlur=16;}
      for(let n=0;n<8;n++){const angle=n*Math.PI/4;context.beginPath();context.arc(r.x,r.y,radius,angle+.08,angle+.5);context.stroke();}
      if(this.flashing&&t<.65){
        const reach=(60+t*240)*r.strength,fade=(1-t/.65);
        context.globalAlpha=fade*.8;
        for(const width of [18,6,1.8]){context.lineWidth=width;context.strokeStyle=width===1.8?'#FFFFFF':r.color;context.beginPath();context.moveTo(r.x-reach,r.y);context.lineTo(r.x+reach,r.y);context.moveTo(r.x,r.y-reach*.65);context.lineTo(r.x,r.y+reach*.65);context.stroke();context.globalAlpha*=.6;}
      }
      const shards=this.quality==='reduced'?8:16;
      context.globalAlpha=1-t;context.strokeStyle=r.color;context.lineWidth=1.5;
      for(let n=0;n<shards;n++){
        const angle=n*Math.PI*2/shards+t*.8,travel=(18+t*100)*(1+n%3*.3),px=r.x+Math.cos(angle)*travel,py=r.y+Math.sin(angle)*travel,dx=Math.cos(angle+t*3),dy=Math.sin(angle+t*3);
        context.beginPath();context.moveTo(px+dx*8,py+dy*8);context.lineTo(px-dy*3,py+dx*3);context.lineTo(px-dx*5,py-dy*5);context.lineTo(px+dy*3,py-dx*3);context.closePath();context.stroke();
      }
      if(t<.9){context.shadowBlur=12;context.globalAlpha=1-t*.7;vectorText(context,'+'+r.score,r.x-42,r.y-t*36,32/9,'#FFFFFF');}
      context.restore();
    }
    this.badges=this.badges.filter(b=>now-b.start<1100);
    this.badges.forEach((b,index)=>{
      const t=Math.max(0,(now-b.start)/1100),motion=!this.reducedMotion&&this.quality!=='minimal';
      const scale=motion?1+.32*Math.exp(-t*10)*Math.sin(t*22):1;
      const unit=Math.min(3,320/Math.max(1,b.text.length*5.5));
      const width=Math.min(336,b.text.length*5.5*unit+24),y=18+index*38;
      context.save();context.globalAlpha=t>.72?(1-t)/.28:1;context.translate(180,y);context.scale(scale,scale);
      context.fillStyle='#000000';context.fillRect(-width/2,-4,width,32);
      context.strokeStyle=b.color;context.lineWidth=1.5;context.beginPath();context.moveTo(-width/2,21);context.lineTo(-width/2+8,29);context.lineTo(width/2-8,29);context.lineTo(width/2,21);context.stroke();
      if(this.flashing&&this.quality!=='minimal'){context.shadowColor=b.color;context.shadowBlur=18;}
      vectorText(context,b.text,-(width-24)/2,0,unit,b.color);context.restore();
    });
  }
}

function panel(context,value,x,y,cell,{mini=false,flash=false,scale=1,warning=false,now=0,reducedMotion=false,compress=false,intensity=1,tone=null,glow=true}={}){
  if(!TILE_STYLES[value]||scale<=0)return;
  context.save();context.translate(x*cell+cell/2,y*cell+cell/2);
  context.scale(scale,compress?.94:scale);
  drawVectorTile(context,value,-cell/2,-cell/2,cell,{mini,matching:flash,intensity:mini?intensity:1,tone:mini?tone:null,glow,now,reducedMotion});
  if(warning){context.strokeStyle=NEO.colors.danger;context.lineWidth=1;context.strokeRect(-cell/2+3,-cell/2+3,cell-6,cell-6);}
  context.restore();
}

export const ATTACK_STYLE=Object.freeze({base:'#334155',border:'#000000',core:'#94A3B8',red:'#FF3B30'});
function slab(context,block,y,cell,mini,now,reducedMotion=false,breakStart=now,flashing=true){
  drawGlitch(context,block.x*cell+1,y*cell+1,block.width*cell-2,block.height*cell-2,{breaking:block.state==='breaking',age:now-breakStart,reducedMotion:reducedMotion||!flashing});
}

export function drawBoard(context,grid,width,height,{rise=0,matches=[],cursor=null,danger=false,critical=false,mini=false,miniIntensity=NEO.opponents.activeIntensity,miniTone=null,extinguished=false,lessonHint=null,blocks=[],animations=null,presentation=null,activeAbility=null,reducedMotion=false,now=performance.now()}={}){
  const motionReduced=animations?.reducedMotion??reducedMotion;
  let boardOffset={x:0,y:0};
  const cell=width/6;context.clearRect(0,0,width,height);context.save();
  if(animations&&!animations.reducedMotion&&animations.shakeUntil>now){const strength=3*(animations.shakeScale??1),frame=Math.floor(now/32);boardOffset={x:snap((frame%2?1:-1)*strength),y:snap((frame%3-1)*strength)};context.translate(boardOffset.x,boardOffset.y);}
  if(presentation){const offset=presentation.offset(now);context.translate(offset.x,offset.y);boardOffset.x+=offset.x;boardOffset.y+=offset.y;}
  context.imageSmoothingEnabled=false;
  context.fillStyle=NEO.colors.background;context.fillRect(0,0,width,height);
  if(mini){context.strokeStyle=NEO.opponents.perimeterColor;context.lineWidth=1;context.strokeRect(.5,.5,width-1,height-1);}
  if(extinguished){context.restore();return;}
  if(presentation)presentation.draw(context,now,width,height,null,'back');
  context.save();if(presentation)context.translate(0,presentation.shiftOffset(now));
  const grouped=new Set();for(const block of blocks)for(let y=block.y;y<block.y+block.height;y++)for(let x=block.x;x<block.x+block.width;x++)grouped.add(y*6+x);
  const swap=animations&&!animations.reducedMotion&&animations.swap&&now-animations.swap.start<128?animations.swap:null;
  const fall=animations&&!animations.reducedMotion&&animations.fall&&now-animations.fall.start<160?animations.fall:null;
  const falling=new Map((fall?.moves||[]).filter(move=>grid[move.to]?.[move.x]===move.value).map(move=>[move.to*6+move.x,move]));
  for(let y=0;y<12;y++)for(let x=0;x<6;x++){
    const value=grid[y][x],p=y*6+x;if(!value||grouped.has(p)||(swap&&y===swap.y&&(x===swap.x||x===swap.x+1)))continue;
    const move=falling.get(p);let dy=y;
    if(move)dy=move.from+(move.to-move.from)*Math.min(1,Math.max(0,(now-fall.start)/160));
    const order=matches.indexOf(p),flashFrame=Math.floor((now-(animations?.clearStarted??now))/32);
    panel(context,value,x,dy-rise,cell,{mini,intensity:miniIntensity,tone:miniTone,glow:presentation?.quality!=='minimal',flash:order>=0&&flashFrame<4&&flashFrame%2===0&&!motionReduced&&(animations?.flashing??true),compress:order>=0&&flashFrame===3&&!motionReduced,warning:y<3,now,reducedMotion:motionReduced||animations?.flashing===false});
  }
  if(swap){const t=Math.min(1,Math.max(0,(now-swap.start)/128));panel(context,swap.left,swap.x+t,swap.y-rise,cell,{warning:swap.y<3,now});panel(context,swap.right,swap.x+1-t,swap.y-rise,cell,{warning:swap.y<3,now});}
  for(const block of blocks)slab(context,block,(animations?animations.blockY(block,now):block.y)-rise,cell,mini,now,motionReduced,animations?.breakStarts.get(block.id)??(now-360),animations?.flashing??true);
  context.restore();
  if(animations)animations.overlay(context,now,grid,rise);if(presentation)presentation.draw(context,now,width,height,activeAbility,'front');context.restore();
  if(danger&&!mini){context.strokeStyle=critical?NEO.colors.critical:NEO.colors.danger;context.lineWidth=2;context.beginPath();context.moveTo(2,2);context.lineTo(width-2,2);context.stroke();}
  if(lessonHint){context.strokeStyle=NEO.colors.target;context.lineWidth=2;context.beginPath();context.moveTo(lessonHint.x*cell+8,(lessonHint.y+1-rise)*cell-6);context.lineTo((lessonHint.x+2)*cell-8,(lessonHint.y+1-rise)*cell-6);context.stroke();}
  if(cursor)drawSelector(context,cursor,width,height,{rise,now,offset:boardOffset,animated:!motionReduced&&!presentation?.reducedMotion&&animations?.flashing!==false&&presentation?.flashing!=='reduced'});
}

// Filled pixel strips keep every edge crisp; the selected tile interiors stay clear.
export function drawSelector(ctx,cursor,width,height,{rise=0,now=0,animated=true,offset={x:0,y:0}}={}){
  const cell=width/6,w=Math.round(cell*2);
  const x=Math.max(0,Math.min(width-w,Math.round(cursor.x*cell+offset.x)));
  const top=Math.round((cursor.y-rise)*cell+offset.y),y=Math.max(0,top);
  const h=Math.min(height,top+Math.round(cell))-y;
  if(h<=0)return;
  const outer=Math.min(Math.max(1,Math.round(cell*NEO.lines.selectorOuter/60)),Math.max(1,Math.floor(h/3)));
  const inset=Math.min(Math.max(1,Math.round(cell*2/60)),Math.floor(h/6));
  const bright=Math.min(Math.max(1,Math.round(cell*NEO.lines.selectorInner/60)),Math.max(1,outer-inset));
  function border(px,py,pw,ph,t,color){ctx.fillStyle=color;ctx.fillRect(px,py,pw,t);ctx.fillRect(px,py+ph-t,pw,t);if(ph>2*t){ctx.fillRect(px,py+t,t,ph-2*t);ctx.fillRect(px+pw-t,py+t,t,ph-2*t);}}
  ctx.save();ctx.shadowBlur=0;
  border(x,y,w,h,outer,NEO.colors.background);
  border(x+inset,y+inset,w-inset*2,h-inset*2,bright,animated?`rgb(${Math.round(236+19*(.5+.5*Math.sin(now/1000*Math.PI*2)))},250,255)`:'#ECFAFF');
  ctx.restore();
}
