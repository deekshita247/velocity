"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import { markCriticalAsset } from "../../loading/criticalAssets";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

// Work flower_spine point cloud, downsampled for portfolio/device budgets.
// Top/outer/bottom spiral motion and distance-scaled points adapted from FlowerParticleShader.
const vertex=`attribute float seed; varying vec3 vColor; uniform float time;uniform float progress;uniform float dpr;
void main(){vec3 pos=position;float r=seed;
pos.x-=cos(progress*5.0+length(pos.xz)+pos.y*0.5)*0.5*smoothstep(0.0,0.5,abs(progress-0.5));
pos.z-=sin(progress*5.0+length(pos.xz)+pos.y*0.5)*0.5*smoothstep(0.0,0.5,abs(progress-0.5));
pos.x-=cos(pos.y*0.5+sin(time*0.05+r*0.5))*5.0*step(0.94,r);
pos.z-=sin(pos.y*0.5+sin(time*0.05+r*0.5))*5.0*step(0.94,r);
pos.y-=pow(progress,4.0)*2.0*pow(r,15.0);pos.y+=sin(time*0.16+r*20.0)*0.12;
vec4 mv=modelViewMatrix*vec4(pos,1.0);gl_Position=projectionMatrix*mv;
gl_PointSize=clamp(0.055*dpr*(1000.0/length(mv.xyz))*mix(0.4,1.2,r),1.0,5.0);
vColor=color*mix(1.4,2.7,r)*(1.0-smoothstep(0.88,1.0,progress)*0.25);}`;
const fragment=`varying vec3 vColor;void main(){float d=length(gl_PointCoord-0.5);if(d>0.5)discard;float halo=exp(-d*d*18.0);gl_FragColor=vec4(vColor,halo*0.65);}`;
function createParticleGeometry(source:THREE.BufferGeometry|null,mobile:boolean,tablet:boolean){if(!source)return null;const box=new THREE.Box3().setFromBufferAttribute(source.getAttribute('position') as THREE.BufferAttribute);const center=box.getCenter(new THREE.Vector3());const scale=20/Math.max(1,box.max.y-box.min.y);const input=source.getAttribute('position');const count=Math.min(input.count,mobile?2400:tablet?5000:9000);const points=new Float32Array(count*3),colors=new Float32Array(count*3),seeds=new Float32Array(count);const palette=['#5BF2E6','#955BFA','#E560D1','#955BFA','#E0EBF5'].map(c=>new THREE.Color(c));
 for(let i=0;i<count;i++){const j=Math.floor(i*input.count/count);points[i*3]=(input.getX(j)-center.x)*scale;points[i*3+1]=(input.getY(j)-center.y)*scale-4;points[i*3+2]=(input.getZ(j)-center.z)*scale;palette[i%palette.length].toArray(colors,i*3);seeds[i]=(i*0.61803398875)%1;}
 const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.BufferAttribute(points,3));result.setAttribute('color',new THREE.BufferAttribute(colors,3));result.setAttribute('seed',new THREE.BufferAttribute(seeds,1));return result;
}
export function ReferenceParticles(){
 const mobile=useThree(s=>s.size.width<768);const tablet=useThree(s=>s.size.width<1100);
 const [source,setSource]=useState<THREE.BufferGeometry|null>(null);const shader=useRef<THREE.ShaderMaterial>(null);const scroll=useScroll();
 useEffect(()=>{let cancelled=false;const loader=new DRACOLoader();
  fetch('/assets/reference/flower-spine.bin').then(r=>{if(!r.ok)throw Error('Particle asset failed');return r.arrayBuffer()}).then(buffer=>{
   const bytes=new Uint8Array(buffer);const marker=bytes.findIndex((b,i)=>b===68&&bytes[i+1]===82&&bytes[i+2]===65&&bytes[i+3]===67&&bytes[i+4]===79);
   if(marker<0)throw Error('Invalid point cloud');
   // Three r186 exposes this decoder method; @types/three omits the custom-attribute API.
   const decoder=loader as DRACOLoader & {decodeDracoFile:(buffer:ArrayBuffer,callback:(geometry:THREE.BufferGeometry)=>void,ids:Record<string,number>,types:Record<string,string>,colorSpace:string,onError:(error:unknown)=>void)=>Promise<void>};
   return decoder.decodeDracoFile(buffer.slice(marker),geometry=>{if(cancelled)geometry.dispose();else setSource(geometry);}, {position:0,color:1}, {position:'Float32Array',color:'Float32Array'}, THREE.LinearSRGBColorSpace, error=>console.error('[gallery particles]',error));
  }).catch(error=>console.error('[gallery particles]',error));
  return()=>{cancelled=true;loader.dispose();};
 },[]);
 // Retain GPU geometry identity until its source or device budget changes.
 // eslint-disable-next-line react-hooks/preserve-manual-memoization
 const geometry=useMemo(()=>createParticleGeometry(source,mobile,tablet),[source,mobile,tablet]);
 useEffect(()=>{if(geometry)markCriticalAsset("particles");},[geometry]);
 useEffect(()=>()=>{geometry?.dispose();},[geometry]);useEffect(()=>()=>{source?.dispose();},[source]);
 const uniforms=useMemo(()=>({time:{value:0},progress:{value:0},dpr:{value:1}}),[]);
 useFrame(({clock,gl})=>{if(shader.current){shader.current.uniforms.time.value=clock.elapsedTime;shader.current.uniforms.progress.value=scroll.offset;shader.current.uniforms.dpr.value=gl.getPixelRatio();}});
 return geometry?<points geometry={geometry} name="reference-flower-particles" frustumCulled={false}><shaderMaterial ref={shader} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false}/></points>:null;
}

