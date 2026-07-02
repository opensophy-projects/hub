import { useState } from 'react';
import CountUp from './count-up';

interface CountUpPreviewProps {
  to?: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  separator?: string;
}

export default function CountUpPreview({
  to = 100,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  separator = '',
}: CountUpPreviewProps) {
  const [defaultKey, setDefaultKey] = useState(0);
  const [gradientKey, setGradientKey] = useState(0);
  const [startManual, setStartManual] = useState(false);
  const [manualKey, setManualKey] = useState(0);

  const handleManualStart = () => {
    setStartManual(false);
    setManualKey(k => k + 1);
    // небольшая задержка чтобы сбросить startWhen
    setTimeout(() => setStartManual(true), 50);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1.5rem' }}>

      {/* --- Default --- */}
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text, #fff)', marginBottom: '0.5rem' }}>
          Default
        </p>
        <div style={{
          position: 'relative',
          background: 'var(--color-surface, #111)',
          border: '1px solid var(--color-border, #222)',
          borderRadius: '0.75rem',
          padding: '2.5rem 1rem',
          textAlign: 'center',
        }}>
          {/* кнопка перезапуска */}
          <button
            onClick={() => setDefaultKey(k => k + 1)}
            title="Перезапустить"
            style={{
              position: 'absolute', top: '0.75rem', right: '0.75rem',
              background: 'rgba(255,255,255,0.08)', border: 'none',
              borderRadius: '0.5rem', padding: '0.4rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fff' }}>
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <CountUp
            key={defaultKey}
            from={from}
            to={to}
            direction={direction}
            delay={delay}
            duration={duration}
            separator={separator}
            style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 700, color: '#fff' } as React.CSSProperties}
          />
        </div>
      </div>

      {/* --- Start Programmatically --- */}
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text, #fff)', marginBottom: '0.5rem' }}>
          Start Programatically
        </p>
        <div style={{
          position: 'relative',
          background: 'var(--color-surface, #111)',
          border: '1px solid var(--color-border, #222)',
          borderRadius: '0.75rem',
          padding: '2.5rem 1rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <button
            onClick={handleManualStart}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '0.5rem',
              padding: '0.4rem 0.9rem',
              color: '#fff',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Count to {to}!
          </button>

          <CountUp
            key={manualKey}
            from={from}
            to={to}
            direction={direction}
            delay={delay}
            duration={duration}
            separator={separator}
            startWhen={startManual}
            style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 700, color: '#fff' } as React.CSSProperties}
          />
        </div>
      </div>

      {/* --- With Gradient --- */}
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text, #fff)', marginBottom: '0.25rem' }}>
          With Gradient
        </p>
        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.5rem' }}>
          You can wrap the counter with other components such as <code>&lt;GradientText /&gt;</code>
        </p>
        <div style={{
          position: 'relative',
          background: 'var(--color-surface, #111)',
          border: '1px solid var(--color-border, #222)',
          borderRadius: '0.75rem',
          padding: '2.5rem 1rem',
          textAlign: 'center',
        }}>
          <button
            onClick={() => setGradientKey(k => k + 1)}
            title="Перезапустить"
            style={{
              position: 'absolute', top: '0.75rem', right: '0.75rem',
              background: 'rgba(255,255,255,0.08)', border: 'none',
              borderRadius: '0.5rem', padding: '0.4rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#fff' }}>
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          {/* GradientText обёртка — inline через backgroundClip */}
          <span style={{
            background: 'linear-gradient(90deg, #c084fc, #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block',
          }}>
            <CountUp
              key={gradientKey}
              from={from}
              to={to}
              direction={direction}
              delay={delay}
              duration={duration}
              separator={separator}
              style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 700 } as React.CSSProperties}
            />
          </span>
        </div>
      </div>

    </div>
  );
}