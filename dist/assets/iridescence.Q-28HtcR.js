import{r as v,j as M}from"./vendor-react.DgFKySyv.js";import{R as A,P as S,M as T}from"./Mesh.uU8OXhrh.js";import{T as z}from"./Triangle.DvAgNkJ_.js";import{C as l}from"./Color.YRkaOI4u.js";const F=`
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`,L=`
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;function b({color:m=[1,1,1],speed:f=1,amplitude:d=.1,mouseReact:u=!0,...C}){const r=v.useRef(null),s=v.useRef({x:.5,y:.5});return v.useEffect(()=>{if(!r.current)return;const o=r.current,a=new A,e=a.gl;e.clearColor(1,1,1,1);function h(t){a.setSize(o.offsetWidth*1,o.offsetHeight*1),t.uniforms.uResolution.value=new l(e.canvas.width,e.canvas.height,e.canvas.width/e.canvas.height)}const R=new z(e),n=new S(e,{vertex:F,fragment:L,uniforms:{uTime:{value:0},uColor:{value:new l(...m)},uResolution:{value:new l(e.canvas.width,e.canvas.height,e.canvas.width/e.canvas.height)},uMouse:{value:new Float32Array([s.current.x,s.current.y])},uAmplitude:{value:d},uSpeed:{value:f}}}),g=()=>h(n);window.addEventListener("resize",g,!1),h(n);const E=new T(e,{geometry:R,program:n});let c;function p(t){c=requestAnimationFrame(p),n.uniforms.uTime.value=t*.001,a.render({scene:E})}c=requestAnimationFrame(p),o.appendChild(e.canvas);function w(t){const i=o.getBoundingClientRect(),x=(t.clientX-i.left)/i.width,y=1-(t.clientY-i.top)/i.height;s.current={x,y},n.uniforms.uMouse.value[0]=x,n.uniforms.uMouse.value[1]=y}return u&&o.addEventListener("mousemove",w),()=>{cancelAnimationFrame(c),window.removeEventListener("resize",g),u&&o.removeEventListener("mousemove",w),o.removeChild(e.canvas),e.getExtension("WEBGL_lose_context")?.loseContext()}},[m,f,d,u]),M.jsx("div",{ref:r,className:"w-full h-full",...C})}export{b as default};
