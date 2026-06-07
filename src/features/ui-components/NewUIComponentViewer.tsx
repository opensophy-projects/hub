import React, {
  useState, useCallback, Suspense, useEffect, useMemo, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/shared/contexts/useTheme';
import {
  Minimize2, Play, RefreshCcw, Copy, Check,
  Settings, PanelRight,
  X, Code2, Palette, Move, EyeOff, RotateCcw, FileCode2,
} from 'lucide-react';
import hljs from 'highlight.js/lib/core';
import tsLanguage from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import jsonLanguage from 'highlight.js/lib/languages/json';
import { loadComponent, getDefaultProps } from './loader';
import { ComponentWrapper } from './ComponentWrapper';
import { useIsMobile } from '@/shared/hooks/useBreakpoint';
import type { UniversalProps, ComponentConfig } from './types';
import { makeTokens, themed } from '@/shared/tokens/theme';

type PropValue = string | number | boolean | string[] | undefined;
type ComponentPropsMap = Record<string, PropValue>;
type AnyComponent = React.ComponentType<Record<string, PropValue>>;
type TabType = 'appearance' | 'transform' | 'code';

interface LoadedComponentData {
  config: ComponentConfig;
  Component: AnyComponent;
  fileContents: Record<string, string>;
}

function tk(isDark: boolean) {
  const t = makeTokens(isDark);
  return {
    outerBg:        t.bg,
    barBg:          t.surface,
    outerBorder:    t.border,
    inpBg:          t.inpBg,
    inpBdr:         t.inpBdr,
    inpFoc:         t.inpBdrFocus,
    inpClr:         t.inpClr,
    plhClr:         t.plhClr,
    panelBg:        themed(isDark, '#0d0d0d', '#dddcd8'),
    barBorder:      themed(isDark, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.09)'),
    btnBg:          themed(isDark, 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.07)'),
    btnBdr:         themed(isDark, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.12)'),
    btnHov:         themed(isDark, 'rgba(255,255,255,0.14)', 'rgba(0,0,0,0.12)'),
    btnClr:         themed(isDark, 'rgba(255,255,255,0.72)', 'rgba(0,0,0,0.68)'),
    btnActBg:       themed(isDark, 'rgba(255,255,255,0.15)', 'rgba(0,0,0,0.12)'),
    btnActBdr:      themed(isDark, 'rgba(255,255,255,0.22)', 'rgba(0,0,0,0.22)'),
    btnActClr:      themed(isDark, '#ffffff', '#000000'),
    fg:             themed(isDark, '#e8e8e8', '#1a1a1a'),
    fgMuted:        themed(isDark, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.38)'),
    fgSub:          themed(isDark, 'rgba(255,255,255,0.22)', 'rgba(0,0,0,0.28)'),
    sectionBdr:     themed(isDark, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.07)'),
    outerShadow:    themed(isDark, '0 2px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)', '0 1px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.07)'),
    modalShadow:    themed(isDark, '0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)', '0 24px 80px rgba(0,0,0,0.2)'),
    tabActBg:       themed(isDark, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)'),
    tabActBdr:      themed(isDark, 'rgba(255,255,255,0.15)', 'rgba(0,0,0,0.18)'),
    tabActClr:      themed(isDark, '#ffffff', '#000000'),
    tabClr:         themed(isDark, 'rgba(255,255,255,0.45)', 'rgba(0,0,0,0.45)'),
    dangerClr:      themed(isDark, '#f87171', '#dc2626'),
    mobBg:          isDark ? '#0F0F0F' : '#dcdbd7',
    accent:         t.accent,
    accentSoft:     t.accentSoft,
  };
}

type T = ReturnType<typeof tk>;

// ─── MobBtn ───────────────────────────────────────────────────────────────────

const MobBtn: React.FC<{
  label: string; icon: React.ReactNode; t: T; onClick: () => void; isActive: boolean;
}> = ({ label, icon, t, onClick, isActive }) => (
  <button onClick={onClick} style={{
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 4, padding: 0, border: 'none',
    background: 'transparent', cursor: 'pointer',
    color: isActive ? t.accent : t.fgMuted,
    outline: 'none', minWidth: 0,
  }}>
    <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
    <span style={{ fontSize: 10, fontWeight: 400, lineHeight: 1, marginTop: 1 }}>{label}</span>
  </button>
);

const DEFAULT_UNIVERSAL_PROPS: UniversalProps = {
  enableUniversalProps: true,
  scale: 1, color: undefined, colorMode: 'original',
  offsetX: 0, offsetY: 0, rotateZ: 0,
  justifyContent: 'center', alignItems: 'center',
  opacity: 1, blur: 0, brightness: 1, contrast: 1, saturate: 1,
};

const UNIVERSAL_FIELD_GROUPS: Record<'transform' | 'appearance', {
  label: string;
  fields: Array<{ label: string; key: keyof UniversalProps; min: number; max: number; step: number; default: number }>;
}> = {
  transform: { label: 'Трансформация', fields: [
    { label: 'Масштаб',    key: 'scale',   min: 0.1,  max: 3,    step: 0.05, default: 1 },
    { label: 'Смещение X', key: 'offsetX', min: -500, max: 500,  step: 1,    default: 0 },
    { label: 'Смещение Y', key: 'offsetY', min: -500, max: 500,  step: 1,    default: 0 },
    { label: 'Вращение Z', key: 'rotateZ', min: -180, max: 180,  step: 1,    default: 0 },
  ] },
  appearance: { label: 'Внешний вид', fields: [
    { label: 'Прозрачность', key: 'opacity',    min: 0, max: 1,  step: 0.05, default: 1 },
    { label: 'Яркость',      key: 'brightness', min: 0, max: 2,  step: 0.05, default: 1 },
    { label: 'Контраст',     key: 'contrast',   min: 0, max: 2,  step: 0.05, default: 1 },
    { label: 'Насыщенность', key: 'saturate',   min: 0, max: 2,  step: 0.05, default: 1 },
    { label: 'Размытие',     key: 'blur',       min: 0, max: 20, step: 0.5,  default: 0 },
  ] },
};

hljs.registerLanguage('typescript', tsLanguage);
hljs.registerLanguage('tsx', tsLanguage);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('jsx', javascript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', jsonLanguage);

// ─── Утилиты для работы с цветом ─────────────────────────────────────────────

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
    if (max === r)      { h = ((g - b) / d + 6) % 6; }
    else if (max === g) { h = (b - r) / d + 2; }
    else                { h = (r - g) / d + 4; }
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
  if (max === r)      { h = ((g - b) / d + 6) % 6; }
  else if (max === g) { h = (b - r) / d + 2; }
  else                { h = (r - g) / d + 4; }
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}

const ColorPicker: React.FC<{ value: string; onChange: (hex: string | undefined) => void; t: T }> = ({ value, onChange, t }) => {
  const [hue, setHue]         = useState(217);
  const [sat, setSat]         = useState(0.73);
  const [val, setVal]         = useState(0.96);
  const [hexInput, setHexInput] = useState('4287f5');
  const [copied, setCopied]   = useState(false);
  const svRef  = useRef<HTMLDivElement>(null);
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
    const onUp   = () => { globalThis.removeEventListener('mousemove', onMove); globalThis.removeEventListener('mouseup', onUp); };
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
    const onUp   = () => { globalThis.removeEventListener('mousemove', onMove); globalThis.removeEventListener('mouseup', onUp); };
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
              if (rgb) { const [h, s, v] = rgbToHsv(...rgb); setHue(h); setSat(s); setVal(v); onChange('#' + clean); }
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
  if (step >= 1)   { return 0; }
  if (step >= 0.1) { return 1; }
  return 2;
}

const NumberInput: React.FC<{ value: number; onChange: (v: number) => void; min: number; max: number; step: number; t: T }> = ({ value, onChange, min, max, step, t }) => {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw]         = useState('');
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
          onKeyDown={e => { if (e.key === 'Enter') { commit(); } if (e.key === 'Escape') { setEditing(false); } }}
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
  const val       = (universalProps[fieldKey] as number) ?? defaultVal;
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
  const colorMode       = universalProps.colorMode ?? 'original';
  const currentColor    = universalProps.color;
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

const UniversalSidebar: React.FC<{ section: 'appearance' | 'transform'; universalProps: UniversalProps; onChange: (key: keyof UniversalProps, v: PropValue) => void; t: T }> = ({ section, universalProps, onChange, t }) => {
  const group = UNIVERSAL_FIELD_GROUPS[section];
  return (
    <div>
      {section === 'appearance' && <ColorSection universalProps={universalProps} onChange={onChange} t={t} />}
      <AccordionSection label={group.label} defaultOpen t={t}>
        {group.fields.map(f => <FieldRow key={f.key} label={f.label} fieldKey={f.key} min={f.min} max={f.max} step={f.step} defaultVal={f.default} universalProps={universalProps} onChange={onChange} t={t} />)}
      </AccordionSection>
    </div>
  );
};

const SideNavButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  t: T;
}> = ({ label, icon, active = false, onClick, t }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', minHeight: 64, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 14,
      border: `1px solid ${active ? t.btnActBdr : t.btnBdr}`,
      background: active ? t.btnActBg : t.btnBg,
      color: active ? t.btnActClr : t.btnClr,
      cursor: 'pointer', fontSize: 11, fontWeight: active ? 800 : 650,
      textAlign: 'center', lineHeight: 1.1, boxShadow: active ? `0 0 0 1px ${t.accentSoft}` : 'none',
    }}
  >
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }}>{icon}</span>
    <span>{label}</span>
  </button>
);

const SettingsContent: React.FC<{
  activeTab: Exclude<TabType, 'code'>;
  universalProps: UniversalProps;
  onUniversalChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = ({ activeTab, universalProps, onUniversalChange, t }) => (
  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.barBorder}`, background: `${t.barBg}88` }}>
      <div style={{ color: t.fg, fontWeight: 800, fontSize: 15 }}>{activeTab === 'appearance' ? 'Внешний вид' : 'Трансформация'}</div>
      <div style={{ color: t.fgMuted, fontSize: 11, marginTop: 3 }}>Только общие безопасные настройки предпросмотра.</div>
    </div>
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
      <UniversalSidebar section={activeTab} universalProps={universalProps} onChange={onUniversalChange} t={t} />
    </div>
  </div>
);

// ─── ComponentRender ──────────────────────────────────────────────────────────

interface ComponentRenderProps {
  Component: AnyComponent;
  componentProps: ComponentPropsMap;
  universalProps: UniversalProps;
  refreshKey: number;
  isDark: boolean;
  componentCategory?: string;
  fileContents: Record<string, string>;
}

const ComponentRender: React.FC<ComponentRenderProps> = ({ Component, componentProps, universalProps, refreshKey, isDark, componentCategory }) => {
  const layoutMode = componentCategory === 'backgrounds' ? 'fill' : 'content';
  const isFill = layoutMode === 'fill';
  return (
    <div style={{
      width: '100%',
      height: isFill ? '100%' : 'auto',
      minWidth: 0,
      minHeight: 0,
      position: 'relative',
      overflow: isFill ? 'hidden' : 'visible',
      ...(isFill ? { isolation: 'isolate', contain: 'layout paint style' } : {}),
    }}>
      <ComponentWrapper {...universalProps} isDark={isDark} layoutMode={layoutMode} className="w-full h-full">
        <Suspense fallback={null}>
          <Component key={refreshKey} {...componentProps} />
        </Suspense>
      </ComponentWrapper>
    </div>
  );
};

// ─── SourceCodePanel ──────────────────────────────────────────────────────────

const HLJS_THEME = `
.ui-viewer-code .hljs-keyword,.ui-viewer-code .hljs-selector-tag,.ui-viewer-code .hljs-title.function_ { color: #c084fc; }
.ui-viewer-code .hljs-string,.ui-viewer-code .hljs-attr,.ui-viewer-code .hljs-template-string { color: #86efac; }
.ui-viewer-code .hljs-number,.ui-viewer-code .hljs-literal { color: #fbbf24; }
.ui-viewer-code .hljs-comment { color: #64748b; font-style: italic; }
.ui-viewer-code .hljs-title.class_,.ui-viewer-code .hljs-built_in,.ui-viewer-code .hljs-type { color: #67e8f9; }
.ui-viewer-code .hljs-tag,.ui-viewer-code .hljs-name { color: #fb7185; }
`;

function languageFromFile(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'ts') return 'typescript';
  if (ext === 'tsx') return 'tsx';
  if (ext === 'js') return 'javascript';
  if (ext === 'jsx') return 'jsx';
  if (ext === 'css') return 'css';
  if (ext === 'html') return 'html';
  if (ext === 'json') return 'json';
  return 'typescript';
}

function highlightCode(code: string, fileName: string): string {
  const language = languageFromFile(fileName);
  if (hljs.getLanguage(language)) {
    return hljs.highlight(code, { language, ignoreIllegals: true }).value;
  }
  return hljs.highlightAuto(code).value;
}

const SourceCodePanel: React.FC<{ fileContents: Record<string, string>; t: T }> = ({ fileContents, t }) => {
  const files = useMemo(() => Object.entries(fileContents), [fileContents]);
  const initialDrafts = useMemo(() => Object.fromEntries(files), [files]);
  const [activeFile, setActiveFile] = useState(files[0]?.[0] ?? '');
  const [drafts, setDrafts] = useState<Record<string, string>>(initialDrafts);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDrafts(initialDrafts);
    setActiveFile(files[0]?.[0] ?? '');
  }, [files, initialDrafts]);

  const activeCode = drafts[activeFile] ?? '';
  const originalCode = fileContents[activeFile] ?? '';
  const isDirty = activeCode !== originalCode;
  const highlightedCode = useMemo(() => highlightCode(activeCode, activeFile), [activeCode, activeFile]);

  const copyActiveCode = async () => {
    if (!activeCode) { return; }
    await navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  if (files.length === 0) {
    return <div style={{ padding: 12, fontSize: 12, color: t.fgMuted }}>Исходный код компонента недоступен.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.outerBg }}>
      <style>{HLJS_THEME}</style>
      <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${t.barBorder}`, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0, background: t.barBg }}>
        <button onClick={copyActiveCode} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${t.btnBdr}`, background: copied ? t.tabActBg : t.btnBg, color: copied ? t.tabActClr : t.btnClr, borderRadius: 10, padding: '8px 11px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
        <button onClick={() => setDrafts(prev => ({ ...prev, [activeFile]: originalCode }))} disabled={!isDirty} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${isDirty ? t.btnActBdr : t.btnBdr}`, background: isDirty ? t.btnBg : 'transparent', color: isDirty ? t.btnClr : t.fgSub, borderRadius: 10, padding: '8px 11px', fontSize: 12, fontWeight: 700, cursor: isDirty ? 'pointer' : 'not-allowed' }}>
          <RotateCcw size={14} />Сбросить файл
        </button>
        <span style={{ fontSize: 11, color: t.fgMuted }}>Редактирование локальное: оригинальный компонент не изменяется.</span>
      </div>
      <div style={{ display: 'flex', minHeight: 0, flex: 1 }}>
        <div style={{ width: 210, flexShrink: 0, borderRight: `1px solid ${t.barBorder}`, background: t.panelBg, padding: 10, overflowY: 'auto' }}>
          {files.map(([name]) => {
            const isActive = name === activeFile;
            const dirty = (drafts[name] ?? '') !== (fileContents[name] ?? '');
            return (
              <button key={name} onClick={() => setActiveFile(name)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${isActive ? t.tabActBdr : 'transparent'}`, background: isActive ? t.tabActBg : 'transparent', color: isActive ? t.tabActClr : t.btnClr, borderRadius: 10, padding: '9px 10px', marginBottom: 6, fontSize: 12, fontFamily: 'ui-monospace, monospace', cursor: 'pointer', textAlign: 'left' }}>
                <FileCode2 size={14} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                {dirty && <span style={{ color: t.accent }}>●</span>}
              </button>
            );
          })}
        </div>
        <div className="ui-viewer-code" style={{ flex: 1, minWidth: 0, position: 'relative', background: t.panelBg, overflow: 'hidden' }}>
          <pre aria-hidden="true" style={{ position: 'absolute', inset: 0, margin: 0, padding: '18px 20px', overflow: 'auto', fontSize: 13, lineHeight: 1.6, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: t.fg, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', tabSize: 2, pointerEvents: 'none' }}>
            <code dangerouslySetInnerHTML={{ __html: highlightedCode + (activeCode.endsWith('\n') ? ' ' : '') }} />
          </pre>
          <textarea
            aria-label={`Редактировать ${activeFile}`}
            value={activeCode}
            spellCheck={false}
            onChange={e => setDrafts(prev => ({ ...prev, [activeFile]: e.target.value }))}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', resize: 'none', border: 'none', outline: 'none', margin: 0, padding: '18px 20px', overflow: 'auto', fontSize: 13, lineHeight: 1.6, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: 'transparent', caretColor: t.accent, background: 'transparent', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', tabSize: 2 }}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Хук для перетаскивания шторки ───────────────────────────────────────────

function useSheetDrag(initialVh: number) {
  const [sheetVh,    setSheetVh]    = useState(initialVh);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY   = useRef<number | null>(null);
  const dragStartVh  = useRef(initialVh);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (dragStartY.current === null) { return; }
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const delta   = dragStartY.current - clientY;
      const deltaVh = (delta / globalThis.innerHeight) * 100;
      setSheetVh(Math.max(10, Math.min(92, dragStartVh.current + deltaVh)));
    };
    const onUp = () => {
      if (dragStartY.current === null) { return; }
      dragStartY.current = null;
      setIsDragging(false);
    };
    globalThis.addEventListener('mousemove', onMove);
    globalThis.addEventListener('mouseup',   onUp);
    globalThis.addEventListener('touchmove', onMove, { passive: true });
    globalThis.addEventListener('touchend',  onUp);
    return () => {
      globalThis.removeEventListener('mousemove', onMove);
      globalThis.removeEventListener('mouseup',   onUp);
      globalThis.removeEventListener('touchmove', onMove);
      globalThis.removeEventListener('touchend',  onUp);
    };
  }, []);

  const startDrag = useCallback((clientY: number) => {
    dragStartY.current  = clientY;
    dragStartVh.current = sheetVh;
    setIsDragging(true);
  }, [sheetVh]);

  return { sheetVh, isDragging, startDrag };
}

// ─── Кнопка-ручка для изменения высоты шторки ────────────────────────────────

const SheetDragHandle: React.FC<{
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  title: string;
  children: React.ReactNode;
  t: T;
}> = ({ onMouseDown, onTouchStart, title, children, t }) => (
  <button
    aria-label={title}
    onMouseDown={onMouseDown}
    onTouchStart={onTouchStart}
    style={{
      flexShrink: 0,
      cursor: 'ns-resize',
      touchAction: 'none',
      userSelect: 'none',
      width: '100%',
      background: 'none',
      border: 'none',
      padding: 0,
      color: t.fg,
      display: 'block',
    }}
  >
    {children}
  </button>
);

// ─── FullscreenModal ──────────────────────────────────────────────────────────

type MobileFullscreenSheet = 'appearance' | 'transform' | 'code' | null;

// ─── Десктопная часть FullscreenModal ─────────────────────────────────────────

const FullscreenDesktop: React.FC<{
  Component: AnyComponent;
  componentProps: ComponentPropsMap;
  universalProps: UniversalProps;
  refreshKey: number;
  isDark: boolean;
  componentCategory?: string;
  fileContents: Record<string, string>;
  activeTab: TabType;
  panelOpen: boolean;
  onTabSelect: (tab: TabType) => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  desktopPreviewStyle: React.CSSProperties;
  t: T;
}> = ({
  Component, componentProps, universalProps, refreshKey, isDark, componentCategory,
  fileContents, activeTab, panelOpen,
  onTabSelect, onUniversalPropChange, desktopPreviewStyle, t,
}) => {
  if (activeTab === 'code') {
    return <SourceCodePanel fileContents={fileContents} t={t} />;
  }

  return (
    <>
      <div style={desktopPreviewStyle}>
        <ComponentRender
          Component={Component}
          componentProps={componentProps}
          universalProps={universalProps}
          refreshKey={refreshKey}
          isDark={isDark}
          componentCategory={componentCategory}
          fileContents={fileContents}
        />
      </div>
      {panelOpen && (
        <div style={{ width: 320, flexShrink: 0, borderLeft: `1px solid ${t.barBorder}`, background: t.panelBg, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: 112, flexShrink: 0, borderRight: `1px solid ${t.barBorder}`, padding: 10, display: 'flex', flexDirection: 'column', gap: 10, background: t.barBg }}>
            <SideNavButton label="Внешний вид" icon={<Palette size={20} />} active={activeTab === 'appearance'} onClick={() => onTabSelect('appearance')} t={t} />
            <SideNavButton label="Трансформация" icon={<Move size={20} />} active={activeTab === 'transform'} onClick={() => onTabSelect('transform')} t={t} />
            <SideNavButton label="Код" icon={<Code2 size={20} />} active={false} onClick={() => onTabSelect('code')} t={t} />
          </div>
          <SettingsContent
            activeTab={activeTab}
            universalProps={universalProps}
            onUniversalChange={onUniversalPropChange}
            t={t}
          />
        </div>
      )}
    </>
  );
};

// ─── Мобильная часть FullscreenModal ──────────────────────────────────────────

const FullscreenMobile: React.FC<{
  Component: AnyComponent;
  componentProps: ComponentPropsMap;
  universalProps: UniversalProps;
  refreshKey: number;
  isDark: boolean;
  componentCategory?: string;
  fileContents: Record<string, string>;
  onClose: () => void;
  onRefresh: () => void;
  onReset: () => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = ({
  Component, componentProps, universalProps, refreshKey, isDark, componentCategory,
  fileContents, onClose, onRefresh, onReset, onUniversalPropChange, t,
}) => {
  const [mobSheet, setMobSheet] = useState<MobileFullscreenSheet>(null);
  const { sheetVh, isDragging, startDrag } = useSheetDrag(55);
  const isBackground  = componentCategory === 'backgrounds';
  const mobSheetOpen  = mobSheet !== null;

  const mobSheetLabel: Record<Exclude<MobileFullscreenSheet, null>, string> = {
    appearance: 'Внешний вид',
    transform:  'Трансформация',
    code:       'Исходный код',
  };

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, bottom: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fg, overflow: isBackground ? 'hidden' : 'visible' }}>
        <ComponentRender Component={Component} componentProps={componentProps} universalProps={universalProps} refreshKey={refreshKey} isDark={isDark} componentCategory={componentCategory} fileContents={fileContents} />
      </div>

      {mobSheetOpen && (
        <button
          onClick={() => setMobSheet(null)}
          aria-label="Закрыть панель"
          style={{ position: 'absolute', inset: 0, bottom: 60, zIndex: 10, background: 'rgba(0,0,0,0.25)', cursor: 'default', border: 'none', padding: 0 }}
        />
      )}

      <div style={{
        position: 'absolute', bottom: 60, left: 0, right: 0,
        height: mobSheetOpen ? `min(${sheetVh}dvh, 720px)` : 0,
        overflow: 'hidden', zIndex: 20, display: 'flex', flexDirection: 'column',
        transition: isDragging ? 'none' : 'height 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ flex: 1, background: t.panelBg, borderTop: `1px solid ${t.barBorder}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <SheetDragHandle
            t={t}
            title="Изменить высоту панели"
            onMouseDown={e => startDrag(e.clientY)}
            onTouchStart={e => startDrag(e.touches[0].clientY)}
          >
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: t.fgSub }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 18px 10px', borderBottom: `1px solid ${t.barBorder}` }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: t.fg, letterSpacing: '-0.01em' }}>
                {mobSheet ? mobSheetLabel[mobSheet] : ''}
              </span>
              <button onClick={() => setMobSheet(null)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10, border: `1px solid ${t.barBorder}`, background: t.btnBg, color: t.fg, cursor: 'pointer', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>
          </SheetDragHandle>

          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {(mobSheet === 'appearance' || mobSheet === 'transform') && (
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <UniversalSidebar section={mobSheet} universalProps={universalProps} onChange={onUniversalPropChange} t={t} />
              </div>
            )}
            {mobSheet === 'code' && (
              <SourceCodePanel fileContents={fileContents} t={t} />
            )}
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
        background: t.mobBg, borderTop: `1px solid ${t.barBorder}`,
        display: 'flex', alignItems: 'stretch', zIndex: 30,
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
      }}>
        <MobBtn label="Обновить"  icon={<Play size={20} />}       t={t} onClick={() => { setMobSheet(null); onRefresh(); }}                               isActive={false} />
        <MobBtn label="Сбросить"  icon={<RefreshCcw size={20} />} t={t} onClick={() => { setMobSheet(null); onReset(); }}                                 isActive={false} />
        <MobBtn label="Вид"       icon={<Palette size={20} />}    t={t} onClick={() => setMobSheet(p => p === 'appearance' ? null : 'appearance')}       isActive={mobSheet === 'appearance'} />
        <MobBtn label="Трансформ" icon={<Move size={20} />}       t={t} onClick={() => setMobSheet(p => p === 'transform'  ? null : 'transform')}        isActive={mobSheet === 'transform'} />
        <MobBtn label="Код"       icon={<Code2 size={20} />}      t={t} onClick={() => setMobSheet(p => p === 'code'      ? null : 'code')}                isActive={mobSheet === 'code'} />
        <MobBtn label="Свернуть"  icon={<Minimize2 size={20} />}  t={t} onClick={onClose}                                                                 isActive={false} />
      </div>
    </>
  );
};

const FullscreenModal: React.FC<ComponentRenderProps & {
  fileContents: Record<string, string>;
  onClose: () => void;
  onRefresh: () => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  onReset: () => void;
  t: T;
}> = ({ Component, componentProps, universalProps, refreshKey, isDark, componentCategory, fileContents, onClose, onRefresh, onUniversalPropChange, onReset, t }) => {
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [panelOpen, setPanelOpen] = useState(true);
  const isMobile = useIsMobile();

  const isBackground = componentCategory === 'backgrounds';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const desktopPreviewStyle: React.CSSProperties = isBackground
    ? { flex: 1, display: 'flex', overflow: 'hidden', color: t.fg, minWidth: 0, minHeight: 0, position: 'relative' }
    : { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, overflow: 'hidden', color: t.fg, minWidth: 0, minHeight: 0 };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: t.outerBg, display: 'flex' }}>
      {!isMobile && (
        <div style={{ width: 116, flexShrink: 0, borderRight: `1px solid ${t.barBorder}`, background: t.barBg, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SideNavButton label="Запуск" icon={<Play size={21} />} onClick={onRefresh} t={t} />
          <SideNavButton label="Сброс" icon={<RefreshCcw size={21} />} onClick={onReset} t={t} />
          <SideNavButton label={panelOpen ? 'Скрыть настройки' : 'Показать настройки'} icon={panelOpen ? <EyeOff size={21} /> : <PanelRight size={21} />} onClick={() => setPanelOpen(v => !v)} t={t} />
          <div style={{ flex: 1 }} />
          <SideNavButton label="Свернуть" icon={<Minimize2 size={21} />} onClick={onClose} t={t} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', flexDirection: 'column' }}>
        {isMobile ? (
          <FullscreenMobile
            Component={Component}
            componentProps={componentProps}
            universalProps={universalProps}
            refreshKey={refreshKey}
            isDark={isDark}
            componentCategory={componentCategory}
            fileContents={fileContents}
            onClose={onClose}
            onRefresh={onRefresh}
            onReset={onReset}
            onUniversalPropChange={onUniversalPropChange}
            t={t}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
            <FullscreenDesktop
              Component={Component}
              componentProps={componentProps}
              universalProps={universalProps}
              refreshKey={refreshKey}
              isDark={isDark}
              componentCategory={componentCategory}
              fileContents={fileContents}
              activeTab={activeTab}
              panelOpen={panelOpen}
              onTabSelect={setActiveTab}
              onUniversalPropChange={onUniversalPropChange}
              desktopPreviewStyle={desktopPreviewStyle}
              t={t}
            />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

// ─── PreviewPanel ─────────────────────────────────────────────────────────────

const PreviewPanel: React.FC<ComponentRenderProps & {
  onOpenFullscreen: () => void;
  t: T;
  loading: boolean;
}> = ({ Component, componentProps, universalProps, refreshKey, isDark, componentCategory, onOpenFullscreen, t, loading, fileContents }) => {
  const isBackground = componentCategory === 'backgrounds';

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 1,
        display: 'flex', gap: 6,
      }}>
        <button
          onClick={onOpenFullscreen}
          title="Настройки"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 10,
            border: `1.5px solid ${t.btnActBdr}`,
            background: t.barBg,
            color: t.fg,
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: t.outerShadow,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = t.btnHov;
            (e.currentTarget as HTMLButtonElement).style.color = t.btnActClr;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = t.barBg;
            (e.currentTarget as HTMLButtonElement).style.color = t.fg;
          }}
        >
          <Settings size={17} />
        </button>
      </div>

      <div style={{
        width: '100%',
        ...(isBackground
          ? { height: 400 }
          : { minHeight: 500, paddingTop: 60, paddingBottom: 120 }
        ),
        display: 'flex',
        alignItems: isBackground ? 'stretch' : 'center',
        justifyContent: isBackground ? 'stretch' : 'center',
        color: t.fg,
        position: 'relative',
        overflow: isBackground ? 'hidden' : 'visible',
      }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', zIndex: 2, fontSize: 12, color: t.fgSub, fontFamily: 'ui-monospace, monospace' }}>
            Загрузка…
          </div>
        )}
        {!loading && (
          <ComponentRender
            Component={Component}
            componentProps={componentProps}
            universalProps={universalProps}
            refreshKey={refreshKey}
            isDark={isDark}
            componentCategory={componentCategory}
            fileContents={fileContents}
          />
        )}
      </div>
    </div>
  );
};

function scheduleHideLoading(setLoading: (v: boolean) => void) {
  requestAnimationFrame(() => { requestAnimationFrame(() => setLoading(false)); });
}

// ─── UIComponentViewer ────────────────────────────────────────────────────────

const UIComponentViewer: React.FC<{ componentId: string }> = ({ componentId }) => {
  const { isDark } = useTheme();
  const t          = tk(isDark);

  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [refreshKey,     setRefreshKey]     = useState(0);
  const [componentProps, setComponentProps] = useState<ComponentPropsMap>({});
  const [universalProps, setUniversalProps] = useState<UniversalProps>(DEFAULT_UNIVERSAL_PROPS);
  const [componentData,  setComponentData]  = useState<LoadedComponentData | null>(null);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    setLoading(true);
    loadComponent(componentId).then(data => {
      if (data) { setComponentData(data); setComponentProps(getDefaultProps(data.config)); }
      scheduleHideLoading(setLoading);
    });
  }, [componentId]);

  const handleRefresh         = useCallback(() => setRefreshKey(k => k + 1), []);
  const handleUniversalChange = useCallback((key: keyof UniversalProps, value: PropValue) => setUniversalProps(prev => ({ ...prev, [key]: value })), []);
  const handleReset           = useCallback(() => {
    if (!componentData) { return; }
    setComponentProps(getDefaultProps(componentData.config));
    setUniversalProps(DEFAULT_UNIVERSAL_PROPS);
    setRefreshKey(k => k + 1);
  }, [componentData]);

  const placeholderConfig: ComponentConfig = useMemo(() => ({ id: componentId, name: '…', description: '', props: [], specificProps: [] }), [componentId]);
  const PlaceholderComponent               = useMemo(() => () => null, []);

  const effectiveData = componentData ?? {
    config: placeholderConfig,
    Component: PlaceholderComponent as AnyComponent,
    fileContents: {},
  };

  const shared = {
    Component:         effectiveData.Component,
    componentProps,
    universalProps,
    refreshKey,
    isDark,
    componentCategory: effectiveData.config.category,
    fileContents:      effectiveData.fileContents,
  };

  return (
    <div className="not-prose" style={{ margin: '1.25rem 0', overflow: 'visible', position: 'relative' }}>
      <PreviewPanel
        {...shared}
        onOpenFullscreen={() => setIsFullscreen(true)}
        t={t}
        loading={loading}
      />
      {isFullscreen && componentData && (
        <FullscreenModal
          {...shared}
          onClose={() => setIsFullscreen(false)}
          onRefresh={handleRefresh}
          onUniversalPropChange={handleUniversalChange}
          onReset={handleReset}
          t={t}
        />
      )}
    </div>
  );
};

export default UIComponentViewer;