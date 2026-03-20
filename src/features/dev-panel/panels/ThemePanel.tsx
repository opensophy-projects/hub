/**
 * ThemePanel v3
 * - Переключатель темы через CustomEvent (работает между React islands)
 * - Акцентные цвета через CSS переменные которые реально используются в nav
 * - CSS vars сохраняются в global.css через bridge
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { bridge } from '../useDevBridge';
import { toast } from '../components/Toast';
import { T, SectionTitle, Btn, Divider, StatusBar } from '../components/ui';
import { Sun, Moon, Save, RotateCcw, Upload, Eye, Code, Star } from 'lucide-react';

// ─── CSS переменные ───────────────────────────────────────────────────────────
// Только те переменные, которые реально объявлены и используются в коде

interface VarDef {
  key: string;
  label: string;
  type: 'color' | 'text';
  default: string;
  group: string;
}

const VAR_DEFS: VarDef[] = [
  // Акценты — используются в Navigation.tsx как t.accent для active states
  { key: '--accent-primary',   label: 'Основной акцент',  type: 'color', default: '#7234ff', group: 'Акценты' },
  { key: '--glow-color',       label: 'Glow / свечение',  type: 'color', default: '#7234ff', group: 'Акценты' },
  { key: '--accent-secondary', label: 'Вторичный акцент', type: 'color', default: '#22c55e', group: 'Акценты' },

  // Фоны тёмной темы
  { key: '--bg-primary-dark',  label: 'Фон (тёмный)',     type: 'color', default: '#0a0a0a', group: 'Тёмная тема' },
  { key: '--bg-nav-dark',      label: 'Nav фон (тёмный)', type: 'color', default: '#0d0d0d', group: 'Тёмная тема' },
  { key: '--bg-surface-dark',  label: 'Surface (тёмный)', type: 'color', default: '#141414', group: 'Тёмная тема' },

  // Фоны светлой темы
  { key: '--bg-primary-light', label: 'Фон (светлый)',     type: 'color', default: '#E8E7E3', group: 'Светлая тема' },
  { key: '--bg-nav-light',     label: 'Nav фон (светлый)', type: 'color', default: '#E0DFDb', group: 'Светлая тема' },
  { key: '--bg-surface-light', label: 'Surface (светлый)', type: 'color', default: '#d8d7d3', group: 'Светлая тема' },

  // Типографика
  { key: '--font-sans', label: 'Основной шрифт',     type: 'text', default: 'system-ui, -apple-system, sans-serif', group: 'Типографика' },
  { key: '--font-mono', label: 'Моноширинный шрифт', type: 'text', default: 'ui-monospace, monospace',              group: 'Типографика' },
];

// ─── ColorInput ───────────────────────────────────────────────────────────────

function ColorInput({
  value, onChange, label, varKey,
}: { value: string; onChange: (v: string) => void; label: string; varKey: string }) {
  const [textVal, setTextVal] = useState(value);

  useEffect(() => { setTextVal(value); }, [value]);

  const handleText = (v: string) => {
    setTextVal(v);
    if (/^#[0-9a-f]{6}$/i.test(v) || /^#[0-9a-f]{3}$/i.test(v)) {
      onChange(v);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px' }}>
      <label style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}>
        <div style={{
          width: 26, height: 26, borderRadius: 5,
          background: value || '#888',
          border: `1px solid ${T.border}`,
        }} />
        <input
          type="color"
          value={value.startsWith('#') && value.length === 7 ? value : '#7234ff'}
          onChange={e => { onChange(e.target.value); setTextVal(e.target.value); }}
          style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', height: '100%', cursor: 'pointer' }}
        />
      </label>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: T.fg, marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 9, color: T.fgSub, fontFamily: T.mono }}>{varKey}</div>
      </div>

      <input
        type="text"
        value={textVal}
        onChange={e => handleText(e.target.value)}
        maxLength={7}
        style={{
          width: 74, padding: '3px 6px', borderRadius: 4,
          border: `1px solid ${T.border}`,
          background: T.bgHov, color: T.fg,
          fontSize: 11, outline: 'none',
          fontFamily: T.mono, textTransform: 'uppercase',
        }}
      />
    </div>
  );
}

// ─── TextInput ────────────────────────────────────────────────────────────────

function TextVarInput({
  value, onChange, label, varKey,
}: { value: string; onChange: (v: string) => void; label: string; varKey: string }) {
  return (
    <div style={{ padding: '5px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: T.fg }}>{label}</span>
        <span style={{ fontSize: 9, color: T.fgSub, fontFamily: T.mono }}>{varKey}</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '5px 7px',
          borderRadius: 5, border: `1px solid ${T.border}`,
          background: T.bgHov, color: T.fg,
          fontSize: 11, outline: 'none',
          fontFamily: T.mono, boxSizing: 'border-box' as const,
        }}
      />
    </div>
  );
}

// ─── VarGroup ─────────────────────────────────────────────────────────────────

function VarGroup({
  name, vars, values, onChange,
}: {
  name: string;
  vars: VarDef[];
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 12px', border: 'none',
          background: T.bgPanel + 'cc',
          color: T.fgSub, fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          cursor: 'pointer', textAlign: 'left', fontFamily: T.mono,
        }}
      >
        <span style={{
          display: 'inline-block', width: 10,
          transform: open ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.15s', fontSize: 10,
        }}>▶</span>
        {name}
        <span style={{ marginLeft: 'auto', fontSize: 9, opacity: 0.5 }}>{vars.length}</span>
      </button>

      {open && vars.map(v => {
        const val = values[v.key] ?? v.default;
        if (v.type === 'color') {
          return (
            <ColorInput
              key={v.key}
              value={val}
              onChange={nv => onChange(v.key, nv)}
              label={v.label}
              varKey={v.key}
            />
          );
        }
        return (
          <TextVarInput
            key={v.key}
            value={val}
            onChange={nv => onChange(v.key, nv)}
            label={v.label}
            varKey={v.key}
          />
        );
      })}
    </div>
  );
}

// ─── Favicon drop zone ────────────────────────────────────────────────────────

function FaviconZone() {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview]   = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setSaving(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setPreview(URL.createObjectURL(file));
      await bridge.uploadFavicon(base64, file.type);
      toast.success('Favicon обновлён! Обнови страницу.');
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '8px 12px' }}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 7,
          border: `1.5px dashed ${dragging ? T.accent : T.border}`,
          background: dragging ? T.accentSoft : T.bgHov,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/svg+xml,image/x-icon,image/webp,image/jpeg"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
        {preview
          ? <img src={preview} alt="favicon" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4 }} />
          : <div style={{ width: 32, height: 32, borderRadius: 4, background: T.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={16} style={{ color: T.fgSub }} />
            </div>
        }
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: T.fg }}>{saving ? 'Загрузка...' : 'Favicon / Логотип'}</div>
          <div style={{ fontSize: 10, color: T.fgSub }}>PNG, SVG, ICO · Перетащи или кликни</div>
        </div>
        <Upload size={14} style={{ color: T.fgSub }} />
      </div>
    </div>
  );
}

// ─── Custom CSS editor ────────────────────────────────────────────────────────

function CustomCssEditor() {
  const [css, setCss] = useState('');
  const [open, setOpen] = useState(false);

  const apply = () => {
    const existing = document.getElementById('hub-dev-custom-css');
    if (existing) existing.remove();
    if (!css.trim()) return;
    const style = document.createElement('style');
    style.id = 'hub-dev-custom-css';
    style.textContent = css;
    document.head.appendChild(style);
    toast.info('CSS применён (не сохранён в файл)');
  };

  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 12px', border: 'none',
          background: T.bgPanel + 'cc',
          color: T.fgSub, fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          cursor: 'pointer', textAlign: 'left', fontFamily: T.mono,
        }}
      >
        <Code size={11} />
        Кастомный CSS
      </button>
      {open && (
        <div style={{ padding: '8px 12px' }}>
          <textarea
            value={css}
            onChange={e => setCss(e.target.value)}
            placeholder={`/* Применяется мгновенно к странице */\n.my-class {\n  color: red;\n}`}
            rows={8}
            style={{
              width: '100%', padding: '8px', boxSizing: 'border-box' as const,
              background: '#080810', color: '#e2e8f0',
              border: `1px solid ${T.border}`, borderRadius: 6,
              fontFamily: T.mono, fontSize: 11, lineHeight: 1.65,
              resize: 'vertical', outline: 'none', scrollbarWidth: 'thin' as const,
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <Btn icon={<Eye size={11}/>} onClick={apply} fullWidth>Применить</Btn>
            <Btn variant="ghost" onClick={() => { document.getElementById('hub-dev-custom-css')?.remove(); toast.info('CSS удалён'); }}>✕</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ThemePanel ───────────────────────────────────────────────────────────────

const THEME_CHANGE_EVENT = 'hub:theme-change';

export default function ThemePanel() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true
  );
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    VAR_DEFS.forEach(v => { init[v.key] = v.default; });
    return init;
  });
  const [saving, setSaving] = useState(false);

  // Sync isDark when other islands change it
  useEffect(() => {
    const onThemeChange = (e: Event) => {
      const { isDark: next } = (e as CustomEvent<{ isDark: boolean }>).detail;
      setIsDark(next);
    };
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
  }, []);

  const groups = VAR_DEFS.reduce<Record<string, VarDef[]>>((acc, v) => {
    (acc[v.group] ??= []).push(v);
    return acc;
  }, {});

  // Apply CSS var to :root immediately — user sees change in real time
  const handleChange = useCallback((key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
    document.documentElement.style.setProperty(key, val);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const toSave: Record<string, string> = {};
      VAR_DEFS.forEach(v => {
        const val = values[v.key];
        if (val && val !== v.default) toSave[v.key] = val;
      });
      if (Object.keys(toSave).length === 0) {
        toast.info('Нет изменений для сохранения');
        return;
      }
      await bridge.writeCssVars(toSave);
      toast.success('CSS переменные сохранены в global.css');
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const reset: Record<string, string> = {};
    VAR_DEFS.forEach(v => {
      reset[v.key] = v.default;
      document.documentElement.style.removeProperty(v.key);
    });
    setValues(reset);
    toast.info('Переменные сброшены к значениям по умолчанию');
  };

  const toggleTheme = (dark: boolean) => {
    setIsDark(dark);

    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      document.documentElement.style.backgroundColor = '#0a0a0a';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      document.documentElement.style.backgroundColor = '#E8E7E3';
    }

    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch {}

    // Broadcast to all other React islands via CustomEvent
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { isDark: dark } }));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' as const }}>

        {/* Theme toggle */}
        <SectionTitle>Режим темы</SectionTitle>
        <div style={{ display: 'flex', gap: 8, padding: '10px 12px' }}>
          {[
            { dark: true,  icon: <Moon size={13}/>, label: 'Тёмная' },
            { dark: false, icon: <Sun size={13}/>,  label: 'Светлая' },
          ].map(({ dark, icon, label }) => (
            <button
              key={label}
              onClick={() => toggleTheme(dark)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px', borderRadius: 7,
                border: `1px solid ${isDark === dark ? T.accent : T.border}`,
                background: isDark === dark ? T.accentSoft : T.bgHov,
                color: isDark === dark ? T.accent : T.fgMuted,
                cursor: 'pointer', fontSize: 12, fontWeight: isDark === dark ? 700 : 400,
                fontFamily: T.mono, transition: 'all 0.15s',
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Note about accent usage */}
        <div style={{ margin: '0 12px 4px', padding: '8px 10px', borderRadius: 6, background: T.accentSoft, border: `1px solid ${T.accent}30` }}>
          <div style={{ fontSize: 10, color: T.accent, fontWeight: 700, marginBottom: 3 }}>ℹ️ Акцентные цвета</div>
          <div style={{ fontSize: 10, color: T.fgMuted, lineHeight: 1.5 }}>
            Чтобы акцент применился в навигации — добавь в <code style={{ background: T.bgActive, padding: '1px 4px', borderRadius: 3, fontSize: 9 }}>global.css</code>:<br/>
            <code style={{ background: T.bgActive, padding: '2px 5px', borderRadius: 3, fontSize: 9, display: 'block', marginTop: 4 }}>
              .dark nav {'{'} --nav-accent: var(--accent-primary); {'}'}
            </code>
          </div>
        </div>

        {/* Favicon */}
        <SectionTitle>Логотип / Favicon</SectionTitle>
        <FaviconZone />

        {/* CSS Variables */}
        <SectionTitle>CSS переменные</SectionTitle>
        {Object.entries(groups).map(([name, vars]) => (
          <VarGroup key={name} name={name} vars={vars} values={values} onChange={handleChange} />
        ))}

        {/* Custom CSS */}
        <SectionTitle>Дополнительно</SectionTitle>
        <CustomCssEditor />
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 12px', borderTop: `1px solid ${T.border}`,
        background: T.bg, display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <Btn icon={<RotateCcw size={11}/>} onClick={handleReset}>Сброс</Btn>
        <Btn icon={<Save size={11}/>} variant="accent" loading={saving} onClick={handleSave} fullWidth>
          Сохранить в global.css
        </Btn>
      </div>
    </div>
  );
}