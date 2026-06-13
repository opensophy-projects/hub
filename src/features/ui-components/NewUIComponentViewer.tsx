import React, { useState, useEffect } from 'react';
import { loadComponent } from './loader';

type AnyComponent = React.ComponentType<Record<string, unknown>>;

interface UIComponentViewerProps {
  componentId: string;
}

const UIComponentViewer: React.FC<UIComponentViewerProps> = ({ componentId }) => {
  const [Component, setComponent] = useState<AnyComponent | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setComponent(null);

    loadComponent(componentId).then((comp) => {
      if (!active) return;
      setComponent(comp);
      setLoading(false);
    });

    return () => { active = false; };
  }, [componentId]);

  if (loading) {
    return (
      <div className="not-prose" style={{ margin: '1.25rem 0', minHeight: 80 }} />
    );
  }

  if (!Component) {
    return null;
  }

  return (
    <div className="not-prose" style={{ margin: '1.25rem 0', overflow: 'visible', position: 'relative' }}>
      <Component />
    </div>
  );
};

export default UIComponentViewer;