import{r as H,j as F}from"./vendor-react.DgFKySyv.js";import{R as N,P as b,M as G}from"./Mesh.uU8OXhrh.js";import{T as P}from"./Triangle.DvAgNkJ_.js";function R(n){const t=n.replace("#","");return[Number.parseInt(t.slice(0,2),16)/255,Number.parseInt(t.slice(2,4),16)/255,Number.parseInt(t.slice(4,6),16)/255]}const _=`
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`,O=`
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uBandHeight;
uniform float uBandSpread;
uniform float uOctaveDecay;
uniform float uLayerOffset;
uniform float uColorSpeed;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define TAU 6.28318

vec3 gradientHash(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 234.6)),
    dot(p, vec3(269.5, 183.3, 198.3)),
    dot(p, vec3(169.5, 283.3, 156.9))
  );
  vec3 h = fract(sin(p) * 43758.5453123);
  float phi = acos(2.0 * h.x - 1.0);
  float theta = TAU * h.y;
  return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
}

float quinticSmooth(float t) {
  float t2 = t * t;
  float t3 = t * t2;
  return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3;
}

vec3 cosineGradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TAU * (c * t + d));
}

float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
  float x = px * frequency;
  float y = py * frequency;

  float fx = floor(x); float fy = floor(y); float fz = floor(pz);
  float cx = ceil(x);  float cy = ceil(y);  float cz = ceil(pz);

  vec3 g000 = gradientHash(vec3(fx, fy, fz));
  vec3 g100 = gradientHash(vec3(cx, fy, fz));
  vec3 g010 = gradientHash(vec3(fx, cy, fz));
  vec3 g110 = gradientHash(vec3(cx, cy, fz));
  vec3 g001 = gradientHash(vec3(fx, fy, cz));
  vec3 g101 = gradientHash(vec3(cx, fy, cz));
  vec3 g011 = gradientHash(vec3(fx, cy, cz));
  vec3 g111 = gradientHash(vec3(cx, cy, cz));

  float d000 = dot(g000, vec3(x - fx, y - fy, pz - fz));
  float d100 = dot(g100, vec3(x - cx, y - fy, pz - fz));
  float d010 = dot(g010, vec3(x - fx, y - cy, pz - fz));
  float d110 = dot(g110, vec3(x - cx, y - cy, pz - fz));
  float d001 = dot(g001, vec3(x - fx, y - fy, pz - cz));
  float d101 = dot(g101, vec3(x - cx, y - fy, pz - cz));
  float d011 = dot(g011, vec3(x - fx, y - cy, pz - cz));
  float d111 = dot(g111, vec3(x - cx, y - cy, pz - cz));

  float sx = quinticSmooth(x - fx);
  float sy = quinticSmooth(y - fy);
  float sz = quinticSmooth(pz - fz);

  float lx00 = mix(d000, d100, sx);
  float lx10 = mix(d010, d110, sx);
  float lx01 = mix(d001, d101, sx);
  float lx11 = mix(d011, d111, sx);

  float ly0 = mix(lx00, lx10, sy);
  float ly1 = mix(lx01, lx11, sy);

  return amplitude * mix(ly0, ly1, sz);
}

float auroraGlow(float t, vec2 shift) {
  vec2 uv = gl_FragCoord.xy / uResolution.y;
  uv += shift;

  float noiseVal = 0.0;
  float freq = uNoiseFreq;
  float amp = uNoiseAmp;
  vec2 samplePos = uv * uScale;

  for (float i = 0.0; i < 3.0; i += 1.0) {
    noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t);
    amp *= uOctaveDecay;
    freq *= 2.0;
  }

  float yBand = uv.y * 10.0 - uBandHeight * 10.0;
  return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * abs(noiseVal + yBand))), 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float t = uSpeed * 0.4 * uTime;

  vec2 shift = vec2(0.0);
  if (uEnableMouse) {
    shift = (uMouse - 0.5) * uMouseInfluence;
  }

  vec3 col = vec3(0.0);
  col += 0.99 * auroraGlow(t, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.2 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.20, 0.20)) * uColor1;
  col += 0.99 * auroraGlow(t + uLayerOffset, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.1 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25)) * uColor2;

  col *= uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;function j({speed:n=.6,scale:t=1.5,brightness:m=1,color1:d="#f7f7f7",color2:p="#e100ff",noiseFrequency:x=2.5,noiseAmplitude:h=1,bandHeight:g=.5,bandSpread:y=1,octaveDecay:z=.1,layerOffset:S=0,colorSpeed:C=1,enableMouseInteraction:l=!0,mouseInfluence:M=.25}){const i=H.useRef(null);return H.useEffect(()=>{if(!i.current)return;const r=i.current,s=new N({alpha:!0,premultipliedAlpha:!1}),e=s.gl;e.clearColor(0,0,0,0);const a=[.5,.5];let c=[.5,.5];function q(u){const f=e.canvas.getBoundingClientRect();c=[(u.clientX-f.left)/f.width,1-(u.clientY-f.top)/f.height]}function w(){c=[.5,.5]}function E(u){s.setSize(r.offsetWidth,r.offsetHeight),u.uniforms.uResolution.value=[e.canvas.width,e.canvas.height,e.canvas.width/e.canvas.height]}const A=new P(e),o=new b(e,{vertex:_,fragment:O,uniforms:{uTime:{value:0},uResolution:{value:[e.canvas.width,e.canvas.height,e.canvas.width/e.canvas.height]},uSpeed:{value:n},uScale:{value:t},uBrightness:{value:m},uColor1:{value:R(d)},uColor2:{value:R(p)},uNoiseFreq:{value:x},uNoiseAmp:{value:h},uBandHeight:{value:g},uBandSpread:{value:y},uOctaveDecay:{value:z},uLayerOffset:{value:S},uColorSpeed:{value:C},uMouse:{value:new Float32Array([.5,.5])},uMouseInfluence:{value:M},uEnableMouse:{value:l}}}),T=()=>E(o);globalThis.addEventListener("resize",T),E(o);const L=new G(e,{geometry:A,program:o});r.appendChild(e.canvas),l&&(e.canvas.addEventListener("mousemove",q),e.canvas.addEventListener("mouseleave",w));let v;function B(u){v=requestAnimationFrame(B),o.uniforms.uTime.value=u*.001,l?(a[0]+=.05*(c[0]-a[0]),a[1]+=.05*(c[1]-a[1]),o.uniforms.uMouse.value[0]=a[0],o.uniforms.uMouse.value[1]=a[1]):(o.uniforms.uMouse.value[0]=.5,o.uniforms.uMouse.value[1]=.5),s.render({scene:L})}return v=requestAnimationFrame(B),()=>{cancelAnimationFrame(v),globalThis.removeEventListener("resize",T),l&&(e.canvas.removeEventListener("mousemove",q),e.canvas.removeEventListener("mouseleave",w)),e.canvas.remove(),e.getExtension("WEBGL_lose_context")?.loseContext()}},[n,t,m,d,p,x,h,g,y,z,S,C,l,M]),F.jsx("div",{ref:i,className:"w-full h-full"})}export{j as default};
