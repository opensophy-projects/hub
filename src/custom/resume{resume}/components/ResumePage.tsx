import React, { useState, useEffect, useRef } from 'react';
import { useMotionValue, useAnimationFrame, useTransform, motion } from 'framer-motion';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import Navigation from '@/features/navigation/components/Navigation';
import SplitText from '@/features/ui-components/texts/split-text/split-text';

// ─── ShinyText (inline, как в GeneralPage) ────────────────────────────────────

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

// ─── Card primitives (как в GeneralPage) ─────────────────────────────────────

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

  // ─ Badge label ─
  const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={{
      display: 'inline-flex',
      alignSelf: 'flex-start',
      fontSize: '0.66rem',
      fontWeight: 700,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: badgeC,
      marginBottom: '0.75rem',
      fontFamily: 'ui-monospace, monospace',
    }}>{children}</div>
  );

  // ─ Section label (как "ЧЕМ ЗАНИМАЕТСЯ" в GeneralPage) ─
  const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p style={{
      fontSize: '1rem',
      fontWeight: 600,
      color: textMut,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      margin: '0 0 2rem',
      fontFamily: 'Inter, sans-serif',
    }}>{children}</p>
  );

  // ─ Card heading ─
  const CardHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <h3 style={{
      fontSize: 'clamp(1.1rem, 1.8vw, 1.4rem)',
      fontWeight: 700,
      lineHeight: 1.25,
      margin: 0,
      fontFamily: 'Inter, system-ui, sans-serif',
      color: isNegative ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.88)',
    }}>{children}</h3>
  );

  // ─ Card description ─
  const CardDesc: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p style={{
      margin: '0.75rem 0 0',
      fontSize: 'clamp(0.92rem, 1.3vw, 1.05rem)',
      lineHeight: 1.7,
      color: textBody,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>{children}</p>
  );

  // ─ Bullet item ─
  const Bullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li style={{
      display: 'flex',
      gap: '0.7rem',
      alignItems: 'flex-start',
      marginBottom: '0.65rem',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 'clamp(0.88rem, 1.2vw, 0.98rem)',
      lineHeight: 1.65,
      color: textBody,
      listStyle: 'none',
    }}>
      <span style={{
        marginTop: '0.58em',
        flex: '0 0 0.32rem',
        width: '0.32rem',
        height: '0.32rem',
        borderRadius: '50%',
        background: badgeC,
      }} />
      <span>{children}</span>
    </li>
  );

  const Bullets: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
    <ul style={{ margin: 0, padding: 0 }}>
      {items.map((item, i) => <Bullet key={i}>{item}</Bullet>)}
    </ul>
  );

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .r-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .r-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
        .r-grid-4 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }

        @media (max-width: 900px)  { .r-grid-3, .r-grid-4 { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 560px)  { .r-grid-2, .r-grid-3, .r-grid-4 { grid-template-columns: 1fr !important; } }

        .r-card-header { padding: 1.5rem 1.5rem 0; position: relative; z-index: 1; }
        .r-card-body   { padding: 1rem 1.5rem 1.5rem; position: relative; z-index: 1; }
        .r-card-body-full { padding: 1.5rem; position: relative; z-index: 1; }

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
          max-width: 820px;
          text-align: center !important;
          display: block !important;
        }

        .resume-status-dot {
          display: inline-block;
          width: 0.42rem;
          height: 0.42rem;
          border-radius: 50%;
          background: #57d97b;
          box-shadow: 0 0 8px rgba(87,217,123,0.7);
          margin-right: 0.5rem;
          vertical-align: middle;
          animation: rdot 2.2s ease-in-out infinite;
        }

        @keyframes rdot { 0%, 100% { opacity: 1; } 50% { opacity: 0.38; } }

        .r-period-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.3rem 0.72rem;
          border-radius: 999px;
          font-family: ui-monospace, monospace;
          font-size: 0.66rem;
          letter-spacing: 0.06em;
          margin-bottom: 0.6rem;
        }
      `}</style>

      <Navigation floatingChrome />

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="resume-hero-center" style={{ background: bg, marginLeft: navOffset > 0 ? `${navOffset}px` : 0 }}>
        <p style={{
          fontSize: '1rem', fontWeight: 600, color: textMut,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          margin: '0 0 2rem', fontFamily: 'Inter, sans-serif',
        }}>РЕЗЮМЕ</p>

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

        <div style={{ marginTop: '3rem' }}>
          <span style={{
            fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
          }}>
            <ShinyText text="давайте знакомиться!" speed={3.5} color={shinyBase} shineColor={shinyGlow} />
          </span>
        </div>
      </section>

      {/* ══ О СЕБЕ ════════════════════════════════════════════════════════════ */}
      <section style={{ ...secPad, background: bg }}>
        <div style={innerPad}>
          <SectionLabel>О СЕБЕ</SectionLabel>

          {/* Статус + уровень */}
          <p style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: '0 0 1.5rem', color: textMain, fontFamily: 'Inter, sans-serif' }}>
            <span className="resume-status-dot" />
            Статус: в поиске работы / компании.
          </p>

          <p style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: 0, color: textMut, fontFamily: 'Inter, sans-serif' }}>
            <ShinyText
              text="Декабрь 2025 — настоящее время · Junior DevSecOps."
              speed={4}
              color={shinyBase}
              shineColor={shinyGlow}
            />
          </p>
        </div>

        {/* About text cards */}
        <div style={{ padding: 'clamp(2rem, 4vw, 3rem) clamp(2rem, 6vw, 5rem) clamp(3rem, 8vw, 6rem)', boxSizing: 'border-box' }}>
          <ResumeCard isNegative={isNegative}>
            <div className="r-card-body-full">
              <Badge>кто я</Badge>
              <p style={{
                margin: 0,
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 'clamp(0.95rem, 1.4vw, 1.08rem)',
                lineHeight: 1.8,
                color: textBody,
              }}>
                Я Freelance DevSecOps-инженер в области кибербезопасности, автоматизации CI/CD процессов и
                интеграции практик безопасности в жизненный цикл разработки. Специализируюсь на
                внедрении автоматизированных проверок безопасности, SAST/DAST сканировании,
                контейнеризации и построении защищённых CI/CD пайплайнов. Имею практический опыт
                работы с международными командами, проведения исследований безопасности, обнаружения
                и устранения уязвимостей в production-системах. Владею навыками наставничества,
                технического письма и презентации результатов аудитов безопасности для технических и
                нетехнических заинтересованных сторон.
              </p>
            </div>
          </ResumeCard>
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
              text="От SAST/DAST интеграции и CI/CD до Docker-контейнеров, документации и автоматизации рутины."
              speed={4}
              color={shinyBase}
              shineColor={shinyGlow}
            />
          </p>
        </div>

        <div style={{ padding: 'clamp(2rem, 4vw, 3rem) clamp(2rem, 6vw, 5rem) clamp(3rem, 8vw, 6rem)', boxSizing: 'border-box' }}>
          <div className="r-grid-2">
            {/* SAST/DAST/SCA */}
            <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="r-card-header">
                <Badge>инструменты безопасности</Badge>
                <CardHeading>SAST · DAST · SCA · ASPM</CardHeading>
              </div>
              <div className="r-card-body" style={{ flex: 1 }}>
                <CardDesc>Установка, настройка и интеграция инструментов анализа безопасности в пайплайны разработки.</CardDesc>
                <p style={{ margin: '1rem 0 0', fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem', lineHeight: 1.7, color: textMut }}>
                  <ShinyText
                    text="SonarQube · Semgrep · OWASP ZAP · Nuclei · nmap · OpenVAS · Nikto · DefectDojo · Trivy"
                    speed={5}
                    color={shinyBase}
                    shineColor={shinyGlow}
                  />
                </p>
              </div>
            </ResumeCard>

            {/* CI/CD */}
            <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="r-card-header">
                <Badge>ci/cd</Badge>
                <CardHeading>Настройка пайплайнов</CardHeading>
              </div>
              <div className="r-card-body" style={{ flex: 1 }}>
                <CardDesc>Построение защищённых CI/CD пайплайнов с автоматическими проверками безопасности на каждом этапе.</CardDesc>
                <p style={{ margin: '1rem 0 0', fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem', lineHeight: 1.7, color: textMut }}>
                  <ShinyText text="GitHub Actions · GitLab CI" speed={5} color={shinyBase} shineColor={shinyGlow} />
                </p>
              </div>
            </ResumeCard>

            {/* Docker */}
            <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="r-card-header">
                <Badge>контейнеризация</Badge>
                <CardHeading>Docker-контейнеры</CardHeading>
              </div>
              <div className="r-card-body" style={{ flex: 1 }}>
                <CardDesc>Разработка и поддержка контейнеров с соблюдением best practices безопасности и минимизацией поверхности атаки.</CardDesc>
              </div>
            </ResumeCard>

            {/* Автоматизация */}
            <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="r-card-header">
                <Badge>автоматизация</Badge>
                <CardHeading>Скриптинг и автоматизация</CardHeading>
              </div>
              <div className="r-card-body" style={{ flex: 1 }}>
                <CardDesc>Автоматизация рутины и создание инструментов для задач безопасности и инфраструктуры.</CardDesc>
                <p style={{ margin: '1rem 0 0', fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem', color: textMut }}>
                  <ShinyText text="bash · python" speed={5} color={shinyBase} shineColor={shinyGlow} />
                </p>
              </div>
            </ResumeCard>

            {/* Документация */}
            <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="r-card-header">
                <Badge>документация</Badge>
                <CardHeading>Техническое письмо</CardHeading>
              </div>
              <div className="r-card-body" style={{ flex: 1 }}>
                <CardDesc>Написание руководств по реагированию на инциденты, отчётов по безопасности и сопровождение проектов от проектирования до production.</CardDesc>
              </div>
            </ResumeCard>

            {/* AI */}
            <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="r-card-header">
                <Badge>ai интеграция</Badge>
                <CardHeading>AI в безопасности и разработке</CardHeading>
              </div>
              <div className="r-card-body" style={{ flex: 1 }}>
                <CardDesc>Интеграция AI-инструментов в процессы безопасности и разработки для повышения эффективности и продуктивности систем.</CardDesc>
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

        <div style={{ padding: 'clamp(2rem, 4vw, 3rem) clamp(2rem, 6vw, 5rem) clamp(3rem, 8vw, 6rem)', boxSizing: 'border-box' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>

            {/* Freelance Security Researcher — большая карточка */}
            <ResumeCard isNegative={isNegative}>
              <div className="r-card-body-full">
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div>
                    <Badge>freelance · фев 2023 — ноя 2025 · 2 года 10 мес.</Badge>
                    <CardHeading>Security Researcher / Bug Bounty Hunter</CardHeading>
                  </div>
                </div>
                <div className="r-grid-2" style={{ marginTop: '1.25rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.6rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.66rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: badgeC }}>Обязанности</p>
                    <Bullets items={[
                      'Исследования безопасности и оценка уязвимостей в open-source проектах и публичных веб-приложениях',
                      'Анализ утечек данных и выявление угроз через OSINT',
                      'Разработка Telegram-ботов и Python-скриптов для автоматизированной разведки',
                      'SAST/DAST сканирование (SonarCloud, OWASP ZAP, Snyk)',
                      'Подготовка отчётов с PoC и рекомендациями по устранению',
                      'Ответственное раскрытие уязвимостей',
                    ]} />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.6rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.66rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: badgeC }}>Результаты</p>
                    <Bullets items={[
                      <>Публичное исследование <strong style={{ color: isNegative ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.82)' }}>n8n</strong> — выявление рисков безопасности. Получило отзывы от сообщества и комментарий инженера проекта в Discord. Стало стандартом безопасной работы с платформой</>,
                      <><strong style={{ color: isNegative ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.82)' }}>bolt.new</strong>: критическая логическая уязвимость обхода ограничений AI-токенов — ответственно раскрыта команде проекта</>,
                      'Выявление и документирование множественных уязвимостей в публичных проектах',
                    ]} />
                  </div>
                </div>
              </div>
            </ResumeCard>

            {/* KIBERone + NetEase рядом */}
            <div className="r-grid-2">
              <ResumeCard isNegative={isNegative} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="r-card-header">
                  <Badge>кибершкола kiberone · сен 2024 — янв 2025 · 5 мес.</Badge>
                  <CardHeading>Преподаватель программирования</CardHeading>
                </div>
                <div className="r-card-body" style={{ flex: 1 }}>
                  <Bullets items={[
                    'Преподавание основ программирования детям 6–14 лет',
                    'Наставничество: код, отладка, ревью, IT-проекты (Unity, Roblox, веб)',
                    'Адаптация сложного материала для разного уровня подготовки',
                    <>
                      <strong style={{ color: isNegative ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.82)' }}>Лучшее:</strong> улучшение учебной программы с акцентом на практические навыки современной IT-индустрии
                    </>,
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
                    'Передача обратной связи игроков команде разработки',
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
                <div className="r-grid-3" style={{ marginTop: '1.25rem' }}>
                  <CardDesc>Основание и руководство онлайн-студией цифрового дизайна для международных клиентов. Создание баннеров, логотипов, игровых ассетов и маркетинговых материалов.</CardDesc>
                  <CardDesc>Стратегическое партнёрство с NetEase Games — аватарки и визуальные референсы для контент-криейторов. Успешное выполнение 30+ проектов.</CardDesc>
                  <CardDesc>Полный цикл проектов: от брифинга до сдачи. Работа с клиентами из разных стран и культур. Совмещение двух ролей с сохранением высокого качества.</CardDesc>
                </div>
              </div>
            </ResumeCard>
          </div>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════════════════════ */}
      <section style={{ ...secPad, background: bg }}>
        <div style={{ ...innerPad, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <SectionLabel>СВЯЗАТЬСЯ</SectionLabel>

          <h2 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: '0 0 1.5rem', color: textMain, fontFamily: 'Inter, sans-serif' }}>
            Понравился мой опыт? Напишите мне.
          </h2>

          <p style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.6rem)', fontWeight: 500, lineHeight: 1.55, margin: '0 0 3rem', color: textMut, fontFamily: 'Inter, sans-serif', maxWidth: 720 }}>
            <ShinyText
              text="Открыт к вакансиям, проектам и сотрудничеству. Чувствительные данные — образование, местоположение и прочее — предоставлю по запросу."
              speed={4}
              color={shinyBase}
              shineColor={shinyGlow}
            />
          </p>

          <a
            href="mailto:opensophy@gmail.com"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.8rem 2rem',
              borderRadius: 999,
              border: `1px solid ${borderC}`,
              background: isNegative ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.9rem',
              color: textMain,
              textDecoration: 'none',
              letterSpacing: '0.04em',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.65')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            opensophy@gmail.com
          </a>
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