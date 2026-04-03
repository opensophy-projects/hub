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
  const textMuted = isNegative ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const labelCol  = isNegative ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap');
        .about-title {
          font-family: 'UnifixSP', sans-serif;
          letter-spacing: 0.18em;
        }
        .about-main {
          font-family: 'Inter', sans-serif;
          font-weight: 400;
          letter-spacing: 0.01em;
        }
        .about-secondary {
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          letter-spacing: 0.01em;
        }
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
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-85%, -50%)',
          zIndex: 10,
        }}>
          <h1 style={{
            fontSize: 'clamp(3.5rem, 14vw, 11rem)',
            fontWeight: 700,
            letterSpacing: '0.08em',
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
        }}
      >
        <p
          className="about-title"
          style={{
            fontSize: '0.75rem',
            color: labelCol,
            marginBottom: '2.5rem',
          }}
        >
          О ПРОЕКТЕ
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '2.5rem',
            maxWidth: '1100px',
          }}
        >
          <p
            className="about-main"
            style={{
              fontSize: 'clamp(1.1rem, 1.6vw, 1.5rem)',
              lineHeight: 1.7,
              color: textMuted,
            }}
          >
            Opensophy — проект, который разрабатывает open-source проекты и практические туториалы для всех: от опытных специалистов до тех, кто только делает первые шаги в IT.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <p
              className="about-secondary"
              style={{
                fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)',
                lineHeight: 1.7,
                color: textMuted,
              }}
            >
              Мы создаём инструменты, шаблоны и образовательные материалы в открытом доступе — чтобы каждый мог использовать их в работе и учёбе.
            </p>

            <p
              className="about-secondary"
              style={{
                fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)',
                lineHeight: 1.7,
                color: textMuted,
              }}
            >
              Параллельно оказываем профессиональные услуги: проверяем сайты и код на уязвимости, ищем утечки данных, разрабатываем сайты и помогаем с тестированием.
            </p>

            <p
              className="about-secondary"
              style={{
                fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)',
                lineHeight: 1.7,
                color: textMuted,
              }}
            >
              Мы верим, что безопасность и качество кода должны быть доступны каждому — поэтому делимся знаниями открыто и работаем честно.
            </p>
          </div>
        </div>
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