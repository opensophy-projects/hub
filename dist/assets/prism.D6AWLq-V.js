import{r as se,j as Fe}from"./vendor-react.DgFKySyv.js";import{R as Le,P as Oe,M as _e}from"./Mesh.uU8OXhrh.js";import{T as Ce}from"./Triangle.DvAgNkJ_.js";const Ne=({height:z=3.5,baseWidth:U=5.5,animationType:f="rotate",glow:q=1,offset:g={x:0,y:0},noise:W=.5,transparent:H=!0,scale:N=3.6,hueShift:Y=0,colorFrequency:j=1,hoverStrength:G=2,inertia:X=.05,bloom:D=1,suspendWhenOffscreen:E=!1,timeScale:V=.5})=>{const Z=se.useRef(null);return se.useEffect(()=>{const s=Z.current;if(!s)return;const S=Math.max(.001,z),I=Math.max(.001,U)*.5,ie=Math.max(0,q),k=Math.max(0,W),re=g?.x??0,le=g?.y??0,ce=H?1.5:1,P=Math.max(.001,N),ue=Y||0,fe=Math.max(0,j||1),me=Math.max(0,D||1),ve=1,he=1,de=1,R=Math.max(0,V||1),Q=Math.max(0,G||1),J=Math.max(0,Math.min(1,X||.12)),T=Math.min(2,globalThis.devicePixelRatio||1),y=new Le({dpr:T,alpha:H,antialias:!1}),o=y.gl;o.disable(o.DEPTH_TEST),o.disable(o.CULL_FACE),o.disable(o.BLEND),Object.assign(o.canvas.style,{position:"absolute",inset:"0",width:"100%",height:"100%",display:"block"}),s.appendChild(o.canvas);const xe=`
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,pe=`
      precision highp float;

      uniform vec2  iResolution;
      uniform float iTime;

      uniform float uHeight;
      uniform float uBaseHalf;
      uniform mat3  uRot;
      uniform int   uUseBaseWobble;
      uniform float uGlow;
      uniform vec2  uOffsetPx;
      uniform float uNoise;
      uniform float uSaturation;
      uniform float uScale;
      uniform float uHueShift;
      uniform float uColorFreq;
      uniform float uBloom;
      uniform float uCenterShift;
      uniform float uInvBaseHalf;
      uniform float uInvHeight;
      uniform float uMinAxis;
      uniform float uPxScale;
      uniform float uTimeScale;

      vec4 tanh4(vec4 x){
        vec4 e2x = exp(2.0*x);
        return (e2x - 1.0) / (e2x + 1.0);
      }

      float rand(vec2 co){
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float sdOctaAnisoInv(vec3 p){
        vec3 q = vec3(abs(p.x) * uInvBaseHalf, abs(p.y) * uInvHeight, abs(p.z) * uInvBaseHalf);
        float m = q.x + q.y + q.z - 1.0;
        return m * uMinAxis * 0.5773502691896258;
      }

      float sdPyramidUpInv(vec3 p){
        float oct = sdOctaAnisoInv(p);
        float halfSpace = -p.y;
        return max(oct, halfSpace);
      }

      mat3 hueRotation(float a){
        float c = cos(a), s = sin(a);
        mat3 W = mat3(
          0.299, 0.587, 0.114,
          0.299, 0.587, 0.114,
          0.299, 0.587, 0.114
        );
        mat3 U = mat3(
           0.701, -0.587, -0.114,
          -0.299,  0.413, -0.114,
          -0.300, -0.588,  0.886
        );
        mat3 V = mat3(
           0.168, -0.331,  0.500,
           0.328,  0.035, -0.500,
          -0.497,  0.296,  0.201
        );
        return W + U * c + V * s;
      }

      void main(){
        vec2 f = (gl_FragCoord.xy - 0.5 * iResolution.xy - uOffsetPx) * uPxScale;

        float z = 5.0;
        float d = 0.0;

        vec3 p;
        vec4 o = vec4(0.0);

        float centerShift = uCenterShift;
        float cf = uColorFreq;

        mat2 wob = mat2(1.0);
        if (uUseBaseWobble == 1) {
          float t = iTime * uTimeScale;
          float c0 = cos(t + 0.0);
          float c1 = cos(t + 33.0);
          float c2 = cos(t + 11.0);
          wob = mat2(c0, c1, c2, c0);
        }

        const int STEPS = 100;
        for (int i = 0; i < STEPS; i++) {
          p = vec3(f, z);
          p.xz = p.xz * wob;
          p = uRot * p;
          vec3 q = p;
          q.y += centerShift;
          d = 0.1 + 0.2 * abs(sdPyramidUpInv(q));
          z -= d;
          o += (sin((p.y + z) * cf + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
        }

        o = tanh4(o * o * (uGlow * uBloom) / 1e5);

        vec3 col = o.rgb;
        float n = rand(gl_FragCoord.xy + vec2(iTime));
        col += (n - 0.5) * uNoise;
        col = clamp(col, 0.0, 1.0);

        float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col = clamp(mix(vec3(L), col, uSaturation), 0.0, 1.0);

        if(abs(uHueShift) > 0.0001){
          col = clamp(hueRotation(uHueShift) * col, 0.0, 1.0);
        }

        gl_FragColor = vec4(col, o.a);
      }
    `,be=new Ce(o),A=new Float32Array(2),F=new Float32Array(2),i=new Oe(o,{vertex:xe,fragment:pe,uniforms:{iResolution:{value:A},iTime:{value:0},uHeight:{value:S},uBaseHalf:{value:I},uUseBaseWobble:{value:1},uRot:{value:new Float32Array([1,0,0,0,1,0,0,0,1])},uGlow:{value:ie},uOffsetPx:{value:F},uNoise:{value:k},uSaturation:{value:ce},uScale:{value:P},uHueShift:{value:ue},uColorFreq:{value:fe},uBloom:{value:me},uCenterShift:{value:S*.25},uInvBaseHalf:{value:1/I},uInvHeight:{value:1/S},uMinAxis:{value:Math.min(I,S)},uPxScale:{value:1/((o.drawingBufferHeight||1)*.1*P)},uTimeScale:{value:R}}}),Me=new _e(o,{geometry:be,program:i}),K=()=>{const e=s.clientWidth||1,t=s.clientHeight||1;y.setSize(e,t),A[0]=o.drawingBufferWidth,A[1]=o.drawingBufferHeight,F[0]=re*T,F[1]=le*T,i.uniforms.uPxScale.value=1/((o.drawingBufferHeight||1)*.1*P)},$=new ResizeObserver(K);$.observe(s),K();const L=new Float32Array(9),ee=(e,t,n,a)=>{const c=Math.cos(e),u=Math.sin(e),d=Math.cos(t),p=Math.sin(t),b=Math.cos(n),M=Math.sin(n);return a[0]=c*b+u*p*M,a[1]=d*M,a[2]=-u*b+c*p*M,a[3]=-c*M+u*p*b,a[4]=d*b,a[5]=u*M+c*p*b,a[6]=u*d,a[7]=-p,a[8]=c*d,a},ge=e=>(e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=1,e[5]=0,e[6]=0,e[7]=0,e[8]=1,e),Se=k<1e-6;let l=0;const Re=performance.now(),w=()=>{l||(l=requestAnimationFrame(ne))},te=()=>{l&&(cancelAnimationFrame(l),l=0)},x=()=>Math.random(),we=(.3+x()*.6)*ve,Be=(.2+x()*.7)*he,He=(.1+x()*.5)*de,Ee=x()*Math.PI*2,Ie=x()*Math.PI*2;let m=0,v=0,h=0,O=0,_=0;const C=(e,t,n)=>e+(t-e)*n,r={x:0,y:0,inside:!0},Pe=e=>{const t=Math.max(1,globalThis.innerWidth),n=Math.max(1,globalThis.innerHeight),a=t*.5,c=n*.5,u=(e.clientX-a)/(t*.5),d=(e.clientY-c)/(n*.5);r.x=Math.max(-1,Math.min(1,u)),r.y=Math.max(-1,Math.min(1,d)),r.inside=!0},oe=()=>{r.inside=!1},ae=()=>{r.inside=!1},Te=()=>{const e=.6*Q,t=.6*Q;return O=(r.inside?-r.x:0)*t,_=(r.inside?r.y:0)*e,m=C(m,O,J),v=C(v,_,J),h=C(h,0,.1),i.uniforms.uRot.value=ee(m,v,h,L),Se?!(Math.abs(m-O)<1e-4&&Math.abs(v-_)<1e-4&&Math.abs(h)<1e-4):!0},ye=e=>{const t=e*R;return m=t*Be,v=Math.sin(t*we+Ee)*.6,h=Math.sin(t*He+Ie)*.5,i.uniforms.uRot.value=ee(m,v,h,L),R>=1e-6},Ae=()=>(i.uniforms.uRot.value=ge(L),R>=1e-6);let B=null;f==="hover"?(B=e=>{Pe(e),w()},globalThis.addEventListener("pointermove",B,{passive:!0}),globalThis.addEventListener("mouseleave",oe),globalThis.addEventListener("blur",ae),i.uniforms.uUseBaseWobble.value=0):f==="3drotate"?i.uniforms.uUseBaseWobble.value=0:i.uniforms.uUseBaseWobble.value=1;const ne=e=>{const t=(e-Re)*.001;i.uniforms.iTime.value=t;let n;f==="hover"?n=Te():f==="3drotate"?n=ye(t):n=Ae(),y.render({scene:Me}),n?l=requestAnimationFrame(ne):l=0};if(E){const e=new IntersectionObserver(t=>{t.some(a=>a.isIntersecting)?w():te()});e.observe(s),w(),s.__prismIO=e}else w();return()=>{if(te(),$.disconnect(),f==="hover"&&(B&&globalThis.removeEventListener("pointermove",B),globalThis.removeEventListener("mouseleave",oe),globalThis.removeEventListener("blur",ae)),E){const e=s.__prismIO;e&&e.disconnect(),delete s.__prismIO}o.canvas.parentElement===s&&o.canvas.remove()}},[z,U,f,q,W,g?.x,g?.y,N,H,Y,j,V,G,X,D,E]),Fe.jsx("div",{className:"w-full h-full relative",ref:Z})};export{Ne as default};
