import { useState } from 'react';
import RollingText from './rolling-text';

interface RollingTextPreviewProps {
  text?: string;
  inView?: boolean;
  inViewOnce?: boolean;
  duration?: number;
  delay?: number;
  className?: string;
}

const RollingTextPreview: React.FC<RollingTextPreviewProps> = ({
  text      = 'Перекатывающийся текст',
  inView    = false,
  inViewOnce = true,
  duration  = 0.5,
  delay     = 0.1,
  className = 'text-4xl font-bold',
}) => {
  const [key, setKey] = useState(0);

  return (
    <div className="flex flex-col items-center gap-6">
      <RollingText
        key={key}
        text={text}
        inView={inView}
        inViewOnce={inViewOnce}
        transition={{ duration, delay, ease: 'easeOut' }}
        className={className}
      />
      <button
        onClick={() => setKey(k => k + 1)}
        style={{
          fontSize: 12,
          padding: '6px 14px',
          borderRadius: 8,
          border: '1px solid rgba(128,128,128,0.25)',
          background: 'rgba(128,128,128,0.1)',
          cursor: 'pointer',
          color: 'inherit',
        }}
      >
        Повторить
      </button>
    </div>
  );
};

export default RollingTextPreview;