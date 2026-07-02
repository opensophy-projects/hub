import{r as k,j as Fe}from"./vendor-react.DgFKySyv.js";import{V as B,i as J,g as P,j as Ne,k as Oe,l as Ge,F as Ue,m as X,L as z,n as Z,E as Se,o as xe,N as Re,S as ae,O as be,a as _e,C as Ce,p as Q,q as Y,c as ee,r as Le,s as Me,t as T,R as He,P as ke,u as Ae,T as ce,v as ze,B as Ve,d as de,W as We,w as qe,e as Xe,h as Ke}from"./three.module.Hv9STz0E.js";var $e=(()=>{const e=new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),t=new Float32Array([0,0,2,0,0,2]),s=new Ve;return s.setAttribute("position",new de(e,3)),s.setAttribute("uv",new de(t,2)),s})(),F=class oe{static get fullscreenGeometry(){return $e}constructor(t="Pass",s=new ae,r=new be){this.name=t,this.renderer=null,this.scene=s,this.camera=r,this.screen=null,this.rtt=!0,this.needsSwap=!0,this.needsDepthBlit=!1,this.needsDepthTexture=!1,this.enabled=!0}get renderToScreen(){return!this.rtt}set renderToScreen(t){if(this.rtt===t){const s=this.fullscreenMaterial;s!==null&&(s.needsUpdate=!0),this.rtt=!t}}set mainScene(t){}set mainCamera(t){}setRenderer(t){this.renderer=t}isEnabled(){return this.enabled}setEnabled(t){this.enabled=t}get fullscreenMaterial(){return this.screen!==null?this.screen.material:null}set fullscreenMaterial(t){let s=this.screen;s!==null?s.material=t:(s=new _e(oe.fullscreenGeometry,t),s.frustumCulled=!1,this.scene===null&&(this.scene=new ae),this.scene.add(s),this.screen=s)}getFullscreenMaterial(){return this.fullscreenMaterial}setFullscreenMaterial(t){this.fullscreenMaterial=t}getDepthTexture(){return null}setDepthTexture(t,s=Z){}render(t,s,r,i,n){throw new Error("Render method not implemented!")}setSize(t,s){}initialize(t,s,r){}dispose(){for(const t of Object.keys(this)){const s=this[t];(s instanceof X||s instanceof Ae||s instanceof ce||s instanceof oe)&&this[t].dispose()}this.fullscreenMaterial!==null&&this.fullscreenMaterial.dispose()}},je=class extends F{constructor(){super("ClearMaskPass",null,null),this.needsSwap=!1}render(e,t,s,r,i){const n=e.state.buffers.stencil;n.setLocked(!1),n.setTest(!1)}},Qe=`#ifdef COLOR_WRITE
#include <common>
#include <dithering_pars_fragment>
#ifdef FRAMEBUFFER_PRECISION_HIGH
uniform mediump sampler2D inputBuffer;
#else
uniform lowp sampler2D inputBuffer;
#endif
#endif
#ifdef DEPTH_WRITE
#include <packing>
#ifdef GL_FRAGMENT_PRECISION_HIGH
uniform highp sampler2D depthBuffer;
#else
uniform mediump sampler2D depthBuffer;
#endif
float readDepth(const in vec2 uv){
#if DEPTH_PACKING == 3201
return unpackRGBAToDepth(texture2D(depthBuffer,uv));
#else
return texture2D(depthBuffer,uv).r;
#endif
}
#endif
#ifdef USE_WEIGHTS
uniform vec4 channelWeights;
#endif
uniform float opacity;varying vec2 vUv;void main(){
#ifdef COLOR_WRITE
vec4 texel=texture2D(inputBuffer,vUv);
#ifdef USE_WEIGHTS
texel*=channelWeights;
#endif
gl_FragColor=opacity*texel;
#ifdef COLOR_SPACE_CONVERSION
#include <colorspace_fragment>
#endif
#include <dithering_fragment>
#else
gl_FragColor=vec4(0.0);
#endif
#ifdef DEPTH_WRITE
gl_FragDepth=readDepth(vUv);
#endif
}`,Ye="varying vec2 vUv;void main(){vUv=position.xy*0.5+0.5;gl_Position=vec4(position.xy,1.0,1.0);}",Je=class extends ee{constructor(){super({name:"CopyMaterial",defines:{COLOR_SPACE_CONVERSION:"1",DEPTH_PACKING:"0",COLOR_WRITE:"1"},uniforms:{inputBuffer:new T(null),depthBuffer:new T(null),channelWeights:new T(null),opacity:new T(1)},blending:Me,toneMapped:!1,depthWrite:!1,depthTest:!1,fragmentShader:Qe,vertexShader:Ye}),this.depthFunc=ze}get inputBuffer(){return this.uniforms.inputBuffer.value}set inputBuffer(e){const t=e!==null;this.colorWrite!==t&&(t?this.defines.COLOR_WRITE=!0:delete this.defines.COLOR_WRITE,this.colorWrite=t,this.needsUpdate=!0),this.uniforms.inputBuffer.value=e}get depthBuffer(){return this.uniforms.depthBuffer.value}set depthBuffer(e){const t=e!==null;this.depthWrite!==t&&(t?this.defines.DEPTH_WRITE=!0:delete this.defines.DEPTH_WRITE,this.depthTest=t,this.depthWrite=t,this.needsUpdate=!0),this.uniforms.depthBuffer.value=e}set depthPacking(e){this.defines.DEPTH_PACKING=e.toFixed(0),this.needsUpdate=!0}get colorSpaceConversion(){return this.defines.COLOR_SPACE_CONVERSION!==void 0}set colorSpaceConversion(e){this.colorSpaceConversion!==e&&(e?this.defines.COLOR_SPACE_CONVERSION=!0:delete this.defines.COLOR_SPACE_CONVERSION,this.needsUpdate=!0)}get channelWeights(){return this.uniforms.channelWeights.value}set channelWeights(e){e!==null?(this.defines.USE_WEIGHTS="1",this.uniforms.channelWeights.value=e):delete this.defines.USE_WEIGHTS,this.needsUpdate=!0}setInputBuffer(e){this.uniforms.inputBuffer.value=e}getOpacity(e){return this.uniforms.opacity.value}setOpacity(e){this.uniforms.opacity.value=e}},Ze=class extends F{constructor(e,t=!0){super("CopyPass"),this.fullscreenMaterial=new Je,this.needsSwap=!1,this.renderTarget=e,e===void 0&&(this.renderTarget=new X(1,1,{minFilter:z,magFilter:z,stencilBuffer:!1,depthBuffer:!1}),this.renderTarget.texture.name="CopyPass.Target"),this.autoResize=t}get resize(){return this.autoResize}set resize(e){this.autoResize=e}get texture(){return this.renderTarget.texture}getTexture(){return this.renderTarget.texture}setAutoResizeEnabled(e){this.autoResize=e}render(e,t,s,r,i){this.fullscreenMaterial.inputBuffer=t.texture,e.setRenderTarget(this.renderToScreen?null:this.renderTarget),e.render(this.scene,this.camera)}setSize(e,t){this.autoResize&&this.renderTarget.setSize(e,t)}initialize(e,t,s){s!==void 0&&(this.renderTarget.texture.type=s,s!==J?this.fullscreenMaterial.defines.FRAMEBUFFER_PRECISION_HIGH="1":e!==null&&e.outputColorSpace===P&&(this.renderTarget.texture.colorSpace=P))}},he=new Ce,ye=class extends F{constructor(e=!0,t=!0,s=!1){super("ClearPass",null,null),this.needsSwap=!1,this.color=e,this.depth=t,this.stencil=s,this.overrideClearColor=null,this.overrideClearAlpha=-1}setClearFlags(e,t,s){this.color=e,this.depth=t,this.stencil=s}getOverrideClearColor(){return this.overrideClearColor}setOverrideClearColor(e){this.overrideClearColor=e}getOverrideClearAlpha(){return this.overrideClearAlpha}setOverrideClearAlpha(e){this.overrideClearAlpha=e}render(e,t,s,r,i){const n=this.overrideClearColor,a=this.overrideClearAlpha,o=e.getClearAlpha(),u=n!==null,v=a>=0;u?(e.getClearColor(he),e.setClearColor(n,v?a:o)):v&&e.setClearAlpha(a),e.setRenderTarget(this.renderToScreen?null:t),e.clear(this.color,this.depth,this.stencil),u?e.setClearColor(he,o):v&&e.setClearAlpha(o)}},et=class extends F{constructor(e,t){super("MaskPass",e,t),this.needsSwap=!1,this.clearPass=new ye(!1,!1,!0),this.inverse=!1}set mainScene(e){this.scene=e}set mainCamera(e){this.camera=e}get inverted(){return this.inverse}set inverted(e){this.inverse=e}get clear(){return this.clearPass.enabled}set clear(e){this.clearPass.enabled=e}getClearPass(){return this.clearPass}isInverted(){return this.inverted}setInverted(e){this.inverted=e}render(e,t,s,r,i){const n=e.getContext(),a=e.state.buffers,o=this.scene,u=this.camera,v=this.clearPass,_=this.inverted?0:1,E=1-_;a.color.setMask(!1),a.depth.setMask(!1),a.color.setLocked(!0),a.depth.setLocked(!0),a.stencil.setTest(!0),a.stencil.setOp(n.REPLACE,n.REPLACE,n.REPLACE),a.stencil.setFunc(n.ALWAYS,_,4294967295),a.stencil.setClear(E),a.stencil.setLocked(!0),this.clearPass.enabled&&(this.renderToScreen?v.render(e,null):(v.render(e,t),v.render(e,s))),this.renderToScreen?(e.setRenderTarget(null),e.render(o,u)):(e.setRenderTarget(t),e.render(o,u),e.setRenderTarget(s),e.render(o,u)),a.color.setLocked(!1),a.depth.setLocked(!1),a.stencil.setLocked(!1),a.stencil.setFunc(n.EQUAL,1,4294967295),a.stencil.setOp(n.KEEP,n.KEEP,n.KEEP),a.stencil.setLocked(!0)}},re=1/1e3,tt=1e3,st=class{constructor(){this.startTime=performance.now(),this.previousTime=0,this.currentTime=0,this._delta=0,this._elapsed=0,this._fixedDelta=1e3/60,this.timescale=1,this.useFixedDelta=!1,this._autoReset=!1}get autoReset(){return this._autoReset}set autoReset(e){typeof document<"u"&&document.hidden!==void 0&&(e?document.addEventListener("visibilitychange",this):document.removeEventListener("visibilitychange",this),this._autoReset=e)}get delta(){return this._delta*re}get fixedDelta(){return this._fixedDelta*re}set fixedDelta(e){this._fixedDelta=e*tt}get elapsed(){return this._elapsed*re}update(e){this.useFixedDelta?this._delta=this.fixedDelta:(this.previousTime=this.currentTime,this.currentTime=(e!==void 0?e:performance.now())-this.startTime,this._delta=this.currentTime-this.previousTime),this._delta*=this.timescale,this._elapsed+=this._delta}reset(){this._delta=0,this._elapsed=0,this.currentTime=performance.now()-this.startTime}getDelta(){return this.delta}getElapsed(){return this.elapsed}handleEvent(e){document.hidden||(this.currentTime=performance.now()-this.startTime)}dispose(){this.autoReset=!1}},pe=class{constructor(e=null,{depthBuffer:t=!0,stencilBuffer:s=!1,multisampling:r=0,frameBufferType:i}={}){this.renderer=null,this.inputBuffer=this.createBuffer(t,s,i,r),this.outputBuffer=this.inputBuffer.clone(),this.copyPass=new Ze,this.depthTexture=null,this.depthRenderTarget=null,this.passes=[],this.timer=new st,this.autoRenderToScreen=!0,this.setRenderer(e)}get multisampling(){return this.inputBuffer.samples}set multisampling(e){const t=this.inputBuffer,s=this.multisampling;s>0&&e>0?(this.inputBuffer.samples=e,this.outputBuffer.samples=e,this.inputBuffer.dispose(),this.outputBuffer.dispose()):s!==e&&(this.inputBuffer.dispose(),this.outputBuffer.dispose(),this.inputBuffer=this.createBuffer(t.depthBuffer,t.stencilBuffer,t.texture.type,e),this.outputBuffer=this.inputBuffer.clone())}getTimer(){return this.timer}getRenderer(){return this.renderer}setRenderer(e){if(this.renderer=e,e!==null){const t=e.getSize(new B),s=e.getContext().getContextAttributes().alpha,r=this.inputBuffer.texture.type;r===J&&e.outputColorSpace===P&&(this.inputBuffer.texture.colorSpace=P,this.outputBuffer.texture.colorSpace=P,this.inputBuffer.dispose(),this.outputBuffer.dispose()),e.autoClear=!1,this.setSize(t.width,t.height);for(const i of this.passes)i.initialize(e,s,r)}}replaceRenderer(e,t=!0){const s=this.renderer,r=s.domElement.parentNode;return this.setRenderer(e),t&&r!==null&&(r.removeChild(s.domElement),r.appendChild(e.domElement)),s}createDepthTexture(){const e=this.inputBuffer,t=new Ne;this.depthTexture=t,e.stencilBuffer?(t.format=Oe,t.type=Ge):t.type=Ue;const s=t.clone();return s.name="EffectComposer.StableDepth",this.depthRenderTarget=new X(e.width,e.height,{depthBuffer:!0,stencilBuffer:e.stencilBuffer,depthTexture:s}),s}blitDepthBuffer(e){const t=this.renderer,s=this.depthRenderTarget,r=t.properties,i=t.getContext();t.setRenderTarget(s);const n=r.get(e).__webglFramebuffer,a=r.get(s).__webglFramebuffer,o=e.stencilBuffer?i.DEPTH_BUFFER_BIT|i.STENCIL_BUFFER_BIT:i.DEPTH_BUFFER_BIT;i.bindFramebuffer(i.READ_FRAMEBUFFER,n),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,a),i.blitFramebuffer(0,0,e.width,e.height,0,0,s.width,s.height,o,i.NEAREST),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),t.setRenderTarget(null)}deleteDepthTexture(){if(this.depthTexture!==null){this.depthTexture.dispose(),this.depthTexture=null,this.depthRenderTarget.dispose(),this.depthRenderTarget=null,this.inputBuffer.depthTexture=null,this.outputBuffer.depthTexture=null;for(const e of this.passes)e.setDepthTexture(null)}}createBuffer(e,t,s,r){const i=this.renderer,n=i===null?new B:i.getDrawingBufferSize(new B),a={minFilter:z,magFilter:z,stencilBuffer:t,depthBuffer:e,type:s},o=new X(n.width,n.height,a);return r>0&&(o.samples=r),s===J&&i!==null&&i.outputColorSpace===P&&(o.texture.colorSpace=P),o.texture.name="EffectComposer.Buffer",o.texture.generateMipmaps=!1,o}setMainScene(e){for(const t of this.passes)t.mainScene=e}setMainCamera(e){for(const t of this.passes)t.mainCamera=e}addPass(e,t){const s=this.passes,r=this.renderer,i=r.getDrawingBufferSize(new B),n=r.getContext().getContextAttributes().alpha,a=this.inputBuffer.texture.type;if(e.renderer=r,e.setSize(i.width,i.height),e.initialize(r,n,a),this.autoRenderToScreen&&(s.length>0&&(s[s.length-1].renderToScreen=!1),e.renderToScreen&&(this.autoRenderToScreen=!1)),t!==void 0?s.splice(t,0,e):s.push(e),this.autoRenderToScreen&&(s[s.length-1].renderToScreen=!0),e.needsDepthTexture||this.depthTexture!==null)if(this.depthTexture===null){const o=this.createDepthTexture();for(e of s)e.setDepthTexture(o)}else{const o=this.depthRenderTarget.depthTexture;e.setDepthTexture(o)}}removePass(e){const t=this.passes,s=t.indexOf(e);if(s!==-1&&t.splice(s,1).length>0){if(this.depthTexture!==null){const n=(o,u)=>o||u.needsDepthTexture;if(!t.reduce(n,!1)){const o=this.depthRenderTarget.depthTexture;e.getDepthTexture()===o&&e.setDepthTexture(null),this.deleteDepthTexture()}}this.autoRenderToScreen&&s===t.length&&(e.renderToScreen=!1,t.length>0&&(t[t.length-1].renderToScreen=!0))}}removeAllPasses(){const e=this.passes;this.deleteDepthTexture(),e.length>0&&(this.autoRenderToScreen&&(e[e.length-1].renderToScreen=!1),this.passes=[])}render(e){const t=this.renderer,s=this.copyPass;let r=this.inputBuffer,i=this.outputBuffer,n,a=!1;e===void 0&&(this.timer.update(),e=this.timer.getDelta());for(const o of this.passes)if(o.enabled){if(r.depthTexture=this.depthTexture,i.depthTexture=null,o.render(t,r,i,e,a),o.needsDepthBlit&&this.depthRenderTarget!==null&&this.blitDepthBuffer(r),o.needsSwap){if(a){s.renderToScreen=o.renderToScreen;const u=t.getContext(),v=t.state.buffers.stencil;v.setFunc(u.NOTEQUAL,1,4294967295),s.render(t,r,i,e,a),v.setFunc(u.EQUAL,1,4294967295)}n=r,r=i,i=n}o instanceof et?a=!0:o instanceof je&&(a=!1)}}setSize(e,t,s){const r=this.renderer,i=r.getSize(new B);(e===void 0||t===void 0)&&(e=i.width,t=i.height),(i.width!==e||i.height!==t)&&r.setSize(e,t,s);const n=r.getDrawingBufferSize(new B);this.inputBuffer.setSize(n.width,n.height),this.outputBuffer.setSize(n.width,n.height),this.depthRenderTarget!==null&&this.depthRenderTarget.setSize(n.width,n.height);for(const a of this.passes)a.setSize(n.width,n.height)}reset(){this.dispose(),this.autoRenderToScreen=!0}dispose(){for(const e of this.passes)e.dispose();this.passes=[],this.inputBuffer!==null&&this.inputBuffer.dispose(),this.outputBuffer!==null&&this.outputBuffer.dispose(),this.deleteDepthTexture(),this.copyPass.dispose(),this.timer.dispose(),F.fullscreenGeometry.dispose()}},H={NONE:0,DEPTH:1,CONVOLUTION:2},f={FRAGMENT_HEAD:"FRAGMENT_HEAD",FRAGMENT_MAIN_UV:"FRAGMENT_MAIN_UV",FRAGMENT_MAIN_IMAGE:"FRAGMENT_MAIN_IMAGE",VERTEX_HEAD:"VERTEX_HEAD",VERTEX_MAIN_SUPPORT:"VERTEX_MAIN_SUPPORT"},rt=class{constructor(){this.shaderParts=new Map([[f.FRAGMENT_HEAD,null],[f.FRAGMENT_MAIN_UV,null],[f.FRAGMENT_MAIN_IMAGE,null],[f.VERTEX_HEAD,null],[f.VERTEX_MAIN_SUPPORT,null]]),this.defines=new Map,this.uniforms=new Map,this.blendModes=new Map,this.extensions=new Set,this.attributes=H.NONE,this.varyings=new Set,this.uvTransformation=!1,this.readDepth=!1,this.colorSpace=xe}},ie=!1,me=class{constructor(e=null){this.originalMaterials=new Map,this.material=null,this.materials=null,this.materialsBackSide=null,this.materialsDoubleSide=null,this.materialsFlatShaded=null,this.materialsFlatShadedBackSide=null,this.materialsFlatShadedDoubleSide=null,this.setMaterial(e),this.meshCount=0,this.replaceMaterial=t=>{if(t.isMesh){let s;if(t.material.flatShading)switch(t.material.side){case Y:s=this.materialsFlatShadedDoubleSide;break;case Q:s=this.materialsFlatShadedBackSide;break;default:s=this.materialsFlatShaded;break}else switch(t.material.side){case Y:s=this.materialsDoubleSide;break;case Q:s=this.materialsBackSide;break;default:s=this.materials;break}this.originalMaterials.set(t,t.material),t.isSkinnedMesh?t.material=s[2]:t.isInstancedMesh?t.material=s[1]:t.material=s[0],++this.meshCount}}}cloneMaterial(e){if(!(e instanceof ee))return e.clone();const t=e.uniforms,s=new Map;for(const i in t){const n=t[i].value;n.isRenderTargetTexture&&(t[i].value=null,s.set(i,n))}const r=e.clone();for(const i of s)t[i[0]].value=i[1],r.uniforms[i[0]].value=i[1];return r}setMaterial(e){if(this.disposeMaterials(),this.material=e,e!==null){const t=this.materials=[this.cloneMaterial(e),this.cloneMaterial(e),this.cloneMaterial(e)];for(const s of t)s.uniforms=Object.assign({},e.uniforms),s.side=Le;t[2].skinning=!0,this.materialsBackSide=t.map(s=>{const r=this.cloneMaterial(s);return r.uniforms=Object.assign({},e.uniforms),r.side=Q,r}),this.materialsDoubleSide=t.map(s=>{const r=this.cloneMaterial(s);return r.uniforms=Object.assign({},e.uniforms),r.side=Y,r}),this.materialsFlatShaded=t.map(s=>{const r=this.cloneMaterial(s);return r.uniforms=Object.assign({},e.uniforms),r.flatShading=!0,r}),this.materialsFlatShadedBackSide=t.map(s=>{const r=this.cloneMaterial(s);return r.uniforms=Object.assign({},e.uniforms),r.flatShading=!0,r.side=Q,r}),this.materialsFlatShadedDoubleSide=t.map(s=>{const r=this.cloneMaterial(s);return r.uniforms=Object.assign({},e.uniforms),r.flatShading=!0,r.side=Y,r})}}render(e,t,s){const r=e.shadowMap.enabled;if(e.shadowMap.enabled=!1,ie){const i=this.originalMaterials;this.meshCount=0,t.traverse(this.replaceMaterial),e.render(t,s);for(const n of i)n[0].material=n[1];this.meshCount!==i.size&&i.clear()}else{const i=t.overrideMaterial;t.overrideMaterial=this.material,e.render(t,s),t.overrideMaterial=i}e.shadowMap.enabled=r}disposeMaterials(){if(this.material!==null){const e=this.materials.concat(this.materialsBackSide).concat(this.materialsDoubleSide).concat(this.materialsFlatShaded).concat(this.materialsFlatShadedBackSide).concat(this.materialsFlatShadedDoubleSide);for(const t of e)t.dispose()}}dispose(){this.originalMaterials.clear(),this.disposeMaterials()}static get workaroundEnabled(){return ie}static set workaroundEnabled(e){ie=e}},c={ADD:0,ALPHA:1,AVERAGE:2,COLOR:3,COLOR_BURN:4,COLOR_DODGE:5,DARKEN:6,DIFFERENCE:7,DIVIDE:8,DST:9,EXCLUSION:10,HARD_LIGHT:11,HARD_MIX:12,HUE:13,INVERT:14,INVERT_RGB:15,LIGHTEN:16,LINEAR_BURN:17,LINEAR_DODGE:18,LINEAR_LIGHT:19,LUMINOSITY:20,MULTIPLY:21,NEGATION:22,NORMAL:23,OVERLAY:24,PIN_LIGHT:25,REFLECT:26,SATURATION:27,SCREEN:28,SOFT_LIGHT:29,SRC:30,SUBTRACT:31,VIVID_LIGHT:32},it="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=dst.rgb+src.rgb;return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",nt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){return mix(dst,src,src.a*opacity);}",at="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=(dst.rgb+src.rgb)*0.5;return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",ot="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 a=RGBToHSL(dst.rgb);vec3 b=RGBToHSL(src.rgb);vec3 c=HSLToRGB(vec3(b.xy,a.z));return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",ct="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 a=dst.rgb,b=src.rgb;vec3 c=mix(step(0.0,b)*(1.0-min(vec3(1.0),(1.0-a)/max(b,1e-9))),vec3(1.0),step(1.0,a));return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",lt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 a=dst.rgb,b=src.rgb;vec3 c=step(0.0,a)*mix(min(vec3(1.0),a/max(1.0-b,1e-9)),vec3(1.0),step(1.0,b));return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",ut="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=min(dst.rgb,src.rgb);return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",ft="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=abs(dst.rgb-src.rgb);return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",dt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=dst.rgb/max(src.rgb,1e-9);return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",ht="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=dst.rgb+src.rgb-2.0*dst.rgb*src.rgb;return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",pt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 a=min(dst.rgb,1.0);vec3 b=min(src.rgb,1.0);vec3 c=mix(2.0*a*b,1.0-2.0*(1.0-a)*(1.0-b),step(0.5,b));return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",mt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=step(1.0,dst.rgb+src.rgb);return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",vt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 a=RGBToHSL(dst.rgb);vec3 b=RGBToHSL(src.rgb);vec3 c=HSLToRGB(vec3(b.x,a.yz));return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",gt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=max(1.0-src.rgb,0.0);return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",Tt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=src.rgb*max(1.0-dst.rgb,0.0);return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",Et="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=max(dst.rgb,src.rgb);return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",St="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=clamp(src.rgb+dst.rgb-1.0,0.0,1.0);return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",xt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=min(dst.rgb+src.rgb,1.0);return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",Rt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=clamp(2.0*src.rgb+dst.rgb-1.0,0.0,1.0);return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",bt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 a=RGBToHSL(dst.rgb);vec3 b=RGBToHSL(src.rgb);vec3 c=HSLToRGB(vec3(a.xy,b.z));return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",_t="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=dst.rgb*src.rgb;return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",Ct="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=max(1.0-abs(1.0-dst.rgb-src.rgb),0.0);return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",Mt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){return mix(dst,src,opacity);}",At="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 a=2.0*src.rgb*dst.rgb;vec3 b=1.0-2.0*(1.0-src.rgb)*(1.0-dst.rgb);vec3 c=mix(a,b,step(0.5,dst.rgb));return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",yt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 src2=2.0*src.rgb;vec3 c=mix(mix(src2,dst.rgb,step(0.5*dst.rgb,src.rgb)),max(src2-1.0,vec3(0.0)),step(dst.rgb,src2-1.0));return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",wt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 a=min(dst.rgb*dst.rgb/max(1.0-src.rgb,1e-9),1.0);vec3 c=mix(a,src.rgb,step(1.0,src.rgb));return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",Bt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 a=RGBToHSL(dst.rgb);vec3 b=RGBToHSL(src.rgb);vec3 c=HSLToRGB(vec3(a.x,b.y,a.z));return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",Dt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=dst.rgb+src.rgb-min(dst.rgb*src.rgb,1.0);return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",Pt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 src2=2.0*src.rgb;vec3 d=dst.rgb+(src2-1.0);vec3 w=step(0.5,src.rgb);vec3 a=dst.rgb-(1.0-src2)*dst.rgb*(1.0-dst.rgb);vec3 b=mix(d*(sqrt(dst.rgb)-dst.rgb),d*dst.rgb*((16.0*dst.rgb-12.0)*dst.rgb+3.0),w*(1.0-step(0.25,dst.rgb)));vec3 c=mix(a,b,w);return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",It="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){return src;}",Ft="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=max(dst.rgb-src.rgb,0.0);return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",Nt="vec4 blend(const in vec4 dst,const in vec4 src,const in float opacity){vec3 c=mix(max(1.0-min((1.0-dst.rgb)/(2.0*src.rgb),1.0),0.0),min(dst.rgb/(2.0*(1.0-src.rgb)),1.0),step(0.5,src.rgb));return mix(dst,vec4(c,max(dst.a,src.a)),opacity);}",Ot=new Map([[c.ADD,it],[c.ALPHA,nt],[c.AVERAGE,at],[c.COLOR,ot],[c.COLOR_BURN,ct],[c.COLOR_DODGE,lt],[c.DARKEN,ut],[c.DIFFERENCE,ft],[c.DIVIDE,dt],[c.DST,null],[c.EXCLUSION,ht],[c.HARD_LIGHT,pt],[c.HARD_MIX,mt],[c.HUE,vt],[c.INVERT,gt],[c.INVERT_RGB,Tt],[c.LIGHTEN,Et],[c.LINEAR_BURN,St],[c.LINEAR_DODGE,xt],[c.LINEAR_LIGHT,Rt],[c.LUMINOSITY,bt],[c.MULTIPLY,_t],[c.NEGATION,Ct],[c.NORMAL,Mt],[c.OVERLAY,At],[c.PIN_LIGHT,yt],[c.REFLECT,wt],[c.SATURATION,Bt],[c.SCREEN,Dt],[c.SOFT_LIGHT,Pt],[c.SRC,It],[c.SUBTRACT,Ft],[c.VIVID_LIGHT,Nt]]),Gt=class extends Se{constructor(e,t=1){super(),this._blendFunction=e,this.opacity=new T(t)}getOpacity(){return this.opacity.value}setOpacity(e){this.opacity.value=e}get blendFunction(){return this._blendFunction}set blendFunction(e){this._blendFunction=e,this.dispatchEvent({type:"change"})}getBlendFunction(){return this.blendFunction}setBlendFunction(e){this.blendFunction=e}getShaderCode(){return Ot.get(this.blendFunction)}},we=class extends Se{constructor(e,t,{attributes:s=H.NONE,blendFunction:r=c.NORMAL,defines:i=new Map,uniforms:n=new Map,extensions:a=null,vertexShader:o=null}={}){super(),this.name=e,this.renderer=null,this.attributes=s,this.fragmentShader=t,this.vertexShader=o,this.defines=i,this.uniforms=n,this.extensions=a,this.blendMode=new Gt(r),this.blendMode.addEventListener("change",u=>this.setChanged()),this._inputColorSpace=xe,this._outputColorSpace=Re}get inputColorSpace(){return this._inputColorSpace}set inputColorSpace(e){this._inputColorSpace=e,this.setChanged()}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e,this.setChanged()}set mainScene(e){}set mainCamera(e){}getName(){return this.name}setRenderer(e){this.renderer=e}getDefines(){return this.defines}getUniforms(){return this.uniforms}getExtensions(){return this.extensions}getBlendMode(){return this.blendMode}getAttributes(){return this.attributes}setAttributes(e){this.attributes=e,this.setChanged()}getFragmentShader(){return this.fragmentShader}setFragmentShader(e){this.fragmentShader=e,this.setChanged()}getVertexShader(){return this.vertexShader}setVertexShader(e){this.vertexShader=e,this.setChanged()}setChanged(){this.dispatchEvent({type:"change"})}setDepthTexture(e,t=Z){}update(e,t,s){}setSize(e,t){}initialize(e,t,s){}dispose(){for(const e of Object.keys(this)){const t=this[e];(t instanceof X||t instanceof Ae||t instanceof ce||t instanceof F)&&this[e].dispose()}}},ve=class extends F{constructor(e,t,s=null){super("RenderPass",e,t),this.needsSwap=!1,this.needsDepthBlit=!0,this.clearPass=new ye,this.overrideMaterialManager=s===null?null:new me(s),this.ignoreBackground=!1,this.skipShadowMapUpdate=!1,this.selection=null}set mainScene(e){this.scene=e}set mainCamera(e){this.camera=e}get renderToScreen(){return super.renderToScreen}set renderToScreen(e){super.renderToScreen=e,this.clearPass.renderToScreen=e}get overrideMaterial(){const e=this.overrideMaterialManager;return e!==null?e.material:null}set overrideMaterial(e){const t=this.overrideMaterialManager;e!==null?t!==null?t.setMaterial(e):this.overrideMaterialManager=new me(e):t!==null&&(t.dispose(),this.overrideMaterialManager=null)}getOverrideMaterial(){return this.overrideMaterial}setOverrideMaterial(e){this.overrideMaterial=e}get clear(){return this.clearPass.enabled}set clear(e){this.clearPass.enabled=e}getSelection(){return this.selection}setSelection(e){this.selection=e}isBackgroundDisabled(){return this.ignoreBackground}setBackgroundDisabled(e){this.ignoreBackground=e}isShadowMapDisabled(){return this.skipShadowMapUpdate}setShadowMapDisabled(e){this.skipShadowMapUpdate=e}getClearPass(){return this.clearPass}render(e,t,s,r,i){const n=this.scene,a=this.camera,o=this.selection,u=a.layers.mask,v=n.background,_=e.shadowMap.autoUpdate,E=this.renderToScreen?null:t;o!==null&&a.layers.set(o.getLayer()),this.skipShadowMapUpdate&&(e.shadowMap.autoUpdate=!1),(this.ignoreBackground||this.clearPass.overrideClearColor!==null)&&(n.background=null),this.clearPass.enabled&&this.clearPass.render(e,t),e.setRenderTarget(E),this.overrideMaterialManager!==null?this.overrideMaterialManager.render(e,n,a):e.render(n,a),a.layers.mask=u,n.background=v,e.shadowMap.autoUpdate=_}},Ut=`#include <common>
#include <packing>
#include <dithering_pars_fragment>
#define packFloatToRGBA(v) packDepthToRGBA(v)
#define unpackRGBAToFloat(v) unpackRGBAToDepth(v)
#ifdef FRAMEBUFFER_PRECISION_HIGH
uniform mediump sampler2D inputBuffer;
#else
uniform lowp sampler2D inputBuffer;
#endif
#if DEPTH_PACKING == 3201
uniform lowp sampler2D depthBuffer;
#elif defined(GL_FRAGMENT_PRECISION_HIGH)
uniform highp sampler2D depthBuffer;
#else
uniform mediump sampler2D depthBuffer;
#endif
uniform vec2 resolution;uniform vec2 texelSize;uniform float cameraNear;uniform float cameraFar;uniform float aspect;uniform float time;varying vec2 vUv;vec4 sRGBToLinear(const in vec4 value){return vec4(mix(pow(value.rgb*0.9478672986+vec3(0.0521327014),vec3(2.4)),value.rgb*0.0773993808,vec3(lessThanEqual(value.rgb,vec3(0.04045)))),value.a);}float readDepth(const in vec2 uv){
#if DEPTH_PACKING == 3201
float depth=unpackRGBAToDepth(texture2D(depthBuffer,uv));
#else
float depth=texture2D(depthBuffer,uv).r;
#endif
#if defined(USE_LOGARITHMIC_DEPTH_BUFFER) || defined(LOG_DEPTH)
float d=pow(2.0,depth*log2(cameraFar+1.0))-1.0;float a=cameraFar/(cameraFar-cameraNear);float b=cameraFar*cameraNear/(cameraNear-cameraFar);depth=a+b/d;
#elif defined(USE_REVERSED_DEPTH_BUFFER)
depth=1.0-depth;
#endif
return depth;}float getViewZ(const in float depth){
#ifdef PERSPECTIVE_CAMERA
return perspectiveDepthToViewZ(depth,cameraNear,cameraFar);
#else
return orthographicDepthToViewZ(depth,cameraNear,cameraFar);
#endif
}vec3 RGBToHCV(const in vec3 RGB){vec4 P=mix(vec4(RGB.bg,-1.0,2.0/3.0),vec4(RGB.gb,0.0,-1.0/3.0),step(RGB.b,RGB.g));vec4 Q=mix(vec4(P.xyw,RGB.r),vec4(RGB.r,P.yzx),step(P.x,RGB.r));float C=Q.x-min(Q.w,Q.y);float H=abs((Q.w-Q.y)/(6.0*C+EPSILON)+Q.z);return vec3(H,C,Q.x);}vec3 RGBToHSL(const in vec3 RGB){vec3 HCV=RGBToHCV(RGB);float L=HCV.z-HCV.y*0.5;float S=HCV.y/(1.0-abs(L*2.0-1.0)+EPSILON);return vec3(HCV.x,S,L);}vec3 HueToRGB(const in float H){float R=abs(H*6.0-3.0)-1.0;float G=2.0-abs(H*6.0-2.0);float B=2.0-abs(H*6.0-4.0);return clamp(vec3(R,G,B),0.0,1.0);}vec3 HSLToRGB(const in vec3 HSL){vec3 RGB=HueToRGB(HSL.x);float C=(1.0-abs(2.0*HSL.z-1.0))*HSL.y;return(RGB-0.5)*C+HSL.z;}FRAGMENT_HEAD void main(){FRAGMENT_MAIN_UV vec4 color0=texture2D(inputBuffer,UV);vec4 color1=vec4(0.0);FRAGMENT_MAIN_IMAGE color0.a=clamp(color0.a,0.0,1.0);gl_FragColor=color0;
#ifdef ENCODE_OUTPUT
#include <colorspace_fragment>
#endif
#include <dithering_fragment>
}`,Lt="uniform vec2 resolution;uniform vec2 texelSize;uniform float cameraNear;uniform float cameraFar;uniform float aspect;uniform float time;varying vec2 vUv;VERTEX_HEAD void main(){vUv=position.xy*0.5+0.5;VERTEX_MAIN_SUPPORT gl_Position=vec4(position.xy,1.0,1.0);}",Ht=class extends ee{constructor(e,t,s,r,i=!1){super({name:"EffectMaterial",defines:{THREE_REVISION:He.replace(/\D+/g,""),DEPTH_PACKING:"0",ENCODE_OUTPUT:"1"},uniforms:{inputBuffer:new T(null),depthBuffer:new T(null),resolution:new T(new B),texelSize:new T(new B),cameraNear:new T(.3),cameraFar:new T(1e3),aspect:new T(1),time:new T(0)},blending:Me,toneMapped:!1,depthWrite:!1,depthTest:!1,dithering:i}),e&&this.setShaderParts(e),t&&this.setDefines(t),s&&this.setUniforms(s),this.copyCameraSettings(r)}set inputBuffer(e){this.uniforms.inputBuffer.value=e}setInputBuffer(e){this.uniforms.inputBuffer.value=e}get depthBuffer(){return this.uniforms.depthBuffer.value}set depthBuffer(e){this.uniforms.depthBuffer.value=e}get depthPacking(){return Number(this.defines.DEPTH_PACKING)}set depthPacking(e){this.defines.DEPTH_PACKING=e.toFixed(0),this.needsUpdate=!0}setDepthBuffer(e,t=Z){this.depthBuffer=e,this.depthPacking=t}setShaderData(e){this.setShaderParts(e.shaderParts),this.setDefines(e.defines),this.setUniforms(e.uniforms),this.setExtensions(e.extensions)}setShaderParts(e){return this.fragmentShader=Ut.replace(f.FRAGMENT_HEAD,e.get(f.FRAGMENT_HEAD)||"").replace(f.FRAGMENT_MAIN_UV,e.get(f.FRAGMENT_MAIN_UV)||"").replace(f.FRAGMENT_MAIN_IMAGE,e.get(f.FRAGMENT_MAIN_IMAGE)||""),this.vertexShader=Lt.replace(f.VERTEX_HEAD,e.get(f.VERTEX_HEAD)||"").replace(f.VERTEX_MAIN_SUPPORT,e.get(f.VERTEX_MAIN_SUPPORT)||""),this.needsUpdate=!0,this}setDefines(e){for(const t of e.entries())this.defines[t[0]]=t[1];return this.needsUpdate=!0,this}setUniforms(e){for(const t of e.entries())this.uniforms[t[0]]=t[1];return this}setExtensions(e){this.extensions={};for(const t of e)this.extensions[t]=!0;return this}get encodeOutput(){return this.defines.ENCODE_OUTPUT!==void 0}set encodeOutput(e){this.encodeOutput!==e&&(e?this.defines.ENCODE_OUTPUT="1":delete this.defines.ENCODE_OUTPUT,this.needsUpdate=!0)}isOutputEncodingEnabled(e){return this.encodeOutput}setOutputEncodingEnabled(e){this.encodeOutput=e}get time(){return this.uniforms.time.value}set time(e){this.uniforms.time.value=e}setDeltaTime(e){this.uniforms.time.value+=e}adoptCameraSettings(e){this.copyCameraSettings(e)}copyCameraSettings(e){e&&(this.uniforms.cameraNear.value=e.near,this.uniforms.cameraFar.value=e.far,e instanceof ke?this.defines.PERSPECTIVE_CAMERA="1":delete this.defines.PERSPECTIVE_CAMERA,this.needsUpdate=!0)}setSize(e,t){const s=this.uniforms;s.resolution.value.set(e,t),s.texelSize.value.set(1/e,1/t),s.aspect.value=e/t}static get Section(){return f}};function ge(e,t,s){for(const r of t){const i="$1"+e+r.charAt(0).toUpperCase()+r.slice(1),n=new RegExp("([^\\.])(\\b"+r+"\\b)","g");for(const a of s.entries())a[1]!==null&&s.set(a[0],a[1].replace(n,i))}}function kt(e,t,s){let r=t.getFragmentShader(),i=t.getVertexShader();const n=r!==void 0&&/mainImage/.test(r),a=r!==void 0&&/mainUv/.test(r);if(s.attributes|=t.getAttributes(),r===void 0)throw new Error(`Missing fragment shader (${t.name})`);if(a&&(s.attributes&H.CONVOLUTION)!==0)throw new Error(`Effects that transform UVs are incompatible with convolution effects (${t.name})`);if(!n&&!a)throw new Error(`Could not find mainImage or mainUv function (${t.name})`);{const o=/\w+\s+(\w+)\([\w\s,]*\)\s*{/g,u=s.shaderParts;let v=u.get(f.FRAGMENT_HEAD)||"",_=u.get(f.FRAGMENT_MAIN_UV)||"",E=u.get(f.FRAGMENT_MAIN_IMAGE)||"",D=u.get(f.VERTEX_HEAD)||"",l=u.get(f.VERTEX_MAIN_SUPPORT)||"";const g=new Set,d=new Set;if(a&&(_+=`	${e}MainUv(UV);
`,s.uvTransformation=!0),i!==null&&/mainSupport/.test(i)){const h=/mainSupport *\([\w\s]*?uv\s*?\)/.test(i);l+=`	${e}MainSupport(`,l+=h?`vUv);
`:`);
`;for(const p of i.matchAll(/(?:varying\s+\w+\s+([\S\s]*?);)/g))for(const S of p[1].split(/\s*,\s*/))s.varyings.add(S),g.add(S),d.add(S);for(const p of i.matchAll(o))d.add(p[1])}for(const h of r.matchAll(o))d.add(h[1]);for(const h of t.defines.keys())d.add(h.replace(/\([\w\s,]*\)/g,""));for(const h of t.uniforms.keys())d.add(h);d.delete("while"),d.delete("for"),d.delete("if"),t.uniforms.forEach((h,p)=>s.uniforms.set(e+p.charAt(0).toUpperCase()+p.slice(1),h)),t.defines.forEach((h,p)=>s.defines.set(e+p.charAt(0).toUpperCase()+p.slice(1),h));const A=new Map([["fragment",r],["vertex",i]]);ge(e,d,s.defines),ge(e,d,A),r=A.get("fragment"),i=A.get("vertex");const b=t.blendMode;if(s.blendModes.set(b.blendFunction,b),n){t.inputColorSpace!==null&&t.inputColorSpace!==s.colorSpace&&(E+=t.inputColorSpace===P?`color0 = sRGBTransferOETF(color0);
	`:`color0 = sRGBToLinear(color0);
	`),t.outputColorSpace!==Re?s.colorSpace=t.outputColorSpace:t.inputColorSpace!==null&&(s.colorSpace=t.inputColorSpace);const h=/MainImage *\([\w\s,]*?depth[\w\s,]*?\)/;E+=`${e}MainImage(color0, UV, `,(s.attributes&H.DEPTH)!==0&&h.test(r)&&(E+="depth, ",s.readDepth=!0),E+=`color1);
	`;const p=e+"BlendOpacity";s.uniforms.set(p,b.opacity),E+=`color0 = blend${b.blendFunction}(color0, color1, ${p});

	`,v+=`uniform float ${p};

`}if(v+=r+`
`,i!==null&&(D+=i+`
`),u.set(f.FRAGMENT_HEAD,v),u.set(f.FRAGMENT_MAIN_UV,_),u.set(f.FRAGMENT_MAIN_IMAGE,E),u.set(f.VERTEX_HEAD,D),u.set(f.VERTEX_MAIN_SUPPORT,l),t.extensions!==null)for(const h of t.extensions)s.extensions.add(h)}}var Te=class extends F{constructor(e,...t){super("EffectPass"),this.fullscreenMaterial=new Ht(null,null,null,e),this.listener=s=>this.handleEvent(s),this.effects=[],this.setEffects(t),this.skipRendering=!1,this.minTime=1,this.maxTime=Number.POSITIVE_INFINITY,this.timeScale=1}set mainScene(e){for(const t of this.effects)t.mainScene=e}set mainCamera(e){this.fullscreenMaterial.copyCameraSettings(e);for(const t of this.effects)t.mainCamera=e}get encodeOutput(){return this.fullscreenMaterial.encodeOutput}set encodeOutput(e){this.fullscreenMaterial.encodeOutput=e}get dithering(){return this.fullscreenMaterial.dithering}set dithering(e){const t=this.fullscreenMaterial;t.dithering=e,t.needsUpdate=!0}setEffects(e){for(const t of this.effects)t.removeEventListener("change",this.listener);this.effects=e.sort((t,s)=>s.attributes-t.attributes);for(const t of this.effects)t.addEventListener("change",this.listener)}updateMaterial(){const e=new rt;let t=0;for(const a of this.effects)if(a.blendMode.blendFunction===c.DST)e.attributes|=a.getAttributes()&H.DEPTH;else{if((e.attributes&a.getAttributes()&H.CONVOLUTION)!==0)throw new Error(`Convolution effects cannot be merged (${a.name})`);kt("e"+t++,a,e)}let s=e.shaderParts.get(f.FRAGMENT_HEAD),r=e.shaderParts.get(f.FRAGMENT_MAIN_IMAGE),i=e.shaderParts.get(f.FRAGMENT_MAIN_UV);const n=/\bblend\b/g;for(const a of e.blendModes.values())s+=a.getShaderCode().replace(n,`blend${a.blendFunction}`)+`
`;(e.attributes&H.DEPTH)!==0?(e.readDepth&&(r=`float depth = readDepth(UV);

	`+r),this.needsDepthTexture=this.getDepthTexture()===null):this.needsDepthTexture=!1,e.colorSpace===P&&(r+=`color0 = sRGBToLinear(color0);
	`),e.uvTransformation?(i=`vec2 transformedUv = vUv;
`+i,e.defines.set("UV","transformedUv")):e.defines.set("UV","vUv"),e.shaderParts.set(f.FRAGMENT_HEAD,s),e.shaderParts.set(f.FRAGMENT_MAIN_IMAGE,r),e.shaderParts.set(f.FRAGMENT_MAIN_UV,i);for(const[a,o]of e.shaderParts)o!==null&&e.shaderParts.set(a,o.trim().replace(/^#/,`
#`));this.skipRendering=t===0,this.needsSwap=!this.skipRendering,this.fullscreenMaterial.setShaderData(e)}recompile(){this.updateMaterial()}getDepthTexture(){return this.fullscreenMaterial.depthBuffer}setDepthTexture(e,t=Z){this.fullscreenMaterial.depthBuffer=e,this.fullscreenMaterial.depthPacking=t;for(const s of this.effects)s.setDepthTexture(e,t)}render(e,t,s,r,i){for(const n of this.effects)n.update(e,t,r);if(!this.skipRendering||this.renderToScreen){const n=this.fullscreenMaterial;n.inputBuffer=t.texture,n.time+=r*this.timeScale,e.setRenderTarget(this.renderToScreen?null:s),e.render(this.scene,this.camera)}}setSize(e,t){this.fullscreenMaterial.setSize(e,t);for(const s of this.effects)s.setSize(e,t)}initialize(e,t,s){this.renderer=e;for(const r of this.effects)r.initialize(e,t,s);this.updateMaterial(),s!==void 0&&s!==J&&(this.fullscreenMaterial.defines.FRAMEBUFFER_PRECISION_HIGH="1")}dispose(){super.dispose();for(const e of this.effects)e.removeEventListener("change",this.listener),e.dispose()}handleEvent(e){e.type==="change"&&this.recompile()}};const zt=()=>{const t=document.createElement("canvas");t.width=64,t.height=64;const s=t.getContext("2d");if(!s)throw new Error("2D context not available");s.fillStyle="black",s.fillRect(0,0,t.width,t.height);const r=new ce(t);r.minFilter=z,r.magFilter=z,r.generateMipmaps=!1;const i=[];let n=null;const a=64;let o=.1*64;const u=1/a,v=()=>{s.fillStyle="black",s.fillRect(0,0,t.width,t.height)},_=l=>{const g={x:l.x*64,y:(1-l.y)*64};let d=1;const A=S=>Math.sin(S*Math.PI/2),b=S=>-S*(S-2);l.age<a*.3?d=A(l.age/(a*.3)):d=b(1-(l.age-a*.3)/(a*.7))||0,d*=l.force;const h=`${(l.vx+1)/2*255}, ${(l.vy+1)/2*255}, ${d*255}`,p=320;s.shadowOffsetX=p,s.shadowOffsetY=p,s.shadowBlur=o,s.shadowColor=`rgba(${h},${.22*d})`,s.beginPath(),s.fillStyle="rgba(255,0,0,1)",s.arc(g.x-p,g.y-p,o,0,Math.PI*2),s.fill()};return{canvas:t,texture:r,addTouch:l=>{let g=0,d=0,A=0;if(n){const b=l.x-n.x,h=l.y-n.y;if(b===0&&h===0)return;const p=b*b+h*h,S=Math.sqrt(p);d=b/(S||1),A=h/(S||1),g=Math.min(p*1e4,1)}n={x:l.x,y:l.y},i.push({x:l.x,y:l.y,age:0,force:g,vx:d,vy:A})},update:()=>{v();for(let l=i.length-1;l>=0;l--){const g=i[l],d=g.force*u*(1-g.age/a);g.x+=g.vx*d,g.y+=g.vy*d,g.age++,g.age>a&&i.splice(l,1)}for(const l of i)_(l);r.needsUpdate=!0},set radiusScale(l){o=.1*64*l},get radiusScale(){return o/(.1*64)},size:64}},Vt=(e,t)=>{const s=`
    uniform sampler2D uTexture;
    uniform float uStrength;
    uniform float uTime;
    uniform float uFreq;

    void mainUv(inout vec2 uv) {
      vec4 tex = texture2D(uTexture, uv);
      float vx = tex.r * 2.0 - 1.0;
      float vy = tex.g * 2.0 - 1.0;
      float intensity = tex.b;

      float wave = 0.5 + 0.5 * sin(uTime * uFreq + intensity * 6.2831853);

      float amt = uStrength * intensity * wave;

      uv += vec2(vx, vy) * amt;
    }
    `;return new we("LiquidEffect",s,{uniforms:new Map([["uTexture",new T(e)],["uStrength",new T(t?.strength??.025)],["uTime",new T(0)],["uFreq",new T(t?.freq??4.5)]])})},Be={square:0,circle:1,triangle:2,diamond:3},Wt=`
void main() {
  gl_Position = vec4(position, 1.0);
}
`,qt=`
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform float uScale;
uniform float uDensity;
uniform float uPixelJitter;
uniform int   uEnableRipples;
uniform float uRippleSpeed;
uniform float uRippleThickness;
uniform float uRippleIntensity;
uniform float uEdgeFade;

uniform int   uShapeType;
const int SHAPE_SQUARE   = 0;
const int SHAPE_CIRCLE   = 1;
const int SHAPE_TRIANGLE = 2;
const int SHAPE_DIAMOND  = 3;

const int   MAX_CLICKS = 10;

uniform vec2  uClickPos  [MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2. + a.y * a.y * .75);
}
#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

#define FBM_OCTAVES     5
#define FBM_LACUNARITY  1.25
#define FBM_GAIN        1.0

float hash11(float n){ return fract(sin(n)*43758.5453); }

float vnoise(vec3 p){
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip + vec3(0.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
  float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n110 = hash11(dot(ip + vec3(1.0,1.0,0.0), vec3(1.0,57.0,113.0)));
  float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n101 = hash11(dot(ip + vec3(1.0,0.0,1.0), vec3(1.0,57.0,113.0)));
  float n011 = hash11(dot(ip + vec3(0.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  float n111 = hash11(dot(ip + vec3(1.0,1.0,1.0), vec3(1.0,57.0,113.0)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  float y0  = mix(x00, x10, w.y);
  float y1  = mix(x01, x11, w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t){
  vec3 p = vec3(uv * uScale, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < FBM_OCTAVES; ++i){
    sum  += amp * vnoise(p * freq);
    freq *= FBM_LACUNARITY;
    amp  *= FBM_GAIN;
  }
  return sum * 0.5 + 0.5;
}

float maskCircle(vec2 p, float cov){
  float r = sqrt(cov) * .25;
  float d = length(p - 0.5) - r;
  float aa = 0.5 * fwidth(d);
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.0));
}

float maskTriangle(vec2 p, vec2 id, float cov){
  bool flip = mod(id.x + id.y, 2.0) > 0.5;
  if (flip) p.x = 1.0 - p.x;
  float r = sqrt(cov);
  float d  = p.y - r*(1.0 - p.x);
  float aa = fwidth(d);
  return cov * clamp(0.5 - d/aa, 0.0, 1.0);
}

float maskDiamond(vec2 p, float cov){
  float r = sqrt(cov) * 0.564;
  return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

void main(){
  float pixelSize = uPixelSize;
  vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;
  float aspectRatio = uResolution.x / uResolution.y;

  vec2 pixelId = floor(fragCoord / pixelSize);
  vec2 pixelUV = fract(fragCoord / pixelSize);

  float cellPixelSize = 8.0 * pixelSize;
  vec2 cellId = floor(fragCoord / cellPixelSize);
  vec2 cellCoord = cellId * cellPixelSize;
  vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

  float base = fbm2(uv, uTime * 0.05);
  base = base * 0.5 - 0.65;

  float feed = base + (uDensity - 0.5) * 0.3;

  float speed     = uRippleSpeed;
  float thickness = uRippleThickness;
  const float dampT     = 1.0;
  const float dampR     = 10.0;

  if (uEnableRipples == 1) {
    for (int i = 0; i < MAX_CLICKS; ++i){
      vec2 pos = uClickPos[i];
      if (pos.x < 0.0) continue;
      float cellPixelSize = 8.0 * pixelSize;
      vec2 cuv = (((pos - uResolution * .5 - cellPixelSize * .5) / (uResolution))) * vec2(aspectRatio, 1.0);
      float t = max(uTime - uClickTimes[i], 0.0);
      float r = distance(uv, cuv);
      float waveR = speed * t;
      float ring  = exp(-pow((r - waveR) / thickness, 2.0));
      float atten = exp(-dampT * t) * exp(-dampR * r);
      feed = max(feed, ring * atten * uRippleIntensity);
    }
  }

  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);

  float h = fract(sin(dot(floor(fragCoord / uPixelSize), vec2(127.1, 311.7))) * 43758.5453);
  float jitterScale = 1.0 + (h - 0.5) * uPixelJitter;
  float coverage = bw * jitterScale;
  float M;
  if      (uShapeType == SHAPE_CIRCLE)   M = maskCircle (pixelUV, coverage);
  else if (uShapeType == SHAPE_TRIANGLE) M = maskTriangle(pixelUV, pixelId, coverage);
  else if (uShapeType == SHAPE_DIAMOND)  M = maskDiamond(pixelUV, coverage);
  else                                   M = coverage;

  if (uEdgeFade > 0.0) {
    vec2 norm = gl_FragCoord.xy / uResolution;
    float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
    float fade = smoothstep(0.0, uEdgeFade, edge);
    M *= fade;
  }

  vec3 color = uColor;

  // Перевод из линейного в sRGB для корректного вывода цвета
  vec3 srgbColor = mix(
    color * 12.92,
    1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, color)
  );

  fragColor = vec4(srgbColor, M);
}
`,ne=10;function Ee(e,t){e.resizeObserver?.disconnect(),e.raf!==void 0&&cancelAnimationFrame(e.raf),e.quad?.geometry.dispose(),e.material.dispose(),e.composer?.dispose(),e.renderer.dispose(),e.renderer.forceContextLoss(),e.renderer.domElement.parentElement===t&&e.renderer.domElement.remove()}function Xt(e,t,s){const r=e.uniforms.get("uStrength");r&&(r.value=t);const i=e.uniforms.get("uFreq");i&&(i.value=s)}function Kt(e,t){for(const s of e.passes){const r=s;if(r.effects)for(const i of r.effects){const n=i.uniforms?.get("uTime");n&&(n.value=t)}}}function $t(){if(typeof globalThis.window<"u"&&globalThis.window.crypto?.getRandomValues){const e=new Uint32Array(1);return globalThis.window.crypto.getRandomValues(e),e[0]/4294967295}return Math.random()}const Zt=({variant:e="square",pixelSize:t=3,color:s="#B497CF",className:r,style:i,antialias:n=!0,patternScale:a=2,patternDensity:o=1,liquid:u=!1,liquidStrength:v=.1,liquidRadius:_=1,pixelSizeJitter:E=0,enableRipples:D=!0,rippleIntensityScale:l=1,rippleThickness:g=.1,rippleSpeed:d=.3,liquidWobbleSpeed:A=4.5,autoPauseOffscreen:b=!0,speed:h=.5,transparent:p=!0,edgeFade:S=.5,noiseAmount:V=0})=>{const K=k.useRef(null),m=k.useRef({visible:!0}),y=k.useRef(h),x=k.useRef(null),w=k.useRef(null);return k.useEffect(()=>{const N=K.current;if(!N)return;y.current=h;const te=["antialias","liquid","noiseAmount"],W={antialias:n,liquid:u,noiseAmount:V};let O=!1;if(!x.current)O=!0;else if(w.current){for(const G of te)if(w.current[G]!==W[G]){O=!0;break}}if(O)x.current&&(Ee(x.current,N),x.current=null),x.current=jt({container:N,antialias:n,transparent:p,color:s,variant:e,pixelSize:t,patternScale:a,patternDensity:o,pixelSizeJitter:E,enableRipples:D,rippleSpeed:d,rippleThickness:g,rippleIntensityScale:l,edgeFade:S,liquid:u,liquidStrength:v,liquidRadius:_,liquidWobbleSpeed:A,noiseAmount:V,autoPauseOffscreen:b,visibilityRef:m,speedRef:y,threeRef:x});else{const G=x.current;Qt(G,{variant:e,pixelSize:t,color:s,patternScale:a,patternDensity:o,pixelSizeJitter:E,enableRipples:D,rippleIntensityScale:l,rippleThickness:g,rippleSpeed:d,edgeFade:S,transparent:p,liquidStrength:v,liquidWobbleSpeed:A,liquidRadius:_})}return w.current=W,()=>{x.current&&O||x.current&&(Ee(x.current,N),x.current=null)}},[n,u,V,t,a,o,D,l,g,d,E,S,p,v,_,A,b,e,s,h]),Fe.jsx("div",{ref:K,className:`w-full h-full relative overflow-hidden ${r??""}`,style:i,"aria-label":"PixelBlast interactive background"})};function jt(e){const{container:t,antialias:s,transparent:r,color:i,variant:n,pixelSize:a,patternScale:o,patternDensity:u,pixelSizeJitter:v,enableRipples:_,rippleSpeed:E,rippleThickness:D,rippleIntensityScale:l,edgeFade:g,liquid:d,liquidStrength:A,liquidRadius:b,liquidWobbleSpeed:h,noiseAmount:p,autoPauseOffscreen:S,visibilityRef:V,speedRef:K}=e,m=new We({canvas:document.createElement("canvas"),antialias:s,alpha:!0,powerPreference:"high-performance"});m.domElement.style.width="100%",m.domElement.style.height="100%",m.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),t.appendChild(m.domElement),r?m.setClearAlpha(0):m.setClearColor(0,1);const y={uResolution:{value:new B(0,0)},uTime:{value:0},uColor:{value:new Ce(i)},uClickPos:{value:Array.from({length:ne},()=>new B(-1,-1))},uClickTimes:{value:new Float32Array(ne)},uShapeType:{value:Be[n]??0},uPixelSize:{value:a*m.getPixelRatio()},uScale:{value:o},uDensity:{value:u},uPixelJitter:{value:v},uEnableRipples:{value:_?1:0},uRippleSpeed:{value:E},uRippleThickness:{value:D},uRippleIntensity:{value:l},uEdgeFade:{value:g}},x=new ae,w=new be(-1,1,1,-1,0,1),N=new ee({vertexShader:Wt,fragmentShader:qt,uniforms:y,transparent:!0,depthTest:!1,depthWrite:!1,glslVersion:qe}),te=new Xe(2,2),W=new _e(te,N);x.add(W);const O=new Ke,G=()=>{const M=t.clientWidth||1,R=t.clientHeight||1;m.setSize(M,R,!1),y.uResolution.value.set(m.domElement.width,m.domElement.height),e.threeRef.current?.composer&&e.threeRef.current.composer.setSize(m.domElement.width,m.domElement.height),y.uPixelSize.value=a*m.getPixelRatio()};G();const le=new ResizeObserver(G);le.observe(t);const ue=$t()*1e3;let C,I,q;if(d){I=zt(),I.radiusScale=b,C=new pe(m);const M=new ve(x,w);q=Vt(I.texture,{strength:A,freq:h});const R=new Te(w,q);R.renderToScreen=!0,C.addPass(M),C.addPass(R)}if(p>0){C||(C=new pe(m),C.addPass(new ve(x,w)));const M=new we("NoiseEffect","uniform float uTime; uniform float uAmount; float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);} void mainUv(inout vec2 uv){} void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){ float n=hash(floor(uv*vec2(1920.0,1080.0))+floor(uTime*60.0)); float g=(n-0.5)*uAmount; outputColor=inputColor+vec4(vec3(g),0.0);} ",{uniforms:new Map([["uTime",new T(0)],["uAmount",new T(p)]])}),R=new Te(w,M);if(R.renderToScreen=!0,C.passes.length>0)for(const U of C.passes)U.renderToScreen=!1;C.addPass(R)}C&&C.setSize(m.domElement.width,m.domElement.height);const fe=M=>{const R=m.domElement.getBoundingClientRect(),U=m.domElement.width/R.width,L=m.domElement.height/R.height;return{fx:(M.clientX-R.left)*U,fy:(R.height-(M.clientY-R.top))*L,w:m.domElement.width,h:m.domElement.height}},$={renderer:m,scene:x,camera:w,material:N,clock:O,clickIx:0,uniforms:y,resizeObserver:le,quad:W,timeOffset:ue,composer:C,touch:I,liquidEffect:q},De=M=>{const{fx:R,fy:U}=fe(M),L=$.clickIx;y.uClickPos.value[L].set(R,U),y.uClickTimes.value[L]=y.uTime.value,$.clickIx=(L+1)%ne},Pe=M=>{if(!I)return;const{fx:R,fy:U,w:L,h:Ie}=fe(M);I.addTouch({x:R/L,y:U/Ie})};m.domElement.addEventListener("pointerdown",De,{passive:!0}),m.domElement.addEventListener("pointermove",Pe,{passive:!0});let j=0;const se=()=>{if(S&&!V.current.visible){j=requestAnimationFrame(se);return}if(y.uTime.value=ue+O.getElapsedTime()*K.current,q){const M=q.uniforms.get("uTime");M&&(M.value=y.uTime.value)}C?(I&&I.update(),Kt(C,y.uTime.value),C.render()):m.render(x,w),j=requestAnimationFrame(se)};return j=requestAnimationFrame(se),$.raf=j,$}function Qt(e,t){e.uniforms.uShapeType.value=Be[t.variant]??0,e.uniforms.uPixelSize.value=t.pixelSize*e.renderer.getPixelRatio(),e.uniforms.uColor.value.set(t.color),e.uniforms.uScale.value=t.patternScale,e.uniforms.uDensity.value=t.patternDensity,e.uniforms.uPixelJitter.value=t.pixelSizeJitter,e.uniforms.uEnableRipples.value=t.enableRipples?1:0,e.uniforms.uRippleIntensity.value=t.rippleIntensityScale,e.uniforms.uRippleThickness.value=t.rippleThickness,e.uniforms.uRippleSpeed.value=t.rippleSpeed,e.uniforms.uEdgeFade.value=t.edgeFade,t.transparent?e.renderer.setClearAlpha(0):e.renderer.setClearColor(0,1),e.liquidEffect&&Xt(e.liquidEffect,t.liquidStrength,t.liquidWobbleSpeed),e.touch&&(e.touch.radiusScale=t.liquidRadius)}export{Zt as default};
