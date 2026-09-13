"use client";
import Image from "next/image";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { useInView } from "framer-motion";
import * as T from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";
import { raceImage } from "../racing/raceData";

const noise=`float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
vec3 curl(vec3 p){float e=.07;float dx=(noise(p+vec3(e,0,0))-noise(p-vec3(e,0,0)))/(2.*e);float dy=(noise(p+vec3(0,e,0))-noise(p-vec3(0,e,0)))/(2.*e);float dz=(noise(p+vec3(0,0,e))-noise(p-vec3(0,0,e)))/(2.*e);return vec3(dy-dz,dz-dx,dx-dy);}`;
const velocityShader=`uniform sampler2D rest;uniform float dt,time,turbulence;uniform vec2 mouse;${noise}
void main(){vec2 uv=gl_FragCoord.xy/resolution.xy;vec3 p=texture2D(texturePosition,uv).xyz;vec3 v=texture2D(textureVelocity,uv).xyz;vec3 base=texture2D(rest,uv).xyz;
vec2 d=p.xy-mouse;float local=exp(-dot(d,d)*7.);vec3 force=vec3(0.);if(turbulence>.005)force=curl(p*2.+time*.15)*turbulence*(.35+local*3.);
force.xy+=normalize(d+vec2(.001))*local*turbulence*2.;force+=(base-p)*mix(12.,4.,turbulence);v=(v+force*dt)*exp(-4.*dt);gl_FragColor=vec4(v,1.);}`;
const positionShader=`uniform float dt;void main(){vec2 uv=gl_FragCoord.xy/resolution.xy;vec3 p=texture2D(texturePosition,uv).xyz;vec3 v=texture2D(textureVelocity,uv).xyz;gl_FragColor=vec4(p+v*dt,1.);}`;
class ParticleSimulation {
 readonly gpu:GPUComputationRenderer;readonly position;readonly velocity;readonly geometry=new T.BufferGeometry();private amount=0;
 constructor(gl:T.WebGLRenderer,readonly resolution:number){
  this.gpu=new GPUComputationRenderer(resolution,resolution,gl);this.gpu.setDataType(T.HalfFloatType);
  const rest=this.gpu.createTexture(),zero=this.gpu.createTexture();const data=rest.image.data as Float32Array;const lookup=new Float32Array(resolution*resolution*2);
  for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){const i=y*resolution+x;const u=(x+.5)/resolution,v=(y+.5)/resolution;data[i*4]=u*2-1;data[i*4+1]=v*2-1;data[i*4+3]=1;lookup[i*2]=u;lookup[i*2+1]=v;}
  this.position=this.gpu.addVariable("texturePosition",positionShader,rest);this.velocity=this.gpu.addVariable("textureVelocity",velocityShader,zero);
  for(const variable of [this.position,this.velocity]){this.gpu.setVariableDependencies(variable,[this.position,this.velocity]);variable.material.uniforms.dt={value:0};}
  Object.assign(this.velocity.material.uniforms,{rest:{value:rest},time:{value:0},turbulence:{value:0},mouse:{value:new T.Vector2()}});
  const error=this.gpu.init();if(error){this.gpu.dispose();throw Error(error);}
  this.geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(resolution*resolution*3),3));this.geometry.setAttribute('lookup',new T.BufferAttribute(lookup,2));
 }
 step(delta:number,time:number,input:{x:number;y:number;active:number}){const dt=Math.min(delta,.033);this.amount=T.MathUtils.damp(this.amount,input.active,4,dt);this.position.material.uniforms.dt.value=dt;const u=this.velocity.material.uniforms;u.dt.value=dt;u.time.value=time;u.turbulence.value=this.amount;u.mouse.value.set(input.x,input.y);this.gpu.compute();}
 get texture(){return this.gpu.getCurrentRenderTarget(this.position).texture;}
 dispose(){this.gpu.dispose();this.geometry.dispose();}
}
function Particles({input}:{input:React.RefObject<{x:number;y:number;active:number}>}){
 const gl=useThree(s=>s.gl);const mobile=useThree(s=>s.size.width<768);const simulation=useMemo(()=>new ParticleSimulation(gl,mobile?128:256),[gl,mobile]);
 const photo=useTexture(raceImage,t=>{t.colorSpace=T.SRGBColorSpace});const material=useRef<T.ShaderMaterial>(null);
 useEffect(()=>()=>simulation.dispose(),[simulation]);
 const uniforms=useMemo(()=>({positions:{value:simulation.texture},picture:{value:photo},pointSize:{value:3},aspect:{value:1}}),[simulation,photo]);
 useFrame(({clock,size},dt)=>{simulation.step(dt,clock.elapsedTime,input.current);if(material.current){material.current.uniforms.positions.value=simulation.texture;material.current.uniforms.pointSize.value=Math.max(size.width,size.height)/simulation.resolution*gl.getPixelRatio()*1.5;material.current.uniforms.aspect.value=size.width/size.height;}});
 return <points geometry={simulation.geometry} frustumCulled={false} name="after-dark-gpgpu"><shaderMaterial ref={material} uniforms={uniforms} depthTest={false} transparent vertexShader={`attribute vec2 lookup;uniform sampler2D positions;uniform float pointSize;varying vec2 imageUV;void main(){vec3 p=texture2D(positions,lookup).xyz;imageUV=lookup;gl_Position=vec4(p.xy/(1.+max(-.5,p.z)*.25),0.,1.);gl_PointSize=pointSize;}`} fragmentShader={`uniform sampler2D picture;uniform float aspect;varying vec2 imageUV;void main(){if(length(gl_PointCoord-.5)>.5)discard;float a=aspect/(10./7.);vec2 uv=(imageUV-.5)*vec2(min(a,1.),min(1./a,1.))+.5;gl_FragColor=vec4(texture2D(picture,uv).rgb,1.);
 #include <colorspace_fragment>
 }`}/></points>;
}
export function ParticleImage({active}:{active:boolean}){
 const ref=useRef<HTMLDivElement>(null);const input=useRef({x:0,y:0,active:0});const visible=useInView(ref,{margin:"40px"});const loaded=useInView(ref,{once:true,margin:"200px"});
 return <div ref={ref} className="full-image-effect particle-image" data-effect="gpgpu-particles" onPointerEnter={()=>{input.current.active=1}} onPointerLeave={()=>{input.current.active=0}} onPointerDown={e=>{input.current.active=1;e.currentTarget.setPointerCapture(e.pointerId)}} onPointerUp={()=>{input.current.active=0}} onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();input.current.x=(e.clientX-r.left)/r.width*2-1;input.current.y=1-(e.clientY-r.top)/r.height*2;}}>
  <Image src={raceImage} alt="AFTER DARK — disrupt the photograph into particles" fill sizes="(max-width:767px) 92vw, 70vw" style={{objectFit:"cover",opacity:.12}}/>
  {loaded&&<div className="full-image-canvas"><Canvas dpr={[1,1.25]} frameloop={active&&visible?'always':'never'} gl={{antialias:false,alpha:true}}><Suspense fallback={null}><Particles input={input}/></Suspense></Canvas></div>}
 </div>;
}
