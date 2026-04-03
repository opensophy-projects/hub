import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlowingEffect } from './ui/GlowingEffect';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import Navigation from '@/features/navigation/components/Navigation';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// ─── Theme sync ───────────────────────────────────────────────────────────────

function useIsNegative() {
  const [isNegative, setIsNegative] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') setIsNegative(e.newValue !== 'light');
    };
    const onCustom = (e: Event) => {
      const { isDark } = (e as CustomEvent<{ isDark: boolean }>).detail;
      setIsNegative(isDark);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('hub:theme-change', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('hub:theme-change', onCustom);
    };
  }, []);

  return isNegative;
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

interface GridCardProps {
  children: React.ReactNode;
  isNegative: boolean;
  className?: string;
  noPadding?: boolean;
}

const GridCard: React.FC<GridCardProps> = ({ children, isNegative, className, noPadding }) => {
  const borderColor = isNegative ? 'border-white/10' : 'border-black/10';
  const bg = isNegative ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]';
  const outerBorder = isNegative ? 'border-white/10' : 'border-black/10';

  return (
    <div className={cn('relative rounded-[1.25rem] border-[0.75px] p-2 md:rounded-[1.5rem] md:p-3', outerBorder, className)}>
      <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} isNegative={isNegative} />
      <div className={cn(
        'relative h-full rounded-xl border-[0.75px] overflow-hidden',
        borderColor, bg,
        noPadding ? '' : 'p-6'
      )}>
        {children}
      </div>
    </div>
  );
};

// ─── About card ───────────────────────────────────────────────────────────────

const AboutCard: React.FC<{ isNegative: boolean }> = ({ isNegative }) => {
  const textMain = isNegative ? 'text-white' : 'text-black';
  const textMuted = isNegative ? 'text-white/55' : 'text-black/50';
  const labelColor = isNegative ? 'text-white/40' : 'text-black/35';

  return (
    <GridCard isNegative={isNegative} className="h-full">
      <div className="flex flex-col h-full gap-4">
        <p className={cn('text-xs font-bold uppercase tracking-widest', labelColor)}>О ПРОЕКТЕ</p>
        <h2 className={cn('text-2xl font-bold leading-tight', textMain)} style={{ fontFamily: 'customfont, sans-serif' }}>
          Opensophy
        </h2>
        <p className={cn('text-sm leading-relaxed flex-1', textMuted)}>
          Проект, который разрабатывает open-source решения и практические туториалы для всех — от опытных специалистов до тех, кто только делает первые шаги в IT.
        </p>
        <p className={cn('text-sm leading-relaxed', textMuted)}>
          Мы создаём инструменты, шаблоны и образовательные материалы в открытом доступе. Параллельно оказываем профессиональные услуги: проверяем сайты на уязвимости, ищем утечки данных, разрабатываем и тестируем продукты.
        </p>
        <div className="flex items-center gap-4 pt-2">
          <a
            href="https://github.com/opensophy-projects"
            target="_blank" rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-opacity hover:opacity-70',
              isNegative ? 'border-white/20 text-white' : 'border-black/20 text-black'
            )}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
            GitHub
          </a>
          <a
            href="https://habr.com/ru/users/opensophy/"
            target="_blank" rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-opacity hover:opacity-70',
              isNegative ? 'border-white/20 text-white' : 'border-black/20 text-black'
            )}
          >
            Habr
          </a>
        </div>
      </div>
    </GridCard>
  );
};

// ─── Services card ────────────────────────────────────────────────────────────

const SERVICE_DATA = [
  {
    id: 'development', num: '01', title: 'Разработка',
    subtitle: 'Современный сайт под любой стек с автоматическим выявлением уязвимостей прямо в процессе.',
    accentColor: '#6366f1',
  },
  {
    id: 'cybersecurity', num: '02', title: 'Кибербезопасность',
    subtitle: 'Проверка на уязвимости, поиск утечек секретов, автоматизация безопасности.',
    accentColor: '#ef4444',
  },
  {
    id: 'design', num: '03', title: 'Дизайн',
    subtitle: 'Логотипы, UI/UX аудит, визуальная идентичность и интерфейсы.',
    accentColor: '#10b981',
  },
];

const ServicesCard: React.FC<{ isNegative: boolean }> = ({ isNegative }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const textMain = isNegative ? 'text-white' : 'text-black';
  const textMuted = isNegative ? 'text-white/50' : 'text-black/40';
  const labelColor = isNegative ? 'text-white/40' : 'text-black/35';
  const divider = isNegative ? 'border-white/8' : 'border-black/8';

  return (
    <GridCard isNegative={isNegative} noPadding className="h-full">
      <div className="flex flex-col h-full">
        <div className={cn('p-6 pb-4 border-b', divider)}>
          <p className={cn('text-xs font-bold uppercase tracking-widest', labelColor)}>УСЛУГИ</p>
          <h2 className={cn('text-xl font-bold mt-1', textMain)} style={{ fontFamily: 'customfont, sans-serif' }}>
            Что мы предлагаем
          </h2>
        </div>
        <div className="flex-1">
          {SERVICE_DATA.map((s, idx) => {
            const isOpen = openId === s.id;
            return (
              <div key={s.id} className={cn('border-b last:border-b-0', divider)}>
                <button
                  onClick={() => setOpenId(isOpen ? null : s.id)}
                  className="w-full flex items-center gap-3 px-6 py-4 text-left group"
                >
                  <span className={cn('text-xs font-mono flex-shrink-0', textMuted)} style={{ color: isOpen ? s.accentColor : undefined }}>
                    {s.num}
                  </span>
                  <span className={cn('flex-1 text-sm font-semibold', textMain)} style={{ color: isOpen ? s.accentColor : undefined, transition: 'color 0.2s' }}>
                    {s.title}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn('text-base flex-shrink-0', textMuted)}
                  >
                    ↗
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p className={cn('px-6 pb-4 text-xs leading-relaxed', textMuted)}>
                        {s.subtitle}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        <div className={cn('p-6 pt-4 border-t', divider)}>
          <a
            href="mailto:opensophy@gmail.com"
            className={cn(
              'text-xs font-semibold hover:opacity-70 transition-opacity',
              isNegative ? 'text-white/60' : 'text-black/50'
            )}
          >
            Заказать услугу →
          </a>
        </div>
      </div>
    </GridCard>
  );
};

// ─── Approach card ────────────────────────────────────────────────────────────

const PRINCIPLES = [
  { id: 'openness', title: 'Открытость', desc: 'Open-source решения и свободные инструменты' },
  { id: 'practicality', title: 'Практичность', desc: 'Гайды, которые можно применить сразу' },
  { id: 'security', title: 'Безопасность', desc: 'Best practices и защита данных' },
  { id: 'relevance', title: 'Актуальность', desc: 'Современные инструменты и свежая информация' },
  { id: 'solutions', title: 'Готовые решения', desc: 'Компоненты и шаблоны для быстрого старта' },
  { id: 'education', title: 'Образование', desc: 'Статьи, гайды и практические примеры' },
];

const ApproachCard: React.FC<{ isNegative: boolean }> = ({ isNegative }) => {
  const textMain = isNegative ? 'text-white' : 'text-black';
  const textMuted = isNegative ? 'text-white/50' : 'text-black/40';
  const labelColor = isNegative ? 'text-white/40' : 'text-black/35';
  const tagBg = isNegative ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/8';

  return (
    <GridCard isNegative={isNegative} className="h-full">
      <div className="flex flex-col h-full gap-4">
        <p className={cn('text-xs font-bold uppercase tracking-widest', labelColor)}>НАШ ПОДХОД</p>
        <h2 className={cn('text-xl font-bold leading-tight', textMain)} style={{ fontFamily: 'customfont, sans-serif' }}>
          6 ключевых принципов
        </h2>
        <div className="grid grid-cols-2 gap-2 flex-1">
          {PRINCIPLES.map(p => (
            <div key={p.id} className={cn('rounded-lg border px-3 py-2.5', tagBg)}>
              <p className={cn('text-xs font-semibold mb-0.5', textMain)}>{p.title}</p>
              <p className={cn('text-[11px] leading-snug', textMuted)}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </GridCard>
  );
};

// ─── Projects card ────────────────────────────────────────────────────────────

const ProjectsCard: React.FC<{ isNegative: boolean }> = ({ isNegative }) => {
  const textMain = isNegative ? 'text-white' : 'text-black';
  const textMuted = isNegative ? 'text-white/50' : 'text-black/40';
  const labelColor = isNegative ? 'text-white/40' : 'text-black/35';
  const tagBg = isNegative ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/8';
  const divider = isNegative ? 'border-white/8' : 'border-black/8';

  return (
    <GridCard isNegative={isNegative} className="h-full">
      <div className="flex flex-col h-full gap-4">
        <p className={cn('text-xs font-bold uppercase tracking-widest', labelColor)}>ПРОЕКТЫ</p>

        {/* Hub */}
        <div className={cn('rounded-xl border p-4', tagBg)}>
          <div className="flex items-center gap-3 mb-2">
            <img src="/logohub.png" alt="Hub" className="w-8 h-8 object-contain flex-shrink-0" />
            <div>
              <p className={cn('text-sm font-bold', textMain)} style={{ fontFamily: 'customfont, sans-serif' }}>hub</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #34d399' }} />
                <span className={cn('text-[10px]', textMuted)}>Готов к использованию</span>
              </div>
            </div>
            <a
              href="https://github.com/opensophy-projects/hub"
              target="_blank" rel="noopener noreferrer"
              className={cn('ml-auto text-[10px] font-semibold border rounded-md px-2 py-1 hover:opacity-70 transition-opacity', isNegative ? 'border-white/15 text-white/60' : 'border-black/15 text-black/50')}
            >
              GitHub ↗
            </a>
          </div>
          <p className={cn('text-[11px] leading-relaxed', textMuted)}>
            Open-source платформа для документации и контента
          </p>
        </div>

        {/* Element */}
        <div className={cn('rounded-xl border p-4', tagBg)}>
          <div className="flex items-center gap-3 mb-2">
            <img src="/elementlogo.png" alt="Element" className="w-8 h-8 object-contain flex-shrink-0" />
            <div>
              <p className={cn('text-sm font-bold', textMain)} style={{ fontFamily: 'customfont, sans-serif' }}>element</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" style={{ boxShadow: '0 0 6px #fbbf24' }} />
                <span className={cn('text-[10px]', textMuted)}>В разработке</span>
              </div>
            </div>
          </div>
          <p className={cn('text-[11px] leading-relaxed', textMuted)}>
            UI-библиотека компонентов для React
          </p>
        </div>
      </div>
    </GridCard>
  );
};

// ─── Stats card ───────────────────────────────────────────────────────────────

function useCountUp(target: number, inView: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const duration = 1600;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);
  return val;
}

const StatsCard: React.FC<{ isNegative: boolean }> = ({ isNegative }) => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const views = useCountUp(10000, inView);
  const textMain = isNegative ? 'text-white' : 'text-black';
  const textMuted = isNegative ? 'text-white/50' : 'text-black/40';
  const labelColor = isNegative ? 'text-white/40' : 'text-black/35';
  const barBg = isNegative ? 'bg-white/10' : 'bg-black/10';
  const barFill = isNegative ? 'bg-white/60' : 'bg-black/50';
  const divider = isNegative ? 'border-white/8' : 'border-black/8';

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  const vals = [0.35, 0.42, 0.38, 0.55, 0.48, 0.62, 0.58, 0.72, 0.68, 0.81, 0.75, 0.9];

  return (
    <GridCard isNegative={isNegative} noPadding className="h-full">
      <div ref={ref} className="flex flex-col h-full">
        <div className={cn('p-6 pb-4 border-b', divider)}>
          <p className={cn('text-xs font-bold uppercase tracking-widest', labelColor)}>НАШИ СТАТЬИ</p>
          <div className="flex items-end gap-2 mt-2">
            <span className={cn('text-4xl font-bold tabular-nums', textMain)}>
              {views.toLocaleString('ru-RU')}+
            </span>
          </div>
          <p className={cn('text-xs mt-1', textMuted)}>просмотров в среднем на статью</p>
        </div>

        <div className="flex-1 p-6 pt-4 flex flex-col justify-end">
          {/* Mini bar chart */}
          <div className="flex items-end gap-1 h-16 mb-2">
            {vals.map((v, i) => (
              <motion.div
                key={i}
                className={cn('flex-1 rounded-sm', barFill)}
                initial={{ height: 0 }}
                animate={{ height: inView ? `${v * 100}%` : 0 }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
              />
            ))}
          </div>
          <div className="flex justify-between">
            {[0, 3, 6, 9, 11].map(i => (
              <span key={i} className={cn('text-[9px]', textMuted)}>{months[i]}</span>
            ))}
          </div>
          <p className={cn('text-[10px] mt-3 italic', textMuted)}>
            Охват растёт с каждой новой публикацией
          </p>
        </div>
      </div>
    </GridCard>
  );
};

// ─── FAQ card ─────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  { id: 'item-1', title: 'Для кого эти ресурсы?', content: 'Для разработчиков, дизайнеров, специалистов по безопасности и всех, кто работает в сфере IT.' },
  { id: 'item-2', title: 'Как использовать материалы?', content: 'Все статьи и гайды в свободном доступе. Open-source проекты на GitHub — используйте, изучайте, адаптируйте.' },
  { id: 'item-3', title: 'Как насчёт партнёрства?', content: 'Мы открыты к сотрудничеству. Напишите нам и обсудим идеи вместе.' },
];

const FaqCard: React.FC<{ isNegative: boolean }> = ({ isNegative }) => {
  const textMain = isNegative ? 'text-white' : 'text-black';
  const textMuted = isNegative ? 'text-white/50' : 'text-black/40';
  const labelColor = isNegative ? 'text-white/40' : 'text-black/35';
  const divider = isNegative ? 'border-white/8' : 'border-black/8';

  return (
    <GridCard isNegative={isNegative} noPadding className="h-full">
      <div className="flex flex-col h-full">
        <div className={cn('p-6 pb-4 border-b', divider)}>
          <p className={cn('text-xs font-bold uppercase tracking-widest', labelColor)}>FAQ</p>
          <h2 className={cn('text-xl font-bold mt-1', textMain)} style={{ fontFamily: 'customfont, sans-serif' }}>
            Частые вопросы
          </h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <style>{`
            @keyframes accordion-down { from { height: 0; opacity: 0; } to { height: var(--radix-accordion-content-height); opacity: 1; } }
            @keyframes accordion-up   { from { height: var(--radix-accordion-content-height); opacity: 1; } to { height: 0; opacity: 0; } }
            .animate-accordion-down { animation: accordion-down 0.2s ease-out; }
            .animate-accordion-up   { animation: accordion-up   0.2s ease-out; }
          `}</style>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.id} value={item.id} className={cn('border-b last:border-b-0', divider)}>
                <AccordionTrigger className={cn('text-left text-sm font-semibold px-6 hover:opacity-70', textMain)}>
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className={cn('text-sm leading-relaxed px-6', textMuted)}>
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className={cn('p-6 pt-4 border-t', divider)}>
          <p className={cn('text-xs', textMuted)}>
            Остались вопросы?{' '}
            <a href="mailto:opensophy@gmail.com" className={cn('font-semibold hover:opacity-70 transition-opacity', isNegative ? 'text-white/70' : 'text-black/60')}>
              Напишите нам
            </a>
          </p>
        </div>
      </div>
    </GridCard>
  );
};

// ─── Hero section ─────────────────────────────────────────────────────────────

import { SingularityShaders } from './SingularityShaders';

const Hero: React.FC<{ isNegative: boolean }> = ({ isNegative }) => {
  const labelColor = isNegative ? 'text-white/60' : 'text-black/50';
  const textMain = isNegative ? 'text-white' : 'text-black';
  const fadeBg = isNegative ? '#0a0a0a' : '#E8E7E3';

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <SingularityShaders speed={1} intensity={1.2} size={1.1} waveStrength={1} colorShift={1} isNegative={isNegative} className="h-full w-full" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none z-10"
        style={{ background: `linear-gradient(to bottom, transparent, ${fadeBg})` }} />
      <div className="relative z-20 text-center px-4">
        <motion.p
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={cn('text-xs sm:text-sm font-semibold uppercase tracking-widest mb-6', labelColor)}
        >
          КИБЕРБЕЗОПАСНОСТЬ. РАЗРАБОТКА. OPEN-SOURCE.
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('font-bold tracking-[0.10em] leading-none', textMain)}
          style={{ fontFamily: 'customfont, sans-serif', fontSize: 'clamp(3rem, 12vw, 10rem)' }}
        >
          Opensophy
        </motion.h1>
      </div>
    </section>
  );
};

// ─── Main GeneralPage ─────────────────────────────────────────────────────────

const GeneralPageInner: React.FC = () => {
  const isNegative = useIsNegative();
  const bg = isNegative ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]';

  // Detect desktop for nav offset
  const [isDesktop, setIsDesktop] = useState(false);
  const [navLeft, setNavLeft] = useState('0px');

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth > 1000);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isDesktop) { setNavLeft('0px'); return; }
    const readVar = () => {
      const val = getComputedStyle(document.documentElement).getPropertyValue('--nav-left').trim();
      setNavLeft(val || '64px');
    };
    readVar();
    const observer = new MutationObserver(readVar);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, [isDesktop]);

  return (
    <div className={cn('min-h-screen', bg, isNegative ? 'text-white' : 'text-black')}>
      <Navigation />

      <div
        style={{
          marginLeft: isDesktop ? navLeft : '0',
          marginBottom: isDesktop ? '0' : '3.5rem',
        }}
      >
        {/* Hero */}
        <Hero isNegative={isNegative} />

        {/* Grid */}
        <section className="px-4 sm:px-6 md:px-8 pb-16 pt-2">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr" style={{ gridAutoRows: '1fr' }}>

              {/* Row 1: О проекте | Услуги */}
              <div className="min-h-[360px]">
                <AboutCard isNegative={isNegative} />
              </div>
              <div className="min-h-[360px]">
                <ServicesCard isNegative={isNegative} />
              </div>

              {/* Row 2: Наш подход | Проекты */}
              <div className="min-h-[360px]">
                <ApproachCard isNegative={isNegative} />
              </div>
              <div className="min-h-[360px]">
                <ProjectsCard isNegative={isNegative} />
              </div>

              {/* Row 3: Наши статьи | FAQ */}
              <div className="min-h-[360px]">
                <StatsCard isNegative={isNegative} />
              </div>
              <div className="min-h-[360px]">
                <FaqCard isNegative={isNegative} />
              </div>

            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const GeneralPage: React.FC = () => (
  <ThemeProvider>
    <GeneralPageInner />
  </ThemeProvider>
);

export default GeneralPage;