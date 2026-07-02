import{r as n,j as J}from"./vendor-react.DgFKySyv.js";import{R as K,P as Q,M as V}from"./Mesh.uU8OXhrh.js";import{T as Z}from"./Triangle.DvAgNkJ_.js";const B=8,ee=i=>{const t=i.replace("#","").padEnd(6,"0"),f=parseInt(t.slice(0,2),16)/255,m=parseInt(t.slice(2,4),16)/255,c=parseInt(t.slice(4,6),16)/255;return[f,m,c]},oe=i=>{const t=(i&&i.length?i:["#FF9FFC","#5227FF"]).slice(0,B);for(t.length===1&&t.push(t[0]);t.length<B;)t.push(t[t.length-1]);const f=[];for(let c=0;c<B;c++)f.push(ee(t[c]));const m=Math.max(2,Math.min(B,i?.length??2));return{arr:f,count:m}},ne=({className:i,dpr:t,paused:f=!1,gradientColors:m,angle:c=0,noise:A=.3,blindCount:d=16,blindMinWidth:R=60,mouseDampening:M=.15,mirrorGradient:I=!1,spotlightRadius:P=.5,spotlightSoftness:O=1,spotlightOpacity:_=1,distortAmount:z=0,shineDirection:G="left",mixBlendMode:L="lighten"})=>{const N=n.useRef(null),y=n.useRef(null),w=n.useRef(null),p=n.useRef(null),F=n.useRef(null),T=n.useRef(null),E=n.useRef([0,0]),C=n.useRef(0),U=n.useRef(!0);return n.useEffect(()=>{const g=N.current;if(!g)return;const h=new K({dpr:t??(typeof window<"u"&&window.devicePixelRatio||1),alpha:!0,antialias:!0});T.current=h;const u=h.gl,l=u.canvas;l.style.width="100%",l.style.height="100%",l.style.display="block",g.appendChild(l);const Y=`
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`,$=`
#ifdef GL_ES
precision mediump float;
#endif

uniform vec3  iResolution;
uniform vec2  iMouse;
uniform float iTime;

uniform float uAngle;
uniform float uNoise;
uniform float uBlindCount;
uniform float uSpotlightRadius;
uniform float uSpotlightSoftness;
uniform float uSpotlightOpacity;
uniform float uMirror;
uniform float uDistort;
uniform float uShineFlip;
uniform vec3  uColor0;
uniform vec3  uColor1;
uniform vec3  uColor2;
uniform vec3  uColor3;
uniform vec3  uColor4;
uniform vec3  uColor5;
uniform vec3  uColor6;
uniform vec3  uColor7;
uniform int   uColorCount;

varying vec2 vUv;

float rand(vec2 co){
  return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
}

vec2 rotate2D(vec2 p, float a){
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c) * p;
}

vec3 getGradientColor(float t){
  float tt = clamp(t, 0.0, 1.0);
  int count = uColorCount;
  if (count < 2) count = 2;
  float scaled = tt * float(count - 1);
  float seg = floor(scaled);
  float f = fract(scaled);

  if (seg < 1.0) return mix(uColor0, uColor1, f);
  if (seg < 2.0 && count > 2) return mix(uColor1, uColor2, f);
  if (seg < 3.0 && count > 3) return mix(uColor2, uColor3, f);
  if (seg < 4.0 && count > 4) return mix(uColor3, uColor4, f);
  if (seg < 5.0 && count > 5) return mix(uColor4, uColor5, f);
  if (seg < 6.0 && count > 6) return mix(uColor5, uColor6, f);
  if (seg < 7.0 && count > 7) return mix(uColor6, uColor7, f);
  if (count > 7) return uColor7;
  if (count > 6) return uColor6;
  if (count > 5) return uColor5;
  if (count > 4) return uColor4;
  if (count > 3) return uColor3;
  if (count > 2) return uColor2;
  return uColor1;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv0 = fragCoord.xy / iResolution.xy;

    float aspect = iResolution.x / iResolution.y;
    vec2 p = uv0 * 2.0 - 1.0;
    p.x *= aspect;
    vec2 pr = rotate2D(p, uAngle);
    pr.x /= aspect;
    vec2 uv = pr * 0.5 + 0.5;

    vec2 uvMod = uv;
    if (uDistort > 0.0) {
      float a = uvMod.y * 6.0;
      float b = uvMod.x * 6.0;
      float w = 0.01 * uDistort;
      uvMod.x += sin(a) * w;
      uvMod.y += cos(b) * w;
    }
    float t = uvMod.x;
    if (uMirror > 0.5) {
      t = 1.0 - abs(1.0 - 2.0 * fract(t));
    }
    vec3 base = getGradientColor(t);

    vec2 offset = vec2(iMouse.x/iResolution.x, iMouse.y/iResolution.y);
  float d = length(uv0 - offset);
  float r = max(uSpotlightRadius, 1e-4);
  float dn = d / r;
  float spot = (1.0 - 2.0 * pow(dn, uSpotlightSoftness)) * uSpotlightOpacity;
  vec3 cir = vec3(spot);
  float stripe = fract(uvMod.x * max(uBlindCount, 1.0));
  if (uShineFlip > 0.5) stripe = 1.0 - stripe;
    vec3 ran = vec3(stripe);

    vec3 col = cir + base - ran;
    col += (rand(gl_FragCoord.xy + iTime) - 0.5) * uNoise;

    fragColor = vec4(col, 1.0);
}

void main() {
    vec4 color;
    mainImage(color, vUv * iResolution.xy);
    gl_FragColor = color;
}
`,{arr:a,count:j}=oe(m),s={iResolution:{value:[u.drawingBufferWidth,u.drawingBufferHeight,1]},iMouse:{value:[0,0]},iTime:{value:0},uAngle:{value:c*Math.PI/180},uNoise:{value:A},uBlindCount:{value:Math.max(1,d)},uSpotlightRadius:{value:P},uSpotlightSoftness:{value:O},uSpotlightOpacity:{value:_},uMirror:{value:I?1:0},uDistort:{value:z},uShineFlip:{value:G==="right"?1:0},uColor0:{value:a[0]},uColor1:{value:a[1]},uColor2:{value:a[2]},uColor3:{value:a[3]},uColor4:{value:a[4]},uColor5:{value:a[5]},uColor6:{value:a[6]},uColor7:{value:a[7]},uColorCount:{value:j}},H=new Q(u,{vertex:Y,fragment:$,uniforms:s});w.current=H;const b=new Z(u);F.current=b;const k=new V(u,{geometry:b,program:H});p.current=k;const q=()=>{const o=g.getBoundingClientRect();if(h.setSize(o.width,o.height),s.iResolution.value=[u.drawingBufferWidth,u.drawingBufferHeight,1],R&&R>0){const e=Math.max(1,Math.floor(o.width/R)),r=d?Math.min(d,e):e;s.uBlindCount.value=Math.max(1,r)}else s.uBlindCount.value=Math.max(1,d);if(U.current){U.current=!1;const e=u.drawingBufferWidth/2,r=u.drawingBufferHeight/2;s.iMouse.value=[e,r],E.current=[e,r]}};q();const D=new ResizeObserver(q);D.observe(g);const X=o=>{const e=l.getBoundingClientRect(),r=h.dpr||1,v=(o.clientX-e.left)*r,x=(e.height-(o.clientY-e.top))*r;E.current=[v,x],M<=0&&(s.iMouse.value=[v,x])};l.addEventListener("pointermove",X);const W=o=>{if(y.current=requestAnimationFrame(W),s.iTime.value=o*.001,M>0){C.current||(C.current=o);const e=(o-C.current)/1e3;C.current=o;const r=Math.max(1e-4,M);let v=1-Math.exp(-e/r);v>1&&(v=1);const x=E.current,S=s.iMouse.value;S[0]+=(x[0]-S[0])*v,S[1]+=(x[1]-S[1])*v}else C.current=o;if(!f&&w.current&&p.current)try{h.render({scene:p.current})}catch(e){console.error(e)}};return y.current=requestAnimationFrame(W),()=>{y.current&&cancelAnimationFrame(y.current),l.removeEventListener("pointermove",X),D.disconnect(),l.parentElement===g&&g.removeChild(l);const o=(e,r)=>{e&&typeof e[r]=="function"&&e[r].call(e)};o(w.current,"remove"),o(F.current,"remove"),o(p.current,"remove"),o(T.current,"destroy"),w.current=null,F.current=null,p.current=null,T.current=null}},[t,f,m,c,A,d,R,M,I,P,O,_,z,G]),J.jsx("div",{ref:N,className:`w-full h-full overflow-hidden relative ${i}`,style:{...L&&{mixBlendMode:L}}})};export{ne as default};
