import React, { useState, useEffect, useRef } from 'react';
import { useMotionValue, useAnimationFrame, useTransform, motion } from 'framer-motion';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import Navigation from '@/features/navigation/components/Navigation';
import SplitText from '@/features/ui-components/texts/split-text/split-text';

// ─── ShinyText ────────────────────────────────────────────────────────────────

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

// ─── Card ─────────────────────────────────────────────────────────────────────

const ResumeCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { isNegative: boolean }>(
  ({ children, isNegative, style, ...props }, ref) => {
    const border = isNegative ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
    const bg     = isNegative ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
    return (
      <div ref={ref} style={{ position: 'relative', border: `1px solid ${border}`, background: bg, borderRadius: 16, overflow: 'hidden', ...style }} {...props}>
        {children}
      </div>
    );
  }
);
ResumeCard.displayName = 'ResumeCard';

// ─── ResumeContent ────────────────────────────────────────────────────────────

const ResumeContent: React.FC = () => {
  const [isNegative, setIsNegative] = useState(() => {
    if (typeof globalThis.window === 'undefined') return true;
    return localStorage.getItem('theme') !== 'light';
  });
  const [navOffset, setNavOffset] = useState(0);
  const aboutRef = useRef<HTMLElement>(null);

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
      const val = getComputedStyle(document.documentElement).getPropertyValue('--nav-left').trim();
      setNavOffset(val ? Number.parseInt(val, 10) : 0);
    };
    readOffset();
    const observer = new MutationObserver(readOffset);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const bg        = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain  = isNegative ? '#ffffff' : '#000000';
  const textMut   = isNegative ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
  const textBody  = isNegative ? 'rgba(255,255,255,0.7)'  : 'rgba(0,0,0,0.65)';
  const badgeC    = isNegative ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.42)';
  const shinyBase = isNegative ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)';
  const shinyGlow = isNegative ? '#ffffff'                : '#000000';
  const borderC   = isNegative ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';

  const secPad: React.CSSProperties = {
    marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  };
  const innerPad: React.CSSProperties = {
    padding: 'clamp(3rem, 6vw, 5rem) clamp(2rem, 6vw, 5rem)',
    boxSizing: 'border-box',
  };
  const cardsPad: React.CSSProperties = {
    padding: 'clamp(1rem, 2vw, 2rem) clamp(2rem, 6vw, 5rem) clamp(3rem, 8vw, 6rem)',
    boxSizing: 'border-box',
  };

  const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p style={{ fontSize: '1rem', fontWeight: 600, color: textMut, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 2rem', fontFamily: 'Inter, sans-serif' }}>{children}</p>
  );

  const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{ display: 'inline-flex', alignSelf: 'flex-start', fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: badgeC, marginBottom: '0.75rem', fontFamily: 'ui-monospace, monospace' }}>{children}</div>
  );

  const CardHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 style={{ fontSize: 'clamp(1.15rem, 1.9vw, 1.45rem)', fontWeight: 700, lineHeight: 1.25, margin: 0, fontFamily: 'Inter, system-ui, sans-serif', color: isNegative ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.88)' }}>{children}</h3>
  );

  const CardDesc: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p style={{ margin: '0.85rem 0 0', fontSize: 'clamp(0.98rem, 1.4vw, 1.1rem)', lineHeight: 1.75, color: textBody, fontFamily: 'Inter, system-ui, sans-serif' }}>{children}</p>
  );

  const Bullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', marginBottom: '0.7rem', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 'clamp(0.93rem, 1.25vw, 1.02rem)', lineHeight: 1.7, color: textBody, listStyle: 'none' }}>
      <span style={{ marginTop: '0.6em', flex: '0 0 0.32rem', width: '0.32rem', height: '0.32rem', borderRadius: '50%', background: badgeC }} />
      <span>{children}</span>
    </li>
  );

  const Bullets: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
    <ul style={{ margin: 0, padding: 0 }}>{items.map((item, i) => <Bullet key={i}>{item}</Bullet>)}</ul>
  );

  const strong = (t: string) => <strong style={{ color: isNegative ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.82)', fontWeight: 600 }}>{t}</strong>;

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .r-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .r-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }

        @media (max-width: 900px)  { .r-grid-3 { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px)  { .r-grid-2, .r-grid-3 { grid-template-columns: 1fr !important; } }

        .r-card-header    { padding: 1.5rem 1.5rem 0; position: relative; z-index: 1; }
        .r-card-body      { padding: 1.1rem 1.5rem 1.6rem; position: relative; z-index: 1; }
        .r-card-body-full { padding: 1.6rem; position: relative; z-index: 1; }

        .resume-hero-center {
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: clamp(6rem, 14vw, 10rem) clamp(2rem, 6vw, 5rem) clamp(4rem, 8vw, 6rem);
          box-sizing: border-box;
          width: 100%;
          overflow: hidden;
        }

        .resume-hero-title {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: clamp(1.75rem, 4vw, 3.5rem);
          font-weight: 500;
          line-height: 1.45;
          margin: 0 auto;
          max-width: 840px;
          text-align: center !important;
          display: block !important;
        }

        /* кнопка-скролл */
        .r-scroll-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          margin-top: 2.5rem;
          padding: 0.65rem 1.4rem;
          border-radius: 999px;
          cursor: pointer;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: clamp(0.9rem, 1.2vw, 1rem);
          font-weight: 500;
          letter-spacing: 0.01em;
          transition: opacity 0.2s, transform 0.2s;
          background: none;
          text-decoration: none;
        }
        .r-scroll-btn:hover { opacity: 0.72; transform: translateY(2px); }

        /* CTA layout */
        .r-cta-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 4rem;
          align-items: start;
          max-width: 900px;
        }
        @media (max-width: 820px) {
          .r-cta-grid { grid-template-columns: 1fr 240px; gap: 2.5rem; }
        }
        @media (max-width: 640px) {
          .r-cta-grid { grid-template-columns: 1fr; gap: 2rem; max-width: 100%; }
        }

        /* links */
        .r-contact-link {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-family: ui-monospace, monospace;
          font-size: clamp(0.8rem, 1.1vw, 0.9rem);
          letter-spacing: 0.03em;
          text-decoration: none;
          opacity: 0.78;
          transition: opacity 0.18s;
          padding: 0.55rem 0;
          word-break: break-all;
        }
        .r-contact-link:hover { opacity: 1; }
        .r-contact-icon {
          width: 1.4rem;
          height: 1.4rem;
          flex-shrink: 0;
          opacity: 0.6;
          min-width: 1.4rem;
        }
      `}</style>

      <Navigation floatingChrome />

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="resume-hero-center" style={{ background: bg, marginLeft: navOffset > 0 ? `${navOffset}px` : 0 }}>
        <p style={{ fontSize: '1rem', fontWeight: 600, color: textMut, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 2rem', fontFamily: 'Inter, sans-serif' }}>
          РЕЗЮМЕ
        </p>

        <h1 className="resume-hero-title" style={{ color: textMain }}>
          <SplitText
            text="Привет, меня зовут Даниил, также известен в it-сообществах как глава проекта opensophy или юзернеймов @opensophy."
            splitType="words"
            tag="span"
            textAlign="center"
            duration={0.9}
            delay={36}
            ease="power3.out"
            threshold={0.05}
            rootMargin="-20px"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
          />
        </h1>

        {/* Кнопка-скролл */}
        <button
          onClick={scrollToAbout}
          className="r-scroll-btn"
          style={{
            border: `1px solid ${borderC}`,
            color: textMain,
          }}
        >
          <span style={{ fontSize: 'clamp(1rem, 1.5vw, 1.15rem)', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
            <ShinyText text="давайте знакомиться!" speed={3.5} color={shinyBase} shineColor={shinyGlow} />
          </span>
          {/* стрелка вниз */}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.55, flexShrink: 0 }}>
            <path d="M7 2v10M3 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </section>

      {/* ══ О СЕБЕ ════════════════════════════════════════════════════════════ */}
      <section ref={aboutRef} style={{ ...secPad, background: bg }}>
        <div style={{ ...innerPad, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <SectionLabel>О СЕБЕ</SectionLabel>

          {/* Статус — по центру */}
          <p style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: '0 0 1.5rem', color: textMain, fontFamily: 'Inter, sans-serif' }}>
            Статус: в поиске работы / компании.
          </p>

          <p style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: '0 0 3rem', color: textMut, fontFamily: 'Inter, sans-serif' }}>
            <ShinyText
              text="Junior DevSecOps · декабрь 2025 — настоящее время."
              speed={4}
              color={shinyBase}
              shineColor={shinyGlow}
            />
          </p>

          {/* Текст «кто я» — shiny-text без карточки, тоже по центру */}
          <p style={{ fontSize: 'clamp(1.05rem, 1.7vw, 1.35rem)', fontWeight: 400, lineHeight: 1.8, margin: 0, fontFamily: 'Inter, sans-serif', maxWidth: 800, textAlign: 'center' }}>
            <ShinyText
              text="Freelance DevSecOps-инженер в области кибербезопасности, автоматизации CI/CD и интеграции практик безопасности в жизненный цикл разработки. Специализируюсь на SAST/DAST сканировании, контейнеризации и построении защищённых пайплайнов. Имею практический опыт работы с международными командами, обнаружения уязвимостей в production-системах и ответственного раскрытия. Владею навыками технического письма и презентации аудитов безопасности."
              speed={7}
              color={shinyBase}
              shineColor={shinyGlow}
            />
          </p>
        </div>
      </section>

      {/* ══ КЛЮЧЕВЫЕ ОБЯЗАННОСТИ ════════════════════════════════════════════ */}
      <section style={{ ...secPad, background: bg }}>
        <div style={innerPad}>
          <SectionLabel>КЛЮЧЕВЫЕ ОБЯЗАННОСТИ И СТЕК</SectionLabel>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: '0 0 1.5rem', color: textMain, fontFamily: 'Inter, sans-serif' }}>
            Что я умею и с чем работаю.
          </h2>
          <p style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: 0, color: textMut, fontFamily: 'Inter, sans-serif' }}>
            <ShinyText
              text="SAST/DAST интеграция, CI/CD, Docker, автоматизация рутины и техническая документация."
              speed={4}
              color={shinyBase}
              shineColor={shinyGlow}
            />
          </p>
        </div>

        <div style={cardsPad}>
          <div className="r-grid-2">
            <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="r-card-header">
                <Badge>инструменты безопасности</Badge>
                <CardHeading>SAST · DAST · SCA · ASPM</CardHeading>
              </div>
              <div className="r-card-body" style={{ flex: 1 }}>
                <CardDesc>Установка, настройка и интеграция инструментов анализа безопасности на каждом этапе пайплайна.</CardDesc>
                <p style={{ margin: '1.1rem 0 0', fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem', lineHeight: 1.8, color: textMut }}>
                  <ShinyText
                    text="SonarQube · Semgrep · OWASP ZAP · Nuclei · nmap · OpenVAS · Nikto · DefectDojo · Trivy"
                    speed={5}
                    color={shinyBase}
                    shineColor={shinyGlow}
                  />
                </p>
              </div>
            </ResumeCard>

            <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="r-card-header">
                <Badge>ci/cd</Badge>
                <CardHeading>Защищённые пайплайны</CardHeading>
              </div>
              <div className="r-card-body" style={{ flex: 1 }}>
                <CardDesc>Построение CI/CD пайплайнов с автоматическими security-чекпоинтами: SAST, SCA, DAST, секреты — всё на каждом PR.</CardDesc>
                <p style={{ margin: '1.1rem 0 0', fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem', color: textMut }}>
                  <ShinyText text="GitHub Actions · GitLab CI" speed={5} color={shinyBase} shineColor={shinyGlow} />
                </p>
              </div>
            </ResumeCard>

            <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="r-card-header">
                <Badge>контейнеризация</Badge>
                <CardHeading>Docker</CardHeading>
              </div>
              <div className="r-card-body" style={{ flex: 1 }}>
                <CardDesc>Разработка и поддержка контейнеров с соблюдением best practices: минимальные образы, non-root, сканирование слоёв, минимизация поверхности атаки.</CardDesc>
              </div>
            </ResumeCard>

            <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="r-card-header">
                <Badge>автоматизация</Badge>
                <CardHeading>Скриптинг и инструменты</CardHeading>
              </div>
              <div className="r-card-body" style={{ flex: 1 }}>
                <CardDesc>Автоматизация рутинных задач безопасности: мониторинг, сканирование, ротация ключей, отчётность — скриптами и кастомными инструментами.</CardDesc>
                <p style={{ margin: '1.1rem 0 0', fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem', color: textMut }}>
                  <ShinyText text="bash · python" speed={5} color={shinyBase} shineColor={shinyGlow} />
                </p>
              </div>
            </ResumeCard>

            <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="r-card-header">
                <Badge>документация</Badge>
                <CardHeading>Техническое письмо</CardHeading>
              </div>
              <div className="r-card-body" style={{ flex: 1 }}>
                <CardDesc>Руководства по реагированию на инциденты, отчёты по уязвимостям с PoC и рекомендациями, сопровождение проекта от проектирования до production.</CardDesc>
              </div>
            </ResumeCard>

            <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="r-card-header">
                <Badge>ai интеграция</Badge>
                <CardHeading>AI в безопасности</CardHeading>
              </div>
              <div className="r-card-body" style={{ flex: 1 }}>
                <CardDesc>Интеграция AI-инструментов в процессы безопасности и разработки: ускорение анализа, триаж находок, улучшение покрытия тестами.</CardDesc>
              </div>
            </ResumeCard>
          </div>
        </div>
      </section>

      {/* ══ ОПЫТ ═════════════════════════════════════════════════════════════ */}
      <section style={{ ...secPad, background: bg }}>
        <div style={innerPad}>
          <SectionLabel>ОПЫТ</SectionLabel>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: '0 0 1.5rem', color: textMain, fontFamily: 'Inter, sans-serif' }}>
            Исследования безопасности, преподавание, сообщества и дизайн.
          </h2>
          <p style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: 0, color: textMut, fontFamily: 'Inter, sans-serif' }}>
            <ShinyText
              text="Разный опыт — единый вектор: строить, исследовать, передавать знания."
              speed={4}
              color={shinyBase}
              shineColor={shinyGlow}
            />
          </p>
        </div>

        <div style={cardsPad}>
          <div style={{ display: 'grid', gap: '1rem' }}>

            {/* Freelance Security Researcher */}
            <ResumeCard isNegative={isNegative}>
              <div className="r-card-body-full">
                <Badge>freelance · фев 2023 — ноя 2025 · 2 года 10 мес.</Badge>
                <CardHeading>Security Researcher / Bug Bounty Hunter</CardHeading>
                <div className="r-grid-2" style={{ marginTop: '1.4rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.7rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.66rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: badgeC }}>Обязанности</p>
                    <Bullets items={[
                      'Исследования безопасности и оценка уязвимостей в open-source проектах и публичных веб-приложениях',
                      'Анализ утечек данных и выявление угроз через OSINT-методологии',
                      'Разработка Telegram-ботов и Python-скриптов для автоматизированной разведки и мониторинга угроз',
                      'SAST/DAST сканирование: SonarCloud, OWASP ZAP, Snyk',
                      'Сканирование на секреты и ревью кода — выявление жёстко закодированных учётных данных и API-ключей',
                      'Подготовка детальных отчётов с PoC и рекомендациями по устранению',
                      'Ответственное раскрытие и координация с security-командами',
                    ]} />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.7rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.66rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: badgeC }}>Ключевые результаты</p>
                    <Bullets items={[
                      <>{strong('n8n')} — публичное исследование платформы автоматизации: выявление рисков безопасности. Получило отзывы от сообщества и комментарий инженера проекта в официальном Discord. Стало стандартом безопасной работы с платформой</>,
                      <>{strong('bolt.new')} — обнаружена критическая логическая уязвимость обхода ограничений AI-токенов. Ответственно раскрыта команде проекта</>,
                      'Выявление и документирование множественных уязвимостей в публичных проектах с последующим ответственным раскрытием',
                    ]} />
                  </div>
                </div>
              </div>
            </ResumeCard>

            {/* KIBERone + NetEase */}
            <div className="r-grid-2">
              <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="r-card-header">
                  <Badge>кибершкола kiberone · сен 2024 — янв 2025 · 5 мес.</Badge>
                  <CardHeading>Преподаватель программирования</CardHeading>
                </div>
                <div className="r-card-body" style={{ flex: 1 }}>
                  <Bullets items={[
                    'Преподавание основ программирования детям 6–14 лет',
                    'Наставничество: код, отладка, ревью, IT-проекты (Unity, Roblox, веб, мобайл)',
                    'Адаптация сложного технического материала для разного уровня подготовки',
                    <>Улучшение учебной программы с акцентом на <strong style={{ color: isNegative ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.82)', fontWeight: 600 }}>практические навыки</strong> современной IT-индустрии</>,
                  ]} />
                </div>
              </ResumeCard>

              <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="r-card-header">
                  <Badge>netease games (китай) · сен 2021 — дек 2023 · 2 г. 4 мес.</Badge>
                  <CardHeading>Senior Community Manager</CardHeading>
                </div>
                <div className="r-card-body" style={{ flex: 1 }}>
                  <Bullets items={[
                    'Управление международным сообществом 50 000+ игроков',
                    'Координация команды модераторов, обучение, контроль качества',
                    'Антикризисное управление и деэскалация конфликтов',
                    'Передача обратной связи игроков команде разработки: баг-репорты, фичер-реквесты',
                    'Сотрудничество с контент-криейторами через собственную дизайн-студию',
                  ]} />
                </div>
              </ResumeCard>
            </div>

            {/* Premium Studio */}
            <ResumeCard isNegative={isNegative}>
              <div className="r-card-body-full">
                <Badge>premium studio · июн 2021 — дек 2022 · 1 г. 7 мес. · параллельно с netease</Badge>
                <CardHeading>Основатель и главный дизайнер</CardHeading>
                <div className="r-grid-3" style={{ marginTop: '1.4rem' }}>
                  <CardDesc>Основание и руководство онлайн-студией цифрового дизайна для международных клиентов. Создание баннеров, логотипов, игровых ассетов и маркетинговых материалов.</CardDesc>
                  <CardDesc>Стратегическое партнёрство с NetEase Games — аватарки и визуальные референсы для контент-криейторов. 30+ успешных проектов.</CardDesc>
                  <CardDesc>Полный цикл: от брифинга до сдачи. Работа с клиентами из разных стран. Совмещение двух профессиональных ролей с сохранением качества.</CardDesc>
                </div>
              </div>
            </ResumeCard>
          </div>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════════════════════ */}
      <section style={{ ...secPad, background: bg }}>
        <div style={{ ...innerPad, paddingTop: 'clamp(5rem, 10vw, 8rem)' }}>
          <SectionLabel>СВЯЗАТЬСЯ</SectionLabel>

          <div className="r-cta-grid">
            {/* Левая часть — текст */}
            <div>
              <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: '0 0 1.5rem', color: textMain, fontFamily: 'Inter, sans-serif' }}>
                Рассматриваете мою кандидатуру?
              </h2>
              <p style={{ fontSize: 'clamp(1.1rem, 1.8vw, 1.4rem)', fontWeight: 400, lineHeight: 1.7, margin: 0, color: textMut, fontFamily: 'Inter, sans-serif' }}>
                <ShinyText
                  text="Готов к собеседованию или рассмотрению оффера. Если нужна дополнительная информация — образование, местоположение и прочее — предоставлю по запросу."
                  speed={4}
                  color={shinyBase}
                  shineColor={shinyGlow}
                />
              </p>
            </div>

            {/* Правая часть — контакты */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
              {/* Email */}
              <a href="mailto:opensophy@gmail.com" className="r-contact-link" style={{ color: textMain }}>
                <svg className="r-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-10 7L2 7"/>
                </svg>
                opensophy@gmail.com
              </a>

              {/* Telegram */}
              <a href="https://t.me/opensophy" target="_blank" rel="noopener noreferrer" className="r-contact-link" style={{ color: textMain }}>
                <svg className="r-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 4.5 2.5 10.5l7 2.5 2.5 7 3-5 5 4 1.5-14.5z"/>
                  <path d="M9.5 13 15 8"/>
                </svg>
                @opensophy
              </a>

              {/* GitHub */}
              <a href="https://github.com/opensophy-projects" target="_blank" rel="noopener noreferrer" className="r-contact-link" style={{ color: textMain }}>
                <svg className="r-contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
                github / opensophy-projects
              </a>
            </div>
          </div>
        </div>
      </section>
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