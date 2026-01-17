import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import docs from '@/data/docs.json';
import DocBanner from './DocBanner';

interface DocsListProps {
  type?: string;
  search?: string;
}

const DocsList: React.FC<DocsListProps> = ({ type = 'all', search = '' }) => {
  const { isDark } = useTheme();
  const [filteredDocs, setFilteredDocs] = useState(docs);

  useEffect(() => {
    let filtered = docs;

    if (type !== 'all') {
      filtered = filtered.filter((d) => d.type === type);
    }

    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          d.description.toLowerCase().includes(query) ||
          (d.category && d.category.toLowerCase().includes(query)) ||
          (d.author && d.author.toLowerCase().includes(query)) ||
          (d.tags && d.tags.some((tag) => tag.toLowerCase().includes(query)))
      );
    }

    setFilteredDocs(filtered);
  }, [type, search]);

  const DocIcon = ({ type, className = 'w-5 h-5' }: { type: string; className?: string }) => {
    switch (type) {
      case 'docs':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case 'blog':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        );
      case 'news':
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8z" />
          </svg>
        );
      default:
        return (
          <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        );
    }
  };

  const getTypePrefix = (type: string) => {
    switch (type) {
      case 'blog':
        return '/blog';
      case 'news':
        return '/news';
      default:
        return '/docs';
    }
  };

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {filteredDocs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => (
              <a
                key={doc.id}
                href={`${getTypePrefix(doc.type)}/${doc.slug}`}
                className={`overflow-hidden rounded-lg border transition-all text-left group hover:shadow-lg ${
                  isDark ? 'bg-[#0a0a0a] border-white/10 hover:border-white/20' : 'bg-[#E8E7E3] border-black/10 hover:border-black/20'
                }`}
              >
                <DocBanner
                  bannercolor={doc.bannercolor || '#3b82f6'}
                  bannertext={doc.bannertext || doc.title}
                  isDark={isDark}
                  className="transition-transform group-hover:scale-105"
                  isCard={true}
                />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <DocIcon type={doc.type} className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-black/70'}`} />
                    <span className={`text-xs font-semibold ${isDark ? 'text-white/70' : 'text-black/70'}`}>
                      {doc.type === 'docs' && 'Документация'}
                      {doc.type === 'blog' && 'Блог'}
                      {doc.type === 'news' && 'Новости'}
                    </span>
                  </div>
                  <h3 className={`text-lg font-bold mb-2 group-hover:text-blue-600 transition-colors ${isDark ? 'text-white' : 'text-black'}`}>{doc.title}</h3>
                  <p className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-black/60'}`}>{doc.description}</p>

                  {doc.category && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'}`}>{doc.category}</span>
                    </div>
                  )}

                  <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                    <div className="flex flex-col gap-1">
                      {doc.author && <span className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>Автор: <strong>{doc.author}</strong></span>}
                      {doc.date && (
                        <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                          {new Date(doc.date).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className={`text-lg ${isDark ? 'text-white/60' : 'text-black/60'}`}>Ничего не найдено. Попробуйте изменить фильтры или поисковый запрос.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default DocsList;
