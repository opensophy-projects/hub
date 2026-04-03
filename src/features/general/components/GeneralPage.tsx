import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SingularityShaders } from './SingularityShaders';
import { GlowingEffect } from './ui/GlowingEffect';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Stats } from './Stats';

// ─── utils ───────────────────────────────────────────────────────────────────

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

// ─── Services ─────────────────────────────────────────────────────────────────

interface ServiceItem { title: string; description: string; }
interface ServiceEntry { id: string; num: string; title: string; subtitle: string; accentColor: string; items: ServiceItem[]; }

const SERVICE_DATA: ServiceEntry[] = [
  {
    id: 'development', num: '01', title: 'Разработка',
    subtitle: 'Создание качественных цифровых продуктов.',
    accentColor: '#6366f1',
    items: [
      { title: 'Разработка сайта', description: 'Современный сайт с использованием ИИ-инструментов под любой стек. Автоматическое выявление уязвимостей прямо в процессе разработки.' },
      { title: 'Тестирование сайта', description: 'Комплексная проверка на удобство и функциональность. Выявление проблем UX и рекомендации по улучшению.' },
    ],
  },
  {
    id: 'cybersecurity', num: '02', title: 'Кибербезопасность',
    subtitle: 'Защита ваших данных и систем от угроз.',
    accentColor: '#ef4444',
    items: [
      { title: 'Проверка утечек секретов и доступов', description: 'Поиск паролей, токенов, API-ключей и конфиденциальных данных в открытых источниках до того, как ими воспользуются злоумышленники.' },
      { title: 'Автоматизация безопасности проекта', description: 'Подключаем инструменты автоматической проверки кода и инфраструктуры. Уязвимости находятся автоматически — ещё до того, как код попадает в продакшн.' },
      { title: 'Проверка сайта на уязвимости', description: 'Автоматическая проверка на типовые уязвимости без вмешательства в работу сайта. Официально, с подтверждением от владельца — не пентест.' },
      { title: 'Анализ кода на безопасность', description: 'Быстрая проверка исходного кода на уязвимости и проблемные места до выхода в продакшн.' },
    ],
  },
  {
    id: 'design', num: '03', title: 'Дизайн',
    subtitle: 'Визуальная идентичность и интерфейсы.',
    accentColor: '#10b981',
    items: [
      { title: 'Разработка логотипа', description: 'Уникальный и запоминающийся логотип для вашего бренда. Концепция, цветовая палитра и типографика, отражающие ценности бизнеса.' },
      { title: 'UI/UX аудит', description: 'Анализ интерфейса на соответствие современным стандартам. Конкретные рекомендации по улучшению пользовательского опыта.' },
    ],
  },
];

// Анимации контента секции услуг
const serviceItemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.28, delay: i * 0.07, ease: [0.4, 0, 0.2, 1] as number[] },
  }),
};

const ServicesSection: React.FC<{ isNegative: boolean }> = ({ isNegative }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const bg        = isNegative ? 'bg-[#0a0a0a]'    : 'bg-[#E8E7E3]';
  const textMain   = isNegative ? 'text-white'       : 'text-black';
  const textMuted  = isNegative ? 'text-white/50'    : 'text-black/40';
  const divider    = isNegative ? 'border-white/10'  : 'border-black/10';

  return (
    <section className={`relative ${bg} py-16 sm:py-20 md:py-24 lg:py-28`}>
      <div className="lg:container lg:mx-auto lg:px-4 xl:px-8">
        <div className="lg:max-w-7xl lg:mx-auto px-4 sm:px-6 md:px-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 sm:mb-20 md:mb-24"
          >
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${textMuted}`}>ЧТО МЫ ПРЕДЛАГАЕМ</p>
              <h2 className={`text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.0] ${textMain}`} style={{ fontFamily: 'customfont, sans-serif' }}>
                НАШИ УСЛУГИ
              </h2>
            </div>
            <p className={`text-base sm:text-lg leading-relaxed max-w-xs md:max-w-sm md:text-right ${textMuted}`}>
              Комплексная поддержка ваших цифровых продуктов — от безопасности до визуала
            </p>
          </motion.div>

          <div className={`border-t ${divider}`}>
            {SERVICE_DATA.map((service, idx) => {
              const isOpen = openId === service.id;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  viewport={{ once: true }}
                  className={`border-b ${divider}`}
                >
                  {/* Заголовок */}
                  <button
                    onClick={() => setOpenId(isOpen ? null : service.id)}
                    className="w-full flex items-center gap-4 sm:gap-8 py-6 sm:py-8 text-left group"
                  >
                    <span
                      className={`text-xs font-mono flex-shrink-0 transition-colors duration-300 ${isOpen ? '' : textMuted}`}
                      style={{ color: isOpen ? service.accentColor : undefined }}
                    >
                      {service.num}
                    </span>

                    <div className="flex-1 min-w-0 overflow-hidden flex items-baseline gap-4">
                      <span
                        className={`font-bold leading-none whitespace-nowrap flex-shrink-0 ${textMain}`}
                        style={{
                          fontFamily: 'customfont, sans-serif',
                          fontSize: 'clamp(1.1rem, 2.8vw, 3.5rem)',
                          color: isOpen ? service.accentColor : undefined,
                          transition: 'color 0.3s',
                        }}
                      >
                        {service.title}
                      </span>
                      <span
                        className={`text-sm whitespace-nowrap hidden sm:block ${textMuted}`}
                        style={{
                          opacity: isOpen ? 0 : 1,
                          transition: 'opacity 0.2s',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '40%',
                        }}
                      >
                        {service.subtitle}
                      </span>
                    </div>

                    <motion.span
                      className={`flex-shrink-0 text-lg ${textMuted}`}
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    >
                      ↗
                    </motion.span>
                  </button>

                  {/* Раскрывающийся контент */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="pb-10 pl-10 sm:pl-16 pr-4 sm:pr-10">
                          <motion.p
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: 0.05 }}
                            className={`text-sm sm:text-base mb-8 ${textMuted}`}
                          >
                            {service.subtitle}
                          </motion.p>
                          <ul className="space-y-6">
                            {service.items.map((item, i) => (
                              <motion.li
                                key={i}
                                custom={i}
                                variants={serviceItemVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex gap-4"
                              >
                                <span
                                  className="flex-shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: service.accentColor, opacity: 0.7 }}
                                />
                                <div>
                                  <p className={`text-sm sm:text-base font-semibold mb-1 ${textMain}`}>{item.title}</p>
                                  <p className={`text-sm leading-relaxed ${textMuted}`}>{item.description}</p>
                                </div>
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }}
            className="mt-10 sm:mt-12 flex flex-col sm:flex-row sm:items-center gap-6"
          >
            <p className={`flex-1 text-sm sm:text-base leading-relaxed ${textMuted}`}>
              Свяжитесь с нами, чтобы обсудить задачу — предложим индивидуальное решение.
            </p>
            <a
              href="mailto:opensophy@gmail.com"
              className={cn(
                'flex-shrink-0 inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold transition-all duration-300 hover:scale-[1.03]',
                isNegative ? 'bg-white text-black hover:bg-white/90' : 'bg-black text-white hover:bg-black/90'
              )}
            >
              Заказать услугу
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 11.5L11.5 2.5M11.5 2.5H4.5M11.5 2.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

// ─── Projects ─────────────────────────────────────────────────────────────────

const HUB_FEATURES = [
  { title: 'Современный дизайн', description: 'Чистый и минималистичный интерфейс — контент выглядит профессионально без лишних настроек.' },
  { title: 'Мощный Markdown', description: 'Поддержка расширенных блоков — таблицы, код, алерты, графики и многое другое.' },
  { title: 'Не только документация!', description: 'Hub поддерживает рендеринг компонентов — создай ui-библиотеку прямо в документации.' },
  { title: 'И многое другое!', description: 'Изучите проект на GitHub — там всё подробно описано.' },
];

const ELEMENT_FEATURES = [
  { title: 'OpenSource', description: 'Все элементы доступны бесплатно и без регистрации.' },
  { title: 'React', description: 'Библиотека сделана под React. Просто импортируй и используй.' },
  { title: 'Copy → Paste', description: 'Код сразу доступен для копирования — никаких лишних шагов.' },
  { title: 'More', description: 'Coming soon — больше компонентов уже в разработке.' },
];

const ProjectsSection: React.FC<{ isNegative: boolean }> = ({ isNegative }) => {
  const projects: Array<'hub' | 'element'> = ['hub', 'element'];
  const [activeIdx, setActiveIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const isHub = projects[activeIdx] === 'hub';

  const navigate = (dir: 1 | -1) => {
    const next = (activeIdx + dir + projects.length) % projects.length;
    setFading(true);
    setTimeout(() => { setActiveIdx(next); setFading(false); }, 280);
  };

  const bg        = isNegative ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]';
  const textMain   = isNegative ? 'text-white'   : 'text-black';
  const textMuted  = isNegative ? 'text-white/50' : 'text-black/40';
  const btnBorder  = isNegative
    ? 'border-white/15 hover:border-white/35 text-white/60 hover:text-white'
    : 'border-black/15 hover:border-black/35 text-black/50 hover:text-black';
  const features = isHub ? HUB_FEATURES : ELEMENT_FEATURES;

  return (
    <section className={`relative ${bg} py-12 sm:py-16 md:py-20 lg:py-24`}>
      <div className="lg:container lg:mx-auto lg:px-4 xl:px-8">
        <div className="lg:max-w-7xl lg:mx-auto px-4 sm:px-6 md:px-8">

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }} viewport={{ once: true }}
            className="flex items-start justify-between mb-12 sm:mb-14"
          >
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold ${textMain}`} style={{ fontFamily: 'customfont, sans-serif' }}>
              Наши проекты
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => navigate(-1)} className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center transition-all duration-200 ${btnBorder}`} aria-label="Предыдущий проект">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <span className={`text-xs font-mono tabular-nums px-1 whitespace-nowrap ${textMuted}`}>{activeIdx + 1}&nbsp;/&nbsp;{projects.length}</span>
              <button onClick={() => navigate(1)} className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center transition-all duration-200 ${btnBorder}`} aria-label="Следующий проект">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </motion.div>

          <div style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.28s ease', minHeight: '320px' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-start">

              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="flex flex-col items-center md:items-start gap-5">
                <div className="w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
                  <img src={isHub ? '/logohub.png' : '/elementlogo.png'} alt={isHub ? 'Hub' : 'Element'} className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className={`text-3xl sm:text-4xl font-bold ${textMain}`} style={{ fontFamily: 'customfont, sans-serif' }}>{isHub ? 'hub' : 'element'}</p>
                  <p className={`text-sm mt-1 leading-snug ${textMuted}`}>{isHub ? 'Open-source платформа для документации и контента' : 'UI-библиотека компонентов для React'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: isHub ? '#10b981' : '#f59e0b', boxShadow: isHub ? '0 0 8px #10b981' : '0 0 8px #f59e0b' }} />
                  <span className={`text-xs font-medium ${textMuted}`}>{isHub ? 'Готов к использованию' : 'В разработке'}</span>
                </div>
                {isHub && (
                  <a
                    href="https://github.com/opensophy-projects/hub"
                    target="_blank" rel="noopener noreferrer"
                    className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 hover:scale-105', isNegative ? 'border-white/20 text-white' : 'border-black/20 text-black')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                    GitHub
                  </a>
                )}
              </motion.div>

              {/* Фичи без иконок */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {features.map((f, i) => (
                  <motion.div key={`${projects[activeIdx]}-${i}`} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.07 }} viewport={{ once: true }}>
                    <h3 className={`font-bold text-base mb-1 ${textMain}`}>{f.title}</h3>
                    <p className={`text-sm leading-relaxed ${textMuted}`}>{f.description}</p>
                  </motion.div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Main GeneralPage ─────────────────────────────────────────────────────────

const GeneralPage: React.FC = () => {
  // Синхронизируем тему с Hub ThemeContext через событие hub:theme-change
  const [isNegative, setIsNegative] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('theme') !== 'light';
  });

  React.useEffect(() => {
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

  const bg          = isNegative ? 'bg-[#0a0a0a]'   : 'bg-[#E8E7E3]';
  const borderColor  = isNegative ? 'border-white/10' : 'border-black/10';
  const labelColor   = isNegative ? 'text-white/60'   : 'text-black/50';

  const principles = [
    { id: 'openness',        title: 'Открытость',              description: 'Фокус на open-source решениях и свободных инструментах' },
    { id: 'practicality',    title: 'Практичность',            description: 'Гайды и ресурсы, которые можно применить сразу' },
    { id: 'security',        title: 'Безопасность',            description: 'Best practices и фокус на защиту данных' },
    { id: 'relevance',       title: 'Актуальность',            description: 'Современные инструменты и свежая информация' },
    { id: 'ready-solutions', title: 'Готовые решения',         description: 'Подборки компонентов и шаблонов для быстрого старта' },
    { id: 'educational',     title: 'Образовательный контент', description: 'Статьи, гайды и практические примеры' },
  ];

  const faqItems = [
    { id: 'item-1', title: 'Для кого эти ресурсы?',       content: 'Наши ресурсы предназначены для разработчиков, дизайнеров, специалистов по безопасности и всех, кто работает в сфере IT.' },
    { id: 'item-2', title: 'Как использовать материалы?', content: 'Все наши статьи, гайды и подборки находятся в свободном доступе. Open-source проекты размещены на GitHub — используйте их в своих разработках, изучайте реализацию и адаптируйте под свои задачи.' },
    { id: 'item-3', title: 'Как насчёт партнёрства?',    content: 'Мы открыты к сотрудничеству. Напишите нам о ваших идеях и давайте обсудим возможности вместе.' },
  ];

  // Контакты: без @veilosophy
  const contacts = [
    { href: 'mailto:opensophy@gmail.com',             label: 'opensophy@gmail.com' },
    { href: 'https://github.com/opensophy-projects',   label: 'github.com/opensophy-projects', external: true },
    { href: 'https://habr.com/ru/users/opensophy/',    label: 'habr.com/ru/users/opensophy',    external: true },
  ];

  return (
    /*
     * GeneralPage рендерится ВНУТРИ Hub Layout — Hub Navigation уже присутствует.
     * Собственный NavBar не нужен.
     * Тема синхронизируется с Hub через hub:theme-change и localStorage.
     */
    <div
      className={`min-h-screen relative flex flex-col ${isNegative ? 'text-white' : 'text-black'}`}
    >
      <style>{`
        @keyframes accordion-down { from { height: 0; opacity: 0; } to { height: var(--radix-accordion-content-height); opacity: 1; } }
        @keyframes accordion-up   { from { height: var(--radix-accordion-content-height); opacity: 1; } to { height: 0; opacity: 0; } }
        .animate-accordion-down { animation: accordion-down 0.2s ease-out; }
        .animate-accordion-up   { animation: accordion-up   0.2s ease-out; }
      `}</style>

      <div className={`absolute inset-0 ${bg}`} />

      <div className="relative z-10 flex-1">

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <SingularityShaders speed={1} intensity={1.2} size={1.1} waveStrength={1} colorShift={1} isNegative={isNegative} className="h-full w-full" />
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-48 sm:h-56 md:h-64 pointer-events-none z-10"
            style={{ background: isNegative ? 'linear-gradient(to bottom, transparent, #0a0a0a)' : 'linear-gradient(to bottom, transparent, #E8E7E3)' }}
          />
          <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex flex-col items-center justify-center text-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: 'easeOut' }} className="flex flex-col items-center">
                <motion.div
                  initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                  className={`text-xs sm:text-sm md:text-base font-semibold uppercase tracking-widest mb-4 sm:mb-6 md:mb-8 ${labelColor}`}
                >
                  КИБЕРБЕЗОПАСНОСТЬ. РАЗРАБОТКА. OPEN-SOURCE.
                </motion.div>
                <h1
                  className={`text-[clamp(2.8rem,12vw,10rem)] font-bold tracking-[0.10em] drop-shadow-lg leading-none mb-4 sm:mb-6 md:mb-8 ${isNegative ? 'text-white' : 'text-black'}`}
                  style={{ fontFamily: 'customfont, sans-serif' }}
                >
                  Opensophy
                </h1>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── О ПРОЕКТЕ + НАШ ПОДХОД ── */}
        <section className={`relative overflow-visible ${bg} py-16 sm:py-20 md:py-28 lg:py-36`}>
          <div className="lg:container lg:mx-auto lg:px-4 xl:px-8">
            <div className="lg:max-w-7xl lg:mx-auto px-4 sm:px-6 md:px-8">

              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="mb-16 sm:mb-20 md:mb-28">
                <p className={`text-xs sm:text-sm font-semibold uppercase tracking-widest mb-8 ${labelColor}`}>О ПРОЕКТЕ</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                  <p className={`text-base sm:text-lg leading-relaxed ${isNegative ? 'text-white/75' : 'text-black/70'}`}>
                    Opensophy — проект, который разрабатывает open-source проекты и практические туториалы для всех: от опытных специалистов до тех, кто только делает первые шаги в IT.
                  </p>
                  <div className="flex flex-col gap-5">
                    <p className={`text-sm sm:text-base leading-relaxed ${isNegative ? 'text-white/50' : 'text-black/50'}`}>
                      Мы создаём инструменты, шаблоны и образовательные материалы в открытом доступе — чтобы каждый мог использовать их в работе и учёбе. Параллельно оказываем профессиональные услуги: проверяем сайты и код на уязвимости, ищем утечки данных, разрабатываем сайты и помогаем с тестированием.
                    </p>
                    <p className={`text-sm sm:text-base leading-relaxed ${isNegative ? 'text-white/50' : 'text-black/50'}`}>
                      Мы верим, что безопасность и качество кода должны быть доступны каждому — поэтому делимся знаниями открыто и работаем честно.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* НАШ ПОДХОД */}
              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="mb-10 sm:mb-14 text-center">
                <h2 className={`text-4xl sm:text-5xl md:text-6xl font-bold mb-4 ${isNegative ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'customfont, sans-serif' }}>
                  НАШ ПОДХОД
                </h2>
                <p className={`text-lg sm:text-xl ${isNegative ? 'text-white/50' : 'text-black/40'}`}>
                  6 ключевых принципов, которыми мы руководствуемся в работе
                </p>
              </motion.div>

              {/* Карточки — без иконок/кружков */}
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {principles.map((principle, idx) => (
                  <motion.li
                    key={principle.id}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.07 }} viewport={{ once: true }}
                    className="min-h-[9rem] list-none"
                  >
                    <div className={cn('relative h-full rounded-[1.25rem] border-[0.75px] p-2 md:rounded-[1.5rem] md:p-3', borderColor)}>
                      <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} isNegative={isNegative} />
                      <div className={cn(
                        'relative flex h-full flex-col justify-end gap-3 overflow-hidden rounded-xl border-[0.75px] p-6 shadow-sm',
                        isNegative ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10'
                      )}>
                        <h3 className={cn('text-xl font-semibold tracking-[-0.03em] md:text-2xl', isNegative ? 'text-white' : 'text-black')}>
                          {principle.title}
                        </h3>
                        <p className={cn('text-sm leading-relaxed', isNegative ? 'text-white/60' : 'text-black/60')}>
                          {principle.description}
                        </p>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>

            </div>
          </div>
        </section>

        {/* ── УСЛУГИ ── */}
        <ServicesSection isNegative={isNegative} />

        {/* ── ПРОЕКТЫ ── */}
        <ProjectsSection isNegative={isNegative} />

        {/* ── СТАТИСТИКА ── */}
        <Stats isNegative={isNegative} />

        {/* ── FAQ + КОНТАКТЫ ── */}
        <section className={`relative overflow-visible ${bg} py-12 sm:py-16 md:py-20 lg:py-28`}>
          <div className="lg:container lg:mx-auto lg:px-4 xl:px-8">
            <div className="lg:max-w-7xl lg:mx-auto px-4 sm:px-6 md:px-8">

              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="mb-12 sm:mb-16">
                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${labelColor}`}>ВОПРОСЫ И СВЯЗЬ</p>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <h2 className={`text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.0] ${isNegative ? 'text-white' : 'text-black'}`} style={{ fontFamily: 'customfont, sans-serif' }}>
                    Частые вопросы
                  </h2>
                  <p className={`text-base sm:text-lg leading-relaxed max-w-sm md:text-right ${labelColor}`}>
                    Ответы на частые вопросы об Opensophy
                  </p>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 mb-20 sm:mb-24 md:mb-32">

                {/* FAQ */}
                <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
                  <div className={cn('relative rounded-[1.25rem] border-[0.75px] p-2 md:rounded-[1.5rem] md:p-3', borderColor)}>
                    <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} isNegative={isNegative} />
                    <div className={cn('relative overflow-hidden rounded-xl border-[0.75px] shadow-sm', isNegative ? 'bg-[#0a0a0a] border-white/10' : 'bg-[#E8E7E3] border-black/10')}>
                      <Accordion type="single" collapsible className="w-full">
                        {faqItems.map((item) => (
                          <AccordionItem key={item.id} value={item.id} className={cn('border-b-[0.75px] last:border-b-0', isNegative ? 'border-white/10' : 'border-black/10')}>
                            <AccordionTrigger className={cn('text-left font-semibold transition-all hover:opacity-70', isNegative ? 'text-white' : 'text-black')}>
                              {item.title}
                            </AccordionTrigger>
                            <AccordionContent className={cn('text-base leading-relaxed', isNegative ? 'text-white/80' : 'text-black/70')}>
                              {item.content}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                </motion.div>

                {/* Контакты */}
                <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }} className="flex flex-col justify-between gap-8">
                  <div>
                    <p className={`text-2xl sm:text-3xl font-bold mb-4 ${isNegative ? 'text-white' : 'text-black'}`}>Остались вопросы?</p>
                    <p className={`text-base sm:text-lg leading-relaxed ${labelColor}`}>
                      Напишите нам — ответим в течение 24–48 часов.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {contacts.map(link => (
                      <a
                        key={link.href}
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className={cn(
                          'inline-flex items-center gap-3 px-6 py-4 rounded-xl border transition-all duration-200 hover:scale-[1.02]',
                          isNegative ? 'border-white/10 hover:border-white/25 text-white' : 'border-black/10 hover:border-black/25 text-black'
                        )}
                      >
                        <span className="font-semibold">{link.label}</span>
                      </a>
                    ))}
                  </div>
                </motion.div>

              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default GeneralPage;