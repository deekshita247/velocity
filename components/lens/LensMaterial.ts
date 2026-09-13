// Local optical shader: the DOM moves the lens, this surface refracts its crop.
export const lensVertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export const lensFragment = `
uniform sampler2D photo;uniform sampler2D normalMap;uniform vec2 resolution;uniform vec2 imageSize;uniform vec2 lens;
uniform float time;uniform float lensSize;varying vec2 vUv;
vec2 cover(vec2 uv){float a=resolution.x/resolution.y;float b=imageSize.x/imageSize.y;return (uv-.5)*vec2(min(a/b,1.),min(b/a,1.))+.5;}
float random(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
vec2 radial=(vUv-.5)*lensSize/resolution;
vec2 n=texture2D(normalMap,vUv+time*.018).rg-.5;
vec2 detail=cover(lens+radial*.66+n*.004+sin(radial.yx*42.+time*1.4)*.0015);
vec2 shift=radial*.009;vec3 zoom=vec3(texture2D(photo,detail+shift).r,texture2D(photo,detail).g,texture2D(photo,detail-shift).b);
zoom=pow(zoom,vec3(.85))*vec3(.96,1.04,1.06);zoom+=(random(gl_FragCoord.xy+floor(time*24.))-.5)*.018;
gl_FragColor=vec4(zoom,1.);}`;
