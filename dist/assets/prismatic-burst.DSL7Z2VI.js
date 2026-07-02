import{r as n,j as B}from"./vendor-react.DgFKySyv.js";import{R as k,P as J,M as K}from"./Mesh.uU8OXhrh.js";import{T as Q}from"./Texture.BkQWYNP2.js";import{T as $}from"./Triangle.DvAgNkJ_.js";const ee=`#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
}
`,te=`#version 300 es
precision highp float;
precision highp int;

out vec4 fragColor;

uniform vec2  uResolution;
uniform float uTime;

uniform float uIntensity;
uniform float uSpeed;
uniform int   uAnimType;
uniform vec2  uMouse;
uniform int   uColorCount;
uniform float uDistort;
uniform vec2  uOffset;
uniform sampler2D uGradient;
uniform float uNoiseAmount;
uniform int   uRayCount;

float hash21(vec2 p){
    p = floor(p);
    float f = 52.9829189 * fract(dot(p, vec2(0.065, 0.005)));
    return fract(f);
}

mat2 rot30(){ return mat2(0.8, -0.5, 0.5, 0.8); }

float layeredNoise(vec2 fragPx){
    vec2 p = mod(fragPx + vec2(uTime * 30.0, -uTime * 21.0), 1024.0);
    vec2 q = rot30() * p;
    float n = 0.0;
    n += 0.40 * hash21(q);
    n += 0.25 * hash21(q * 2.0 + 17.0);
    n += 0.20 * hash21(q * 4.0 + 47.0);
    n += 0.10 * hash21(q * 8.0 + 113.0);
    n += 0.05 * hash21(q * 16.0 + 191.0);
    return n;
}

vec3 rayDir(vec2 frag, vec2 res, vec2 offset, float dist){
    float focal = res.y * max(dist, 1e-3);
    return normalize(vec3(2.0 * (frag - offset) - res, focal));
}

float edgeFade(vec2 frag, vec2 res, vec2 offset){
    vec2 toC = frag - 0.5 * res - offset;
    float r = length(toC) / (0.5 * min(res.x, res.y));
    float x = clamp(r, 0.0, 1.0);
    float q = x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
    float s = q * 0.5;
    s = pow(s, 1.5);
    float tail = 1.0 - pow(1.0 - s, 2.0);
    s = mix(s, tail, 0.2);
    float dn = (layeredNoise(frag * 0.15) - 0.5) * 0.0015 * s;
    return clamp(s + dn, 0.0, 1.0);
}

mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1.0,0.0,0.0, 0.0,c,-s, 0.0,s,c); }
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0.0,s, 0.0,1.0,0.0, -s,0.0,c); }
mat3 rotZ(float a){ float c = cos(a), s = sin(a); return mat3(c,-s,0.0, s,c,0.0, 0.0,0.0,1.0); }

vec3 sampleGradient(float t){
    t = clamp(t, 0.0, 1.0);
    return texture(uGradient, vec2(t, 0.5)).rgb;
}

vec2 rot2(vec2 v, float a){
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c) * v;
}

float bendAngle(vec3 q, float t){
    float a = 0.8 * sin(q.x * 0.55 + t * 0.6)
            + 0.7 * sin(q.y * 0.50 - t * 0.5)
            + 0.6 * sin(q.z * 0.60 + t * 0.7);
    return a;
}

void main(){
    vec2 frag = gl_FragCoord.xy;
    float t = uTime * uSpeed;
    float jitterAmp = 0.1 * clamp(uNoiseAmount, 0.0, 1.0);
    vec3 dir = rayDir(frag, uResolution, uOffset, 1.0);
    float marchT = 0.0;
    vec3 col = vec3(0.0);
    float n = layeredNoise(frag);
    vec4 c = cos(t * 0.2 + vec4(0.0, 33.0, 11.0, 0.0));
    mat2 M2 = mat2(c.x, c.y, c.z, c.w);
    float amp = clamp(uDistort, 0.0, 50.0) * 0.15;

    mat3 rot3dMat = mat3(1.0);
    if(uAnimType == 1){
      vec3 ang = vec3(t * 0.31, t * 0.21, t * 0.17);
      rot3dMat = rotZ(ang.z) * rotY(ang.y) * rotX(ang.x);
    }
    mat3 hoverMat = mat3(1.0);
    if(uAnimType == 2){
      vec2 m = uMouse * 2.0 - 1.0;
      vec3 ang = vec3(m.y * 0.6, m.x * 0.6, 0.0);
      hoverMat = rotY(ang.y) * rotX(ang.x);
    }

    for (int i = 0; i < 44; ++i) {
        vec3 P = marchT * dir;
        P.z -= 2.0;
        float rad = length(P);
        vec3 Pl = P * (10.0 / max(rad, 1e-6));

        if(uAnimType == 0){
            Pl.xz *= M2;
        } else if(uAnimType == 1){
      Pl = rot3dMat * Pl;
        } else {
      Pl = hoverMat * Pl;
        }

        float stepLen = min(rad - 0.3, n * jitterAmp) + 0.1;

        float grow = smoothstep(0.35, 3.0, marchT);
        float a1 = amp * grow * bendAngle(Pl * 0.6, t);
        float a2 = 0.5 * amp * grow * bendAngle(Pl.zyx * 0.5 + 3.1, t * 0.9);
        vec3 Pb = Pl;
        Pb.xz = rot2(Pb.xz, a1);
        Pb.xy = rot2(Pb.xy, a2);

        float rayPattern = smoothstep(
            0.5, 0.7,
            sin(Pb.x + cos(Pb.y) * cos(Pb.z)) *
            sin(Pb.z + sin(Pb.y) * cos(Pb.x + t))
        );

        if (uRayCount > 0) {
            float ang = atan(Pb.y, Pb.x);
            float comb = 0.5 + 0.5 * cos(float(uRayCount) * ang);
            comb = pow(comb, 3.0);
            rayPattern *= smoothstep(0.15, 0.95, comb);
        }

        vec3 spectralDefault = 1.0 + vec3(
            cos(marchT * 3.0 + 0.0),
            cos(marchT * 3.0 + 1.0),
            cos(marchT * 3.0 + 2.0)
        );

        float saw = fract(marchT * 0.25);
        float tRay = saw * saw * (3.0 - 2.0 * saw);
        vec3 userGradient = 2.0 * sampleGradient(tRay);
        vec3 spectral = (uColorCount > 0) ? userGradient : spectralDefault;
        vec3 base = (0.05 / (0.4 + stepLen))
                  * smoothstep(5.0, 0.0, rad)
                  * spectral;

        col += base * rayPattern;
        marchT += stepLen;
    }

    col *= edgeFade(frag, uResolution, uOffset);
    col *= uIntensity;

    fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`,re=l=>{let a=l.trim();if(a.startsWith("#")&&(a=a.slice(1)),a.length===3){const p=a[0],d=a[1],b=a[2];a=p+p+d+d+b+b}const c=Number.parseInt(a,16);if(Number.isNaN(c)||a.length!==6&&a.length!==8)return[1,1,1];const g=(c>>16&255)/255,y=(c>>8&255)/255,x=(c&255)/255;return[g,y,x]},H=l=>{if(l==null)return 0;if(typeof l=="number")return l;const a=String(l).trim(),c=Number.parseFloat(a.replace("px",""));return Number.isNaN(c)?0:c},ie=({intensity:l=2,speed:a=.5,animationType:c="rotate3d",colors:g,distort:y=0,paused:x=!1,offset:p={x:0,y:0},hoverDampness:d=0,rayCount:b,mixBlendMode:v="lighten"})=>{const O=n.useRef(null),z=n.useRef(null),R=n.useRef(null),F=n.useRef([.5,.5]),Z=n.useRef([.5,.5]),S=n.useRef(x),T=n.useRef(null),_=n.useRef(d),Y=n.useRef(!0),L=n.useRef(null),U=n.useRef(null);return n.useEffect(()=>{S.current=x},[x]),n.useEffect(()=>{_.current=d},[d]),n.useEffect(()=>{const e=O.current;if(!e)return;const A=Math.min(globalThis.devicePixelRatio||1,2),r=new k({dpr:A,alpha:!1,antialias:!1});R.current=r;const t=r.gl;t.canvas.style.position="absolute",t.canvas.style.inset="0",t.canvas.style.width="100%",t.canvas.style.height="100%",t.canvas.style.mixBlendMode=v&&v!=="none"?v:"",e.appendChild(t.canvas);const q=new Uint8Array([255,255,255,255]),h=new Q(t,{image:q,width:1,height:1,generateMipmaps:!1,flipY:!1});h.minFilter=t.LINEAR,h.magFilter=t.LINEAR,h.wrapS=t.CLAMP_TO_EDGE,h.wrapT=t.CLAMP_TO_EDGE,T.current=h;const i=new J(t,{vertex:ee,fragment:te,uniforms:{uResolution:{value:[1,1]},uTime:{value:0},uIntensity:{value:1},uSpeed:{value:1},uAnimType:{value:0},uMouse:{value:[.5,.5]},uColorCount:{value:0},uDistort:{value:0},uOffset:{value:[0,0]},uGradient:{value:h},uNoiseAmount:{value:.8},uRayCount:{value:0}}});z.current=i;const f=new $(t),M=new K(t,{geometry:f,program:i});U.current=f,L.current=M;const u=()=>{const o=e.clientWidth||1,m=e.clientHeight||1;r.setSize(o,m),i.uniforms.uResolution.value=[t.drawingBufferWidth,t.drawingBufferHeight]};let s=null;"ResizeObserver"in globalThis?(s=new ResizeObserver(u),s.observe(e)):globalThis.addEventListener("resize",u),u();const E=o=>{const m=e.getBoundingClientRect(),G=(o.clientX-m.left)/Math.max(m.width,1),I=(o.clientY-m.top)/Math.max(m.height,1);F.current=[Math.min(Math.max(G,0),1),Math.min(Math.max(I,0),1)]};e.addEventListener("pointermove",E,{passive:!0});let P=null;"IntersectionObserver"in globalThis&&(P=new IntersectionObserver(o=>{o[0]&&(Y.current=o[0].isIntersecting)},{root:null,threshold:.01}),P.observe(e));const C=()=>{};document.addEventListener("visibilitychange",C);let N=0,j=performance.now(),X=0;const D=o=>{const m=Math.max(0,o-j)*.001;j=o;const G=Y.current&&!document.hidden;if(S.current||(X+=m),!G){N=requestAnimationFrame(D);return}const I=.02+Math.max(0,Math.min(1,_.current))*.5,V=1-Math.exp(-m/I),W=F.current,w=Z.current;w[0]+=(W[0]-w[0])*V,w[1]+=(W[1]-w[1])*V,i.uniforms.uMouse.value=w,i.uniforms.uTime.value=X,r.render({scene:L.current}),N=requestAnimationFrame(D)};return N=requestAnimationFrame(D),()=>{cancelAnimationFrame(N),e.removeEventListener("pointermove",E),s?.disconnect(),s||globalThis.removeEventListener("resize",u),P?.disconnect(),document.removeEventListener("visibilitychange",C),t.canvas.remove(),L.current=null,U.current=null,z.current=null;try{const o=R.current?.gl;o&&T.current?.texture&&o.deleteTexture(T.current.texture)}catch{}R.current=null,T.current=null}},[v]),n.useEffect(()=>{const e=R.current?.gl?.canvas;e&&(e.style.mixBlendMode=v&&v!=="none"?v:"")},[v]),n.useEffect(()=>{const e=z.current,A=R.current,r=T.current;if(!e||!A||!r)return;e.uniforms.uIntensity.value=l??1,e.uniforms.uSpeed.value=a??1;const t={rotate:0,rotate3d:1,hover:2};e.uniforms.uAnimType.value=t[c??"rotate"],e.uniforms.uDistort.value=typeof y=="number"?y:0;const q=H(p?.x),h=H(p?.y);e.uniforms.uOffset.value=[q,h],e.uniforms.uRayCount.value=Math.max(0,Math.floor(b??0));let i=0;if(Array.isArray(g)&&g.length>0){const f=A.gl,M=g.slice(0,64);i=M.length;const u=new Uint8Array(i*4);for(let s=0;s<i;s++){const[E,P,C]=re(M[s]);u[s*4+0]=Math.round(E*255),u[s*4+1]=Math.round(P*255),u[s*4+2]=Math.round(C*255),u[s*4+3]=255}r.image=u,r.width=i,r.height=1,r.minFilter=f.LINEAR,r.magFilter=f.LINEAR,r.wrapS=f.CLAMP_TO_EDGE,r.wrapT=f.CLAMP_TO_EDGE,r.flipY=!1,r.generateMipmaps=!1,r.format=f.RGBA,r.type=f.UNSIGNED_BYTE,r.needsUpdate=!0}e.uniforms.uColorCount.value=i},[l,a,c,g,y,p,b]),B.jsx("div",{className:"w-full h-full relative overflow-hidden",ref:O})};export{ie as default};
