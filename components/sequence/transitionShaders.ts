import { referenceShaders } from "../gallery/effects/referenceShaders";
export const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export const fragment=`
uniform sampler2D picture;uniform sampler2D previousPicture;uniform float progress;uniform float technique;varying vec2 vUv;
${referenceShaders["rgbshift.fs"]}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 sampleImage(vec2 uv){return texture2D(picture,clamp(uv,.001,.999)).rgb;}
void main(){
 float t=clamp(progress,0.,1.);float pulse=sin(t*3.14159265);vec2 uv=vUv;vec3 color=sampleImage(uv);
 if(technique<.5){
  // Braking point: sheared outgoing surface and separated chromatic wipe.
  float wipe=smoothstep(t-.09,t+.09,uv.x);
  vec2 outgoing=uv+vec2(t*.23+(uv.y-.5)*pulse*.25,0.);
  vec2 incoming=uv-vec2((1.-t)*.2,0.);
  color=mix(getRGB(picture,incoming,0.,pulse*.023).rgb,getRGB(previousPicture,outgoing,0.,pulse*.032).rgb,wipe);
 }else if(technique<1.5){
  // Lights out: radial bulge expands from the optical center.
  vec2 d=uv-.5;float r=length(d);vec2 bulge=.5+d/(1.+pulse*1.6*(1.-smoothstep(0.,.8,r)));
  float reveal=1.-smoothstep(t*.95-.1,t*.95+.1,r);
  color=mix(texture2D(previousPicture,uv).rgb,sampleImage(bulge),reveal);
 }else if(technique<2.5){color=sampleImage(uv);
 }else if(technique<3.5){
  // Slipstream: vertical stretch and multi-tap directional smear.
  vec2 stretched=vec2(uv.x,.5+(uv.y-.5)/(1.+pulse*1.8));color=vec3(0.);
  for(int i=-3;i<=3;i++){vec2 tap=clamp(stretched+vec2(0.,float(i)*pulse*.027),.001,.999);color+=mix(texture2D(previousPicture,tap).rgb,sampleImage(tap),t)/7.;}
 }else if(technique<4.5){
  // Pit window: discontinuous pixel cells dissolve through a seeded noise mask.
  vec2 cell=floor(uv*vec2(72.,48.));float n=hash(cell);float mask=smoothstep(n-.04,n+.04,t);
  vec2 coarse=(floor(uv*vec2(72.,48.))+.5)/vec2(72.,48.);
  vec3 broken=texture2D(previousPicture,clamp(coarse+vec2(0.,pulse*(n-.5)*.18),.001,.999)).rgb*(.3+.7*n);
  color=mix(broken,sampleImage(uv),mask);
 }else{
  // Night stint: warped UV front, with the reference RGB refraction pattern.
  float wave=sin(uv.y*15.+t*7.)*.06+sin(uv.x*21.-t*9.)*.035;
  vec2 flow=vec2(wave,cos(uv.x*12.+t*8.)*.025)*pulse;
  float reveal=smoothstep(uv.x+wave-.16,uv.x+wave+.16,t*1.25);
  color=mix(texture2D(previousPicture,clamp(uv+flow*1.8,.001,.999)).rgb*(.6+.4*t),getRGB(picture,uv+flow,1.1,pulse*.012).rgb,reveal);
 }
 if(t>.999)color=sampleImage(uv);
 gl_FragColor=vec4(color,1.);
 #include <colorspace_fragment>
}`;
