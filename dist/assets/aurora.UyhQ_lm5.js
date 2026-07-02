import{r as v,j as R}from"./vendor-react.DgFKySyv.js";import{R as z,P as F,M as b}from"./Mesh.uU8OXhrh.js";import{C as h}from"./Color.YRkaOI4u.js";import{T as E}from"./Triangle.DvAgNkJ_.js";const B=`#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,P=`#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {                int index = 0;                                              for (int i = 0; i < 2; i++) {                                    ColorStop currentColor = colors[i];                         bool isInBetween = currentColor.position <= factor;         index = int(mix(float(index), float(i), float(isInBetween)));   }                                                           ColorStop currentColor = colors[index];                     ColorStop nextColor = colors[index + 1];                    float range = nextColor.position - currentColor.position;   float lerpFactor = (factor - currentColor.position) / range;   finalColor = mix(currentColor.color, nextColor.color, lerpFactor); }

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);
  
  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);
  
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;
  
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 auroraColor = intensity * rampColor;
  
  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;function O(l){const{colorStops:s=["#5227FF","#7cff67","#5227FF"],amplitude:x=1,blend:a=.5}=l,i=v.useRef(l);i.current=l;const d=v.useRef(null);return v.useEffect(()=>{const e=d.current;if(!e)return;const u=new z({alpha:!0,premultipliedAlpha:!0,antialias:!0}),o=u.gl;o.clearColor(0,0,0,0),o.enable(o.BLEND),o.blendFunc(o.ONE,o.ONE_MINUS_SRC_ALPHA),o.canvas.style.backgroundColor="transparent";const g=s.map(n=>{const t=new h(n);return[t.r,t.g,t.b]}),r=new F(o,{vertex:B,fragment:P,uniforms:{uTime:{value:0},uAmplitude:{value:x},uColorStops:{value:g},uResolution:{value:[e.offsetWidth,e.offsetHeight]},uBlend:{value:a}}});function c(){if(!e)return;const n=e.offsetWidth,t=e.offsetHeight;u.setSize(n,t),r.uniforms.uResolution.value=[n,t]}window.addEventListener("resize",c);const m=new E(o);m.attributes.uv&&delete m.attributes.uv;const y=new b(o,{geometry:m,program:r});e.appendChild(o.canvas);let f=0;const C=n=>{f=requestAnimationFrame(C);const{time:t=n*.01,speed:w=1}=i.current;r.uniforms.uTime.value=t*w*.1,r.uniforms.uAmplitude.value=i.current.amplitude??1,r.uniforms.uBlend.value=i.current.blend??a;const S=i.current.colorStops??s;r.uniforms.uColorStops.value=S.map(A=>{const p=new h(A);return[p.r,p.g,p.b]}),u.render({scene:y})};return f=requestAnimationFrame(C),c(),()=>{cancelAnimationFrame(f),window.removeEventListener("resize",c),o.canvas.parentNode===e&&o.canvas.remove(),o.getExtension("WEBGL_lose_context")?.loseContext()}},[x,a,s]),R.jsx("div",{ref:d,className:"w-full h-full"})}export{O as default};
