import React, { useState, useEffect, memo } from 'react';

type AnyIconProps = {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
};

type IconComponent = React.FC<AnyIconProps>;

// Single module-level cache shared across all usages
const iconCache = new Map<string, IconComponent>();

interface LucideIconProps extends AnyIconProps {
  name: string;
}

const LucideIcon: React.FC<LucideIconProps> = memo(({
  name,
  size = 16,
  className,
  style,
  color,
}) => {
  const [Icon, setIcon] = useState<IconComponent | null>(
    () => iconCache.get(name) ?? null
  );

  useEffect(() => {
    if (!name || iconCache.has(name)) return;
    const pascal = name
      .split('-')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');
    import('lucide-react').then((mod) => {
      const ic = (mod as Record<string, unknown>)[pascal] as IconComponent | undefined;
      if (ic) {
        iconCache.set(name, ic);
        setIcon(() => ic);
      }
    });
  }, [name]);

  // Placeholder keeps the same dimensions while icon loads — no layout shift
  if (!Icon) {
    return (
      <span
        style={{ width: size, height: size, display: 'inline-block', flexShrink: 0 }}
      />
    );
  }

  return <Icon size={size} className={className} style={style} color={color} />;
});

LucideIcon.displayName = 'LucideIcon';

export default LucideIcon;