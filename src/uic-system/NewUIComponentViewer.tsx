import React, { useState, useCallback, Suspense, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { X, Maximize2, RotateCcw, Settings } from 'lucide-react';
import { loadComponent, getDefaultProps } from './loader';

interface UIComponentViewerProps {
  componentId: string;
}

const FILTERED_PROPS: Record<string, string[]> = {
  'blur-text': ['delay', 'animateBy', 'direction']
};

const UIComponentViewer: React.FC<UIComponentViewerProps> = ({ componentId }) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentProps, setCurrentProps] = useState<Record<string, any>>({});
  const [componentScale, setComponentScale] = useState(1);
  
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
      }
    });
  }, [componentId]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handlePropChange = (propName: string, value: any) => {
    setCurrentProps(prev => ({ ...prev, [propName]: value }));
  };

  const handleResetProps = () => {
    if (componentData) {
      setCurrentProps(getDefaultProps(componentData.config));
      setComponentScale(1);
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

  const { config, Component } = componentData;

  return (
    <>
      {isOpen ? (
        <SettingsModal
          config={config}
          Component={Component}
          componentId={componentId}
          currentProps={currentProps}
          componentScale={componentScale}
          refreshKey={refreshKey}
          isDark={isDark}
          onClose={() => setIsOpen(false)}
          onScaleChange={setComponentScale}
          onPropChange={handlePropChange}
          onRefresh={handleRefresh}
          onReset={handleResetProps}
        />
      ) : (
        <PreviewMode
          config={config}
          Component={Component}
          currentProps={currentProps}
          componentScale={componentScale}
          refreshKey={refreshKey}
          isDark={isDark}
          onRefresh={handleRefresh}
          onFullscreen={() => setIsFullscreen(true)}
          onOpenSettings={() => setIsOpen(true)}
        />
      )}

      {isFullscreen && (
        <FullscreenModal
          Component={Component}
          currentProps={currentProps}
          componentScale={componentScale}
          refreshKey={refreshKey}
          isDark={isDark}
          onClose={() => setIsFullscreen(false)}
        />
      )}
    </>
  );
};

interface PreviewModeProps {
  config: any;
  Component: React.ComponentType<any>;
  currentProps: Record<string, any>;
  componentScale: number;
  refreshKey: number;
  isDark: boolean;
  onRefresh: () => void;
  onFullscreen: () => void;
  onOpenSettings: () => void;
}

const PreviewMode: React.FC<PreviewModeProps> = ({
  config,
  Component,
  currentProps,
  componentScale,
  refreshKey,
  isDark,
  onRefresh,
  onFullscreen,
  onOpenSettings
}) => {
  const containerClass = `rounded-lg border overflow-hidden my-6 ${
    isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-[#E8E7E3]'
  }`;

  const headerClass = `flex items-center justify-between px-3 py-2 border-b ${
    isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
  }`;

  const buttonBaseClass = `px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2`;

  const getButtonClass = () => {
    return isDark
      ? 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
      : 'text-black/70 hover:text-black hover:bg-black/5 border border-transparent';
  };

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          {config.name}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className={`${buttonBaseClass} ${getButtonClass()}`}
            title="Запустить анимацию заново"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={onFullscreen}
            className={`${buttonBaseClass} ${getButtonClass()}`}
            title="Открыть на весь экран"
          >
            <Maximize2 size={18} />
          </button>
          <button
            onClick={onOpenSettings}
            className={`${buttonBaseClass} ${getButtonClass()}`}
            title="Управление настройками"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div 
          className="text-7xl md:text-8xl lg:text-8xl transition-transform duration-300"
          style={{ transform: `scale(${componentScale})` }}
        >
          <Suspense fallback={<div className={isDark ? 'text-white/50' : 'text-black/50'}>Загрузка...</div>}>
            <Component key={refreshKey} {...currentProps} />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

interface SettingsModalProps {
  config: any;
  Component: React.ComponentType<any>;
  componentId: string;
  currentProps: Record<string, any>;
  componentScale: number;
  refreshKey: number;
  isDark: boolean;
  onClose: () => void;
  onScaleChange: (scale: number) => void;
  onPropChange: (name: string, value: any) => void;
  onRefresh: () => void;
  onReset: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  Component,
  componentId,
  currentProps,
  componentScale,
  refreshKey,
  isDark,
  onClose,
  onScaleChange,
  onPropChange,
  onRefresh,
  onReset
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Закрыть"
      />

      <div className={`relative w-full max-w-6xl h-[85vh] rounded-xl border shadow-2xl flex flex-col overflow-hidden ${
        isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-white'
      }`}>
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
        }`}>
          <div className="flex items-center gap-2">
            <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              {config.name} - Настройки
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10 text-white/70' : 'hover:bg-black/10 text-black/70'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-1/2 overflow-auto p-6 border-r" style={{
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }}>
            <PropsEditor
              config={config}
              componentId={componentId}
              currentProps={currentProps}
              componentScale={componentScale}
              onScaleChange={onScaleChange}
              onChange={onPropChange}
              onRefresh={onRefresh}
              onReset={onReset}
              isDark={isDark}
            />
          </div>

          <div className={`w-1/2 overflow-auto p-8 flex items-center justify-center ${
            isDark ? 'bg-black/20' : 'bg-gray-50'
          }`}>
            <div 
              className="text-7xl md:text-8xl lg:text-8xl transition-transform duration-300"
              style={{ transform: `scale(${componentScale})` }}
            >
              <Suspense fallback={<div>Загрузка...</div>}>
                <Component key={refreshKey} {...currentProps} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FullscreenModalProps {
  Component: React.ComponentType<any>;
  currentProps: Record<string, any>;
  componentScale: number;
  refreshKey: number;
  isDark: boolean;
  onClose: () => void;
}

const FullscreenModal: React.FC<FullscreenModalProps> = ({
  Component,
  currentProps,
  componentScale,
  refreshKey,
  isDark,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <button
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Закрыть полноэкранный режим"
      />
      <div className={`relative w-full max-w-6xl h-[90vh] rounded-xl border shadow-2xl overflow-auto ${
        isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-white'
      }`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg z-10 ${
            isDark ? 'bg-black/50 hover:bg-black/70 text-white' : 'bg-white/50 hover:bg-white/70 text-black'
          }`}
        >
          <X size={20} />
        </button>
        <div className="p-12 flex items-center justify-center min-h-full">
          <div 
            className="text-7xl md:text-8xl lg:text-8xl transition-transform duration-300"
            style={{ transform: `scale(${componentScale})` }}
          >
            <Suspense fallback={<div>Загрузка...</div>}>
              <Component key={refreshKey} {...currentProps} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PropsEditorProps {
  config: any;
  componentId: string;
  currentProps: Record<string, any>;
  componentScale: number;
  onScaleChange: (scale: number) => void;
  onChange: (name: string, value: any) => void;
  onRefresh: () => void;
  onReset: () => void;
  isDark: boolean;
}

const PropsEditor: React.FC<PropsEditorProps> = ({ 
  config, 
  componentId, 
  currentProps, 
  componentScale, 
  onScaleChange, 
  onChange, 
  onRefresh, 
  onReset, 
  isDark 
}) => {
  const allowedProps = FILTERED_PROPS[componentId] || config.props.map((p: any) => p.name);
  const visibleProps = config.props.filter((prop: any) => allowedProps.includes(prop.name));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          Настройки компонента
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black'
            }`}
            title="Запустить анимацию заново"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={onReset}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black'
            }`}
          >
            Сбросить
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label htmlFor="component-scale-slider" className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
            Масштаб компонента
            {' '}
            <span className={`ml-2 text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
              (number)
            </span>
          </label>
          
          <div className="space-y-3">
            <input
              id="component-scale-slider"
              type="range"
              value={componentScale}
              onChange={(e) => onScaleChange(Number(e.target.value))}
              min={0.3}
              max={2}
              step={0.1}
              className={`w-full h-3 rounded-lg appearance-none cursor-pointer ${
                isDark 
                  ? 'bg-white/10 [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:bg-white' 
                  : 'bg-black/10 [&::-webkit-slider-thumb]:bg-black [&::-moz-range-thumb]:bg-black'
              } [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0`}
            />
            <div className={`text-center text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
              {(componentScale * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {visibleProps.map((prop: any) => (
          <PropControl
            key={prop.name}
            prop={prop}
            value={currentProps[prop.name]}
            onChange={onChange}
            isDark={isDark}
          />
        ))}
      </div>
    </div>
  );
};

interface PropControlProps {
  prop: any;
  value: any;
  onChange: (name: string, value: any) => void;
  isDark: boolean;
}

const PropControl: React.FC<PropControlProps> = ({ prop, value, onChange, isDark }) => {
  const inputId = `prop-${prop.name}`;
  
  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
        {prop.description}
        {' '}
        <span className={`ml-2 text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          ({prop.type})
        </span>
      </label>
      
      {prop.control === 'number' && (
        <div className="space-y-3">
          <input
            id={inputId}
            type="range"
            value={value ?? prop.default ?? 0}
            onChange={(e) => onChange(prop.name, Number(e.target.value))}
            min={prop.min ?? 0}
            max={prop.max ?? 100}
            step={prop.step ?? 1}
            className={`w-full h-3 rounded-lg appearance-none cursor-pointer ${
              isDark 
                ? 'bg-white/10 [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:bg-white' 
                : 'bg-black/10 [&::-webkit-slider-thumb]:bg-black [&::-moz-range-thumb]:bg-black'
            } [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0`}
          />
          <div className={`text-center text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
            {value ?? prop.default ?? 0}
          </div>
        </div>
      )}

      {prop.control === 'select' && (
        <div className="relative">
          <select
            id={inputId}
            value={value ?? prop.default ?? ''}
            onChange={(e) => onChange(prop.name, e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border appearance-none cursor-pointer text-base font-medium transition-all ${
              isDark
                ? 'bg-white/5 border-white/10 text-white hover:bg-white/10 focus:bg-white/10'
                : 'bg-white border-black/10 text-black hover:bg-black/5 focus:bg-white'
            } focus:outline-none focus:ring-2 ${
              isDark ? 'focus:ring-white/20' : 'focus:ring-black/20'
            }`}
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${isDark ? 'white' : 'black'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.5rem',
              paddingRight: '2.75rem'
            }}
          >
            {prop.options?.map((opt: string) => (
              <option 
                key={opt} 
                value={opt}
                className={isDark ? 'bg-[#0a0a0a] text-white' : 'bg-white text-black'}
              >
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default UIComponentViewer;
