// Asset completion is reported by the components that actually decode/use the data.
export const criticalAssetIds = ['hero','hero-fragments','spine','particles','water',
 '/portfolio/c9.jpeg','/portfolio/c13.jpeg','/portfolio/c3.jpg','/portfolio/c6.jpeg','/portfolio/c17.jpeg','/portfolio/c7.jpeg','scene'] as const;
let completed=0;
const listeners=new Set<()=>void>();
export function markCriticalAsset(id:string){const index=criticalAssetIds.indexOf(id as typeof criticalAssetIds[number]);if(index<0)return;const next=completed|(1<<index);if(next===completed)return;completed=next;listeners.forEach(fn=>fn());}
export const subscribeCriticalAssets=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export const getCriticalSnapshot=()=>completed;
export const getServerCriticalSnapshot=()=>0;
export const criticalPercent=(snapshot:number)=>Math.round(criticalAssetIds.reduce((n,_,i)=>n+((snapshot>>i)&1),0)/criticalAssetIds.length*100);
export const criticalDownloadsReady=()=>criticalAssetIds.slice(0,-1).every((_,i)=>(completed&(1<<i))!==0);
