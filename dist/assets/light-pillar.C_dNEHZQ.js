import{r as t,j as ee}from"./vendor-react.DgFKySyv.js";import{V as te,S as ce,O as fe,W as me,c as de,e as ve,a as he,C as z,f as A}from"./three.module.Hv9STz0E.js";const we=({topColor:d="#5227FF",bottomColor:v="#FF9FFC",intensity:h=1,rotationSpeed:T=.3,interactive:i=!1,className:F="",glowAmount:p=.005,pillarWidth:g=3,pillarHeight:R=.4,noiseIntensity:w=.5,mixBlendMode:L="screen",pillarRotation:a=0,quality:x="high"})=>{const s=t.useRef(null),l=t.useRef(null),u=t.useRef(null),e=t.useRef(null),P=t.useRef(null),S=t.useRef(null),C=t.useRef(null),j=t.useRef(new te(0,0)),y=t.useRef(0),N=t.useRef(T),[I,D]=t.useState(!0);return t.useEffect(()=>{const r=document.createElement("canvas");r.getContext("webgl")||r.getContext("experimental-webgl")||D(!1)},[]),t.useEffect(()=>{if(!s.current||!I)return;const r=s.current,M=r.clientWidth,G=r.clientHeight,O=/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),re=O||navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4;let c=x;re&&x==="high"&&(c="medium"),O&&x!=="low"&&(c="low");const B={low:{iterations:24,waveIterations:1,pixelRatio:.5,precision:"mediump",stepMultiplier:1.5},medium:{iterations:40,waveIterations:2,pixelRatio:.65,precision:"mediump",stepMultiplier:1.2},high:{iterations:80,waveIterations:4,pixelRatio:Math.min(globalThis.devicePixelRatio,2),precision:"highp",stepMultiplier:1}},f=B[c]||B.medium,V=new ce;P.current=V;const oe=new fe(-1,1,1,-1,0,1);S.current=oe;let m;try{m=new me({antialias:!1,alpha:!0,powerPreference:c==="low"?"low-power":"high-performance",precision:f.precision,stencil:!1,depth:!1})}catch(o){console.error("Failed to create WebGL renderer:",o),D(!1);return}m.setSize(M,G),m.setPixelRatio(f.pixelRatio),r.appendChild(m.domElement),u.current=m;const _=o=>{const n=new z(o);return new A(n.r,n.g,n.b)},ne=`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `,ue=`
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform vec3 uTopColor;
      uniform vec3 uBottomColor;
      uniform float uIntensity;
      uniform bool uInteractive;
      uniform float uGlowAmount;
      uniform float uPillarWidth;
      uniform float uPillarHeight;
      uniform float uNoiseIntensity;
      uniform float uPillarRotation;
      uniform float uRotCos;
      uniform float uRotSin;
      uniform float uPillarRotCos;
      uniform float uPillarRotSin;
      uniform float uWaveSin[4];
      uniform float uWaveCos[4];
      varying vec2 vUv;

      const float PI = 3.141592653589793;
      const float EPSILON = 0.001;
      const float E = 2.71828182845904523536;

      float noise(vec2 coord) {
        vec2 r = (E * sin(E * coord));
        return fract(r.x * r.y * (1.0 + coord.x));
      }

      void main() {
        vec2 fragCoord = vUv * uResolution;
        vec2 uv = (fragCoord * 2.0 - uResolution) / uResolution.y;

        uv = vec2(
          uv.x * uPillarRotCos - uv.y * uPillarRotSin,
          uv.x * uPillarRotSin + uv.y * uPillarRotCos
        );

        vec3 origin = vec3(0.0, 0.0, -10.0);
        vec3 direction = normalize(vec3(uv, 1.0));

        float maxDepth = 50.0;
        float depth = 0.1;

        float rotCos = uRotCos;
        float rotSin = uRotSin;
        if(uInteractive && length(uMouse) > 0.0) {
          float mouseAngle = uMouse.x * PI * 2.0;
          rotCos = cos(mouseAngle);
          rotSin = sin(mouseAngle);
        }

        vec3 color = vec3(0.0);

        const int ITERATIONS = ${f.iterations};
        const int WAVE_ITERATIONS = ${f.waveIterations};
        const float STEP_MULT = ${f.stepMultiplier.toFixed(1)};

        for(int i = 0; i < ITERATIONS; i++) {
          vec3 pos = origin + direction * depth;

          float newX = pos.x * rotCos - pos.z * rotSin;
          float newZ = pos.x * rotSin + pos.z * rotCos;
          pos.x = newX;
          pos.z = newZ;

          vec3 deformed = pos;
          deformed.y *= uPillarHeight;
          deformed = deformed + vec3(0.0, uTime, 0.0);

          float frequency = 1.0;
          float amplitude = 1.0;
          for(int j = 0; j < WAVE_ITERATIONS; j++) {
            float wx = deformed.x * uWaveCos[j] - deformed.z * uWaveSin[j];
            float wz = deformed.x * uWaveSin[j] + deformed.z * uWaveCos[j];
            deformed.x = wx;
            deformed.z = wz;

            float phase = uTime * float(j) * 2.0;
            vec3 oscillation = cos(deformed.zxy * frequency - phase);
            deformed += oscillation * amplitude;
            frequency *= 2.0;
            amplitude *= 0.5;
          }

          vec2 cosinePair = cos(deformed.xz);
          float fieldDistance = length(cosinePair) - 0.2;

          float radialBound = length(pos.xz) - uPillarWidth;
          float k = 4.0;
          float h = max(k - abs(-radialBound - (-fieldDistance)), 0.0);
          fieldDistance = -(min(-radialBound, -fieldDistance) - h * h * 0.25 / k);

          fieldDistance = abs(fieldDistance) * 0.15 + 0.01;

          vec3 gradient = mix(uBottomColor, uTopColor, smoothstep(15.0, -15.0, pos.y));
          color += gradient / fieldDistance;

          if(fieldDistance < EPSILON || depth > maxDepth) break;
          depth += fieldDistance * STEP_MULT;
        }

        float widthNormalization = uPillarWidth / 3.0;
        color = tanh(color * uGlowAmount / widthNormalization);

        float rnd = noise(gl_FragCoord.xy);
        color -= rnd / 15.0 * uNoiseIntensity;

        gl_FragColor = vec4(color * uIntensity, 1.0);
      }
    `,k=.4,U=new Float32Array(4),$=new Float32Array(4);for(let o=0;o<4;o++)U[o]=Math.sin(k),$[o]=Math.cos(k);const H=a*Math.PI/180,ie=Math.cos(H),se=Math.sin(H),q=new de({vertexShader:ne,fragmentShader:ue,uniforms:{uTime:{value:0},uResolution:{value:new te(M,G)},uMouse:{value:j.current},uTopColor:{value:_(d)},uBottomColor:{value:_(v)},uIntensity:{value:h},uInteractive:{value:i},uGlowAmount:{value:p},uPillarWidth:{value:g},uPillarHeight:{value:R},uNoiseIntensity:{value:w},uPillarRotation:{value:a},uRotCos:{value:1},uRotSin:{value:0},uPillarRotCos:{value:ie},uPillarRotSin:{value:se},uWaveSin:{value:U},uWaveCos:{value:$}},transparent:!0,depthWrite:!1,depthTest:!1});e.current=q;const X=new ve(2,2);C.current=X;const ae=new he(X,q);V.add(ae);let b=null;const Z=o=>{if(!i||b)return;b=globalThis.setTimeout(()=>{b=null},16);const n=r.getBoundingClientRect(),E=(o.clientX-n.left)/n.width*2-1,le=-((o.clientY-n.top)/n.height)*2+1;j.current.set(E,le)};i&&r.addEventListener("mousemove",Z,{passive:!0});let Q=performance.now();const Y=1e3/(c==="low"?30:60),J=o=>{if(!e.current||!u.current||!P.current||!S.current)return;const n=o-Q;if(n>=Y){y.current+=.016*N.current,e.current.uniforms.uTime.value=y.current;const E=y.current*.3;e.current.uniforms.uRotCos.value=Math.cos(E),e.current.uniforms.uRotSin.value=Math.sin(E),u.current.render(P.current,S.current),Q=o-n%Y}l.current=requestAnimationFrame(J)};l.current=requestAnimationFrame(J);let W=null;const K=()=>{W&&clearTimeout(W),W=globalThis.setTimeout(()=>{if(!u.current||!e.current||!s.current)return;const o=s.current.clientWidth,n=s.current.clientHeight;u.current.setSize(o,n),e.current.uniforms.uResolution.value.set(o,n)},150)};return globalThis.addEventListener("resize",K,{passive:!0}),()=>{globalThis.removeEventListener("resize",K),i&&r.removeEventListener("mousemove",Z),l.current&&cancelAnimationFrame(l.current),u.current&&(u.current.dispose(),u.current.forceContextLoss(),r.contains(u.current.domElement)&&u.current.domElement.remove()),e.current&&e.current.dispose(),C.current&&C.current.dispose(),u.current=null,e.current=null,P.current=null,S.current=null,C.current=null,l.current=null}},[I,x,d,v,h,p,w,g,R,a,i]),t.useEffect(()=>{N.current=T},[T]),t.useEffect(()=>{if(!e.current)return;const r=new z(d);e.current.uniforms.uTopColor.value=new A(r.r,r.g,r.b)},[d]),t.useEffect(()=>{if(!e.current)return;const r=new z(v);e.current.uniforms.uBottomColor.value=new A(r.r,r.g,r.b)},[v]),t.useEffect(()=>{e.current&&(e.current.uniforms.uIntensity.value=h)},[h]),t.useEffect(()=>{e.current&&(e.current.uniforms.uInteractive.value=i)},[i]),t.useEffect(()=>{e.current&&(e.current.uniforms.uGlowAmount.value=p)},[p]),t.useEffect(()=>{e.current&&(e.current.uniforms.uPillarWidth.value=g)},[g]),t.useEffect(()=>{e.current&&(e.current.uniforms.uPillarHeight.value=R)},[R]),t.useEffect(()=>{e.current&&(e.current.uniforms.uNoiseIntensity.value=w)},[w]),t.useEffect(()=>{if(!e.current)return;const r=a*Math.PI/180;e.current.uniforms.uPillarRotCos.value=Math.cos(r),e.current.uniforms.uPillarRotSin.value=Math.sin(r)},[a]),I?ee.jsx("div",{ref:s,className:`w-full h-full ${F}`,style:{position:"absolute",inset:0,mixBlendMode:L}}):ee.jsx("div",{className:`w-full h-full flex items-center justify-center bg-black/10 text-gray-500 text-sm ${F}`,style:{mixBlendMode:L},children:"WebGL not supported"})};export{we as default};
