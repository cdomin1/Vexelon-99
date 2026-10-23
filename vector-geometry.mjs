import {NEO} from './neo-vector.mjs';
// Normalized geometry shared with the native renderer. No gameplay state mutation.
export function tilePaths(value){return NEO.geometry[NEO.tiles[value-1]?.geometry]||[];}
// Per-tile glow is baked once per device size; frames composite the halo layer instead of shadowBlur strokes.
const sprites=new Map();
function tileSprite(value,matching,px){
  const key=`${value}:${matching?1:0}:${px}`;let sprite=sprites.get(key);if(sprite)return sprite;
  const tile=NEO.tiles[value-1],color=matching?NEO.colors.neutral:tile.color;
  const bleed=Math.ceil(px*.4),size=px,w=size+bleed*2;
  const line=Math.max(1.2,size/60*(value===3?2.8:2)),pad=size*.12,extent=size-pad*2;
  const halo=document.createElement('canvas');halo.width=halo.height=w;
  const hc=halo.getContext('2d');hc.translate(bleed,bleed);hc.lineJoin='round';hc.lineCap='round';hc.strokeStyle=color;hc.shadowColor=color;
  for(const {points}of tilePaths(value)){hc.beginPath();points.forEach(([qx,qy],i)=>i?hc.lineTo(pad+qx*extent,pad+qy*extent):hc.moveTo(pad+qx*extent,pad+qy*extent));
    for(const pass of NEO.phosphor.halo){hc.lineWidth=line+pass.spread*size/60;hc.globalAlpha=pass.alpha*NEO.phosphor.high;hc.shadowBlur=size*.04*NEO.phosphor.high;hc.stroke();}}
  const core=document.createElement('canvas');core.width=core.height=w;
  const cc=core.getContext('2d');cc.translate(bleed,bleed);cc.fillStyle=NEO.colors.background;cc.fillRect(2,2,size-4,size-4);cc.lineJoin='round';cc.lineCap='round';
  for(const {points}of tilePaths(value)){cc.beginPath();points.forEach(([qx,qy],i)=>i?cc.lineTo(pad+qx*extent,pad+qy*extent):cc.moveTo(pad+qx*extent,pad+qy*extent));cc.globalAlpha=1;cc.lineWidth=line;cc.strokeStyle=color;cc.stroke();cc.lineWidth=NEO.phosphor.core*size/60;cc.globalAlpha=NEO.phosphor.coreAlpha;cc.strokeStyle=NEO.colors.neutral;cc.stroke();}
  sprite={core,halo,bleed,size};sprites.set(key,sprite);return sprite;
}
export function drawVectorTile(ctx,value,x,y,size,{intensity=1,matching=false,mini=false,tone=null,glow=true,now=0,reducedMotion=false,pixelScale=0}={}){
  const tile=NEO.tiles[value-1];if(!tile)return;
  if(glow&&!mini&&pixelScale>0&&typeof document!=='undefined'){
    const sprite=tileSprite(value,matching,Math.round(size*pixelScale));
    const bleedL=sprite.bleed/pixelScale,w=(sprite.size+sprite.bleed*2)/pixelScale;
    const pulse=reducedMotion?NEO.phosphor.low:NEO.phosphor.low+(NEO.phosphor.high-NEO.phosphor.low)*(.5-.5*Math.cos(now/NEO.phosphor.periodMs*Math.PI*2));
    ctx.save();ctx.globalAlpha=intensity;ctx.drawImage(sprite.core,x-bleedL,y-bleedL,w,w);ctx.globalAlpha=intensity*Math.min(1,pulse/NEO.phosphor.high);ctx.drawImage(sprite.halo,x-bleedL,y-bleedL,w,w);ctx.restore();
    return;
  }
  ctx.save();ctx.translate(x,y);
  ctx.fillStyle=NEO.colors.background;ctx.fillRect(2,2,size-4,size-4);
  const color=matching?NEO.colors.neutral:(tone||tile.color);
  ctx.globalAlpha=intensity;ctx.strokeStyle=color;
  const line=Math.max(mini?1:1.2,size/60*(value===3?2.8:2));
  ctx.lineJoin='round';ctx.lineCap='round';
  const pulse=reducedMotion?NEO.phosphor.low:NEO.phosphor.low+(NEO.phosphor.high-NEO.phosphor.low)*(.5-.5*Math.cos(now/NEO.phosphor.periodMs*Math.PI*2));
  const pad=size*.12,extent=size-pad*2;
  for(const [index,{points}]of tilePaths(value).entries()){
    if(mini&&intensity<.5&&index>0&&tile.geometry!=='chevrons')continue;
    ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(pad+px*extent,pad+py*extent):ctx.moveTo(pad+px*extent,pad+py*extent));
    if(!mini&&glow)for(const pass of NEO.phosphor.halo){ctx.lineWidth=line+pass.spread*size/60;ctx.globalAlpha=intensity*pass.alpha*pulse;ctx.shadowColor=color;ctx.shadowBlur=size*.04*pulse;ctx.stroke();}
    ctx.shadowBlur=0;ctx.globalAlpha=intensity;ctx.lineWidth=line;ctx.strokeStyle=color;ctx.stroke();
    if(!mini&&glow){ctx.lineWidth=NEO.phosphor.core*size/60;ctx.globalAlpha=intensity*NEO.phosphor.coreAlpha;ctx.strokeStyle=NEO.colors.neutral;ctx.stroke();ctx.strokeStyle=color;}
  }
  ctx.restore();
}

export function glitchPaths(width,height,{breaking=false,age=0,reducedMotion=false}={}){
  const offset=breaking&&!reducedMotion?Math.min(4,Math.floor(Math.max(0,age)/64)):0;
  const paths=[{color:NEO.colors.incoming,points:[[2,2],[width-2,2],[width-2,height-2],[2,height-2],[2,2]]}];
  for(let x=12;x<width-12;x+=30){
    paths.push({color:NEO.colors.incoming,points:[[x,7],[x+7,14],[x+14,7]]});
    const middle=Math.max(18,height/2);
    paths.push({color:NEO.colors.flux,points:[[x,20],[x+offset,Math.min(height-5,middle-5)],[x+12+offset,middle],[x+12,height-5]]});
  }
  if(breaking)for(let x=20;x<width-10;x+=40)paths.push({color:NEO.colors.neutral,points:[[x,4],[x+8+offset,height*.35],[x-4,height*.6],[x+12+offset,height-4]]});
  return paths;
}
export function drawGlitch(ctx,x,y,width,height,options={}){
  ctx.save();ctx.translate(x,y);ctx.fillStyle=NEO.colors.surface;ctx.fillRect(0,0,width,height);
  for(const path of glitchPaths(width,height,options)){
    ctx.strokeStyle=path.color;ctx.globalAlpha=path.color===NEO.colors.flux?.6:1;ctx.lineWidth=path.color===NEO.colors.incoming?2:1.2;
    ctx.beginPath();path.points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.stroke();
  }
  ctx.restore();
}

// Legacy call signature retained; all gameplay/event text uses the official UI family.
export function vectorText(ctx,text,x,y,unit=3,color=NEO.colors.neutral){
  ctx.save();ctx.fillStyle=color;ctx.font=`${NEO.typography.bold} ${unit*9}px "${NEO.typography.family}", monospace`;ctx.textBaseline='top';ctx.fillText(text,x,y);ctx.restore();
}
