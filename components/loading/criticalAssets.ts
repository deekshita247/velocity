// Asset completion is reported by the components that actually decode/use the data.
// Only the first screen and the first gallery view gate the entrance.
export const criticalAssetIds = ['hero','logo','hero-fragments','spine','water',
 '/portfolio/c9.jpeg','/portfolio/c13.jpeg'] as const;
let completed=0;
const listeners=new Set<()=>void>();
export function markCriticalAsset(id:string){const index=criticalAssetIds.indexOf(id as typeof criticalAssetIds[number]);if(index<0)return;const next=completed|(1<<index);if(next===completed)return;completed=next;listeners.forEach(fn=>fn());}
export const subscribeCriticalAssets=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export const getCriticalSnapshot=()=>completed;
export const getServerCriticalSnapshot=()=>0;
export const criticalPercent=(snapshot:number)=>Math.round(criticalAssetIds.reduce((n,_,i)=>n+((snapshot>>i)&1),0)/criticalAssetIds.length*100);
export const criticalDownloadsReady=()=>criticalAssetIds.every((_,i)=>(completed&(1<<i))!==0);
