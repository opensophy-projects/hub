/**
 * ThemePanel — редактор темы сайта
 * Изменяет CSS-переменные в реальном времени через documentElement.style
 * и сохраняет в global.css через бридж
 */

import React, { useState, useCallback, useEffect } from 'react';
import { bridge } from '../useDevBridge';
import { T } from '../DevPanel';
import { Save, RotateCcw, Eye, Sun, Moon, Loader2 } from 'lucide-react';

// ─── CSS переменные которые редактируем ───────────────────────────────────────

interface CssVar {
  key: string;
  label: string;
  type: 'color' | 'px' | 'text';
  default: string;
}

const CSS_VARS: CssVar[] = [
  { key: '--accent-color',        label: 'Accent',           type: 'color', default: '#7234ff' },
  { key: '--glow-color',          label: 'Glow',             type: 'color', default: '#7234ff' },
  { key: '--bg-dark',             label: 'Фон (тёмный)',      type: 'color', default: '#0a0a0a' },
  { key: '--bg-light',            label: 'Фон (светлый)',     type: 'color', default: '#E8E7E3' },
  { key: '--nav-bg-dark',         label: 'Nav фон (тёмный)',  type: 'color', default: '#0d0d0d' },
  { key: '--nav-bg-light',        label: 'Nav фон (светлый)', type: 'color', default: '#E0DFDb' },
  { key: '--font-sans',           label: 'Шрифт',            type: 'text',  default: 'system-ui, -apple-system, sans-serif' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: T.fgSub, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: T.fgSub, padding: '10px 16px 6px',
      borderBottom: `1px solid ${T.border}`,
    }}>
      {children}
    </div>
  );
}

function ColorRow({ varDef, value, onChange }: { varDef: CssVar; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: T.fg, marginBottom: 2 }}>{varDef.label}</div>
        <div style={{ fontSize: 10, color: T.fgSub, fontFamily: 'ui-monospace, monospace' }}>{varDef.key}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="color"
          value={value.startsWith('#') ? value : '#7234ff'}
          onChange={e => onChange(e.target.value)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: `1px solid ${T.border}`,
            background: 'none',
            cursor: 'pointer',
            padding: 2,
          }}
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: 86,
            padding: '4px 7px',
            borderRadius: 5,
            border: `1px solid ${T.border}`,
            background: T.bgHov,
            color: T.fg,
            fontSize: 11,
            fontFamily: 'ui-monospace, monospace',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}

function TextRow({ varDef, value, onChange }: { varDef: CssVar; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ padding: '7px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: 12, color: T.fg }}>{varDef.label}</div>
        <div style={{ fontSize: 10, color: T.fgSub, fontFamily: 'ui-monospace, monospace' }}>{varDef.key}</div>
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 8px',
          borderRadius: 6,
          border: `1px solid ${T.border}`,
          background: T.bgHov,
          color: T.fg,
          fontSize: 11,
          fontFamily: 'ui-monospace, monospace',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

// ─── ThemePanel ───────────────────────────────────────────────────────────────

export default function ThemePanel() {
  const [vars, setVars] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    CSS_VARS.forEach(v => { init[v.key] = v.default; });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  const [previewActive, setPreviewActive] = useState(false);

  // Применяем переменные к :root в реальном времени
  const applyToRoot = useCallback((newVars: Record<string, string>) => {
    Object.entries(newVars).forEach(([key, value]) => {
      if (value) document.documentElement.style.setProperty(key, value);
    });
  }, []);

  const handleChange = useCallback((key: string, value: string) => {
    setVars(prev => {
      const next = { ...prev, [key]: value };
      applyToRoot(next);
      return next;
    });
  }, [applyToRoot]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Фильтруем только непустые и изменённые
      const toSave = Object.fromEntries(
        Object.entries(vars).filter(([_, v]) => v.trim())
      );
      await bridge.writeCssVars(toSave);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const reset: Record<string, string> = {};
    CSS_VARS.forEach(v => { reset[v.key] = v.default; });
    setVars(reset);
    applyToRoot(reset);
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    // Триггерим storage event для синхронизации с ThemeContext
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'theme',
      newValue: next ? 'dark' : 'light',
      storageArea: localStorage,
    }));
  };

  // Glow preview
  const handleGlowPreview = (on: boolean) => {
    setPreviewActive(on);
    if (on && vars['--glow-color']) {
      document.documentElement.style.setProperty('--glow-preview', vars['--glow-color']);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
      {/* Theme toggle */}
      <SectionTitle>Режим темы</SectionTitle>
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
        <button
          onClick={() => { setIsDark(true); if (!isDark) toggleTheme(); }}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px', borderRadius: 7,
            border: `1px solid ${isDark ? T.accent : T.border}`,
            background: isDark ? T.accentSoft : T.bgHov,
            color: isDark ? T.accent : T.fgMuted,
            cursor: 'pointer', fontSize: 12, fontWeight: isDark ? 700 : 400,
            fontFamily: 'inherit',
          }}
        >
          <Moon size={13} /> Тёмная
        </button>
        <button
          onClick={() => { setIsDark(false); if (isDark) toggleTheme(); }}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px', borderRadius: 7,
            border: `1px solid ${!isDark ? T.accent : T.border}`,
            background: !isDark ? T.accentSoft : T.bgHov,
            color: !isDark ? T.accent : T.fgMuted,
            cursor: 'pointer', fontSize: 12, fontWeight: !isDark ? 700 : 400,
            fontFamily: 'inherit',
          }}
        >
          <Sun size={13} /> Светлая
        </button>
      </div>

      {/* CSS Variables */}
      <SectionTitle>CSS переменные</SectionTitle>
      <div style={{ paddingTop: 4 }}>
        {CSS_VARS.map(varDef => {
          const value = vars[varDef.key] ?? varDef.default;
          if (varDef.type === 'color') {
            return <ColorRow key={varDef.key} varDef={varDef} value={value} onChange={v => handleChange(varDef.key, v)} />;
          }
          return <TextRow key={varDef.key} varDef={varDef} value={value} onChange={v => handleChange(varDef.key, v)} />;
        })}
      </div>

      {/* Custom CSS */}
      <SectionTitle>Дополнительный CSS</SectionTitle>
      <div style={{ padding: '10px 16px' }}>
        <textarea
          placeholder="/* Добавьте свой CSS... */"
          rows={6}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 7,
            border: `1px solid ${T.border}`,
            background: T.bgHov,
            color: T.fg,
            fontSize: 11,
            fontFamily: 'ui-monospace, monospace',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Actions */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        padding: '10px 16px',
        background: T.bg,
        borderTop: `1px solid ${T.border}`,
        display: 'flex',
        gap: 8,
      }}>
        <button
          onClick={handleReset}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 12px', borderRadius: 7,
            border: `1px solid ${T.border}`,
            background: T.bgHov,
            color: T.fgMuted,
            fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <RotateCcw size={12} /> Сброс
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 7,
            border: `1px solid ${saved ? T.success + '60' : T.accent + '60'}`,
            background: saved ? 'rgba(34,197,94,0.12)' : T.accentSoft,
            color: saved ? T.success : T.accent,
            fontSize: 11, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {saving ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />}
          {saved ? 'Сохранено!' : 'Сохранить в CSS'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '8px 16px', color: T.danger, fontSize: 11 }}>
          ⚠ {error}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}