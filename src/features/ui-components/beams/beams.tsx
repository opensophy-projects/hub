import React from 'react';

type BeamsProps = {
  beamWidth?: number;
  beamHeight?: number;
  beamNumber?: number;
  lightColor?: string;
  speed?: number;
};

const Beams: React.FC<BeamsProps> = ({ beamWidth = 2, beamHeight = 20, beamNumber = 12, lightColor = '#ffffff', speed = 1 }) => {
  const stripes = Array.from({ length: beamNumber });
  return (
    <div className="relative w-full h-full overflow-hidden bg-black/20">
      {stripes.map((_, i) => (
        <div
          key={i}
          className="absolute top-[-20%] h-[140%]"
          style={{
            left: `${(i / beamNumber) * 100}%`,
            width: `${beamWidth}px`,
            transform: `rotate(${(i % 2 === 0 ? 1 : -1) * beamHeight}deg)`,
            background: `linear-gradient(to bottom, transparent, ${lightColor}, transparent)`,
            opacity: 0.35 + ((i % 5) / 10),
            animation: `beamsPulse ${Math.max(0.2, 3 / Math.max(speed, 0.1))}s ease-in-out infinite`
          }}
        />
      ))}
    </div>
  );
};

export default Beams;
