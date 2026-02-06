import React, { useState, useCallback, Suspense, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Copy, Code2, Maximize2, RotateCcw, Settings } from 'lucide-react';
import { loadComponent, getDefaultProps } from './loader';

interface UIComponentViewerProps {
  componentId: string;
}

const UIComponentViewer: React.FC<UIComponentViewerProps> = ({ componentId }) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'preview' | 'code' | 'props'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentProps, setCurrentProps] = useState<Record<string, any>>({});
  const [selectedFile, setSelectedFile] = useState<string>('');
  
  const [componentData, setComponentData] = useState<{
    config: any;
    Component: React.ComponentType<any>;
    fileContents: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    loadComponent(componentId).then(data => {
      if (data) {
        setComponentData(data);
        setCurrentProps(getDefaultProps(data.config));
        setSelectedFile(data.config.files[0]?.name || '');
      }
    });
  }, [componentId]);

  const handleCopy = useCallback(() => {
    if (!componentData) return;
    const allCode = Object.entries(componentData.fileContents)
      .map(([name, content]) => `// ${name}\n${content}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(allCode).then(() => {
      showNotification('Код скопирован!', isDark);
    });
  }, [componentData, isDark]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handlePropChange = (propName: string, value: any) => {
    setCurrentProps(prev => ({ ...prev, [propName]: value }));
  };

  const handleResetProps = () => {
    if (componentData) {
      setCurrentProps(getDefaultProps(componentData.config));
      setRefreshKey(prev => prev + 1);
    }
  };

  if (!componentData) {
    return (
      <button
        className={`px-4 py-2 rounded-lg font-medium my-6 ${
          isDark ? 'bg-white/10 text-white/50' : 'bg-black/10 text-black/50'
        }`}
        disabled
      >
        Загрузка компонента...
      </button>
    );
  }

  const { config, Component, fileContents } = componentData;

  const containerClass = `rounded-lg border overflow-hidden my-6 ${
    isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-[#E8E7E3]'
  }`;

  const headerClass = `flex items-center justify-between px-3 py-2 border-b ${
    isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
  }`;

  const buttonBaseClass = `px-2 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5`;

  const getButtonClass = (isActive: boolean = false) => {
    if (isActive) {
      return isDark
        ? 'bg-white/10 text-white border border-white/20'
        : 'bg-black/10 text-black border border-black/20';
    }
    return isDark
      ? 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
      : 'text-black/70 hover:text-black hover:bg-black/5 border border-transparent';
  };

  return (
    <>
      {!isOpen ? (
        <div className={containerClass}>
          <div className={headerClass}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {config.name}
            </h3>
            <div className="flex gap-1.5">
              <button
                onClick={() => setIsFullscreen(true)}
                className={`${buttonBaseClass} ${getButtonClass()}`}
                title="Открыть на весь экран"
              >
                <Maximize2 size={12} />
              </button>
              <button
                onClick={handleRefresh}
                className={`${buttonBaseClass} ${getButtonClass()}`}
                title="Повторить анимацию"
              >
                <RotateCcw size={12} />
              </button>
              <button
                onClick={() => { setView('props'); setIsOpen(true); }}
                className={`${buttonBaseClass} ${getButtonClass()}`}
                title="Управление пропсами"
              >
                <Settings size={12} />
              </button>
              <button
                onClick={() => { setView('code'); setIsOpen(true); }}
                className={`${buttonBaseClass} ${getButtonClass()}`}
                title="Посмотреть код"
              >
                <Code2 size={12} />
              </button>
            </div>
          </div>

          <div className="p-8 flex items-center justify-center min-h-[300px]">
            <div className="text-4xl md:text-5xl lg:text-6xl">
              <Suspense fallback={<div className={isDark ? 'text-white/50' : 'text-black/50'}>Загрузка...</div>}>
                <Component key={refreshKey} {...currentProps} />
              </Suspense>
            </div>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-label="Закрыть"
          />

          <div className={`relative w-full max-w-6xl h-[85vh] rounded-xl border shadow-2xl flex flex-col overflow-hidden ${
            isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-white'
          }`}>
            <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
              isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
            }`}>
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  {config.name}
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-white/10 text-white/70' : 'hover:bg-black/10 text-black/70'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div className={`flex items-center gap-2 px-4 py-2 border-b ${
              isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
            }`}>
              <button
                onClick={() => setView('preview')}
                className={`${buttonBaseClass} ${getButtonClass(view === 'preview')}`}
              >
                Превью
              </button>
              <button
                onClick={() => setView('code')}
                className={`${buttonBaseClass} ${getButtonClass(view === 'code')}`}
              >
                <Code2 size={12} />
                Код
              </button>
              <button
                onClick={() => setView('props')}
                className={`${buttonBaseClass} ${getButtonClass(view === 'props')}`}
              >
                <Settings size={12} />
                Настройки
              </button>

              <div className="flex-1" />

              {view === 'code' && (
                <button
                  onClick={handleCopy}
                  className={`${buttonBaseClass} ${getButtonClass()}`}
                >
                  <Copy size={12} />
                  Копировать
                </button>
              )}

              <button
                onClick={handleRefresh}
                className={`${buttonBaseClass} ${getButtonClass()}`}
              >
                <RotateCcw size={12} />
                Обновить
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              {view === 'preview' && (
                <div className={`h-full overflow-auto p-8 flex items-center justify-center ${
                  isDark ? 'bg-black/20' : 'bg-gray-50'
                }`}>
                  <div className="text-4xl md:text-5xl lg:text-6xl">
                    <Suspense fallback={<div>Загрузка...</div>}>
                      <Component key={refreshKey} {...currentProps} />
                    </Suspense>
                  </div>
                </div>
              )}

              {view === 'code' && (
                <div className="h-full flex flex-col">
                  <div className={`flex gap-2 px-4 py-2 border-b overflow-x-auto ${
                    isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
                  }`}>
                    {config.files.map((file: any) => (
                      <button
                        key={file.name}
                        onClick={() => setSelectedFile(file.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                          selectedFile === file.name
                            ? isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-black/10 text-black border border-black/20'
                            : isDark ? 'text-white/50 hover:text-white/70' : 'text-black/50 hover:text-black/70'
                        }`}
                      >
                        {file.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-auto">
                    <CodeDisplay code={fileContents[selectedFile] || ''} isDark={isDark} />
                  </div>
                </div>
              )}

              {view === 'props' && (
                <div className="h-full overflow-auto p-6">
                  <PropsEditor
                    config={config}
                    currentProps={currentProps}
                    onChange={handlePropChange}
                    onReset={handleResetProps}
                    isDark={isDark}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isFullscreen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <button
            className="absolute inset-0"
            onClick={() => setIsFullscreen(false)}
            aria-label="Закрыть полноэкранный режим"
          />
          <div className={`relative w-full max-w-6xl h-[90vh] rounded-xl border shadow-2xl overflow-auto ${
            isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-white'
          }`}>
            <button
              onClick={() => setIsFullscreen(false)}
              className={`absolute top-4 right-4 p-2 rounded-lg z-10 ${
                isDark ? 'bg-black/50 hover:bg-black/70 text-white' : 'bg-white/50 hover:bg-white/70 text-black'
              }`}
            >
              <X size={20} />
            </button>
            <div className="p-12 flex items-center justify-center min-h-full">
              <div className="text-5xl md:text-6xl lg:text-7xl">
                <Suspense fallback={<div>Загрузка...</div>}>
                  <Component key={refreshKey} {...currentProps} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const CodeDisplay: React.FC<{ code: string; isDark: boolean }> = ({ code, isDark }) => {
  const lines = code.split('\n');
  const bg = isDark ? '#0a0a0a' : '#E8E7E3';
  const fg = isDark ? '#ffffff' : '#000000';

  return (
    <pre
      className="p-4 text-sm font-mono"
      style={{ background: bg, color: fg }}
    >
      {lines.map((line, i) => (
        <div key={`line-${i}`} className="whitespace-pre">
          <span
            className="inline-block w-8 mr-4 text-right select-none"
            style={{ color: isDark ? '#888' : '#666' }}
          >
            {i + 1}
          </span>
          <span>{line}</span>
        </div>
      ))}
    </pre>
  );
};

const PropsEditor: React.FC<{
  config: any;
  currentProps: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onReset: () => void;
  isDark: boolean;
}> = ({ config, currentProps, onChange, onReset, isDark }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          Настройки компонента
        </h3>
        <button
          onClick={onReset}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black'
          }`}
        >
          Сбросить
        </button>
      </div>

      <div className="space-y-6">
        {config.props.map((prop: any) => (
          <div key={prop.name} className="space-y-3">
            <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
              {prop.name}
              <span className={`ml-2 text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
                ({prop.type})
              </span>
            </label>
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              {prop.description}
            </p>
            
            {prop.control === 'number' && (
              <div className="space-y-2">
                <input
                  type="range"
                  value={currentProps[prop.name] || 0}
                  onChange={(e) => onChange(prop.name, Number(e.target.value))}
                  min={prop.min || 0}
                  max={prop.max || 100}
                  step={prop.step || 1}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                    isDark 
                      ? 'bg-white/10 [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:bg-white' 
                      : 'bg-black/10 [&::-webkit-slider-thumb]:bg-black [&::-moz-range-thumb]:bg-black'
                  } [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0`}
                />
                <div className={`text-center text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                  {currentProps[prop.name]}
                </div>
              </div>
            )}

            {prop.control === 'select' && (
              <div className="relative">
                <select
                  value={currentProps[prop.name] || ''}
                  onChange={(e) => onChange(prop.name, e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-lg border appearance-none cursor-pointer text-sm ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-black/10 text-black'
                  } focus:outline-none focus:ring-2 ${
                    isDark ? 'focus:ring-white/20' : 'focus:ring-black/20'
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${isDark ? 'white' : 'black'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1.25rem',
                    paddingRight: '2.5rem'
                  }}
                >
                  {prop.options?.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

function showNotification(message: string, isDark: boolean) {
  const notification = document.createElement('div');
  const bgColor = isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-500/10 text-green-700';
  const borderColor = isDark ? 'border-green-500/30' : 'border-green-500/20';
  
  notification.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg ${bgColor} border ${borderColor} z-[100] font-medium`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2000);
}

export default UIComponentViewer;
