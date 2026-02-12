import React, { useState, useEffect } from 'react';
import DocsList from './DocsList';
import { ThemeProvider, useTheme } from '@/shared/contexts/ThemeContext';
import TopNavbar from '@/features/navigation/components/MobileNavbar';
import Sidebar from '@/features/navigation/components/Sidebar';
import ErrorBoundary from '@/shared/components/ErrorBoundary';

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
      <TopNavbar />
      <Sidebar />

      <main className={`min-h-screen ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]'}`}>
        <section className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h1
                className={`text-4xl md:text-5xl font-bold font-veilstack mb-6`}
                style={{ color: '#7234ff' }}
              >
                Добро пожаловать в Hub
              </h1>
              <p
                className={`text-lg md:text-xl mb-8 ${
                  isDark ? 'text-white/70' : 'text-black/70'
                }`}
              >
                 центр знаний Opensophy
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-12">
              {[
                {
                  title: 'Кто мы?',
                  description:
                    'Opensophy — коллекция open-source решений для IT-специалистов. Мы создаём проекты, инструменты и практические гайды по безопасности, инфраструктуре и современной разработке. Hub — это пространство, где мы систематизируем знания, публикуем статьи и делимся опытом.',
                },
                {
                  title: 'Кому это будет полезно?',
                  description:
                    'Разработчикам, дизайнерам, специалистам по безопасности и всем, кто работает в сфере IT. Независимо от уровня подготовки, здесь можно найти практические материалы, технические разборы и полезные инструменты.',
                },
                {
                  title: 'Open Source',
                  description: 'Проект полностью открыт. Исходный код Hub и опубликованные материалы доступны на GitHub. Вы можете развернуть собственный Hub или использовать решения в своих проектах. Подробнее о проектах — на opensophy.com.',
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

        <ErrorBoundary>
          <DocsList type={type} search={search} />
        </ErrorBoundary>

        <div className="h-20" />
      </main>
    </div>
  );
};

const DocsIndex: React.FC = () => {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <DocsIndexContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default DocsIndex;
