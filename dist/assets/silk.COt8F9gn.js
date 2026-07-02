import{r as l,j as P}from"./vendor-react.DgFKySyv.js";import{C as G,W as I,S as M,O as U,e as E,c as T,a as W}from"./three.module.Hv9STz0E.js";const b=s=>{const o=s.replace("#","");return[parseInt(o.slice(0,2),16)/255,parseInt(o.slice(2,4),16)/255,parseInt(o.slice(4,6),16)/255]},j=`
varying vec2 vUv;
varying vec3 vPosition;
void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,F=`
varying vec2 vUv;
varying vec3 vPosition;
uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;
const float e = 2.71828182845904523536;
float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}
vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}
void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;
  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);
  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));
  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`,_=({speed:s=5,scale:o=1,color:u="#7B7481",noiseIntensity:v=1.5,rotation:m=0,className:R,style:O})=>{const f=l.useRef(null),d=l.useMemo(()=>({uSpeed:{value:s},uScale:{value:o},uNoiseIntensity:{value:v},uColor:{value:new G(...b(u))},uRotation:{value:m},uTime:{value:0}}),[s,o,v,u,m]);return l.useEffect(()=>{const e=f.current;if(!e)return;const t=new I({antialias:!0});t.setPixelRatio(Math.min(window.devicePixelRatio,2)),t.setSize(e.clientWidth,e.clientHeight),e.appendChild(t.domElement);const x=new M,p=new U(-.5,.5,.5,-.5,.1,10);p.position.z=1;const h=new E(1,1,1,1),a=new T({uniforms:d,vertexShader:j,fragmentShader:F}),r=new W(h,a);x.add(r);const g=()=>{const n=e.clientWidth,i=e.clientHeight,c=n/i;c>=1?r.scale.set(c,1,1):r.scale.set(1,1/c,1)};g();let w,S=performance.now();const y=()=>{w=requestAnimationFrame(y);const n=performance.now(),i=(n-S)/1e3;S=n,a.uniforms.uTime.value+=.1*i,t.render(x,p)};y();const z=()=>{if(!e)return;const n=e.clientWidth,i=e.clientHeight;t.setSize(n,i),g()},C=new ResizeObserver(z);return C.observe(e),()=>{cancelAnimationFrame(w),C.disconnect(),t.dispose(),h.dispose(),a.dispose(),e.removeChild(t.domElement)}},[d]),P.jsx("div",{ref:f,className:R,style:{width:"100%",height:"100%",position:"relative",...O}})};export{_ as default};
