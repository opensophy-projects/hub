import{r as R,j as O}from"./vendor-react.DgFKySyv.js";const z=({hue:u=230,xOffset:m=0,speed:p=1,intensity:d=1,size:h=1})=>{const v=R.useRef(null);return R.useEffect(()=>{const o=v.current;if(!o)return;const e=o.getContext("webgl",{alpha:!0,premultipliedAlpha:!1,antialias:!1,powerPreference:"low-power",preserveDrawingBuffer:!1});if(!e){console.error("WebGL not supported");return}let i=0,g=!1;const c=()=>{const a=Math.min(window.devicePixelRatio||1,1.5),n=Math.max(1,Math.floor(o.clientWidth*a)),r=Math.max(1,Math.floor(o.clientHeight*a));(o.width!==n||o.height!==r)&&(o.width=n,o.height=r)};c();const x=new ResizeObserver(c);x.observe(o);const L=`
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `,w=`
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uHue;
      uniform float uXOffset;
      uniform float uSpeed;
      uniform float uIntensity;
      uniform float uSize;

      #define OCTAVE_COUNT 10

      vec3 hsv2rgb(vec3 c) {
          vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), rgb, c.y);
      }

      float hash11(float p) {
          p = fract(p * .1031);
          p *= p + 33.33;
          p *= p + p;
          return fract(p);
      }

      float hash12(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * .1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
      }

      mat2 rotate2d(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat2(c, -s, s, c);
      }

      float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 fp = fract(p);
          float a = hash12(ip);
          float b = hash12(ip + vec2(1.0, 0.0));
          float c = hash12(ip + vec2(0.0, 1.0));
          float d = hash12(ip + vec2(1.0, 1.0));

          vec2 t = smoothstep(0.0, 1.0, fp);
          return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
      }

      float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < OCTAVE_COUNT; ++i) {
              value += amplitude * noise(p);
              p *= rotate2d(0.45);
              p *= 2.0;
              amplitude *= 0.5;
          }
          return value;
      }

      void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
          vec2 uv = fragCoord / iResolution.xy;
          uv = 2.0 * uv - 1.0;
          uv.x *= iResolution.x / iResolution.y;
          uv.x += uXOffset;

          uv += 2.0 * fbm(uv * uSize + 0.8 * iTime * uSpeed) - 1.0;

          float dist = max(abs(uv.x), 0.015);
          vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.8));
          vec3 col = baseColor * pow(mix(0.0, 0.07, hash11(iTime * uSpeed)) / dist, 1.0) * uIntensity;
          col = pow(col, vec3(1.0));
          float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
          fragColor = vec4(col, a);
      }

      void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `,S=(a,n)=>{const r=e.createShader(n);return r?(e.shaderSource(r,a),e.compileShader(r),e.getShaderParameter(r,e.COMPILE_STATUS)?r:(console.error("Shader compile error:",e.getShaderInfoLog(r)),e.deleteShader(r),null)):null},f=S(L,e.VERTEX_SHADER),s=S(w,e.FRAGMENT_SHADER);if(!f||!s)return;const t=e.createProgram();if(!t)return;if(e.attachShader(t,f),e.attachShader(t,s),e.linkProgram(t),!e.getProgramParameter(t,e.LINK_STATUS)){console.error("Program linking error:",e.getProgramInfoLog(t)),e.deleteProgram(t);return}e.useProgram(t);const T=new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),l=e.createBuffer();if(!l)return;e.bindBuffer(e.ARRAY_BUFFER,l),e.bufferData(e.ARRAY_BUFFER,T,e.STATIC_DRAW);const A=e.getAttribLocation(t,"aPosition");e.enableVertexAttribArray(A),e.vertexAttribPointer(A,2,e.FLOAT,!1,0,0);const P=e.getUniformLocation(t,"iResolution"),C=e.getUniformLocation(t,"iTime"),E=e.getUniformLocation(t,"uHue"),_=e.getUniformLocation(t,"uXOffset"),y=e.getUniformLocation(t,"uSpeed"),F=e.getUniformLocation(t,"uIntensity"),U=e.getUniformLocation(t,"uSize"),I=performance.now(),b=()=>{if(g)return;c(),e.viewport(0,0,o.width,o.height),e.uniform2f(P,o.width,o.height);const a=performance.now();e.uniform1f(C,(a-I)/1e3),e.uniform1f(E,u),e.uniform1f(_,m),e.uniform1f(y,p),e.uniform1f(F,d),e.uniform1f(U,h),e.drawArrays(e.TRIANGLES,0,6),i=requestAnimationFrame(b)};return i=requestAnimationFrame(b),()=>{g=!0,i&&cancelAnimationFrame(i),x.disconnect(),e.bindBuffer(e.ARRAY_BUFFER,null),e.useProgram(null),e.deleteBuffer(l),e.deleteShader(f),e.deleteShader(s),e.deleteProgram(t),e.getExtension("WEBGL_lose_context")?.loseContext()}},[u,m,p,d,h]),O.jsx("canvas",{ref:v,className:"w-full h-full relative"})};export{z as default};
