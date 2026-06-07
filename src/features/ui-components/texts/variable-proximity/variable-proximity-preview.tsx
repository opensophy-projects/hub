import React, { useRef } from 'react';
import VariableProximity from './variable-proximity';

interface VariableProximityPreviewProps {
  label?: string;
  fromFontVariationSettings?: string;
  toFontVariationSettings?: string;
  radius?: number;
  falloff?: 'linear' | 'exponential' | 'gaussian';
  className?: string;
}

const VariableProximityPreview: React.FC<VariableProximityPreviewProps> = ({
  label = 'Наведи курсор',
  fromFontVariationSettings = "'wght' 400, 'wdth' 100",
  toFontVariationSettings = "'wght' 900, 'wdth' 125",
  radius = 100,
  falloff = 'linear',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Загружаем Roboto Flex прямо здесь */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,75..125,100..900&display=swap');
        .vp-container { font-family: 'Roboto Flex', sans-serif; }
      `}</style>

      <div
        ref={containerRef}
        className="vp-container"
        style={{
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'crosshair',
          userSelect: 'none',
        }}
      >
        <VariableProximity
          label={label}
          fromFontVariationSettings={fromFontVariationSettings}
          toFontVariationSettings={toFontVariationSettings}
          containerRef={containerRef}
          radius={radius}
          falloff={falloff}
          style={{
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            lineHeight: 1.2,
            fontFamily: "'Roboto Flex', sans-serif",
          }}
          className={className}
        />
      </div>
    </>
  );
};

export default VariableProximityPreview;