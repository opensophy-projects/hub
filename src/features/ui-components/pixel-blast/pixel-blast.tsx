import React from 'react';

type PixelBlastVariant = 'square' | 'circle' | 'triangle' | 'diamond';

type PixelBlastProps = {
  variant?: PixelBlastVariant;
  pixelSize?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

const PixelBlast: React.FC<PixelBlastProps> = ({ variant = 'square', pixelSize = 8, color = '#ffffff', className, style }) => {
  return (
    <div
      className={`w-full h-full ${className ?? ''}`}
      style={{
        ...style,
        backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
        backgroundSize: `${Math.max(2, pixelSize)}px ${Math.max(2, pixelSize)}px`,
        borderRadius: variant === 'circle' ? '50%' : 0
      }}
    />
  );
};

export default PixelBlast;
