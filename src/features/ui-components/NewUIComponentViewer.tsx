import React, {
  useState, useCallback, Suspense, useEffect, useMemo, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/shared/contexts/useTheme';
import {
  Minimize2, Play, RefreshCcw, Copy, Check,
  Settings, PanelRight,
  X, Code2, Move, EyeOff, RotateCcw, FileCode2,
  ChevronDown, ChevronRight,
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
// Только appearance и code — цвет убран
type TabType = 'appearance' | 'transform' | 'code';

interface LoadedComponentData {
  config: ComponentConfig;
  Component: AnyComponent;
  fileContents: Record<string, string>;
}

// ─── Токены, максимально близкие к Navigation ────────────────────────────────

function tk(isDark: boolean) {
  const t = makeTokens(isDark);
  return {
    // Рейл + панель
    railBg:         isDark ? '#0F0F0F' : '#dddcd8',
    panelBg:        isDark ? '#0F0F0F' : '#dddcd8',
    surfaceBg:      isDark ? '#141414' : '#d5d4d0',
    outerBg:        t.bg,
    border:         isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
    borderStrong:   isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.18)',
    fg:             isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
    fgMuted:        isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    fgSub:          isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.30)',
    // Кнопки рейла
    btnBg:          isDark ? 'transparent' : 'transparent',
    btnBdr:         'transparent',
    btnHov:         isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    btnClr:         isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    btnActBg:       isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)',
    btnActBdr:      isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
    btnActClr:      isDark ? '#ffffff' : '#000000',
    // Инпуты
    inpBg:          isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    inpBdr:         isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
    inpClr:         isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
    // Акцент
    accent:         t.accent,
    accentSoft:     t.accentSoft,
    // Тени
    shadow:         isDark
      ? '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 8px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.07)',
    // Ширина рейла — как в Navigation
    railW: 64,
    panelW: 280,
    mobBg: isDark ? '#0F0F0F' : '#dcdbd7',
  };
}

type T = ReturnType<typeof tk>;

// ─── Кнопка рейла — точная копия RailBtn из Navigation ───────────────────────

const RailBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  t: T;
  onClick: () => void;
  title?: string;
}> = ({ icon, label, isActive, t, onClick, title }) => {
  const [hov, setHov] = useState(false);
  const color = isActive ? t.btnActClr : hov ? t.fg : t.btnClr;
  return (
    <button
      onClick={onClick}
      title={title ?? label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: t.railW - 8,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 5, padding: '10px 4px',
        border: `1px solid ${isActive ? t.btnActBdr : 'transparent'}`,
        background: isActive ? t.btnActBg : hov ? t.btnHov : 'transparent',
        color,
        cursor: 'pointer', borderRadius: 12, flexShrink: 0,
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 500, lineHeight: 1.1, letterSpacing: '0.01em', textAlign: 'center' }}>{label}</span>
    </button>
  );
};

// ─── PanelHeader — как в Navigation ──────────────────────────────────────────

const PanelHeader: React.FC<{
  title: string;
  description?: string;
  t: T;
  onClose?: () => void;
}> = ({ title, description, t, onClose }) => (
  <div style={{
    flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '11px 14px 9px',
    borderBottom: `1px solid ${t.border}`,
  }}>
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.fg }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: 10, color: t.fgSub, marginTop: 2 }}>{description}</div>
      )}
    </div>
    {onClose && (
      <button
        onClick={onClose}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 24, height: 24, borderRadius: 6,
          border: 'none', background: 'transparent', color: t.fgMuted, cursor: 'pointer',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.fg; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted; }}
      >
        <X size={13} />
      </button>
    )}
  </div>
);

// ─── AccordionSection ─────────────────────────────────────────────────────────

const AccordionSection: React.FC<{
  label: string;
  defaultOpen?: boolean;
  t: T;
  children: React.ReactNode;
}> = ({ label, defaultOpen = true, t, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: `1px solid ${t.border}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.fgMuted }}>{label}</span>
        {open
          ? <ChevronDown size={11} style={{ color: t.fgSub }} />
          : <ChevronRight size={11} style={{ color: t.fgSub }} />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

// ─── NumberInput ──────────────────────────────────────────────────────────────

function getDecimalPlaces(step: number): number {
  if (step >= 1)   return 0;
  if (step >= 0.1) return 1;
  return 2;
}

const NumberInput: React.FC<{
  value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; t: T;
}> = ({ value, onChange, min, max, step, t }) => {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw]         = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const commit = () => {
    const n = Number.parseFloat(raw);
    if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
    setEditing(false);
  };
  const places = getDecimalPlaces(step);
  const numStr = places > 0 ? value.toFixed(places) : String(Math.round(value));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: t.accent, cursor: 'pointer', height: 3, minWidth: 0 }}
      />
      {editing ? (
        <input
          ref={inputRef} type="number" value={raw} min={min} max={max} step={step}
          onChange={e => setRaw(e.target.value)} onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          style={{
            width: 46, padding: '2px 4px', borderRadius: 5,
            border: `1px solid ${t.inpBdr}`, background: t.inpBg,
            color: t.inpClr, fontSize: 11, textAlign: 'center', outline: 'none',
            fontFamily: 'ui-monospace,monospace', flexShrink: 0,
          }}
        />
      ) : (
        <button
          onClick={() => { setRaw(String(value)); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); }}
          style={{
            width: 46, padding: '2px 4px', borderRadius: 5,
            border: `1px solid ${t.inpBdr}`, background: t.inpBg,
            color: t.inpClr, fontSize: 11, textAlign: 'center', cursor: 'pointer',
            fontFamily: 'ui-monospace,monospace', flexShrink: 0,
          }}
        >
          {numStr}
        </button>
      )}
    </div>
  );
};

// ─── FieldRow — теперь с ВИДИМОЙ кнопкой «Сбросить» ─────────────────────────

const FieldRow: React.FC<{
  label: string;
  fieldKey: keyof UniversalProps;
  min: number; max: number; step: number; defaultVal: number;
  universalProps: UniversalProps;
  onChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = ({ label, fieldKey, min, max, step, defaultVal, universalProps, onChange, t }) => {
  const val       = (universalProps[fieldKey] as number) ?? defaultVal;
  const isChanged = Math.abs(val - defaultVal) > 0.001;
  return (
    <div style={{ padding: '7px 14px', borderBottom: `1px solid ${t.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: t.fg }}>{label}</span>
        {/* Кнопка «Сбросить» — всегда видна когда значение изменено */}
        {isChanged && (
          <button
            onClick={() => onChange(fieldKey, defaultVal)}
            title="Сбросить"
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 7px', borderRadius: 5,
              border: `1px solid ${t.borderStrong}`,
              background: t.inpBg,
              color: t.fgMuted,
              fontSize: 10, fontWeight: 600, cursor: 'pointer',
              transition: 'color 0.1s, background 0.1s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = t.fg;
              (e.currentTarget as HTMLButtonElement).style.background = t.btnHov;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted;
              (e.currentTarget as HTMLButtonElement).style.background = t.inpBg;
            }}
          >
            <RotateCcw size={9} />
            Сбросить
          </button>
        )}
      </div>
      <NumberInput value={val} onChange={v => onChange(fieldKey, v)} min={min} max={max} step={step} t={t} />
    </div>
  );
};

// ─── Группы полей ─────────────────────────────────────────────────────────────

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

// ─── UniversalSidebar — цвет убран ────────────────────────────────────────────

const UniversalSidebar: React.FC<{
  section: 'appearance' | 'transform';
  universalProps: UniversalProps;
  onChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = ({ section, universalProps, onChange, t }) => {
  const group = UNIVERSAL_FIELD_GROUPS[section];
  return (
    <div>
      <AccordionSection label={group.label} defaultOpen t={t}>
        {group.fields.map(f => (
          <FieldRow
            key={f.key} label={f.label} fieldKey={f.key}
            min={f.min} max={f.max} step={f.step} defaultVal={f.default}
            universalProps={universalProps} onChange={onChange} t={t}
          />
        ))}
      </AccordionSection>
    </div>
  );
};

// ─── hljs ─────────────────────────────────────────────────────────────────────

hljs.registerLanguage('typescript', tsLanguage);
hljs.registerLanguage('tsx', tsLanguage);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('jsx', javascript);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('json', jsonLanguage);

function languageFromFile(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'ts')   return 'typescript';
  if (ext === 'tsx')  return 'tsx';
  if (ext === 'js')   return 'javascript';
  if (ext === 'jsx')  return 'jsx';
  if (ext === 'css')  return 'css';
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

const HLJS_THEME = `
.uiv-code .hljs-keyword,.uiv-code .hljs-selector-tag,.uiv-code .hljs-title.function_ { color: #c084fc; }
.uiv-code .hljs-string,.uiv-code .hljs-attr,.uiv-code .hljs-template-string { color: #86efac; }
.uiv-code .hljs-number,.uiv-code .hljs-literal { color: #fbbf24; }
.uiv-code .hljs-comment { color: #64748b; font-style: italic; }
.uiv-code .hljs-title.class_,.uiv-code .hljs-built_in,.uiv-code .hljs-type { color: #67e8f9; }
.uiv-code .hljs-tag,.uiv-code .hljs-name { color: #fb7185; }
`;

// ─── SourceCodePanel — split view: слева превью, справа код ──────────────────
// Используется внутри FullscreenDesktop: принимает children (превью) снаружи.

const SourceCodeEditor: React.FC<{
  fileContents: Record<string, string>;
  t: T;
}> = ({ fileContents, t }) => {
  const files = useMemo(() => Object.entries(fileContents), [fileContents]);
  const initialDrafts = useMemo(() => Object.fromEntries(files), [files]);
  const [activeFile, setActiveFile] = useState(files[0]?.[0] ?? '');
  const [drafts, setDrafts]         = useState<Record<string, string>>(initialDrafts);
  const [copied, setCopied]         = useState(false);

  useEffect(() => {
    setDrafts(initialDrafts);
    setActiveFile(files[0]?.[0] ?? '');
  }, [files, initialDrafts]);

  const activeCode    = drafts[activeFile] ?? '';
  const originalCode  = fileContents[activeFile] ?? '';
  const isDirty       = activeCode !== originalCode;
  const highlighted   = useMemo(() => highlightCode(activeCode, activeFile), [activeCode, activeFile]);

  const copyCode = async () => {
    if (!activeCode) return;
    await navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  if (files.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fgMuted, fontSize: 13 }}>
        Исходный код недоступен
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <style>{HLJS_THEME}</style>

      {/* Тулбар */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderBottom: `1px solid ${t.border}`,
        background: t.surfaceBg, flexShrink: 0, flexWrap: 'wrap',
      }}>
        {/* Вкладки файлов */}
        <div style={{ display: 'flex', gap: 4, flex: 1, overflow: 'hidden', flexWrap: 'wrap' }}>
          {files.map(([name]) => {
            const isActive = name === activeFile;
            const dirty    = (drafts[name] ?? '') !== (fileContents[name] ?? '');
            return (
              <button
                key={name}
                onClick={() => setActiveFile(name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 7,
                  border: `1px solid ${isActive ? t.borderStrong : t.border}`,
                  background: isActive ? t.btnActBg : 'transparent',
                  color: isActive ? t.fg : t.fgMuted,
                  fontSize: 11, fontFamily: 'ui-monospace, monospace',
                  cursor: 'pointer', flexShrink: 0,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <FileCode2 size={11} />
                <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                {dirty && <span style={{ color: t.accent, fontSize: 10 }}>●</span>}
              </button>
            );
          })}
        </div>

        {/* Кнопки действий */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={copyCode}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7,
              border: `1px solid ${copied ? t.accent + '55' : t.border}`,
              background: copied ? t.btnActBg : 'transparent',
              color: copied ? t.accent : t.fgMuted,
              fontSize: 11, cursor: 'pointer', fontWeight: 600,
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
          {isDirty && (
            <button
              onClick={() => setDrafts(prev => ({ ...prev, [activeFile]: originalCode }))}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 7,
                border: `1px solid ${t.borderStrong}`,
                background: t.inpBg, color: t.fg,
                fontSize: 11, cursor: 'pointer', fontWeight: 600,
              }}
            >
              <RotateCcw size={12} />
              Сбросить
            </button>
          )}
        </div>
        <span style={{ fontSize: 10, color: t.fgSub, flexShrink: 0 }}>Редактирование локальное</span>
      </div>

      {/* Редактор */}
      <div className="uiv-code" style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        <pre
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, margin: 0,
            padding: '16px 20px', overflow: 'auto',
            fontSize: 12.5, lineHeight: 1.65,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            color: t.fg, whiteSpace: 'pre', tabSize: 2,
            pointerEvents: 'none',
            background: t.outerBg,
          }}
        >
          <code dangerouslySetInnerHTML={{ __html: highlighted + (activeCode.endsWith('\n') ? ' ' : '') }} />
        </pre>
        <textarea
          aria-label={`Редактировать ${activeFile}`}
          value={activeCode}
          spellCheck={false}
          onChange={e => setDrafts(prev => ({ ...prev, [activeFile]: e.target.value }))}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            resize: 'none', border: 'none', outline: 'none',
            margin: 0, padding: '16px 20px',
            overflow: 'auto',
            fontSize: 12.5, lineHeight: 1.65,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            color: 'transparent', caretColor: t.accent,
            background: 'transparent',
            whiteSpace: 'pre', tabSize: 2,
          }}
        />
      </div>
    </div>
  );
};

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

const ComponentRender: React.FC<ComponentRenderProps> = ({
  Component, componentProps, universalProps, refreshKey, isDark, componentCategory,
}) => {
  const layoutMode = componentCategory === 'backgrounds' ? 'fill' : 'content';
  const isFill = layoutMode === 'fill';
  return (
    <div style={{
      width: '100%',
      height: isFill ? '100%' : 'auto',
      minWidth: 0, minHeight: 0,
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

// ─── FullscreenModal ──────────────────────────────────────────────────────────

type MobileSheet = 'appearance' | 'transform' | 'code' | null;

function useSheetDrag(initialVh: number) {
  const [sheetVh,    setSheetVh]    = useState(initialVh);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY  = useRef<number | null>(null);
  const dragStartVh = useRef(initialVh);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (dragStartY.current === null) return;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const delta   = dragStartY.current - clientY;
      const deltaVh = (delta / globalThis.innerHeight) * 100;
      setSheetVh(Math.max(10, Math.min(92, dragStartVh.current + deltaVh)));
    };
    const onUp = () => {
      if (dragStartY.current === null) return;
      dragStartY.current = null;
      setIsDragging(false);
    };
    globalThis.addEventListener('mousemove', onMove);
    globalThis.addEventListener('mouseup', onUp);
    globalThis.addEventListener('touchmove', onMove, { passive: true });
    globalThis.addEventListener('touchend', onUp);
    return () => {
      globalThis.removeEventListener('mousemove', onMove);
      globalThis.removeEventListener('mouseup', onUp);
      globalThis.removeEventListener('touchmove', onMove);
      globalThis.removeEventListener('touchend', onUp);
    };
  }, []);

  const startDrag = useCallback((clientY: number) => {
    dragStartY.current  = clientY;
    dragStartVh.current = sheetVh;
    setIsDragging(true);
  }, [sheetVh]);

  return { sheetVh, isDragging, startDrag };
}

// ─── FullscreenDesktop — главный layout ──────────────────────────────────────
// Структура: рейл (64px) | превью (flex) | панель настроек (280px) / код (flex)

const FullscreenDesktop: React.FC<ComponentRenderProps & {
  activeTab: TabType;
  panelOpen: boolean;
  onTabSelect: (tab: TabType) => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  onRefresh: () => void;
  onReset: () => void;
  onClose: () => void;
  t: T;
}> = ({
  Component, componentProps, universalProps, refreshKey, isDark, componentCategory,
  fileContents, activeTab, panelOpen,
  onTabSelect, onUniversalPropChange, onRefresh, onReset, onClose, t,
}) => {
  const isBackground = componentCategory === 'backgrounds';
  const isCode       = activeTab === 'code';

  const previewStyle: React.CSSProperties = isBackground
    ? { flex: 1, minWidth: 0, minHeight: 0, position: 'relative', overflow: 'hidden' }
    : { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, overflow: 'hidden', position: 'relative' };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Рейл — точная копия стиля Navigation ── */}
      <aside style={{
        width: t.railW, flexShrink: 0,
        background: t.railBg,
        borderRight: `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '8px 0', gap: 2, zIndex: 10,
      }}>
        <div style={{ width: t.railW, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Settings size={18} style={{ color: t.fgSub }} />
        </div>
        <RailBtn icon={<Play size={18} />}       label="Запуск"   t={t} onClick={onRefresh} />
        <RailBtn icon={<RefreshCcw size={18} />} label="Сброс"    t={t} onClick={onReset} />
        <div style={{ flex: 1 }} />
        <RailBtn
          icon={panelOpen ? <EyeOff size={18} /> : <PanelRight size={18} />}
          label={panelOpen ? 'Скрыть' : 'Настройки'}
          t={t}
          onClick={() => onTabSelect(activeTab === 'code' ? 'appearance' : activeTab)}
        />
        <RailBtn icon={<Minimize2 size={18} />}  label="Свернуть" t={t} onClick={onClose} />
      </aside>

      {/* ── Превью ── */}
      <div style={previewStyle} color={t.fg}>
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

      {/* ── Правая панель (настройки ИЛИ код) ── */}
      {panelOpen && !isCode && (
        <aside style={{
          width: t.panelW, flexShrink: 0,
          borderLeft: `1px solid ${t.border}`,
          background: t.panelBg,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Шапка с табами — как в DevPanel */}
          <div style={{
            display: 'flex', background: t.surfaceBg,
            borderBottom: `1px solid ${t.border}`,
            flexShrink: 0, padding: 4,
          }}>
            {([
              { id: 'appearance' as const, label: 'Внешний вид' },
              { id: 'transform'  as const, label: 'Трансформация' },
            ]).map(tab => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabSelect(tab.id)}
                  style={{
                    flex: 1, padding: '8px 6px', borderRadius: 8,
                    border: `1px solid ${active ? t.borderStrong : 'transparent'}`,
                    background: active ? t.btnActBg : 'transparent',
                    color: active ? t.fg : t.fgMuted,
                    fontSize: 11, fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
            <button
              onClick={() => onTabSelect('code')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '8px 10px', borderRadius: 8,
                border: '1px solid transparent',
                background: 'transparent',
                color: t.fgMuted,
                fontSize: 11, cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.fg; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted; }}
            >
              <Code2 size={13} />
              Код
            </button>
          </div>

          {/* Описание */}
          <div style={{
            padding: '10px 14px 8px',
            borderBottom: `1px solid ${t.border}`,
            flexShrink: 0,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.fgMuted }}>
              {activeTab === 'appearance' ? 'Внешний вид' : 'Трансформация'}
            </div>
            <div style={{ fontSize: 10, color: t.fgSub, marginTop: 2 }}>
              Только общие безопасные настройки предпросмотра.
            </div>
          </div>

          {/* Контент вкладки */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
            <UniversalSidebar
              section={activeTab as 'appearance' | 'transform'}
              universalProps={universalProps}
              onChange={onUniversalPropChange}
              t={t}
            />
          </div>
        </aside>
      )}

      {/* ── Code panel — split view: превью уже слева, тут только редактор ── */}
      {panelOpen && isCode && (
        <aside style={{
          // В режиме кода занимаем ~50% ширины — превью остаётся слева
          width: '50%', maxWidth: 720, flexShrink: 0,
          borderLeft: `1px solid ${t.border}`,
          background: t.panelBg,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', background: t.surfaceBg,
            borderBottom: `1px solid ${t.border}`,
            flexShrink: 0, padding: 4,
          }}>
            <button
              onClick={() => onTabSelect('appearance')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '8px 10px', borderRadius: 8,
                border: '1px solid transparent',
                background: 'transparent', color: t.fgMuted,
                fontSize: 11, cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = t.fg; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = t.fgMuted; }}
            >
              ← Настройки
            </button>
            <div style={{ flex: 1 }} />
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '8px 10px', borderRadius: 8,
                border: `1px solid ${t.borderStrong}`,
                background: t.btnActBg, color: t.fg,
                fontSize: 11, fontWeight: 600, cursor: 'default',
              }}
            >
              <Code2 size={13} />
              Код
            </button>
          </div>

          <SourceCodeEditor fileContents={fileContents} t={t} />
        </aside>
      )}
    </div>
  );
};

// ─── Мобильная версия ─────────────────────────────────────────────────────────

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

const FullscreenMobile: React.FC<ComponentRenderProps & {
  onClose: () => void;
  onRefresh: () => void;
  onReset: () => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = ({
  Component, componentProps, universalProps, refreshKey, isDark, componentCategory,
  fileContents, onClose, onRefresh, onReset, onUniversalPropChange, t,
}) => {
  const [mobSheet, setMobSheet] = useState<MobileSheet>(null);
  const { sheetVh, isDragging, startDrag } = useSheetDrag(55);
  const isBackground = componentCategory === 'backgrounds';
  const mobSheetOpen = mobSheet !== null;

  const LABELS: Record<Exclude<MobileSheet, null>, string> = {
    appearance: 'Внешний вид',
    transform:  'Трансформация',
    code:       'Исходный код',
  };

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, bottom: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: isBackground ? 'hidden' : 'visible' }}>
        <ComponentRender Component={Component} componentProps={componentProps} universalProps={universalProps} refreshKey={refreshKey} isDark={isDark} componentCategory={componentCategory} fileContents={fileContents} />
      </div>

      {mobSheetOpen && (
        <button
          onClick={() => setMobSheet(null)}
          aria-label="Закрыть"
          style={{ position: 'absolute', inset: 0, bottom: 60, zIndex: 10, background: 'rgba(0,0,0,0.25)', border: 'none', padding: 0 }}
        />
      )}

      <div style={{
        position: 'absolute', bottom: 60, left: 0, right: 0,
        height: mobSheetOpen ? `min(${sheetVh}dvh, 720px)` : 0,
        overflow: 'hidden', zIndex: 20, display: 'flex', flexDirection: 'column',
        transition: isDragging ? 'none' : 'height 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ flex: 1, background: t.panelBg, borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <button
            aria-label="Изменить высоту"
            onMouseDown={e => startDrag(e.clientY)}
            onTouchStart={e => startDrag(e.touches[0].clientY)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'ns-resize', touchAction: 'none', userSelect: 'none', width: '100%' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: t.fgSub }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 18px 10px', borderBottom: `1px solid ${t.border}` }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: t.fg }}>
                  {mobSheet ? LABELS[mobSheet] : ''}
                </span>
                <button onClick={() => setMobSheet(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10, border: `1px solid ${t.border}`, background: t.btnHov, color: t.fg, cursor: 'pointer', flexShrink: 0 }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          </button>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {(mobSheet === 'appearance' || mobSheet === 'transform') && (
              <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <UniversalSidebar section={mobSheet} universalProps={universalProps} onChange={onUniversalPropChange} t={t} />
              </div>
            )}
            {mobSheet === 'code' && (
              <SourceCodeEditor fileContents={fileContents} t={t} />
            )}
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
        background: t.mobBg, borderTop: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'stretch', zIndex: 30,
        paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
      }}>
        <MobBtn label="Обновить"  icon={<Play size={20} />}       t={t} onClick={() => { setMobSheet(null); onRefresh(); }}                              isActive={false} />
        <MobBtn label="Сбросить"  icon={<RefreshCcw size={20} />} t={t} onClick={() => { setMobSheet(null); onReset(); }}                                isActive={false} />
        <MobBtn label="Вид"       icon={<Settings size={20} />}   t={t} onClick={() => setMobSheet(p => p === 'appearance' ? null : 'appearance')}      isActive={mobSheet === 'appearance'} />
        <MobBtn label="Трансформ" icon={<Move size={20} />}       t={t} onClick={() => setMobSheet(p => p === 'transform'  ? null : 'transform')}       isActive={mobSheet === 'transform'} />
        <MobBtn label="Код"       icon={<Code2 size={20} />}      t={t} onClick={() => setMobSheet(p => p === 'code' ? null : 'code')}                  isActive={mobSheet === 'code'} />
        <MobBtn label="Свернуть"  icon={<Minimize2 size={20} />}  t={t} onClick={onClose}                                                               isActive={false} />
      </div>
    </>
  );
};

const FullscreenModal: React.FC<ComponentRenderProps & {
  onClose: () => void;
  onRefresh: () => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  onReset: () => void;
  t: T;
}> = ({ Component, componentProps, universalProps, refreshKey, isDark, componentCategory, fileContents, onClose, onRefresh, onUniversalPropChange, onReset, t }) => {
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [panelOpen, setPanelOpen] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const handleTabSelect = useCallback((tab: TabType) => {
    setActiveTab(tab);
    if (!panelOpen) setPanelOpen(true);
  }, [panelOpen]);

  const shared: ComponentRenderProps = {
    Component, componentProps, universalProps, refreshKey, isDark, componentCategory, fileContents,
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: t.outerBg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {!isMobile ? (
        <FullscreenDesktop
          {...shared}
          activeTab={activeTab}
          panelOpen={panelOpen}
          onTabSelect={handleTabSelect}
          onUniversalPropChange={onUniversalPropChange}
          onRefresh={onRefresh}
          onReset={onReset}
          onClose={onClose}
          t={t}
        />
      ) : (
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <FullscreenMobile
            {...shared}
            onClose={onClose}
            onRefresh={onRefresh}
            onReset={onReset}
            onUniversalPropChange={onUniversalPropChange}
            t={t}
          />
        </div>
      )}
    </div>,
    document.body,
  );
};

// ─── PreviewPanel — карточка на странице документации ───────────────────────

const PreviewPanel: React.FC<ComponentRenderProps & {
  onOpenFullscreen: () => void;
  t: T;
  loading: boolean;
}> = ({ Component, componentProps, universalProps, refreshKey, isDark, componentCategory, onOpenFullscreen, t, loading, fileContents }) => {
  const isBackground = componentCategory === 'backgrounds';
  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
      <button
        onClick={onOpenFullscreen}
        title="Настройки"
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 10,
          border: `1px solid ${t.borderStrong}`,
          background: t.railBg,
          color: t.fg,
          cursor: 'pointer',
          boxShadow: t.shadow,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = t.railBg; }}
      >
        <Settings size={17} />
      </button>

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
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, fontSize: 12, color: t.fgSub, fontFamily: 'ui-monospace, monospace' }}>
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
  requestAnimationFrame(() => requestAnimationFrame(() => setLoading(false)));
}

// ─── DEFAULT PROPS ────────────────────────────────────────────────────────────

const DEFAULT_UNIVERSAL_PROPS: UniversalProps = {
  enableUniversalProps: true,
  scale: 1, color: undefined, colorMode: 'original',
  offsetX: 0, offsetY: 0, rotateZ: 0,
  justifyContent: 'center', alignItems: 'center',
  opacity: 1, blur: 0, brightness: 1, contrast: 1, saturate: 1,
};

// ─── UIComponentViewer ────────────────────────────────────────────────────────

const UIComponentViewer: React.FC<{ componentId: string }> = ({ componentId }) => {
  const { isDark } = useTheme();
  const t = tk(isDark);

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
    if (!componentData) return;
    setComponentProps(getDefaultProps(componentData.config));
    setUniversalProps(DEFAULT_UNIVERSAL_PROPS);
    setRefreshKey(k => k + 1);
  }, [componentData]);

  const placeholderConfig: ComponentConfig = useMemo(() => ({
    id: componentId, name: '…', description: '', props: [], specificProps: [],
  }), [componentId]);
  const PlaceholderComponent = useMemo(() => () => null, []);

  const effectiveData = componentData ?? {
    config:       placeholderConfig,
    Component:    PlaceholderComponent as AnyComponent,
    fileContents: {},
  };

  const shared: ComponentRenderProps = {
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