import { useEffect } from 'react';
import LineShadowText from './line-shadow-text';

interface LineShadowTextPreviewProps {
  text?: string;
  shadowColor?: string;
  className?: string;
}

const KEYFRAMES = `
@keyframes line-shadow {
  0%   { background-position: 0 0; }
  100% { background-position: 100% -100%; }
}
`;

const LineShadowTextPreview: React.FC<LineShadowTextPreviewProps> = ({
  text        = 'LineShadow',
  shadowColor = '#a855f7',
  className   = 'text-6xl font-bold',
}) => {
  useEffect(() => {
    const id  = 'line-shadow-keyframes';
    if (document.getElementById(id)) return;
    const el  = document.createElement('style');
    el.id     = id;
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  return (
    <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
      <LineShadowText shadowColor={shadowColor} className={className}>
        {text}
      </LineShadowText>
    </div>
  );
};

export default LineShadowTextPreview;