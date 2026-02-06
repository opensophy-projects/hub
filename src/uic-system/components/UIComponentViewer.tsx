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

type TabType = 'code' | 'preview' | 'files';

// Extracted helper functions to reduce complexity
const getCodeFiles = (files: Record<string, string>) => {
  return Object.entries(files)
    .filter(([name]) => name.endsWith('.tsx') || name.endsWith('.ts') || name.endsWith('.jsx'))
    .map(([name, content]) => `// ${name}\n${content}`)
    .join('\n\n');
};

const showNotification = (message: string, isDark: boolean) => {
  const notification = document.createElement('div');
  const bgColor = isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-500/10 text-green-700';
  const borderColor = isDark ? 'border-green-500/30' : 'border-green-500/20';
  
  notification.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg ${bgColor} border ${borderColor} z-50 font-medium`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2000);
};

// Extracted button styles
const getButtonStyles = (isActive: boolean, isDark: boolean) => {
  if (isActive) {
    return isDark
      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      : 'bg-blue-500/20 text-blue-600 border border-blue-500/30';
  }
  
  return isDark
    ? 'text-white/70 hover:text-white/100 hover:bg-white/5 border border-transparent'
    : 'text-black/70 hover:text-black/100 hover:bg-black/5 border border-transparent';
};

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
  const [activeTab, setActiveTab] = useState<TabType>('preview');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCopy = useCallback(() => {
    const codeContent = getCodeFiles(files);
    navigator.clipboard.writeText(codeContent).then(() => {
      showNotification('Код скопирован!', isDark);
    });
  }, [files, isDark]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleBackdropClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleBackdropKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(false);
    }
  }, []);

  const triggerButtonClass = `px-4 py-2 rounded-lg font-medium transition-all my-6 flex items-center gap-2 ${
    isDark
      ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
      : 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border border-blue-500/20'
  }`;

  const modalContainerClass = `relative w-full max-w-5xl h-[80vh] rounded-xl border flex flex-col shadow-2xl overflow-hidden ${
    isDark
      ? 'border-white/20 bg-slate-900'
      : 'border-black/20 bg-white'
  }`;

  const headerClass = `flex items-center justify-between px-6 py-4 border-b ${
    isDark
      ? 'border-white/10 bg-gradient-to-r from-slate-900 to-slate-800'
      : 'border-black/10 bg-gradient-to-r from-gray-50 to-gray-100'
  }`;

  const actionBarClass = `flex items-center justify-between px-4 py-3 border-b gap-2 flex-wrap ${
    isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
  }`;

  const previewContainerClass = `flex-1 overflow-auto p-8 flex items-center justify-center ${
    isDark ? 'bg-black/20' : 'bg-gray-100'
  }`;

  const previewCardClass = `rounded-lg border max-w-2xl w-full ${
    isDark 
      ? 'border-white/10 bg-white/5 shadow-lg shadow-black/20' 
      : 'border-black/10 bg-white shadow-lg shadow-black/10'
  } p-8`;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={triggerButtonClass}
      >
        <Eye size={16} />
        Смотреть компонент: {componentName}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            role="button"
            tabIndex={0}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
            onKeyDown={handleBackdropKeyDown}
            aria-label="Закрыть модальное окно"
          />

          <div className={modalContainerClass}>
            {/* Header */}
            <div className={headerClass}>
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
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>
            </div>

            {/* Action Bar */}
            <ActionBar
              isDark={isDark}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              handleCopy={handleCopy}
              handleRefresh={handleRefresh}
              actionBarClass={actionBarClass}
            />

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'code' && <CodeViewTabs files={files} />}

              {activeTab === 'preview' && (
                <div className={previewContainerClass}>
                  <div className={previewCardClass}>
                    <Suspense fallback={
                      <div className={isDark ? 'text-white/50' : 'text-black/50'}>
                        Загрузка компонента...
                      </div>
                    }>
                      <Component key={refreshKey} {...defaultProps} />
                    </Suspense>
                  </div>
                </div>
              )}

              {activeTab === 'files' && (
                <FilesList config={config} isDark={isDark} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Extracted ActionBar component to reduce complexity
interface ActionBarProps {
  isDark: boolean;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  handleCopy: () => void;
  handleRefresh: () => void;
  actionBarClass: string;
}

const ActionBar: React.FC<ActionBarProps> = ({
  isDark,
  activeTab,
  setActiveTab,
  handleCopy,
  handleRefresh,
  actionBarClass,
}) => {
  const baseButtonClass = "px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-sm font-medium";
  
  return (
    <div className={actionBarClass}>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleCopy}
          className={`${baseButtonClass} ${getButtonStyles(false, isDark)}`}
        >
          <Copy size={16} />
          Копировать
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`${baseButtonClass} ${getButtonStyles(activeTab === 'code', isDark)}`}
        >
          <Code2 size={16} />
          Код
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`${baseButtonClass} ${getButtonStyles(activeTab === 'preview', isDark)}`}
        >
          <Eye size={16} />
          Превью
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className={`${baseButtonClass} ${getButtonStyles(activeTab === 'files', isDark)}`}
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
  );
};

// Extracted FilesList component
interface FilesListProps {
  config: any;
  isDark: boolean;
}

const FilesList: React.FC<FilesListProps> = ({ config, isDark }) => {
  const files = config?.files || [];
  
  if (files.length === 0) {
    return (
      <div className={`text-center py-12 ${isDark ? 'text-white/50' : 'text-black/50'}`}>
        Нет файлов для отображения
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="space-y-3">
        {files.map((file: any) => (
          <div
            key={`${file.name}-${file.type || 'file'}`}
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
    </div>
  );
};

export default UIComponentViewer;