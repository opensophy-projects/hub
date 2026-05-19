import { FC, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

interface BeamsProps {
  beamWidth?: number;
  beamHeight?: number;
  beamNumber?: number;
  lightColor?: string;
  speed?: number;
  noiseIntensity?: number;
  scale?: number;
  rotation?: number;
}

const vertexShader = `
varying vec2 vUv;
uniform float time;
uniform float uSpeed;
uniform float uScale;
void main(){
  vUv = uv;
  vec3 transformed = position;
  transformed.z += sin((position.y + uv.x * 3.0) * (2.0 + uScale) + time * uSpeed) * 0.25;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
uniform vec3 uLightColor;
uniform float uNoiseIntensity;
float random(in vec2 st){ return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123); }
void main(){
  float centerFade = 1.0 - abs(vUv.x - 0.5) * 2.0;
  float grain = random(gl_FragCoord.xy) / 15.0 * uNoiseIntensity;
  vec3 col = uLightColor * (0.35 + centerFade * 0.9) - grain;
  gl_FragColor = vec4(col, 1.0);
}
`;

const Beams: FC<BeamsProps> = ({ beamWidth = 2, beamHeight = 15, beamNumber = 12, lightColor = '#ffffff', speed = 2, noiseIntensity = 1.75, scale = 0.2, rotation = 0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniforms = useMemo(() => ({
    time: { value: 0 },
    uSpeed: { value: speed },
    uScale: { value: scale },
    uNoiseIntensity: { value: noiseIntensity },
    uLightColor: { value: new THREE.Color(lightColor) }
  }), [lightColor, noiseIntensity, scale, speed]);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 20);

    const group = new THREE.Group();
    group.rotation.z = THREE.MathUtils.degToRad(rotation);
    scene.add(group);

    for (let i = 0; i < beamNumber; i++) {
      const geometry = new THREE.PlaneGeometry(beamWidth, beamHeight, 1, 100);
      const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = (i - (beamNumber - 1) / 2) * beamWidth;
      group.add(mesh);
    }

    const ambient = new THREE.AmbientLight('#ffffff', 1);
    const directional = new THREE.DirectionalLight(lightColor, 1);
    directional.position.set(0, 3, 10);
    scene.add(ambient, directional);

    const resize = () => {
      const w = el.clientWidth; const h = el.clientHeight;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    resize(); window.addEventListener('resize', resize);

    let raf = 0; let last = performance.now();
    const loop = (t: number) => {
      const delta = (t - last) / 1000; last = t;
      uniforms.time.value += 0.1 * delta;
      renderer.render(scene, camera); raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf); window.removeEventListener('resize', resize);
      group.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        (mesh.geometry as THREE.BufferGeometry).dispose();
        (mesh.material as THREE.Material).dispose();
      });
      renderer.dispose(); el.removeChild(renderer.domElement);
    };
  }, [beamHeight, beamNumber, beamWidth, lightColor, rotation, uniforms]);

  return <div ref={containerRef} className="w-full h-full relative" />;
};

export default Beams;