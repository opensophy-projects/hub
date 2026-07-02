import{r as u,j as re}from"./vendor-react.DgFKySyv.js";import{V as v,S as le,O as ae,W as ce,f as p,c as se,e as ue,a as fe,h as me}from"./three.module.Hv9STz0E.js";const de=`
precision highp float;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,ve=`
precision highp float;

uniform float iTime;
uniform vec3  iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform bool parallax;
uniform float parallaxStrength;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[8];
uniform int lineGradientCount;

const vec3 BLACK = vec3(0.0);
const vec3 PINK  = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE  = vec3(47.0,  75.0, 162.0) / 255.0;

mat2 rotate(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

vec3 background_color(vec2 uv) {
  vec3 col = vec3(0.0);

  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;

  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) {
    return baseColor;
  }

  vec3 gradientColor;
  
  if (lineGradientCount == 1) {
    gradientColor = lineGradient[0];
  } else {
    float clampedT = clamp(t, 0.0, 0.9999);
    float scaled = clampedT * float(lineGradientCount - 1);
    int idx = int(floor(scaled));
    float f = fract(scaled);
    int idx2 = min(idx + 1, lineGradientCount - 1);

    vec3 c1 = lineGradient[idx];
    vec3 c2 = lineGradient[idx2];
    
    gradientColor = mix(c1, c2, f);
  }
  
  return gradientColor * 0.5;
}

  float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;

  float x_offset   = offset;
  float x_movement = time * 0.1;
  float amp        = sin(offset + time * 0.2) * 0.3;
  float y          = sin(uv.x + x_offset + x_movement) * amp;

  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius);
    float bendOffset = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
    y += bendOffset;
  }

  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;
  
  if (parallax) {
    baseUv += parallaxOffset;
  }

  vec3 col = vec3(0.0);

  vec3 b = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }
  
  if (enableBottom) {
    for (int i = 0; i < bottomLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(bottomLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < middleLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(middleLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * fi,
        baseUv,
        mouseUv,
        interactive
      );
    }
  }

  if (enableTop) {
    for (int i = 0; i < topLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(topLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      ruv.x *= -1.0;
      col += lineCol * wave(
        ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.1;
    }
  }

  fragColor = vec4(col, 1.0);
}

void main() {
  vec4 color = vec4(0.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`,Z=8;function pe(m){let e=m.trim();e.startsWith("#")&&(e=e.slice(1));let i=255,r=255,l=255;return e.length===3?(i=Number.parseInt(e[0]+e[0],16),r=Number.parseInt(e[1]+e[1],16),l=Number.parseInt(e[2]+e[2],16)):e.length===6&&(i=Number.parseInt(e.slice(0,2),16),r=Number.parseInt(e.slice(2,4),16),l=Number.parseInt(e.slice(4,6),16)),new p(i/255,r/255,l/255)}function he({linesGradient:m,enabledWaves:e=["top","middle","bottom"],lineCount:i=[6],lineDistance:r=[5],topWavePosition:l,middleWavePosition:g,bottomWavePosition:h={x:2,y:-.7,rotate:-1},animationSpeed:P=1,interactive:b=!0,bendRadius:I=5,bendStrength:M=-.5,mouseDamping:x=.05,parallax:C=!0,parallaxStrength:L=.2,mixBlendMode:$="screen"}){const G=u.useRef(null),O=u.useRef(new v(-1e3,-1e3)),S=u.useRef(new v(-1e3,-1e3)),w=u.useRef(0),R=u.useRef(0),B=u.useRef(new v(0,0)),T=u.useRef(new v(0,0)),U=o=>{if(typeof i=="number")return i;if(!e.includes(o))return 0;const a=e.indexOf(o);return i[a]??6},E=o=>{if(typeof r=="number")return r;if(!e.includes(o))return .1;const a=e.indexOf(o);return r[a]??.1},_=e.includes("top")?U("top"):0,N=e.includes("middle")?U("middle"):0,z=e.includes("bottom")?U("bottom"):0,A=e.includes("top")?E("top")*.01:.01,D=e.includes("middle")?E("middle")*.01:.01,F=e.includes("bottom")?E("bottom")*.01:.01;return u.useEffect(()=>{const o=G.current;if(!o)return;let a=!0;const K=new le,V=new ae(-1,1,1,-1,0,1);V.position.z=1;const t=new ce({antialias:!0,alpha:!1});t.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),t.domElement.style.width="100%",t.domElement.style.height="100%",o.appendChild(t.domElement);const c={iTime:{value:0},iResolution:{value:new p(1,1,1)},animationSpeed:{value:P},enableTop:{value:e.includes("top")},enableMiddle:{value:e.includes("middle")},enableBottom:{value:e.includes("bottom")},topLineCount:{value:_},middleLineCount:{value:N},bottomLineCount:{value:z},topLineDistance:{value:A},middleLineDistance:{value:D},bottomLineDistance:{value:F},topWavePosition:{value:new p(l?.x??10,l?.y??.5,l?.rotate??-.4)},middleWavePosition:{value:new p(g?.x??5,g?.y??0,g?.rotate??.2)},bottomWavePosition:{value:new p(h?.x??2,h?.y??-.7,h?.rotate??.4)},iMouse:{value:new v(-1e3,-1e3)},interactive:{value:b},bendRadius:{value:I},bendStrength:{value:M},bendInfluence:{value:0},parallax:{value:C},parallaxStrength:{value:L},parallaxOffset:{value:new v(0,0)},lineGradient:{value:Array.from({length:Z},()=>new p(1,1,1))},lineGradientCount:{value:0}};if(m&&m.length>0){const f=m.slice(0,Z);c.lineGradientCount.value=f.length,f.forEach((n,d)=>{const s=pe(n);c.lineGradient.value[d].set(s.x,s.y,s.z)})}const j=new se({uniforms:c,vertexShader:de,fragmentShader:ve}),k=new ue(2,2),W=new fe(k,j);K.add(W);const ee=new me,X=()=>{if(!a)return;const f=o.clientWidth||1,n=o.clientHeight||1;t.setSize(f,n,!1);const d=t.domElement.width,s=t.domElement.height;c.iResolution.value.set(d,s,1)};X();const y=typeof ResizeObserver>"u"?null:new ResizeObserver(()=>{a&&X()});y&&y.observe(o);const Y=f=>{const n=t.domElement.getBoundingClientRect(),d=f.clientX-n.left,s=f.clientY-n.top,Q=t.getPixelRatio();if(O.current.set(d*Q,(n.height-s)*Q),w.current=1,C){const te=n.width/2,oe=n.height/2,ne=(d-te)/n.width,ie=-(s-oe)/n.height;B.current.set(ne*L,ie*L)}},H=()=>{w.current=0};b&&(t.domElement.addEventListener("pointermove",Y),t.domElement.addEventListener("pointerleave",H));let q=0;const J=()=>{a&&(c.iTime.value=ee.getElapsedTime(),b&&(S.current.lerp(O.current,x),c.iMouse.value.copy(S.current),R.current+=(w.current-R.current)*x,c.bendInfluence.value=R.current),C&&(T.current.lerp(B.current,x),c.parallaxOffset.value.copy(T.current)),t.render(K,V),q=requestAnimationFrame(J))};return J(),()=>{a=!1,cancelAnimationFrame(q),y&&y.disconnect(),b&&(t.domElement.removeEventListener("pointermove",Y),t.domElement.removeEventListener("pointerleave",H)),k.dispose(),j.dispose(),t.dispose(),t.forceContextLoss(),t.domElement.remove()}},[m,e,i,r,_,N,z,A,D,F,l,g,h,P,b,I,M,x,C,L]),re.jsx("div",{ref:G,className:"relative w-full h-full overflow-hidden floating-lines-container",style:{mixBlendMode:$}})}export{he as default};
