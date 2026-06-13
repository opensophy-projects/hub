import React, {
  useState, useCallback, Suspense, useEffect, useMemo, useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/shared/contexts/useTheme';
import {
  Minimize2, Play, RefreshCcw, Copy, Check,
  X, Code2,
  ChevronDown, ChevronRight, Settings,
} from 'lucide-react';
import hljs from 'highlight.js/lib/core';
import { loadComponent } from './loader';
import { ComponentWrapper } from './ComponentWrapper';
import { useIsMobile } from '@/shared/hooks/useBreakpoint';
import type { UniversalProps, PropValue } from './types';
import { makeTokens } from '@/shared/tokens/theme';

type AnyComponent = React.ComponentType<Record<string, unknown>>;
type TabType = 'settings' | 'code';

interface LoadedComponentData {
  Component: AnyComponent;
  category?: string;
  fileContents: Record<string, string>;
}

// ─── Токены ───────────────────────────────────────────────────────────────────

const TOKENS_DARK = {
  railBg:       '#0F0F0F',
  panelBg:      '#0F0F0F',
  surfaceBg:    '#141414',
  codeBg:       '#0a0a0a',
  border:       'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.15)',
  fg:           'rgba(255,255,255,0.85)',
  fgMuted:      'rgba(255,255,255,0.55)',
  fgSub:        'rgba(255,255,255,0.28)',
  btnHov:       'rgba(255,255,255,0.06)',
  btnClr:       'rgba(255,255,255,0.55)',
  btnActBg:     'rgba(255,255,255,0.10)',
  btnActBdr:    'rgba(255,255,255,0.16)',
  btnActClr:    '#ffffff',
  inpBg:        'rgba(255,255,255,0.05)',
  inpBdr:       'rgba(255,255,255,0.10)',
  inpClr:       'rgba(255,255,255,0.8)',
  mobBg:        '#0F0F0F',
  shadow:       '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
} as const;

const TOKENS_LIGHT = {
  railBg:       '#dddcd8',
  panelBg:      '#dddcd8',
  surfaceBg:    '#d5d4d0',
  codeBg:       '#e8e7e3',
  border:       'rgba(0,0,0,0.09)',
  borderStrong: 'rgba(0,0,0,0.18)',
  fg:           'rgba(0,0,0,0.85)',
  fgMuted:      'rgba(0,0,0,0.55)',
  fgSub:        'rgba(0,0,0,0.28)',
  btnHov:       'rgba(0,0,0,0.06)',
  btnClr:       'rgba(0,0,0,0.55)',
  btnActBg:     'rgba(0,0,0,0.09)',
  btnActBdr:    'rgba(0,0,0,0.16)',
  btnActClr:    '#000000',
  inpBg:        'rgba(0,0,0,0.05)',
  inpBdr:       'rgba(0,0,0,0.10)',
  inpClr:       'rgba(0,0,0,0.8)',
  mobBg:        '#dcdbd7',
  shadow:       '0 8px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.07)',
} as const;

function tk(isDark: boolean) {
  const t      = makeTokens(isDark);
  const mode   = isDark ? TOKENS_DARK : TOKENS_LIGHT;
  return {
    ...mode,
    outerBg:    t.bg,
    accent:     t.accent,
    accentSoft: t.accentSoft,
    railW:  64,
    panelW: 280,
  };
}
type T = ReturnType<typeof tk>;

// ─── RailBtn ─────────────────────────────────────────────────────────────────

function getRailBtnColor(isActive: boolean | undefined, hov: boolean, t: T): string {
  if (isActive) return t.btnActClr;
  return hov ? t.fg : t.btnClr;
}

const RailBtn: React.FC<{
  icon: React.ReactNode; label: string; isActive?: boolean; t: T;
  onClick: () => void; title?: string;
}> = ({ icon, label, isActive, t, onClick, title }) => {
  const [hov, setHov] = useState(false);
  const color = getRailBtnColor(isActive, hov, t);
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
          onKeyDown={e => {
            if (e.key === 'Enter') { commit(); }
            if (e.key === 'Escape') { setEditing(false); }
          }}
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
          >
            Сбросить
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

let hljsReady = false;

async function initHljs(): Promise<void> {
  if (hljsReady) return;
  const [ts, js, cssLang, xmlLang, jsonLang] = await Promise.all([
    import('highlight.js/lib/languages/typescript'),
    import('highlight.js/lib/languages/javascript'),
    import('highlight.js/lib/languages/css'),
    import('highlight.js/lib/languages/xml'),
    import('highlight.js/lib/languages/json'),
  ]);
  hljs.registerLanguage('typescript', ts.default);
  hljs.registerLanguage('tsx',        ts.default);
  hljs.registerLanguage('javascript', js.default);
  hljs.registerLanguage('jsx',        js.default);
  hljs.registerLanguage('css',        cssLang.default);
  hljs.registerLanguage('html',       xmlLang.default);
  hljs.registerLanguage('xml',        xmlLang.default);
  hljs.registerLanguage('json',       jsonLang.default);
  hljsReady = true;
}

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

// ─── SourceCodeViewer (read-only, copyable) ───────────────────────────────────

interface SourceCodeViewerProps {
  fileContents: Record<string, string>;
  t: T;
}

const SourceCodeViewer: React.FC<SourceCodeViewerProps> = ({ fileContents, t }) => {
  const files = useMemo(() => Object.entries(fileContents), [fileContents]);
  const [activeFile, setActiveFile] = useState(() => files[0]?.[0] ?? '');
  const [copied, setCopied]         = useState(false);
  const [hljsInit, setHljsInit]     = useState(hljsReady);

  useEffect(() => {
    if (hljsInit) return;
    initHljs().then(() => setHljsInit(true));
  }, [hljsInit]);

  useEffect(() => {
    setActiveFile(Object.keys(fileContents)[0] ?? '');
  }, [fileContents]);

  const activeCode  = fileContents[activeFile] ?? '';
  const highlighted = useMemo(
    () => (hljsInit ? highlightCode(activeCode, activeFile) : ''),
    [activeCode, activeFile, hljsInit],
  );

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback: select all text in pre
    }
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
        .uiv-code-pre { tab-size: 2; }
        .uiv-code-pre::-webkit-scrollbar { width: 6px; height: 6px; }
        .uiv-code-pre::-webkit-scrollbar-track { background: transparent; }
        .uiv-code-pre::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.25); border-radius: 3px; }
      `}</style>

      {/* Тулбар */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
        padding: '7px 10px', borderBottom: `1px solid ${t.border}`,
        background: t.surfaceBg, flexShrink: 0,
      }}>
        {/* Табы файлов */}
        <div style={{ display: 'flex', gap: 4, flex: 1, overflow: 'hidden' }}>
          {files.map(([name]) => {
            const isAct = name === activeFile;
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
                <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              </button>
            );
          })}
        </div>

        {/* Кнопка копирования */}
        <button
          onClick={copyCode}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 9px', borderRadius: 6,
            border: `1px solid ${copied ? t.accent + '66' : t.border}`,
            background: copied ? t.btnActBg : 'transparent',
            color: copied ? t.accent : t.fgMuted,
            fontSize: 11, cursor: 'pointer', flexShrink: 0,
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
      </div>

      {/* Код — только для чтения, можно выделять и копировать */}
      <div
        className="uiv-hl"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          background: t.codeBg,
          position: 'relative',
        }}
      >
        <pre
          className="uiv-code-pre"
          style={{
            margin: 0,
            padding: '16px 18px',
            fontSize: 12.5,
            lineHeight: 1.7,
            fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", ui-monospace, monospace',
            whiteSpace: 'pre',
            wordBreak: 'normal' as const,
            color: t.fg,
            background: 'transparent',
            userSelect: 'text',
            WebkitUserSelect: 'text',
            cursor: 'text',
          }}
        >
          <code
            dangerouslySetInnerHTML={{ __html: highlighted }}
            style={{ userSelect: 'text', WebkitUserSelect: 'text' } as React.CSSProperties}
          />
        </pre>
      </div>
    </div>
  );
};

// ─── ComponentRender ──────────────────────────────────────────────────────────

interface ComponentRenderProps {
  Component: AnyComponent;
  universalProps: UniversalProps;
  refreshKey: number;
  isDark: boolean;
  componentCategory?: string;
  fileContents: Record<string, string>;
  /**
   * Режим раскладки контейнера:
   * - 'fill'    — компонент занимает всю выделенную область (фоны, полноразмерные демо)
   * - 'content' — компонент центрируется и занимает своё естественное место
   * По умолчанию определяется по категории.
   */
  containerMode?: 'fill' | 'content';
}

const ComponentRender: React.FC<ComponentRenderProps> = ({
  Component, universalProps, refreshKey, isDark, containerMode,
}) => {
  const resolvedMode = containerMode ?? 'fill';
  const isFill = resolvedMode === 'fill';
  return (
    <div style={{
      width: '100%',
      height: isFill ? '100%' : 'auto',
      position: 'relative',
      overflow: 'visible',
    }}>
      <ComponentWrapper {...universalProps} isDark={isDark} layoutMode={resolvedMode} className="w-full h-full">
        <Suspense fallback={null}>
          <Component key={refreshKey} />
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
  t: T;
}> = ({
  Component, universalProps, refreshKey, isDark, componentCategory,
  fileContents, activeTab, panelOpen,
  onTabSelect, onUniversalPropChange, onRefresh, onReset, onClose, onTogglePanel,
  t,
}) => {
  const isBackground = componentCategory === 'backgrounds';

  // overflow: auto позволяет скроллить если компонент большой, но не обрезает
  const previewStyle: React.CSSProperties = isBackground
    ? { flex: 1, position: 'relative', overflow: 'hidden' }
    : { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, overflow: 'auto', position: 'relative' };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'visible' }}>

      {/* ── Рейл ── */}
      <aside style={{
        width: t.railW, flexShrink: 0,
        background: t.railBg, borderRight: `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '8px 0', gap: 2, zIndex: 10,
      }}>
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
          Component={Component}
          universalProps={universalProps} refreshKey={refreshKey}
          isDark={isDark} componentCategory={componentCategory}
          fileContents={fileContents}
          containerMode={isBackground ? 'fill' : 'content'}
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
            <SourceCodeViewer fileContents={fileContents} t={t} />
          )}
        </aside>
      )}
    </div>
  );
};

// ─── Мобильная версия ─────────────────────────────────────────────────────────

type MobileSheet = 'settings' | 'code' | null;

function useSheetDrag(initialVh: number) {
  const [sheetVh, setSheetVh]       = useState(initialVh);
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
  t: T;
}> = ({
  Component, universalProps, refreshKey, isDark, componentCategory,
  fileContents, onClose, onRefresh, onReset, onUniversalPropChange, t,
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
        <ComponentRender Component={Component} universalProps={universalProps} refreshKey={refreshKey} isDark={isDark} componentCategory={componentCategory} fileContents={fileContents} containerMode={isBackground ? 'fill' : 'content'} />
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
              <SourceCodeViewer fileContents={fileContents} t={t} />
            )}
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: t.mobBg, borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'stretch', zIndex: 30, paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}>
        <MobBtn label="Обновить" icon={<Play size={20} />}       t={t} onClick={() => { setSheet(null); onRefresh(); }}                     isActive={false} />
        <MobBtn label="Сброс"    icon={<RefreshCcw size={20} />} t={t} onClick={() => { setSheet(null); onReset(); }}                       isActive={false} />
        <MobBtn label="Настройки" icon={<Settings size={20} />}  t={t} onClick={() => setSheet(p => p === 'settings' ? null : 'settings')} isActive={sheet === 'settings'} />
        <MobBtn label="Код"      icon={<Code2 size={20} />}      t={t} onClick={() => setSheet(p => p === 'code' ? null : 'code')}          isActive={sheet === 'code'} />
        <MobBtn label="Свернуть" icon={<Minimize2 size={20} />}  t={t} onClick={onClose}                                                   isActive={false} />
      </div>
    </>
  );
};

// ─── FullscreenModal ──────────────────────────────────────────────────────────

const FullscreenModal: React.FC<ComponentRenderProps & {
  onClose: () => void; onRefresh: () => void;
  onUniversalPropChange: (key: keyof UniversalProps, v: PropValue) => void;
  onReset: () => void; t: T;
}> = ({ Component, universalProps, refreshKey, isDark, componentCategory, fileContents, onClose, onRefresh, onUniversalPropChange, onReset, t }) => {
  const [activeTab,  setActiveTab]  = useState<TabType>('settings');
  const [panelOpen,  setPanelOpen]  = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const handleTabSelect   = useCallback((tab: TabType) => { setActiveTab(tab); }, []);
  const handleTogglePanel = useCallback(() => { setPanelOpen(v => !v); }, []);

  const shared: ComponentRenderProps = { Component, universalProps, refreshKey, isDark, componentCategory, fileContents };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: t.outerBg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {isMobile ? (
        <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
          <FullscreenMobile
            {...shared}
            onClose={onClose} onRefresh={onRefresh} onReset={onReset}
            onUniversalPropChange={onUniversalPropChange}
            t={t}
          />
        </div>
      ) : (
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
          t={t}
        />
      )}
    </div>,
    document.body,
  );
};

// ─── PreviewPanel ─────────────────────────────────────────────────────────────

const PreviewPanel: React.FC<ComponentRenderProps & {
  onOpenFullscreen: () => void; t: T; loading: boolean;
}> = ({ Component, universalProps, refreshKey, isDark, componentCategory, onOpenFullscreen, t, loading, fileContents }) => {
  const isBackground = componentCategory === 'backgrounds';
  // Для не-фоновых компонентов используем 'content' режим чтобы flex-центрирование работало
  const previewContainerMode: 'fill' | 'content' = isBackground ? 'fill' : 'content';

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
        // Для фонов фиксированная высота, для контентных — минимальная 240px, растёт по контенту
        minHeight: isBackground ? 400 : 240,
        height: isBackground ? 400 : 'auto',
        position: 'relative',
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isBackground ? 0 : '40px 24px',
      }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, fontSize: 12, color: t.fgSub, fontFamily: 'ui-monospace, monospace' }}>
            Загрузка…
          </div>
        )}
        {!loading && (
          <ComponentRender
            Component={Component}
            universalProps={universalProps} refreshKey={refreshKey}
            isDark={isDark} componentCategory={componentCategory}
            fileContents={fileContents}
            containerMode={previewContainerMode}
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

// Заглушка — рендерится пока компонент не загружен/не найден
const PlaceholderComponent: AnyComponent = () => null;

// ─── UIComponentViewer ────────────────────────────────────────────────────────

const UIComponentViewer: React.FC<{ componentId: string }> = ({ componentId }) => {
  const { isDark }  = useTheme();
  const t           = tk(isDark);

  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [refreshKey,     setRefreshKey]     = useState(0);
  const [universalProps, setUniversalProps] = useState<UniversalProps>(DEFAULT_UNIVERSAL_PROPS);
  const [componentData,  setComponentData]  = useState<LoadedComponentData | null>(null);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    setLoading(true);
    loadComponent(componentId).then(data => {
      if (data) setComponentData(data);
      scheduleHideLoading(setLoading);
    });
  }, [componentId]);

  const handleRefresh         = useCallback(() => setRefreshKey(k => k + 1), []);
  const handleUniversalChange = useCallback((key: keyof UniversalProps, value: PropValue) =>
    setUniversalProps(prev => ({ ...prev, [key]: value })), []);
  const handleReset = useCallback(() => {
    setUniversalProps(DEFAULT_UNIVERSAL_PROPS);
    setRefreshKey(k => k + 1);
  }, []);

  const effectiveData: LoadedComponentData = componentData ?? {
    Component: PlaceholderComponent,
    fileContents: {},
  };

  const shared: ComponentRenderProps = {
    Component:         effectiveData.Component,
    universalProps,
    refreshKey,
    isDark,
    componentCategory: effectiveData.category,
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
          t={t}
        />
      )}
    </div>
  );
};

export default UIComponentViewer;