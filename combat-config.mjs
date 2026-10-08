// Approved Phase 2 rules. Phase 3 remains disabled.
export const COMBAT=Object.freeze({version:1,phase:2,incomingDelay:4,urgentWindow:1,reversal:{chain:2,ratio:.5,min:3,max:6,cooldown:8},cascadeChain:3});
export const chainPersonality=chain=>chain>=6?'burst':chain>=4?'segmented':chain>=2?'rapid':'normal';
// Reversal routing never falls back to a selected or random target.
export function reversalTarget(player,room,sourceId){
 const source=room.players.get(sourceId);
 return source&&source!==player&&!source.board.dead&&!source.disconnectedAt&&(source.bot||source.socket?.writable||source.training)&&!(room.mode==='teams'&&source.team===player.team)?source:null;
}
