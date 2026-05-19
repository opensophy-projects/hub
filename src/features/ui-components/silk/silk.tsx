/* eslint-disable react/no-unknown-property */
import React, { useMemo, useRef, useEffect } from 'react';
import { Color, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, WebGLRenderer } from 'three';

type NormalizedRGB = [number, number, number];
const hexToNormalizedRGB = (hex: string): NormalizedRGB => {
  const clean = hex.replace('#', '');
  return [parseInt(clean.slice(0, 2), 16) / 255, parseInt(clean.slice(2, 4), 16) / 255, parseInt(clean.slice(4, 6), 16) / 255];
};

const vertexShader = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`;
const fragmentShader = `
varying vec2 vUv;
uniform float uTime; uniform vec3 uColor; uniform float uSpeed; uniform float uScale; uniform float uRotation; uniform float uNoiseIntensity;
const float e = 2.71828182845904523536;
float noise(vec2 texCoord){ float G=e; vec2 r=(G*sin(G*texCoord)); return fract(r.x*r.y*(1.0+texCoord.x)); }
vec2 rotateUvs(vec2 uv, float angle){ float c=cos(angle); float s=sin(angle); return mat2(c,-s,s,c)*uv; }
void main(){ float rnd=noise(gl_FragCoord.xy); vec2 uv=rotateUvs(vUv*uScale,uRotation); vec2 tex=uv*uScale; float tOffset=uSpeed*uTime; tex.y+=0.03*sin(8.0*tex.x-tOffset); float pattern=0.6+0.4*sin(5.0*(tex.x+tex.y+cos(3.0*tex.x+5.0*tex.y)+0.02*tOffset)+sin(20.0*(tex.x+tex.y-0.1*tOffset))); vec4 col=vec4(uColor,1.0)*vec4(pattern)-rnd/15.0*uNoiseIntensity; col.a=1.0; gl_FragColor=col; }
`;

export interface SilkProps { speed?: number; scale?: number; color?: string; noiseIntensity?: number; rotation?: number; }

const Silk: React.FC<SilkProps> = ({ speed = 5, scale = 1, color = '#7B7481', noiseIntensity = 1.5, rotation = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniforms = useMemo(() => ({
    uSpeed: { value: speed }, uScale: { value: scale }, uNoiseIntensity: { value: noiseIntensity }, uColor: { value: new Color(...hexToNormalizedRGB(color)) }, uRotation: { value: rotation }, uTime: { value: 0 }
  }), [speed, scale, noiseIntensity, color, rotation]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mesh = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({ uniforms, vertexShader, fragmentShader }));
    scene.add(mesh);

    const resize = () => renderer.setSize(container.clientWidth, container.clientHeight);
    resize();
    window.addEventListener('resize', resize);

    let raf = 0; let last = performance.now();
    const tick = (t: number) => {
      const delta = (t - last) / 1000; last = t; uniforms.uTime.value += 0.1 * delta;
      renderer.render(scene, camera); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf); window.removeEventListener('resize', resize); container.removeChild(renderer.domElement);
      mesh.geometry.dispose(); (mesh.material as ShaderMaterial).dispose(); renderer.dispose();
    };
  }, [uniforms]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default Silk;