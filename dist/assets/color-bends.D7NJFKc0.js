import{r as t,j as Y}from"./vendor-react.DgFKySyv.js";import{V as m,S as J,O as K,e as Q,f as z,c as Z,a as ee,W as re,g as ne,h as oe}from"./three.module.Hv9STz0E.js";const k=8,te=`
#define MAX_COLORS ${k}
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer; // in NDC [-1,1]
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
uniform int uIterations;
uniform float uIntensity;
uniform float uBandWidth;
varying vec2 vUv;

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / uCanvas.y), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  vec2 toward = (uPointer - rp);
  q += toward * uMouseInfluence * 0.2;

    for (int j = 0; j < 5; j++) {
      if (j >= uIterations - 1) break;
      vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
      q += (rr - q) * 0.15;
    }

    vec3 col = vec3(0.0);
    float a = 1.0;

    if (uColorCount > 0) {
      vec2 s = q;
      vec3 sumCol = vec3(0.0);
      float cover = 0.0;
      for (int i = 0; i < MAX_COLORS; ++i) {
            if (i >= uColorCount) break;
            s -= 0.01;
            vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
            float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
            float kBelow = clamp(uWarpStrength, 0.0, 1.0);
            float kMix = pow(kBelow, 0.3); // strong response across 0..1
            float gain = 1.0 + max(uWarpStrength - 1.0, 0.0); // allow >1 to amplify displacement
            vec2 disp = (r - s) * kBelow;
            vec2 warped = s + disp * gain;
            float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
            float m = mix(m0, m1, kMix);
            float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
            sumCol += uColors[i] * w;
            cover = max(cover, w);
      }
      col = clamp(sumCol, 0.0, 1.0);
      a = uTransparent > 0 ? cover : 1.0;
    } else {
        vec2 s = q;
        for (int k = 0; k < 3; ++k) {
            s -= 0.01;
            vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
            float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
            float kBelow = clamp(uWarpStrength, 0.0, 1.0);
            float kMix = pow(kBelow, 0.3);
            float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
            vec2 disp = (r - s) * kBelow;
            vec2 warped = s + disp * gain;
            float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
            float m = mix(m0, m1, kMix);
            col[k] = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
        }
        a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
    }

    col *= uIntensity;

    if (uNoise > 0.0001) {
      float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
      col += (n - 0.5) * uNoise;
      col = clamp(col, 0.0, 1.0);
    }

    vec3 rgb = (uTransparent > 0) ? col * a : col;
    gl_FragColor = vec4(rgb, a);
}
`,ue=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;function ie({className:_,style:X,rotation:M=90,speed:v=.2,colors:T=[],transparent:i=!0,autoRotate:b=0,scale:p=1,frequency:d=1,warpStrength:h=1,mouseInfluence:g=1,parallax:C=.5,noise:y=.15,iterations:R=1,intensity:w=1.5,bandWidth:x=6}){const F=t.useRef(null),I=t.useRef(null),S=t.useRef(null),B=t.useRef(null),E=t.useRef(null),P=t.useRef(M),W=t.useRef(b),N=t.useRef(new m(0,0)),U=t.useRef(new m(0,0)),V=t.useRef(8);return t.useEffect(()=>{const r=F.current,u=new J,c=new K(-1,1,1,-1,0,1),a=new Q(2,2),o=Array.from({length:k},()=>new z(0,0,0)),e=new Z({vertexShader:ue,fragmentShader:te,uniforms:{uCanvas:{value:new m(1,1)},uTime:{value:0},uSpeed:{value:v},uRot:{value:new m(1,0)},uColorCount:{value:0},uColors:{value:o},uTransparent:{value:i?1:0},uScale:{value:p},uFrequency:{value:d},uWarpStrength:{value:h},uPointer:{value:new m(0,0)},uMouseInfluence:{value:g},uParallax:{value:C},uNoise:{value:y},uIterations:{value:R},uIntensity:{value:w},uBandWidth:{value:x}},premultipliedAlpha:!0,transparent:!0});B.current=e;const s=new ee(a,e);u.add(s);const n=new re({antialias:!1,powerPreference:"high-performance",alpha:!0});I.current=n,n.outputColorSpace=ne,n.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2)),n.setClearColor(0,i?0:1),n.domElement.style.width="100%",n.domElement.style.height="100%",n.domElement.style.display="block",r.appendChild(n.domElement);const O=new oe,q=()=>{const l=r.clientWidth||1,f=r.clientHeight||1;n.setSize(l,f,!1),e.uniforms.uCanvas.value.set(l,f)};if(q(),"ResizeObserver"in globalThis){const l=new ResizeObserver(q);l.observe(r),E.current=l}else globalThis.addEventListener("resize",q);const A=()=>{const l=O.getDelta(),f=O.elapsedTime;e.uniforms.uTime.value=f;const L=(P.current%360+W.current*f)*Math.PI/180,G=Math.cos(L),D=Math.sin(L);e.uniforms.uRot.value.set(G,D);const j=U.current,$=N.current,H=Math.min(1,l*V.current);j.lerp($,H),e.uniforms.uPointer.value.copy(j),n.render(u,c),S.current=requestAnimationFrame(A)};return S.current=requestAnimationFrame(A),()=>{S.current!==null&&cancelAnimationFrame(S.current),E.current?E.current.disconnect():globalThis.removeEventListener("resize",q),a.dispose(),e.dispose(),n.dispose(),n.forceContextLoss(),n.domElement&&n.domElement.parentElement===r&&n.domElement.remove()}},[x,d,w,R,g,y,C,p,v,i,h]),t.useEffect(()=>{const r=B.current,u=I.current;if(!r)return;P.current=M,W.current=b,r.uniforms.uSpeed.value=v,r.uniforms.uScale.value=p,r.uniforms.uFrequency.value=d,r.uniforms.uWarpStrength.value=h,r.uniforms.uMouseInfluence.value=g,r.uniforms.uParallax.value=C,r.uniforms.uNoise.value=y,r.uniforms.uIterations.value=R,r.uniforms.uIntensity.value=w,r.uniforms.uBandWidth.value=x;const c=o=>{const e=o.replace("#","").trim(),s=e.length===3?[Number.parseInt(e[0]+e[0],16),Number.parseInt(e[1]+e[1],16),Number.parseInt(e[2]+e[2],16)]:[Number.parseInt(e.slice(0,2),16),Number.parseInt(e.slice(2,4),16),Number.parseInt(e.slice(4,6),16)];return new z(s[0]/255,s[1]/255,s[2]/255)},a=(T||[]).filter(Boolean).slice(0,k).map(c);for(let o=0;o<k;o++){const e=r.uniforms.uColors.value[o];o<a.length?e.copy(a[o]):e.set(0,0,0)}r.uniforms.uColorCount.value=a.length,r.uniforms.uTransparent.value=i?1:0,u&&u.setClearColor(0,i?0:1)},[M,b,v,p,d,h,g,C,y,R,w,x,T,i]),t.useEffect(()=>{const r=B.current,u=F.current;if(!r||!u)return;const c=a=>{const o=u.getBoundingClientRect(),e=(a.clientX-o.left)/(o.width||1)*2-1,s=-((a.clientY-o.top)/(o.height||1)*2-1);N.current.set(e,s)};return u.addEventListener("pointermove",c),()=>{u.removeEventListener("pointermove",c)}},[]),Y.jsx("div",{ref:F,className:`w-full h-full relative overflow-hidden ${_}`,style:X})}export{ie as default};
