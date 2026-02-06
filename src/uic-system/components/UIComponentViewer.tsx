import React, { useState, useCallback, Suspense } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Copy, Code2, Eye, Files, RotateCcw } from 'lucide-react';
import CodeViewTabs from './CodeViewTabs';

interface UIComponentViewerProps {
  componentId: string;
  componentName: string;
  Component: React.ComponentType<any>;
  files: Record<string, string>;
  config: any;
  defaultProps?: Record<string, any>;
}

const UIComponentViewer: React.FC<UIComponentViewerProps> = ({
  componentId,
  componentName,
  Component,
  files,
  config,
  defaultProps = {},
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview' | 'files'>('preview');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCopy = useCallback(() => {
    const codeContent = Object.entries(files)
      .filter(([name]) => name.endsWith('.tsx') || name.endsWith('.ts') || name.endsWith('.jsx'))
      .map(([name, content]) => `// ${name}\n${content}`)
      .join('\n\n');

    navigator.clipboard.writeText(codeContent).then(() => {
      const notification = document.createElement('div');
      notification.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg ${
        isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-500/10 text-green-700'
      } border ${isDark ? 'border-green-500/30' : 'border-green-500/20'} z-50 font-medium`;
      notification.textContent = 'Код скопирован!';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    });
  }, [files, isDark]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`px-4 py-2 rounded-lg font-medium transition-all my-6 flex items-center gap-2 ${
          isDark
            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
            : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20'
        }`}
      >
        <Eye size={16} />
        Смотреть компонент: {componentName}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`relative w-full max-w-5xl h-[80vh] rounded-xl border flex flex-col shadow-2xl overflow-hidden ${
              isDark
                ? 'border-white/20 bg-slate-900'
                : 'border-black/20 bg-white'
            }`}
          >
            {/* Header */}
            <div
              className={`flex items-center justify-between px-6 py-4 border-b ${
                isDark
                  ? 'border-white/10 bg-gradient-to-r from-slate-900 to-slate-800'
                  : 'border-black/10 bg-gradient-to-r from-gray-50 to-gray-100'
              }`}
            >
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {componentName}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-lg transition-colors ${
                  isDark
                    ? 'hover:bg-white/10 text-white/70 hover:text-white'
                    : 'hover:bg-black/10 text-black/70 hover:text-black'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {/* Action Bar */}
            <div
              className={`flex items-center justify-between px-4 py-3 border-b gap-2 flex-wrap ${
                isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
              }`}
            >
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleCopy}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-medium ${
                    isDark
                      ? 'text-white/70 hover:text-white/100 hover:bg-white/5 border border-transparent'
                      : 'text-black/70 hover:text-black/100 hover:bg-black/5 border border-transparent'
                  }`}
                >
                  <Copy size={16} />
                  Копировать
                </button>

                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-medium ${
                    activeTab === 'code'
                      ? isDark
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                      : isDark
                      ? 'text-white/70 hover:text-white/100 hover:bg-white/5 border border-transparent'
                      : 'text-black/70 hover:text-black/100 hover:bg-black/5 border border-transparent'
                  }`}
                >
                  <Code2 size={16} />
                  Код
                </button>

                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-medium ${
                    activeTab === 'preview'
                      ? isDark
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                      : isDark
                      ? 'text-white/70 hover:text-white/100 hover:bg-white/5 border border-transparent'
                      : 'text-black/70 hover:text-black/100 hover:bg-black/5 border border-transparent'
                  }`}
                >
                  <Eye size={16} />
                  Превью
                </button>

                <button
                  onClick={() => setActiveTab('files')}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-medium ${
                    activeTab === 'files'
                      ? isDark
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                      : isDark
                      ? 'text-white/70 hover:text-white/100 hover:bg-white/5 border border-transparent'
                      : 'text-black/70 hover:text-black/100 hover:bg-black/5 border border-transparent'
                  }`}
                >
                  <Files size={16} />
                  Файлы
                </button>
              </div>

              <button
                onClick={handleRefresh}
                className={`px-3 py-2 rounded-lg transition-all text-sm font-medium flex items-center gap-2 ${
                  isDark
                    ? 'text-white/70 hover:text-white/100 hover:bg-white/5'
                    : 'text-black/70 hover:text-black/100 hover:bg-black/5'
                }`}
              >
                <RotateCcw size={16} />
                Обновить
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'code' && <CodeViewTabs files={files} />}

              {activeTab === 'preview' && (
                <div className={`flex-1 overflow-auto p-8 flex items-center justify-center ${
                  isDark ? 'bg-black/20' : 'bg-gray-100'
                }`}>
                  <div className={`rounded-lg border max-w-2xl w-full ${
                    isDark 
                      ? 'border-white/10 bg-white/5 shadow-lg shadow-black/20' 
                      : 'border-black/10 bg-white shadow-lg shadow-black/10'
                  } p-8`}>
                    <Suspense fallback={<div className={isDark ? 'text-white/50' : 'text-black/50'}>Загрузка компонента...</div>}>
                      <Component key={refreshKey} {...defaultProps} />
                    </Suspense>
                  </div>
                </div>
              )}

              {activeTab === 'files' && (
                <div className="flex-1 overflow-auto p-6">
                  <div className="space-y-3">
                    {config?.files?.map((file: any, index: number) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
                          isDark
                            ? 'border-white/10 bg-white/5 hover:bg-white/10'
                            : 'border-black/10 bg-black/5 hover:bg-black/10'
                        }`}
                      >
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                          {file.name}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70'
                        }`}>
                          {file.type?.toUpperCase() || 'FILE'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {(!config?.files || config.files.length === 0) && (
                    <div className={`text-center py-12 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                      Нет файлов для отображения
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UIComponentViewer;
