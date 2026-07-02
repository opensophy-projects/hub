import{r as w,j as B}from"./vendor-react.DgFKySyv.js";import{R as Q,P as j,M as V}from"./Mesh.uU8OXhrh.js";import{T as _}from"./Triangle.DvAgNkJ_.js";const k=a=>{const i=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(a);return i?[parseInt(i[1],16)/255,parseInt(i[2],16)/255,parseInt(i[3],16)/255]:[1,.5,.2]},H=`#version 300 es
precision highp float;
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`,N=`#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform vec3 uCustomColor;
uniform float uUseCustomColor;
uniform float uSpeed;
uniform float uDirection;
uniform float uScale;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseInteractive;
out vec4 fragColor;

void mainImage(out vec4 o, vec2 C) {
  vec2 center = iResolution.xy * 0.5;
  C = (C - center) / uScale + center;
  
  vec2 mouseOffset = (uMouse - center) * 0.0002;
  C += mouseOffset * length(C - center) * step(0.5, uMouseInteractive);
  
  float i, d, z, T = iTime * uSpeed * uDirection;
  vec3 O, p, S;

  for (vec2 r = iResolution.xy, Q; ++i < 60.; O += o.w/d*o.xyz) {
    p = z*normalize(vec3(C-.5*r,r.y)); 
    p.z -= 4.; 
    S = p;
    d = p.y-T;
    
    p.x += .4*(1.+p.y)*sin(d + p.x*0.1)*cos(.34*d + p.x*0.05); 
    Q = p.xz *= mat2(cos(p.y+vec4(0,11,33,0)-T)); 
    z+= d = abs(sqrt(length(Q*Q)) - .25*(5.+S.y))/3.+8e-4; 
    o = 1.+sin(S.y+p.z*.5+S.z-length(S-p)+vec4(2,1,0,8));
  }
  
  o.xyz = tanh(O/1e4);
}

bool finite1(float x){ return !(isnan(x) || isinf(x)); }
vec3 sanitize(vec3 c){
  return vec3(
    finite1(c.r) ? c.r : 0.0,
    finite1(c.g) ? c.g : 0.0,
    finite1(c.b) ? c.b : 0.0
  );
}

void main() {
  vec4 o = vec4(0.0);
  mainImage(o, gl_FragCoord.xy);
  vec3 rgb = sanitize(o.rgb);
  
  float intensity = (rgb.r + rgb.g + rgb.b) / 3.0;
  vec3 customColor = intensity * uCustomColor;
  vec3 finalColor = mix(rgb, customColor, step(0.5, uUseCustomColor));
  
  float alpha = length(rgb) * uOpacity;
  fragColor = vec4(finalColor, alpha);
}`,$=({color:a="#ffffff",speed:i=1,direction:h="forward",scale:y=1,opacity:b=1,mouseInteractive:c=!0})=>{const x=w.useRef(null),m=w.useRef({x:0,y:0});return w.useEffect(()=>{if(!x.current)return;const o=x.current,D=a?1:0,E=a?k(a):[1,1,1],O=h==="reverse"?-1:1;let v;try{v=new Q({webgl:2,alpha:!0,antialias:!1,dpr:Math.min(window.devicePixelRatio||1,2)})}catch{return}const s=v.gl;if(!s)return;const n=s.canvas;n.style.display="block",n.style.width="100%",n.style.height="100%",o.appendChild(n);const L=new _(s),u=new j(s,{vertex:H,fragment:N,uniforms:{iTime:{value:0},iResolution:{value:new Float32Array([1,1])},uCustomColor:{value:new Float32Array(E)},uUseCustomColor:{value:D},uSpeed:{value:i*.4},uDirection:{value:O},uScale:{value:y},uOpacity:{value:b},uMouse:{value:new Float32Array([0,0])},uMouseInteractive:{value:c?1:0}}}),I=new V(s,{geometry:L,program:u}),M=e=>{if(!c)return;const t=o.getBoundingClientRect();m.current.x=e.clientX-t.left,m.current.y=e.clientY-t.top;const f=u.uniforms.uMouse.value;f[0]=m.current.x,f[1]=m.current.y};c&&o.addEventListener("mousemove",M);const R=()=>{const e=o.getBoundingClientRect(),t=Math.max(1,Math.floor(e.width)),f=Math.max(1,Math.floor(e.height));v.setSize(t,f);const d=u.uniforms.iResolution.value;d[0]=s.drawingBufferWidth,d[1]=s.drawingBufferHeight},z=new ResizeObserver(R);z.observe(o),R();let r=0,g=!1,l=!0;const P=performance.now(),p=e=>{if(g||!l)return;const t=(e-P)*.001;if(h==="pingpong"){const d=t%10,U=Math.floor(t/10)%2===0,C=d/10,A=C*C*(3-2*C),q=U?A*10:(1-A)*10;u.uniforms.uDirection.value=1,u.uniforms.iTime.value=q}else u.uniforms.iTime.value=t;v.render({scene:I}),r=requestAnimationFrame(p)},S=e=>{e.preventDefault(),g=!0,cancelAnimationFrame(r)},F=()=>{g=!1,l&&(cancelAnimationFrame(r),r=requestAnimationFrame(p))};n.addEventListener("webglcontextlost",S),n.addEventListener("webglcontextrestored",F);const T=new IntersectionObserver(([e])=>{const t=l;l=e.isIntersecting,l&&!t&&!g&&(cancelAnimationFrame(r),r=requestAnimationFrame(p))},{threshold:0});return T.observe(o),r=requestAnimationFrame(p),()=>{cancelAnimationFrame(r),z.disconnect(),T.disconnect(),n.removeEventListener("webglcontextlost",S),n.removeEventListener("webglcontextrestored",F),c&&o&&o.removeEventListener("mousemove",M);try{o?.removeChild(n)}catch{}}},[a,i,h,y,b,c]),B.jsx("div",{ref:x,className:"w-full h-full relative overflow-hidden"})};export{$ as Plasma,$ as default};
