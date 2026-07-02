import{r as u,R as O,j as e}from"./vendor-react.DgFKySyv.js";import{T as G,N as X}from"./types.BgCBp6c7.js";import{b as q,e as Y,f as Z,m as K}from"./vendor-motion.DY4CXug5.js";import me from"./split-text.D5Lfo-Sh.js";const Q=u.forwardRef(({className:r,speed:s=.1,intensity:t=1.2,size:l=1.1,waveStrength:n=1,colorShift:p=1,isNegative:c=!1,children:d,style:m,...a},o)=>{const j=u.useRef(null),f=u.useRef(null),z=u.useRef({speed:s,intensity:t,size:l,waveStrength:n,colorShift:p,isNegative:c}),[g,v]=u.useState(!0),y=u.useRef(null);return O.useImperativeHandle(o,()=>y.current,[]),u.useEffect(()=>{z.current={speed:s,intensity:t,size:l,waveStrength:n,colorShift:p,isNegative:c}},[s,t,l,n,p,c]),u.useEffect(()=>{if(!y.current)return;const h=new IntersectionObserver(([S])=>{v(S.isIntersecting)},{threshold:0});return h.observe(y.current),()=>h.disconnect()},[]),u.useEffect(()=>{const h=j.current;if(!h)return;let S;const w=()=>{clearTimeout(S),S=setTimeout(()=>{h.width=window.innerWidth,h.height=window.innerHeight},100)};h.width=window.innerWidth,h.height=window.innerHeight,window.addEventListener("resize",w);const i=h.getContext("webgl",{preserveDrawingBuffer:!1,antialias:!1,powerPreference:"low-power",alpha:!0,depth:!1,stencil:!1});if(!i){window.removeEventListener("resize",w);return}const k=`
      attribute vec2 position;
      void main() { gl_Position = vec4(position, 0.0, 1.0); }
    `,b=`
      precision lowp float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float u_speed;
      uniform float u_intensity;
      uniform float u_size;
      uniform float u_waveStrength;
      uniform float u_colorShift;
      uniform float u_isNegative;

      void mainImage(out vec4 O, vec2 F) {
        float i = .2 * u_speed, a;
        vec2 r = iResolution.xy,
             p = ( F+F - r ) / r.y / (1.5 * u_size),
             d = vec2(-1.0, 1.0),
             b = p - i*d,
             c = p * mat2(1.0, 1.0, d/(.1 + i/dot(b,b))),
             v = c * mat2(cos(.5*log(a=dot(c,c)) + iTime*i*u_speed + vec4(0.0,33.0,11.0,0.0)))/i,
             w = vec2(0.0);
        for(float j = 0.0; j < 9.0; j++) {
          i++;
          w += 1.0 + sin(v * u_waveStrength);
          v += .7 * sin(v.yx * i + iTime * u_speed) / i + .5;
        }
        i = length( sin(v/.3)*.4 + c*(3.0+d) );
        vec4 colorGrad = vec4(.6,-.4,-1.0,0.0) * u_colorShift;
        float result = 1.0 - exp( -exp( c.x * colorGrad.x )
                         / w.x / ( 2.0 + i*i/4.0 - i )
                         / ( .5 + 1.0 / a )
                         / ( .03 + abs( length(p)-.8 ) )
                         * u_intensity );
        if (u_isNegative > 0.5) O = vec4(vec3(result), 1.0);
        else O = vec4(vec3(1.0 - result), 1.0);
      }

      void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }
    `,_=(P,U)=>{const C=i.createShader(U);return C?(i.shaderSource(C,P),i.compileShader(C),i.getShaderParameter(C,i.COMPILE_STATUS)?C:(i.deleteShader(C),null)):null},M=_(k,i.VERTEX_SHADER),R=_(b,i.FRAGMENT_SHADER);if(!M||!R){window.removeEventListener("resize",w);return}const x=i.createProgram();if(!x){window.removeEventListener("resize",w);return}if(i.attachShader(x,M),i.attachShader(x,R),i.linkProgram(x),!i.getProgramParameter(x,i.LINK_STATUS)){i.deleteProgram(x),window.removeEventListener("resize",w);return}i.useProgram(x);const H=i.getAttribLocation(x,"position"),$=i.createBuffer();i.bindBuffer(i.ARRAY_BUFFER,$),i.bufferData(i.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),i.STATIC_DRAW),i.enableVertexAttribArray(H),i.vertexAttribPointer(H,2,i.FLOAT,!1,0,0);const ee=i.getUniformLocation(x,"iResolution"),re=i.getUniformLocation(x,"iTime"),te=i.getUniformLocation(x,"u_speed"),se=i.getUniformLocation(x,"u_intensity"),ie=i.getUniformLocation(x,"u_size"),ae=i.getUniformLocation(x,"u_waveStrength"),oe=i.getUniformLocation(x,"u_colorShift"),ne=i.getUniformLocation(x,"u_isNegative"),le=Date.now(),ce=1e3/20;let V=0;const E=P=>{if(!g){f.current=requestAnimationFrame(E);return}if(P-V<ce){f.current=requestAnimationFrame(E);return}V=P;const C=z.current,de=(Date.now()-le)/1e3;i.uniform2f(ee,h.width,h.height),i.uniform1f(re,de),i.uniform1f(te,C.speed),i.uniform1f(se,C.intensity),i.uniform1f(ie,C.size),i.uniform1f(ae,C.waveStrength),i.uniform1f(oe,C.colorShift),i.uniform1f(ne,C.isNegative?1:0),i.drawArrays(i.TRIANGLE_STRIP,0,4),f.current=requestAnimationFrame(E)};return f.current=requestAnimationFrame(E),()=>{clearTimeout(S),window.removeEventListener("resize",w),f.current&&cancelAnimationFrame(f.current),i.deleteProgram(x)}},[g]),e.jsxs("div",{ref:y,className:`relative w-full h-full ${r??""}`,style:m,...a,children:[e.jsx("canvas",{ref:j,className:"absolute inset-0 w-full h-full",style:{display:"block"}}),d]})});Q.displayName="SingularityShaders";const B=({text:r,speed:s=4,color:t="rgba(255,255,255,0.55)",shineColor:l="rgba(255,255,255,0.95)",spread:n=110})=>{const p=q(0),c=u.useRef(0),d=u.useRef(null);Y(a=>{if(d.current===null){d.current=a;return}c.current+=a-d.current,d.current=a;const o=c.current%(s*1e3)/(s*1e3)*100;p.set(o)});const m=Z(p,a=>`${150-a*2}% center`);return e.jsx(K.span,{style:{backgroundImage:`linear-gradient(${n}deg, ${t} 0%, ${t} 35%, ${l} 50%, ${t} 65%, ${t} 100%)`,backgroundSize:"200% auto",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",backgroundPosition:m,display:"inline"},children:r})},pe=r=>1-Math.pow(1-r,5),ue=u.memo(({blur:r=0,inactiveZone:s=.7,proximity:t=0,spread:l=20,movementDuration:n=2,borderWidth:p=1,disabled:c=!0,isNegative:d=!1})=>{const m=u.useRef(null),a=u.useRef({x:0,y:0}),o=u.useRef(0),j=u.useCallback((g,v,y,h)=>{const S=performance.now(),w=i=>{const k=i-S,b=Math.min(k/h,1),_=v+(y-v)*pe(b);g.style.setProperty("--start",String(_)),b<1&&requestAnimationFrame(w)};requestAnimationFrame(w)},[]),f=u.useCallback(g=>{m.current&&(o.current&&cancelAnimationFrame(o.current),o.current=requestAnimationFrame(()=>{const v=m.current;if(!v)return;const{left:y,top:h,width:S,height:w}=v.getBoundingClientRect(),i=g?.x??a.current.x,k=g?.y??a.current.y;g&&(a.current={x:i,y:k});const b=[y+S*.5,h+w*.5],_=Math.hypot(i-b[0],k-b[1]),M=.5*Math.min(S,w)*s;if(_<M){v.style.setProperty("--active","0");return}const R=i>y-t&&i<y+S+t&&k>h-t&&k<h+w+t;if(v.style.setProperty("--active",R?"1":"0"),!R)return;const x=Number.parseFloat(v.style.getPropertyValue("--start"))||0,$=(180*Math.atan2(k-b[1],i-b[0])/Math.PI+90-x+180)%360-180;j(v,x,x+$,n*1e3)}))},[s,t,n,j]);u.useEffect(()=>{if(c)return;const g=()=>f(),v=y=>f(y);return globalThis.addEventListener("scroll",g,{passive:!0}),document.body.addEventListener("pointermove",v,{passive:!0}),()=>{globalThis.removeEventListener("scroll",g),document.body.removeEventListener("pointermove",v)}},[f,c]);const z=d?"repeating-conic-gradient(from 236.84deg at 50% 50%, #ffffff, #ffffff calc(25% / var(--repeating-conic-gradient-times)))":"repeating-conic-gradient(from 236.84deg at 50% 50%, #000000, #000000 calc(25% / var(--repeating-conic-gradient-times)))";return c?null:e.jsx("div",{ref:m,style:{"--blur":`${r}px`,"--spread":l,"--start":"0","--active":"0","--glowingeffect-border-width":`${p}px`,"--repeating-conic-gradient-times":"5","--gradient":z,position:"absolute",inset:0,borderRadius:"inherit",pointerEvents:"none"},children:e.jsx("div",{style:{position:"absolute",inset:"calc(-1 * var(--glowingeffect-border-width))",borderRadius:"inherit",border:"var(--glowingeffect-border-width) solid transparent",background:z,backgroundAttachment:"fixed",opacity:"var(--active)",transition:"opacity 300ms",WebkitMaskImage:"linear-gradient(#0000,#0000), conic-gradient(from calc((var(--start) - var(--spread)) * 1deg), #00000000 0deg, #fff, #00000000 calc(var(--spread) * 2deg))",maskImage:"linear-gradient(#0000,#0000), conic-gradient(from calc((var(--start) - var(--spread)) * 1deg), #00000000 0deg, #fff, #00000000 calc(var(--spread) * 2deg))",WebkitMaskClip:"padding-box, border-box",maskClip:"padding-box, border-box",WebkitMaskComposite:"intersect",maskComposite:"intersect"}})})});ue.displayName="GlowingEffectInline";const J=O.forwardRef(({children:r,isNegative:s,style:t,...l},n)=>{const p=s?"rgba(255,255,255,0.09)":"rgba(0,0,0,0.09)",c=s?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)";return e.jsx("div",{ref:n,style:{position:"relative",border:`1px solid ${p}`,background:c,borderRadius:16,overflow:"hidden",...t},...l,children:r})});J.displayName="LandingCard";const fe=({children:r,style:s,...t})=>e.jsx("div",{style:{padding:"1.5rem 1.5rem 0",position:"relative",zIndex:1,...s},...t,children:r}),ge=({children:r,as:s="h3",style:t,...l})=>O.createElement(s,{style:{fontSize:"clamp(1.1rem, 1.8vw, 1.4rem)",fontWeight:700,lineHeight:1.25,margin:0,fontFamily:"Inter, system-ui, sans-serif",...t},...l},r),he=({children:r,style:s,...t})=>e.jsx("p",{style:{margin:"0.75rem 0 0",fontSize:"clamp(0.95rem, 1.4vw, 1.1rem)",lineHeight:1.65,textWrap:"balance",...s},...t,children:r}),xe=({children:r,style:s,...t})=>e.jsx("div",{style:{padding:"1rem 1.5rem 1.5rem",position:"relative",zIndex:1,fontFamily:"Inter, system-ui, sans-serif",...s},...t,children:r}),ve=()=>e.jsxs("div",{className:"security-analysis-visual","aria-hidden":"true",children:[e.jsx("div",{className:"security-analysis-grid"}),e.jsxs("svg",{className:"security-analysis-chart",viewBox:"0 0 560 220",preserveAspectRatio:"none",children:[e.jsxs("defs",{children:[e.jsxs("linearGradient",{id:"securityAnalysisLine",x1:"0",x2:"1",y1:"0",y2:"0",children:[e.jsx("stop",{offset:"0%",stopColor:"var(--visual-line-transparent)"}),e.jsx("stop",{offset:"16%",stopColor:"var(--visual-line-soft)"}),e.jsx("stop",{offset:"38%",stopColor:"var(--visual-line-mid)"}),e.jsx("stop",{offset:"62%",stopColor:"var(--visual-line-strong)"}),e.jsx("stop",{offset:"84%",stopColor:"var(--visual-line-soft)"}),e.jsx("stop",{offset:"100%",stopColor:"var(--visual-line-transparent)"})]}),e.jsxs("linearGradient",{id:"securityAnalysisFill",x1:"0",x2:"0",y1:"0",y2:"1",children:[e.jsx("stop",{offset:"0%",stopColor:"var(--visual-fill-top)"}),e.jsx("stop",{offset:"60%",stopColor:"var(--visual-fill-mid)"}),e.jsx("stop",{offset:"100%",stopColor:"var(--visual-fill-bottom)"})]})]}),e.jsx("path",{className:"security-analysis-area",d:"M-18 122 C42 88 74 52 122 76 C164 98 190 144 236 148 C274 152 288 148 304 138 C332 120 368 96 416 78 C474 56 526 30 578 10 L578 220 L-18 220 Z",fill:"url(#securityAnalysisFill)"}),e.jsx("path",{className:"security-analysis-wave",d:"M-18 122 C42 88 74 52 122 76 C164 98 190 144 236 148 C274 152 288 148 304 138 C332 120 368 96 416 78 C474 56 526 30 578 10",fill:"none",stroke:"url(#securityAnalysisLine)",strokeWidth:"3",strokeLinecap:"round"})]}),e.jsx("div",{className:"security-analysis-marker-line"}),e.jsxs("div",{className:"security-analysis-tooltip",children:[e.jsx("span",{className:"security-analysis-tooltip-dot"})," ","обнаружено ",e.jsx("strong",{children:"76"})," проблем"]}),e.jsx("div",{className:"security-analysis-vignette"})]}),ye=()=>e.jsxs("div",{className:"knowledge-layers-visual","aria-hidden":"true",children:[e.jsxs("svg",{className:"knowledge-open-book",viewBox:"0 0 220 150",children:[e.jsx("path",{className:"book-page book-page-left",d:"M108 118C82 101 56 96 26 101V31C57 25 82 33 108 51Z"}),e.jsx("path",{className:"book-page book-page-right",d:"M112 118C138 101 164 96 194 101V31C163 25 138 33 112 51Z"}),e.jsx("path",{className:"book-spine",d:"M110 51V122"}),e.jsx("path",{className:"book-line",d:"M43 51C62 49 80 53 96 63"}),e.jsx("path",{className:"book-line",d:"M43 70C63 68 80 72 96 82"}),e.jsx("path",{className:"book-line",d:"M43 89C63 87 80 91 96 101"}),e.jsx("path",{className:"book-line",d:"M177 51C158 49 140 53 124 63"}),e.jsx("path",{className:"book-line",d:"M177 70C157 68 140 72 124 82"}),e.jsx("path",{className:"book-line",d:"M177 89C157 87 140 91 124 101"}),e.jsx("path",{className:"book-shadow",d:"M26 101C58 98 83 104 110 122C137 104 162 98 194 101"})]}),e.jsx("div",{className:"knowledge-layers-vignette"})]}),be=()=>e.jsx("div",{className:"security-check-visual","aria-hidden":"true",children:e.jsxs("div",{className:"security-check-track",children:[e.jsxs("div",{className:"security-check-step security-check-step-ok",children:[e.jsx("span",{className:"security-check-indicator",children:"✓"}),e.jsx("span",{children:"SCA анализ пройден"})]}),e.jsx("div",{className:"security-check-connector security-check-connector-ok"}),e.jsxs("div",{className:"security-check-step security-check-step-ok",children:[e.jsx("span",{className:"security-check-indicator",children:"✓"}),e.jsx("span",{children:"SAST анализ пройден"})]}),e.jsx("div",{className:"security-check-connector security-check-connector-fail"}),e.jsxs("div",{className:"security-check-step security-check-step-fail",children:[e.jsx("span",{className:"security-check-indicator",children:"×"}),e.jsx("span",{children:"DAST провалил проверку"}),e.jsx("strong",{children:"XSS и RCE"})]})]})}),je=()=>e.jsxs("div",{className:"secure-access-visual","aria-hidden":"true",children:[e.jsxs("svg",{className:"secure-access-network",viewBox:"0 0 620 220",preserveAspectRatio:"none",children:[e.jsx("path",{className:"access-line access-line-main",d:"M120 118 C210 118 258 118 310 118"}),e.jsx("path",{className:"access-line access-line-laptop",d:"M310 118 C382 76 430 68 510 68"}),e.jsx("path",{className:"access-line access-line-phone",d:"M310 118 C382 162 430 172 510 172"}),e.jsx("path",{className:"access-pulse access-pulse-1",d:"M120 118 C210 118 258 118 310 118 C382 76 430 68 510 68"}),e.jsx("path",{className:"access-pulse access-pulse-2",d:"M120 118 C210 118 258 118 310 118 C382 162 430 172 510 172"}),e.jsx("path",{className:"access-pulse access-pulse-3",d:"M510 68 C430 68 382 76 310 118 C258 118 210 118 120 118"}),e.jsx("path",{className:"access-pulse access-pulse-4",d:"M510 172 C430 172 382 162 310 118 C258 118 210 118 120 118"})]}),e.jsx("div",{className:"access-device access-device-desktop access-device-left",children:e.jsx("span",{})}),e.jsx("div",{className:"access-device access-device-laptop",children:e.jsx("span",{})}),e.jsx("div",{className:"access-device access-device-phone",children:e.jsx("span",{})}),e.jsxs("div",{className:"secure-access-tooltip",children:[e.jsx("span",{className:"secure-access-tooltip-dot"})," ","подключено через ",e.jsx("strong",{children:"mTLS"})]})]}),we=()=>e.jsxs("div",{className:"automation-list-visual","aria-hidden":"true",children:[e.jsxs("div",{className:"automation-panel",children:[e.jsxs("div",{className:"automation-item automation-item-active",children:[e.jsx("span",{className:"automation-check",children:"✓"}),e.jsx("span",{children:"ежедневный локальный бэкап логов"})]}),e.jsxs("div",{className:"automation-item automation-item-active",children:[e.jsx("span",{className:"automation-check",children:"✓"}),e.jsx("span",{children:"управление mTLS сертификатами"})]}),e.jsxs("div",{className:"automation-item automation-item-muted-blue",children:[e.jsx("span",{className:"automation-check",children:"✓"}),e.jsx("span",{children:"еженедельный отчёт по безопасности сервиса"})]}),e.jsxs("div",{className:"automation-hidden-list",children:[e.jsxs("div",{className:"automation-item automation-item-muted",children:[e.jsx("span",{className:"automation-check",children:"✓"}),e.jsx("span",{children:"ротация ключей доступа"})]}),e.jsxs("div",{className:"automation-item automation-item-muted",children:[e.jsx("span",{className:"automation-check",children:"✓"}),e.jsx("span",{children:"контроль статуса сервисов"})]})]})]}),e.jsx("div",{className:"automation-list-vignette"})]}),ke=()=>e.jsxs("div",{className:"protection-stack-visual","aria-hidden":"true",children:[e.jsx("div",{className:"protection-orbit protection-orbit-outer"}),e.jsx("div",{className:"protection-orbit protection-orbit-inner"}),e.jsx("div",{className:"protection-shield",children:e.jsxs("svg",{viewBox:"0 0 92 104",children:[e.jsx("path",{d:"M46 8L78 20V45C78 67 66 84 46 96C26 84 14 67 14 45V20L46 8Z"}),e.jsx("path",{d:"M31 52L42 63L63 37"})]})}),e.jsx("div",{className:"protection-chip protection-chip-1",children:"WAF"}),e.jsx("div",{className:"protection-chip protection-chip-2",children:"SCA"}),e.jsx("div",{className:"protection-chip protection-chip-3",children:"mTLS"}),e.jsx("div",{className:"protection-chip protection-chip-4",children:"DAST"}),e.jsx("div",{className:"protection-stack-vignette"})]}),Se={securityAnalysis:ve,knowledgeLayers:ye,securityCheck:be,secureAccess:je,automationList:we,protectionStack:ke},Ce={"--visual-card-surface":"#0f0f0f","--visual-line-transparent":"rgba(255,255,255,0)","--visual-line-soft":"rgba(255,255,255,0.16)","--visual-line-mid":"rgba(255,255,255,0.4)","--visual-line-strong":"rgba(255,255,255,0.68)","--visual-fill-top":"rgba(255,255,255,0.08)","--visual-fill-mid":"rgba(255,255,255,0.03)","--visual-fill-bottom":"rgba(255,255,255,0)","--visual-grid-line":"rgba(255,255,255,0.07)","--visual-tooltip-bg":"rgba(15,15,15,0.72)","--visual-tooltip-text":"rgba(255,255,255,0.58)","--visual-tooltip-border":"rgba(255,255,255,0.1)","--visual-layer-line":"rgba(255,255,255,0.22)","--visual-layer-strong":"rgba(255,255,255,0.52)","--visual-success":"#57d97b","--visual-danger":"#ff6363","--visual-access":"#36e0d0"},Ne={"--visual-card-surface":"#e3e2de","--visual-line-transparent":"rgba(0,0,0,0)","--visual-line-soft":"rgba(0,0,0,0.16)","--visual-line-mid":"rgba(0,0,0,0.28)","--visual-line-strong":"rgba(0,0,0,0.58)","--visual-fill-top":"rgba(0,0,0,0.04)","--visual-fill-mid":"rgba(0,0,0,0.02)","--visual-fill-bottom":"rgba(0,0,0,0)","--visual-grid-line":"rgba(0,0,0,0.075)","--visual-tooltip-bg":"rgba(224,223,219,0.78)","--visual-tooltip-text":"rgba(0,0,0,0.62)","--visual-tooltip-border":"rgba(0,0,0,0.1)","--visual-layer-line":"rgba(0,0,0,0.24)","--visual-layer-strong":"rgba(0,0,0,0.4)","--visual-success":"#168c3a","--visual-danger":"#c62828","--visual-access":"#078b80"};function ze(r){return r?Ce:Ne}const L=({title:r,text:s,isNegative:t,fullWidth:l,badge:n,visual:p,price:c})=>{const d=t?"rgba(255,255,255,0.9)":"rgba(0,0,0,0.88)",m=t?"rgba(255,255,255,0.7)":"rgba(0,0,0,0.65)",a=t?"rgba(255,255,255,0.42)":"rgba(0,0,0,0.42)",o=t?"rgba(255,255,255,0.88)":"rgba(0,0,0,0.82)",j=t?"rgba(255,255,255,0.36)":"rgba(0,0,0,0.32)",f=!!p,z=p?Se[p]:null,g={display:"flex",flexDirection:"column",minHeight:f?356:176,gridColumn:l?"1 / -1":void 0,...f?ze(t):{}};return e.jsxs(J,{isNegative:t,className:f?`feature-card feature-card--visual feature-card--${p}`:"feature-card",style:g,children:[z&&e.jsx(z,{}),e.jsxs(fe,{className:f?"feature-card-copy--visual":void 0,children:[n&&e.jsx("div",{style:{display:"inline-flex",alignSelf:"flex-start",fontSize:"0.66rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:a,marginBottom:"0.75rem",fontFamily:"ui-monospace, monospace"},children:n}),e.jsx(ge,{style:{color:d},children:r})]}),e.jsxs(xe,{style:{flex:1,display:"flex",flexDirection:"column",justifyContent:"space-between"},children:[e.jsx(he,{style:{color:m},children:s}),c&&e.jsxs("div",{style:{display:"flex",alignItems:"baseline",gap:"0.3em",marginTop:"1rem"},children:[e.jsx("span",{style:{fontSize:"0.65rem",fontWeight:500,letterSpacing:"0.06em",color:j,fontFamily:"ui-monospace, monospace",textTransform:"uppercase"},children:"от"}),e.jsx("span",{style:{fontSize:"clamp(1rem, 1.6vw, 1.2rem)",fontWeight:600,color:o,fontFamily:"Inter, system-ui, sans-serif",letterSpacing:"-0.01em"},children:c})]})]})]})},Te=({isNegative:r,navOffset:s=0})=>{const t=r?"#0a0a0a":"#E8E7E3",l=r?"#ffffff":"#000000",n=r?"rgba(255,255,255,0.55)":"rgba(0,0,0,0.55)",p=r?"rgba(255,255,255,0.65)":"rgba(0,0,0,0.6)",c=r?"#ffffff":"#000000";return e.jsxs("section",{style:{background:t,marginLeft:s>0?`${s}px`:0,width:"100%",boxSizing:"border-box",overflow:"hidden"},children:[e.jsx("style",{children:`
        .sec-top {
          display: block;
          padding: clamp(3rem, 6vw, 5rem) clamp(2rem, 6vw, 5rem) 0;
          box-sizing: border-box;
        }
        .sec-text-col  { min-width: 0; }
        @media (max-width: 800px) {
          .sec-top { display: block; }
        }
        .sec-cards-area {
          padding: clamp(2rem, 4vw, 3rem) clamp(2rem, 6vw, 5rem) clamp(3rem, 8vw, 6rem);
          box-sizing: border-box;
        }
        .sec-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 560px) { .sec-cards { grid-template-columns: 1fr !important; } }
        .feature-card--visual {
          isolation: isolate;
          background: var(--visual-card-surface, rgba(255,255,255,0.02)) !important;
        }
        .feature-card--visual::before { display: none; }
        .feature-card-copy--visual {
          padding-top: clamp(11.8rem, 18vw, 13.25rem) !important;
        }
        .security-analysis-visual,
        .knowledge-layers-visual,
        .security-check-visual,
        .secure-access-visual,
        .automation-list-visual,
        .protection-stack-visual {
          position: absolute;
          inset: 0 0 auto;
          height: clamp(13.4rem, 20vw, 15.5rem);
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          background:
            linear-gradient(180deg, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 4%, transparent), transparent 58%, var(--visual-card-surface, #0f0f0f) 100%);
        }
        .security-analysis-visual::before,
        .security-analysis-visual::after,
        .knowledge-layers-visual::before,
        .knowledge-layers-visual::after,
        .security-check-visual::before,
        .security-check-visual::after,
        .secure-access-visual::before,
        .secure-access-visual::after,
        .automation-list-visual::before,
        .automation-list-visual::after,
        .protection-stack-visual::before,
        .protection-stack-visual::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 34%;
          z-index: 6;
          pointer-events: none;
        }
        .security-analysis-visual::before,
        .knowledge-layers-visual::before,
        .security-check-visual::before,
        .secure-access-visual::before,
        .automation-list-visual::before,
        .protection-stack-visual::before {
          left: 0;
          background: linear-gradient(90deg, var(--visual-card-surface, #0f0f0f), color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 0%, transparent));
        }
        .security-analysis-visual::after,
        .knowledge-layers-visual::after,
        .security-check-visual::after,
        .secure-access-visual::after,
        .automation-list-visual::after,
        .protection-stack-visual::after {
          right: 0;
          background: linear-gradient(270deg, var(--visual-card-surface, #0f0f0f), color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 0%, transparent));
        }
        .security-analysis-vignette,
        .knowledge-layers-vignette,
        .security-check-vignette,
        .secure-access-vignette,
        .automation-list-vignette,
        .protection-stack-vignette {
          position: absolute;
          inset: -20% -10% -14%;
          background:
            radial-gradient(circle at 50% 38%, transparent 0 27%, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 24%, transparent) 50%, var(--visual-card-surface, #0f0f0f) 100%),
            linear-gradient(180deg, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 10%, transparent), transparent 34%, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 66%, transparent) 78%, var(--visual-card-surface, #0f0f0f) 100%);
          z-index: 7;
        }
        .secure-access-vignette {
          background:
            radial-gradient(circle at 50% 42%, transparent 0 38%, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 12%, transparent) 68%, var(--visual-card-surface, #0f0f0f) 100%),
            linear-gradient(180deg, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 4%, transparent), transparent 48%, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 38%, transparent) 86%, var(--visual-card-surface, #0f0f0f) 100%);
        }
        .security-check-vignette {
          background:
            radial-gradient(circle at 50% 34%, transparent 0 42%, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 10%, transparent) 70%, var(--visual-card-surface, #0f0f0f) 100%),
            linear-gradient(180deg, transparent, transparent 58%, color-mix(in srgb, var(--visual-card-surface, #0f0f0f) 42%, transparent) 88%, var(--visual-card-surface, #0f0f0f) 100%);
        }
        .security-analysis-grid {
          position: absolute;
          inset: -2rem -5rem -1rem;
          background-image:
            linear-gradient(var(--visual-grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--visual-grid-line) 1px, transparent 1px);
          background-size: 38px 38px;
          mask-image: radial-gradient(ellipse at 50% 38%, black 0 44%, transparent 74%);
          opacity: 0.62;
        }
        .security-analysis-chart {
          position: absolute;
          left: 50%;
          top: clamp(1.45rem, 2.2vw, 1.9rem);
          width: max(42rem, 128%);
          max-width: none;
          height: clamp(8.8rem, 13vw, 10.6rem);
          overflow: visible;
          transform: translateX(-50%);
          filter: drop-shadow(0 18px 28px rgba(0, 0, 0, 0.18));
          z-index: 2;
        }
        .security-analysis-wave {
          opacity: 0.9;
        }
        .security-analysis-area {
          opacity: 0.78;
          transform-origin: center bottom;
        }
        .security-analysis-marker-line {
          position: absolute;
          left: 52%;
          top: 3.55rem;
          width: 1px;
          height: 4.55rem;
          background: repeating-linear-gradient(180deg, var(--visual-line-strong) 0 0.55rem, transparent 0.55rem 1.1rem);
          opacity: 0.74;
          z-index: 8;
        }
        .security-analysis-tooltip {
          position: absolute;
          left: 52%;
          top: 2.35rem;
          display: inline-flex;
          align-items: center;
          gap: 0.42rem;
          transform: translateX(-50%);
          padding: 0.44rem 0.78rem;
          color: var(--visual-tooltip-text);
          background: var(--visual-tooltip-bg);
          border: 1px solid var(--visual-tooltip-border);
          box-shadow: 0 10px 34px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          border-radius: 999px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.78rem;
          white-space: nowrap;
          z-index: 9;
        }
        .security-analysis-tooltip strong { color: var(--visual-line-strong); }
        .security-analysis-tooltip-dot {
          width: 0.48rem;
          height: 0.48rem;
          flex: 0 0 0.48rem;
          border-radius: 50%;
          background: #f59e0b;
          box-shadow: 0 0 18px rgba(245,158,11,0.6);
        }
        .knowledge-open-book {
          position: absolute;
          left: 50%;
          top: 1.65rem;
          width: min(58%, 18.5rem);
          min-width: 15rem;
          height: 11.5rem;
          transform: translateX(-50%);
          overflow: visible;
          z-index: 2;
          animation: knowledge-book-float 6.8s ease-in-out infinite;
          filter: drop-shadow(0 1.4rem 2.2rem color-mix(in srgb, var(--visual-layer-strong) 16%, transparent));
        }
        .book-page {
          fill: color-mix(in srgb, var(--visual-layer-strong) 12%, transparent);
          stroke: var(--visual-layer-line);
          stroke-width: 1.4;
        }
        .book-spine,
        .book-line,
        .book-shadow {
          fill: none;
          stroke: var(--visual-layer-line);
          stroke-width: 1.4;
          stroke-linecap: round;
        }
        .book-line { opacity: 0.58; }
        .book-shadow {
          stroke: var(--visual-layer-strong);
          opacity: 0.5;
        }
        .security-check-track {
          position: absolute;
          left: 50%;
          top: 2.55rem;
          display: grid;
          grid-template-columns: minmax(8rem, 1fr) 2.25rem minmax(8rem, 1fr) 2.25rem minmax(9rem, 1.15fr);
          align-items: center;
          width: min(88%, 44rem);
          transform: translateX(-50%);
          z-index: 3;
        }
        .security-check-step {
          min-height: 4.5rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 0.34rem;
          padding: 0.78rem 0.85rem;
          border: 1px solid var(--visual-tooltip-border);
          border-radius: 0.9rem;
          color: var(--visual-tooltip-text);
          background: color-mix(in srgb, var(--visual-tooltip-bg) 78%, transparent);
          box-shadow: none;
          backdrop-filter: blur(6px);
          opacity: 0.82;
          font-family: Inter, system-ui, sans-serif;
          font-size: 0.78rem;
          line-height: 1.25;
        }
        .security-check-step strong {
          color: var(--visual-danger);
          font-size: 0.72rem;
          font-weight: 700;
        }
        .security-check-indicator {
          display: grid;
          place-items: center;
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 50%;
          font-weight: 800;
          line-height: 1;
        }
        .security-check-step-ok .security-check-indicator {
          color: var(--visual-card-surface);
          background: var(--visual-success);
        }
        .security-check-step-fail .security-check-indicator {
          color: var(--visual-card-surface);
          background: var(--visual-danger);
          font-size: 1rem;
        }
        .security-check-connector {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--visual-line-mid), transparent);
        }
        .security-check-connector-ok,
        .security-check-connector-fail { box-shadow: none; opacity: 0.62; }
        .secure-access-network {
          position: absolute;
          inset: 1.8rem 7% auto;
          width: 86%;
          height: 10.2rem;
          z-index: 2;
        }
        .access-line,
        .access-pulse {
          fill: none;
          stroke-linecap: round;
          stroke-width: 2;
        }
        .access-line {
          stroke: var(--visual-line-mid);
          opacity: 0.5;
        }
        .access-pulse {
          stroke: var(--visual-access);
          stroke-width: 3;
          stroke-dasharray: 28 210;
          filter: drop-shadow(0 0 0.55rem var(--visual-access));
          opacity: 0;
          animation: access-pulse 5.6s ease-in-out infinite;
        }
        .access-pulse-2 { animation-delay: 1.8s; }
        .access-pulse-3 { animation-delay: 3.6s; }
        .access-pulse-4 { animation-delay: 5.4s; }
        .access-device {
          position: absolute;
          display: grid;
          place-items: center;
          border: 1px solid var(--visual-layer-line);
          background: color-mix(in srgb, var(--visual-layer-strong) 10%, transparent);
          box-shadow: 0 1.1rem 2.2rem color-mix(in srgb, var(--visual-layer-strong) 18%, transparent);
          z-index: 3;
        }
        .access-device span {
          display: block;
          width: 62%;
          height: 48%;
          border: 1px solid var(--visual-layer-line);
          border-radius: 0.2rem;
          opacity: 0.74;
        }
        .access-device-desktop {
          left: 12%;
          top: 6.1rem;
          width: 3.6rem;
          height: 2.45rem;
          border-radius: 0.36rem;
        }
        .access-device-desktop::after {
          content: '';
          position: absolute;
          bottom: -0.8rem;
          width: 1.8rem;
          height: 0.55rem;
          border-top: 1px solid var(--visual-layer-line);
          border-bottom: 1px solid var(--visual-layer-line);
        }
        .access-device-laptop {
          right: 12%;
          top: 3.3rem;
          width: 3.9rem;
          height: 2.35rem;
          border-radius: 0.34rem;
        }
        .access-device-laptop::after {
          content: '';
          position: absolute;
          left: -0.28rem;
          right: -0.28rem;
          bottom: -0.42rem;
          height: 0.32rem;
          border-radius: 0 0 0.35rem 0.35rem;
          border: 1px solid var(--visual-layer-line);
        }
        .access-device-phone {
          right: 14%;
          top: 8.6rem;
          width: 1.85rem;
          height: 3.25rem;
          border-radius: 0.48rem;
        }
        .access-device-phone span {
          width: 58%;
          height: 70%;
          border-radius: 0.26rem;
        }
        .secure-access-tooltip {
          position: absolute;
          left: 50%;
          top: 2.05rem;
          display: inline-flex;
          align-items: center;
          gap: 0.42rem;
          transform: translateX(-50%);
          padding: 0.44rem 0.78rem;
          color: var(--visual-tooltip-text);
          background: var(--visual-tooltip-bg);
          border: 1px solid var(--visual-tooltip-border);
          box-shadow: 0 10px 34px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(12px);
          border-radius: 999px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.72rem;
          white-space: nowrap;
          z-index: 8;
        }
        .secure-access-tooltip strong { color: var(--visual-access); }
        .secure-access-tooltip-dot {
          width: 0.48rem;
          height: 0.48rem;
          flex: 0 0 0.48rem;
          border-radius: 50%;
          background: var(--visual-success);
          box-shadow: 0 0 18px color-mix(in srgb, var(--visual-success) 60%, transparent);
        }
        .automation-panel {
          position: absolute;
          left: 50%;
          top: 2.15rem;
          width: min(82%, 31rem);
          transform: translateX(-50%);
          z-index: 3;
        }
        .automation-item {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          min-height: 2.1rem;
          margin-bottom: 0.54rem;
          padding: 0.46rem 0.7rem;
          border-radius: 999px;
          border: 1px solid var(--visual-tooltip-border);
          color: var(--visual-tooltip-text);
          background: var(--visual-tooltip-bg);
          box-shadow: 0 0.9rem 2rem rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1);
          backdrop-filter: blur(12px);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.72rem;
          white-space: nowrap;
        }
        .automation-check {
          display: grid;
          place-items: center;
          flex: 0 0 1rem;
          width: 1rem;
          height: 1rem;
          border-radius: 50%;
          color: #ffffff;
          background: #2f6bff;
          font-size: 0.68rem;
          font-weight: 800;
        }
        .automation-item-muted-blue { opacity: 0.78; }
        .automation-item-muted-blue .automation-check {
          background: color-mix(in srgb, #2f6bff 42%, var(--visual-layer-line));
        }
        .automation-hidden-list {
          position: relative;
          margin-top: 0.25rem;
          opacity: 0.44;
          mask-image: linear-gradient(180deg, black 0 35%, transparent 100%);
        }
        .automation-item-muted {
          background: color-mix(in srgb, var(--visual-tooltip-bg) 62%, transparent);
        }
        .automation-item-muted .automation-check {
          color: var(--visual-tooltip-text);
          background: color-mix(in srgb, var(--visual-layer-line) 62%, transparent);
        }
        .protection-orbit {
          position: absolute;
          left: 50%;
          top: 6.45rem;
          border: 1px solid var(--visual-layer-line);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          opacity: 0.8;
          z-index: 2;
        }
        .protection-orbit-outer { width: 18rem; height: 7.8rem; }
        .protection-orbit-inner { width: 11rem; height: 4.9rem; opacity: 0.58; }
        .protection-shield {
          position: absolute;
          left: 50%;
          top: 6.45rem;
          width: 5.1rem;
          height: 5.8rem;
          transform: translate(-50%, -50%);
          z-index: 4;
          filter: drop-shadow(0 1rem 2rem color-mix(in srgb, var(--visual-layer-strong) 18%, transparent));
        }
        .protection-shield path:first-child {
          fill: color-mix(in srgb, var(--visual-layer-strong) 10%, transparent);
          stroke: var(--visual-layer-strong);
          stroke-width: 2;
        }
        .protection-shield path:last-child {
          fill: none;
          stroke: var(--visual-success);
          stroke-width: 6;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .protection-chip {
          position: absolute;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 3.4rem;
          height: 1.9rem;
          padding: 0 0.7rem;
          border-radius: 999px;
          border: 1px solid var(--visual-tooltip-border);
          color: var(--visual-tooltip-text);
          background: var(--visual-tooltip-bg);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.72rem;
          z-index: 5;
        }
        .protection-chip-1 { left: calc(50% - 11rem); top: 3.4rem; }
        .protection-chip-2 { left: calc(50% + 7.6rem); top: 3.8rem; }
        .protection-chip-3 { left: calc(50% - 9.2rem); top: 8.8rem; }
        .protection-chip-4 { left: calc(50% + 6.6rem); top: 8.5rem; }
        @keyframes knowledge-book-float {
          0%, 100% { transform: translateX(-50%) translateY(0) rotate(-1deg); }
          50% { transform: translateX(-50%) translateY(-0.75rem) rotate(1deg); }
        }
        @keyframes access-pulse {
          0% { stroke-dashoffset: 230; opacity: 0; }
          12% { opacity: 1; }
          58% { opacity: 1; }
          100% { stroke-dashoffset: -230; opacity: 0; }
        }
        @media (max-width: 700px) {
          .feature-card--visual { min-height: 374px !important; }
          .feature-card-copy--visual { padding-top: 12.2rem !important; }
          .security-analysis-visual,
          .knowledge-layers-visual,
          .security-check-visual,
          .secure-access-visual,
          .automation-list-visual,
          .protection-stack-visual { height: 14.2rem; }
          .security-analysis-chart { width: 47rem; top: 1.6rem; height: 9.9rem; }
          .security-analysis-marker-line { left: 52%; top: 3.75rem; height: 4.5rem; }
          .security-analysis-tooltip { left: 52%; top: 2.65rem; font-size: 0.7rem; padding: 0.4rem 0.62rem; }
          .knowledge-open-book { width: 16rem; min-width: 16rem; top: 2rem; }
          .security-check-track { grid-template-columns: 1fr; gap: 0.5rem; top: 1.65rem; width: min(88%, 19rem); }
          .security-check-step { min-height: 2.35rem; flex-direction: row; align-items: center; font-size: 0.7rem; padding: 0.45rem 0.6rem; }
          .security-check-step strong { margin-left: auto; }
          .security-check-connector { display: none; }
          .secure-access-network { inset: 2rem 2% auto; width: 96%; height: 9.4rem; }
          .access-device-desktop { left: 8%; top: 6.1rem; }
          .access-device-laptop { right: 8%; top: 3.5rem; }
          .access-device-phone { right: 10%; top: 8.4rem; }
          .secure-access-tooltip { top: 2.45rem; font-size: 0.66rem; padding: 0.4rem 0.62rem; }
          .automation-panel { top: 1.65rem; width: min(88%, 20rem); }
          .automation-item { font-size: 0.64rem; min-height: 1.9rem; padding: 0.38rem 0.55rem; }
          .protection-orbit-outer { width: 14rem; height: 6.2rem; }
          .protection-orbit-inner { width: 8.5rem; height: 3.8rem; }
          .protection-shield { width: 4.2rem; height: 4.8rem; }
          .protection-chip { min-width: 2.8rem; height: 1.6rem; font-size: 0.62rem; padding: 0 0.5rem; }
          .protection-chip-1 { left: calc(50% - 8.2rem); top: 3.8rem; }
          .protection-chip-2 { left: calc(50% + 5.4rem); top: 4rem; }
          .protection-chip-3 { left: calc(50% - 7.2rem); top: 8.6rem; }
          .protection-chip-4 { left: calc(50% + 4.8rem); top: 8.5rem; }
        }
      `}),e.jsx("div",{className:"sec-top",children:e.jsxs("div",{className:"sec-text-col",children:[e.jsx("p",{style:{fontSize:"1rem",fontWeight:600,color:n,letterSpacing:"0.14em",textTransform:"uppercase",margin:"0 0 2rem",fontFamily:"Inter, sans-serif"},children:"ЧЕМ ЗАНИМАЕТСЯ"}),e.jsx("h2",{style:{fontSize:"clamp(1.75rem, 3.5vw, 2.6rem)",fontWeight:500,lineHeight:1.55,margin:"0 0 1.5rem",color:l,fontFamily:"Inter, sans-serif"},children:"Учим безопасности, настраиваем защиту, автоматизируем рутину."}),e.jsx("p",{style:{fontSize:"clamp(1.75rem, 3.5vw, 2.6rem)",fontWeight:500,lineHeight:1.55,margin:0,color:n,fontFamily:"Inter, sans-serif"},children:e.jsx(B,{text:"От образовательных материалов до внедрения DevSecOps и Zero Trust в реальную инфраструктуру.",speed:4,color:p,shineColor:c})})]})}),e.jsxs("div",{className:"sec-cards-area",children:[e.jsxs("div",{className:"sec-cards",children:[e.jsx(L,{isNegative:r,title:"Знания каждому!",badge:"открытые знания",visual:"knowledgeLayers",text:"Пишем понятные статьи и гайды по DevSecOps и не только. Рассказываем как настроить безопасность с нуля и сделать её частью культуры команды."}),e.jsx(L,{isNegative:r,title:"Интеграция анализа безопасности",badge:"услуга",visual:"securityAnalysis",price:"10 000 ₽",text:"Интегрируем автоматический анализ кода на уязвимости на каждом этапе разработки. Проверяем исходный код, тестируем работающее приложение и отслеживаем уязвимости в библиотеках — всё автоматически в CI/CD без участия команды."}),e.jsx(L,{isNegative:r,title:"Настройка безопасного доступа",badge:"услуга",visual:"secureAccess",price:"10 000 ₽",text:"Настраиваем и интегрируем защищённый доступ к сервисам и серверам. Подбираем решение под задачу — mTLS, VPN, Zero Trust или другой подход. Доступ получают только те, кому вы это разрешили."}),e.jsx(L,{isNegative:r,title:"Проверка защищённости",badge:"услуга",visual:"securityCheck",price:"5 000 ₽",text:"Этично проверяем сервис или сервер на наличие уязвимостей: открытые точки входа, слабые конфигурации и всё, что может стать проблемой раньше, чем вы об этом узнаете."}),e.jsx(L,{isNegative:r,title:"Автоматизация",badge:"услуга",visual:"automationList",price:"15 000 ₽",text:"Автоматизируем рутину — от простого bash-скрипта до сложных решений под индивидуальные требования."}),e.jsx(L,{isNegative:r,title:"Подбор стека защиты",badge:"услуга",visual:"protectionStack",price:"5 000 ₽",text:"Подбираем стек защиты с одной целью — максимальная эффективность при минимальных затратах ресурсов."})]}),e.jsxs("p",{className:"sec-contact",style:{color:n,fontFamily:"Inter, system-ui, sans-serif",fontSize:"clamp(0.98rem, 1.25vw, 1.08rem)",lineHeight:1.7,margin:"1.5rem 0 0"},children:["Чтобы заказать услугу или обсудить сотрудничество, напишите на ",e.jsx("a",{href:"mailto:opensophy@gmail.com",style:{color:l,textDecoration:"none"},children:"opensophy@gmail.com"}),". Все карточки с пометкой «услуга» доступны для заказа; «Знания каждому!» — открытая образовательная инициатива."]})]})]})},Ae=({isNegative:r,navOffset:s=0})=>{const t=r?"#0a0a0a":"#E8E7E3",l=r?"rgba(255,255,255,0.55)":"rgba(0,0,0,0.55)",n=r?"rgba(255,255,255,0.65)":"rgba(0,0,0,0.6)",p=r?"#ffffff":"#000000";return e.jsxs("section",{style:{background:t,marginLeft:s>0?`${s}px`:0,width:"100%",boxSizing:"border-box",overflow:"hidden"},children:[e.jsx("style",{children:`
        .eco-inner {
          padding: clamp(4rem, 8vw, 7rem) clamp(2rem, 6vw, 5rem);
          box-sizing: border-box;
        }
        .eco-header {
          margin-bottom: clamp(3rem, 5vw, 4.5rem);
        }
        .eco-cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }
        .eco-rotating-text {
          overflow: visible !important;
        }
        .eco-rotating-text span {
          overflow: visible !important;
        }
        .eco-heading-inline {
          display: flex;
          flex-direction: row;
          align-items: baseline;
          gap: 0.35em;
          flex-wrap: nowrap;
          white-space: nowrap;
        }
        @media (max-width: 1200px) { .eco-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 640px) {
          .eco-heading-inline {
            flex-direction: column;
            align-items: flex-start;
            white-space: normal;
            gap: 0.1em;
          }
          .eco-cards { grid-template-columns: 1fr; }
        }
      `}),e.jsxs("div",{className:"eco-inner",children:[e.jsxs("div",{className:"eco-header",children:[e.jsx("p",{style:{fontSize:"1rem",fontWeight:600,color:l,letterSpacing:"0.14em",textTransform:"uppercase",margin:"0 0 2rem",fontFamily:"Inter, sans-serif"},children:"ЧТО РАЗРАБАТЫВАЕТ"}),e.jsx("p",{style:{fontSize:"clamp(1.75rem, 3.5vw, 2.6rem)",fontWeight:500,lineHeight:1.55,margin:0,maxWidth:"100%",fontFamily:"Inter, sans-serif",color:l},children:e.jsx(B,{text:"Создаём open-source инструменты для безопасной инфраструктуры и современных IT-команд.",speed:4,color:n,shineColor:p})})]}),e.jsxs("div",{className:"eco-cards",children:[e.jsx(L,{isNegative:r,title:"Opensophy Hub (O.Hub)",badge:"веб-проект",text:"Гибридная open-source платформа для документации и публикации контента. Подходит для технических команд, авторов и всех, кто хочет красиво и структурировано делиться знаниями."}),e.jsx(L,{isNegative:r,title:"Opensophy mTLS (O.mTLS)",badge:"скрипт",text:"Инструмент для быстрого создания и управления mTLS-сертификатами. Для тех, кто хочет надёжно закрыть доступ к своим сервисам и серверам без лишней головной боли."}),e.jsx(L,{isNegative:r,title:"Opensophy UI (O.UI)",badge:"веб-проект",text:"Библиотека готовых React-компонентов с живым превью и настройками. Анимации, интерактивные блоки, кастомные элементы и фирменные компоненты Opensophy — для разработчиков и дизайнеров."})]})]})]})},Ie=()=>{const[r,s]=u.useState(()=>globalThis.window===void 0?!0:localStorage.getItem("theme")!=="light"),[t,l]=u.useState(0);u.useEffect(()=>{const m=o=>{o.key==="theme"&&s(o.newValue!=="light")},a=o=>{s(o.detail.isDark)};return globalThis.addEventListener("storage",m),globalThis.addEventListener("hub:theme-change",a),()=>{globalThis.removeEventListener("storage",m),globalThis.removeEventListener("hub:theme-change",a)}},[]),u.useEffect(()=>{const m=()=>{const o=getComputedStyle(document.documentElement).getPropertyValue("--nav-left").trim();l(o?Number.parseInt(o,10):0)};m();const a=new MutationObserver(m);return a.observe(document.documentElement,{attributes:!0,attributeFilter:["style"]}),()=>a.disconnect()},[]);const n=r?"#0a0a0a":"#E8E7E3",p=r?"#ffffff":"#000000",c=r?"rgba(255,255,255,0.65)":"rgba(0,0,0,0.6)",d=r?"#ffffff":"#000000";return e.jsxs("div",{style:{minHeight:"100vh",background:n,color:p},children:[e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .hero-title-wrap {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 clamp(1rem, 4vw, 3rem);
          pointer-events: none;
        }

        .hero-title {
          font-family: 'customfont', sans-serif;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.06em;
          white-space: nowrap;
          font-size: clamp(2rem, 10vw, 10rem);
          color: var(--hero-text-color, currentColor);
        }

        @media (max-width: 360px) {
          .hero-title {
            font-size: clamp(1.6rem, 11vw, 3rem);
            letter-spacing: 0.03em;
          }
        }

        @media (min-width: 361px) and (max-width: 768px) {
          .hero-title {
            font-size: clamp(2.5rem, 10vw, 5.5rem);
            letter-spacing: 0.05em;
          }
        }

        @media (min-width: 1001px) {
          .hero-title {
            font-size: clamp(4rem, 8vw, 10rem);
          }
        }
      `}),e.jsx(X,{floatingChrome:!0}),e.jsxs("section",{style:{position:"relative",minHeight:"100svh",overflow:"hidden",marginLeft:t>0?`${t}px`:0},children:[e.jsx("div",{style:{position:"absolute",inset:0},children:e.jsx(Q,{speed:.8,intensity:1.1,size:1.05,waveStrength:1,colorShift:1,isNegative:r,className:"h-full w-full"})}),e.jsx("div",{style:{position:"absolute",bottom:0,left:0,right:0,height:"35%",pointerEvents:"none",background:`linear-gradient(to bottom, transparent, ${n})`}}),e.jsx("div",{className:"hero-title-wrap",style:{paddingLeft:t>0?`calc(${t}px + clamp(1rem, 4vw, 3rem))`:void 0},children:e.jsx("h1",{className:"hero-title",style:{color:p},children:"Opensophy"})})]}),e.jsxs("section",{style:{marginLeft:t>0?`${t}px`:0,padding:"clamp(4rem, 10vw, 8rem) clamp(2rem, 6vw, 5rem)",width:"100%",boxSizing:"border-box"},children:[e.jsx("p",{style:{fontSize:"1rem",fontWeight:600,color:r?"rgba(255,255,255,0.5)":"rgba(0,0,0,0.45)",marginBottom:"2rem",marginTop:0,fontFamily:"Inter, sans-serif",letterSpacing:"0.14em"},children:"О ПРОЕКТЕ"}),e.jsx("p",{style:{fontSize:"clamp(1.75rem, 3.5vw, 2.6rem)",fontWeight:500,lineHeight:1.55,margin:0,maxWidth:"100%",fontFamily:"Inter, sans-serif"},children:e.jsx(B,{text:"Opensophy — инициатива открытой философии в IT. Качественные и доступные знания, услуги, инструменты и решения.",speed:4,color:c,shineColor:d})})]}),e.jsx(Te,{isNegative:r,navOffset:t}),e.jsx(Ae,{isNegative:r,navOffset:t})]})},Le=()=>e.jsx(G,{children:e.jsx(Ie,{})}),Fe=Object.freeze(Object.defineProperty({__proto__:null,default:Le},Symbol.toStringTag,{value:"Module"})),F=({text:r,speed:s=4,color:t="rgba(255,255,255,0.55)",shineColor:l="rgba(255,255,255,0.95)",spread:n=110})=>{const p=q(0),c=u.useRef(0),d=u.useRef(null);Y(a=>{if(d.current===null){d.current=a;return}c.current+=a-d.current,d.current=a;const o=c.current%(s*1e3)/(s*1e3)*100;p.set(o)});const m=Z(p,a=>`${150-a*2}% center`);return e.jsx(K.span,{style:{backgroundImage:`linear-gradient(${n}deg, ${t} 0%, ${t} 35%, ${l} 50%, ${t} 65%, ${t} 100%)`,backgroundSize:"200% auto",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",backgroundPosition:m,display:"inline"},children:r})},N=O.forwardRef(({children:r,isNegative:s,style:t,...l},n)=>{const p=s?"rgba(255,255,255,0.09)":"rgba(0,0,0,0.09)",c=s?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)";return e.jsx("div",{ref:n,style:{position:"relative",border:`1px solid ${p}`,background:c,borderRadius:16,overflow:"hidden",...t},...l,children:r})});N.displayName="ResumeCard";const W=({children:r,color:s})=>e.jsx("p",{style:{fontSize:"1rem",fontWeight:600,color:s,letterSpacing:"0.14em",textTransform:"uppercase",margin:"0 0 2rem",fontFamily:"Inter, sans-serif"},children:r}),T=({children:r,color:s})=>e.jsx("div",{style:{display:"inline-flex",alignSelf:"flex-start",fontSize:"0.66rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:s,marginBottom:"0.75rem",fontFamily:"ui-monospace, monospace"},children:r}),A=({children:r,color:s})=>e.jsx("h3",{style:{fontSize:"clamp(1.15rem, 1.9vw, 1.45rem)",fontWeight:700,lineHeight:1.25,margin:0,fontFamily:"Inter, system-ui, sans-serif",color:s},children:r}),I=({children:r,color:s})=>e.jsx("p",{style:{margin:"0.85rem 0 0",fontSize:"clamp(0.98rem, 1.4vw, 1.1rem)",lineHeight:1.75,color:s,fontFamily:"Inter, system-ui, sans-serif"},children:r}),_e=({children:r,textBody:s,badgeC:t})=>e.jsxs("li",{style:{display:"flex",gap:"0.7rem",alignItems:"flex-start",marginBottom:"0.7rem",fontFamily:"Inter, system-ui, sans-serif",fontSize:"clamp(0.93rem, 1.25vw, 1.02rem)",lineHeight:1.7,color:s,listStyle:"none"},children:[e.jsx("span",{style:{marginTop:"0.6em",flex:"0 0 0.32rem",width:"0.32rem",height:"0.32rem",borderRadius:"50%",background:t}}),e.jsx("span",{children:r})]}),D=({items:r,textBody:s,badgeC:t})=>e.jsx("ul",{style:{margin:0,padding:0},children:r.map((l,n)=>e.jsx(_e,{textBody:s,badgeC:t,children:l},n))}),Re=()=>{const[r,s]=u.useState(()=>globalThis.window===void 0?!0:localStorage.getItem("theme")!=="light"),[t,l]=u.useState(0),n=u.useRef(null);u.useEffect(()=>{const i=b=>{b.key==="theme"&&s(b.newValue!=="light")},k=b=>{s(b.detail.isDark)};return globalThis.addEventListener("storage",i),globalThis.addEventListener("hub:theme-change",k),()=>{globalThis.removeEventListener("storage",i),globalThis.removeEventListener("hub:theme-change",k)}},[]),u.useEffect(()=>{const i=()=>{const b=getComputedStyle(document.documentElement).getPropertyValue("--nav-left").trim();l(b?Number.parseInt(b,10):0)};i();const k=new MutationObserver(i);return k.observe(document.documentElement,{attributes:!0,attributeFilter:["style"]}),()=>k.disconnect()},[]);const p=()=>{n.current?.scrollIntoView({behavior:"smooth"})},c=r?"#0a0a0a":"#E8E7E3",d=r?"#ffffff":"#000000",m=r?"rgba(255,255,255,0.55)":"rgba(0,0,0,0.55)",a=r?"rgba(255,255,255,0.7)":"rgba(0,0,0,0.65)",o=r?"rgba(255,255,255,0.42)":"rgba(0,0,0,0.42)",j=r?"rgba(255,255,255,0.65)":"rgba(0,0,0,0.6)",f=r?"#ffffff":"#000000",z=r?"rgba(255,255,255,0.09)":"rgba(0,0,0,0.09)",g=r?"rgba(255,255,255,0.9)":"rgba(0,0,0,0.88)",v=r?"rgba(255,255,255,0.88)":"rgba(0,0,0,0.82)",y={marginLeft:t>0?`${t}px`:0,width:"100%",boxSizing:"border-box",overflow:"hidden"},h={padding:"clamp(3rem, 6vw, 5rem) clamp(2rem, 6vw, 5rem)",boxSizing:"border-box"},S={padding:"clamp(1rem, 2vw, 2rem) clamp(2rem, 6vw, 5rem) clamp(3rem, 8vw, 6rem)",boxSizing:"border-box"},w=i=>e.jsx("strong",{style:{color:v,fontWeight:600},children:i});return e.jsxs("div",{style:{minHeight:"100vh",background:c,color:d},children:[e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .r-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .r-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }

        @media (max-width: 900px)  { .r-grid-3 { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px)  { .r-grid-2, .r-grid-3 { grid-template-columns: 1fr !important; } }

        .r-card-header    { padding: 1.5rem 1.5rem 0; position: relative; z-index: 1; }
        .r-card-body      { padding: 1.1rem 1.5rem 1.6rem; position: relative; z-index: 1; }
        .r-card-body-full { padding: 1.6rem; position: relative; z-index: 1; }

        .resume-hero-center {
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: clamp(6rem, 14vw, 10rem) clamp(2rem, 6vw, 5rem) clamp(4rem, 8vw, 6rem);
          box-sizing: border-box;
          width: 100%;
          overflow: hidden;
        }

        .resume-hero-title {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: clamp(1.75rem, 4vw, 3.5rem);
          font-weight: 500;
          line-height: 1.45;
          margin: 0 auto;
          max-width: 840px;
          text-align: center !important;
          display: block !important;
        }

        /* кнопка-скролл */
        .r-scroll-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          margin-top: 2.5rem;
          padding: 0.65rem 1.4rem;
          border-radius: 999px;
          cursor: pointer;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: clamp(0.9rem, 1.2vw, 1rem);
          font-weight: 500;
          letter-spacing: 0.01em;
          transition: opacity 0.2s, transform 0.2s;
          background: none;
          text-decoration: none;
        }
        .r-scroll-btn:hover { opacity: 0.72; transform: translateY(2px); }

        /* CTA layout */
        .r-cta-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 4rem;
          align-items: start;
          max-width: 900px;
        }
        @media (max-width: 820px) {
          .r-cta-grid { grid-template-columns: 1fr 240px; gap: 2.5rem; }
        }
        @media (max-width: 640px) {
          .r-cta-grid { grid-template-columns: 1fr; gap: 2rem; max-width: 100%; }
        }

        /* links */
        .r-contact-link {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-family: ui-monospace, monospace;
          font-size: clamp(0.8rem, 1.1vw, 0.9rem);
          letter-spacing: 0.03em;
          text-decoration: none;
          opacity: 0.78;
          transition: opacity 0.18s;
          padding: 0.55rem 0;
          word-break: break-all;
        }
        .r-contact-link:hover { opacity: 1; }
        .r-contact-icon {
          width: 1.4rem;
          height: 1.4rem;
          flex-shrink: 0;
          opacity: 0.6;
          min-width: 1.4rem;
        }
      `}),e.jsx(X,{floatingChrome:!0}),e.jsxs("section",{className:"resume-hero-center",style:{background:c,marginLeft:t>0?`${t}px`:0},children:[e.jsx("p",{style:{fontSize:"1rem",fontWeight:600,color:m,letterSpacing:"0.14em",textTransform:"uppercase",margin:"0 0 2rem",fontFamily:"Inter, sans-serif"},children:"РЕЗЮМЕ"}),e.jsx("h1",{className:"resume-hero-title",style:{color:d},children:e.jsx(me,{text:"Привет, меня зовут Кулешов Даниил, также известен в it-сообществах как глава проекта opensophy или юзернеймов @opensophy.",splitType:"words",tag:"span",textAlign:"center",duration:.9,delay:36,ease:"power3.out",threshold:.05,rootMargin:"-20px",from:{opacity:0,y:24},to:{opacity:1,y:0}})}),e.jsxs("button",{onClick:p,className:"r-scroll-btn",style:{border:`1px solid ${z}`,color:d},children:[e.jsx("span",{style:{fontSize:"clamp(1rem, 1.5vw, 1.15rem)",fontWeight:500,fontFamily:"Inter, sans-serif"},children:e.jsx(F,{text:"давайте знакомиться!",speed:3.5,color:j,shineColor:f})}),e.jsx("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",style:{opacity:.55,flexShrink:0},children:e.jsx("path",{d:"M7 2v10M3 8l4 4 4-4",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"})})]})]}),e.jsx("section",{ref:n,style:{...y,background:c},children:e.jsxs("div",{style:{...h,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center"},children:[e.jsx(W,{color:m,children:"О СЕБЕ"}),e.jsx("p",{style:{fontSize:"clamp(1.75rem, 3.5vw, 2.6rem)",fontWeight:500,lineHeight:1.55,margin:"0 0 1.5rem",color:d,fontFamily:"Inter, sans-serif"},children:"Статус: в поиске работы / компании."}),e.jsx("p",{style:{fontSize:"clamp(1.75rem, 3.5vw, 2.6rem)",fontWeight:500,lineHeight:1.55,margin:"0 0 3rem",color:m,fontFamily:"Inter, sans-serif"},children:e.jsx(F,{text:"DevSecOps · декабрь 2025 — настоящее время.",speed:4,color:j,shineColor:f})}),e.jsxs("p",{style:{fontSize:"clamp(1.05rem, 1.7vw, 1.35rem)",fontWeight:400,lineHeight:1.8,margin:0,fontFamily:"Inter, sans-serif",maxWidth:800,textAlign:"left"},children:["Freelance DevSecOps-инженер в области кибербезопасности, автоматизации CI/CD и интеграции практик безопасности в жизненный цикл разработки. Специализируюсь на ",e.jsx("strong",{style:{color:d,fontWeight:600},children:"SAST/DAST сканировании"}),", ",e.jsx("strong",{style:{color:d,fontWeight:600},children:"контейнеризации"})," и построении защищённых пайплайнов. Имею практический опыт работы с международными командами, обнаружения уязвимостей в production-системах и ответственного раскрытия. Владею навыками ",e.jsx("strong",{style:{color:d,fontWeight:600},children:"технического письма"})," и презентации аудитов безопасности."]})]})}),e.jsxs("section",{style:{...y,background:c},children:[e.jsxs("div",{style:h,children:[e.jsx(W,{color:m,children:"КЛЮЧЕВЫЕ ОБЯЗАННОСТИ И СТЕК"}),e.jsx("h2",{style:{fontSize:"clamp(1.75rem, 3.5vw, 2.6rem)",fontWeight:500,lineHeight:1.55,margin:"0 0 1.5rem",color:d,fontFamily:"Inter, sans-serif"},children:"Что я умею и с чем работаю."}),e.jsx("p",{style:{fontSize:"clamp(1.75rem, 3.5vw, 2.6rem)",fontWeight:500,lineHeight:1.55,margin:0,color:m,fontFamily:"Inter, sans-serif"},children:e.jsx(F,{text:"SAST/DAST интеграция, CI/CD, Docker, автоматизация рутины и техническая документация.",speed:4,color:j,shineColor:f})})]}),e.jsx("div",{style:S,children:e.jsxs("div",{className:"r-grid-2",children:[e.jsxs(N,{isNegative:r,style:{display:"flex",flexDirection:"column"},children:[e.jsxs("div",{className:"r-card-header",children:[e.jsx(T,{color:o,children:"инструменты безопасности"}),e.jsx(A,{color:g,children:"SAST · DAST · SCA · ASPM"})]}),e.jsxs("div",{className:"r-card-body",style:{flex:1},children:[e.jsx(I,{color:a,children:"Установка, настройка и интеграция инструментов анализа безопасности на каждом этапе пайплайна."}),e.jsx("p",{style:{margin:"1.1rem 0 0",fontFamily:"ui-monospace, monospace",fontSize:"0.82rem",lineHeight:1.8,color:m},children:e.jsx(F,{text:"SonarQube · Semgrep · OWASP ZAP · Nuclei · nmap · OpenVAS · Nikto · DefectDojo · Trivy",speed:5,color:j,shineColor:f})})]})]}),e.jsxs(N,{isNegative:r,style:{display:"flex",flexDirection:"column"},children:[e.jsxs("div",{className:"r-card-header",children:[e.jsx(T,{color:o,children:"ci/cd"}),e.jsx(A,{color:g,children:"Защищённые пайплайны"})]}),e.jsxs("div",{className:"r-card-body",style:{flex:1},children:[e.jsx(I,{color:a,children:"Построение CI/CD пайплайнов с автоматическими security-чекпоинтами: SAST, SCA, DAST, секреты — всё на каждом PR."}),e.jsx("p",{style:{margin:"1.1rem 0 0",fontFamily:"ui-monospace, monospace",fontSize:"0.9rem",color:m},children:e.jsx(F,{text:"GitHub Actions · GitLab CI",speed:5,color:j,shineColor:f})})]})]}),e.jsxs(N,{isNegative:r,style:{display:"flex",flexDirection:"column"},children:[e.jsxs("div",{className:"r-card-header",children:[e.jsx(T,{color:o,children:"контейнеризация"}),e.jsx(A,{color:g,children:"Docker"})]}),e.jsx("div",{className:"r-card-body",style:{flex:1},children:e.jsx(I,{color:a,children:"Разработка и поддержка контейнеров с соблюдением best practices: минимальные образы, non-root, сканирование слоёв, минимизация поверхности атаки."})})]}),e.jsxs(N,{isNegative:r,style:{display:"flex",flexDirection:"column"},children:[e.jsxs("div",{className:"r-card-header",children:[e.jsx(T,{color:o,children:"автоматизация"}),e.jsx(A,{color:g,children:"Скриптинг и инструменты"})]}),e.jsxs("div",{className:"r-card-body",style:{flex:1},children:[e.jsx(I,{color:a,children:"Автоматизация рутинных задач безопасности: мониторинг, сканирование, ротация ключей, отчётность — скриптами и кастомными инструментами."}),e.jsx("p",{style:{margin:"1.1rem 0 0",fontFamily:"ui-monospace, monospace",fontSize:"0.9rem",color:m},children:e.jsx(F,{text:"bash · python",speed:5,color:j,shineColor:f})})]})]}),e.jsxs(N,{isNegative:r,style:{display:"flex",flexDirection:"column"},children:[e.jsxs("div",{className:"r-card-header",children:[e.jsx(T,{color:o,children:"документация"}),e.jsx(A,{color:g,children:"Техническое письмо"})]}),e.jsx("div",{className:"r-card-body",style:{flex:1},children:e.jsx(I,{color:a,children:"Руководства по реагированию на инциденты, отчёты по уязвимостям с PoC и рекомендациями, сопровождение проекта от проектирования до production."})})]}),e.jsxs(N,{isNegative:r,style:{display:"flex",flexDirection:"column"},children:[e.jsxs("div",{className:"r-card-header",children:[e.jsx(T,{color:o,children:"ai интеграция"}),e.jsx(A,{color:g,children:"AI в безопасности"})]}),e.jsx("div",{className:"r-card-body",style:{flex:1},children:e.jsx(I,{color:a,children:"Интеграция AI-инструментов в процессы безопасности и разработки: ускорение анализа, триаж находок, улучшение покрытия тестами."})})]})]})})]}),e.jsxs("section",{style:{...y,background:c},children:[e.jsxs("div",{style:h,children:[e.jsx(W,{color:m,children:"ОПЫТ"}),e.jsx("h2",{style:{fontSize:"clamp(1.75rem, 3.5vw, 2.6rem)",fontWeight:500,lineHeight:1.55,margin:"0 0 1.5rem",color:d,fontFamily:"Inter, sans-serif"},children:"Исследования безопасности, преподавание, сообщества и дизайн."}),e.jsx("p",{style:{fontSize:"clamp(1.75rem, 3.5vw, 2.6rem)",fontWeight:500,lineHeight:1.55,margin:0,color:m,fontFamily:"Inter, sans-serif"},children:e.jsx(F,{text:"Разный опыт — единый вектор: строить, исследовать, передавать знания.",speed:4,color:j,shineColor:f})})]}),e.jsx("div",{style:S,children:e.jsxs("div",{style:{display:"grid",gap:"1rem"},children:[e.jsx(N,{isNegative:r,children:e.jsxs("div",{className:"r-card-body-full",children:[e.jsx(T,{color:o,children:"freelance · фев 2023 — ноя 2025 · 2 года 10 мес."}),e.jsx(A,{color:g,children:"Security Researcher / Bug Bounty Hunter"}),e.jsxs("div",{className:"r-grid-2",style:{marginTop:"1.4rem"},children:[e.jsxs("div",{children:[e.jsx("p",{style:{margin:"0 0 0.7rem",fontFamily:"ui-monospace, monospace",fontSize:"0.66rem",letterSpacing:"0.1em",textTransform:"uppercase",color:o},children:"Обязанности"}),e.jsx(D,{textBody:a,badgeC:o,items:["Исследования безопасности и оценка уязвимостей в open-source проектах и публичных веб-приложениях","Анализ утечек данных и выявление угроз через OSINT-методологии","Разработка Telegram-ботов и Python-скриптов для автоматизированной разведки и мониторинга угроз","SAST/DAST сканирование: SonarCloud, OWASP ZAP, Snyk","Сканирование на секреты и ревью кода — выявление жёстко закодированных учётных данных и API-ключей","Подготовка детальных отчётов с PoC и рекомендациями по устранению","Ответственное раскрытие и координация с security-командами"]})]}),e.jsxs("div",{children:[e.jsx("p",{style:{margin:"0 0 0.7rem",fontFamily:"ui-monospace, monospace",fontSize:"0.66rem",letterSpacing:"0.1em",textTransform:"uppercase",color:o},children:"Ключевые результаты"}),e.jsx(D,{textBody:a,badgeC:o,items:[e.jsxs(e.Fragment,{children:[w("n8n")," — публичное исследование платформы автоматизации: выявление рисков безопасности. Получило отзывы от сообщества и комментарий инженера проекта в официальном Discord. Стало стандартом безопасной работы с платформой"]}),e.jsxs(e.Fragment,{children:[w("bolt.new")," — обнаружена критическая логическая уязвимость обхода ограничений AI-токенов. Ответственно раскрыта команде проекта"]}),"Выявление и документирование множественных уязвимостей в публичных проектах с последующим ответственным раскрытием"]})]})]})]})}),e.jsxs("div",{className:"r-grid-2",children:[e.jsxs(N,{isNegative:r,style:{display:"flex",flexDirection:"column"},children:[e.jsxs("div",{className:"r-card-header",children:[e.jsx(T,{color:o,children:"кибершкола kiberone · сен 2024 — янв 2025 · 5 мес."}),e.jsx(A,{color:g,children:"Преподаватель программирования"})]}),e.jsx("div",{className:"r-card-body",style:{flex:1},children:e.jsx(D,{textBody:a,badgeC:o,items:["Преподавание основ программирования детям 6–14 лет","Наставничество: код, отладка, ревью, IT-проекты (Unity, Roblox, веб, мобайл)","Адаптация сложного технического материала для разного уровня подготовки",e.jsxs(e.Fragment,{children:["Улучшение учебной программы с акцентом на ",e.jsx("strong",{style:{color:v,fontWeight:600},children:"практические навыки"})," современной IT-индустрии"]})]})})]}),e.jsxs(N,{isNegative:r,style:{display:"flex",flexDirection:"column"},children:[e.jsxs("div",{className:"r-card-header",children:[e.jsx(T,{color:o,children:"netease games (китай) · сен 2021 — дек 2023 · 2 г. 4 мес."}),e.jsx(A,{color:g,children:"Senior Community Manager"})]}),e.jsx("div",{className:"r-card-body",style:{flex:1},children:e.jsx(D,{textBody:a,badgeC:o,items:["Управление международным сообществом 50 000+ игроков","Координация команды модераторов, обучение, контроль качества","Антикризисное управление и деэскалация конфликтов","Передача обратной связи игроков команде разработки: баг-репорты, фичер-реквесты","Сотрудничество с контент-криейторами через собственную дизайн-студию"]})})]})]}),e.jsx(N,{isNegative:r,children:e.jsxs("div",{className:"r-card-body-full",children:[e.jsx(T,{color:o,children:"premium studio · июн 2021 — дек 2022 · 1 г. 7 мес. · параллельно с netease"}),e.jsx(A,{color:g,children:"Основатель и главный дизайнер"}),e.jsxs("div",{className:"r-grid-3",style:{marginTop:"1.4rem"},children:[e.jsx(I,{color:a,children:"Основание и руководство онлайн-студией цифрового дизайна для международных клиентов. Создание баннеров, логотипов, игровых ассетов и маркетинговых материалов."}),e.jsx(I,{color:a,children:"Стратегическое партнёрство с NetEase Games — аватарки и визуальные референсы для контент-криейторов. 30+ успешных проектов."}),e.jsx(I,{color:a,children:"Полный цикл: от брифинга до сдачи. Работа с клиентами из разных стран. Совмещение двух профессиональных ролей с сохранением качества."})]})]})})]})})]}),e.jsx("section",{style:{...y,background:c},children:e.jsxs("div",{style:{...h,paddingTop:"clamp(5rem, 10vw, 8rem)",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"},children:[e.jsx(W,{color:m,children:"СВЯЗАТЬСЯ"}),e.jsx("h2",{style:{fontSize:"clamp(1.75rem, 3.5vw, 2.6rem)",fontWeight:500,lineHeight:1.55,margin:"0 0 1.5rem",color:d,fontFamily:"Inter, sans-serif",maxWidth:700},children:"Рассматриваете мою кандидатуру?"}),e.jsx("p",{style:{fontSize:"clamp(1.1rem, 1.8vw, 1.4rem)",fontWeight:400,lineHeight:1.7,margin:"0 0 3rem",color:m,fontFamily:"Inter, sans-serif",maxWidth:600},children:e.jsx(F,{text:"Готов к собеседованию или рассмотрению оффера. Если нужна дополнительная информация — образование, местоположение и прочее — предоставлю по запросу.",speed:4,color:j,shineColor:f})}),e.jsxs("div",{style:{display:"flex",flexWrap:"wrap",gap:"0.5rem 2.5rem",justifyContent:"center",alignItems:"center"},children:[e.jsxs("a",{href:"mailto:opensophy@gmail.com",className:"r-contact-link",style:{color:d},children:[e.jsxs("svg",{className:"r-contact-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("rect",{x:"2",y:"4",width:"20",height:"16",rx:"2"}),e.jsx("path",{d:"m22 7-10 7L2 7"})]}),"opensophy@gmail.com"]}),e.jsxs("a",{href:"https://t.me/opensophy",target:"_blank",rel:"noopener noreferrer",className:"r-contact-link",style:{color:d},children:[e.jsxs("svg",{className:"r-contact-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M21.5 4.5 2.5 10.5l7 2.5 2.5 7 3-5 5 4 1.5-14.5z"}),e.jsx("path",{d:"M9.5 13 15 8"})]}),"@opensophy"]}),e.jsxs("a",{href:"https://github.com/opensophy-projects",target:"_blank",rel:"noopener noreferrer",className:"r-contact-link",style:{color:d},children:[e.jsx("svg",{className:"r-contact-icon",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"})}),"github / opensophy-projects"]})]})]})})]})},Me=()=>e.jsx(G,{children:e.jsx(Re,{})}),Ee=Object.freeze(Object.defineProperty({__proto__:null,default:Me},Symbol.toStringTag,{value:"Module"})),Pe={title:"Opensophy",description:"Opensophy — open-source проект для IT-специалистов и инициатива открытой философии в IT. Качественные и доступные знания, услуги, инструменты и решения по безопасности, разработке и инфраструктуре — в открытом доступе.",keywords:"opensophy, кибербезопасность, DevSecOps, linux, разработка, инструменты, туториалы, open source, IT, mTLS, SAST, DAST, SCA, zero trust, CI/CD",robots:"index, follow",lang:"ru",type:"website"},We=Object.freeze(Object.defineProperty({__proto__:null,default:Pe},Symbol.toStringTag,{value:"Module"})),De={title:"Резюме @opensophy",description:"Резюме Даниила — главы проекта Opensophy. DevSecOps, open-source, безопасная инфраструктура.",keywords:"opensophy, резюме, даниил, devsecops, open source, безопасность, разработка",robots:"index, follow",lang:"ru",type:"website"},Oe=Object.freeze(Object.defineProperty({__proto__:null,default:De},Symbol.toStringTag,{value:"Module"})),He=Object.assign({"./general{general}/Page.tsx":Fe,"./resume{resume}/Page.tsx":Ee}),$e=Object.assign({"./general{general}/metadata.ts":We,"./resume{resume}/metadata.ts":Oe});function Be(r){return r.toLowerCase().replaceAll(/\s+/g,"-").replaceAll(/[^\w/-]/g,"").replaceAll(/-+/g,"-").replaceAll(/^[-/]+|[-/]+$/g,"")}function Ve(r){const t=/\{([^}]+)\}$/.exec(r)?.[1]?.trim()||r.trim();return Be(t)}const Ue=Object.entries(He).map(([r,s])=>{const t=r.split("/")[1]??"",l=Ve(t),n=$e[`./${t}/metadata.ts`]?.default;return{slug:l,folderName:t,component:s.default,metadata:n??{title:t}}}).filter(r=>r.slug&&r.component).sort((r,s)=>r.slug.localeCompare(s.slug));function Ge(r){return r?Ue.find(s=>s.slug===r)??null:null}function Qe({slug:r}){const s=Ge(r);if(!s)return null;const t=s.component;return e.jsx(t,{})}export{Qe as default};
