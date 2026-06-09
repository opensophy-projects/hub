import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import Navigation from '@/features/navigation/components/Navigation';
import SplitText from '@/features/ui-components/texts/split-text/split-text';

// ─── Hero Section ─────────────────────────────────────────────────────────────

interface HeroSectionProps {
  isNegative: boolean;
  navOffset?: number;
}

const HeroSection: React.FC<HeroSectionProps> = ({ isNegative, navOffset = 0 }) => {
  const bg       = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain = isNegative ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)';
  const textMut  = isNegative ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.42)';

  return (
    <section
      style={{
        minHeight:  '100svh',
        background: bg,
        display:    'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
        padding:    'clamp(6rem, 14vw, 10rem) clamp(2rem, 6vw, 5rem) clamp(4rem, 8vw, 6rem)',
        boxSizing:  'border-box',
        width:      '100%',
        overflow:   'hidden',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .resume-hero-label {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin-bottom: 2.5rem;
        }

        .resume-hero-heading {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: clamp(1.9rem, 4.5vw, 3.8rem);
          font-weight: 500;
          line-height: 1.45;
          margin: 0;
          max-width: 820px;
        }

        .resume-hero-heading .split-char,
        .resume-hero-heading .split-word {
          will-change: transform, opacity;
        }

        /* Override SplitText default centering for left-aligned hero */
        .resume-hero-heading.split-parent {
          text-align: left !important;
          display: block !important;
        }
      `}</style>

      <p className="resume-hero-label" style={{ color: textMut }}>
        резюме
      </p>

      <h1 className="resume-hero-heading" style={{ color: textMain }}>
        <SplitText
          text="Привет, меня зовут Даниил, также известен в it-сообществах как глава проекта opensophy или юзернеймов @opensophy."
          splitType="words"
          tag="span"
          textAlign="left"
          duration={0.9}
          delay={38}
          ease="power3.out"
          threshold={0.05}
          rootMargin="-40px"
          from={{ opacity: 0, y: 28 }}
          to={{ opacity: 1, y: 0 }}
          className="resume-hero-heading"
        />
      </h1>
    </section>
  );
};

// ─── ResumeContent ────────────────────────────────────────────────────────────

const ResumeContent: React.FC = () => {
  const [isNegative, setIsNegative] = useState(() => {
    if (typeof globalThis.window === 'undefined') return true;
    return localStorage.getItem('theme') !== 'light';
  });

  const [navOffset, setNavOffset] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') setIsNegative(e.newValue !== 'light');
    };
    const onCustom = (e: Event) => {
      setIsNegative((e as CustomEvent<{ isDark: boolean }>).detail.isDark);
    };
    globalThis.addEventListener('storage', onStorage);
    globalThis.addEventListener('hub:theme-change', onCustom);
    return () => {
      globalThis.removeEventListener('storage', onStorage);
      globalThis.removeEventListener('hub:theme-change', onCustom);
    };
  }, []);

  useEffect(() => {
    const readOffset = () => {
      const val = getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-left').trim();
      setNavOffset(val ? Number.parseInt(val, 10) : 0);
    };
    readOffset();
    const observer = new MutationObserver(readOffset);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  const bg = isNegative ? '#0a0a0a' : '#E8E7E3';

  return (
    <div style={{ minHeight: '100vh', background: bg }}>
      <Navigation floatingChrome />
      <HeroSection isNegative={isNegative} navOffset={navOffset} />
    </div>
  );
};

// ─── ResumePage ───────────────────────────────────────────────────────────────

const ResumePage: React.FC = () => (
  <ThemeProvider>
    <ResumeContent />
  </ThemeProvider>
);

export default ResumePage;