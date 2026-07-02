import{r as R,j as U}from"./vendor-react.DgFKySyv.js";import{T as A,a as g,V as c,R as X,G as H,P as J,M as K}from"./Mesh.uU8OXhrh.js";const Q=new g,Y=new c,Z=new c;class $ extends A{constructor(t,{near:e=.1,far:r=100,fov:o=45,aspect:s=1,left:u,right:n,bottom:h,top:d,zoom:p=1}={}){super(),Object.assign(this,{near:e,far:r,fov:o,aspect:s,left:u,right:n,bottom:h,top:d,zoom:p}),this.projectionMatrix=new g,this.viewMatrix=new g,this.projectionViewMatrix=new g,this.worldPosition=new c,this.type=u||n?"orthographic":"perspective",this.type==="orthographic"?this.orthographic():this.perspective()}perspective({near:t=this.near,far:e=this.far,fov:r=this.fov,aspect:o=this.aspect}={}){return Object.assign(this,{near:t,far:e,fov:r,aspect:o}),this.projectionMatrix.fromPerspective({fov:r*(Math.PI/180),aspect:o,near:t,far:e}),this.type="perspective",this}orthographic({near:t=this.near,far:e=this.far,left:r=this.left||-1,right:o=this.right||1,bottom:s=this.bottom||-1,top:u=this.top||1,zoom:n=this.zoom}={}){return Object.assign(this,{near:t,far:e,left:r,right:o,bottom:s,top:u,zoom:n}),r/=n,o/=n,s/=n,u/=n,this.projectionMatrix.fromOrthogonal({left:r,right:o,bottom:s,top:u,near:t,far:e}),this.type="orthographic",this}updateMatrixWorld(){return super.updateMatrixWorld(),this.viewMatrix.inverse(this.worldMatrix),this.worldMatrix.getTranslation(this.worldPosition),this.projectionViewMatrix.multiply(this.projectionMatrix,this.viewMatrix),this}updateProjectionMatrix(){return this.type==="perspective"?this.perspective():this.orthographic()}lookAt(t){return super.lookAt(t,!0),this}project(t){return t.applyMatrix4(this.viewMatrix),t.applyMatrix4(this.projectionMatrix),this}unproject(t){return t.applyMatrix4(Q.inverse(this.projectionMatrix)),t.applyMatrix4(this.worldMatrix),this}updateFrustum(){this.frustum||(this.frustum=[new c,new c,new c,new c,new c,new c]);const t=this.projectionViewMatrix;this.frustum[0].set(t[3]-t[0],t[7]-t[4],t[11]-t[8]).constant=t[15]-t[12],this.frustum[1].set(t[3]+t[0],t[7]+t[4],t[11]+t[8]).constant=t[15]+t[12],this.frustum[2].set(t[3]+t[1],t[7]+t[5],t[11]+t[9]).constant=t[15]+t[13],this.frustum[3].set(t[3]-t[1],t[7]-t[5],t[11]-t[9]).constant=t[15]-t[13],this.frustum[4].set(t[3]-t[2],t[7]-t[6],t[11]-t[10]).constant=t[15]-t[14],this.frustum[5].set(t[3]+t[2],t[7]+t[6],t[11]+t[10]).constant=t[15]+t[14];for(let e=0;e<6;e++){const r=1/this.frustum[e].distance();this.frustum[e].multiply(r),this.frustum[e].constant*=r}}frustumIntersectsMesh(t,e=t.worldMatrix){if(!t.geometry.attributes.position||((!t.geometry.bounds||t.geometry.bounds.radius===1/0)&&t.geometry.computeBoundingSphere(),!t.geometry.bounds))return!0;const r=Y;r.copy(t.geometry.bounds.center),r.applyMatrix4(e);const o=t.geometry.bounds.radius*e.getMaxScaleOnAxis();return this.frustumIntersectsSphere(r,o)}frustumIntersectsSphere(t,e){const r=Z;for(let o=0;o<6;o++){const s=this.frustum[o];if(r.copy(s).dot(t)+s.constant<-e)return!1}return!0}}function x(l){const t=parseInt(l.slice(1,3),16)/255,e=parseInt(l.slice(3,5),16)/255,r=parseInt(l.slice(5,7),16)/255;return[t,e,r]}const tt=`
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`,et=`
precision mediump float;
uniform float iTime;
uniform vec2  iResolution;
uniform vec2  uOffset;
uniform float uRotation;
uniform float uFocalLength;
uniform float uSpeed1;
uniform float uSpeed2;
uniform float uDir2;
uniform float uBend1;
uniform float uBend2;
uniform vec3  uColor1;
uniform vec3  uColor2;

const float lt   = 0.3;
const float pi   = 3.14159;
const float pi2  = 6.28318;
const float pi_2 = 1.5708;
#define MAX_STEPS 14

void mainImage(out vec4 C, in vec2 U) {
  float t = iTime * pi;
  float s = 1.0;
  float d = 0.0;
  vec2  R = iResolution;

  vec3 o = vec3(0.0, 0.0, -7.0);
  vec3 u = normalize(vec3((U - 0.5 * R) / R.y, uFocalLength));
  vec2 k = vec2(0.0);
  vec3 p;

  float t1 = t * 0.7;
  float t2 = t * 0.9;
  float tSpeed1 = t * uSpeed1;
  float tSpeed2 = t * uSpeed2 * uDir2;

  for (int i = 0; i < MAX_STEPS; ++i) {
    p = o + u * d;
    p.x -= 15.0;

    float px = p.x;
    float wob1 = uBend1 + sin(t1 + px * 0.8) * 0.1;
    float wob2 = uBend2 + cos(t2 + px * 1.1) * 0.1;

    float px2 = px + pi_2;
    vec2 sinOffset = sin(vec2(px, px2) + tSpeed1) * wob1;
    vec2 cosOffset = cos(vec2(px, px2) + tSpeed2) * wob2;

    vec2 yz = p.yz;
    float pxLt = px + lt;
    k.x = max(pxLt, length(yz - sinOffset) - lt);
    k.y = max(pxLt, length(yz - cosOffset) - lt);

    float current = min(k.x, k.y);
    s = min(s, current);
    if (s < 0.001 || d > 300.0) break;
    d += s * 0.7;
  }

  float sqrtD = sqrt(d);
  vec3 raw = max(cos(d * pi2) - s * sqrtD - vec3(k, 0.0), 0.0);
  raw.gb += 0.1;
  float maxC = max(raw.r, max(raw.g, raw.b));
  if (maxC < 0.15) discard;
  raw = raw * 0.4 + raw.brg * 0.6 + raw * raw;
  float lum = dot(raw, vec3(0.299, 0.587, 0.114));
  float w1 = max(0.0, 1.0 - k.x * 2.0);
  float w2 = max(0.0, 1.0 - k.y * 2.0);
  float wt = w1 + w2 + 0.001;
  vec3 c = (uColor1 * w1 + uColor2 * w2) / wt * lum * 3.5;
  C = vec4(c, 1.0);
}

void main() {
  vec2 coord = gl_FragCoord.xy + uOffset;
  coord -= 0.5 * iResolution;
  float c = cos(uRotation), s = sin(uRotation);
  coord = mat2(c, -s, s, c) * coord;
  coord += 0.5 * iResolution;

  vec4 color;
  mainImage(color, coord);
  gl_FragColor = color;
}
`;function it(l){const{xOffset:t=0,yOffset:e=0,rotationDeg:r=0,focalLength:o=.8,speed1:s=.05,speed2:u=.05,dir2:n=1,bend1:h=1,bend2:d=.5,colors:p=["#A855F7","#06B6D4"]}=l,S=R.useRef(l);S.current=l;const C=R.useRef(null);return R.useEffect(()=>{const f=C.current;if(!f)return;const m=new X({alpha:!0,dpr:Math.min(window.devicePixelRatio,1.5),antialias:!1,depth:!1,stencil:!1,premultipliedAlpha:!1,preserveDrawingBuffer:!1,powerPreference:"high-performance"}),i=m.gl;i.clearColor(0,0,0,0),f.appendChild(i.canvas);const I=new $(i),O=new A,L=new H(i,{position:{size:2,data:new Float32Array([-1,-1,3,-1,-1,3])}}),y=new Float32Array([t,e]),M=new Float32Array([1,1]),T=x(p[0]),k=x(p[1]),a=new J(i,{vertex:tt,fragment:et,uniforms:{iTime:{value:0},iResolution:{value:M},uOffset:{value:y},uRotation:{value:r*Math.PI/180},uFocalLength:{value:o},uSpeed1:{value:s},uSpeed2:{value:u},uDir2:{value:n},uBend1:{value:h},uBend2:{value:d},uColor1:{value:T},uColor2:{value:k}}});new K(i,{geometry:L,program:a}).setParent(O);function j(){if(!f)return;const{width:v,height:w}=f.getBoundingClientRect();m.setSize(v,w),M[0]=v*m.dpr,M[1]=w*m.dpr,i.viewport(0,0,i.drawingBufferWidth,i.drawingBufferHeight)}const B=new ResizeObserver(j);B.observe(f),j();const D=performance.now();let b;const F=v=>{const{xOffset:w=0,yOffset:_=0,rotationDeg:E=0,focalLength:V=.8,speed1:z=.05,speed2:q=.05,dir2:W=1,bend1:G=1,bend2:N=.5,colors:P=["#A855F7","#06B6D4"]}=S.current;y[0]=w,y[1]=_,a.uniforms.iTime.value=(v-D)*.001,a.uniforms.uRotation.value=E*Math.PI/180,a.uniforms.uFocalLength.value=V,a.uniforms.uSpeed1.value=z,a.uniforms.uSpeed2.value=q,a.uniforms.uDir2.value=W,a.uniforms.uBend1.value=G,a.uniforms.uBend2.value=N,a.uniforms.uColor1.value=x(P[0]),a.uniforms.uColor2.value=x(P[1]),m.render({scene:O,camera:I}),b=requestAnimationFrame(F)};return b=requestAnimationFrame(F),()=>{cancelAnimationFrame(b),B.disconnect(),f&&i.canvas.parentNode===f&&f.removeChild(i.canvas),i.getExtension("WEBGL_lose_context")?.loseContext()}},[h,d,p,n,o,r,s,u,t,e]),U.jsx("div",{ref:C,className:"w-full h-full"})}export{it as default};
