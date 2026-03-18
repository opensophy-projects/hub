import React, {
  useState, useCallback, Suspense, useEffect, useMemo, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { X, Maximize2, Minimize2, Play, RefreshCcw, Settings, PanelRight, PanelRightClose, ChevronUp, ChevronDown } from 'lucide-react';
import { loadComponent, getDefaultProps } from './loader';
import { ComponentWrapper } from './ComponentWrapper';
import { tc } from '@/shared/lib/themeUtils';
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

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_UNIVERSAL_PROPS: UniversalProps = {
  enableUniversalProps: true,
  scale: 1, color: undefined, colorMode: 'original',
  rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 1000,
  justifyContent: 'center', alignItems: 'center',
  opacity: 1, blur: 0, brightness: 1, contrast: 1, saturate: 1,
};

const FIELD_GROUPS: Array<{
  label: string;
  fields: Array<{ label: string; key: keyof UniversalProps; min: number; max: number; step: number; default: number }>;
}> = [
  {
    label: 'Трансформация',
    fields: [
      { label: 'Масштаб',    key: 'scale',   min: 0.1,  max: 3,   step: 0.05, default: 1 },
      { label: 'Вращение X', key: 'rotateX', min: -180, max: 180, step: 1,    default: 0 },
      { label: 'Вращение Y', key: 'rotateY', min: -180, max: 180, step: 1,    default: 0 },
      { label: 'Вращение Z', key: 'rotateZ', min: -180, max: 180, step: 1,    default: 0 },
    ],
  },
  {
    label: 'Внешний вид',
    fields: [
      { label: 'Прозрачность', key: 'opacity',    min: 0, max: 1, step: 0.05, default: 1 },
      { label: 'Яркость',      key: 'brightness', min: 0, max: 2, step: 0.05, default: 1 },
      { label: 'Контраст',     key: 'contrast',   min: 0, max: 2, step: 0.05, default: 1 },
      { label: 'Насыщенность', key: 'saturate',   min: 0, max: 2, step: 0.05, default: 1 },
      { label: 'Размытие',     key: 'blur',       min: 0, max: 20, step: 0.5, default: 0 },
    ],
  },
];

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
  const c = hex.replace('#', ''); if (c.length !== 6) return null;
  const n = parseInt(c, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
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

// ─── Color Picker ─────────────────────────────────────────────────────────────

const ColorPicker: React.FC<{ value: string; onChange: (hex: string | undefined) => void; isDark: boolean }> = ({ value, onChange, isDark }) => {
  const [hue, setHue]   = useState(217);
  const [sat, setSat]   = useState(0.73);
  const [val, setVal]   = useState(0.96);
  const [hexInput, setHexInput] = useState('4287f5');
  const [copied, setCopied]     = useState(false);
  const svRef  = useRef<HTMLDivElement>(null);
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
  const hueColor   = useMemo(() => rgbToHex(...hsvToRgb(hue, 1, 1)), [hue]);

  const emit = useCallback((h: number, s: number, v: number) => {
    const hex = rgbToHex(...hsvToRgb(h, s, v)); onChange(hex); setHexInput(hex.replace('#', ''));
  }, [onChange]);

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

  const border    = tc(isDark, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)');
  const inputBg   = tc(isDark, 'rgba(255,255,255,0.06)', 'rgba(0,0,0,0.06)');
  const labelClr  = tc(isDark, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.35)');
  const textColor = tc(isDark, 'rgba(255,255,255,0.85)', 'rgba(0,0,0,0.85)');
  const metaBg    = tc(isDark, 'rgba(255,255,255,0.03)', 'rgba(0,0,0,0.03)');

  return (
    <div style={{ userSelect: 'none' }}>
      <div ref={svRef} onMouseDown={handleSvMouseDown}
        style={{ position:'relative', width:'100%', height:140, cursor:'crosshair', background:`linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, ${hueColor})` }}
      >
        <div style={{ position:'absolute', left:`${sat*100}%`, top:`${(1-val)*100}%`, width:13, height:13, borderRadius:'50%', border:'2px solid #fff', boxShadow:'0 0 0 1px rgba(0,0,0,0.4),0 1px 4px rgba(0,0,0,0.5)', transform:'translate(-50%,-50%)', pointerEvents:'none' }} />
      </div>

      <div style={{ padding:'10px 12px 0' }}>
        <div ref={hueRef} onMouseDown={handleHueMouseDown}
          style={{ position:'relative', height:10, borderRadius:5, cursor:'pointer', background:'linear-gradient(to right,#f00 0%,#ff0 16.67%,#0f0 33.33%,#0ff 50%,#00f 66.67%,#f0f 83.33%,#f00 100%)' }}
        >
          <div style={{ position:'absolute', top:'50%', left:`${(hue/360)*100}%`, width:16, height:16, borderRadius:'50%', background:hueColor, border:'2px solid #fff', boxShadow:'0 0 0 1px rgba(0,0,0,0.3)', transform:'translate(-50%,-50%)', pointerEvents:'none' }} />
        </div>
      </div>

      <div style={{ padding:'10px 12px 0', display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ width:22, height:22, borderRadius:5, flexShrink:0, background:currentHex, border:`1px solid ${border}` }} />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:labelClr, marginBottom:3 }}>HEX</div>
          <input value={hexInput} onChange={e => {
            const raw = e.target.value; setHexInput(raw);
            const clean = raw.replace('#','');
            if (clean.length===6) { const rgb=hexToRgb('#'+clean); if(rgb){const [h,s,v]=rgbToHsv(...rgb);setHue(h);setSat(s);setVal(v);onChange('#'+clean);} }
            if (clean==='') onChange(undefined);
          }} placeholder="4287f5"
            style={{ width:'100%', padding:'3px 6px', borderRadius:5, border:`1px solid ${border}`, background:inputBg, color:textColor, fontSize:11, fontFamily:'ui-monospace,monospace', outline:'none', boxSizing:'border-box' }}
          />
        </div>
        <button onClick={async()=>{await navigator.clipboard.writeText(currentHex);setCopied(true);setTimeout(()=>setCopied(false),1500);}}
          style={{ width:22, height:22, borderRadius:5, border:`1px solid ${border}`, background:inputBg, color:copied?'#22c55e':textColor, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'color 0.15s' }}
        >
          {copied
            ? <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><rect x="4" y="1" width="8" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="3" width="8" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" fill={inputBg}/></svg>
          }
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, margin:'8px 0 0', background:border }}>
        {[{ label:'RGB', value:currentRgb.join(', ') },{ label:'HSL', value:`${currentHsl[0]}°, ${currentHsl[1]}%, ${currentHsl[2]}%` }].map(({label,value:v})=>(
          <div key={label} style={{ background:metaBg, padding:'5px 12px' }}>
            <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:labelClr, marginBottom:1 }}>{label}</div>
            <div style={{ fontSize:10, fontFamily:'ui-monospace,monospace', color:textColor }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ padding:'8px 12px' }}>
        <button onClick={()=>{onChange(undefined);setHexInput('');}}
          style={{ width:'100%', padding:'4px', borderRadius:5, border:`1px solid ${border}`, background:'transparent', color:labelClr, fontSize:10, cursor:'pointer' }}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=tc(isDark,'rgba(255,255,255,0.06)','rgba(0,0,0,0.06)');}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background='transparent';}}
        >Сбросить цвет</button>
      </div>
    </div>
  );
};

// ─── Sidebar NumberInput ───────────────────────────────────────────────────────

const SidebarNumberInput: React.FC<{
  value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; isDark: boolean;
}> = ({ value, onChange, min, max, step, isDark }) => {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const commit = () => { const n = Number.parseFloat(raw); if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n))); setEditing(false); };
  const border = tc(isDark, 'rgba(255,255,255,0.12)', 'rgba(0,0,0,0.12)');
  const bg     = tc(isDark, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.06)');
  const fg     = tc(isDark, '#fff', '#000');
  const places = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
  const numStr = places > 0 ? value.toFixed(places) : String(Math.round(value));
  return (
    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}
        style={{ flex:1, accentColor:tc(isDark,'rgba(255,255,255,0.8)','rgba(0,0,0,0.6)'), cursor:'pointer', height:3, minWidth:0 }}
      />
      {editing ? (
        <input ref={inputRef} type="number" value={raw} min={min} max={max} step={step}
          onChange={e=>setRaw(e.target.value)} onBlur={commit}
          onKeyDown={e=>{if(e.key==='Enter')commit();if(e.key==='Escape')setEditing(false);}}
          style={{ width:46, padding:'2px 4px', borderRadius:5, border:`1px solid ${border}`, background:bg, color:fg, fontSize:11, textAlign:'center', outline:'none', fontFamily:'ui-monospace,monospace', flexShrink:0 }}
        />
      ) : (
        <button onClick={()=>{setRaw(String(value));setEditing(true);setTimeout(()=>inputRef.current?.select(),0);}}
          style={{ width:46, padding:'2px 4px', borderRadius:5, border:`1px solid ${border}`, background:bg, color:fg, fontSize:11, textAlign:'center', cursor:'pointer', fontFamily:'ui-monospace,monospace', flexShrink:0 }}>
          {numStr}
        </button>
      )}
    </div>
  );
};

// ─── Sidebar Row ───────────────────────────────────────────────────────────────

const SidebarRow: React.FC<{
  label: string; fieldKey: keyof UniversalProps;
  min: number; max: number; step: number; defaultVal: number;
  universalProps: UniversalProps;
  onChange: (key: keyof UniversalProps, v: PropValue) => void;
  isDark: boolean;
}> = ({ label, fieldKey, min, max, step, defaultVal, universalProps, onChange, isDark }) => {
  const labelColor = tc(isDark, 'rgba(255,255,255,0.5)', 'rgba(0,0,0,0.5)');
  const val = (universalProps[fieldKey] as number) ?? defaultVal;
  const isChanged = Math.abs(val - defaultVal) > 0.001;
  return (
    <div style={{ padding:'6px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:10, fontWeight:600, color:isChanged ? tc(isDark,'rgba(255,255,255,0.85)','rgba(0,0,0,0.85)') : labelColor, letterSpacing:'0.02em' }}>
          {label}
        </span>
        {isChanged && (
          <button onClick={()=>onChange(fieldKey, defaultVal)}
            style={{ fontSize:9, color:tc(isDark,'rgba(255,255,255,0.3)','rgba(0,0,0,0.3)'), background:'none', border:'none', cursor:'pointer', padding:'0 2px' }}
            title="Сбросить"
          >↺</button>
        )}
      </div>
      <SidebarNumberInput value={val} onChange={v=>onChange(fieldKey, v)} min={min} max={max} step={step} isDark={isDark} />
    </div>
  );
};

// ─── Sidebar Section ───────────────────────────────────────────────────────────

const SidebarSection: React.FC<{
  label: string;
  defaultOpen?: boolean;
  isDark: boolean;
  children: React.ReactNode;
}> = ({ label, defaultOpen = true, isDark, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const border     = tc(isDark, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.07)');
  const labelColor = tc(isDark, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.35)');
  const bg         = tc(isDark, 'rgba(255,255,255,0.015)', 'rgba(0,0,0,0.015)');
  return (
    <div style={{ borderBottom:`1px solid ${border}` }}>
      <button onClick={()=>setOpen(v=>!v)} style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'7px 12px', background:bg, border:'none', cursor:'pointer',
      }}>
        <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:labelColor }}>
          {label}
        </span>
        <svg width="9" height="9" viewBox="0 0 10 10" style={{ opacity:0.35, transform:open?'rotate(180deg)':'none', transition:'transform 0.15s', flexShrink:0 }}>
          <path d="M2 3 L5 7 L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

// ─── Color Section ─────────────────────────────────────────────────────────────

const ColorSection: React.FC<{
  universalProps: UniversalProps;
  onChange: (key: keyof UniversalProps, v: PropValue) => void;
  isDark: boolean;
}> = ({ universalProps, onChange, isDark }) => {
  const border      = tc(isDark, 'rgba(255,255,255,0.07)', 'rgba(0,0,0,0.07)');
  const labelColor  = tc(isDark, 'rgba(255,255,255,0.35)', 'rgba(0,0,0,0.35)');
  const textColor   = tc(isDark, 'rgba(255,255,255,0.75)', 'rgba(0,0,0,0.75)');
  const bg          = tc(isDark, 'rgba(255,255,255,0.015)', 'rgba(0,0,0,0.015)');
  const activeBg    = tc(isDark, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.08)');
  const [open, setOpen] = useState(true);
  const colorMode   = universalProps.colorMode ?? 'original';
  const currentColor = universalProps.color;

  return (
    <div style={{ borderBottom:`1px solid ${border}` }}>
      <button onClick={()=>setOpen(v=>!v)} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 12px', background:bg, border:'none', cursor:'pointer' }}>
        <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:labelColor, flex:1, textAlign:'left' }}>Цвет</span>
        {colorMode==='solid' && currentColor && (
          <div style={{ width:12, height:12, borderRadius:3, background:currentColor, border:`1px solid ${border}`, flexShrink:0 }} />
        )}
        <span style={{ fontSize:10, color:labelColor, fontFamily:'ui-monospace,monospace', flexShrink:0 }}>
          {colorMode==='solid' && currentColor ? currentColor : 'оригинал'}
        </span>
        <svg width="9" height="9" viewBox="0 0 10 10" style={{ opacity:0.35, transform:open?'rotate(180deg)':'none', transition:'transform 0.15s', flexShrink:0 }}>
          <path d="M2 3 L5 7 L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div>
          <div style={{ display:'flex', margin:'0 12px 8px', borderRadius:7, overflow:'hidden', border:`1px solid ${border}` }}>
            {(['original','solid'] as const).map(mode => (
              <button key={mode} onClick={()=>onChange('colorMode', mode)} style={{
                flex:1, padding:'5px 6px', fontSize:10, fontWeight:colorMode===mode?700:400,
                border:'none', cursor:'pointer', transition:'all 0.12s',
                background:colorMode===mode?activeBg:bg,
                color:colorMode===mode?textColor:labelColor,
              }}>
                {mode==='original'?'Оригинал':'Цвет'}
              </button>
            ))}
          </div>

          {colorMode==='solid' && (
            <ColorPicker value={currentColor??'#4287f5'} onChange={hex=>onChange('color',hex)} isDark={isDark} />
          )}
          {colorMode==='original' && (
            <div style={{ padding:'6px 12px 10px', fontSize:10, color:labelColor }}>Оригинальные цвета компонента</div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Universal Sidebar ─────────────────────────────────────────────────────────

const UniversalSidebar: React.FC<{
  universalProps: UniversalProps;
  onChange: (key: keyof UniversalProps, v: PropValue) => void;
  isDark: boolean;
}> = ({ universalProps, onChange, isDark }) => (
  <div>
    <ColorSection universalProps={universalProps} onChange={onChange} isDark={isDark} />
    {FIELD_GROUPS.map((group, gi) => (
      <SidebarSection key={gi} label={group.label} defaultOpen={gi===0} isDark={isDark}>
        {group.fields.map(f => (
          <SidebarRow
            key={f.key} label={f.label} fieldKey={f.key}
            min={f.min} max={f.max} step={f.step} defaultVal={f.default}
            universalProps={universalProps} onChange={onChange} isDark={isDark}
          />
        ))}
      </SidebarSection>
    ))}
  </div>
);

// ─── AiSelect ─────────────────────────────────────────────────────────────────

const AiSelect: React.FC<{
  label: string; value: string; options: string[];
  onChange: (v: string) => void; isDark: boolean;
}> = ({ label, value, options, onChange, isDark }) => {
  const [open, setOpen] = useState(false);
  const [hov, setHov]   = useState<string | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [dropUp, setDropUp] = useState(false);
  const [w, setW] = useState(0);
  const ref   = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { const t=e.target as Node; if(!ref.current?.contains(t)&&!pRef.current?.contains(t)) setOpen(false); };
    document.addEventListener('mousedown',h); return ()=>document.removeEventListener('mousedown',h);
  }, [open]);

  const computeDropUp = (r: DOMRect) => { const h=Math.min(options.length*34+48,240); return globalThis.window.innerHeight-r.bottom<h && r.top>h; };

  useEffect(() => {
    if (!open||!btnRef.current) return;
    const upd=()=>{ if(!btnRef.current)return; const r=btnRef.current.getBoundingClientRect(); setRect(r);setW(r.width);setDropUp(computeDropUp(r)); };
    upd(); globalThis.window.addEventListener('scroll',upd,true); globalThis.window.addEventListener('resize',upd);
    return ()=>{ globalThis.window.removeEventListener('scroll',upd,true); globalThis.window.removeEventListener('resize',upd); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open,options.length]);

  const border     = tc(isDark,'rgba(255,255,255,0.1)','rgba(0,0,0,0.1)');
  const bg         = tc(isDark,'rgba(255,255,255,0.07)','rgba(0,0,0,0.06)');
  const labelColor = tc(isDark,'rgba(255,255,255,0.5)','rgba(0,0,0,0.5)');
  const textColor  = tc(isDark,'rgba(255,255,255,0.85)','rgba(0,0,0,0.85)');
  const rowHov     = tc(isDark,'rgba(255,255,255,0.06)','rgba(0,0,0,0.06)');
  const activeOptBg = tc(isDark,'rgba(255,255,255,0.08)','rgba(0,0,0,0.08)');

  return (
    <div style={{ padding:'6px 12px' }}>
      <div style={{ fontSize:10, fontWeight:600, color:labelColor, marginBottom:4, letterSpacing:'0.02em' }}>{label}</div>
      <div ref={ref} style={{ position:'relative' }}>
        <button ref={btnRef} onClick={()=>{ if(!btnRef.current)return; const r=btnRef.current.getBoundingClientRect(); setRect(r);setW(r.width);setDropUp(computeDropUp(r));setOpen(v=>!v); }}
          style={{ width:'100%', display:'inline-flex', alignItems:'center', justifyContent:'space-between', padding:'5px 8px', borderRadius:6, border:`1px solid ${border}`, background:bg, color:textColor, fontSize:12, fontWeight:500, cursor:'pointer' }}
        >
          <span>{value}</span>
          <svg width="9" height="9" viewBox="0 0 10 10" style={{ opacity:0.4, transform:open?'rotate(180deg)':'none', transition:'transform 0.15s' }}>
            <path d="M2 3 L5 7 L8 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
        </button>
        {open && rect && createPortal(
          <>
            <style>{`@keyframes aiIn{from{opacity:0;transform:translateY(-4px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
            <div ref={pRef} style={{ position:'fixed', left:rect.left, width:w, zIndex:99999, background:tc(isDark,'#111','#e8e7e3'), border:`1px solid ${border}`, borderRadius:8, boxShadow:isDark?'0 8px 32px rgba(0,0,0,0.7)':'0 8px 32px rgba(0,0,0,0.12)', overflow:'auto', maxHeight:240, animation:'aiIn 0.13s ease', ...(dropUp?{bottom:globalThis.window.innerHeight-rect.top+4}:{top:rect.bottom+4}) }}>
              {options.map(opt=>(
                <button key={opt} onClick={()=>{onChange(opt);setOpen(false);}} onMouseEnter={()=>setHov(opt)} onMouseLeave={()=>setHov(null)}
                  style={{ display:'flex', alignItems:'center', width:'100%', padding:'6px 11px', fontSize:12, textAlign:'left', cursor:'pointer', border:'none', color:textColor, background:hov===opt?rowHov:opt===value?activeOptBg:'transparent' }}
                >
                  {opt===value&&<span style={{ marginRight:6, opacity:0.5 }}>✓</span>}
                  {opt}
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
      </div>
    </div>
  );
};

// ─── Specific Sidebar ──────────────────────────────────────────────────────────

const SpecificSidebar: React.FC<{
  config: ComponentConfig; componentProps: ComponentPropsMap;
  onChange: (name: string, v: PropValue) => void; isDark: boolean;
}> = ({ config, componentProps, onChange, isDark }) => {
  const labelColor = tc(isDark,'rgba(255,255,255,0.5)','rgba(0,0,0,0.5)');
  const border     = tc(isDark,'rgba(255,255,255,0.1)','rgba(0,0,0,0.1)');
  const bg         = tc(isDark,'rgba(255,255,255,0.07)','rgba(0,0,0,0.06)');
  const textColor  = tc(isDark,'rgba(255,255,255,0.85)','rgba(0,0,0,0.85)');
  const sectionBdr = tc(isDark,'rgba(255,255,255,0.07)','rgba(0,0,0,0.07)');

  const visibleProps = useMemo(() =>
    config.specificProps?.length
      ? config.props.filter((p: PropDefinition) => config.specificProps!.includes(p.name))
      : config.props,
  [config]);

  if (!visibleProps.length) return <div style={{ padding:'20px 12px', textAlign:'center', fontSize:12, color:labelColor }}>Нет специфических настроек</div>;

  return (
    <div>
      {visibleProps.map((prop: PropDefinition, i) => (
        <div key={prop.name} style={{ borderBottom: i < visibleProps.length-1 ? `1px solid ${sectionBdr}` : 'none' }}>
          {prop.control==='select' && (
            <AiSelect label={prop.description} value={typeof componentProps[prop.name]==='string'?componentProps[prop.name] as string:(prop.default as string??'')} options={prop.options??[]} onChange={v=>onChange(prop.name,v)} isDark={isDark} />
          )}
          {prop.control==='number' && (
            <div style={{ padding:'6px 12px' }}>
              <div style={{ fontSize:10, fontWeight:600, color:labelColor, marginBottom:4, letterSpacing:'0.02em' }}>{prop.description}</div>
              <SidebarNumberInput value={typeof componentProps[prop.name]==='number'?componentProps[prop.name] as number:(prop.default as number??0)} onChange={v=>onChange(prop.name,v)} min={prop.min??0} max={prop.max??100} step={prop.step??1} isDark={isDark} />
            </div>
          )}
          {prop.control!=='select' && prop.control!=='number' && (
            <div style={{ padding:'6px 12px' }}>
              <div style={{ fontSize:10, fontWeight:600, color:labelColor, marginBottom:4, letterSpacing:'0.02em' }}>{prop.description}</div>
              <input type="text" value={typeof componentProps[prop.name]==='string'?componentProps[prop.name] as string:(prop.default as string??'')} onChange={e=>onChange(prop.name,e.target.value)}
                style={{ width:'100%', padding:'4px 7px', borderRadius:6, border:`1px solid ${border}`, background:bg, color:textColor, fontSize:12, outline:'none', boxSizing:'border-box' }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Tab bar ───────────────────────────────────────────────────────────────────

const TabBar: React.FC<{ active: TabType; onSelect: (t: TabType) => void; isDark: boolean }> = ({ active, onSelect, isDark }) => {
  const border = tc(isDark,'rgba(255,255,255,0.08)','rgba(0,0,0,0.08)');
  const bg     = tc(isDark,'rgba(255,255,255,0.015)','rgba(0,0,0,0.015)');
  return (
    <div style={{ display:'flex', padding:'6px 12px', gap:4, borderBottom:`1px solid ${border}`, background:bg, flexShrink:0 }}>
      {(['universal','specific'] as TabType[]).map(tab => {
        const a = active===tab;
        return (
          <button key={tab} onClick={()=>onSelect(tab)} style={{
            flex:1, padding:'5px 8px', borderRadius:7,
            border:`1px solid ${a?tc(isDark,'rgba(255,255,255,0.15)','rgba(0,0,0,0.15)'):'transparent'}`,
            background:a?tc(isDark,'rgba(255,255,255,0.1)','rgba(0,0,0,0.08)'):'transparent',
            color:a?tc(isDark,'#fff','#000'):tc(isDark,'rgba(255,255,255,0.45)','rgba(0,0,0,0.45)'),
            fontSize:11, fontWeight:a?600:400, cursor:'pointer', transition:'all 0.14s', whiteSpace:'nowrap',
          }}>
            {tab==='universal'?'Общие':'Специфические'}
          </button>
        );
      })}
    </div>
  );
};

// ─── Icon button ───────────────────────────────────────────────────────────────

const IconBtn: React.FC<{
  onClick: () => void; title: string; label: string;
  isDark: boolean; children: React.ReactNode; active?: boolean;
}> = ({ onClick, title, label, isDark, children, active }) => {
  const border = active?tc(isDark,'rgba(255,255,255,0.2)','rgba(0,0,0,0.2)'):tc(isDark,'rgba(255,255,255,0.1)','rgba(0,0,0,0.14)');
  const bg     = active?tc(isDark,'rgba(255,255,255,0.1)','rgba(0,0,0,0.08)'):tc(isDark,'rgba(255,255,255,0.05)','rgba(0,0,0,0.04)');
  const bgHov  = tc(isDark,'rgba(255,255,255,0.12)','rgba(0,0,0,0.1)');
  const color  = active?tc(isDark,'#fff','#000'):tc(isDark,'rgba(255,255,255,0.65)','rgba(0,0,0,0.55)');
  return (
    <button onClick={onClick} title={title} style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2, padding:'5px 8px', minWidth:44, borderRadius:8, border:`1px solid ${border}`, background:bg, color, cursor:'pointer', transition:'all 0.14s', flexShrink:0 }}
      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=bgHov;(e.currentTarget as HTMLButtonElement).style.color=tc(isDark,'#fff','#000');}}
      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background=bg;(e.currentTarget as HTMLButtonElement).style.color=color;}}
    >
      {children}
      <span style={{ fontSize:9, fontWeight:500, lineHeight:1, whiteSpace:'nowrap' }}>{label}</span>
    </button>
  );
};

// ─── Component render ──────────────────────────────────────────────────────────

interface ComponentRenderProps {
  Component: AnyComponent; componentProps: ComponentPropsMap;
  universalProps: UniversalProps; refreshKey: number; isDark: boolean;
}

const ComponentRender: React.FC<ComponentRenderProps> = ({ Component, componentProps, universalProps, refreshKey, isDark }) => (
  <ComponentWrapper {...universalProps} className="w-full h-full">
    <Suspense fallback={<div style={{ color:tc(isDark,'rgba(255,255,255,0.4)','rgba(0,0,0,0.4)'), fontSize:13 }}>Загрузка...</div>}>
      <Component key={refreshKey} {...componentProps} />
    </Suspense>
  </ComponentWrapper>
);

// ─── Settings Content ──────────────────────────────────────────────────────────

const SettingsContent: React.FC<{
  activeTab: TabType; onTabSelect: (t: TabType) => void;
  config: ComponentConfig; componentProps: ComponentPropsMap;
  universalProps: UniversalProps;
  onPropChange: (name: string, v: PropValue) => void;
  onUniversalChange: (key: keyof UniversalProps, v: PropValue) => void;
  isDark: boolean;
}> = ({ activeTab, onTabSelect, config, componentProps, universalProps, onPropChange, onUniversalChange, isDark }) => (
  <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
    <TabBar active={activeTab} onSelect={onTabSelect} isDark={isDark} />
    <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', WebkitOverflowScrolling:'touch' }}>
      {activeTab==='universal'
        ? <UniversalSidebar universalProps={universalProps} onChange={onUniversalChange} isDark={isDark} />
        : <SpecificSidebar config={config} componentProps={componentProps} onChange={onPropChange} isDark={isDark} />
      }
    </div>
  </div>
);

// ─── Preview panel ─────────────────────────────────────────────────────────────

const PreviewPanel: React.FC<ComponentRenderProps & {
  config: ComponentConfig;
  onRefresh: () => void; onFullscreen: () => void; onOpenSettings: () => void;
}> = ({ config, Component, componentProps, universalProps, refreshKey, isDark, onRefresh, onFullscreen, onOpenSettings }) => {
  const border   = tc(isDark,'rgba(255,255,255,0.09)','rgba(0,0,0,0.09)');
  const bg       = tc(isDark,'#0a0a0a','#E8E7E3');
  const headerBg = tc(isDark,'rgba(255,255,255,0.025)','rgba(0,0,0,0.025)');
  return (
    <div style={{ borderRadius:12, border:`1px solid ${border}`, background:bg, overflow:'hidden', margin:'1.5rem 0' }}>
      <div style={{ display:'flex', alignItems:'center', padding:'7px 11px', borderBottom:`1px solid ${border}`, background:headerBg, gap:6, flexWrap:'wrap', rowGap:4 }}>
        <div style={{ fontSize:13, fontWeight:600, color:tc(isDark,'rgba(255,255,255,0.85)','rgba(0,0,0,0.85)'), padding:'3px 9px', borderRadius:7, background:tc(isDark,'rgba(255,255,255,0.06)','rgba(0,0,0,0.06)'), border:`1px solid ${border}`, flexShrink:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0, maxWidth:200 }}>
          {config.name}
        </div>
        <div style={{ flex:1, minWidth:8 }} />
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          <IconBtn onClick={onRefresh} title="Перезапустить" label="Заново" isDark={isDark}><Play size={13} /></IconBtn>
          <IconBtn onClick={onFullscreen} title="Полный экран с редактором" label="Развернуть" isDark={isDark}><Maximize2 size={13} /></IconBtn>
          <IconBtn onClick={onOpenSettings} title="Настройки" label="Настройки" isDark={isDark}><Settings size={13} /></IconBtn>
        </div>
      </div>
      <div style={{ minHeight:380, display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
        <ComponentRender Component={Component} componentProps={componentProps} universalProps={universalProps} refreshKey={refreshKey} isDark={isDark} />
      </div>
    </div>
  );
};

// ─── Settings panel ────────────────────────────────────────────────────────────

const SettingsPanel: React.FC<ComponentRenderProps & {
  config: ComponentConfig; onClose: () => void;
  onPropChange: (name: string, v: PropValue) => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  onRefresh: () => void; onReset: () => void;
}> = (props) => {
  const { isDark, config, onClose, onRefresh, onReset } = props;
  const [activeTab, setActiveTab] = useState<TabType>('universal');
  const border   = tc(isDark,'rgba(255,255,255,0.09)','rgba(0,0,0,0.09)');
  const bg       = tc(isDark,'#0a0a0a','#E8E7E3');
  const footerBg = tc(isDark,'rgba(255,255,255,0.025)','rgba(0,0,0,0.025)');
  return (
    <div style={{ borderRadius:12, border:`1px solid ${border}`, background:bg, display:'flex', flexDirection:'column', margin:'1.5rem 0', maxHeight:'calc(100dvh - 3rem)', overflow:'hidden' }}>
      <div style={{ minHeight:220, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', padding:20, borderBottom:`1px solid ${border}` }}>
        <ComponentRender Component={props.Component} componentProps={props.componentProps} universalProps={props.universalProps} refreshKey={props.refreshKey} isDark={isDark} />
      </div>
      <SettingsContent activeTab={activeTab} onTabSelect={setActiveTab} config={config} componentProps={props.componentProps} universalProps={props.universalProps} onPropChange={props.onPropChange} onUniversalChange={props.onUniversalPropChange} isDark={isDark} />
      <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderTop:`1px solid ${border}`, background:footerBg, flexWrap:'wrap', rowGap:6 }}>
        <IconBtn onClick={onRefresh} title="Перезапустить" label="Заново" isDark={isDark}><Play size={13} /></IconBtn>
        <IconBtn onClick={onReset} title="Сбросить всё" label="Сбросить" isDark={isDark}><RefreshCcw size={13} /></IconBtn>
        <div style={{ flex:1 }} />
        <IconBtn onClick={onClose} title="Закрыть" label="Закрыть" isDark={isDark}><X size={13} /></IconBtn>
      </div>
    </div>
  );
};

// ─── Mobile Bottom Sheet ───────────────────────────────────────────────────────

interface MobileBottomSheetProps {
  config: ComponentConfig;
  componentProps: ComponentPropsMap;
  universalProps: UniversalProps;
  onPropChange: (name: string, v: PropValue) => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  isDark: boolean;
}

const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  config, componentProps, universalProps, onPropChange, onUniversalPropChange, isDark,
}) => {
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const border  = tc(isDark, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)');
  const bg      = tc(isDark, '#0d0d0d', '#dddcd8');
  const navBg   = tc(isDark, '#111', '#e0dfdb');
  const labelClr = tc(isDark, 'rgba(255,255,255,0.5)', 'rgba(0,0,0,0.5)');

  const SHEET_HEIGHT = '65dvh';

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'universal', label: 'Общие' },
    { id: 'specific',  label: 'Специфические' },
  ];

  const isOpen = activeTab !== null;

  return (
    <>
      {isOpen && (
        <div
          onClick={() => setActiveTab(null)}
          style={{ position:'absolute', inset:0, zIndex:10 }}
        />
      )}

      <div style={{
        position: 'absolute',
        bottom: 52,
        left: 0, right: 0,
        height: isOpen ? SHEET_HEIGHT : 0,
        overflow: 'hidden',
        transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          flex: 1,
          background: bg,
          borderTop: `1px solid ${border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ display:'flex', justifyContent:'center', padding:'8px 0 4px', flexShrink:0 }}>
            <div style={{ width:36, height:4, borderRadius:2, background:tc(isDark,'rgba(255,255,255,0.2)','rgba(0,0,0,0.15)') }} />
          </div>

          <div style={{ padding:'0 16px 8px', fontSize:12, fontWeight:600, color:labelClr, flexShrink:0 }}>
            {activeTab === 'universal' ? 'Общие настройки' : 'Специфические настройки'}
          </div>

          <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch' }}>
            {activeTab === 'universal' && (
              <UniversalSidebar universalProps={universalProps} onChange={onUniversalPropChange} isDark={isDark} />
            )}
            {activeTab === 'specific' && (
              <SpecificSidebar config={config} componentProps={componentProps} onChange={onPropChange} isDark={isDark} />
            )}
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 52,
        background: navBg,
        borderTop: `1px solid ${border}`,
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 30,
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(isActive ? null : tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                border: 'none',
                background: isActive ? tc(isDark,'rgba(255,255,255,0.07)','rgba(0,0,0,0.06)') : 'transparent',
                color: isActive ? tc(isDark,'#fff','#000') : labelClr,
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.14s',
                borderTop: isActive ? `2px solid ${tc(isDark,'rgba(255,255,255,0.6)','rgba(0,0,0,0.5)')}` : '2px solid transparent',
              }}
            >
              {tab.id === 'universal'
                ? (isOpen && isActive ? <ChevronDown size={15} /> : <Settings size={15} />)
                : (isOpen && isActive ? <ChevronDown size={15} /> : <PanelRight size={15} />)
              }
              {tab.label}
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
  onReset: () => void;
}> = ({ Component, componentProps, universalProps, refreshKey, isDark, config, onClose, onRefresh, onPropChange, onUniversalPropChange, onReset }) => {
  const [activeTab, setActiveTab] = useState<TabType>('universal');
  const [panelOpen, setPanelOpen] = useState(true);
  const isMobile = useIsMobile(); // ← shared hook

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key==='Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow=''; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const border   = tc(isDark,'rgba(255,255,255,0.08)','rgba(0,0,0,0.08)');
  const bg       = tc(isDark,'#0a0a0a','#E8E7E3');
  const headerBg = tc(isDark,'rgba(255,255,255,0.02)','rgba(0,0,0,0.02)');
  const panelBg  = tc(isDark,'#0d0d0d','#dddcd8');
  const PANEL_W  = 280;

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:bg, display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', flexShrink:0, borderBottom:`1px solid ${border}`, background:headerBg }}>
        <div style={{ fontSize:13, fontWeight:600, color:tc(isDark,'rgba(255,255,255,0.7)','rgba(0,0,0,0.7)'), padding:'3px 9px', borderRadius:7, background:tc(isDark,'rgba(255,255,255,0.06)','rgba(0,0,0,0.06)'), border:`1px solid ${border}`, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140 }}>
          {config.name}
        </div>
        <div style={{ flex:1 }} />
        <IconBtn onClick={onRefresh} title="Перезапустить" label="Заново" isDark={isDark}><Play size={13} /></IconBtn>
        <IconBtn onClick={onReset} title="Сбросить" label="Сбросить" isDark={isDark}><RefreshCcw size={13} /></IconBtn>

        {!isMobile && (
          <>
            <div style={{ width:1, height:22, background:border, margin:'0 2px', flexShrink:0 }} />
            <IconBtn onClick={()=>setPanelOpen(v=>!v)} title={panelOpen?'Скрыть панель':'Показать панель'} label={panelOpen?'Скрыть':'Панель'} isDark={isDark} active={panelOpen}>
              {panelOpen?<PanelRightClose size={13}/>:<PanelRight size={13}/>}
            </IconBtn>
          </>
        )}

        <IconBtn onClick={onClose} title="Свернуть (Esc)" label="Свернуть" isDark={isDark}><Minimize2 size={13} /></IconBtn>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '24px 16px' : 48,
          overflow: 'auto',
          paddingBottom: isMobile ? 68 : undefined,
        }}>
          <ComponentRender Component={Component} componentProps={componentProps} universalProps={universalProps} refreshKey={refreshKey} isDark={isDark} />
        </div>

        {!isMobile && panelOpen && (
          <div style={{ width:PANEL_W, flexShrink:0, borderLeft:`1px solid ${border}`, background:panelBg, display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <SettingsContent
              activeTab={activeTab} onTabSelect={setActiveTab}
              config={config} componentProps={componentProps}
              universalProps={universalProps}
              onPropChange={onPropChange}
              onUniversalChange={onUniversalPropChange}
              isDark={isDark}
            />
          </div>
        )}

        {isMobile && (
          <MobileBottomSheet
            config={config}
            componentProps={componentProps}
            universalProps={universalProps}
            onPropChange={onPropChange}
            onUniversalPropChange={onUniversalPropChange}
            isDark={isDark}
          />
        )}
      </div>
    </div>,
    document.body,
  );
};

// ─── Root ──────────────────────────────────────────────────────────────────────

const UIComponentViewer: React.FC<{ componentId: string }> = ({ componentId }) => {
  const { isDark } = useTheme();
  const [settingsOpen, setSettingsOpen]     = useState(false);
  const [isFullscreen, setIsFullscreen]     = useState(false);
  const [refreshKey, setRefreshKey]         = useState(0);
  const [componentProps, setComponentProps] = useState<ComponentPropsMap>({});
  const [universalProps, setUniversalProps] = useState<UniversalProps>(DEFAULT_UNIVERSAL_PROPS);
  const [componentData, setComponentData]   = useState<LoadedComponentData | null>(null);

  useEffect(() => {
    loadComponent(componentId).then(data => {
      if (data) { setComponentData(data); setComponentProps(getDefaultProps(data.config)); }
    });
  }, [componentId]);

  const handleRefresh         = useCallback(() => setRefreshKey(k=>k+1), []);
  const handlePropChange      = useCallback((name: string, value: PropValue) => setComponentProps(prev=>({...prev,[name]:value})), []);
  const handleUniversalChange = useCallback((key: keyof UniversalProps, value: PropValue) => setUniversalProps(prev=>({...prev,[key]:value})), []);
  const handleReset           = useCallback(() => {
    if (!componentData) return;
    setComponentProps(getDefaultProps(componentData.config));
    setUniversalProps(DEFAULT_UNIVERSAL_PROPS);
    setRefreshKey(k=>k+1);
  }, [componentData]);

  if (!componentData) {
    return (
      <div style={{ padding:'18px 24px', borderRadius:10, margin:'1.5rem 0', border:`1px solid ${tc(isDark,'rgba(255,255,255,0.09)','rgba(0,0,0,0.09)')}`, color:tc(isDark,'rgba(255,255,255,0.35)','rgba(0,0,0,0.35)'), fontSize:13, textAlign:'center' }}>
        Загрузка компонента…
      </div>
    );
  }

  const shared = { Component:componentData.Component, componentProps, universalProps, refreshKey, isDark };

  return (
    <>
      {settingsOpen ? (
        <SettingsPanel {...shared} config={componentData.config}
          onClose={()=>setSettingsOpen(false)}
          onPropChange={handlePropChange}
          onUniversalPropChange={handleUniversalChange}
          onRefresh={handleRefresh} onReset={handleReset}
        />
      ) : (
        <PreviewPanel {...shared} config={componentData.config}
          onRefresh={handleRefresh}
          onFullscreen={()=>setIsFullscreen(true)}
          onOpenSettings={()=>setSettingsOpen(true)}
        />
      )}

      {isFullscreen && (
        <FullscreenModal {...shared} config={componentData.config}
          onClose={()=>setIsFullscreen(false)}
          onRefresh={handleRefresh}
          onPropChange={handlePropChange}
          onUniversalPropChange={handleUniversalChange}
          onReset={handleReset}
        />
      )}
    </>
  );
};

export default UIComponentViewer;