import React, { useState, useEffect } from 'react';
import { SingularityShaders } from './SingularityShaders';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import Navigation from '@/features/navigation/components/Navigation';

// ─── Контент (внутри ThemeProvider) ──────────────────────────────────────────

const LandingContent: React.FC = () => {
  const [isNegative, setIsNegative] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') setIsNegative(e.newValue !== 'light');
    };
    const onCustom = (e: Event) => {
      setIsNegative((e as CustomEvent<{ isDark: boolean }>).detail.isDark);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('hub:theme-change', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('hub:theme-change', onCustom);
    };
  }, []);

  const bg       = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain = isNegative ? '#ffffff' : '#000000';
  const textMuted = isNegative ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        .landing-label {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 300;
          font-style: italic;
          letter-spacing: 0.14em;
        }
        .landing-body {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-weight: 300;
          letter-spacing: 0.015em;
        }
      `}</style>

      <Navigation />

      {/* ── HERO ── */}
      <section style={{
        position: 'relative',
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <SingularityShaders
            speed={0.8} intensity={1.1} size={1.05}
            waveStrength={1} colorShift={1} isNegative={isNegative}
            className="h-full w-full"
          />
        </div>

        {/* Fade снизу */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
          pointerEvents: 'none',
          background: `linear-gradient(to bottom, transparent, ${bg})`,
        }} />

        <div style={{
          position: 'relative', zIndex: 10,
          textAlign: 'center', padding: '0 1.5rem',
          maxWidth: '860px', width: '100%',
        }}>
          <h1 style={{
            fontSize: 'clamp(3.5rem, 14vw, 11rem)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            lineHeight: 1,
            margin: 0,
            fontFamily: 'customfont, sans-serif',
            color: textMain,
          }}>
            Opensophy
          </h1>
        </div>
      </section>

      {/* ── О ПРОЕКТЕ ── */}
      <section style={{
        padding: 'clamp(4rem, 10vw, 8rem) clamp(1.5rem, 5vw, 4rem)',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <p
          className="landing-label"
          style={{
            fontSize: '0.72rem',
            color: textMuted,
            marginBottom: '1.5rem',
            marginTop: 0,
          }}
        >
          о проекте
        </p>

        <p
          className="landing-body"
          style={{
            fontSize: 'clamp(1.4rem, 3.2vw, 2.2rem)',
            lineHeight: 1.55,
            color: textMain,
            margin: 0,
          }}
        >
          Opensophy — open-source проект для IT-специалистов. Инструменты, туториалы и материалы по безопасности, разработке и инфраструктуре — в открытом доступе.
        </p>
      </section>
    </div>
  );
};

// ─── Экспорт ─────────────────────────────────────────────────────────────────

const GeneralPage: React.FC = () => (
  <ThemeProvider>
    <LandingContent />
  </ThemeProvider>
);

export default GeneralPage;