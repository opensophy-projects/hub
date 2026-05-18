import React, {
  useState, useCallback, Suspense, useEffect, useMemo, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/shared/contexts/ThemeContext';
import {
  X, Play, RefreshCcw, Settings, PanelRight, ChevronDown,
} from 'lucide-react';
import { loadComponent, getDefaultProps } from './loader';
import { ComponentWrapper } from './ComponentWrapper';
import { useIsMobile } from '@/shared/hooks/useBreakpoint';
import type { UniversalProps, ComponentConfig, PropDefinition } from './types';
import { makeTokens, themed } from '@/shared/tokens/theme';

type PropValue = string | number | boolean | string[] | undefined;
type ComponentPropsMap = Record<string, PropValue>;
type AnyComponent = React.ComponentType<Record<string, PropValue>>;
type TabType = 'universal' | 'specific';
type SettingsAction = 'run' | 'reset' | 'source' | 'hide' | 'collapse';

interface LoadedComponentData {
  config: ComponentConfig;
  Component: AnyComponent;
  fileContents: Record<string, string>;
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────

function tk(isDark: boolean) {
  const t = makeTokens(isDark);
  return {
    bg:           t.bg,
    surface:      t.surface,
    surfaceHov:   t.surfaceHov,
    border:       t.border,
    borderStrong: t.borderStrong,
    fg:           t.fg,
    fgMuted:      t.fgMuted,
    fgSub:        t.fgSub,
    accent:       t.accent,
    accentSoft:   t.accentSoft,
    inpBg:        t.inpBg,
    inpBdr:       t.inpBdr,
    inpFoc:       t.inpBdrFocus,
    inpClr:       t.inpClr,
    plhClr:       t.plhClr,
    success:      t.success,
    danger:       t.danger,
    shadow:       t.shadow,
    shadowElevated: t.shadowElevated,
    codeBg: themed(isDark, '#0d0d0e', '#eceae5'),
    codeClr: themed(isDark, '#e2e8f0', '#1e293b'),
    mono: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
  };
}
type T = ReturnType<typeof tk>;

// ─── Settings menu items ──────────────────────────────────────────────────────

const SETTINGS_MENU: Array<{ id: SettingsAction; label: string; icon: React.ReactNode; danger?: boolean }> = [
  { id: 'run',     label: 'Запуск анимации',       icon: <Play size={13} /> },
  { id: 'reset',   label: 'Сбросить настройки',    icon: <RefreshCcw size={13} /> },
  { id: 'source',  label: 'Посмотреть код',         icon: <PanelRight size={13} /> },
  { id: 'hide',    label: 'Скрыть меню настроек',   icon: <Settings size={13} /> },
  { id: 'collapse',label: 'Свернуть меню',          icon: <X size={13} />, danger: true },
];

// ─── Settings dropdown button ─────────────────────────────────────────────────

function SettingsDropdown({
  t,
  onAction,
  sourceVisible,
}: {
  t: T;
  onAction: (action: SettingsAction) => void;
  sourceVisible: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
    setOpen(v => !v);
  };

  const items = SETTINGS_MENU.map(item => ({
    ...item,
    label: item.id === 'source'
      ? (sourceVisible ? 'Скрыть код' : 'Посмотреть код')
      : item.label,
  }));

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        title="Настройки"
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', height: 32, borderRadius: 7,
          border: `1px solid ${open ? t.borderStrong : t.border}`,
          background: open ? t.surfaceHov : 'transparent',
          color: t.fgMuted, cursor: 'pointer', flexShrink: 0,
          fontFamily: t.mono, fontSize: 11,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHov;
          (e.currentTarget as HTMLButtonElement).style.color = t.fg;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = open ? t.surfaceHov : 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted;
        }}
      >
        <Settings size={13} />
        <span>Настройки</span>
        <ChevronDown size={10} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: pos.top,
            right: pos.right,
            minWidth: 220,
            zIndex: 99999,
            background: t.surface,
            border: `1px solid ${t.borderStrong}`,
            borderRadius: 10,
            boxShadow: t.shadow,
            overflow: 'hidden',
            fontFamily: t.mono,
          }}
        >
          {items.map((item, i) => (
            <React.Fragment key={item.id}>
              {i > 0 && item.id === 'collapse' && (
                <div style={{ height: 1, background: t.border, margin: '2px 0' }} />
              )}
              <button
                onClick={() => { onAction(item.id); setOpen(false); }}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  color: item.danger ? t.danger : t.fg,
                  fontSize: 12, cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHov;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <span style={{ color: item.danger ? t.danger : t.fgMuted, display: 'flex', flexShrink: 0 }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

// ─── Universal props ──────────────────────────────────────────────────────────

const DEFAULT_UNIVERSAL_PROPS: UniversalProps = {
  enableUniversalProps: true,
  scale: 1, color: undefined, colorMode: 'original',
  offsetX: 0, offsetY: 0, rotateZ: 0,
  justifyContent: 'center', alignItems: 'center',
  opacity: 1, blur: 0, brightness: 1, contrast: 1, saturate: 1,
};

const FIELD_GROUPS: Array<{
  label: string;
  fields: Array<{ label: string; key: keyof UniversalProps; min: number; max: number; step: number; default: number }>;
}> = [
  { label: 'Трансформация', fields: [
    { label: 'Масштаб',    key: 'scale',   min: 0.1,  max: 3,    step: 0.05, default: 1 },
    { label: 'Смещение X', key: 'offsetX', min: -500, max: 500,  step: 1,    default: 0 },
    { label: 'Смещение Y', key: 'offsetY', min: -500, max: 500,  step: 1,    default: 0 },
    { label: 'Вращение Z', key: 'rotateZ', min: -180, max: 180,  step: 1,    default: 0 },
  ]},
  { label: 'Внешний вид', fields: [
    { label: 'Прозрачность', key: 'opacity',    min: 0, max: 1,  step: 0.05, default: 1 },
    { label: 'Яркость',      key: 'brightness', min: 0, max: 2,  step: 0.05, default: 1 },
    { label: 'Контраст',     key: 'contrast',   min: 0, max: 2,  step: 0.05, default: 1 },
    { label: 'Насыщенность', key: 'saturate',   min: 0, max: 2,  step: 0.05, default: 1 },
    { label: 'Размытие',     key: 'blur',       min: 0, max: 20, step: 0.5,  default: 0 },
  ]},
];

// ─── Number input ─────────────────────────────────────────────────────────────

function getDecimalPlaces(step: number): number {
  if (step >= 1) return 0;
  if (step >= 0.1) return 1;
  return 2;
}

const NumberInput: React.FC<{
  value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; t: T;
}> = ({ value, onChange, min, max, step, t }) => {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const commit = () => {
    const n = Number.parseFloat(raw);
    if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
    setEditing(false);
  };
  const places = getDecimalPlaces(step);
  const numStr = places > 0 ? value.toFixed(places) : String(Math.round(value));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: t.accent, cursor: 'pointer', height: 3, minWidth: 0 }}
      />
      {editing ? (
        <input
          ref={inputRef} type="number" value={raw} min={min} max={max} step={step}
          onChange={e => setRaw(e.target.value)} onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          style={{
            width: 46, padding: '2px 4px', borderRadius: 5,
            border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: t.inpClr,
            fontSize: 11, textAlign: 'center', outline: 'none',
            fontFamily: t.mono, flexShrink: 0,
          }}
        />
      ) : (
        <button
          onClick={() => { setRaw(String(value)); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }}
          style={{
            width: 46, padding: '2px 4px', borderRadius: 5,
            border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: t.inpClr,
            fontSize: 11, textAlign: 'center', cursor: 'pointer',
            fontFamily: t.mono, flexShrink: 0,
          }}
        >
          {numStr}
        </button>
      )}
    </div>
  );
};

// ─── Field row ────────────────────────────────────────────────────────────────

const FieldRow: React.FC<{
  label: string; fieldKey: keyof UniversalProps;
  min: number; max: number; step: number; defaultVal: number;
  universalProps: UniversalProps;
  onChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = ({ label, fieldKey, min, max, step, defaultVal, universalProps, onChange, t }) => {
  const val = (universalProps[fieldKey] as number) ?? defaultVal;
  const isChanged = Math.abs(val - defaultVal) > 0.001;
  return (
    <div style={{ padding: '5px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: isChanged ? t.fg : t.fgMuted, letterSpacing: '0.02em' }}>
          {label}
        </span>
        {isChanged && (
          <button
            onClick={() => onChange(fieldKey, defaultVal)}
            style={{ fontSize: 9, color: t.fgSub, background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
            title="Сбросить"
          >↺</button>
        )}
      </div>
      <NumberInput value={val} onChange={v => onChange(fieldKey, v)} min={min} max={max} step={step} t={t} />
    </div>
  );
};

// ─── Accordion ────────────────────────────────────────────────────────────────

const AccordionSection: React.FC<{
  label: string; defaultOpen?: boolean; t: T; children: React.ReactNode;
}> = ({ label, defaultOpen = true, t, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${t.border}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 12px', background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.fgSub }}>
          {label}
        </span>
        <svg width="9" height="9" viewBox="0 0 10 10" style={{ opacity: 0.35, transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
          <path d="M2 3 L5 7 L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

// ─── Color picker (simplified) ────────────────────────────────────────────────

const ColorSection: React.FC<{
  universalProps: UniversalProps;
  onChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = ({ universalProps, onChange, t }) => {
  const [open, setOpen] = useState(true);
  const colorMode = universalProps.colorMode ?? 'original';
  const currentColor = universalProps.color;

  return (
    <div style={{ borderBottom: `1px solid ${t.border}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px', background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.fgSub, flex: 1, textAlign: 'left' }}>
          Цвет
        </span>
        {colorMode === 'solid' && currentColor && (
          <div style={{ width: 10, height: 10, borderRadius: 2, background: currentColor, border: `1px solid ${t.border}`, flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 10, color: t.fgMuted, fontFamily: t.mono, flexShrink: 0 }}>
          {colorMode === 'solid' && currentColor ? currentColor : 'оригинал'}
        </span>
        <svg width="9" height="9" viewBox="0 0 10 10" style={{ opacity: 0.35, transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
          <path d="M2 3 L5 7 L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '4px 12px 10px' }}>
          <div style={{ display: 'flex', marginBottom: 8, borderRadius: 7, overflow: 'hidden', border: `1px solid ${t.border}` }}>
            {(['original', 'solid'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => onChange('colorMode', mode)}
                style={{
                  flex: 1, padding: '4px 6px', fontSize: 10, fontWeight: colorMode === mode ? 700 : 400,
                  border: 'none', cursor: 'pointer',
                  background: colorMode === mode ? t.surfaceHov : 'transparent',
                  color: colorMode === mode ? t.fg : t.fgMuted,
                  fontFamily: t.mono,
                }}
              >
                {mode === 'original' ? 'Оригинал' : 'Цвет'}
              </button>
            ))}
          </div>
          {colorMode === 'solid' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={currentColor ?? '#4287f5'}
                onChange={e => onChange('color', e.target.value)}
                style={{
                  width: 32, height: 28, background: 'transparent',
                  border: `1px solid ${t.border}`, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
                }}
              />
              <input
                type="text"
                value={currentColor ?? ''}
                onChange={e => onChange('color', e.target.value || undefined)}
                placeholder="#4287f5"
                style={{
                  flex: 1, height: 28, background: t.inpBg,
                  border: `1px solid ${t.inpBdr}`, borderRadius: 6,
                  color: t.fgMuted, padding: '0 8px', fontSize: 11, fontFamily: t.mono, outline: 'none',
                }}
              />
            </div>
          )}
          {colorMode === 'original' && (
            <div style={{ fontSize: 10, color: t.fgMuted }}>Оригинальные цвета компонента</div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Universal sidebar ────────────────────────────────────────────────────────

const UniversalSidebar: React.FC<{
  universalProps: UniversalProps;
  onChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = ({ universalProps, onChange, t }) => (
  <div>
    <ColorSection universalProps={universalProps} onChange={onChange} t={t} />
    {FIELD_GROUPS.map(group => (
      <AccordionSection key={group.label} label={group.label} t={t}>
        {group.fields.map(f => (
          <FieldRow
            key={f.key} label={f.label} fieldKey={f.key}
            min={f.min} max={f.max} step={f.step} defaultVal={f.default}
            universalProps={universalProps} onChange={onChange} t={t}
          />
        ))}
      </AccordionSection>
    ))}
  </div>
);

// ─── AiSelect ─────────────────────────────────────────────────────────────────

const AiSelect: React.FC<{
  label: string; value: string; options: string[];
  onChange: (v: string) => void; t: T;
}> = ({ label, value, options, onChange, t }) => {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) && !pRef.current?.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div style={{ padding: '5px 12px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: t.fgMuted, marginBottom: 4, letterSpacing: '0.02em', fontFamily: t.mono }}>
        {label}
      </div>
      <div style={{ position: 'relative' }}>
        <button
          ref={btnRef}
          onClick={() => {
            if (btnRef.current) {
              const r = btnRef.current.getBoundingClientRect();
              setRect(r);
            }
            setOpen(v => !v);
          }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '5px 8px', borderRadius: 6,
            border: `1px solid ${t.inpBdr}`, background: t.inpBg,
            color: t.fg, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: t.mono,
          }}
        >
          <span>{value}</span>
          <svg width="9" height="9" viewBox="0 0 10 10" style={{ opacity: 0.4, transform: open ? 'rotate(180deg)' : 'none' }}>
            <path d="M2 3 L5 7 L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </button>
        {open && rect && createPortal(
          <div
            ref={pRef}
            style={{
              position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width,
              zIndex: 99999, background: t.surface, border: `1px solid ${t.borderStrong}`,
              borderRadius: 8, boxShadow: t.shadow, overflow: 'auto', maxHeight: 240,
            }}
          >
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', width: '100%',
                  padding: '6px 11px', fontSize: 12, textAlign: 'left',
                  cursor: 'pointer', border: 'none',
                  color: t.fg, background: opt === value ? t.surfaceHov : 'transparent',
                  fontFamily: t.mono,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = t.surfaceHov}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = opt === value ? t.surfaceHov : 'transparent'}
              >
                {opt === value && <span style={{ marginRight: 6, opacity: 0.5 }}>✓</span>}
                {opt}
              </button>
            ))}
          </div>,
          document.body,
        )}
      </div>
    </div>
  );
};

// ─── Specific sidebar ─────────────────────────────────────────────────────────

const SpecificSidebar: React.FC<{
  config: ComponentConfig; componentProps: ComponentPropsMap;
  onChange: (name: string, v: PropValue) => void; t: T;
}> = ({ config, componentProps, onChange, t }) => {
  const visibleProps = useMemo(
    () => config.specificProps?.length
      ? config.props.filter((p: PropDefinition) => config.specificProps!.includes(p.name))
      : config.props,
    [config],
  );
  if (!visibleProps.length) {
    return <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 12, color: t.fgMuted, fontFamily: t.mono }}>Нет специфических настроек</div>;
  }
  return (
    <div>
      {visibleProps.map((prop: PropDefinition, i: number) => (
        <div key={prop.name} style={{ borderBottom: i < visibleProps.length - 1 ? `1px solid ${t.border}` : 'none' }}>
          {prop.control === 'select' && (
            <AiSelect
              label={prop.description}
              value={typeof componentProps[prop.name] === 'string' ? componentProps[prop.name] as string : (prop.default as string ?? '')}
              options={prop.options ?? []}
              onChange={v => onChange(prop.name, v)}
              t={t}
            />
          )}
          {prop.control === 'number' && (
            <div style={{ padding: '5px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: t.fgMuted, marginBottom: 4, letterSpacing: '0.02em', fontFamily: t.mono }}>
                {prop.description}
              </div>
              <NumberInput
                value={typeof componentProps[prop.name] === 'number' ? componentProps[prop.name] as number : (prop.default as number ?? 0)}
                onChange={v => onChange(prop.name, v)}
                min={prop.min ?? 0} max={prop.max ?? 100} step={prop.step ?? 1} t={t}
              />
            </div>
          )}
          {prop.control !== 'select' && prop.control !== 'number' && (
            <div style={{ padding: '5px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: t.fgMuted, marginBottom: 4, letterSpacing: '0.02em', fontFamily: t.mono }}>
                {prop.description}
              </div>
              <input
                type="text"
                value={typeof componentProps[prop.name] === 'string' ? componentProps[prop.name] as string : (prop.default as string ?? '')}
                onChange={e => onChange(prop.name, e.target.value)}
                style={{
                  width: '100%', padding: '4px 7px', borderRadius: 6,
                  border: `1px solid ${t.inpBdr}`, background: t.inpBg,
                  color: t.inpClr, fontSize: 12, outline: 'none',
                  boxSizing: 'border-box', fontFamily: t.mono,
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TabBar: React.FC<{ active: TabType; onSelect: (t: TabType) => void; t: T }> = ({ active, onSelect, t }) => (
  <div style={{
    display: 'flex', padding: '0 4px',
    borderBottom: `1px solid ${t.border}`,
    flexShrink: 0,
  }}>
    {(['universal', 'specific'] as TabType[]).map(tab => {
      const a = active === tab;
      return (
        <button
          key={tab}
          onClick={() => onSelect(tab)}
          style={{
            padding: '8px 12px', border: 'none',
            borderBottom: `2px solid ${a ? t.fg : 'transparent'}`,
            background: 'transparent',
            color: a ? t.fg : t.fgMuted,
            fontSize: 11, fontWeight: a ? 600 : 400,
            cursor: 'pointer', fontFamily: t.mono,
          }}
        >
          {tab === 'universal' ? 'Общие' : 'Специфические'}
        </button>
      );
    })}
  </div>
);

// ─── Settings panel content ───────────────────────────────────────────────────

const SettingsContent: React.FC<{
  activeTab: TabType; onTabSelect: (t: TabType) => void;
  config: ComponentConfig; componentProps: ComponentPropsMap; universalProps: UniversalProps;
  onPropChange: (name: string, v: PropValue) => void;
  onUniversalChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = ({ activeTab, onTabSelect, config, componentProps, universalProps, onPropChange, onUniversalChange, t }) => (
  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
    <TabBar active={activeTab} onSelect={onTabSelect} t={t} />
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
      {activeTab === 'universal'
        ? <UniversalSidebar universalProps={universalProps} onChange={onUniversalChange} t={t} />
        : <SpecificSidebar config={config} componentProps={componentProps} onChange={onPropChange} t={t} />
      }
    </div>
  </div>
);

// ─── Component render ─────────────────────────────────────────────────────────

interface ComponentRenderProps {
  Component: AnyComponent;
  componentProps: ComponentPropsMap;
  universalProps: UniversalProps;
  refreshKey: number;
  isDark: boolean;
  componentCategory?: string;
  fileContents: Record<string, string>;
}

const ComponentRender: React.FC<ComponentRenderProps> = ({
  Component, componentProps, universalProps, refreshKey, isDark, componentCategory,
}) => {
  const layoutMode = componentCategory === 'backgrounds' ? 'fill' : 'content';
  return (
    <div style={{
      width: '100%', height: '100%', minWidth: 0, minHeight: 0,
      position: 'relative', overflow: layoutMode === 'fill' ? 'hidden' : 'visible',
      isolation: 'isolate', contain: 'layout paint style',
    }}>
      <ComponentWrapper {...universalProps} isDark={isDark} layoutMode={layoutMode} className="w-full h-full">
        <Suspense fallback={null}>
          <Component key={refreshKey} {...componentProps} />
        </Suspense>
      </ComponentWrapper>
    </div>
  );
};

// ─── Source code panel ────────────────────────────────────────────────────────

const SourceCodePanel: React.FC<{ fileContents: Record<string, string>; t: T }> = ({ fileContents, t }) => {
  const files = Object.entries(fileContents);
  const [activeFile, setActiveFile] = useState(files[0]?.[0] ?? '');

  useEffect(() => {
    if (!files.length) { setActiveFile(''); return; }
    if (!activeFile || !files.some(([name]) => name === activeFile)) {
      setActiveFile(files[0][0]);
    }
  }, [activeFile, files]);

  const activeCode = files.find(([name]) => name === activeFile)?.[1] ?? '';

  if (files.length === 0) {
    return (
      <div style={{
        padding: 16, fontSize: 12, color: t.fgMuted,
        fontFamily: t.mono, borderTop: `1px solid ${t.border}`,
      }}>
        Исходный код компонента недоступен.
      </div>
    );
  }

  return (
    <div style={{ borderTop: `1px solid ${t.border}`, background: t.codeBg }}>
      {/* File tabs */}
      <div style={{
        display: 'flex', gap: 6, padding: '8px 10px',
        borderBottom: `1px solid ${t.border}`,
        background: t.surface, overflowX: 'auto',
      }}>
        {files.map(([name]) => {
          const isActive = name === activeFile;
          return (
            <button
              key={name}
              onClick={() => setActiveFile(name)}
              style={{
                border: `1px solid ${isActive ? t.borderStrong : t.border}`,
                background: isActive ? t.surfaceHov : 'transparent',
                color: isActive ? t.fg : t.fgMuted,
                borderRadius: 6, padding: '4px 10px',
                fontSize: 11, fontFamily: t.mono, cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {name}
            </button>
          );
        })}
      </div>
      {/* Code content */}
      <div style={{
        overflowX: 'auto', overflowY: 'auto',
        maxHeight: 360,
        scrollbarWidth: 'thin',
      }}>
        <pre style={{
          margin: 0,
          padding: '12px 16px',
          fontSize: 12,
          lineHeight: 1.6,
          fontFamily: t.mono,
          color: t.codeClr,
          background: 'transparent',
          whiteSpace: 'pre',
          minWidth: 'max-content',
          tabSize: 2,
        }}>
          <code style={{ fontFamily: 'inherit', color: 'inherit', background: 'transparent', padding: 0, fontSize: 'inherit' }}>
            {activeCode}
          </code>
        </pre>
      </div>
    </div>
  );
};

// ─── Main settings panel (inline, below preview) ─────────────────────────────

const SettingsPanel: React.FC<ComponentRenderProps & {
  config: ComponentConfig;
  onClose: () => void;
  onPropChange: (name: string, v: PropValue) => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  onRefresh: () => void;
  onReset: () => void;
  onToggleSource: () => void;
  sourceVisible: boolean;
  t: T;
}> = (props) => {
  const { isDark, config, onClose, t } = props;
  const [activeTab, setActiveTab] = useState<TabType>('universal');

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      background: t.bg,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 10px',
        borderBottom: `1px solid ${t.border}`,
        background: t.surface, flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: t.fgMuted, fontFamily: t.mono, flex: 1 }}>
          НАСТРОЙКИ
        </span>
        <SettingsDropdown
          t={t}
          onAction={(action) => {
            if (action === 'run') props.onRefresh();
            if (action === 'reset') props.onReset();
            if (action === 'source') props.onToggleSource();
            if (action === 'hide' || action === 'collapse') onClose();
          }}
          sourceVisible={props.sourceVisible}
        />
      </div>

      {/* Mini preview */}
      <div style={{
        height: 200, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, borderBottom: `1px solid ${t.border}`,
        background: t.bg, overflow: 'hidden', color: t.fg,
      }}>
        <ComponentRender {...props} />
      </div>

      <SettingsContent
        activeTab={activeTab} onTabSelect={setActiveTab}
        config={config} componentProps={props.componentProps}
        universalProps={props.universalProps}
        onPropChange={props.onPropChange} onUniversalChange={props.onUniversalPropChange}
        t={t}
      />
    </div>
  );
};

// ─── Preview panel ────────────────────────────────────────────────────────────

const PreviewPanel: React.FC<ComponentRenderProps & {
  onOpenSettings: () => void; t: T; loading: boolean; isMobile: boolean;
  onAction: (action: SettingsAction) => void;
  sourceVisible: boolean;
}> = ({ onOpenSettings, t, loading, isMobile, onAction, sourceVisible, ...rest }) => (
  <div style={{
    borderRadius: 12,
    border: `1px solid ${t.border}`,
    background: t.bg,
    overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    width: '100%', minWidth: 0,
  }}>
    {/* Toolbar — only settings button */}
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '6px 10px',
      borderBottom: `1px solid ${t.border}`,
      background: t.surface, flexShrink: 0,
      justifyContent: 'flex-end',
    }}>
      <SettingsDropdown t={t} onAction={onAction} sourceVisible={sourceVisible} />
    </div>

    {/* Preview area */}
    <div style={{
      height: isMobile ? 'min(62dvh, 520px)' : 420,
      minHeight: isMobile ? 300 : 380,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: isMobile ? '16px 12px' : 32,
      color: t.fg, position: 'relative', overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: t.bg, zIndex: 2,
          fontSize: 12, color: t.fgSub, fontFamily: t.mono,
        }}>
          Загрузка компонента…
        </div>
      )}
      {!loading && <ComponentRender {...rest} />}
    </div>

    {/* Footer */}
    <div style={{
      padding: '5px 10px',
      borderTop: `1px solid ${t.border}`,
      fontSize: 10, color: t.fgSub,
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      background: t.bg, flexShrink: 0,
      fontFamily: t.mono,
    }}>
      <span>{rest.componentCategory ?? 'component'}</span>
    </div>
  </div>
);

// ─── Schedule hide loading ────────────────────────────────────────────────────

function scheduleHideLoading(setLoading: (v: boolean) => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => setLoading(false));
  });
}

// ─── Main UIComponentViewer ───────────────────────────────────────────────────

const UIComponentViewer: React.FC<{ componentId: string }> = ({ componentId }) => {
  const { isDark } = useTheme();
  const isMobile = useIsMobile();
  const t = tk(isDark);

  const [settingsOpen,   setSettingsOpen]   = useState(false);
  const [sourceVisible,  setSourceVisible]  = useState(false);
  const [refreshKey,     setRefreshKey]     = useState(0);
  const [componentProps, setComponentProps] = useState<ComponentPropsMap>({});
  const [universalProps, setUniversalProps] = useState<UniversalProps>(DEFAULT_UNIVERSAL_PROPS);
  const [componentData,  setComponentData]  = useState<LoadedComponentData | null>(null);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    setLoading(true);
    loadComponent(componentId).then(data => {
      if (data) {
        setComponentData(data);
        setComponentProps(getDefaultProps(data.config));
      }
      scheduleHideLoading(setLoading);
    });
  }, [componentId]);

  const handleRefresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const handlePropChange = useCallback((name: string, value: PropValue) => {
    setComponentProps(prev => ({ ...prev, [name]: value }));
    setRefreshKey(k => k + 1);
  }, []);

  const handleUniversalChange = useCallback((key: keyof UniversalProps, value: PropValue) =>
    setUniversalProps(prev => ({ ...prev, [key]: value })), []);

  const handleReset = useCallback(() => {
    if (!componentData) return;
    setComponentProps(getDefaultProps(componentData.config));
    setUniversalProps(DEFAULT_UNIVERSAL_PROPS);
    setRefreshKey(k => k + 1);
  }, [componentData]);

  const handleAction = useCallback((action: SettingsAction) => {
    if (action === 'run')    { handleRefresh(); return; }
    if (action === 'reset')  { handleReset(); return; }
    if (action === 'source') { setSourceVisible(v => !v); return; }
    if (action === 'hide')   { setSettingsOpen(false); return; }
    if (action === 'collapse') { setSettingsOpen(false); return; }
  }, [handleRefresh, handleReset]);

  const placeholderConfig: ComponentConfig = useMemo(() => ({
    id: componentId, name: '…', description: '', props: [], specificProps: [],
  }), [componentId]);

  const PlaceholderComponent = useMemo(() => () => null, []);

  const effectiveData = componentData ?? {
    config: placeholderConfig,
    Component: PlaceholderComponent as AnyComponent,
    fileContents: {},
  };

  const shared = {
    Component: effectiveData.Component,
    componentProps,
    universalProps,
    refreshKey,
    isDark,
    componentCategory: effectiveData.config.category,
    fileContents: effectiveData.fileContents,
  };

  return (
    <div className="not-prose" style={{ margin: '1.25rem 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {settingsOpen ? (
        <SettingsPanel
          {...shared}
          config={effectiveData.config}
          onClose={() => setSettingsOpen(false)}
          onPropChange={handlePropChange}
          onUniversalPropChange={handleUniversalChange}
          onRefresh={handleRefresh}
          onReset={handleReset}
          onToggleSource={() => setSourceVisible(v => !v)}
          sourceVisible={sourceVisible}
          t={t}
        />
      ) : (
        <PreviewPanel
          {...shared}
          onOpenSettings={() => setSettingsOpen(true)}
          onAction={handleAction}
          t={t}
          loading={loading}
          isMobile={isMobile}
          sourceVisible={sourceVisible}
        />
      )}
      {sourceVisible && <SourceCodePanel fileContents={effectiveData.fileContents} t={t} />}
    </div>
  );
};

export default UIComponentViewer;