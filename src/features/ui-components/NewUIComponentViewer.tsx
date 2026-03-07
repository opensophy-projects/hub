import React, {
  useState,
  useCallback,
  Suspense,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { X, Maximize2, RotateCcw, Settings } from 'lucide-react';
import { loadComponent, getDefaultProps } from './loader';
import { ComponentWrapper } from './ComponentWrapper';
import type { UniversalProps, ComponentConfig, PropDefinition } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

type PropValue = string | number | boolean | string[] | undefined;
type ComponentPropsMap = Record<string, PropValue>;
type AnyComponent = React.ComponentType<Record<string, PropValue>>;
type TabType = 'universal' | 'specific';

interface LoadedComponentData {
  config: ComponentConfig;
  Component: AnyComponent;
  fileContents: Record<string, string>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const UNIVERSAL_FIELDS: Array<{
  label: string;
  key: keyof UniversalProps;
  min: number;
  max: number;
  step: number;
  default: number;
}> = [
  { label: 'Масштаб',      key: 'scale',      min: 0.1,  max: 3,    step: 0.05, default: 1 },
  { label: 'Вращение X',   key: 'rotateX',    min: -180, max: 180,  step: 1,    default: 0 },
  { label: 'Яркость',      key: 'brightness', min: 0,    max: 2,    step: 0.05, default: 1 },
  { label: 'Прозрачность', key: 'opacity',    min: 0,    max: 1,    step: 0.05, default: 1 },
  { label: 'Вращение Y',   key: 'rotateY',    min: -180, max: 180,  step: 1,    default: 0 },
  { label: 'Контраст',     key: 'contrast',   min: 0,    max: 2,    step: 0.05, default: 1 },
  { label: 'Размытие',     key: 'blur',       min: 0,    max: 20,   step: 0.5,  default: 0 },
  { label: 'Вращение Z',   key: 'rotateZ',    min: -180, max: 180,  step: 1,    default: 0 },
  { label: 'Насыщенность', key: 'saturate',   min: 0,    max: 2,    step: 0.05, default: 1 },
];

// ─── Theme helpers ────────────────────────────────────────────────────────────

const tc = (isDark: boolean, d: string, l: string) => (isDark ? d : l);

// ─── Responsive grid columns helper ──────────────────────────────────────────

const useIsMobile = () => {
  // FIX S7735/S7741/S7764: use direct undefined comparison; positive condition
  const [isMobile, setIsMobile] = useState(() =>
    globalThis.window !== undefined ? globalThis.window.innerWidth < 640 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(globalThis.window.innerWidth < 640);
    globalThis.window.addEventListener('resize', handler);
    return () => globalThis.window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

// ─── NumberInput ──────────────────────────────────────────────────────────────

interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  isDark: boolean;
}

const getDecimalPlaces = (step: number): number => {
  if (step >= 1)   return 0;
  if (step >= 0.1) return 1;
  return 2;
};

const NumberInput: React.FC<NumberInputProps> = ({
  value, onChange, min, max, step, isDark,
}) => {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw]         = useState('');
  const inputRef              = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setRaw(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    const n = Number.parseFloat(raw);
    if (!Number.isNaN(n)) {
      onChange(Math.min(max, Math.max(min, n)));
    }
    setEditing(false);
  };

  const border = tc(isDark, 'rgba(255,255,255,0.14)', 'rgba(0,0,0,0.14)');
  const bg     = tc(isDark, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.06)');
  const fg     = tc(isDark, '#fff', '#000');

  const decimals = getDecimalPlaces(step);
  const numStr   = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commit();
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          flex: 1,
          accentColor: tc(isDark, '#fff', '#000'),
          cursor: 'pointer',
          height: 4,
          minWidth: 0,
        }}
      />
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          value={raw}
          min={min} max={max} step={step}
          onChange={e => setRaw(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          style={{
            width: 54, padding: '2px 5px', borderRadius: 6,
            border: `1px solid ${border}`, background: bg, color: fg,
            fontSize: 11, textAlign: 'center', outline: 'none',
            fontFamily: 'ui-monospace, monospace', flexShrink: 0,
          }}
        />
      ) : (
        <button
          onClick={startEdit}
          title={`Мин: ${min}  Макс: ${max}`}
          style={{
            width: 54, padding: '2px 5px', borderRadius: 6,
            border: `1px solid ${border}`, background: bg, color: fg,
            fontSize: 11, textAlign: 'center', cursor: 'pointer',
            fontFamily: 'ui-monospace, monospace', flexShrink: 0,
          }}
        >
          {numStr}
        </button>
      )}
    </div>
  );
};

// ─── Universal 3-column grid ──────────────────────────────────────────────────

interface UniversalGridProps {
  universalProps: UniversalProps;
  onChange: (key: keyof UniversalProps, v: PropValue) => void;
  isDark: boolean;
}

const UniversalGrid: React.FC<UniversalGridProps> = ({ universalProps, onChange, isDark }) => {
  const isMobile    = useIsMobile();
  const borderColor = tc(isDark, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.07)');
  const cellBg      = tc(isDark, 'rgba(255,255,255,0.025)', 'rgba(0,0,0,0.02)');
  const labelColor  = tc(isDark, 'rgba(255,255,255,0.45)', 'rgba(0,0,0,0.45)');
  const cols        = isMobile ? 1 : 3;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 1,
      background: borderColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      {UNIVERSAL_FIELDS.map(f => (
        <div
          key={f.key}
          style={{ background: cellBg, padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: 5 }}
        >
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: labelColor,
          }}>
            {f.label}
          </span>
          <NumberInput
            value={(universalProps[f.key] as number) ?? f.default}
            onChange={v => onChange(f.key, v)}
            min={f.min} max={f.max} step={f.step}
            isDark={isDark}
          />
        </div>
      ))}
    </div>
  );
};

// ─── AiSelect — portal-based dropdown (never clipped by scroll containers) ────

interface DropdownPortalProps {
  anchorRect: DOMRect;
  dropUp: boolean;
  maxHeight: number;
  isDark: boolean;
  children: React.ReactNode;
  width: number;
  portalRef: React.RefObject<HTMLDivElement>;
}

const DropdownPortal: React.FC<DropdownPortalProps> = ({
  anchorRect, dropUp, maxHeight, isDark, children, width, portalRef,
}) => {
  const style: React.CSSProperties = {
    position: 'fixed',
    left: anchorRect.left,
    width,
    zIndex: 99999,
    background: tc(isDark, '#0a0a0a', '#E8E7E3'),
    border: `1px solid ${tc(isDark, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)')}`,
    borderRadius: 10,
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.7)' : '0 8px 32px rgba(0,0,0,0.12)',
    overflow: 'auto',
    maxHeight,
    animation: 'aiSelectIn 0.13s ease',
    ...(dropUp
      ? { bottom: globalThis.window.innerHeight - anchorRect.top + 4 }
      : { top: anchorRect.bottom + 4 }),
  };

  return createPortal(
    <>
      <style>{`@keyframes aiSelectIn{from{opacity:0;transform:translateY(-4px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      <div ref={portalRef} style={style}>{children}</div>
    </>,
    document.body,
  );
};

interface AiSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  isDark: boolean;
}

const AiSelect: React.FC<AiSelectProps> = ({ label, value, options, onChange, isDark }) => {
  const [open, setOpen]             = useState(false);
  const [hov, setHov]               = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [dropUp, setDropUp]         = useState(false);
  const [dropWidth, setDropWidth]   = useState(0);
  const ref                         = useRef<HTMLDivElement>(null);
  const btnRef                      = useRef<HTMLButtonElement>(null);
  const portalRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!ref.current?.contains(target) && !portalRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', h, { capture: false });
    return () => document.removeEventListener('mousedown', h, { capture: false } as EventListenerOptions);
  }, [open]);

  const computeDropUp = (rect: DOMRect) => {
    const dropdownHeight = Math.min(options.length * 34 + 48, 240);
    return globalThis.window.innerHeight - rect.bottom < dropdownHeight && rect.top > dropdownHeight;
  };

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const update = () => {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      setAnchorRect(rect);
      setDropWidth(rect.width);
      setDropUp(computeDropUp(rect));
    };
    update();
    globalThis.window.addEventListener('scroll', update, true);
    globalThis.window.addEventListener('resize', update);
    return () => {
      globalThis.window.removeEventListener('scroll', update, true);
      globalThis.window.removeEventListener('resize', update);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, options.length]);

  const handleToggle = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setAnchorRect(rect);
    setDropWidth(rect.width);
    setDropUp(computeDropUp(rect));
    setOpen(v => !v);
  };

  const textColor   = tc(isDark, 'rgba(255,255,255,0.85)', 'rgba(0,0,0,0.85)');
  const labelClr    = tc(isDark, 'rgba(255,255,255,0.3)',  'rgba(0,0,0,0.35)');
  const btnBg       = tc(isDark, '#1a1a1a', '#d4d3cf');
  const border      = tc(isDark, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)');
  const rowHov      = tc(isDark, 'rgba(255,255,255,0.06)', 'rgba(0,0,0,0.06)');
  const cellBg      = tc(isDark, 'rgba(255,255,255,0.025)', 'rgba(0,0,0,0.02)');
  const borderColor = tc(isDark, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.07)');
  const labelColor  = tc(isDark, 'rgba(255,255,255,0.45)', 'rgba(0,0,0,0.45)');
  const activeOptBg = tc(isDark, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.08)');

  const getOptionBg = (opt: string) => {
    if (hov === opt)    return rowHov;
    if (opt === value)  return activeOptBg;
    return 'transparent';
  };

  return (
    <div style={{ background: cellBg, border: `1px solid ${borderColor}`, borderRadius: 10, padding: '9px 11px' }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: labelColor, display: 'block', marginBottom: 5 }}>
        {label}
      </span>
      <div ref={ref} style={{ position: 'relative' }}>
        <button
          ref={btnRef}
          onClick={handleToggle}
          style={{
            width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '5px 9px', borderRadius: 7, border: `1px solid ${border}`,
            background: btnBg, color: textColor, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <span>{value}</span>
          <svg width="9" height="9" viewBox="0 0 10 10" style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M2 3 L5 7 L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
        </button>

        {open && anchorRect && (
          <DropdownPortal
            anchorRect={anchorRect}
            dropUp={dropUp}
            maxHeight={240}
            isDark={isDark}
            width={dropWidth}
            portalRef={portalRef}
          >
            <div style={{ padding: '7px 11px 3px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: labelClr }}>
              Выбери вариант
            </div>
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                onMouseEnter={() => setHov(opt)}
                onMouseLeave={() => setHov(null)}
                style={{
                  display: 'flex', alignItems: 'center', width: '100%',
                  padding: '5px 11px', fontSize: 12, textAlign: 'left', cursor: 'pointer',
                  border: 'none', color: textColor,
                  background: getOptionBg(opt),
                }}
              >
                {opt === value && <span style={{ marginRight: 6, opacity: 0.6 }}>✓</span>}
                {opt}
              </button>
            ))}
          </DropdownPortal>
        )}
      </div>
    </div>
  );
};

// ─── Specific props grid ──────────────────────────────────────────────────────

interface SpecificGridProps {
  config: ComponentConfig;
  componentProps: ComponentPropsMap;
  onChange: (name: string, v: PropValue) => void;
  isDark: boolean;
}

const SpecificGrid: React.FC<SpecificGridProps> = ({ config, componentProps, onChange, isDark }) => {
  const borderColor = tc(isDark, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.07)');
  const cellBg      = tc(isDark, 'rgba(255,255,255,0.025)', 'rgba(0,0,0,0.02)');
  const labelColor  = tc(isDark, 'rgba(255,255,255,0.45)', 'rgba(0,0,0,0.45)');
  const border      = tc(isDark, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)');
  const textColor   = tc(isDark, 'rgba(255,255,255,0.85)', 'rgba(0,0,0,0.85)');
  const inputBg     = tc(isDark, '#1a1a1a', '#d4d3cf');

  const visibleProps = useMemo(() => {
    if (config.specificProps?.length) {
      return config.props.filter((p: PropDefinition) => config.specificProps!.includes(p.name));
    }
    return config.props;
  }, [config]);

  if (!visibleProps.length) {
    return (
      <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: labelColor }}>
        Нет специфических настроек
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 1,
      background: borderColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 10,
      overflow: 'visible',
    }}>
      {visibleProps.map((prop: PropDefinition) => {
        const val = componentProps[prop.name];

        if (prop.control === 'select') {
          const strVal = typeof val === 'string' ? val : (prop.default as string ?? '');
          return (
            <AiSelect
              key={prop.name}
              label={prop.description}
              value={strVal}
              options={prop.options ?? []}
              onChange={v => onChange(prop.name, v)}
              isDark={isDark}
            />
          );
        }

        if (prop.control === 'number') {
          const numVal = typeof val === 'number' ? val : (prop.default as number ?? 0);
          return (
            <div
              key={prop.name}
              style={{ background: cellBg, padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: 5 }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: labelColor }}>
                {prop.description}
              </span>
              <NumberInput
                value={numVal}
                onChange={v => onChange(prop.name, v)}
                min={prop.min ?? 0}
                max={prop.max ?? 100}
                step={prop.step ?? 1}
                isDark={isDark}
              />
            </div>
          );
        }

        const strVal = typeof val === 'string' ? val : (prop.default as string ?? '');
        return (
          <div
            key={prop.name}
            style={{ background: cellBg, padding: '9px 11px', display: 'flex', flexDirection: 'column', gap: 5 }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: labelColor }}>
              {prop.description}
            </span>
            <input
              type="text"
              value={strVal}
              onChange={e => onChange(prop.name, e.target.value)}
              style={{
                width: '100%', padding: '4px 7px', borderRadius: 6,
                border: `1px solid ${border}`, background: inputBg,
                color: textColor, fontSize: 12, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// ─── Tab bar ──────────────────────────────────────────────────────────────────

interface TabBarProps {
  active: TabType;
  onSelect: (t: TabType) => void;
  isDark: boolean;
}

const TabBar: React.FC<TabBarProps> = ({ active, onSelect, isDark }) => {
  const border = tc(isDark, 'rgba(255,255,255,0.09)', 'rgba(0,0,0,0.09)');
  const bg     = tc(isDark, 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.02)');

  return (
    <div style={{
      display: 'flex', gap: 4, padding: '7px 11px',
      borderBottom: `1px solid ${border}`, background: bg,
      flexWrap: 'wrap',
    }}>
      {(['universal', 'specific'] as TabType[]).map(tab => {
        const isActive = active === tab;
        return (
          <button
            key={tab}
            onClick={() => onSelect(tab)}
            style={{
              padding: '5px 13px', borderRadius: 8,
              border: `1px solid ${isActive ? tc(isDark,'rgba(255,255,255,0.14)','rgba(0,0,0,0.14)') : 'transparent'}`,
              background: isActive ? tc(isDark,'rgba(255,255,255,0.09)','rgba(0,0,0,0.09)') : 'transparent',
              color: isActive ? tc(isDark,'#fff','#000') : tc(isDark,'rgba(255,255,255,0.5)','rgba(0,0,0,0.5)'),
              fontSize: 12, fontWeight: isActive ? 600 : 400, cursor: 'pointer', transition: 'all 0.14s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab === 'universal' ? 'Общие настройки компонента' : 'Специфические настройки'}
          </button>
        );
      })}
    </div>
  );
};

// ─── Icon button ──────────────────────────────────────────────────────────────

const IconBtn: React.FC<{
  onClick: () => void;
  title: string;
  isDark: boolean;
  children: React.ReactNode;
  active?: boolean;
}> = ({ onClick, title, isDark, children, active }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 30, height: 30, borderRadius: 7,
      border: active ? `1px solid ${tc(isDark,'rgba(255,255,255,0.2)','rgba(0,0,0,0.2)')}` : 'none',
      background: active ? tc(isDark,'rgba(255,255,255,0.1)','rgba(0,0,0,0.08)') : 'transparent',
      color: active ? tc(isDark,'#fff','#000') : tc(isDark,'rgba(255,255,255,0.55)','rgba(0,0,0,0.55)'),
      cursor: 'pointer', transition: 'all 0.14s', flexShrink: 0,
    }}
    onMouseEnter={e => {
      const b = e.currentTarget as HTMLButtonElement;
      b.style.background = tc(isDark,'rgba(255,255,255,0.08)','rgba(0,0,0,0.07)');
      b.style.color = tc(isDark,'#fff','#000');
    }}
    onMouseLeave={e => {
      const b = e.currentTarget as HTMLButtonElement;
      b.style.background = active ? tc(isDark,'rgba(255,255,255,0.1)','rgba(0,0,0,0.08)') : 'transparent';
      b.style.color = active ? tc(isDark,'#fff','#000') : tc(isDark,'rgba(255,255,255,0.55)','rgba(0,0,0,0.55)');
    }}
  >
    {children}
  </button>
);

// ─── Component render ─────────────────────────────────────────────────────────

interface ComponentRenderProps {
  Component: AnyComponent;
  componentProps: ComponentPropsMap;
  universalProps: UniversalProps;
  refreshKey: number;
  isDark: boolean;
}

const ComponentRender: React.FC<ComponentRenderProps> = ({
  Component, componentProps, universalProps, refreshKey, isDark,
}) => (
  <ComponentWrapper {...universalProps} className="w-full h-full">
    <Suspense fallback={
      <div style={{ color: tc(isDark,'rgba(255,255,255,0.4)','rgba(0,0,0,0.4)'), fontSize: 13 }}>
        Загрузка...
      </div>
    }>
      <Component key={refreshKey} {...componentProps} />
    </Suspense>
  </ComponentWrapper>
);

// ─── Preview panel ────────────────────────────────────────────────────────────

interface PreviewPanelProps extends ComponentRenderProps {
  config: ComponentConfig;
  onRefresh: () => void;
  onFullscreen: () => void;
  onOpenSettings: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  config, Component, componentProps, universalProps, refreshKey, isDark,
  onRefresh, onFullscreen, onOpenSettings,
}) => {
  const border   = tc(isDark, 'rgba(255,255,255,0.09)', 'rgba(0,0,0,0.09)');
  const bg       = tc(isDark, '#0a0a0a', '#E8E7E3');
  const headerBg = tc(isDark, 'rgba(255,255,255,0.025)', 'rgba(0,0,0,0.025)');

  return (
    <div style={{
      borderRadius: 12, border: `1px solid ${border}`, background: bg,
      overflow: 'hidden', margin: '1.5rem 0',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '7px 11px',
        borderBottom: `1px solid ${border}`, background: headerBg, gap: 8,
      }}>
        <div style={{
          fontSize: 13, fontWeight: 600,
          color: tc(isDark,'rgba(255,255,255,0.85)','rgba(0,0,0,0.85)'),
          padding: '3px 9px', borderRadius: 7,
          background: tc(isDark,'rgba(255,255,255,0.06)','rgba(0,0,0,0.06)'),
          border: `1px solid ${border}`, flexShrink: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: 'calc(100% - 120px)',
        }}>
          {config.name}
        </div>
        <div style={{ flex: 1 }} />
        <IconBtn onClick={onRefresh} title="Запустить заново" isDark={isDark}>
          <RotateCcw size={14} />
        </IconBtn>
        <IconBtn onClick={onFullscreen} title="Открыть на весь экран" isDark={isDark}>
          <Maximize2 size={14} />
        </IconBtn>
        <IconBtn onClick={onOpenSettings} title="Настройки" isDark={isDark}>
          <Settings size={14} />
        </IconBtn>
      </div>

      <div style={{
        minHeight: 380, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 32,
      }}>
        <ComponentRender
          Component={Component} componentProps={componentProps}
          universalProps={universalProps} refreshKey={refreshKey} isDark={isDark}
        />
      </div>
    </div>
  );
};

// ─── Settings panel ───────────────────────────────────────────────────────────

interface SettingsPanelProps extends ComponentRenderProps {
  config: ComponentConfig;
  onClose: () => void;
  onPropChange: (name: string, v: PropValue) => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  onRefresh: () => void;
  onReset: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = (props) => {
  const { isDark, config, onClose, onRefresh, onReset } = props;
  const [activeTab, setActiveTab] = useState<TabType>('universal');

  const border   = tc(isDark, 'rgba(255,255,255,0.09)', 'rgba(0,0,0,0.09)');
  const bg       = tc(isDark, '#0a0a0a', '#E8E7E3');
  const footerBg = tc(isDark, 'rgba(255,255,255,0.025)', 'rgba(0,0,0,0.025)');

  return (
    <div style={{
      borderRadius: 12, border: `1px solid ${border}`, background: bg,
      display: 'flex', flexDirection: 'column',
      margin: '1.5rem 0',
      maxHeight: 'calc(100dvh - 3rem)',
      overflow: 'hidden',
    }}>
      <div style={{
        minHeight: 220, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 20,
        borderBottom: `1px solid ${border}`,
      }}>
        <ComponentRender
          Component={props.Component} componentProps={props.componentProps}
          universalProps={props.universalProps} refreshKey={props.refreshKey} isDark={isDark}
        />
      </div>

      <div style={{ flexShrink: 0 }}>
        <TabBar active={activeTab} onSelect={setActiveTab} isDark={isDark} />
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '14px 14px 10px',
        WebkitOverflowScrolling: 'touch',
      }}>
        {activeTab === 'universal' ? (
          <UniversalGrid
            universalProps={props.universalProps}
            onChange={props.onUniversalPropChange}
            isDark={isDark}
          />
        ) : (
          <SpecificGrid
            config={config}
            componentProps={props.componentProps}
            onChange={props.onPropChange}
            isDark={isDark}
          />
        )}
      </div>

      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        borderTop: `1px solid ${border}`, background: footerBg,
      }}>
        <IconBtn onClick={onRefresh} title="Запустить заново" isDark={isDark}>
          <RotateCcw size={13} />
        </IconBtn>
        <button
          onClick={onReset}
          style={{
            padding: '4px 11px', borderRadius: 7,
            border: `1px solid ${border}`,
            background: tc(isDark,'rgba(255,255,255,0.05)','rgba(0,0,0,0.05)'),
            color: tc(isDark,'rgba(255,255,255,0.65)','rgba(0,0,0,0.65)'),
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Сбросить
        </button>
        <div style={{ flex: 1 }} />
        <IconBtn onClick={onClose} title="Закрыть настройки" isDark={isDark}>
          <X size={13} />
        </IconBtn>
      </div>
    </div>
  );
};

// ─── Fullscreen modal ─────────────────────────────────────────────────────────

interface FullscreenModalProps extends ComponentRenderProps {
  onClose: () => void;
}

const FullscreenModal: React.FC<FullscreenModalProps> = ({
  Component, componentProps, universalProps, refreshKey, isDark, onClose,
}) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 60,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
  }}>
    <button
      style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent', cursor: 'default' }}
      onClick={onClose}
      aria-label="Закрыть"
    />
    <div style={{
      position: 'relative', width: '100%', maxWidth: 1024, height: '90vh',
      borderRadius: 16, border: `1px solid ${tc(isDark,'rgba(255,255,255,0.1)','rgba(0,0,0,0.1)')}`,
      background: tc(isDark,'#0a0a0a','#fff'), overflow: 'auto',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 14, right: 14,
          width: 30, height: 30, borderRadius: 7, border: 'none',
          background: tc(isDark,'rgba(255,255,255,0.1)','rgba(0,0,0,0.1)'),
          color: tc(isDark,'#fff','#000'), cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
        }}
      >
        <X size={16} />
      </button>
      <div style={{ padding: 48, width: '100%' }}>
        <ComponentRender
          Component={Component} componentProps={componentProps}
          universalProps={universalProps} refreshKey={refreshKey} isDark={isDark}
        />
      </div>
    </div>
  </div>
);

// ─── Root ─────────────────────────────────────────────────────────────────────

interface UIComponentViewerProps {
  componentId: string;
}

const UIComponentViewer: React.FC<UIComponentViewerProps> = ({ componentId }) => {
  const { isDark } = useTheme();
  const [settingsOpen, setSettingsOpen]     = useState(false);
  const [isFullscreen, setIsFullscreen]     = useState(false);
  const [refreshKey, setRefreshKey]         = useState(0);
  const [componentProps, setComponentProps] = useState<ComponentPropsMap>({});
  const [universalProps, setUniversalProps] = useState<UniversalProps>(DEFAULT_UNIVERSAL_PROPS);
  const [componentData, setComponentData]   = useState<LoadedComponentData | null>(null);

  useEffect(() => {
    loadComponent(componentId).then(data => {
      if (data) {
        setComponentData(data);
        setComponentProps(getDefaultProps(data.config));
      }
    });
  }, [componentId]);

  const handleRefresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const handlePropChange = useCallback((name: string, value: PropValue) => {
    setComponentProps(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleUniversalPropChange = useCallback((key: keyof UniversalProps, value: PropValue) => {
    setUniversalProps(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    if (!componentData) return;
    setComponentProps(getDefaultProps(componentData.config));
    setUniversalProps(DEFAULT_UNIVERSAL_PROPS);
    setRefreshKey(k => k + 1);
  }, [componentData]);

  if (!componentData) {
    return (
      <div style={{
        padding: '18px 24px', borderRadius: 10, margin: '1.5rem 0',
        border: `1px solid ${tc(isDark,'rgba(255,255,255,0.09)','rgba(0,0,0,0.09)')}`,
        color: tc(isDark,'rgba(255,255,255,0.35)','rgba(0,0,0,0.35)'), fontSize: 13,
        textAlign: 'center',
      }}>
        Загрузка компонента…
      </div>
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
      {settingsOpen ? (
        <SettingsPanel
          {...sharedProps}
          config={componentData.config}
          onClose={() => setSettingsOpen(false)}
          onPropChange={handlePropChange}
          onUniversalPropChange={handleUniversalPropChange}
          onRefresh={handleRefresh}
          onReset={handleReset}
        />
      ) : (
        <PreviewPanel
          {...sharedProps}
          config={componentData.config}
          onRefresh={handleRefresh}
          onFullscreen={() => setIsFullscreen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      {isFullscreen && (
        <FullscreenModal {...sharedProps} onClose={() => setIsFullscreen(false)} />
      )}
    </>
  );
};

export default UIComponentViewer;