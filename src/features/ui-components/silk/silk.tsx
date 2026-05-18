import React, { useEffect, useRef } from 'react';

export interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
}

const Silk: React.FC<SilkProps> = ({ speed = 5, scale = 1, color = '#7B7481', noiseIntensity = 1.5, rotation = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.setProperty('--silk-color', color);
    ref.current.style.setProperty('--silk-speed', `${Math.max(0.1, speed)}s`);
    ref.current.style.setProperty('--silk-scale', `${scale}`);
    ref.current.style.setProperty('--silk-noise', `${noiseIntensity}`);
    ref.current.style.setProperty('--silk-rot', `${rotation}rad`);
  }, [speed, scale, color, noiseIntensity, rotation]);

  return <div ref={ref} className="silk-fallback w-full h-full" />;
};

export default Silk;
