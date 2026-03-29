import React, {
  useState, useCallback, Suspense, useEffect, useMemo, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/shared/contexts/ThemeContext';
import {
  X, Maximize2, Minimize2, Play, RefreshCcw,
  Settings, PanelRight, PanelRightClose, ChevronDown, MoreHorizontal,
  Sliders, Palette,
} from 'lucide-react';
import { loadComponent, getDefaultProps } from './loader';
import { ComponentWrapper } from './ComponentWrapper';
import { useIsMobile } from '@/shared/hooks/useBreakpoint';
import type { UniversalProps, ComponentConfig, PropDefinition } from './types';

type PropValue = string | number | boolean | string[] | undefined;
type ComponentPropsMap = Record<string, PropValue>;
type AnyComponent = React.ComponentType<Record<string, PropValue>>;
type TabType = 'universal' | 'specific';

interface LoadedComponentData {
  config: ComponentConfig;
  Component: AnyComponent;
  fileContents: Record<string, string>;
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────

function tk(isDark: boolean) {
  return isDark ? {
    outerBg:     '#0a0a0a',
    barBg:       '#111111',
    panelBg:     '#0d0d0d',
    outerBorder: 'rgba(255,255,255,0.08)',
    barBorder:   'rgba(255,255,255,0.08)',
    btnBg:       'rgba(255,255,255,0.08)',
    btnBdr:      'rgba(255,255,255,0.12)',
    btnHov:      'rgba(255,255,255,0.14)',
    btnClr:      'rgba(255,255,255,0.72)',
    btnActBg:    'rgba(255,255,255,0.15)',
    btnActBdr:   'rgba(255,255,255,0.22)',
    btnActClr:   '#ffffff',
    inpBg:       '#1a1a1a',
    inpBdr:      'rgba(255,255,255,0.12)',
    inpFoc:      'rgba(255,255,255,0.26)',
    inpClr:      'rgba(255,255,255,0.88)',
    plhClr:      'rgba(255,255,255,0.28)',
    fg:          '#e8e8e8',
    fgMuted:     'rgba(255,255,255,0.35)',
    fgSub:       'rgba(255,255,255,0.22)',
    footerClr:   'rgba(255,255,255,0.22)',
    sectionBdr:  'rgba(255,255,255,0.07)',
    outerShadow: '0 2px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
    modalShadow: '0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.05)',
    tabActBg:    'rgba(255,255,255,0.1)',
    tabActBdr:   'rgba(255,255,255,0.15)',
    tabActClr:   '#ffffff',
    tabClr:      'rgba(255,255,255,0.45)',
    dangerClr:   '#f87171',
    menuBg:      '#1a1a1a',
    menuBdr:     'rgba(255,255,255,0.1)',
    menuHov:     'rgba(255,255,255,0.07)',
    menuClr:     'rgba(255,255,255,0.82)',
    menuSub:     'rgba(255,255,255,0.35)',
    cellBg:      '#1a1a1a',
    cellBdr:     'rgba(255,255,255,0.14)',
    cellFg:      'rgba(255,255,255,0.88)',
    cellFocBdr:  'rgba(255,255,255,0.35)',
  } : {
    outerBg:     '#E8E7E3',
    barBg:       '#d8d7d3',
    panelBg:     '#dddcd8',
    outerBorder: 'rgba(0,0,0,0.1)',
    barBorder:   'rgba(0,0,0,0.09)',
    btnBg:       'rgba(0,0,0,0.07)',
    btnBdr:      'rgba(0,0,0,0.12)',
    btnHov:      'rgba(0,0,0,0.12)',
    btnClr:      'rgba(0,0,0,0.68)',
    btnActBg:    'rgba(0,0,0,0.12)',
    btnActBdr:   'rgba(0,0,0,0.22)',
    btnActClr:   '#000000',
    inpBg:       '#E8E7E3',
    inpBdr:      'rgba(0,0,0,0.12)',
    inpFoc:      'rgba(0,0,0,0.28)',
    inpClr:      '#000000',
    plhClr:      'rgba(0,0,0,0.35)',
    fg:          '#1a1a1a',
    fgMuted:     'rgba(0,0,0,0.38)',
    fgSub:       'rgba(0,0,0,0.28)',
    footerClr:   'rgba(0,0,0,0.32)',
    sectionBdr:  'rgba(0,0,0,0.07)',
    outerShadow: '0 1px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.07)',
    modalShadow: '0 24px 80px rgba(0,0,0,0.2)',
    tabActBg:    'rgba(0,0,0,0.1)',
    tabActBdr:   'rgba(0,0,0,0.18)',
    tabActClr:   '#000000',
    tabClr:      'rgba(0,0,0,0.45)',
    dangerClr:   '#dc2626',
    menuBg:      '#eceae6',
    menuBdr:     'rgba(0,0,0,0.1)',
    menuHov:     'rgba(0,0,0,0.06)',
    menuClr:     'rgba(0,0,0,0.82)',
    menuSub:     'rgba(0,0,0,0.4)',
    cellBg:      '#E8E7E3',
    cellBdr:     'rgba(0,0,0,0.14)',
    cellFg:      'rgba(0,0,0,0.85)',
    cellFocBdr:  'rgba(0,0,0,0.35)',
  };
}

type T = ReturnType<typeof tk>;

// ─── Pill button ──────────────────────────────────────────────────────────────

function Pill({ onClick, title, label, icon, t, active, danger }: Readonly<{
  onClick: () => void; title: string; label: string;
  icon: React.ReactNode; t: T; active?: boolean; danger?: boolean;
}>) {
  const bg  = active ? t.btnActBg  : t.btnBg;
  const bdr = active ? t.btnActBdr : t.btnBdr;
  const color = danger ? t.dangerClr : active ? t.btnActClr : t.btnClr;
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

// ─── Portal menu (same style as TableControlsBar) ─────────────────────────────

const PortalMenu: React.FC<{
  pos: { top: number; left: number }; isDark: boolean;
  onClose: () => void; children: React.ReactNode; minWidth?: number;
}> = ({ pos, isDark, onClose, children, minWidth = 200 }) => {
  const t = tk(isDark);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMouse = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const onScroll = () => onClose();
    document.addEventListener('mousedown', onMouse);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener('mousedown', onMouse);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [onClose]);
  return createPortal(
    <>
      <style>{`@keyframes uicMenuIn{from{opacity:0;transform:translateY(-4px) scale(0.97)}to{opacity:1;transform:none}}`}</style>
      <div ref={ref} style={{
        position: 'fixed', top: pos.top, left: pos.left, minWidth, zIndex: 9999,
        background: t.menuBg, border: `1px solid ${t.menuBdr}`,
        borderRadius: 10,
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.7)' : '0 8px 28px rgba(0,0,0,0.16)',
        overflow: 'hidden', animation: 'uicMenuIn 0.13s cubic-bezier(0.2,0,0,1)',
      }}>
        {children}
      </div>
    </>,
    document.body,
  );
};

// Row inside portal menu
function MenuRow({ label, sub, icon, onClick, green, danger, t }: {
  label: string; sub?: string; icon?: React.ReactNode;
  onClick: () => void; green?: boolean; danger?: boolean; t: T;
}) {
  const color = green ? '#22c55e' : danger ? t.dangerClr : t.menuClr;
  const bg = green ? (t.outerBg === '#0a0a0a' ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)') : 'transparent';
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: sub ? '10px 14px' : '11px 14px',
      display: 'flex', alignItems: sub ? 'flex-start' : 'center',
      flexDirection: sub ? 'column' : 'row',
      gap: sub ? 2 : 8, border: 'none',
      background: bg, cursor: 'pointer', textAlign: 'left',
      color, fontSize: 13, fontWeight: green ? 600 : 400,
    }}
      onMouseEnter={e => { if (!green) (e.currentTarget as HTMLButtonElement).style.background = t.menuHov; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = bg; }}
    >
      {!sub && icon && <span style={{ opacity: 0.6, display: 'flex', flexShrink: 0 }}>{icon}</span>}
      <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>
      {sub && <span style={{ fontSize: 11, color: t.menuSub }}>{sub}</span>}
    </button>
  );
}

function MenuSep({ t }: { t: T }) {
  return <div style={{ height: 1, background: t.menuBdr, margin: '3px 0' }} />;
}

// ─── Mobile 3-dot menu for toolbar ───────────────────────────────────────────

const MobileToolbarMenu: React.FC<{
  isDark: boolean; t: T;
  onRefresh: () => void; onFullscreen: () => void; onSettings: () => void; onReset: () => void;
}> = ({ isDark, t, onRefresh, onFullscreen, onSettings, onReset }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const mw = 200;
    setPos({ top: r.bottom + 6, left: Math.max(8, Math.min(r.right - mw, window.innerWidth - mw - 8)) });
    setOpen(true);
  };

  const act = (fn: () => void) => { fn(); setOpen(false); };

  return (
    <>
      <button ref={ref} onClick={toggle} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 8,
        border: `1px solid ${open ? t.btnActBdr : t.btnBdr}`,
        background: open ? t.btnActBg : t.btnBg,
        color: open ? t.btnActClr : t.btnClr,
        cursor: 'pointer', flexShrink: 0,
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = open ? t.btnActBg : t.btnBg; }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <PortalMenu pos={pos} isDark={isDark} onClose={() => setOpen(false)}>
          <MenuRow label="Заново"     icon={<Play      size={14} />} onClick={() => act(onRefresh)}    t={t} />
          <MenuRow label="Развернуть" icon={<Maximize2 size={14} />} onClick={() => act(onFullscreen)} t={t} />
          <MenuRow label="Настройки"  icon={<Settings  size={14} />} onClick={() => act(onSettings)}   t={t} />
          <MenuSep t={t} />
          <MenuRow label="Сбросить"   icon={<RefreshCcw size={14} />} onClick={() => act(onReset)} danger t={t} />
          <div style={{ height: 4 }} />
        </PortalMenu>
      )}
    </>
  );
};

// ─── Number cell — replaces sliders ──────────────────────────────────────────

function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)); }
function decimalPlaces(step: number) { if (step >= 1) return 0; if (step >= 0.1) return 1; return 2; }
function fmt(v: number, step: number) {
  const p = decimalPlaces(step);
  return p > 0 ? v.toFixed(p) : String(Math.round(v));
}

const NumberCell: React.FC<{
  value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; t: T;
  wide?: boolean;
}> = ({ value, onChange, min, max, step, t, wide }) => {
  const [raw, setRaw] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (s: string) => {
    const n = Number.parseFloat(s);
    if (!Number.isNaN(n)) onChange(clamp(n, min, max));
    setFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { commit(raw); inputRef.current?.blur(); }
    if (e.key === 'Escape') { setFocused(false); inputRef.current?.blur(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); onChange(clamp(value + step, min, max)); }
    if (e.key === 'ArrowDown') { e.preventDefault(); onChange(clamp(value - step, min, max)); }
  };

  return (
    <div style={{
      position: 'relative',
      width: wide ? '100%' : 72,
      flexShrink: 0,
    }}>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={focused ? raw : fmt(value, step)}
        onFocus={() => { setRaw(fmt(value, step)); setFocused(true); setTimeout(() => inputRef.current?.select(), 0); }}
        onBlur={e => commit(e.target.value)}
        onChange={e => setRaw(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          padding: '5px 8px',
          borderRadius: 6,
          border: `1px solid ${focused ? t.cellFocBdr : t.cellBdr}`,
          background: t.cellBg,
          color: t.cellFg,
          fontSize: 12,
          fontFamily: 'ui-monospace, monospace',
          textAlign: 'center',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.12s',
        }}
      />
    </div>
  );
};

// ─── Field row — label + cell (no slider) ────────────────────────────────────

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: `1px solid ${t.sectionBdr}` }}>
      <span style={{
        flex: 1, fontSize: 11, color: isChanged ? t.fg : t.fgMuted,
        fontWeight: isChanged ? 500 : 400, minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {isChanged && (
          <button onClick={() => onChange(fieldKey, defaultVal)}
            style={{ fontSize: 10, color: t.fgSub, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 4, lineHeight: 1 }}
            title="Сбросить"
          >↺</button>
        )}
        <NumberCell value={val} onChange={v => onChange(fieldKey, v)} min={min} max={max} step={step} t={t} />
      </div>
    </div>
  );
};

// ─── Accordion section ────────────────────────────────────────────────────────

const AccordionSection: React.FC<{ label: string; defaultOpen?: boolean; t: T; children: React.ReactNode }> = ({ label, defaultOpen = true, t, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', background: t.barBg, border: 'none', cursor: 'pointer',
        borderBottom: `1px solid ${t.sectionBdr}`,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.fgMuted }}>{label}</span>
        <svg width="9" height="9" viewBox="0 0 10 10" style={{ opacity: 0.35, transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
          <path d="M2 3 L5 7 L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

// ─── Color utils ──────────────────────────────────────────────────────────────

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const f = (n: number) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)];
}
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) { if (max === r) h = ((g - b) / d + 6) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; }
  return [h, max === 0 ? 0 : d / max, max];
}
function rgbToHex(r: number, g: number, b: number): string { return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''); }
function hexToRgb(hex: string): [number, number, number] | null {
  const c = hex.replace('#', '');
  if (c.length !== 6) return null;
  const n = Number.parseInt(c, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + 6) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
  return [Math.round(h * 60), Math.round(s * 100), Math.round(l * 100)];
}

// ─── Color picker ─────────────────────────────────────────────────────────────

const ColorPicker: React.FC<{ value: string; onChange: (hex: string | undefined) => void; t: T }> = ({ value, onChange, t }) => {
  const [hue, setHue] = useState(217);
  const [sat, setSat] = useState(0.73);
  const [val, setVal] = useState(0.96);
  const [hexInput, setHexInput] = useState('4287f5');
  const [copied, setCopied] = useState(false);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) return;
    const rgb = hexToRgb(value); if (!rgb) return;
    const [h, s, v] = rgbToHsv(...rgb);
    setHue(h); setSat(s); setVal(v); setHexInput(value.replace('#', ''));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentRgb = useMemo(() => hsvToRgb(hue, sat, val), [hue, sat, val]);
  const currentHex = useMemo(() => rgbToHex(...currentRgb), [currentRgb]);
  const currentHsl = useMemo(() => rgbToHsl(...currentRgb), [currentRgb]);
  const hueColor = useMemo(() => rgbToHex(...hsvToRgb(hue, 1, 1)), [hue]);
  const emit = useCallback((h: number, s: number, v: number) => { const hex = rgbToHex(...hsvToRgb(h, s, v)); onChange(hex); setHexInput(hex.replace('#', '')); }, [onChange]);

  const handleSvDrag = useCallback((e: MouseEvent | React.MouseEvent) => {
    const el = svRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    setSat(s); setVal(v); emit(hue, s, v);
  }, [hue, emit]);

  const handleSvMouseDown = useCallback((e: React.MouseEvent) => {
    handleSvDrag(e);
    const onMove = (ev: MouseEvent) => handleSvDrag(ev);
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  }, [handleSvDrag]);

  const handleHueDrag = useCallback((e: MouseEvent | React.MouseEvent) => {
    const el = hueRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
    setHue(h); emit(h, sat, val);
  }, [sat, val, emit]);

  const handleHueMouseDown = useCallback((e: React.MouseEvent) => {
    handleHueDrag(e);
    const onMove = (ev: MouseEvent) => handleHueDrag(ev);
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
  }, [handleHueDrag]);

  return (
    <div style={{ userSelect: 'none' }}>
      {/* SV canvas */}
      <div ref={svRef} role="slider" aria-label="Насыщенность и яркость"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(sat * 100)}
        tabIndex={0} onMouseDown={handleSvMouseDown}
        style={{ position: 'relative', width: '100%', height: 140, cursor: 'crosshair', background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, ${hueColor})` }}>
        <div style={{ position: 'absolute', left: `${sat * 100}%`, top: `${(1 - val) * 100}%`, width: 13, height: 13, borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.4),0 1px 4px rgba(0,0,0,0.5)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
      </div>
      {/* Hue slider */}
      <div style={{ padding: '10px 12px 0' }}>
        <div ref={hueRef} role="slider" aria-label="Оттенок"
          aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(hue)}
          tabIndex={0} onMouseDown={handleHueMouseDown}
          style={{ position: 'relative', height: 10, borderRadius: 5, cursor: 'pointer', background: 'linear-gradient(to right,#f00 0%,#ff0 16.67%,#0f0 33.33%,#0ff 50%,#00f 66.67%,#f0f 83.33%,#f00 100%)' }}>
          <div style={{ position: 'absolute', top: '50%', left: `${(hue / 360) * 100}%`, width: 16, height: 16, borderRadius: '50%', background: hueColor, border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.3)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
        </div>
      </div>
      {/* Hex + copy */}
      <div style={{ padding: '10px 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, background: currentHex, border: `1px solid ${t.barBorder}` }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.fgMuted, marginBottom: 3 }}>HEX</div>
          <input value={hexInput} onChange={e => {
            const raw = e.target.value; setHexInput(raw);
            const clean = raw.replace('#', '');
            if (clean.length === 6) { const rgb = hexToRgb('#' + clean); if (rgb) { const [h, s, v] = rgbToHsv(...rgb); setHue(h); setSat(s); setVal(v); onChange('#' + clean); } }
            if (clean === '') onChange(undefined);
          }} placeholder="4287f5"
            style={{ width: '100%', padding: '3px 6px', borderRadius: 5, border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: t.inpClr, fontSize: 11, fontFamily: 'ui-monospace,monospace', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <button onClick={async () => { await navigator.clipboard.writeText(currentHex); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          style={{ width: 22, height: 22, borderRadius: 5, border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: copied ? '#22c55e' : t.fg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {copied
            ? <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            : <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><rect x="4" y="1" width="8" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" /><rect x="1" y="3" width="8" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" fill={t.inpBg} /></svg>}
        </button>
      </div>
      {/* RGB / HSL read-only */}
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

// ─── Color section ────────────────────────────────────────────────────────────

const ColorSection: React.FC<{
  universalProps: UniversalProps;
  onChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = ({ universalProps, onChange, t }) => {
  const [open, setOpen] = useState(true);
  const colorMode = universalProps.colorMode ?? 'original';
  const currentColor = universalProps.color;
  return (
    <div>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', background: t.barBg, border: 'none', cursor: 'pointer',
        borderBottom: `1px solid ${t.sectionBdr}`,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: t.fgMuted, flex: 1, textAlign: 'left' }}>Цвет</span>
        {colorMode === 'solid' && currentColor && (
          <div style={{ width: 12, height: 12, borderRadius: 3, background: currentColor, border: `1px solid ${t.barBorder}`, flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 10, color: t.fgMuted, fontFamily: 'ui-monospace,monospace', flexShrink: 0 }}>
          {colorMode === 'solid' && currentColor ? currentColor : 'оригинал'}
        </span>
        <svg width="9" height="9" viewBox="0 0 10 10" style={{ opacity: 0.35, transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
          <path d="M2 3 L5 7 L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div>
          <div style={{ display: 'flex', margin: '8px 12px', borderRadius: 7, overflow: 'hidden', border: `1px solid ${t.barBorder}` }}>
            {(['original', 'solid'] as const).map(mode => (
              <button key={mode} onClick={() => onChange('colorMode', mode)} style={{
                flex: 1, padding: '5px 6px', fontSize: 10, fontWeight: colorMode === mode ? 700 : 400,
                border: 'none', cursor: 'pointer',
                background: colorMode === mode ? t.tabActBg : t.barBg,
                color: colorMode === mode ? t.tabActClr : t.fgMuted,
              }}>
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

// ─── Sidebar field groups ─────────────────────────────────────────────────────

const FIELD_GROUPS: Array<{
  label: string;
  fields: Array<{ label: string; key: keyof UniversalProps; min: number; max: number; step: number; default: number }>;
}> = [
  { label: 'Трансформация', fields: [
    { label: 'Масштаб',    key: 'scale',   min: 0.1,  max: 3,   step: 0.05, default: 1 },
    { label: 'Смещение X', key: 'offsetX', min: -500, max: 500, step: 1,    default: 0 },
    { label: 'Смещение Y', key: 'offsetY', min: -500, max: 500, step: 1,    default: 0 },
    { label: 'Вращение Z', key: 'rotateZ', min: -180, max: 180, step: 1,    default: 0 },
  ]},
  { label: 'Внешний вид', fields: [
    { label: 'Прозрачность', key: 'opacity',    min: 0, max: 1,  step: 0.05, default: 1 },
    { label: 'Яркость',      key: 'brightness', min: 0, max: 2,  step: 0.05, default: 1 },
    { label: 'Контраст',     key: 'contrast',   min: 0, max: 2,  step: 0.05, default: 1 },
    { label: 'Насыщенность', key: 'saturate',   min: 0, max: 2,  step: 0.05, default: 1 },
    { label: 'Размытие',     key: 'blur',       min: 0, max: 20, step: 0.5,  default: 0 },
  ]},
];

const UniversalSidebar: React.FC<{
  universalProps: UniversalProps;
  onChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = ({ universalProps, onChange, t }) => (
  <div>
    <ColorSection universalProps={universalProps} onChange={onChange} t={t} />
    {FIELD_GROUPS.map(group => (
      <AccordionSection key={group.label} label={group.label} defaultOpen={group.label === FIELD_GROUPS[0].label} t={t}>
        {group.fields.map(f => (
          <FieldRow key={f.key} label={f.label} fieldKey={f.key}
            min={f.min} max={f.max} step={f.step} defaultVal={f.default}
            universalProps={universalProps} onChange={onChange} t={t}
          />
        ))}
      </AccordionSection>
    ))}
  </div>
);

// ─── AiSelect ─────────────────────────────────────────────────────────────────

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
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node) && !pRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const computeDropUp = (r: DOMRect) => { const h = Math.min(options.length * 34 + 48, 240); return window.innerHeight - r.bottom < h && r.top > h; };

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const upd = () => { if (!btnRef.current) return; const r = btnRef.current.getBoundingClientRect(); setRect(r); setW(r.width); setDropUp(computeDropUp(r)); };
    upd();
    window.addEventListener('scroll', upd, true); window.addEventListener('resize', upd);
    return () => { window.removeEventListener('scroll', upd, true); window.removeEventListener('resize', upd); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, options.length]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: `1px solid ${t.sectionBdr}` }}>
      <span style={{ flex: 1, fontSize: 11, color: t.fgMuted, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <div ref={ref} style={{ flexShrink: 0 }}>
        <button ref={btnRef} onClick={() => { if (!btnRef.current) return; const r = btnRef.current.getBoundingClientRect(); setRect(r); setW(r.width); setDropUp(computeDropUp(r)); setOpen(v => !v); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 8px', borderRadius: 6, border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: t.fg, fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <span>{value}</span>
          <svg width="9" height="9" viewBox="0 0 10 10" style={{ opacity: 0.4 }}><path d="M2 3 L5 7 L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
        </button>
        {open && rect && createPortal(
          <div ref={pRef} style={{ position: 'fixed', left: rect.left, width: w, zIndex: 99999, background: t.barBg, border: `1px solid ${t.inpBdr}`, borderRadius: 8, boxShadow: t.modalShadow, overflow: 'auto', maxHeight: 240, ...(dropUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }) }}>
            {options.map(opt => (
              <button key={opt} onClick={() => { onChange(opt); setOpen(false); }} onMouseEnter={() => setHov(opt)} onMouseLeave={() => setHov(null)}
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '6px 11px', fontSize: 12, textAlign: 'left', cursor: 'pointer', border: 'none', color: t.fg, background: hov === opt ? t.btnHov : opt === value ? t.btnBg : 'transparent' }}>
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
  const visibleProps = useMemo(() =>
    config.specificProps?.length
      ? config.props.filter((p: PropDefinition) => config.specificProps!.includes(p.name))
      : config.props,
  [config]);

  if (!visibleProps.length) return (
    <div style={{ padding: '20px 12px', textAlign: 'center', fontSize: 12, color: t.fgMuted }}>
      Нет специфических настроек
    </div>
  );

  return (
    <div>
      {visibleProps.map((prop: PropDefinition) => (
        <div key={prop.name}>
          {prop.control === 'select' && (
            <AiSelect label={prop.description}
              value={typeof componentProps[prop.name] === 'string' ? componentProps[prop.name] as string : (prop.default as string ?? '')}
              options={prop.options ?? []} onChange={v => onChange(prop.name, v)} t={t} />
          )}
          {prop.control === 'number' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: `1px solid ${t.sectionBdr}` }}>
              <span style={{ flex: 1, fontSize: 11, color: t.fgMuted, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prop.description}</span>
              <NumberCell
                value={typeof componentProps[prop.name] === 'number' ? componentProps[prop.name] as number : (prop.default as number ?? 0)}
                onChange={v => onChange(prop.name, v)} min={prop.min ?? 0} max={prop.max ?? 100} step={prop.step ?? 1} t={t}
              />
            </div>
          )}
          {prop.control !== 'select' && prop.control !== 'number' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: `1px solid ${t.sectionBdr}` }}>
              <span style={{ flex: 1, fontSize: 11, color: t.fgMuted, minWidth: 0 }}>{prop.description}</span>
              <input type="text"
                value={typeof componentProps[prop.name] === 'string' ? componentProps[prop.name] as string : (prop.default as string ?? '')}
                onChange={e => onChange(prop.name, e.target.value)}
                style={{ width: 100, padding: '4px 7px', borderRadius: 6, border: `1px solid ${t.inpBdr}`, background: t.inpBg, color: t.inpClr, fontSize: 11, outline: 'none' }}
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
  <div style={{ display: 'flex', padding: '6px 12px', gap: 4, borderBottom: `1px solid ${t.barBorder}`, background: t.barBg, flexShrink: 0 }}>
    {(['universal', 'specific'] as TabType[]).map(tab => {
      const a = active === tab;
      return (
        <button key={tab} onClick={() => onSelect(tab)} style={{
          flex: 1, padding: '5px 8px', borderRadius: 7,
          border: `1px solid ${a ? t.tabActBdr : 'transparent'}`,
          background: a ? t.tabActBg : 'transparent',
          color: a ? t.tabActClr : t.tabClr,
          fontSize: 11, fontWeight: a ? 600 : 400, cursor: 'pointer',
        }}>{tab === 'universal' ? 'Общие' : 'Специфические'}</button>
      );
    })}
  </div>
);

const SettingsContent: React.FC<{
  activeTab: TabType; onTabSelect: (t: TabType) => void;
  config: ComponentConfig; componentProps: ComponentPropsMap;
  universalProps: UniversalProps;
  onPropChange: (name: string, v: PropValue) => void;
  onUniversalChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = (props) => (
  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
    <TabBar active={props.activeTab} onSelect={props.onTabSelect} t={props.t} />
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
      {props.activeTab === 'universal'
        ? <UniversalSidebar universalProps={props.universalProps} onChange={props.onUniversalChange} t={props.t} />
        : <SpecificSidebar config={props.config} componentProps={props.componentProps} onChange={props.onPropChange} t={props.t} />
      }
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
}

const ComponentRender: React.FC<ComponentRenderProps> = ({ Component, componentProps, universalProps, refreshKey, isDark }) => (
  <ComponentWrapper {...universalProps} isDark={isDark} className="w-full h-full">
    <Suspense fallback={null}>
      <Component key={refreshKey} {...componentProps} />
    </Suspense>
  </ComponentWrapper>
);

// ─── Mobile bottom sheet (for inline settings panel) ─────────────────────────

const MobileBottomSheet: React.FC<{
  config: ComponentConfig; componentProps: ComponentPropsMap;
  universalProps: UniversalProps;
  onPropChange: (name: string, v: PropValue) => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = ({ config, componentProps, universalProps, onPropChange, onUniversalPropChange, t }) => {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const isOpen = activeTab !== null;
  return (
    <>
      {isOpen && (
        <button onClick={() => setActiveTab(null)} aria-label="Закрыть панель"
          style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'transparent', border: 'none', cursor: 'default' }} />
      )}
      {/* Sheet body */}
      <div style={{
        position: 'absolute', bottom: 52, left: 0, right: 0,
        height: isOpen ? '65dvh' : 0,
        overflow: 'hidden',
        zIndex: 20, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ flex: 1, background: t.panelBg, borderTop: `1px solid ${t.barBorder}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: t.fgSub }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {activeTab === 'universal' && <UniversalSidebar universalProps={universalProps} onChange={onUniversalPropChange} t={t} />}
            {activeTab === 'specific'  && <SpecificSidebar config={config} componentProps={componentProps} onChange={onPropChange} t={t} />}
          </div>
        </div>
      </div>
      {/* Bottom nav bar — like the app's nav */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 52,
        background: t.barBg, borderTop: `1px solid ${t.barBorder}`,
        display: 'flex', alignItems: 'stretch', zIndex: 30,
      }}>
        {([
          { id: 'universal' as TabType, label: 'Общие',         Icon: Sliders  },
          { id: 'specific'  as TabType, label: 'Специфические', Icon: Settings },
        ] as const).map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(isActive ? null : id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 3, border: 'none',
              background: isActive ? t.tabActBg : 'transparent',
              color: isActive ? t.tabActClr : t.tabClr,
              cursor: 'pointer', fontSize: 10, fontWeight: isActive ? 600 : 400,
              borderTop: isActive ? `2px solid ${t.tabActBdr}` : '2px solid transparent',
            }}>
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};

// ─── Fullscreen modal ─────────────────────────────────────────────────────────

const FullscreenModal: React.FC<ComponentRenderProps & {
  config: ComponentConfig; onClose: () => void; onRefresh: () => void;
  onPropChange: (name: string, v: PropValue) => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  onReset: () => void; t: T;
}> = ({ Component, componentProps, universalProps, refreshKey, isDark, config, onClose, onRefresh, onPropChange, onUniversalPropChange, onReset, t }) => {
  const [activeTab, setActiveTab] = useState<TabType>('universal');
  const [panelOpen, setPanelOpen] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: t.outerBg, display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', flexShrink: 0, borderBottom: `1px solid ${t.barBorder}`, background: t.barBg }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.fgMuted, padding: '3px 9px', borderRadius: 7, background: t.btnBg, border: `1px solid ${t.barBorder}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, flexShrink: 1 }}>
          {config.name}
        </div>
        <div style={{ flex: 1 }} />
        {/* Desktop toolbar buttons */}
        <div className="uic-desk" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Pill onClick={onRefresh} title="Перезапустить" label="Заново"   icon={<Play       size={14} />} t={t} />
          <Pill onClick={onReset}   title="Сбросить"      label="Сбросить" icon={<RefreshCcw size={14} />} t={t} />
          <Divider t={t} />
          <Pill onClick={() => setPanelOpen(v => !v)} title={panelOpen ? 'Скрыть панель' : 'Панель'}
            label={panelOpen ? 'Скрыть' : 'Панель'}
            icon={panelOpen ? <PanelRightClose size={14} /> : <PanelRight size={14} />} t={t} active={panelOpen} />
        </div>
        {/* Mobile 3-dot menu */}
        <div className="uic-mob" style={{ display: 'none' }}>
          <MobileToolbarMenu isDark={isDark} t={t}
            onRefresh={onRefresh} onFullscreen={() => {}} onSettings={() => {}} onReset={onReset} />
        </div>
        <style>{`.uic-desk{display:flex!important}.uic-mob{display:none!important}@media(max-width:580px){.uic-desk{display:none!important}.uic-mob{display:flex!important}}`}</style>
        <Pill onClick={onClose} title="Свернуть (Esc)" label="Свернуть" icon={<Minimize2 size={14} />} t={t} />
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Preview */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: isMobile ? '24px 16px' : 48,
          overflow: 'auto',
          paddingBottom: isMobile ? 68 : undefined,
          color: t.fg,
        }}>
          <ComponentRender Component={Component} componentProps={componentProps} universalProps={universalProps} refreshKey={refreshKey} isDark={isDark} />
        </div>

        {/* Desktop sidebar */}
        {!isMobile && panelOpen && (
          <div style={{ width: 280, flexShrink: 0, borderLeft: `1px solid ${t.barBorder}`, background: t.panelBg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <SettingsContent
              activeTab={activeTab} onTabSelect={setActiveTab}
              config={config} componentProps={componentProps}
              universalProps={universalProps}
              onPropChange={onPropChange} onUniversalChange={onUniversalPropChange}
              t={t}
            />
          </div>
        )}

        {/* Mobile bottom sheet nav */}
        {isMobile && (
          <MobileBottomSheet
            config={config} componentProps={componentProps}
            universalProps={universalProps}
            onPropChange={onPropChange} onUniversalPropChange={onUniversalPropChange}
            t={t}
          />
        )}
      </div>
    </div>,
    document.body,
  );
};

// ─── PreviewPanel ─────────────────────────────────────────────────────────────

const PreviewPanel: React.FC<ComponentRenderProps & {
  config: ComponentConfig; onRefresh: () => void; onFullscreen: () => void;
  onOpenSettings: () => void; onReset: () => void; t: T; loading: boolean; isDark: boolean;
}> = ({ config, Component, componentProps, universalProps, refreshKey, isDark, onRefresh, onFullscreen, onOpenSettings, onReset, t, loading }) => (
  <div style={{ borderRadius: 12, border: `1px solid ${t.outerBorder}`, background: t.outerBg, boxShadow: t.outerShadow, display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, overflow: 'hidden' }}>
    <style>{`.uic-desk{display:flex!important}.uic-mob{display:none!important}@media(max-width:580px){.uic-desk{display:none!important}.uic-mob{display:flex!important}}`}</style>
    {/* Toolbar */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderBottom: `1px solid ${t.barBorder}`, background: t.barBg, flexWrap: 'nowrap', minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: t.fgMuted, padding: '3px 9px', borderRadius: 7, background: t.btnBg, border: `1px solid ${t.barBorder}`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200, flexShrink: 1 }}>
        {config.name}
      </div>
      <div style={{ flex: 1 }} />
      {/* Desktop buttons */}
      <div className="uic-desk" style={{ alignItems: 'center', gap: 4 }}>
        <Pill onClick={onRefresh}      title="Перезапустить" label="Заново"     icon={<Play      size={14} />} t={t} />
        <Pill onClick={onFullscreen}   title="Развернуть"    label="Развернуть" icon={<Maximize2 size={14} />} t={t} />
        <Pill onClick={onOpenSettings} title="Настройки"     label="Настройки"  icon={<Settings  size={14} />} t={t} />
      </div>
      {/* Mobile 3-dot */}
      <div className="uic-mob">
        <MobileToolbarMenu isDark={isDark} t={t}
          onRefresh={onRefresh} onFullscreen={onFullscreen}
          onSettings={onOpenSettings} onReset={onReset} />
      </div>
    </div>

    {/* Preview area */}
    <div style={{ minHeight: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: t.fg, position: 'relative' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.outerBg, zIndex: 2, fontSize: 12, color: t.fgSub, fontFamily: 'ui-monospace, monospace' }}>
          Загрузка компонента…
        </div>
      )}
      {!loading && (
        <ComponentRender Component={Component} componentProps={componentProps} universalProps={universalProps} refreshKey={refreshKey} isDark={isDark} />
      )}
    </div>

    {/* Footer */}
    <div style={{ padding: '6px 12px', borderTop: `1px solid ${t.barBorder}`, fontSize: 11, color: t.footerClr, display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none', background: t.outerBg, flexShrink: 0 }}>
      <span>Компонент</span>
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, opacity: 0.7 }}>{config.id}</span>
    </div>
  </div>
);

// ─── SettingsPanel ────────────────────────────────────────────────────────────

const SettingsPanel: React.FC<ComponentRenderProps & {
  config: ComponentConfig; onClose: () => void;
  onPropChange: (name: string, v: PropValue) => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  onRefresh: () => void; onReset: () => void; t: T;
}> = (props) => {
  const { isDark, config, onClose, onRefresh, onReset, t } = props;
  const [activeTab, setActiveTab] = useState<TabType>('universal');

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${t.outerBorder}`, background: t.outerBg, boxShadow: t.outerShadow, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100dvh - 3rem)', overflow: 'hidden' }}>
      {/* Mini preview */}
      <div style={{ minHeight: 220, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, borderBottom: `1px solid ${t.barBorder}`, color: t.fg }}>
        <ComponentRender Component={props.Component} componentProps={props.componentProps} universalProps={props.universalProps} refreshKey={props.refreshKey} isDark={isDark} />
      </div>
      <SettingsContent
        activeTab={activeTab} onTabSelect={setActiveTab}
        config={config} componentProps={props.componentProps}
        universalProps={props.universalProps}
        onPropChange={props.onPropChange}
        onUniversalChange={props.onUniversalPropChange}
        t={t}
      />
      {/* Footer bar */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderTop: `1px solid ${t.barBorder}`, background: t.barBg, flexWrap: 'wrap', rowGap: 6 }}>
        <Pill onClick={onRefresh} title="Перезапустить" label="Заново"   icon={<Play       size={14} />} t={t} />
        <Pill onClick={onReset}   title="Сбросить всё"  label="Сбросить" icon={<RefreshCcw size={14} />} t={t} />
        <div style={{ flex: 1 }} />
        <Pill onClick={onClose}   title="Закрыть"       label="Закрыть"  icon={<X          size={14} />} t={t} />
      </div>
    </div>
  );
};

// ─── UIComponentViewer ────────────────────────────────────────────────────────

const DEFAULT_UNIVERSAL_PROPS: UniversalProps = {
  enableUniversalProps: true,
  scale: 1, color: undefined, colorMode: 'original',
  offsetX: 0, offsetY: 0, rotateZ: 0,
  justifyContent: 'center', alignItems: 'center',
  opacity: 1, blur: 0, brightness: 1, contrast: 1, saturate: 1,
};

const UIComponentViewer: React.FC<{ componentId: string }> = ({ componentId }) => {
  const { isDark } = useTheme();
  const t = tk(isDark);

  const [settingsOpen,   setSettingsOpen]   = useState(false);
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
      requestAnimationFrame(() => requestAnimationFrame(() => setLoading(false)));
    });
  }, [componentId]);

  const handleRefresh         = useCallback(() => setRefreshKey(k => k + 1), []);
  const handlePropChange      = useCallback((name: string, value: PropValue) => { setComponentProps(prev => ({ ...prev, [name]: value })); setRefreshKey(k => k + 1); }, []);
  const handleUniversalChange = useCallback((key: keyof UniversalProps, value: PropValue) => setUniversalProps(prev => ({ ...prev, [key]: value })), []);
  const handleReset           = useCallback(() => {
    if (!componentData) return;
    setComponentProps(getDefaultProps(componentData.config));
    setUniversalProps(DEFAULT_UNIVERSAL_PROPS);
    setRefreshKey(k => k + 1);
  }, [componentData]);

  const placeholderConfig: ComponentConfig = useMemo(() => ({ id: componentId, name: '…', description: '', props: [], specificProps: [] }), [componentId]);
  const PlaceholderComponent = useMemo(() => () => null, []);
  const effectiveData = componentData ?? { config: placeholderConfig, Component: PlaceholderComponent as AnyComponent, fileContents: {} };
  const shared = { Component: effectiveData.Component, componentProps, universalProps, refreshKey, isDark };

  return (
    <div className="not-prose" style={{ margin: '1.25rem 0' }}>
      {settingsOpen ? (
        <SettingsPanel {...shared} config={effectiveData.config}
          onClose={() => setSettingsOpen(false)}
          onPropChange={handlePropChange}
          onUniversalPropChange={handleUniversalChange}
          onRefresh={handleRefresh} onReset={handleReset} t={t}
        />
      ) : (
        <PreviewPanel {...shared} config={effectiveData.config}
          onRefresh={handleRefresh}
          onFullscreen={() => setIsFullscreen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onReset={handleReset}
          t={t} loading={loading}
        />
      )}
      {isFullscreen && componentData && (
        <FullscreenModal {...shared} config={componentData.config}
          onClose={() => setIsFullscreen(false)}
          onRefresh={handleRefresh}
          onPropChange={handlePropChange}
          onUniversalPropChange={handleUniversalChange}
          onReset={handleReset} t={t}
        />
      )}
    </div>
  );
};

export default UIComponentViewer;