import{r as F,j as B}from"./vendor-react.DgFKySyv.js";import{R as C,P,M as L}from"./Mesh.uU8OXhrh.js";import{T as k}from"./Texture.BkQWYNP2.js";import{T as U}from"./Triangle.DvAgNkJ_.js";function I(n){const u=n.replace("#","");return[Number.parseInt(u.slice(0,2),16)/255,Number.parseInt(u.slice(2,4),16)/255,Number.parseInt(u.slice(4,6),16)/255]}function x(n,u,g){let t=n*374761393+u*668265263+g*1274126177;return t=Math.imul(t^t>>>13,1274126177),((t^t>>>16)>>>0)/4294967296}function b(n=256){const u=new Uint8Array(n*n*4);function g(t,c,i,s){const f=t/n*i,v=c/n*i,l=Math.floor(f),r=Math.floor(v),o=f-l,m=v-r,e=Math.trunc(i),E=x((l%e+e)%e,(r%e+e)%e,s),p=x(((l+1)%e+e)%e,(r%e+e)%e,s),a=x((l%e+e)%e,((r+1)%e+e)%e,s),w=x(((l+1)%e+e)%e,((r+1)%e+e)%e,s);return E*(1-o)*(1-m)+p*o*(1-m)+a*(1-o)*m+w*o*m}for(let t=0;t<n;t++)for(let c=0;c<n;c++){let i=0,s=.4,f=0;for(let r=0;r<8;r++){const o=32*(1<<r);i+=s*g(c,t,o,r*31),f+=s,s*=.65}i/=f,i=(i-.5)*2.2+.5,i=Math.max(0,Math.min(1,i));const v=Math.round(i*255),l=(t*n+c)*4;u[l]=v,u[l+1]=v,u[l+2]=v,u[l+3]=255}return u}const D=`
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`,_=`
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform sampler2D uNoiseTexture;
uniform float uPupilSize;
uniform float uIrisWidth;
uniform float uGlowIntensity;
uniform float uIntensity;
uniform float uScale;
uniform float uNoiseScale;
uniform vec2 uMouse;
uniform float uPupilFollow;
uniform float uFlameSpeed;
uniform vec3 uEyeColor;
uniform vec3 uBgColor;

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.y;
  uv /= uScale;
  float ft = uTime * uFlameSpeed;

  float polarRadius = length(uv) * 2.0;
  float polarAngle = (2.0 * atan(uv.x, uv.y)) / 6.28 * 0.3;
  vec2 polarUv = vec2(polarRadius, polarAngle);

  vec4 noiseA = texture2D(uNoiseTexture, polarUv * vec2(0.2, 7.0) * uNoiseScale + vec2(-ft * 0.1, 0.0));
  vec4 noiseB = texture2D(uNoiseTexture, polarUv * vec2(0.3, 4.0) * uNoiseScale + vec2(-ft * 0.2, 0.0));
  vec4 noiseC = texture2D(uNoiseTexture, polarUv * vec2(0.1, 5.0) * uNoiseScale + vec2(-ft * 0.1, 0.0));

  float distanceMask = 1.0 - length(uv);

  // Inner ring
  float innerRing = clamp(-1.0 * ((distanceMask - 0.7) / uIrisWidth), 0.0, 1.0);
  innerRing = (innerRing * distanceMask - 0.2) / 0.28;
  innerRing += noiseA.r - 0.5;
  innerRing *= 1.3;
  innerRing = clamp(innerRing, 0.0, 1.0);

  float outerRing = clamp(-1.0 * ((distanceMask - 0.5) / 0.2), 0.0, 1.0);
  outerRing = (outerRing * distanceMask - 0.1) / 0.38;
  outerRing += noiseC.r - 0.5;
  outerRing *= 1.3;
  outerRing = clamp(outerRing, 0.0, 1.0);

  innerRing += outerRing;

  // Inner eye
  float innerEye = distanceMask - 0.1 * 2.0;
  innerEye *= noiseB.r * 2.0;

  // Pupil with cursor tracking
  vec2 pupilOffset = uMouse * uPupilFollow * 0.12;
  vec2 pupilUv = uv - pupilOffset;
  float pupil = 1.0 - length(pupilUv * vec2(9.0, 2.3));
  pupil *= uPupilSize;
  pupil = clamp(pupil, 0.0, 1.0);
  pupil /= 0.35;

  // Outer eye
  float outerEyeGlow = 1.0 - length(uv * vec2(0.5, 1.5));
  outerEyeGlow = clamp(outerEyeGlow + 0.5, 0.0, 1.0);
  outerEyeGlow += noiseC.r - 0.5;
  float outerBgGlow = outerEyeGlow;
  outerEyeGlow = pow(outerEyeGlow, 2.0);
  outerEyeGlow += distanceMask;
  outerEyeGlow *= uGlowIntensity;
  outerEyeGlow = clamp(outerEyeGlow, 0.0, 1.0);
  outerEyeGlow *= pow(1.0 - distanceMask, 2.0) * 2.5;

  // Outer eye bg glow
  outerBgGlow += distanceMask;
  outerBgGlow = pow(outerBgGlow, 0.5);
  outerBgGlow *= 0.15;

  vec3 color = uEyeColor * uIntensity * clamp(max(innerRing + innerEye, outerEyeGlow + outerBgGlow) - pupil, 0.0, 3.0);
  color += uBgColor;

  gl_FragColor = vec4(color, 1.0);
}
`;function Y({eyeColor:n="#FF6F37",intensity:u=1.5,pupilSize:g=.6,irisWidth:t=.25,glowIntensity:c=.35,scale:i=.8,noiseScale:s=1,pupilFollow:f=1,flameSpeed:v=1,backgroundColor:l="#000000"}){const r=F.useRef(null);return F.useEffect(()=>{if(!r.current)return;const o=r.current,m=new C({alpha:!0,premultipliedAlpha:!1}),e=m.gl;e.clearColor(0,0,0,0);const E=b(256),p=new k(e,{image:E,width:256,height:256,generateMipmaps:!1,flipY:!1});p.minFilter=e.LINEAR,p.magFilter=e.LINEAR,p.wrapS=e.REPEAT,p.wrapT=e.REPEAT;const a={x:0,y:0,tx:0,ty:0};function w(h){const d=o.getBoundingClientRect();a.tx=(h.clientX-d.left)/d.width*2-1,a.ty=-((h.clientY-d.top)/d.height*2-1)}function M(){a.tx=0,a.ty=0}o.addEventListener("mousemove",w),o.addEventListener("mouseleave",M);function G(h){m.setSize(o.offsetWidth,o.offsetHeight),h.uniforms.uResolution.value=[e.canvas.width,e.canvas.height,e.canvas.width/e.canvas.height]}const S=new U(e),y=new P(e,{vertex:D,fragment:_,uniforms:{uTime:{value:0},uResolution:{value:[e.canvas.width,e.canvas.height,e.canvas.width/e.canvas.height]},uNoiseTexture:{value:p},uPupilSize:{value:g},uIrisWidth:{value:t},uGlowIntensity:{value:c},uIntensity:{value:u},uScale:{value:i},uNoiseScale:{value:s},uMouse:{value:[0,0]},uPupilFollow:{value:f},uFlameSpeed:{value:v},uEyeColor:{value:I(n)},uBgColor:{value:I(l)}}}),T=()=>G(y);globalThis.addEventListener("resize",T),G(y);const A=new L(e,{geometry:S,program:y});o.appendChild(e.canvas);let R;function N(h){R=requestAnimationFrame(N),a.x+=(a.tx-a.x)*.05,a.y+=(a.ty-a.y)*.05,y.uniforms.uMouse.value=[a.x,a.y],y.uniforms.uTime.value=h*.001,m.render({scene:A})}return R=requestAnimationFrame(N),()=>{cancelAnimationFrame(R),globalThis.removeEventListener("resize",T),o.removeEventListener("mousemove",w),o.removeEventListener("mouseleave",M),e.canvas.remove(),e.getExtension("WEBGL_lose_context")?.loseContext()}},[n,u,g,t,c,i,s,f,v,l]),B.jsx("div",{ref:r,className:"w-full h-full"})}export{Y as default};
