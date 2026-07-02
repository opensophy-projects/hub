import{r as n,j as $}from"./vendor-react.DgFKySyv.js";import{R as X,P as Y,M as k}from"./Mesh.uU8OXhrh.js";import{T as J}from"./Triangle.DvAgNkJ_.js";const K="#ffffff",B=u=>{const t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(u);return t?[Number.parseInt(t[1],16)/255,Number.parseInt(t[2],16)/255,Number.parseInt(t[3],16)/255]:[1,1,1]},M=(u,t,i)=>{switch(u){case"top-left":return{anchor:[0,-.2*i],dir:[0,1]};case"top-right":return{anchor:[t,-.2*i],dir:[0,1]};case"left":return{anchor:[-.2*t,.5*i],dir:[1,0]};case"right":return{anchor:[(1+.2)*t,.5*i],dir:[-1,0]};case"bottom-left":return{anchor:[0,(1+.2)*i],dir:[0,-1]};case"bottom-center":return{anchor:[.5*t,(1+.2)*i],dir:[0,-1]};case"bottom-right":return{anchor:[t,(1+.2)*i],dir:[0,-1]};default:return{anchor:[.5*t,-.2*i],dir:[0,1]}}},ee=({raysOrigin:u="top-center",raysColor:t=K,raysSpeed:i=1,lightSpread:v=1,rayLength:b=2,pulsating:C=!1,fadeDistance:T=1,saturation:S=1,followMouse:D=!0,mouseInfluence:g=.1,noiseAmount:P=0,distortion:A=0,className:U=""})=>{const o=n.useRef(null),h=n.useRef(null),f=n.useRef(null),E=n.useRef({x:.5,y:.5}),d=n.useRef({x:.5,y:.5}),y=n.useRef(null),F=n.useRef(null),l=n.useRef(null),[z,j]=n.useState(!1),p=n.useRef(null);return n.useEffect(()=>{if(o.current)return p.current=new IntersectionObserver(e=>{const r=e[0];j(r.isIntersecting)},{threshold:.1}),p.current.observe(o.current),()=>{p.current&&(p.current.disconnect(),p.current=null)}},[]),n.useEffect(()=>!z||!o.current?void 0:(l.current&&(l.current(),l.current=null),(async()=>{if(!o.current||(await new Promise(s=>setTimeout(s,10)),!o.current))return;const r=new X({dpr:Math.min(globalThis.devicePixelRatio,2),alpha:!0});f.current=r;const a=r.gl;for(a.canvas.style.width="100%",a.canvas.style.height="100%";o.current.firstChild;)o.current.firstChild.remove();o.current.appendChild(a.canvas);const R=`
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`,m=`precision highp float;

uniform float iTime;
uniform vec2  iResolution;

uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays1 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,
                           1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234,
                           1.1 * raysSpeed);

  fragColor = rays1 * 0.5 + rays2 * 0.4;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }

  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= 0.1 + brightness * 0.8;
  fragColor.y *= 0.3 + brightness * 0.6;
  fragColor.z *= 0.5 + brightness * 0.5;

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  fragColor.rgb *= raysColor;
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor  = color;
}`,c={iTime:{value:0},iResolution:{value:[1,1]},rayPos:{value:[0,0]},rayDir:{value:[0,1]},raysColor:{value:B(t)},raysSpeed:{value:i},lightSpread:{value:v},rayLength:{value:b},pulsating:{value:C?1:0},fadeDistance:{value:T},saturation:{value:S},mousePos:{value:[.5,.5]},mouseInfluence:{value:g},noiseAmount:{value:P},distortion:{value:A}};h.current=c;const L=new J(a),q=new Y(a,{vertex:R,fragment:m,uniforms:c}),I=new k(a,{geometry:L,program:q});F.current=I;const w=()=>{if(!o.current||!r)return;r.dpr=Math.min(globalThis.devicePixelRatio,2);const{clientWidth:s,clientHeight:x}=o.current;r.setSize(s,x);const N=r.dpr,_=s*N,G=x*N;c.iResolution.value=[_,G];const{anchor:H,dir:V}=M(u,_,G);c.rayPos.value=H,c.rayDir.value=V},W=s=>{if(!(!f.current||!h.current||!F.current)){c.iTime.value=s*.001,D&&g>0&&(d.current.x=d.current.x*.92+E.current.x*(1-.92),d.current.y=d.current.y*.92+E.current.y*(1-.92),c.mousePos.value=[d.current.x,d.current.y]);try{r.render({scene:I}),y.current=requestAnimationFrame(W)}catch(x){console.warn("WebGL rendering error:",x)}}};globalThis.addEventListener("resize",w),w(),y.current=requestAnimationFrame(W),l.current=()=>{if(y.current&&(cancelAnimationFrame(y.current),y.current=null),globalThis.removeEventListener("resize",w),r)try{const s=r.gl.canvas;r.gl.getExtension("WEBGL_lose_context")?.loseContext(),s?.remove()}catch(s){console.warn("Error during WebGL cleanup:",s)}f.current=null,h.current=null,F.current=null}})(),()=>{l.current&&(l.current(),l.current=null)}),[z,u,t,i,v,b,C,T,S,D,g,P,A]),n.useEffect(()=>{if(!h.current||!o.current||!f.current)return;const e=h.current,r=f.current;e.raysColor.value=B(t),e.raysSpeed.value=i,e.lightSpread.value=v,e.rayLength.value=b,e.pulsating.value=C?1:0,e.fadeDistance.value=T,e.saturation.value=S,e.mouseInfluence.value=g,e.noiseAmount.value=P,e.distortion.value=A;const{clientWidth:a,clientHeight:R}=o.current,m=r.dpr,{anchor:c,dir:L}=M(u,a*m,R*m);e.rayPos.value=c,e.rayDir.value=L},[t,i,v,u,b,C,T,S,g,P,A]),n.useEffect(()=>{const e=r=>{if(!o.current||!f.current)return;const a=o.current.getBoundingClientRect(),R=(r.clientX-a.left)/a.width,m=(r.clientY-a.top)/a.height;E.current={x:R,y:m}};if(D)return globalThis.addEventListener("mousemove",e),()=>globalThis.removeEventListener("mousemove",e)},[D]),$.jsx("div",{ref:o,className:`w-full h-full pointer-events-none z-[3] overflow-hidden relative ${U}`.trim()})};export{ee as default};
