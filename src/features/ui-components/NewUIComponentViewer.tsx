import React, {
  useState, useCallback, Suspense, useEffect, useMemo, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/shared/contexts/useTheme';
import {
  Minimize2, Play, RefreshCcw, Copy, Check,
  X, Code2, EyeOff, RotateCcw,
  ChevronDown, ChevronRight, Settings,
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
import { makeTokens } from '@/shared/tokens/theme';

type PropValue = string | number | boolean | string[] | undefined;
type ComponentPropsMap = Record<string, PropValue>;
type AnyComponent = React.ComponentType<Record<string, PropValue>>;
type TabType = 'settings' | 'code';

interface LoadedComponentData {
  config: ComponentConfig;
  Component: AnyComponent;
  fileContents: Record<string, string>;
}

// ─── Токены ───────────────────────────────────────────────────────────────────

function tk(isDark: boolean) {
  const t = makeTokens(isDark);
  return {
    railBg:       isDark ? '#0F0F0F' : '#dddcd8',
    panelBg:      isDark ? '#0F0F0F' : '#dddcd8',
    surfaceBg:    isDark ? '#141414' : '#d5d4d0',
    codeBg:       isDark ? '#0a0a0a' : '#e8e7e3',
    outerBg:      t.bg,
    border:       isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
    borderStrong: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.18)',
    fg:           isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
    fgMuted:      isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    fgSub:        isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)',
    btnHov:       isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    btnClr:       isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    btnActBg:     isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.09)',
    btnActBdr:    isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.16)',
    btnActClr:    isDark ? '#ffffff' : '#000000',
    inpBg:        isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    inpBdr:       isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
    inpClr:       isDark ? 'rgba(255,255,255,0.8)'  : 'rgba(0,0,0,0.8)',
    accent:       t.accent,
    accentSoft:   t.accentSoft,
    shadow:       isDark
      ? '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 8px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.07)',
    railW:  64,
    panelW: 280,
    mobBg:  isDark ? '#0F0F0F' : '#dcdbd7',
  };
}
type T = ReturnType<typeof tk>;

// ─── RailBtn — без серого фона, только цвет иконки/текста ─────────────────────

const RailBtn: React.FC<{
  icon: React.ReactNode; label: string; isActive?: boolean; t: T;
  onClick: () => void; title?: string;
}> = ({ icon, label, isActive, t, onClick, title }) => {
  const [hov, setHov] = useState(false);
  const color = isActive ? t.btnActClr : hov ? t.fg : t.btnClr;
  return (
    <button
      onClick={onClick} title={title ?? label}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: t.railW - 8,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 5, padding: '10px 4px',
        border: 'none',
        background: 'transparent',
        color, cursor: 'pointer', borderRadius: 12, flexShrink: 0,
        transition: 'color 0.12s',
      }}
    >
      <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 500, lineHeight: 1.1, letterSpacing: '0.01em', textAlign: 'center' }}>{label}</span>
    </button>
  );
};

// ─── AccordionSection ─────────────────────────────────────────────────────────

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
          padding: '9px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: t.fgMuted }}>{label}</span>
        {open ? <ChevronDown size={11} style={{ color: t.fgSub }} /> : <ChevronRight size={11} style={{ color: t.fgSub }} />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

// ─── NumberInput ──────────────────────────────────────────────────────────────

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

// ─── FieldRow ─────────────────────────────────────────────────────────────────

const FieldRow: React.FC<{
  label: string; fieldKey: keyof UniversalProps;
  min: number; max: number; step: number; defaultVal: number;
  universalProps: UniversalProps;
  onChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = ({ label, fieldKey, min, max, step, defaultVal, universalProps, onChange, t }) => {
  const val       = (universalProps[fieldKey] as number) ?? defaultVal;
  const isChanged = Math.abs(val - defaultVal) > 0.001;
  return (
    <div style={{ padding: '8px 14px', borderBottom: `1px solid ${t.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: t.fg }}>{label}</span>
        {isChanged && (
          <button
            onClick={() => onChange(fieldKey, defaultVal)}
            title="Сбросить"
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 8px', borderRadius: 5,
              border: `1px solid ${t.borderStrong}`,
              background: t.inpBg, color: t.fgMuted,
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
            <RotateCcw size={9} /> Сбросить
          </button>
        )}
      </div>
      <NumberInput value={val} onChange={v => onChange(fieldKey, v)} min={min} max={max} step={step} t={t} />
    </div>
  );
};

// ─── ALL_FIELDS ───────────────────────────────────────────────────────────────

const ALL_FIELDS: Array<{
  groupLabel: string;
  fields: Array<{ label: string; key: keyof UniversalProps; min: number; max: number; step: number; default: number }>;
}> = [
  {
    groupLabel: 'Внешний вид',
    fields: [
      { label: 'Прозрачность', key: 'opacity',    min: 0, max: 1,  step: 0.05, default: 1 },
      { label: 'Яркость',      key: 'brightness', min: 0, max: 2,  step: 0.05, default: 1 },
      { label: 'Контраст',     key: 'contrast',   min: 0, max: 2,  step: 0.05, default: 1 },
      { label: 'Насыщенность', key: 'saturate',   min: 0, max: 2,  step: 0.05, default: 1 },
      { label: 'Размытие',     key: 'blur',       min: 0, max: 20, step: 0.5,  default: 0 },
    ],
  },
  {
    groupLabel: 'Трансформация',
    fields: [
      { label: 'Масштаб',    key: 'scale',   min: 0.1,  max: 3,   step: 0.05, default: 1 },
      { label: 'Смещение X', key: 'offsetX', min: -500, max: 500, step: 1,    default: 0 },
      { label: 'Смещение Y', key: 'offsetY', min: -500, max: 500, step: 1,    default: 0 },
      { label: 'Вращение Z', key: 'rotateZ', min: -180, max: 180, step: 1,    default: 0 },
    ],
  },
];

const SettingsSidebar: React.FC<{
  universalProps: UniversalProps;
  onChange: (key: keyof UniversalProps, v: PropValue) => void;
  t: T;
}> = ({ universalProps, onChange, t }) => (
  <div style={{ overflowY: 'auto', flex: 1 }}>
    {ALL_FIELDS.map(group => (
      <AccordionSection key={group.groupLabel} label={group.groupLabel} defaultOpen t={t}>
        {group.fields.map(f => (
          <FieldRow
            key={String(f.key)} label={f.label} fieldKey={f.key}
            min={f.min} max={f.max} step={f.step} defaultVal={f.default}
            universalProps={universalProps} onChange={onChange} t={t}
          />
        ))}
      </AccordionSection>
    ))}
  </div>
);

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
  const lang = languageFromFile(fileName);
  if (hljs.getLanguage(lang)) {
    return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
  }
  return hljs.highlightAuto(code).value;
}

const HLJS_CSS = `
.uiv-hl .hljs-keyword,.uiv-hl .hljs-selector-tag,.uiv-hl .hljs-title.function_ { color:#c084fc }
.uiv-hl .hljs-string,.uiv-hl .hljs-attr,.uiv-hl .hljs-template-string { color:#86efac }
.uiv-hl .hljs-number,.uiv-hl .hljs-literal { color:#fbbf24 }
.uiv-hl .hljs-comment { color:#64748b; font-style:italic }
.uiv-hl .hljs-title.class_,.uiv-hl .hljs-built_in,.uiv-hl .hljs-type { color:#67e8f9 }
.uiv-hl .hljs-tag,.uiv-hl .hljs-name { color:#fb7185 }
`;

// ─── Live compilation via Babel standalone ────────────────────────────────────

let babelLoaded = false;
let babelLoading: Promise<void> | null = null;

async function ensureBabel(): Promise<void> {
  if (babelLoaded) return;
  if (babelLoading) return babelLoading;
  babelLoading = new Promise<void>((resolve, reject) => {
    if ((window as any).Babel) { babelLoaded = true; resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.10/babel.min.js';
    script.onload = () => { babelLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return babelLoading;
}

async function compileAndRender(code: string): Promise<AnyComponent | null> {
  try {
    await ensureBabel();
    const Babel = (window as any).Babel;
    if (!Babel) return null;

    // Transform TSX/TS to JS
    const result = Babel.transform(code, {
      presets: [
        ['react', { runtime: 'classic' }],
        ['typescript', { allExtensions: true, isTSX: true }],
      ],
      plugins: [],
    });

    if (!result?.code) return null;

    // Remove import statements, we'll provide deps manually
    let transformed = result.code
      .replace(/^import\s[^;]+;?\s*$/gm, '')
      .replace(/^export\s+default\s+/m, 'const __defaultExport = ')
      .replace(/^export\s+\{[^}]+\};?\s*$/gm, '');

    // Build factory function with common deps injected
    const factory = new Function(
      'React', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback',
      'useLayoutEffect', 'useReducer', 'useContext', 'useId',
      `
      "use strict";
      ${transformed}
      return typeof __defaultExport !== 'undefined' ? __defaultExport : null;
      `
    );

    const Component = factory(
      React,
      React.useState, React.useEffect, React.useRef, React.useMemo, React.useCallback,
      React.useLayoutEffect, React.useReducer, React.useContext, React.useId,
    );

    if (typeof Component === 'function') return Component as AnyComponent;
    return null;
  } catch (err) {
    console.warn('[LiveEdit] compile error:', err);
    return null;
  }
}

// ─── SourceCodeEditor ─────────────────────────────────────────────────────────

interface SourceCodeEditorProps {
  fileContents: Record<string, string>;
  t: T;
  onLiveComponent?: (comp: AnyComponent | null) => void;
}

const SourceCodeEditor: React.FC<SourceCodeEditorProps> = ({ fileContents, t, onLiveComponent }) => {
  const files = useMemo(() => Object.entries(fileContents), [fileContents]);
  const [activeFile, setActiveFile] = useState(() => files[0]?.[0] ?? '');
  const [drafts, setDrafts]         = useState<Record<string, string>>(() => Object.fromEntries(files));
  const [copied, setCopied]         = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling]   = useState(false);
  const compileTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when fileContents changes (new component loaded)
  useEffect(() => {
    const initial = Object.fromEntries(Object.entries(fileContents));
    setDrafts(initial);
    setActiveFile(Object.keys(fileContents)[0] ?? '');
    setCompileError(null);
    onLiveComponent?.(null); // reset to original
  }, [fileContents]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCode   = drafts[activeFile] ?? '';
  const originalCode = fileContents[activeFile] ?? '';
  const isDirty      = activeCode !== originalCode;

  const highlighted = useMemo(() => highlightCode(activeCode, activeFile), [activeCode, activeFile]);

  // Debounced live compile on code change
  useEffect(() => {
    if (!isDirty) {
      onLiveComponent?.(null);
      setCompileError(null);
      return;
    }
    // Only compile main component files (tsx/jsx/ts/js)
    const ext = activeFile.split('.').pop()?.toLowerCase() ?? '';
    if (!['tsx', 'jsx', 'ts', 'js'].includes(ext)) return;

    if (compileTimeout.current) clearTimeout(compileTimeout.current);
    compileTimeout.current = setTimeout(async () => {
      setIsCompiling(true);
      try {
        const comp = await compileAndRender(activeCode);
        if (comp) {
          setCompileError(null);
          onLiveComponent?.(comp);
        } else {
          setCompileError('Не удалось скомпилировать');
          onLiveComponent?.(null);
        }
      } catch (e: any) {
        setCompileError(e?.message ?? 'Ошибка компиляции');
        onLiveComponent?.(null);
      } finally {
        setIsCompiling(false);
      }
    }, 800);

    return () => {
      if (compileTimeout.current) clearTimeout(compileTimeout.current);
    };
  }, [activeCode, activeFile, isDirty]); // eslint-disable-line react-hooks/exhaustive-deps

  const copyCode = async () => {
    await navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const editorStyle: React.CSSProperties = {
    position:    'absolute',
    inset:       0,
    margin:      0,
    padding:     '16px 18px',
    fontSize:    12.5,
    lineHeight:  1.7,
    fontFamily:  '"Fira Code", "Cascadia Code", "JetBrains Mono", ui-monospace, monospace',
    tabSize:     2,
    whiteSpace:  'pre',
    overflowX:   'auto',
    overflowY:   'auto',
    wordBreak:   'normal' as const,
    boxSizing:   'border-box' as const,
  };

  if (files.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.fgMuted, fontSize: 13 }}>
        Исходный код недоступен
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <style>{`
        ${HLJS_CSS}
        /* Fix 3: прозрачный текст textarea — убираем видимое выделение */
        .uiv-editor-ta::selection { background: rgba(99,102,241,0.35); }
        .uiv-editor-ta::-moz-selection { background: rgba(99,102,241,0.35); }
      `}</style>

      {/* Тулбар */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        padding: '7px 10px', borderBottom: `1px solid ${t.border}`,
        background: t.surfaceBg, flexShrink: 0,
      }}>
        {/* Табы файлов — без иконок (Fix 4) */}
        <div style={{ display: 'flex', gap: 4, flex: 1, overflow: 'hidden' }}>
          {files.map(([name]) => {
            const isAct = name === activeFile;
            const dirty = (drafts[name] ?? '') !== (fileContents[name] ?? '');
            return (
              <button
                key={name} onClick={() => setActiveFile(name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 9px', borderRadius: 6,
                  border: `1px solid ${isAct ? t.borderStrong : t.border}`,
                  background: isAct ? t.btnActBg : 'transparent',
                  color: isAct ? t.fg : t.fgMuted,
                  fontSize: 11, fontFamily: 'ui-monospace,monospace',
                  cursor: 'pointer', fontWeight: isAct ? 600 : 400, flexShrink: 0,
                }}
              >
                {/* No icon — Fix 4 */}
                <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                {dirty && <span style={{ color: t.accent, marginLeft: 2, fontSize: 14, lineHeight: 1 }}>●</span>}
              </button>
            );
          })}
        </div>

        {/* Compile status */}
        {isCompiling && (
          <span style={{ fontSize: 10, color: t.fgMuted, fontFamily: 'ui-monospace,monospace' }}>компиляция…</span>
        )}
        {compileError && !isCompiling && (
          <span style={{ fontSize: 10, color: '#f87171', fontFamily: 'ui-monospace,monospace', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={compileError}>
            ✗ {compileError}
          </span>
        )}
        {isDirty && !isCompiling && !compileError && (
          <span style={{ fontSize: 10, color: '#4ade80', fontFamily: 'ui-monospace,monospace' }}>✓ применено</span>
        )}

        {/* Действия */}
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          <button
            onClick={copyCode}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 9px', borderRadius: 6,
              border: `1px solid ${copied ? t.accent + '66' : t.border}`,
              background: copied ? t.btnActBg : 'transparent',
              color: copied ? t.accent : t.fgMuted,
              fontSize: 11, cursor: 'pointer',
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
          {isDirty && (
            <button
              onClick={() => {
                setDrafts(prev => ({ ...prev, [activeFile]: originalCode }));
                onLiveComponent?.(null);
                setCompileError(null);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 9px', borderRadius: 6,
                border: `1px solid ${t.borderStrong}`,
                background: t.inpBg, color: t.fg,
                fontSize: 11, cursor: 'pointer', fontWeight: 600,
              }}
            >
              <RotateCcw size={11} /> Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Редактор */}
      <div
        className="uiv-hl"
        style={{ flex: 1, minHeight: 0, position: 'relative', background: t.codeBg, overflow: 'hidden' }}
      >
        {/* pre: подсветка синтаксиса */}
        <pre
          aria-hidden
          style={{
            ...editorStyle,
            color:          t.fg,
            background:     'transparent',
            pointerEvents:  'none',
            zIndex:         1,
            overflow:       'hidden',
          }}
        >
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>

        {/* textarea: прозрачный текст поверх */}
        <SyncedTextarea
          value={activeCode}
          onChange={val => setDrafts(prev => ({ ...prev, [activeFile]: val }))}
          editorStyle={editorStyle}
          t={t}
        />
      </div>
    </div>
  );
};

// ─── SyncedTextarea ───────────────────────────────────────────────────────────

const SyncedTextarea: React.FC<{
  value: string;
  onChange: (v: string) => void;
  editorStyle: React.CSSProperties;
  t: T;
}> = ({ value, onChange, editorStyle, t }) => {
  const taRef  = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    const pre = taRef.current?.previousElementSibling as HTMLPreElement | null;
    preRef.current = pre;
  }, []);

  const syncScroll = useCallback(() => {
    const ta  = taRef.current;
    const pre = preRef.current;
    if (!ta || !pre) return;
    pre.scrollTop  = ta.scrollTop;
    pre.scrollLeft = ta.scrollLeft;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta = e.currentTarget;
    const s  = ta.selectionStart;
    const en = ta.selectionEnd;
    const nv = value.slice(0, s) + '  ' + value.slice(en);
    onChange(nv);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = s + 2;
    });
  }, [value, onChange]);

  return (
    <textarea
      ref={taRef}
      value={value}
      spellCheck={false}
      autoCorrect="off"
      autoCapitalize="off"
      className="uiv-editor-ta"
      onChange={e => onChange(e.target.value)}
      onScroll={syncScroll}
      onKeyDown={handleKeyDown}
      style={{
        ...editorStyle,
        // Fix 3: текст прозрачный, каретка видна, ::selection стилизован через CSS
        color:       'transparent',
        caretColor:  t.accent,
        background:  'transparent',
        resize:      'none',
        border:      'none',
        outline:     'none',
        zIndex:      2,
        overflow:    'auto',
        overflowX:   'auto',
        overflowY:   'auto',
      }}
    />
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
      width: '100%', height: isFill ? '100%' : 'auto',
      minWidth: 0, minHeight: 0, position: 'relative',
      overflow: isFill ? 'hidden' : 'visible',
      ...(isFill ? { isolation: 'isolate' as const, contain: 'layout paint style' } : {}),
    }}>
      <ComponentWrapper {...universalProps} isDark={isDark} layoutMode={layoutMode} className="w-full h-full">
        <Suspense fallback={null}>
          <Component key={refreshKey} {...componentProps} />
        </Suspense>
      </ComponentWrapper>
    </div>
  );
};

// ─── FullscreenDesktop ────────────────────────────────────────────────────────

const FullscreenDesktop: React.FC<ComponentRenderProps & {
  activeTab: TabType;
  panelOpen: boolean;
  onTabSelect: (tab: TabType) => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  onRefresh: () => void;
  onReset: () => void;
  onClose: () => void;
  onTogglePanel: () => void;
  onLiveComponent: (comp: AnyComponent | null) => void;
  t: T;
}> = ({
  Component, componentProps, universalProps, refreshKey, isDark, componentCategory,
  fileContents, activeTab, panelOpen,
  onTabSelect, onUniversalPropChange, onRefresh, onReset, onClose, onTogglePanel,
  onLiveComponent, t,
}) => {
  const isBackground = componentCategory === 'backgrounds';

  const previewStyle: React.CSSProperties = isBackground
    ? { flex: 1, minWidth: 0, minHeight: 0, position: 'relative', overflow: 'hidden' }
    : { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, overflow: 'auto', position: 'relative' };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Рейл ── */}
      <aside style={{
        width: t.railW, flexShrink: 0,
        background: t.railBg, borderRight: `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '8px 0', gap: 2, zIndex: 10,
      }}>
        {/* Fix 1: кнопка Свернуть вместо текста "UI" */}
        <div style={{ width: t.railW, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <RailBtn icon={<Minimize2 size={18} />} label="Свернуть" t={t} onClick={onClose} />
        </div>

        <RailBtn icon={<Play size={18} />}       label="Запуск"    t={t} onClick={onRefresh} />
        <RailBtn icon={<RefreshCcw size={18} />} label="Сброс"     t={t} onClick={onReset} />
        <RailBtn
          icon={<Settings size={18} />}
          label="Настройки"
          isActive={panelOpen && activeTab === 'settings'}
          t={t}
          onClick={() => { onTabSelect('settings'); if (!panelOpen || activeTab === 'settings') onTogglePanel(); }}
        />
        <RailBtn
          icon={<Code2 size={18} />}
          label="Код"
          isActive={panelOpen && activeTab === 'code'}
          t={t}
          onClick={() => { onTabSelect('code'); if (!panelOpen || activeTab === 'code') onTogglePanel(); }}
        />
      </aside>

      {/* ── Превью ── */}
      <div style={previewStyle}>
        <ComponentRender
          Component={Component} componentProps={componentProps}
          universalProps={universalProps} refreshKey={refreshKey}
          isDark={isDark} componentCategory={componentCategory}
          fileContents={fileContents}
        />
      </div>

      {/* ── Правая панель ── */}
      {panelOpen && (
        <aside style={{
          width: activeTab === 'code' ? 'min(50%, 720px)' : `${t.panelW}px`,
          flexShrink: 0,
          borderLeft: `1px solid ${t.border}`,
          background: t.panelBg,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          transition: 'width 0.18s ease',
        }}>
          {/* Шапка панели */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px 8px', borderBottom: `1px solid ${t.border}`,
            background: t.surfaceBg, flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: t.fg }}>
              {activeTab === 'settings' ? 'Настройки' : 'Код'}
            </span>
            <button
              onClick={onTogglePanel}
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
          </div>

          {/* Контент */}
          {activeTab === 'settings' && (
            <SettingsSidebar universalProps={universalProps} onChange={onUniversalPropChange} t={t} />
          )}
          {activeTab === 'code' && (
            <SourceCodeEditor fileContents={fileContents} t={t} onLiveComponent={onLiveComponent} />
          )}
        </aside>
      )}
    </div>
  );
};

// ─── Мобильная версия ─────────────────────────────────────────────────────────

type MobileSheet = 'settings' | 'code' | null;

function useSheetDrag(initialVh: number) {
  const [sheetVh, setSheetVh]    = useState(initialVh);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY  = useRef<number | null>(null);
  const dragStartVh = useRef(initialVh);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (dragStartY.current === null) return;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const delta   = dragStartY.current - clientY;
      setSheetVh(Math.max(10, Math.min(92, dragStartVh.current + (delta / globalThis.innerHeight) * 100)));
    };
    const onUp = () => { dragStartY.current = null; setIsDragging(false); };
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

// Fix 2: MobBtn без серого фона
const MobBtn: React.FC<{
  label: string; icon: React.ReactNode; t: T; onClick: () => void; isActive: boolean;
}> = ({ label, icon, t, onClick, isActive }) => (
  <button onClick={onClick} style={{
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 4, padding: 0, border: 'none',
    background: 'transparent', cursor: 'pointer',
    color: isActive ? t.accent : t.fgMuted,
    outline: 'none', minWidth: 0,
    transition: 'color 0.12s',
  }}>
    <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
    <span style={{ fontSize: 10, fontWeight: 400, lineHeight: 1, marginTop: 1 }}>{label}</span>
  </button>
);

const FullscreenMobile: React.FC<ComponentRenderProps & {
  onClose: () => void; onRefresh: () => void; onReset: () => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  onLiveComponent: (comp: AnyComponent | null) => void;
  t: T;
}> = ({
  Component, componentProps, universalProps, refreshKey, isDark, componentCategory,
  fileContents, onClose, onRefresh, onReset, onUniversalPropChange, onLiveComponent, t,
}) => {
  const [sheet, setSheet] = useState<MobileSheet>(null);
  const { sheetVh, isDragging, startDrag } = useSheetDrag(55);
  const isBackground = componentCategory === 'backgrounds';

  const LABELS: Record<Exclude<MobileSheet, null>, string> = {
    settings: 'Настройки',
    code:     'Исходный код',
  };

  return (
    <>
      <div style={{ position: 'absolute', inset: 0, bottom: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: isBackground ? 'hidden' : 'visible' }}>
        <ComponentRender Component={Component} componentProps={componentProps} universalProps={universalProps} refreshKey={refreshKey} isDark={isDark} componentCategory={componentCategory} fileContents={fileContents} />
      </div>

      {sheet && (
        <button onClick={() => setSheet(null)} aria-label="Закрыть" style={{ position: 'absolute', inset: 0, bottom: 60, zIndex: 10, background: 'rgba(0,0,0,0.25)', border: 'none', padding: 0 }} />
      )}

      <div style={{
        position: 'absolute', bottom: 60, left: 0, right: 0,
        height: sheet ? `min(${sheetVh}dvh, 720px)` : 0,
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
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: t.fgSub }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 18px 10px', borderBottom: `1px solid ${t.border}` }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: t.fg }}>{sheet ? LABELS[sheet] : ''}</span>
              <button onClick={() => setSheet(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 10, border: `1px solid ${t.border}`, background: 'transparent', color: t.fg, cursor: 'pointer', flexShrink: 0 }}>
                <X size={14} />
              </button>
            </div>
          </button>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {sheet === 'settings' && (
              <SettingsSidebar universalProps={universalProps} onChange={onUniversalPropChange} t={t} />
            )}
            {sheet === 'code' && (
              <SourceCodeEditor fileContents={fileContents} t={t} onLiveComponent={onLiveComponent} />
            )}
          </div>
        </div>
      </div>

      {/* Fix 1 mobile: свернуть вместо "UI" текста */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: t.mobBg, borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'stretch', zIndex: 30, paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}>
        <MobBtn label="Обновить" icon={<Play size={20} />}       t={t} onClick={() => { setSheet(null); onRefresh(); }}                        isActive={false} />
        <MobBtn label="Сброс"    icon={<RefreshCcw size={20} />} t={t} onClick={() => { setSheet(null); onReset(); }}                          isActive={false} />
        <MobBtn label="Настройки" icon={<Settings size={20} />}  t={t} onClick={() => setSheet(p => p === 'settings' ? null : 'settings')}    isActive={sheet === 'settings'} />
        <MobBtn label="Код"      icon={<Code2 size={20} />}      t={t} onClick={() => setSheet(p => p === 'code' ? null : 'code')}             isActive={sheet === 'code'} />
        <MobBtn label="Свернуть" icon={<Minimize2 size={20} />}  t={t} onClick={onClose}                                                      isActive={false} />
      </div>
    </>
  );
};

// ─── FullscreenModal ──────────────────────────────────────────────────────────

const FullscreenModal: React.FC<ComponentRenderProps & {
  onClose: () => void; onRefresh: () => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  onReset: () => void; t: T;
  onLiveComponent: (comp: AnyComponent | null) => void;
}> = ({ Component, componentProps, universalProps, refreshKey, isDark, componentCategory, fileContents, onClose, onRefresh, onUniversalPropChange, onReset, onLiveComponent, t }) => {
  const [activeTab,  setActiveTab]  = useState<TabType>('settings');
  const [panelOpen,  setPanelOpen]  = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const handleTabSelect = useCallback((tab: TabType) => { setActiveTab(tab); }, []);
  const handleTogglePanel = useCallback(() => { setPanelOpen(v => !v); }, []);

  const shared: ComponentRenderProps = { Component, componentProps, universalProps, refreshKey, isDark, componentCategory, fileContents };

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
          onTogglePanel={handleTogglePanel}
          onLiveComponent={onLiveComponent}
          t={t}
        />
      ) : (
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <FullscreenMobile
            {...shared}
            onClose={onClose} onRefresh={onRefresh} onReset={onReset}
            onUniversalPropChange={onUniversalPropChange}
            onLiveComponent={onLiveComponent}
            t={t}
          />
        </div>
      )}
    </div>,
    document.body,
  );
};

// ─── PreviewPanel ─────────────────────────────────────────────────────────────

const PreviewPanel: React.FC<ComponentRenderProps & {
  onOpenFullscreen: () => void; t: T; loading: boolean;
}> = ({ Component, componentProps, universalProps, refreshKey, isDark, componentCategory, onOpenFullscreen, t, loading, fileContents }) => {
  const isBackground = componentCategory === 'backgrounds';
  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'visible' }}>
      <button
        onClick={onOpenFullscreen} title="Открыть настройки"
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 10,
          border: `1px solid ${t.borderStrong}`,
          background: t.railBg, color: t.fg, cursor: 'pointer',
          boxShadow: t.shadow, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = t.btnHov; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = t.railBg; }}
      >
        <Settings size={17} />
      </button>
      <div style={{
        width: '100%',
        ...(isBackground ? { height: 400 } : { minHeight: 500, paddingTop: 60, paddingBottom: 120 }),
        display: 'flex',
        alignItems: isBackground ? 'stretch' : 'center',
        justifyContent: isBackground ? 'stretch' : 'center',
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
            Component={Component} componentProps={componentProps}
            universalProps={universalProps} refreshKey={refreshKey}
            isDark={isDark} componentCategory={componentCategory}
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

const DEFAULT_UNIVERSAL_PROPS: UniversalProps = {
  enableUniversalProps: true,
  scale: 1, color: undefined, colorMode: 'original',
  offsetX: 0, offsetY: 0, rotateZ: 0,
  justifyContent: 'center', alignItems: 'center',
  opacity: 1, blur: 0, brightness: 1, contrast: 1, saturate: 1,
};

// ─── UIComponentViewer ────────────────────────────────────────────────────────

const UIComponentViewer: React.FC<{ componentId: string }> = ({ componentId }) => {
  const { isDark }  = useTheme();
  const t           = tk(isDark);

  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [refreshKey,     setRefreshKey]     = useState(0);
  const [componentProps, setComponentProps] = useState<ComponentPropsMap>({});
  const [universalProps, setUniversalProps] = useState<UniversalProps>(DEFAULT_UNIVERSAL_PROPS);
  const [componentData,  setComponentData]  = useState<LoadedComponentData | null>(null);
  const [loading,        setLoading]        = useState(true);
  // Live component from code editor
  const [liveComponent,  setLiveComponent]  = useState<AnyComponent | null>(null);

  useEffect(() => {
    setLoading(true);
    setLiveComponent(null);
    loadComponent(componentId).then(data => {
      if (data) { setComponentData(data); setComponentProps(getDefaultProps(data.config)); }
      scheduleHideLoading(setLoading);
    });
  }, [componentId]);

  const handleRefresh         = useCallback(() => setRefreshKey(k => k + 1), []);
  const handleUniversalChange = useCallback((key: keyof UniversalProps, value: PropValue) =>
    setUniversalProps(prev => ({ ...prev, [key]: value })), []);
  const handleReset = useCallback(() => {
    if (!componentData) return;
    setComponentProps(getDefaultProps(componentData.config));
    setUniversalProps(DEFAULT_UNIVERSAL_PROPS);
    setLiveComponent(null);
    setRefreshKey(k => k + 1);
  }, [componentData]);

  const handleLiveComponent = useCallback((comp: AnyComponent | null) => {
    setLiveComponent(comp);
    // Bump refresh key so component re-mounts with new code
    if (comp) setRefreshKey(k => k + 1);
  }, []);

  const placeholderConfig: ComponentConfig = useMemo(() => ({
    id: componentId, name: '…', description: '', props: [], specificProps: [],
  }), [componentId]);
  const PlaceholderComponent = useMemo(() => () => null, []);

  const effectiveData = componentData ?? {
    config: placeholderConfig,
    Component: PlaceholderComponent as AnyComponent,
    fileContents: {},
  };

  // Use live-compiled component if available, otherwise original
  const activeComponent = liveComponent ?? effectiveData.Component;

  const shared: ComponentRenderProps = {
    Component:         activeComponent,
    componentProps,
    universalProps,
    refreshKey,
    isDark,
    componentCategory: effectiveData.config.category,
    fileContents:      effectiveData.fileContents,
  };

  return (
    <div className="not-prose" style={{ margin: '1.25rem 0', overflow: 'visible', position: 'relative' }}>
      <PreviewPanel {...shared} onOpenFullscreen={() => setIsFullscreen(true)} t={t} loading={loading} />
      {isFullscreen && componentData && (
        <FullscreenModal
          {...shared}
          onClose={() => setIsFullscreen(false)}
          onRefresh={handleRefresh}
          onUniversalPropChange={handleUniversalChange}
          onReset={handleReset}
          onLiveComponent={handleLiveComponent}
          t={t}
        />
      )}
    </div>
  );
};

export default UIComponentViewer;