import React, {
  useState, useCallback, Suspense, useEffect, useMemo, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/shared/contexts/ThemeContext';
import {
  X, Maximize2, Minimize2, Play, RefreshCcw,
  Settings, PanelRight, PanelRightClose, ChevronDown,
} from 'lucide-react';
import { loadComponent, getDefaultProps } from './loader';
import { ComponentWrapper } from './ComponentWrapper';
import { useIsMobile } from '@/shared/hooks/useBreakpoint';
import type { UniversalProps, ComponentConfig, PropDefinition } from './types';
import { makeTokens } from '@/shared/tokens/theme';

type PropValue = string | number | boolean | string[] | undefined;
type ComponentPropsMap = Record<string, PropValue>;
type AnyComponent = React.ComponentType<Record<string, PropValue>>;
type TabType = 'universal' | 'specific';

interface LoadedComponentData {
  config: ComponentConfig;
  Component: AnyComponent;
  fileContents: Record<string, string>;
}

function tk(isDark: boolean) {
  const t = makeTokens(isDark);
  return isDark ? {
    outerBg:      t.bg,
    barBg:        t.surface,
    panelBg:      '#0d0d0d',
    outerBorder:  t.border,
    barBorder:    'rgba(255,255,255,0.08)',
    btnBg:        'rgba(255,255,255,0.08)',
    btnBdr:       'rgba(255,255,255,0.12)',
    btnHov:       'rgba(255,255,255,0.14)',
    btnClr:       'rgba(255,255,255,0.72)',
    btnActBg:     'rgba(255,255,255,0.15)',
    btnActBdr:    'rgba(255,255,255,0.22)',
    btnActClr:    '#ffffff',
    inpBg:        t.inpBg,
    inpBdr:       t.inpBdr,
    inpFoc:       t.inpBdrFocus,
    inpClr:       t.inpClr,
    plhClr:       t.plhClr,
    fg:           '#e8e8e8',
    fgMuted:      'rgba(255,255,255,0.35)',
    fgSub:        'rgba(255,255,255,0.22)',
    footerClr:    'rgba(255,255,255,0.22)',
    sectionBdr:   'rgba(255,255,255,0.07)',
    outerShadow:  '0 2px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
    modalShadow:  '0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)',
    tabActBg:     'rgba(255,255,255,0.1)',
    tabActBdr:    'rgba(255,255,255,0.15)',
    tabActClr:    '#ffffff',
    tabClr:       'rgba(255,255,255,0.45)',
    dangerClr:    '#f87171',
  } : {
    outerBg:      t.bg,
    barBg:        t.surface,
    panelBg:      '#dddcd8',
    outerBorder:  t.border,
    barBorder:    'rgba(0,0,0,0.09)',
    btnBg:        'rgba(0,0,0,0.07)',
    btnBdr:       'rgba(0,0,0,0.12)',
    btnHov:       'rgba(0,0,0,0.12)',
    btnClr:       'rgba(0,0,0,0.68)',
    btnActBg:     'rgba(0,0,0,0.12)',
    btnActBdr:    'rgba(0,0,0,0.22)',
    btnActClr:    '#000000',
    inpBg:        t.inpBg,
    inpBdr:       t.inpBdr,
    inpFoc:       t.inpBdrFocus,
    inpClr:       t.inpClr,
    plhClr:       t.plhClr,
    fg:           '#1a1a1a',
    fgMuted:      'rgba(0,0,0,0.38)',
    fgSub:        'rgba(0,0,0,0.28)',
    footerClr:    'rgba(0,0,0,0.32)',
    sectionBdr:   'rgba(0,0,0,0.07)',
    outerShadow:  '0 1px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.07)',
    modalShadow:  '0 24px 80px rgba(0,0,0,0.2)',
    tabActBg:     'rgba(0,0,0,0.1)',
    tabActBdr:    'rgba(0,0,0,0.18)',
    tabActClr:    '#000000',
    tabClr:       'rgba(0,0,0,0.45)',
    dangerClr:    '#dc2626',
  };
}

type T = ReturnType<typeof tk>;

function Pill({ onClick, title, label, icon, t, active, danger }: Readonly<{
  onClick: () => void; title: string; label: string;
  icon: React.ReactNode; t: T; active?: boolean; danger?: boolean;
}>) {
  const bg  = active ? t.btnActBg  : t.btnBg;
  const bdr = active ? t.btnActBdr : t.btnBdr;
  let color: string;
  if (danger) {
    color = t.dangerClr;
  } else if (active) {
    color = t.btnActClr;
  } else {
    color = t.btnClr;
  }
  return (
    <button onClick={onClick} title={title} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 3,
      padding: '5px 12px', minWidth: 52, height: 44,
      borderRadius: 8, border: `1px solid ${bdr}`,
      background: bg, color, cursor: 'pointer', flexShrink: 0,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = bg; }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap', lineHeight: 1 }}>{label}</span>
    </button>
  );
}

function Divider({ t }: Readonly<{ t: T }>) {
  return <div style={{ width: 1, height: 22, background: t.barBorder, margin: '0 2px', flexShrink: 0 }} />;
}

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

// ─── Утилиты для работы с цветом ──────────────────────────────────────────────

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)];
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d + 6) % 6;
    } else if (max === g) {
      h = (b - r) / d + 2;
    } else {
      h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string): [number, number, number] | null {
  const c = hex.replace('#', '');
  if (c.length !== 6) { return null; }
  const n = Number.parseInt(c, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) { return [0, 0, Math.round(l * 100)]; }
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) {
    h = ((g - b) / d + 6) % 6;
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}

const ColorPicker: React.FC<{ value: string; onChange: (hex: string | undefined) => void; t: T }> = ({ value, onChange, t }) => {
  const [hue, setHue] = useState(217);
  const [sat, setSat] = useState(0.73);
  const [val, setVal] = useState(0.96);
  const [hexInput, setHexInput] = useState('4287f5');
  const [copied, setCopied] = useState(false);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) { return; }
    const rgb = hexToRgb(value);
    if (!rgb) { return; }
    const [h, s, v] = rgbToHsv(...rgb);
    setHue(h); setSat(s); setVal(v); setHexInput(value.replace('#', ''));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentRgb = useMemo(() => hsvToRgb(hue, sat, val), [hue, sat, val]);
  const currentHex = useMemo(() => rgbToHex(...currentRgb), [currentRgb]);
  const currentHsl = useMemo(() => rgbToHsl(...currentRgb), [currentRgb]);
  const hueColor   = useMemo(() => rgbToHex(...hsvToRgb(hue, 1, 1)), [hue]);

  const emit = useCallback((h: number, s: number, v: number) => {
    const hex = rgbToHex(...hsvToRgb(h, s, v));
    onChange(hex);
    setHexInput(hex.replace('#', ''));
  }, [onChange]);

  const handleSvDrag = useCallback((e: MouseEvent | React.MouseEvent) => {
    const el = svRef.current;
    if (!el) { return; }
    const rect = el.getBoundingClientRect();
    const s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    setSat(s); setVal(v); emit(hue, s, v);
  }, [hue, emit]);

  const handleSvMouseDown = useCallback((e: React.MouseEvent) => {
    handleSvDrag(e);
    const onMove = (ev: MouseEvent) => handleSvDrag(ev);
    const onUp = () => {
      globalThis.removeEventListener('mousemove', onMove);
      globalThis.removeEventListener('mouseup', onUp);
    };
    globalThis.addEventListener('mousemove', onMove);
    globalThis.addEventListener('mouseup', onUp);
  }, [handleSvDrag]);

  const handleHueDrag = useCallback((e: MouseEvent | React.MouseEvent) => {
    const el = hueRef.current;
    if (!el) { return; }
    const rect = el.getBoundingClientRect();
    const h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
    setHue(h); emit(h, sat, val);
  }, [sat, val, emit]);

  const handleHueMouseDown = useCallback((e: React.MouseEvent) => {
    handleHueDrag(e);
    const onMove = (ev: MouseEvent) => handleHueDrag(ev);
    const onUp = () => {
      globalThis.removeEventListener('mousemove', onMove);
      globalThis.removeEventListener('mouseup', onUp);
    };
    globalThis.addEventListener('mousemove', onMove);
    globalThis.addEventListener('mouseup', onUp);
  }, [handleHueDrag]);

  return (
    <div style={{ userSelect: 'none' }}>
      <div ref={svRef} role="slider" aria-label="Насыщенность и яркость" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(sat * 100)} tabIndex={0} onMouseDown={handleSvMouseDown}
        style={{ position: 'relative', width: '100%', height: 140, cursor: 'crosshair', background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, ${hueColor})` }}>
        <div style={{ position: 'absolute', left: `${sat * 100}%`, top: `${(1 - val) * 100}%`, width: 13, height: 13, borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.4),0 1px 4px rgba(0,0,0,0.5)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
      </div>
      <div style={{ padding: '10px 12px 0' }}>
        <div ref={hueRef} role="slider" aria-label="Оттенок" aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(hue)} tabIndex={0} onMouseDown={handleHueMouseDown}
          style={{ position: 'relative', height: 10, borderRadius: 5, cursor: 'pointer', background: 'linear-gradient(to right,#f00 0%,#ff0 16.67%,#0f0 33.33%,#0ff 50%,#00f 66.67%,#f0f 83.33%,#f00 100%)' }}>
          <div style={{ position: 'absolute', top: '50%', left: `${(hue / 360) * 100}%`, width: 16, height: 16, borderRadius: '50%', background: hueColor, border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.3)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
        </div>
      </div>
      <div style={{ padding: '10px 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, background: currentHex, border: `1px solid ${t.barBorder}` }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.fgMuted, marginBottom: 3 }}>HEX</div>
          <input value={hexInput} onChange={e => {
            const raw = e.target.value; setHexInput(raw);
            const clean = raw.replace('#', '');
            if (clean.length === 6) {
              const rgb = hexToRgb('#' + clean);
              if (rgb) {
                const [h, s, v] = rgbToHsv(...rgb);
                setHue(h); setSat(s); setVal(v); onChange('#' + clean);
              }
            }
            if (clean === '') { onChange(undefined); }
          }} placeholder="4287f5" style={{ width: '100%', padding: '3px 6px', borderRadius: 5, border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: t.inpClr, fontSize: 11, fontFamily: 'ui-monospace,monospace', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button onClick={async () => { await navigator.clipboard.writeText(currentHex); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          style={{ width: 22, height: 22, borderRadius: 5, border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: copied ? '#22c55e' : t.fg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {copied
            ? <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            : <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><rect x="4" y="1" width="8" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" /><rect x="1" y="3" width="8" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" fill={t.inpBg} /></svg>}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, margin: '8px 0 0', background: t.barBorder }}>
        {[{ label: 'RGB', value: currentRgb.join(', ') }, { label: 'HSL', value: `${currentHsl[0]}°, ${currentHsl[1]}%, ${currentHsl[2]}%` }].map(({ label, value: v }) => (
          <div key={label} style={{ background: t.outerBg, padding: '5px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.fgMuted, marginBottom: 1 }}>{label}</div>
            <div style={{ fontSize: 10, fontFamily: 'ui-monospace,monospace', color: t.fg }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 12px' }}>
        <button onClick={() => { onChange(undefined); setHexInput(''); }}
          style={{ width: '100%', padding: '4px', borderRadius: 5, border: `1px solid ${t.inpBdr}`, background: 'transparent', color: t.fgMuted, fontSize: 10, cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.btnBg; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
          Сбросить цвет
        </button>
      </div>
    </div>
  );
};

function getDecimalPlaces(step: number): number {
  if (step >= 1) { return 0; }
  if (step >= 0.1) { return 1; }
  return 2;
}

const NumberInput: React.FC<{ value: number; onChange: (v: number) => void; min: number; max: number; step: number; t: T }> = ({ value, onChange, min, max, step, t }) => {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const commit = () => {
    const n = Number.parseFloat(raw);
    if (!Number.isNaN(n)) { onChange(Math.min(max, Math.max(min, n))); }
    setEditing(false);
  };
  const places = getDecimalPlaces(step);
  const numStr = places > 0 ? value.toFixed(places) : String(Math.round(value));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} style={{ flex: 1, accentColor: t.fg, cursor: 'pointer', height: 3, minWidth: 0 }} />
      {editing ? (
        <input ref={inputRef} type="number" value={raw} min={min} max={max} step={step} onChange={e => setRaw(e.target.value)} onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') { commit(); }
            if (e.key === 'Escape') { setEditing(false); }
          }}
          style={{ width: 46, padding: '2px 4px', borderRadius: 5, border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: t.inpClr, fontSize: 11, textAlign: 'center', outline: 'none', fontFamily: 'ui-monospace,monospace', flexShrink: 0 }} />
      ) : (
        <button onClick={() => { setRaw(String(value)); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }}
          style={{ width: 46, padding: '2px 4px', borderRadius: 5, border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: t.inpClr, fontSize: 11, textAlign: 'center', cursor: 'pointer', fontFamily: 'ui-monospace,monospace', flexShrink: 0 }}>
          {numStr}
        </button>
      )}
    </div>
  );
};

const FieldRow: React.FC<{ label: string; fieldKey: keyof UniversalProps; min: number; max: number; step: number; defaultVal: number; universalProps: UniversalProps; onChange: (key: keyof UniversalProps, v: PropValue) => void; t: T }> = ({ label, fieldKey, min, max, step, defaultVal, universalProps, onChange, t }) => {
  const val = (universalProps[fieldKey] as number) ?? defaultVal;
  const isChanged = Math.abs(val - defaultVal) > 0.001;
  return (
    <div style={{ padding: '6px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: isChanged ? t.fg : t.fgMuted, letterSpacing: '0.02em' }}>{label}</span>
        {isChanged && <button onClick={() => onChange(fieldKey, defaultVal)} style={{ fontSize: 9, color: t.fgSub, background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }} title="Сбросить">↺</button>}
      </div>
      <NumberInput value={val} onChange={v => onChange(fieldKey, v)} min={min} max={max} step={step} t={t} />
    </div>
  );
};

const AccordionSection: React.FC<{ label: string; defaultOpen?: boolean; t: T; children: React.ReactNode }> = ({ label, defaultOpen = true, t, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${t.sectionBdr}` }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: `${t.barBg}88`, border: 'none', cursor: 'pointer' }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.fgMuted }}>{label}</span>
        <svg width="9" height="9" viewBox="0 0 10 10" style={{ opacity: 0.35, transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}><path d="M2 3 L5 7 L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

const ColorSection: React.FC<{ universalProps: UniversalProps; onChange: (key: keyof UniversalProps, v: PropValue) => void; t: T }> = ({ universalProps, onChange, t }) => {
  const [open, setOpen] = useState(true);
  const colorMode = universalProps.colorMode ?? 'original';
  const currentColor = universalProps.color;
  return (
    <div style={{ borderBottom: `1px solid ${t.sectionBdr}` }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: `${t.barBg}88`, border: 'none', cursor: 'pointer' }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.fgMuted, flex: 1, textAlign: 'left' }}>Цвет</span>
        {colorMode === 'solid' && currentColor && <div style={{ width: 12, height: 12, borderRadius: 3, background: currentColor, border: `1px solid ${t.barBorder}`, flexShrink: 0 }} />}
        <span style={{ fontSize: 10, color: t.fgMuted, fontFamily: 'ui-monospace,monospace', flexShrink: 0 }}>{colorMode === 'solid' && currentColor ? currentColor : 'оригинал'}</span>
        <svg width="9" height="9" viewBox="0 0 10 10" style={{ opacity: 0.35, transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}><path d="M2 3 L5 7 L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
      </button>
      {open && (
        <div>
          <div style={{ display: 'flex', margin: '0 12px 8px', borderRadius: 7, overflow: 'hidden', border: `1px solid ${t.barBorder}` }}>
            {(['original', 'solid'] as const).map(mode => (
              <button key={mode} onClick={() => onChange('colorMode', mode)} style={{ flex: 1, padding: '5px 6px', fontSize: 10, fontWeight: colorMode === mode ? 700 : 400, border: 'none', cursor: 'pointer', background: colorMode === mode ? t.tabActBg : t.barBg, color: colorMode === mode ? t.tabActClr : t.fgMuted }}>
                {mode === 'original' ? 'Оригинал' : 'Цвет'}
              </button>
            ))}
          </div>
          {colorMode === 'solid' && <ColorPicker value={currentColor ?? '#4287f5'} onChange={hex => onChange('color', hex)} t={t} />}
          {colorMode === 'original' && <div style={{ padding: '6px 12px 10px', fontSize: 10, color: t.fgMuted }}>Оригинальные цвета компонента</div>}
        </div>
      )}
    </div>
  );
};

const UniversalSidebar: React.FC<{ universalProps: UniversalProps; onChange: (key: keyof UniversalProps, v: PropValue) => void; t: T }> = ({ universalProps, onChange, t }) => (
  <div>
    <ColorSection universalProps={universalProps} onChange={onChange} t={t} />
    {FIELD_GROUPS.map(group => (
      <AccordionSection key={group.label} label={group.label} defaultOpen={group.label === FIELD_GROUPS[0].label} t={t}>
        {group.fields.map(f => <FieldRow key={f.key} label={f.label} fieldKey={f.key} min={f.min} max={f.max} step={f.step} defaultVal={f.default} universalProps={universalProps} onChange={onChange} t={t} />)}
      </AccordionSection>
    ))}
  </div>
);

const AiSelect: React.FC<{ label: string; value: string; options: string[]; onChange: (v: string) => void; t: T }> = ({ label, value, options, onChange, t }) => {
  const [open, setOpen] = useState(false);
  const [hov, setHov] = useState<string | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [w, setW] = useState(0);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { return; }
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node) && !pRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const computeDropUp = (r: DOMRect) => {
    const h = Math.min(options.length * 34 + 48, 240);
    return globalThis.innerHeight - r.bottom < h && r.top > h;
  };

  useEffect(() => {
    if (!open || !btnRef.current) { return; }
    const upd = () => {
      if (!btnRef.current) { return; }
      const r = btnRef.current.getBoundingClientRect();
      setRect(r); setW(r.width); setDropUp(computeDropUp(r));
    };
    upd();
    globalThis.addEventListener('scroll', upd, true);
    globalThis.addEventListener('resize', upd);
    return () => {
      globalThis.removeEventListener('scroll', upd, true);
      globalThis.removeEventListener('resize', upd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, options.length]);

  return (
    <div style={{ padding: '6px 12px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: t.fgMuted, marginBottom: 4, letterSpacing: '0.02em' }}>{label}</div>
      <div ref={ref} style={{ position: 'relative' }}>
        <button ref={btnRef} onClick={() => {
          if (!btnRef.current) { return; }
          const r = btnRef.current.getBoundingClientRect();
          setRect(r); setW(r.width); setDropUp(computeDropUp(r)); setOpen(v => !v);
        }}
          style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: t.fg, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
          <span>{value}</span>
          <svg width="9" height="9" viewBox="0 0 10 10" style={{ opacity: 0.4, transform: open ? 'rotate(180deg)' : 'none' }}><path d="M2 3 L5 7 L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
        </button>
        {open && rect && createPortal(
          <div ref={pRef} style={{ position: 'fixed', left: rect.left, width: w, zIndex: 99999, background: t.barBg, border: `1px solid ${t.inpBdr}`, borderRadius: 8, boxShadow: t.modalShadow, overflow: 'auto', maxHeight: 240, ...(dropUp ? { bottom: globalThis.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }) }}>
            {options.map(opt => {
              let optBg: string;
              if (hov === opt) { optBg = t.btnHov; }
              else if (opt === value) { optBg = t.btnBg; }
              else { optBg = 'transparent'; }
              return <button key={opt} onClick={() => { onChange(opt); setOpen(false); }} onMouseEnter={() => setHov(opt)} onMouseLeave={() => setHov(null)}
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '6px 11px', fontSize: 12, textAlign: 'left', cursor: 'pointer', border: 'none', color: t.fg, background: optBg }}>
                {opt === value && <span style={{ marginRight: 6, opacity: 0.5 }}>✓</span>}
                {opt}
              </button>;
            })}
          </div>,
          document.body,
        )}
      </div>
    </div>
  );
};

const SpecificSidebar: React.FC<{ config: ComponentConfig; componentProps: ComponentPropsMap; onChange: (name: string, v: PropValue) => void; t: T }> = ({ config, componentProps, onChange, t }) => {
  const visibleProps = useMemo(
    () => config.specificProps?.length
      ? config.props.filter((p: PropDefinition) => config.specificProps!.includes(p.name))
      : config.props,
    [config],
  );
  if (!visibleProps.length) { return <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 12, color: t.fgMuted }}>Нет специфических настроек</div>; }
  return (
    <div>
      {visibleProps.map((prop: PropDefinition, i: number) => (
        <div key={prop.name} style={{ borderBottom: i < visibleProps.length - 1 ? `1px solid ${t.sectionBdr}` : 'none' }}>
          {prop.control === 'select' && <AiSelect label={prop.description} value={typeof componentProps[prop.name] === 'string' ? componentProps[prop.name] as string : (prop.default as string ?? '')} options={prop.options ?? []} onChange={v => onChange(prop.name, v)} t={t} />}
          {prop.control === 'number' && (
            <div style={{ padding: '6px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: t.fgMuted, marginBottom: 4, letterSpacing: '0.02em' }}>{prop.description}</div>
              <NumberInput value={typeof componentProps[prop.name] === 'number' ? componentProps[prop.name] as number : (prop.default as number ?? 0)} onChange={v => onChange(prop.name, v)} min={prop.min ?? 0} max={prop.max ?? 100} step={prop.step ?? 1} t={t} />
            </div>
          )}
          {prop.control !== 'select' && prop.control !== 'number' && (
            <div style={{ padding: '6px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: t.fgMuted, marginBottom: 4, letterSpacing: '0.02em' }}>{prop.description}</div>
              <input type="text" value={typeof componentProps[prop.name] === 'string' ? componentProps[prop.name] as string : (prop.default as string ?? '')} onChange={e => onChange(prop.name, e.target.value)}
                style={{ width: '100%', padding: '4px 7px', borderRadius: 6, border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: t.inpClr, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const TabBar: React.FC<{ active: TabType; onSelect: (t: TabType) => void; t: T }> = ({ active, onSelect, t }) => (
  <div style={{ display: 'flex', padding: '6px 12px', gap: 4, borderBottom: `1px solid ${t.barBorder}`, background: `${t.barBg}88`, flexShrink: 0 }}>
    {(['universal', 'specific'] as TabType[]).map(tab => {
      const a = active === tab;
      return <button key={tab} onClick={() => onSelect(tab)} style={{ flex: 1, padding: '5px 8px', borderRadius: 7, border: `1px solid ${a ? t.tabActBdr : 'transparent'}`, background: a ? t.tabActBg : 'transparent', color: a ? t.tabActClr : t.tabClr, fontSize: 11, fontWeight: a ? 600 : 400, cursor: 'pointer' }}>{tab === 'universal' ? 'Общие' : 'Специфические'}</button>;
    })}
  </div>
);

const SettingsContent: React.FC<{ activeTab: TabType; onTabSelect: (t: TabType) => void; config: ComponentConfig; componentProps: ComponentPropsMap; universalProps: UniversalProps; onPropChange: (name: string, v: PropValue) => void; onUniversalChange: (key: keyof UniversalProps, v: PropValue) => void; t: T }> = ({ activeTab, onTabSelect, config, componentProps, universalProps, onPropChange, onUniversalChange, t }) => (
  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
    <TabBar active={activeTab} onSelect={onTabSelect} t={t} />
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
      {activeTab === 'universal' ? <UniversalSidebar universalProps={universalProps} onChange={onUniversalChange} t={t} /> : <SpecificSidebar config={config} componentProps={componentProps} onChange={onPropChange} t={t} />}
    </div>
  </div>
);

// ─── Рендер компонента без Suspense fallback во избежание flash ───────────────

interface ComponentRenderProps {
  Component: AnyComponent;
  componentProps: ComponentPropsMap;
  universalProps: UniversalProps;
  refreshKey: number;
  isDark: boolean;
}

const ComponentRender: React.FC<ComponentRenderProps> = ({ Component, componentProps, universalProps, refreshKey, isDark }) => (
  <ComponentWrapper {...universalProps} isDark={isDark} className="w-full h-full">
    <Suspense fallback={null}>
      <Component key={refreshKey} {...componentProps} />
    </Suspense>
  </ComponentWrapper>
);

const MobileBottomSheet: React.FC<{ config: ComponentConfig; componentProps: ComponentPropsMap; universalProps: UniversalProps; onPropChange: (name: string, v: PropValue) => void; onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void; t: T }> = ({ config, componentProps, universalProps, onPropChange, onUniversalPropChange, t }) => {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const isOpen = activeTab !== null;
  return (
    <>
      {isOpen && <button onClick={() => setActiveTab(null)} aria-label="Закрыть панель" style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'transparent', border: 'none', cursor: 'default' }} />}
      <div style={{ position: 'absolute', bottom: 52, left: 0, right: 0, height: isOpen ? '65dvh' : 0, overflow: 'hidden', zIndex: 20, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, background: t.panelBg, borderTop: `1px solid ${t.barBorder}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', flexShrink: 0 }}><div style={{ width: 36, height: 4, borderRadius: 2, background: t.fgSub }} /></div>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {activeTab === 'universal' && <UniversalSidebar universalProps={universalProps} onChange={onUniversalPropChange} t={t} />}
            {activeTab === 'specific'  && <SpecificSidebar config={config} componentProps={componentProps} onChange={onPropChange} t={t} />}
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 52, background: t.barBg, borderTop: `1px solid ${t.barBorder}`, display: 'flex', alignItems: 'stretch', zIndex: 30 }}>
        {([{ id: 'universal' as TabType, label: 'Общие', Icon: isOpen ? ChevronDown : Settings }, { id: 'specific' as TabType, label: 'Специфические', Icon: isOpen ? ChevronDown : PanelRight }]).map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return <button key={id} onClick={() => setActiveTab(isActive ? null : id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, border: 'none', background: isActive ? t.tabActBg : 'transparent', color: isActive ? t.tabActClr : t.tabClr, cursor: 'pointer', fontSize: 10, fontWeight: isActive ? 600 : 400, borderTop: isActive ? `2px solid ${t.btnActBdr}` : '2px solid transparent' }}><Icon size={15} />{label}</button>;
        })}
      </div>
    </>
  );
};

const FullscreenModal: React.FC<ComponentRenderProps & { config: ComponentConfig; onClose: () => void; onRefresh: () => void; onPropChange: (name: string, v: PropValue) => void; onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void; onReset: () => void; t: T }> = ({ Component, componentProps, universalProps, refreshKey, isDark, config, onClose, onRefresh, onPropChange, onUniversalPropChange, onReset, t }) => {
  const [activeTab, setActiveTab] = useState<TabType>('universal');
  const [panelOpen, setPanelOpen] = useState(true);
  const isMobile = useIsMobile();
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [onClose]);
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: t.outerBg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', flexShrink: 0, borderBottom: `1px solid ${t.barBorder}`, background: t.barBg }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.fgMuted, padding: '3px 9px', borderRadius: 7, background: t.btnBg, border: `1px solid ${t.barBorder}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, flexShrink: 1 }}>{config.name}</div>
        <div style={{ flex: 1 }} />
        <Pill onClick={onRefresh} title="Перезапустить" label="Заново"   icon={<Play       size={14} />} t={t} />
        <Pill onClick={onReset}   title="Сбросить"      label="Сбросить" icon={<RefreshCcw size={14} />} t={t} />
        {!isMobile && (<><Divider t={t} /><Pill onClick={() => setPanelOpen(v => !v)} title={panelOpen ? 'Скрыть панель' : 'Показать панель'} label={panelOpen ? 'Скрыть' : 'Панель'} icon={panelOpen ? <PanelRightClose size={14} /> : <PanelRight size={14} />} t={t} active={panelOpen} /></>)}
        <Pill onClick={onClose} title="Свернуть (Esc)" label="Свернуть" icon={<Minimize2 size={14} />} t={t} />
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '24px 16px' : 48, overflow: 'auto', paddingBottom: isMobile ? 68 : undefined, color: t.fg }}>
          <ComponentRender Component={Component} componentProps={componentProps} universalProps={universalProps} refreshKey={refreshKey} isDark={isDark} />
        </div>
        {!isMobile && panelOpen && (
          <div style={{ width: 280, flexShrink: 0, borderLeft: `1px solid ${t.barBorder}`, background: t.panelBg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <SettingsContent activeTab={activeTab} onTabSelect={setActiveTab} config={config} componentProps={componentProps} universalProps={universalProps} onPropChange={onPropChange} onUniversalChange={onUniversalPropChange} t={t} />
          </div>
        )}
        {isMobile && <MobileBottomSheet config={config} componentProps={componentProps} universalProps={universalProps} onPropChange={onPropChange} onUniversalPropChange={onUniversalPropChange} t={t} />}
      </div>
    </div>,
    document.body,
  );
};

const PreviewPanel: React.FC<ComponentRenderProps & { config: ComponentConfig; onRefresh: () => void; onFullscreen: () => void; onOpenSettings: () => void; t: T; loading: boolean }> = ({ config, Component, componentProps, universalProps, refreshKey, isDark, onRefresh, onFullscreen, onOpenSettings, t, loading }) => (
  <div style={{ borderRadius: 12, border: `1px solid ${t.outerBorder}`, background: t.outerBg, boxShadow: t.outerShadow, display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, overflow: 'hidden' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderBottom: `1px solid ${t.barBorder}`, background: t.barBg, flexWrap: 'nowrap', minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: t.fgMuted, padding: '3px 9px', borderRadius: 7, background: t.btnBg, border: `1px solid ${t.barBorder}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200, flexShrink: 1 }}>{config.name}</div>
      <div style={{ flex: 1 }} />
      <Pill onClick={onRefresh}      title="Перезапустить" label="Заново"     icon={<Play      size={14} />} t={t} />
      <Pill onClick={onFullscreen}   title="Развернуть"    label="Развернуть" icon={<Maximize2 size={14} />} t={t} />
      <Pill onClick={onOpenSettings} title="Настройки"     label="Настройки"  icon={<Settings  size={14} />} t={t} />
    </div>

    {/* Область предпросмотра фиксированной высоты без прыжков */}
    <div style={{ minHeight: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: t.fg, position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: t.outerBg,
          zIndex: 2,
          fontSize: 12,
          color: t.fgSub,
          fontFamily: 'ui-monospace, monospace',
        }}>
          Загрузка компонента…
        </div>
      )}
      {!loading && (
        <ComponentRender
          Component={Component}
          componentProps={componentProps}
          universalProps={universalProps}
          refreshKey={refreshKey}
          isDark={isDark}
        />
      )}
    </div>

    <div style={{ padding: '6px 12px', borderTop: `1px solid ${t.barBorder}`, fontSize: 11, color: t.footerClr, display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none', background: t.outerBg, flexShrink: 0 }}>
      <span>Компонент</span>
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, opacity: 0.7 }}>{config.id}</span>
    </div>
  </div>
);

const SettingsPanel: React.FC<ComponentRenderProps & { config: ComponentConfig; onClose: () => void; onPropChange: (name: string, v: PropValue) => void; onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void; onRefresh: () => void; onReset: () => void; t: T }> = (props) => {
  const { isDark, config, onClose, onRefresh, onReset, t } = props;
  const [activeTab, setActiveTab] = useState<TabType>('universal');
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${t.outerBorder}`, background: t.outerBg, boxShadow: t.outerShadow, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100dvh - 3rem)', overflow: 'hidden' }}>
      <div style={{ minHeight: 220, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, borderBottom: `1px solid ${t.barBorder}`, color: t.fg }}>
        <ComponentRender Component={props.Component} componentProps={props.componentProps} universalProps={props.universalProps} refreshKey={props.refreshKey} isDark={isDark} />
      </div>
      <SettingsContent activeTab={activeTab} onTabSelect={setActiveTab} config={config} componentProps={props.componentProps} universalProps={props.universalProps} onPropChange={props.onPropChange} onUniversalChange={props.onUniversalPropChange} t={t} />
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderTop: `1px solid ${t.barBorder}`, background: t.barBg, flexWrap: 'wrap', rowGap: 6 }}>
        <Pill onClick={onRefresh} title="Перезапустить" label="Заново"   icon={<Play       size={14} />} t={t} />
        <Pill onClick={onReset}   title="Сбросить всё"  label="Сбросить" icon={<RefreshCcw size={14} />} t={t} />
        <div style={{ flex: 1 }} />
        <Pill onClick={onClose}   title="Закрыть"       label="Закрыть"  icon={<X          size={14} />} t={t} />
      </div>
    </div>
  );
};

// ─── Вспомогательная функция для скрытия оверлея после двух rAF ──────────────
function scheduleHideLoading(setLoading: (v: boolean) => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => setLoading(false));
  });
}

// ─── UIComponentViewer ────────────────────────────────────────────────────────

const UIComponentViewer: React.FC<{ componentId: string }> = ({ componentId }) => {
  const { isDark } = useTheme();
  const t = tk(isDark);

  const [settingsOpen,   setSettingsOpen]   = useState(false);
  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [refreshKey,     setRefreshKey]     = useState(0);
  const [componentProps, setComponentProps] = useState<ComponentPropsMap>({});
  const [universalProps, setUniversalProps] = useState<UniversalProps>(DEFAULT_UNIVERSAL_PROPS);
  const [componentData,  setComponentData]  = useState<LoadedComponentData | null>(null);
  const [loading, setLoading] = useState(true);

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
    if (!componentData) { return; }
    setComponentProps(getDefaultProps(componentData.config));
    setUniversalProps(DEFAULT_UNIVERSAL_PROPS);
    setRefreshKey(k => k + 1);
  }, [componentData]);

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
  };

  return (
    <div className="not-prose" style={{ margin: '1.25rem 0' }}>
      {settingsOpen ? (
        <SettingsPanel
          {...shared}
          config={effectiveData.config}
          onClose={() => setSettingsOpen(false)}
          onPropChange={handlePropChange}
          onUniversalPropChange={handleUniversalChange}
          onRefresh={handleRefresh}
          onReset={handleReset}
          t={t}
        />
      ) : (
        <PreviewPanel
          {...shared}
          config={effectiveData.config}
          onRefresh={handleRefresh}
          onFullscreen={() => setIsFullscreen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          t={t}
          loading={loading}
        />
      )}
      {isFullscreen && componentData && (
        <FullscreenModal
          {...shared}
          config={componentData.config}
          onClose={() => setIsFullscreen(false)}
          onRefresh={handleRefresh}
          onPropChange={handlePropChange}
          onUniversalPropChange={handleUniversalChange}
          onReset={handleReset}
          t={t}
        />
      )}
    </div>
  );
};

export default UIComponentViewer;
