import React, { useState, useEffect } from 'react';
import DocsList from './DocsList';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import MobileNavbar from '@/components/MobileNavbar';

const DocsIndexContent: React.FC = () => {
  const { isDark } = useTheme();
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (typeof globalThis === 'undefined' || !globalThis.location) return;

    const params = new URLSearchParams(globalThis.location.search);
    setType(params.get('type') || 'all');
    setSearch(params.get('search') || '');
  }, []);

  return (
    <div
      style={{
        backgroundColor: isDark ? '#0a0a0a' : '#E8E7E3',
        color: isDark ? '#ffffff' : '#000000',
        minHeight: '100vh',
      }}
    >
      <main className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'}`}>
        <section className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h1
                className={`text-4xl md:text-5xl font-bold font-veilstack mb-6 ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                Добро пожаловать в Hub
              </h1>
              <p
                className={`text-lg md:text-xl mb-8 ${
                  isDark ? 'text-white/70' : 'text-black/70'
                }`}
              >
                Новости, блоги, документация и статьи проекта Opensophy
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-12">
              {[
                {
                  title: 'Поиск и Фильтры',
                  description:
                    'Используйте поисковую строку и фильтры по категориям для быстрого нахождения нужных материалов',
                },
                {
                  title: 'Структура и Навигация',
                  description:
                    'Каждая статья имеет содержание для навигации и хорошо организована по категориям',
                },
                {
                  title: 'Разнообразный Контент',
                  description: 'Документация, блоги, новости и статьи в одном месте',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`p-6 rounded-lg border ${
                    isDark
                      ? 'bg-[#0a0a0a] border-white/10 hover:border-white/20'
                      : 'bg-[#E8E7E3] border-black/10 hover:border-black/20'
                  }`}
                >
                  <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    {item.title}
                  </h3>
                  <p className={`${isDark ? 'text-white/60' : 'text-black/60'}`}>
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <DocsList type={type} search={search} />

        <div className="h-20" />
      </main>
    </div>
  );
};

const DocsIndex: React.FC = () => {
  return (
    <ThemeProvider>
      <DocsIndexContent />
      <MobileNavbar />
    </ThemeProvider>
  );
};

export default DocsIndex;
