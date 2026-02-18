import React, { useState, useCallback, Suspense, useEffect, useMemo } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { X, Maximize2, RotateCcw, Settings, Sliders } from 'lucide-react';
import { loadComponent, getDefaultProps } from './loader';
import { ComponentWrapper } from './ComponentWrapper';
import type { UniversalProps, ComponentConfig, PropDefinition } from './types';

interface UIComponentViewerProps {
  componentId: string;
}

const UIComponentViewer: React.FC<UIComponentViewerProps> = ({ componentId }) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [componentProps, setComponentProps] = useState<Record<string, unknown>>({});
  
  const [universalProps, setUniversalProps] = useState<UniversalProps>({
    enableUniversalProps: true,
    scale: 1,
    color: undefined,
    colorMode: 'original',
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    perspective: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    animationSpeed: 1,
    opacity: 1,
    blur: 0,
    brightness: 1,
    contrast: 1,
    saturate: 1,
  });
  
  const [componentData, setComponentData] = useState<{
    config: ComponentConfig;
    Component: React.ComponentType<Record<string, unknown>>;
    fileContents: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    loadComponent(componentId).then(data => {
      if (data) {
        setComponentData(data);
        setComponentProps(getDefaultProps(data.config));
      }
    });
  }, [componentId]);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handlePropChange = (propName: string, value: unknown) => {
    setComponentProps(prev => ({ ...prev, [propName]: value }));
  };

  const handleUniversalPropChange = (propName: keyof UniversalProps, value: unknown) => {
    setUniversalProps(prev => ({ ...prev, [propName]: value }));
  };

  const handleResetProps = () => {
    if (componentData) {
      setComponentProps(getDefaultProps(componentData.config));
      setUniversalProps({
        enableUniversalProps: true,
        scale: 1,
        color: undefined,
        colorMode: 'original',
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        perspective: 1000,
        justifyContent: 'center',
        alignItems: 'center',
        animationSpeed: 1,
        opacity: 1,
        blur: 0,
        brightness: 1,
        contrast: 1,
        saturate: 1,
      });
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
          componentProps={componentProps}
          universalProps={universalProps}
          refreshKey={refreshKey}
          isDark={isDark}
          onClose={() => setIsOpen(false)}
          onPropChange={handlePropChange}
          onUniversalPropChange={handleUniversalPropChange}
          onRefresh={handleRefresh}
          onReset={handleResetProps}
        />
      ) : (
        <PreviewMode
          config={config}
          Component={Component}
          componentProps={componentProps}
          universalProps={universalProps}
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
          componentProps={componentProps}
          universalProps={universalProps}
          refreshKey={refreshKey}
          isDark={isDark}
          onClose={() => setIsFullscreen(false)}
        />
      )}
    </>
  );
};

interface PreviewModeProps {
  config: ComponentConfig;
  Component: React.ComponentType<Record<string, unknown>>;
  componentProps: Record<string, unknown>;
  universalProps: UniversalProps;
  refreshKey: number;
  isDark: boolean;
  onRefresh: () => void;
  onFullscreen: () => void;
  onOpenSettings: () => void;
}

const PreviewMode: React.FC<PreviewModeProps> = ({
  config,
  Component,
  componentProps,
  universalProps,
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
        <ComponentWrapper {...universalProps} className="w-full h-full">
          <Suspense fallback={<div className={isDark ? 'text-white/50' : 'text-black/50'}>Загрузка...</div>}>
            <Component key={refreshKey} {...componentProps} />
          </Suspense>
        </ComponentWrapper>
      </div>
    </div>
  );
};

interface SettingsModalProps {
  config: ComponentConfig;
  Component: React.ComponentType<Record<string, unknown>>;
  componentProps: Record<string, unknown>;
  universalProps: UniversalProps;
  refreshKey: number;
  isDark: boolean;
  onClose: () => void;
  onPropChange: (name: string, value: unknown) => void;
  onUniversalPropChange: (name: keyof UniversalProps, value: unknown) => void;
  onRefresh: () => void;
  onReset: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  Component,
  componentProps,
  universalProps,
  refreshKey,
  isDark,
  onClose,
  onPropChange,
  onUniversalPropChange,
  onRefresh,
  onReset
}) => {
  const [activeTab, setActiveTab] = useState<'universal' | 'specific'>('universal');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Закрыть"
      />

      <ModalContent
        config={config}
        Component={Component}
        componentProps={componentProps}
        universalProps={universalProps}
        refreshKey={refreshKey}
        isDark={isDark}
        activeTab={activeTab}
        onClose={onClose}
        onPropChange={onPropChange}
        onUniversalPropChange={onUniversalPropChange}
        onRefresh={onRefresh}
        onReset={onReset}
        onTabChange={setActiveTab}
      />
    </div>
  );
};

interface ModalContentProps extends SettingsModalProps {
  activeTab: 'universal' | 'specific';
  onTabChange: (tab: 'universal' | 'specific') => void;
}

const ModalContent: React.FC<ModalContentProps> = ({
  config,
  Component,
  componentProps,
  universalProps,
  refreshKey,
  isDark,
  activeTab,
  onClose,
  onPropChange,
  onUniversalPropChange,
  onRefresh,
  onReset,
  onTabChange
}) => {
  const modalBgClass = isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-white';
  const headerBgClass = isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div className={`relative w-full max-w-2xl md:max-w-6xl h-[85vh] md:h-[85vh] rounded-xl border shadow-2xl flex flex-col overflow-hidden ${modalBgClass}`}>
      <ModalHeader
        config={config}
        isDark={isDark}
        onClose={onClose}
        onRefresh={onRefresh}
        onReset={onReset}
        headerBgClass={headerBgClass}
      />

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 overflow-auto border-b md:border-b-0 md:border-r flex flex-col" style={{ borderColor }}>
          <TabButtons
            activeTab={activeTab}
            isDark={isDark}
            onTabChange={onTabChange}
          />

          <div className="flex-1 overflow-auto p-4 md:p-6">
            {activeTab === 'universal' ? (
              <UniversalPropsEditor
                universalProps={universalProps}
                onChange={onUniversalPropChange}
                isDark={isDark}
              />
            ) : (
              <ComponentPropsEditor
                config={config}
                componentProps={componentProps}
                onChange={onPropChange}
                isDark={isDark}
              />
            )}
          </div>
        </div>

        <ComponentPreview
          Component={Component}
          componentProps={componentProps}
          universalProps={universalProps}
          refreshKey={refreshKey}
          isDark={isDark}
        />
      </div>
    </div>
  );
};

interface ModalHeaderProps {
  config: ComponentConfig;
  isDark: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onReset: () => void;
  headerBgClass: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  config,
  isDark,
  onClose,
  onRefresh,
  onReset,
  headerBgClass
}) => {
  const hoverBgClass = isDark ? 'hover:bg-white/10 text-white/70' : 'hover:bg-black/10 text-black/70';
  const resetButtonClass = isDark 
    ? 'bg-white/10 hover:bg-white/20 text-white' 
    : 'bg-black/10 hover:bg-black/20 text-black';

  return (
    <div className={`flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b gap-2 flex-wrap ${headerBgClass}`}>
      <h2 className={`text-xs md:text-sm font-bold ${isDark ? 'text-white' : 'text-black'} truncate`}>
        {config.name} - Настройки
      </h2>
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        <button
          onClick={onRefresh}
          className={`p-1.5 md:p-2 rounded-lg transition-colors ${hoverBgClass}`}
          title="Обновить"
        >
          <RotateCcw size={16} className="md:w-[18px] md:h-[18px]" />
        </button>
        <button
          onClick={onReset}
          className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${resetButtonClass}`}
        >
          Сбросить
        </button>
        <button
          onClick={onClose}
          className={`p-1.5 md:p-2 rounded-lg transition-colors ${hoverBgClass}`}
        >
          <X size={16} className="md:w-[20px] md:h-[20px]" />
        </button>
      </div>
    </div>
  );
};

interface TabButtonsProps {
  activeTab: 'universal' | 'specific';
  isDark: boolean;
  onTabChange: (tab: 'universal' | 'specific') => void;
}

const TabButtons: React.FC<TabButtonsProps> = ({ activeTab, isDark, onTabChange }) => {
  const borderClass = isDark ? 'border-white/10' : 'border-black/10';

  const getTabClass = (tab: 'universal' | 'specific') => {
    const isActive = activeTab === tab;
    
    if (isActive) {
      return isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black';
    }
    
    return isDark ? 'text-white/60 hover:bg-white/5' : 'text-black/60 hover:bg-black/5';
  };

  return (
    <div className={`flex border-b ${borderClass} sticky top-0 z-10 bg-inherit`}>
      <button
        onClick={() => onTabChange('universal')}
        className={`flex-1 px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1 md:gap-2 ${getTabClass('universal')}`}
      >
        <Sliders size={14} className="md:w-[16px] md:h-[16px]" />
        <span className="hidden sm:inline">Общие</span>
      </button>
      <button
        onClick={() => onTabChange('specific')}
        className={`flex-1 px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1 md:gap-2 ${getTabClass('specific')}`}
      >
        <Settings size={14} className="md:w-[16px] md:h-[16px]" />
        <span className="hidden sm:inline">Специфические</span>
      </button>
    </div>
  );
};

interface ComponentPreviewProps {
  Component: React.ComponentType<Record<string, unknown>>;
  componentProps: Record<string, unknown>;
  universalProps: UniversalProps;
  refreshKey: number;
  isDark: boolean;
}

const ComponentPreview: React.FC<ComponentPreviewProps> = ({
  Component,
  componentProps,
  universalProps,
  refreshKey,
  isDark
}) => {
  const bgClass = isDark ? 'bg-black/20' : 'bg-gray-50';

  return (
    <div className={`hidden md:flex w-full md:w-1/2 overflow-auto p-6 md:p-8 items-center justify-center ${bgClass}`}>
      <ComponentWrapper {...universalProps} className="w-full h-full">
        <Suspense fallback={<div>Загрузка...</div>}>
          <Component key={refreshKey} {...componentProps} />
        </Suspense>
      </ComponentWrapper>
    </div>
  );
};

interface FullscreenModalProps {
  Component: React.ComponentType<Record<string, unknown>>;
  componentProps: Record<string, unknown>;
  universalProps: UniversalProps;
  refreshKey: number;
  isDark: boolean;
  onClose: () => void;
}

const FullscreenModal: React.FC<FullscreenModalProps> = ({
  Component,
  componentProps,
  universalProps,
  refreshKey,
  isDark,
  onClose
}) => {
  const modalBgClass = isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-white';
  const closeBtnClass = isDark 
    ? 'bg-black/50 hover:bg-black/70 text-white' 
    : 'bg-white/50 hover:bg-white/70 text-black';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <button
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Закрыть полноэкранный режим"
      />
      <div className={`relative w-full max-w-6xl h-[90vh] rounded-xl border shadow-2xl overflow-auto ${modalBgClass}`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg z-10 ${closeBtnClass}`}
        >
          <X size={20} />
        </button>
        <div className="p-12 flex items-center justify-center min-h-full">
          <ComponentWrapper {...universalProps} className="w-full h-full">
            <Suspense fallback={<div>Загрузка...</div>}>
              <Component key={refreshKey} {...componentProps} />
            </Suspense>
          </ComponentWrapper>
        </div>
      </div>
    </div>
  );
};

interface UniversalPropsEditorProps {
  universalProps: UniversalProps;
  onChange: (name: keyof UniversalProps, value: unknown) => void;
  isDark: boolean;
}

const UniversalPropsEditor: React.FC<UniversalPropsEditorProps> = ({
  universalProps,
  onChange,
  isDark
}) => {
  return (
    <div className="space-y-4 md:space-y-6">
      <h3 className={`text-base md:text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
        Общие настройки компонента
      </h3>

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={universalProps.enableUniversalProps}
            onChange={(e) => onChange('enableUniversalProps', e.target.checked)}
            className="rounded"
          />
          <span className={`text-xs md:text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
            Включить общие настройки
          </span>
        </label>
      </div>

      {universalProps.enableUniversalProps && (
        <>
          <SliderControl
            label="Масштаб"
            value={universalProps.scale || 1}
            onChange={(v) => onChange('scale', v)}
            min={0.1}
            max={3}
            step={0.1}
            isDark={isDark}
          />

          <SliderControl
            label="Прозрачность"
            value={universalProps.opacity || 1}
            onChange={(v) => onChange('opacity', v)}
            min={0}
            max={1}
            step={0.1}
            isDark={isDark}
          />

          <SliderControl
            label="Вращение X"
            value={universalProps.rotateX || 0}
            onChange={(v) => onChange('rotateX', v)}
            min={-180}
            max={180}
            step={5}
            isDark={isDark}
          />

          <SliderControl
            label="Вращение Y"
            value={universalProps.rotateY || 0}
            onChange={(v) => onChange('rotateY', v)}
            min={-180}
            max={180}
            step={5}
            isDark={isDark}
          />

          <SliderControl
            label="Вращение Z"
            value={universalProps.rotateZ || 0}
            onChange={(v) => onChange('rotateZ', v)}
            min={-180}
            max={180}
            step={5}
            isDark={isDark}
          />

          <SliderControl
            label="Скорость анимации"
            value={universalProps.animationSpeed || 1}
            onChange={(v) => onChange('animationSpeed', v)}
            min={0.1}
            max={5}
            step={0.1}
            isDark={isDark}
          />

          <SliderControl
            label="Размытие"
            value={universalProps.blur || 0}
            onChange={(v) => onChange('blur', v)}
            min={0}
            max={20}
            step={1}
            isDark={isDark}
          />

          <SliderControl
            label="Яркость"
            value={universalProps.brightness || 1}
            onChange={(v) => onChange('brightness', v)}
            min={0}
            max={2}
            step={0.1}
            isDark={isDark}
          />

          <SliderControl
            label="Контраст"
            value={universalProps.contrast || 1}
            onChange={(v) => onChange('contrast', v)}
            min={0}
            max={2}
            step={0.1}
            isDark={isDark}
          />

          <SliderControl
            label="Насыщенность"
            value={universalProps.saturate || 1}
            onChange={(v) => onChange('saturate', v)}
            min={0}
            max={2}
            step={0.1}
            isDark={isDark}
          />
        </>
      )}
    </div>
  );
};

interface ComponentPropsEditorProps {
  config: ComponentConfig;
  componentProps: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  isDark: boolean;
}

const ComponentPropsEditor: React.FC<ComponentPropsEditorProps> = ({
  config,
  componentProps,
  onChange,
  isDark
}) => {
  const visibleProps = useMemo(() => {
    if (config.specificProps && config.specificProps.length > 0) {
      return config.props.filter((prop: PropDefinition) => config.specificProps!.includes(prop.name));
    }
    return config.props;
  }, [config]);

  return (
    <div className="space-y-4 md:space-y-6">
      <h3 className={`text-base md:text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
        Специфические настройки
      </h3>

      {visibleProps.length > 0 ? (
        visibleProps.map((prop: PropDefinition) => (
          <PropControl
            key={prop.name}
            prop={prop}
            value={componentProps[prop.name]}
            onChange={onChange}
            isDark={isDark}
          />
        ))
      ) : (
        <p className={`text-xs md:text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          Для этого компонента нет специфических настроек
        </p>
      )}
    </div>
  );
};

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  isDark: boolean;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  isDark
}) => {
  const sliderThumbClass = isDark 
    ? 'bg-white/10 [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:bg-white' 
    : 'bg-black/10 [&::-webkit-slider-thumb]:bg-black [&::-moz-range-thumb]:bg-black';

  return (
    <div className="space-y-2">
      <label className={`block text-xs md:text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
        {label}
      </label>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className={`w-full h-3 rounded-lg appearance-none cursor-pointer ${sliderThumbClass} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0`}
      />
      <div className={`text-center text-xs md:text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
        {value.toFixed(step < 1 ? 1 : 0)}
      </div>
    </div>
  );
};

interface PropControlProps {
  prop: PropDefinition;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  isDark: boolean;
}

const PropControl: React.FC<PropControlProps> = ({ prop, value, onChange, isDark }) => {
  const inputId = `prop-${prop.name}`;
  
  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className={`block text-xs md:text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>
        {prop.description}
        {' '}
        <span className={`ml-2 text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>
          ({prop.type})
        </span>
      </label>
      
      {prop.control === 'number' && (
        <NumberControl
          inputId={inputId}
          prop={prop}
          value={value}
          onChange={onChange}
          isDark={isDark}
        />
      )}

      {prop.control === 'select' && (
        <SelectControl
          inputId={inputId}
          prop={prop}
          value={value}
          onChange={onChange}
          isDark={isDark}
        />
      )}
    </div>
  );
};

interface NumberControlProps {
  inputId: string;
  prop: PropDefinition;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  isDark: boolean;
}

const NumberControl: React.FC<NumberControlProps> = ({ inputId, prop, value, onChange, isDark }) => {
  const sliderThumbClass = isDark 
    ? 'bg-white/10 [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:bg-white' 
    : 'bg-black/10 [&::-webkit-slider-thumb]:bg-black [&::-moz-range-thumb]:bg-black';

  const numericValue = typeof value === 'number' ? value : (prop.default ?? 0);

  return (
    <div className="space-y-3">
      <input
        id={inputId}
        type="range"
        value={numericValue}
        onChange={(e) => onChange(prop.name, Number(e.target.value))}
        min={prop.min ?? 0}
        max={prop.max ?? 100}
        step={prop.step ?? 1}
        className={`w-full h-3 rounded-lg appearance-none cursor-pointer ${sliderThumbClass} [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0`}
      />
      <div className={`text-center text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
        {numericValue}
      </div>
    </div>
  );
};

interface SelectControlProps {
  inputId: string;
  prop: PropDefinition;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  isDark: boolean;
}

const SelectControl: React.FC<SelectControlProps> = ({ inputId, prop, value, onChange, isDark }) => {
  const selectClass = isDark
    ? 'bg-white/5 border-white/10 text-white'
    : 'bg-white border-black/10 text-black';

  const stringValue = typeof value === 'string' ? value : (prop.default ?? '');

  return (
    <select
      id={inputId}
      value={stringValue}
      onChange={(e) => onChange(prop.name, e.target.value)}
      className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-lg border text-xs md:text-sm ${selectClass}`}
    >
      {prop.options?.map((opt: string) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
};

export default UIComponentViewer;
