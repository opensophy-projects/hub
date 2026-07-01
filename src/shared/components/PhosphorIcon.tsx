import React, { useState, useEffect, memo } from 'react';

type AnyIconProps = {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  weight?: 'duotone';
};

type IconComponent = React.FC<AnyIconProps>;


const ICON_NAME_ALIASES: Record<string, string> = {
  'alert-circle': 'WarningCircle',
  'alert-triangle': 'Warning',
  'bar-chart-2': 'ChartBar',
  'book-open': 'BookOpen',
  'chart-no-axes-column': 'ChartBar',
  'file-text': 'FileText',
  'folder-open': 'FolderOpen',
  'refresh-cw': 'ArrowClockwise',
  'user-cog': 'UserGear',
};

// Single module-level cache shared across all usages
const iconCache = new Map<string, IconComponent>();

interface PhosphorIconProps extends AnyIconProps {
  name: string;
}

const PhosphorIcon: React.FC<PhosphorIconProps> = memo(({
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
    const pascal = (ICON_NAME_ALIASES[name] ?? name)
      .split('-')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');
    import('@phosphor-icons/react').then((mod) => {
      const ic = (mod as Record<string, unknown>)[`${pascal}Icon`] as IconComponent | undefined;
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

  return <Icon size={size} className={className} style={style} color={color} weight="duotone" />;
});

PhosphorIcon.displayName = 'PhosphorIcon';

export default PhosphorIcon;