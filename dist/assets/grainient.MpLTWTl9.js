import{r as p,j as H}from"./vendor-react.DgFKySyv.js";import{R as J,P as K,M as Q}from"./Mesh.uU8OXhrh.js";import{T as Y}from"./Triangle.DvAgNkJ_.js";const g=l=>{const u=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(l);return u?[Number.parseInt(u[1],16)/255,Number.parseInt(u[2],16)/255,Number.parseInt(u[3],16)/255]:[1,1,1]},ee=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,oe=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uTimeSpeed;
uniform float uColorBalance;
uniform float uWarpStrength;
uniform float uWarpFrequency;
uniform float uWarpSpeed;
uniform float uWarpAmplitude;
uniform float uBlendAngle;
uniform float uBlendSoftness;
uniform float uRotationAmount;
uniform float uNoiseScale;
uniform float uGrainAmount;
uniform float uGrainScale;
uniform float uGrainAnimated;
uniform float uContrast;
uniform float uGamma;
uniform float uSaturation;
uniform vec2 uCenterOffset;
uniform float uZoom;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;
#define S(a,b,t) smoothstep(a,b,t)
mat2 Rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);} 
vec2 hash(vec2 p){p=vec2(dot(p,vec2(2127.1,81.17)),dot(p,vec2(1269.5,283.37)));return fract(sin(p)*43758.5453);} 
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);float n=mix(mix(dot(-1.0+2.0*hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),dot(-1.0+2.0*hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),mix(dot(-1.0+2.0*hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(-1.0+2.0*hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);return 0.5+0.5*n;}
void mainImage(out vec4 o, vec2 C){
  float t=iTime*uTimeSpeed;
  vec2 uv=C/iResolution.xy;
  float ratio=iResolution.x/iResolution.y;
  vec2 tuv=uv-0.5+uCenterOffset;
  tuv/=max(uZoom,0.001);

  float degree=noise(vec2(t*0.1,tuv.x*tuv.y)*uNoiseScale);
  tuv.y*=1.0/ratio;
  tuv*=Rot(radians((degree-0.5)*uRotationAmount+180.0));
  tuv.y*=ratio;

  float frequency=uWarpFrequency;
  float ws=max(uWarpStrength,0.001);
  float amplitude=uWarpAmplitude/ws;
  float warpTime=t*uWarpSpeed;
  tuv.x+=sin(tuv.y*frequency+warpTime)/amplitude;
  tuv.y+=sin(tuv.x*(frequency*1.5)+warpTime)/(amplitude*0.5);

  vec3 colLav=uColor1;
  vec3 colOrg=uColor2;
  vec3 colDark=uColor3;
  float b=uColorBalance;
  float s=max(uBlendSoftness,0.0);
  mat2 blendRot=Rot(radians(uBlendAngle));
  float blendX=(tuv*blendRot).x;
  float edge0=-0.3-b-s;
  float edge1=0.2-b+s;
  float v0=0.5-b+s;
  float v1=-0.3-b-s;
  vec3 layer1=mix(colDark,colOrg,S(edge0,edge1,blendX));
  vec3 layer2=mix(colOrg,colLav,S(edge0,edge1,blendX));
  vec3 col=mix(layer1,layer2,S(v0,v1,tuv.y));

  vec2 grainUv=uv*max(uGrainScale,0.001);
  if(uGrainAnimated>0.5){grainUv+=vec2(iTime*0.05);} 
  float grain=fract(sin(dot(grainUv,vec2(12.9898,78.233)))*43758.5453);
  col+=(grain-0.5)*uGrainAmount;

  col=(col-0.5)*uContrast+0.5;
  float luma=dot(col,vec3(0.2126,0.7152,0.0722));
  col=mix(vec3(luma),col,uSaturation);
  col=pow(max(col,0.0),vec3(1.0/max(uGamma,0.001)));
  col=clamp(col,0.0,1.0);

  o=vec4(col,1.0);
}
void main(){
  vec4 o=vec4(0.0);
  mainImage(o,gl_FragCoord.xy);
  fragColor=o;
}
`,h=new WeakMap,ne=({timeSpeed:l=.25,colorBalance:u=0,warpStrength:y=1,warpFrequency:x=5,warpSpeed:C=2,warpAmplitude:S=50,blendAngle:w=0,blendSoftness:A=.05,rotationAmount:b=500,noiseScale:R=2,grainAmount:F=.1,grainScale:W=2,grainAnimated:G=!1,contrast:B=1.5,gamma:T=1,saturation:M=1,centerX:O=0,centerY:q=0,zoom:N=.9,color1:I="#FF9FFC",color2:E="#5227FF",color3:P="#B497CF",className:z=""})=>{const s=p.useRef(null);return p.useEffect(()=>{const o=s.current;if(!o)return;const a=new J({webgl:2,alpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)}),t=a.gl,e=t.canvas;e.style.width="100%",e.style.height="100%",e.style.display="block",o.appendChild(e);const D=new Y(t),i=new K(t,{vertex:ee,fragment:oe,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uTimeSpeed:{value:.25},uColorBalance:{value:0},uWarpStrength:{value:1},uWarpFrequency:{value:5},uWarpSpeed:{value:2},uWarpAmplitude:{value:50},uBlendAngle:{value:0},uBlendSoftness:{value:.05},uRotationAmount:{value:500},uNoiseScale:{value:2},uGrainAmount:{value:.1},uGrainScale:{value:2},uGrainAnimated:{value:0},uContrast:{value:1.5},uGamma:{value:1},uSaturation:{value:1},uCenterOffset:{value:new Float32Array([0,0])},uZoom:{value:.9},uColor1:{value:new Float32Array([1,1,1])},uColor2:{value:new Float32Array([1,1,1])},uColor3:{value:new Float32Array([1,1,1])}}}),c=new Q(t,{geometry:D,program:i});h.set(o,{renderer:a,program:i,mesh:c});const k=()=>{const r=o.getBoundingClientRect(),_=Math.max(1,Math.floor(r.width)),$=Math.max(1,Math.floor(r.height));a.setSize(_,$);const V=i.uniforms.iResolution.value;V[0]=t.drawingBufferWidth,V[1]=t.drawingBufferHeight,a.render({scene:c})},L=new ResizeObserver(k);L.observe(o),k();let n=0,v=!0,f=!document.hidden;const X=performance.now(),Z=r=>{i.uniforms.iTime.value=(r-X)*.001,a.render({scene:c}),n=requestAnimationFrame(Z)},m=()=>{v&&f&&n===0&&(n=requestAnimationFrame(Z))},d=()=>{n!==0&&(cancelAnimationFrame(n),n=0)},j=new IntersectionObserver(([r])=>{v=r.isIntersecting,v?m():d()},{threshold:0});j.observe(o);const U=()=>{f=!document.hidden,f?m():d()};return document.addEventListener("visibilitychange",U),m(),()=>{d(),L.disconnect(),j.disconnect(),document.removeEventListener("visibilitychange",U),h.delete(o),e.remove()}},[]),p.useEffect(()=>{const o=s.current;if(!o)return;const a=h.get(o);if(!a)return;const{program:t}=a,e=t.uniforms;e.uTimeSpeed.value=l,e.uColorBalance.value=u,e.uWarpStrength.value=y,e.uWarpFrequency.value=x,e.uWarpSpeed.value=C,e.uWarpAmplitude.value=S,e.uBlendAngle.value=w,e.uBlendSoftness.value=A,e.uRotationAmount.value=b,e.uNoiseScale.value=R,e.uGrainAmount.value=F,e.uGrainScale.value=W,e.uGrainAnimated.value=G?1:0,e.uContrast.value=B,e.uGamma.value=T,e.uSaturation.value=M,e.uCenterOffset.value=new Float32Array([O,q]),e.uZoom.value=N,e.uColor1.value=new Float32Array(g(I)),e.uColor2.value=new Float32Array(g(E)),e.uColor3.value=new Float32Array(g(P))},[l,u,y,x,C,S,w,A,b,R,F,W,G,B,T,M,O,q,N,I,E,P]),H.jsx("div",{ref:s,className:`relative h-full w-full overflow-hidden ${z}`.trim()})};export{ne as default};
