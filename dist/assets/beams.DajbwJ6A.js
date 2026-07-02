import{r as O,j}from"./vendor-react.DgFKySyv.js";import{C as $,M as A,W as R,S as F,P as B,A as E,D as G,G as H,a as L,b as U,U as W,c as X,B as q,d as C}from"./three.module.Hv9STz0E.js";function Z(r,t){const u=U.physical,{vertexShader:d,fragmentShader:a,uniforms:i}=u,m=u.defines??{},s=W.clone(i),o=new r(t.material??{});o.color&&(s.diffuse.value=o.color),"roughness"in o&&(s.roughness.value=o.roughness),"metalness"in o&&(s.metalness.value=o.metalness),"envMap"in o&&(s.envMap.value=o.envMap),"envMapIntensity"in o&&(s.envMapIntensity.value=o.envMapIntensity);for(const[n,e]of Object.entries(t.uniforms??{}))s[n]=e!==null&&typeof e=="object"&&"value"in e?e:{value:e};let f=`${t.header}
${t.vertexHeader??""}
${d}`,v=`${t.header}
${t.fragmentHeader??""}
${a}`;for(const[n,e]of Object.entries(t.vertex??{}))f=f.replace(n,`${n}
${e}`);for(const[n,e]of Object.entries(t.fragment??{}))v=v.replace(n,`${n}
${e}`);return new X({defines:{...m},uniforms:s,vertexShader:f,fragmentShader:v,lights:!0,fog:!!t.material?.fog})}const k=r=>{const t=r.replace("#","");return[Number.parseInt(t.substring(0,2),16)/255,Number.parseInt(t.substring(2,4),16)/255,Number.parseInt(t.substring(4,6),16)/255]},D=r=>r*Math.PI/180,T=`
float random (in vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
float cnoise(vec3 P){
  vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 / 7.0; vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0); vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5); gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 / 7.0; vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1); vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5); gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x); vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z); vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x); vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z); vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0); float n100 = dot(g100, vec3(Pf1.x,Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x,Pf1.y,Pf0.z)); float n110 = dot(g110, vec3(Pf1.xy,Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy,Pf1.z)); float n101 = dot(g101, vec3(Pf1.x,Pf0.y,Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x,Pf1.yz)); float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
  vec2 n_yz = mix(n_z.xy,n_z.zw,fade_xyz.y);
  float n_xyz = mix(n_yz.x,n_yz.y,fade_xyz.x);
  return 2.2 * n_xyz;
}
`;function V(r,t,u,d,a){const i=new q,m=r*(a+1)*2,s=r*a*2,o=new Float32Array(m*3),f=new Uint32Array(s*3),v=new Float32Array(m*2);let n=0,e=0,c=0;const p=-(r*t+(r-1)*d)/2;for(let P=0;P<r;P++){const x=p+P*(t+d),g=Math.random()*300,y=Math.random()*300;for(let l=0;l<=a;l++){const M=u*(l/a-.5);o.set([x,M,0,x+t,M,0],n*3);const b=l/a;if(v.set([g,b+y,g+1,b+y],c),l<a){const _=n,w=n+1,S=n+2,I=n+3;f.set([_,w,S,S,w,I],e),e+=6}n+=2,c+=4}}return i.setAttribute("position",new C(o,3)),i.setAttribute("uv",new C(v,2)),i.setIndex(new C(f,1)),i.computeVertexNormals(),i}const K=({beamWidth:r=2,beamHeight:t=15,beamNumber:u=12,lightColor:d="#ffffff",speed:a=2,noiseIntensity:i=1.75,scale:m=.2,rotation:s=0,className:o,style:f})=>{const v=O.useRef(null),n=O.useMemo(()=>Z(A,{header:`
varying vec3 vEye;
varying float vNoise;
varying vec2 vUv;
varying vec3 vPosition;
uniform float time;
uniform float uSpeed;
uniform float uNoiseIntensity;
uniform float uScale;
${T}`,vertexHeader:`
float getPos(vec3 pos) {
  vec3 noisePos = vec3(pos.x * 0., pos.y - uv.y, pos.z + time * uSpeed * 3.) * uScale;
  return cnoise(noisePos);
}
vec3 getCurrentPos(vec3 pos) {
  vec3 newpos = pos;
  newpos.z += getPos(pos);
  return newpos;
}
vec3 getNormal(vec3 pos) {
  vec3 curpos = getCurrentPos(pos);
  vec3 nextposX = getCurrentPos(pos + vec3(0.01, 0.0, 0.0));
  vec3 nextposZ = getCurrentPos(pos + vec3(0.0, -0.01, 0.0));
  vec3 tangentX = normalize(nextposX - curpos);
  vec3 tangentZ = normalize(nextposZ - curpos);
  return normalize(cross(tangentZ, tangentX));
}`,fragmentHeader:"",vertex:{"#include <begin_vertex>":"transformed.z += getPos(transformed.xyz);","#include <beginnormal_vertex>":"objectNormal = getNormal(position.xyz);"},fragment:{"#include <dithering_fragment>":`
float randomNoise = noise(gl_FragCoord.xy);
gl_FragColor.rgb -= randomNoise / 15. * uNoiseIntensity;`},material:{fog:!0},uniforms:{diffuse:new $(...k("#000000")),time:{value:0},roughness:.3,metalness:.3,uSpeed:{value:a},envMapIntensity:10,uNoiseIntensity:i,uScale:m}}),[a,i,m]);return O.useEffect(()=>{const e=v.current;if(!e)return;const c=new R({antialias:!0});c.setPixelRatio(Math.min(globalThis.devicePixelRatio,2)),c.setSize(e.clientWidth,e.clientHeight),c.physicallyCorrectLights=!0,e.appendChild(c.domElement);const z=new F;z.background=new $("#000000");const p=new B(30,e.clientWidth/e.clientHeight,.1,1e3);p.position.set(0,0,20);const P=new E(16777215,1);z.add(P);const x=new G(d,1);x.position.set(0,3,10);const g=x.shadow.camera;g.top=24,g.bottom=-24,g.left=-24,g.right=24,g.far=64,x.shadow.bias=-.004;const y=new H;y.rotation.z=D(s),z.add(y),y.add(x);const l=V(u,r,t,0,100),M=new L(l,n);y.add(M);let b,_=performance.now();const w=()=>{b=requestAnimationFrame(w);const h=performance.now(),N=(h-_)/1e3;_=h,n.uniforms.time.value+=.1*N,c.render(z,p)};w();const S=()=>{const h=e.clientWidth,N=e.clientHeight;p.aspect=h/N,p.updateProjectionMatrix(),c.setSize(h,N)},I=new ResizeObserver(S);return I.observe(e),()=>{cancelAnimationFrame(b),I.disconnect(),c.dispose(),l.dispose(),n.dispose(),c.domElement.remove()}},[n,r,t,u,d,s]),j.jsx("div",{ref:v,className:o,style:{width:"100%",height:"100%",position:"relative",...f}})};export{K as default};
