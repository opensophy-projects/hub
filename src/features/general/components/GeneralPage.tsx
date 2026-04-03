import React, { useState, useEffect, useRef } from 'react';
import { useMotionValue, useAnimationFrame, useTransform, motion } from 'framer-motion';
import { SingularityShaders } from './SingularityShaders';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import Navigation from '@/features/navigation/components/Navigation';

interface ShinyTextProps {
  text: string;
  speed?: number;
  color?: string;
  shineColor?: string;
  spread?: number;
}

const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  speed = 4,
  color = 'rgba(255,255,255,0.55)',
  shineColor = 'rgba(255,255,255,0.95)',
  spread = 110,
}) => {
  const progress   = useMotionValue(0);
  const elapsedRef = useRef(0);
  const lastRef    = useRef<number | null>(null);

  useAnimationFrame(time => {
    if (lastRef.current === null) { lastRef.current = time; return; }
    elapsedRef.current += time - lastRef.current;
    lastRef.current = time;
    const p = (elapsedRef.current % (speed * 1000)) / (speed * 1000) * 100;
    progress.set(p);
  });

  const backgroundPosition = useTransform(progress, p => `${150 - p * 2}% center`);

  return (
    <motion.span
      style={{
        backgroundImage: `linear-gradient(${spread}deg, ${color} 0%, ${color} 35%, ${shineColor} 50%, ${color} 65%, ${color} 100%)`,
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundPosition,
        display: 'inline',
      }}
    >
      {text}
    </motion.span>
  );
};

const LandingContent: React.FC = () => {
  const [isNegative, setIsNegative] = useState(() => {
    if (typeof window === 'undefined') return true;
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
    window.addEventListener('storage', onStorage);
    window.addEventListener('hub:theme-change', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('hub:theme-change', onCustom);
    };
  }, []);

  useEffect(() => {
    const readOffset = () => {
      const val = getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-left').trim();
      setNavOffset(val ? parseInt(val, 10) : 0);
    };
    readOffset();
    const observer = new MutationObserver(readOffset);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });
    return () => observer.disconnect();
  }, []);

  const bg        = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain  = isNegative ? '#ffffff' : '#000000';
  const shinyBase = isNegative ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.35)';
  const shinyGlow = isNegative ? '#ffffff'                : '#000000';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap');
      `}</style>

      <Navigation />

      <section
        style={{
          position: 'relative',
          minHeight: '100svh',
          overflow: 'hidden',
          marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
        }}
      >
        <div style={{ position: 'absolute', inset: 0 }}>
          <SingularityShaders
            speed={0.8} intensity={1.1} size={1.05}
            waveStrength={1} colorShift={1} isNegative={isNegative}
            className="h-full w-full"
          />
        </div>

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%',
          pointerEvents: 'none',
          background: `linear-gradient(to bottom, transparent, ${bg})`,
        }} />

        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-75%, -50%)',
          zIndex: 10,
          textAlign: 'center',
          padding: '0 1.5rem',
          maxWidth: '900px',
          width: '100%',
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

      <section
        style={{
          marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
          padding: 'clamp(4rem, 10vw, 8rem) clamp(2rem, 6vw, 5rem)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <p
          style={{
            fontSize: '1rem',  // значительно увеличили
            fontWeight: 600,    // сделали жирнее
            color: isNegative ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.32)',
            marginBottom: '2rem',
            marginTop: 0,
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.14em',
          }}
        >
          О ПРОЕКТЕ
        </p>

        <p
          style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)',
            fontWeight: 500,
            lineHeight: 1.55,
            margin: 0,
            maxWidth: '100%',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <ShinyText
            text="Opensophy — open-source проект для IT-специалистов. Инструменты, туториалы и материалы по безопасности, разработке и инфраструктуре — в открытом доступе."
            speed={4}
            color={shinyBase}
            shineColor={shinyGlow}
          />
        </p>
      </section>
    </div>
  );
};

const GeneralPage: React.FC = () => (
  <ThemeProvider>
    <LandingContent />
  </ThemeProvider>
);

export default GeneralPage;