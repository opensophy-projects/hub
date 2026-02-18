import React, { useState, useCallback, Suspense, useEffect, useMemo } from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { X, Maximize2, RotateCcw, Settings, Sliders } from 'lucide-react';
import { loadComponent, getDefaultProps } from './loader';
import { ComponentWrapper } from './ComponentWrapper';
import type { UniversalProps, ComponentConfig, PropDefinition } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

type PropValue = string | number | boolean | string[] | undefined;
type ComponentPropsMap = Record<string, PropValue>;
type AnyComponent = React.ComponentType<Record<string, PropValue>>;
type TabType = 'universal' | 'specific';

interface LoadedComponentData {
  config: ComponentConfig;
  Component: AnyComponent;
  fileContents: Record<string, string>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_UNIVERSAL_PROPS: UniversalProps = {
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
};

// ─── Shared UI Helpers ────────────────────────────────────────────────────────

const cx = (...classes: (string | false | undefined)[]) =>
  classes.filter(Boolean).join(' ');

const themeClass = (isDark: boolean, dark: string, light: string) =>
  isDark ? dark : light;

const SLIDER_THUMB = (isDark: boolean) =>
  cx(
    isDark
      ? 'bg-white/10 [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:bg-white'
      : 'bg-black/10 [&::-webkit-slider-thumb]:bg-black [&::-moz-range-thumb]:bg-black',
    'w-full h-3 rounded-lg appearance-none cursor-pointer',
    '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full',
    '[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0',
  );

// ─── SliderControl ────────────────────────────────────────────────────────────

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  isDark: boolean;
}

const SliderControl: React.FC<SliderControlProps> = ({ label, value, onChange, min, max, step, isDark }) => (
  <div className="space-y-2">
    <label className={`block text-xs md:text-sm font-medium ${themeClass(isDark, 'text-white', 'text-black')}`}>
      {label}
    </label>
    <input
      type="range"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      step={step}
      className={SLIDER_THUMB(isDark)}
    />
    <div className={`text-center text-xs md:text-sm font-semibold ${themeClass(isDark, 'text-white', 'text-black')}`}>
      {value.toFixed(step < 1 ? 1 : 0)}
    </div>
  </div>
);

// ─── NumberControl ────────────────────────────────────────────────────────────

interface NumberControlProps {
  inputId: string;
  prop: PropDefinition;
  value: PropValue;
  onChange: (name: string, value: PropValue) => void;
  isDark: boolean;
}

const NumberControl: React.FC<NumberControlProps> = ({ inputId, prop, value, onChange, isDark }) => {
  const numericValue = typeof value === 'number' ? value : (prop.default as number ?? 0);

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
        className={SLIDER_THUMB(isDark)}
      />
      <div className={`text-center text-lg font-semibold ${themeClass(isDark, 'text-white', 'text-black')}`}>
        {numericValue}
      </div>
    </div>
  );
};

// ─── SelectControl ────────────────────────────────────────────────────────────

interface SelectControlProps {
  inputId: string;
  prop: PropDefinition;
  value: PropValue;
  onChange: (name: string, value: PropValue) => void;
  isDark: boolean;
}

const SelectControl: React.FC<SelectControlProps> = ({ inputId, prop, value, onChange, isDark }) => {
  const stringValue = typeof value === 'string' ? value : (prop.default as string ?? '');

  return (
    <select
      id={inputId}
      value={stringValue}
      onChange={(e) => onChange(prop.name, e.target.value)}
      className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-lg border text-xs md:text-sm ${
        themeClass(isDark, 'bg-white/5 border-white/10 text-white', 'bg-white border-black/10 text-black')
      }`}
    >
      {prop.options?.map((opt: string) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
};

// ─── PropControl ──────────────────────────────────────────────────────────────

interface PropControlProps {
  prop: PropDefinition;
  value: PropValue;
  onChange: (name: string, value: PropValue) => void;
  isDark: boolean;
}

const PropControl: React.FC<PropControlProps> = ({ prop, value, onChange, isDark }) => {
  const inputId = `prop-${prop.name}`;

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className={`block text-xs md:text-sm font-medium ${themeClass(isDark, 'text-white', 'text-black')}`}>
        {prop.description}
        <span className={`ml-2 text-xs ${themeClass(isDark, 'text-white/50', 'text-black/50')}`}>
          ({prop.type})
        </span>
      </label>

      {prop.control === 'number' && (
        <NumberControl inputId={inputId} prop={prop} value={value} onChange={onChange} isDark={isDark} />
      )}
      {prop.control === 'select' && (
        <SelectControl inputId={inputId} prop={prop} value={value} onChange={onChange} isDark={isDark} />
      )}
    </div>
  );
};

// ─── UniversalPropsEditor ─────────────────────────────────────────────────────

interface UniversalPropsEditorProps {
  universalProps: UniversalProps;
  onChange: (name: keyof UniversalProps, value: PropValue) => void;
  isDark: boolean;
}

const UNIVERSAL_SLIDERS: Array<{
  label: string;
  key: keyof UniversalProps;
  min: number;
  max: number;
  step: number;
  default: number;
}> = [
  { label: 'Масштаб',           key: 'scale',          min: 0.1, max: 3,   step: 0.1, default: 1 },
  { label: 'Прозрачность',      key: 'opacity',        min: 0,   max: 1,   step: 0.1, default: 1 },
  { label: 'Вращение X',        key: 'rotateX',        min: -180, max: 180, step: 5,  default: 0 },
  { label: 'Вращение Y',        key: 'rotateY',        min: -180, max: 180, step: 5,  default: 0 },
  { label: 'Вращение Z',        key: 'rotateZ',        min: -180, max: 180, step: 5,  default: 0 },
  { label: 'Скорость анимации', key: 'animationSpeed', min: 0.1, max: 5,   step: 0.1, default: 1 },
  { label: 'Размытие',          key: 'blur',           min: 0,   max: 20,  step: 1,   default: 0 },
  { label: 'Яркость',           key: 'brightness',     min: 0,   max: 2,   step: 0.1, default: 1 },
  { label: 'Контраст',          key: 'contrast',       min: 0,   max: 2,   step: 0.1, default: 1 },
  { label: 'Насыщенность',      key: 'saturate',       min: 0,   max: 2,   step: 0.1, default: 1 },
];

const UniversalPropsEditor: React.FC<UniversalPropsEditorProps> = ({ universalProps, onChange, isDark }) => (
  <div className="space-y-4 md:space-y-6">
    <h3 className={`text-base md:text-lg font-bold ${themeClass(isDark, 'text-white', 'text-black')}`}>
      Общие настройки компонента
    </h3>

    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={universalProps.enableUniversalProps}
        onChange={(e) => onChange('enableUniversalProps', e.target.checked)}
        className="rounded"
      />
      <span className={`text-xs md:text-sm font-medium ${themeClass(isDark, 'text-white', 'text-black')}`}>
        Включить общие настройки
      </span>
    </label>

    {universalProps.enableUniversalProps && UNIVERSAL_SLIDERS.map(({ label, key, min, max, step, default: def }) => (
      <SliderControl
        key={key}
        label={label}
        value={(universalProps[key] as number) || def}
        onChange={(v) => onChange(key, v)}
        min={min}
        max={max}
        step={step}
        isDark={isDark}
      />
    ))}
  </div>
);

// ─── ComponentPropsEditor ─────────────────────────────────────────────────────

interface ComponentPropsEditorProps {
  config: ComponentConfig;
  componentProps: ComponentPropsMap;
  onChange: (name: string, value: PropValue) => void;
  isDark: boolean;
}

const ComponentPropsEditor: React.FC<ComponentPropsEditorProps> = ({ config, componentProps, onChange, isDark }) => {
  const visibleProps = useMemo(() => {
    if (config.specificProps?.length) {
      return config.props.filter((p: PropDefinition) => config.specificProps!.includes(p.name));
    }
    return config.props;
  }, [config]);

  return (
    <div className="space-y-4 md:space-y-6">
      <h3 className={`text-base md:text-lg font-bold ${themeClass(isDark, 'text-white', 'text-black')}`}>
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
        <p className={`text-xs md:text-sm ${themeClass(isDark, 'text-white/50', 'text-black/50')}`}>
          Для этого компонента нет специфических настроек
        </p>
      )}
    </div>
  );
};

// ─── TabButtons ───────────────────────────────────────────────────────────────

interface TabButtonsProps {
  activeTab: TabType;
  isDark: boolean;
  onTabChange: (tab: TabType) => void;
}

const TabButtons: React.FC<TabButtonsProps> = ({ activeTab, isDark, onTabChange }) => {
  const tabClass = (tab: TabType) => cx(
    'flex-1 px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-medium transition-colors flex items-center justify-center gap-1 md:gap-2',
    activeTab === tab
      ? themeClass(isDark, 'bg-white/10 text-white', 'bg-black/10 text-black')
      : themeClass(isDark, 'text-white/60 hover:bg-white/5', 'text-black/60 hover:bg-black/5'),
  );

  return (
    <div className={`flex border-b sticky top-0 z-10 bg-inherit ${themeClass(isDark, 'border-white/10', 'border-black/10')}`}>
      <button onClick={() => onTabChange('universal')} className={tabClass('universal')}>
        <Sliders size={14} className="md:w-4 md:h-4" />
        <span className="hidden sm:inline">Общие</span>
      </button>
      <button onClick={() => onTabChange('specific')} className={tabClass('specific')}>
        <Settings size={14} className="md:w-4 md:h-4" />
        <span className="hidden sm:inline">Специфические</span>
      </button>
    </div>
  );
};

// ─── ComponentPreview (shared render) ────────────────────────────────────────

interface ComponentRenderProps {
  Component: AnyComponent;
  componentProps: ComponentPropsMap;
  universalProps: UniversalProps;
  refreshKey: number;
  isDark: boolean;
}

const ComponentRender: React.FC<ComponentRenderProps> = ({ Component, componentProps, universalProps, refreshKey, isDark }) => (
  <ComponentWrapper {...universalProps} className="w-full h-full">
    <Suspense fallback={<div className={themeClass(isDark, 'text-white/50', 'text-black/50')}>Загрузка...</div>}>
      <Component key={refreshKey} {...componentProps} />
    </Suspense>
  </ComponentWrapper>
);

// ─── ModalHeader ──────────────────────────────────────────────────────────────

interface ModalHeaderProps {
  config: ComponentConfig;
  isDark: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onReset: () => void;
  headerBgClass: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ config, isDark, onClose, onRefresh, onReset, headerBgClass }) => {
  const iconBtnClass = cx(
    'rounded-lg transition-colors',
    themeClass(isDark, 'hover:bg-white/10 text-white/70', 'hover:bg-black/10 text-black/70'),
  );

  return (
    <div className={`flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b gap-2 flex-wrap ${headerBgClass}`}>
      <h2 className={`text-xs md:text-sm font-bold truncate ${themeClass(isDark, 'text-white', 'text-black')}`}>
        {config.name} — Настройки
      </h2>
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        <button onClick={onRefresh} className={`p-1.5 md:p-2 ${iconBtnClass}`} title="Обновить">
          <RotateCcw size={16} className="md:w-[18px] md:h-[18px]" />
        </button>
        <button
          onClick={onReset}
          className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
            themeClass(isDark, 'bg-white/10 hover:bg-white/20 text-white', 'bg-black/10 hover:bg-black/20 text-black')
          }`}
        >
          Сбросить
        </button>
        <button onClick={onClose} className={`p-1.5 md:p-2 ${iconBtnClass}`} aria-label="Закрыть">
          <X size={16} className="md:w-5 md:h-5" />
        </button>
      </div>
    </div>
  );
};

// ─── PreviewMode ──────────────────────────────────────────────────────────────

interface PreviewModeProps extends ComponentRenderProps {
  config: ComponentConfig;
  onRefresh: () => void;
  onFullscreen: () => void;
  onOpenSettings: () => void;
}

const PreviewMode: React.FC<PreviewModeProps> = ({
  config, Component, componentProps, universalProps, refreshKey, isDark,
  onRefresh, onFullscreen, onOpenSettings,
}) => {
  const btnClass = cx(
    'px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border border-transparent',
    themeClass(isDark, 'text-white/70 hover:text-white hover:bg-white/5', 'text-black/70 hover:text-black hover:bg-black/5'),
  );

  return (
    <div className={`rounded-lg border overflow-hidden my-6 ${themeClass(isDark, 'border-white/10 bg-[#0a0a0a]', 'border-black/10 bg-[#E8E7E3]')}`}>
      <div className={`flex items-center justify-between px-3 py-2 border-b ${themeClass(isDark, 'border-white/10 bg-white/5', 'border-black/10 bg-black/5')}`}>
        <h3 className={`text-sm font-bold ${themeClass(isDark, 'text-white', 'text-black')}`}>
          {config.name}
        </h3>
        <div className="flex gap-2">
          <button onClick={onRefresh} className={btnClass} title="Запустить анимацию заново"><RotateCcw size={18} /></button>
          <button onClick={onFullscreen} className={btnClass} title="Открыть на весь экран"><Maximize2 size={18} /></button>
          <button onClick={onOpenSettings} className={btnClass} title="Управление настройками"><Settings size={18} /></button>
        </div>
      </div>

      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <ComponentRender
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

// ─── SettingsModal ────────────────────────────────────────────────────────────

interface SettingsModalProps extends ComponentRenderProps {
  config: ComponentConfig;
  onClose: () => void;
  onPropChange: (name: string, value: PropValue) => void;
  onUniversalPropChange: (name: keyof UniversalProps, value: PropValue) => void;
  onRefresh: () => void;
  onReset: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const { isDark, onClose } = props;
  const [activeTab, setActiveTab] = useState<TabType>('universal');

  const modalBgClass = themeClass(isDark, 'border-white/10 bg-[#0a0a0a]', 'border-black/10 bg-white');
  const headerBgClass = themeClass(isDark, 'border-white/10 bg-white/5', 'border-black/10 bg-black/5');
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Закрыть" />

      <div className={`relative w-full max-w-2xl md:max-w-6xl h-[85vh] rounded-xl border shadow-2xl flex flex-col overflow-hidden ${modalBgClass}`}>
        <ModalHeader
          config={props.config}
          isDark={isDark}
          onClose={onClose}
          onRefresh={props.onRefresh}
          onReset={props.onReset}
          headerBgClass={headerBgClass}
        />

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 overflow-auto border-b md:border-b-0 md:border-r flex flex-col" style={{ borderColor }}>
            <TabButtons activeTab={activeTab} isDark={isDark} onTabChange={setActiveTab} />

            <div className="flex-1 overflow-auto p-4 md:p-6">
              {activeTab === 'universal' ? (
                <UniversalPropsEditor
                  universalProps={props.universalProps}
                  onChange={props.onUniversalPropChange}
                  isDark={isDark}
                />
              ) : (
                <ComponentPropsEditor
                  config={props.config}
                  componentProps={props.componentProps}
                  onChange={props.onPropChange}
                  isDark={isDark}
                />
              )}
            </div>
          </div>

          <div className={`hidden md:flex w-full md:w-1/2 overflow-auto p-6 md:p-8 items-center justify-center ${themeClass(isDark, 'bg-black/20', 'bg-gray-50')}`}>
            <ComponentRender
              Component={props.Component}
              componentProps={props.componentProps}
              universalProps={props.universalProps}
              refreshKey={props.refreshKey}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── FullscreenModal ──────────────────────────────────────────────────────────

interface FullscreenModalProps extends ComponentRenderProps {
  onClose: () => void;
}

const FullscreenModal: React.FC<FullscreenModalProps> = ({ Component, componentProps, universalProps, refreshKey, isDark, onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <button className="absolute inset-0" onClick={onClose} aria-label="Закрыть полноэкранный режим" />
    <div className={`relative w-full max-w-6xl h-[90vh] rounded-xl border shadow-2xl overflow-auto ${themeClass(isDark, 'border-white/10 bg-[#0a0a0a]', 'border-black/10 bg-white')}`}>
      <button
        onClick={onClose}
        className={`absolute top-4 right-4 p-2 rounded-lg z-10 ${themeClass(isDark, 'bg-black/50 hover:bg-black/70 text-white', 'bg-white/50 hover:bg-white/70 text-black')}`}
        aria-label="Закрыть"
      >
        <X size={20} />
      </button>
      <div className="p-12 flex items-center justify-center min-h-full">
        <ComponentRender
          Component={Component}
          componentProps={componentProps}
          universalProps={universalProps}
          refreshKey={refreshKey}
          isDark={isDark}
        />
      </div>
    </div>
  </div>
);

// ─── UIComponentViewer (root) ─────────────────────────────────────────────────

interface UIComponentViewerProps {
  componentId: string;
}

const UIComponentViewer: React.FC<UIComponentViewerProps> = ({ componentId }) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [componentProps, setComponentProps] = useState<ComponentPropsMap>({});
  const [universalProps, setUniversalProps] = useState<UniversalProps>(DEFAULT_UNIVERSAL_PROPS);
  const [componentData, setComponentData] = useState<LoadedComponentData | null>(null);

  useEffect(() => {
    loadComponent(componentId).then((data) => {
      if (data) {
        setComponentData(data);
        setComponentProps(getDefaultProps(data.config));
      }
    });
  }, [componentId]);

  const handleRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handlePropChange = useCallback((name: string, value: PropValue) => {
    setComponentProps((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleUniversalPropChange = useCallback((name: keyof UniversalProps, value: PropValue) => {
    setUniversalProps((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleResetProps = useCallback(() => {
    if (!componentData) return;
    setComponentProps(getDefaultProps(componentData.config));
    setUniversalProps(DEFAULT_UNIVERSAL_PROPS);
    setRefreshKey((k) => k + 1);
  }, [componentData]);

  if (!componentData) {
    return (
      <button
        disabled
        className={`px-4 py-2 rounded-lg font-medium my-6 ${themeClass(isDark, 'bg-white/10 text-white/50', 'bg-black/10 text-black/50')}`}
      >
        Загрузка компонента...
      </button>
    );
  }

  const sharedProps = {
    Component: componentData.Component,
    componentProps,
    universalProps,
    refreshKey,
    isDark,
  };

  return (
    <>
      {isOpen ? (
        <SettingsModal
          {...sharedProps}
          config={componentData.config}
          onClose={() => setIsOpen(false)}
          onPropChange={handlePropChange}
          onUniversalPropChange={handleUniversalPropChange}
          onRefresh={handleRefresh}
          onReset={handleResetProps}
        />
      ) : (
        <PreviewMode
          {...sharedProps}
          config={componentData.config}
          onRefresh={handleRefresh}
          onFullscreen={() => setIsFullscreen(true)}
          onOpenSettings={() => setIsOpen(true)}
        />
      )}

      {isFullscreen && (
        <FullscreenModal {...sharedProps} onClose={() => setIsFullscreen(false)} />
      )}
    </>
  );
};

export default UIComponentViewer;
