cat > "/home/claude/resume-page/src/custom/resume{resume}/components/ResumePage.tsx" << 'ENDOFFILE'
import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import Navigation from '@/features/navigation/components/Navigation';
import SplitText from '@/features/ui-components/texts/split-text/split-text';
import ShinyText from '@/features/ui-components/texts/shiny-text/shiny-text';

// ─── Timeline Entry ───────────────────────────────────────────────────────────

interface TimelineEntryProps {
  period: string;
  duration: string;
  company: string;
  role: string;
  isNegative: boolean;
  children: React.ReactNode;
}

const TimelineEntry: React.FC<TimelineEntryProps> = ({
  period, duration, company, role, isNegative, children,
}) => {
  const borderC  = isNegative ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const accentC  = isNegative ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
  const metaC    = isNegative ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)';
  const roleC    = isNegative ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)';
  const companyC = isNegative ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.52)';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'clamp(7rem, 14vw, 11rem) 1px 1fr',
      gap: '0 2rem',
      marginBottom: '3.5rem',
    }}>
      {/* Левая колонка: период */}
      <div style={{ paddingTop: '0.15rem', textAlign: 'right' }}>
        <p style={{
          margin: 0,
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.72rem',
          lineHeight: 1.6,
          color: metaC,
        }}>{period}</p>
        <p style={{
          margin: '0.35rem 0 0',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.66rem',
          color: accentC,
        }}>{duration}</p>
      </div>

      {/* Разделитель */}
      <div style={{
        background: `linear-gradient(180deg, ${accentC}, transparent)`,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: '0.4rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: accentC,
        }} />
      </div>

      {/* Правая колонка: контент */}
      <div style={{ paddingBottom: '0.5rem' }}>
        <p style={{
          margin: '0 0 0.2rem',
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.7rem',
          color: companyC,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>{company}</p>
        <p style={{
          margin: '0 0 1rem',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 'clamp(1rem, 1.6vw, 1.18rem)',
          fontWeight: 600,
          color: roleC,
        }}>{role}</p>
        <div style={{
          borderLeft: `1px solid ${borderC}`,
          paddingLeft: '1.25rem',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ─── Section Title ────────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
  <p style={{
    fontFamily: 'ui-monospace, monospace',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color,
    margin: '0 0 2rem',
  }}>{children}</p>
);

// ─── Bullet list ──────────────────────────────────────────────────────────────

const BulletList: React.FC<{ items: React.ReactNode[]; textColor: string; mutedColor: string }> = ({
  items, textColor, mutedColor,
}) => (
  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
    {items.map((item, i) => (
      <li key={i} style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
        marginBottom: '0.75rem',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 'clamp(0.9rem, 1.25vw, 1rem)',
        lineHeight: 1.65,
        color: textColor,
      }}>
        <span style={{
          marginTop: '0.55em',
          flex: '0 0 0.35rem',
          width: '0.35rem',
          height: '0.35rem',
          borderRadius: '50%',
          background: mutedColor,
        }} />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

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

  const bg        = isNegative ? '#0a0a0a' : '#E8E7E3';
  const textMain  = isNegative ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)';
  const textBody  = isNegative ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.68)';
  const textMut   = isNegative ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.4)';
  const borderC   = isNegative ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const surfaceC  = isNegative ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
  const shinyBase = isNegative ? 'rgba(255,255,255,0.6)'  : 'rgba(0,0,0,0.55)';
  const shinyGlow = isNegative ? '#ffffff'                : '#000000';

  const sectionPad: React.CSSProperties = {
    padding:   'clamp(4rem, 8vw, 6rem) clamp(2rem, 6vw, 5rem)',
    width:     '100%',
    boxSizing: 'border-box',
    marginLeft: navOffset > 0 ? `${navOffset}px` : 0,
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: textMain }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .resume-hero-wrap {
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

        .resume-hero-heading {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: clamp(1.75rem, 4vw, 3.5rem);
          font-weight: 500;
          line-height: 1.45;
          margin: 0 auto;
          max-width: 780px;
          text-align: center !important;
          display: block !important;
        }

        .resume-hero-heading .split-parent {
          text-align: center !important;
        }

        .resume-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.42rem 0.9rem;
          border-radius: 999px;
          font-family: ui-monospace, monospace;
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          margin-bottom: 2rem;
        }

        .resume-status-dot {
          width: 0.45rem;
          height: 0.45rem;
          border-radius: 50%;
          background: #57d97b;
          box-shadow: 0 0 8px rgba(87,217,123,0.7);
          flex-shrink: 0;
          animation: resume-pulse 2.2s ease-in-out infinite;
        }

        @keyframes resume-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }

        .resume-divider {
          height: 1px;
          width: 100%;
          background: linear-gradient(90deg, transparent, currentColor, transparent);
          opacity: 0.09;
          margin: 0;
        }

        .resume-about-text {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: clamp(1rem, 1.5vw, 1.12rem);
          line-height: 1.8;
          max-width: 720px;
        }

        .resume-label-inline {
          font-family: ui-monospace, monospace;
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0.5;
          margin-right: 0.5em;
        }

        .resume-cta-card {
          border-radius: 16px;
          padding: clamp(2rem, 4vw, 3rem) clamp(1.5rem, 4vw, 2.5rem);
          max-width: 680px;
          width: 100%;
        }

        @media (max-width: 640px) {
          .resume-timeline-grid {
            grid-template-columns: 0 0 1fr !important;
            gap: 0 !important;
          }
          .resume-timeline-meta { display: none; }
          .resume-timeline-line { display: none; }
        }
      `}</style>

      <Navigation floatingChrome />

      {/* ── Hero ── */}
      <section
        className="resume-hero-wrap"
        style={{ background: bg, marginLeft: navOffset > 0 ? `${navOffset}px` : 0 }}
      >
        <p style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: textMut,
          margin: '0 0 2rem',
        }}>
          резюме
        </p>

        <h1 className="resume-hero-heading" style={{ color: textMain }}>
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
          <ShinyText
            text="давайте знакомиться!"
            speed={3.5}
            color={shinyBase}
            shineColor={shinyGlow}
            className="text-2xl font-medium"
          />
        </div>
      </section>

      <div className="resume-divider" style={{ color: textMain }} />

      {/* ── О себе ── */}
      <section style={{ ...sectionPad }}>
        <SectionTitle color={textMut}>О себе</SectionTitle>

        {/* Статус */}
        <div style={{ marginBottom: '2rem' }}>
          <span
            className="resume-status-badge"
            style={{
              border: `1px solid ${borderC}`,
              background: surfaceC,
              color: textBody,
            }}
          >
            <span className="resume-status-dot" />
            Статус: в поиске работы / компании
          </span>
        </div>

        {/* Уровень + период */}
        <p style={{
          fontFamily: 'ui-monospace, monospace',
          fontSize: '0.72rem',
          color: textMut,
          margin: '0 0 1.5rem',
          letterSpacing: '0.08em',
        }}>
          Декабрь 2025 — настоящее время &nbsp;·&nbsp; Junior
        </p>

        {/* Текст о себе */}
        <p className="resume-about-text" style={{ color: textBody, margin: 0 }}>
          Я Freelance DevSecOps-инженер в области кибербезопасности, автоматизации CI/CD процессов и
          интеграции практик безопасности в жизненный цикл разработки. Специализируюсь на
          внедрении автоматизированных проверок безопасности, SAST/DAST сканировании,
          контейнеризации и построении защищённых CI/CD пайплайнов. Имею практический опыт
          работы с международными командами, проведения исследований безопасности, обнаружения
          и устранения уязвимостей в production-системах. Владею навыками наставничества,
          технического письма и презентации результатов аудитов безопасности для технических и
          нетехнических заинтересованных сторон.
        </p>
      </section>

      <div className="resume-divider" style={{ color: textMain }} />

      {/* ── Ключевые обязанности ── */}
      <section style={{ ...sectionPad }}>
        <SectionTitle color={textMut}>Ключевые обязанности и стек</SectionTitle>

        <BulletList
          textColor={textBody}
          mutedColor={textMut}
          items={[
            <>
              Установка, настройка и интеграция инструментов SAST, DAST, SCA, ASPM и других инструментов автоматизации безопасности, в основном:{' '}
              <ShinyText
                text="SonarQube, Semgrep, OWASP ZAP, Nuclei, nmap, OpenVAS, Nikto, DefectDojo, Trivy"
                speed={5}
                color={shinyBase}
                shineColor={shinyGlow}
                className="font-medium"
              />
            </>,
            <>
              Настройка CI/CD:{' '}
              <ShinyText
                text="GitHub / GitLab"
                speed={5}
                color={shinyBase}
                shineColor={shinyGlow}
                className="font-medium"
              />
            </>,
            'Разработка и поддержка Docker-контейнеров с соблюдением лучших практик безопасности и минимизацией поверхности атаки',
            'Написание технической документации и руководств по реагированию на инциденты и устранению уязвимостей',
            'Сопровождение проектов от начала до конца с обеспечением безопасности на всех этапах жизненного цикла разработки (от проектирования до развёртывания в production)',
            <>
              Автоматизация рутины с помощью{' '}
              <ShinyText
                text="bash / python"
                speed={5}
                color={shinyBase}
                shineColor={shinyGlow}
                className="font-medium"
              />
            </>,
            'Интеграция AI в сферу безопасности и разработки для улучшения систем и их продуктивности',
          ]}
        />
      </section>

      <div className="resume-divider" style={{ color: textMain }} />

      {/* ── Опыт ── */}
      <section style={{ ...sectionPad }}>
        <SectionTitle color={textMut}>Опыт</SectionTitle>

        {/* Freelance Security Researcher */}
        <TimelineEntry
          period="Фев 2023 — Ноя 2025"
          duration="2 года 10 мес."
          company="Freelance"
          role="Security Researcher / Bug Bounty Hunter"
          isNegative={isNegative}
        >
          <BulletList
            textColor={textBody}
            mutedColor={textMut}
            items={[
              'Проведение исследований безопасности и оценки уязвимостей для проектов с открытым исходным кодом и публичных веб-приложений',
              'Анализ утечек данных и выявление потенциальных угроз через методологии OSINT',
              'Разработка автоматизированных инструментов: кастомные Telegram-боты для мониторинга угроз, Python-скрипты для автоматизированной разведки',
              'Использование SAST/DAST инструментов (SonarCloud, OWASP ZAP, Snyk) для комплексного тестирования безопасности',
              'Сканирование на наличие секретов и ревью кода — выявление жёстко закодированных учётных данных, API-ключей и утечек данных',
              'Подготовка детальных отчётов с PoC, анализом влияния и рекомендациями по устранению',
              'Ответственное раскрытие уязвимостей и координация с командами безопасности',
            ]}
          />
          <div style={{
            marginTop: '1.25rem',
            padding: '1rem 1.25rem',
            borderRadius: 10,
            border: `1px solid ${borderC}`,
            background: surfaceC,
          }}>
            <p style={{
              margin: '0 0 0.75rem',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.68rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: textMut,
            }}>Результаты</p>
            <BulletList
              textColor={textBody}
              mutedColor={textMut}
              items={[
                'Публичное исследование платформы автоматизации n8n — выявление потенциальных рисков безопасности. Получило положительные отзывы от сообщества и комментарий инженера проекта в официальном Discord. Стало стандартом безопасной работы с платформой',
                'bolt.new: обнаружена критическая логическая уязвимость, позволяющая обходить ограничения использования AI-токенов. Ответственно раскрыта команде проекта',
                'Выявление и документирование множественных уязвимостей в публичных проектах с последующим ответственным раскрытием',
              ]}
            />
          </div>
        </TimelineEntry>

        {/* KIBERone */}
        <TimelineEntry
          period="Сен 2024 — Янв 2025"
          duration="5 месяцев"
          company="КиберШкола KIBERone"
          role="Преподаватель программирования"
          isNegative={isNegative}
        >
          <BulletList
            textColor={textBody}
            mutedColor={textMut}
            items={[
              'Преподавание основ программирования детям 6–14 лет по методическим программам школы',
              'Практическое наставничество: помощь в написании кода, отладка, ревью и реализация IT-проектов (веб-сайты, игры в Unity/Roblox, мобильные приложения)',
              'Адаптация сложного технического материала для разного уровня подготовки',
              'Обратная связь родителям о прогрессе учеников; участие в организации мастер-классов и промо-уроков',
              <>
                <strong style={{ color: textMain, fontWeight: 600 }}>Лучший результат:</strong> улучшение учебной программы с акцентом на практические навыки, применимые в современной IT-индустрии
              </>,
            ]}
          />
        </TimelineEntry>

        {/* NetEase */}
        <TimelineEntry
          period="Сен 2021 — Дек 2023"
          duration="2 года 4 мес."
          company="NetEase Games (Китай)"
          role="Senior Community Manager"
          isNegative={isNegative}
        >
          <BulletList
            textColor={textBody}
            mutedColor={textMut}
            items={[
              'Управление и модерация международного онлайн-сообщества (50 000+ активных пользователей)',
              'Координация команды модераторов: распределение задач, обучение, контроль качества',
              'Взаимодействие с командой разработки: передача отзывов игроков, фичер-реквесты, баг-репорты',
              'Антикризисное управление: быстрое реагирование на негативные ситуации и деэскалация конфликтов',
              'Организация сотрудничества с контент-криейторами: координация создания графических материалов через собственную дизайн-студию',
              'Мониторинг настроений сообщества и подготовка аналитических отчётов для руководства',
            ]}
          />
        </TimelineEntry>

        {/* Premium Studio */}
        <TimelineEntry
          period="Июн 2021 — Дек 2022"
          duration="1 год 7 мес."
          company="Premium Studio"
          role="Основатель и главный дизайнер"
          isNegative={isNegative}
        >
          <p style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.68rem',
            color: textMut,
            margin: '0 0 0.85rem',
            letterSpacing: '0.06em',
          }}>
            Параллельно с позицией в NetEase Games
          </p>
          <BulletList
            textColor={textBody}
            mutedColor={textMut}
            items={[
              'Основание и руководство онлайн-студией цифрового дизайна для международных клиентов',
              'Создание баннеров, логотипов, игровых ассетов и маркетинговых материалов',
              'Стратегическое партнёрство с NetEase Games — создание аватарок и визуальных референсов для контент-криейторов',
              'Успешное выполнение 30+ проектов; полный цикл от брифа до сдачи',
            ]}
          />
        </TimelineEntry>
      </section>

      <div className="resume-divider" style={{ color: textMain }} />

      {/* ── CTA ── */}
      <section style={{
        ...sectionPad,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        <div
          className="resume-cta-card"
          style={{
            border: `1px solid ${borderC}`,
            background: surfaceC,
          }}
        >
          <p style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.72rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: textMut,
            margin: '0 0 1.25rem',
          }}>
            связаться
          </p>
          <p style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
            fontWeight: 500,
            lineHeight: 1.6,
            color: textMain,
            margin: '0 0 0.85rem',
          }}>
            Если я вам понравился — напишите мне.
          </p>
          <p style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 'clamp(0.9rem, 1.3vw, 1rem)',
            lineHeight: 1.7,
            color: textBody,
            margin: '0 0 1.5rem',
          }}>
            Если есть вопросы по чувствительным данным (образование, местоположение и др.) — тоже пишите,
            отвечу в рабочем порядке.
          </p>
          <a
            href="mailto:opensophy@gmail.com"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1.5rem',
              borderRadius: 999,
              border: `1px solid ${borderC}`,
              background: isNegative ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.85rem',
              color: textMain,
              textDecoration: 'none',
              letterSpacing: '0.04em',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
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
ENDOFFILE
echo "done"