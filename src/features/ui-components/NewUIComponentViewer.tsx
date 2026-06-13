import React, { useState, useEffect } from 'react';
import { useTheme } from '@/shared/contexts/useTheme';
import { loadComponent } from './loader';
import { ComponentWrapper } from './ComponentWrapper';
import type { LoadedComponent, UniversalProps } from './types';

// Дефолтные универсальные пропсы — без визуального эффекта,
// применяются всегда (без интерактивного UI настроек).
const DEFAULT_UNIVERSAL_PROPS: UniversalProps = {
  enableUniversalProps: true,
  scale: 1,
  color: undefined,
  colorMode: 'original',
  offsetX: 0,
  offsetY: 0,
  rotateZ: 0,
  justifyContent: 'center',
  alignItems: 'center',
  opacity: 1,
  blur: 0,
  brightness: 1,
  contrast: 1,
  saturate: 1,
};

interface UIComponentViewerProps {
  componentId: string;
  /** Опционально: переопределить универсальные пропсы для конкретного вызова. */
  universalProps?: UniversalProps;
}

const UIComponentViewer: React.FC<UIComponentViewerProps> = ({ componentId, universalProps }) => {
  const { isDark } = useTheme();
  const [data, setData] = useState<LoadedComponent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setData(null);

    loadComponent(componentId).then((result) => {
      if (!active) return;
      setData(result);
      setLoading(false);
    });

    return () => { active = false; };
  }, [componentId]);

  if (loading) {
    return <div className="not-prose" style={{ margin: '1.25rem 0', minHeight: 80 }} />;
  }

  if (!data) {
    return null;
  }

  const { Component } = data;
  const resolvedProps = { ...DEFAULT_UNIVERSAL_PROPS, ...universalProps };

  return (
    <div className="not-prose" style={{ margin: '1.25rem 0', overflow: 'visible', position: 'relative' }}>
      <div style={{ width: '100%', minHeight: 0, minWidth: 0, position: 'relative' }}>
        <ComponentWrapper {...resolvedProps} isDark={isDark} layoutMode="content" className="w-full h-full">
          <Component />
        </ComponentWrapper>
      </div>
    </div>
  );
};

export default UIComponentViewer;