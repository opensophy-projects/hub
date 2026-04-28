import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { bridge } from '../useDevBridge';
import { ThemeTokensContext } from '../DevPanel';
import { toast } from '../components/Toast';
import { Loader2, LayoutTemplate, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import type { SiteConfig } from '../useDevBridge';
import {
  applyThemeColorOverrides,
  DEFAULT_THEME_COLORS,
  makeTokens,
  readThemeColorOverrides,
  THEME_COLOR_META,
  THEME_COLOR_STORAGE_KEY,
  type ThemeColorKey,
} from '@/shared/tokens/theme';

// Стили радио-индикатора выбранной опции
function RadioDot({ active, t }: { readonly active: boolean; readonly t: ReturnType<typeof useContext<typeof ThemeTokensContext>> }) {
  return (
    <div style={{
      width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
      border: `2px solid ${active ? t.fg : t.border}`,
      background: active ? t.fg : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.bg }} />}
    </div>
  );
}

// Кнопка выбора режима главной страницы
function ModeButton({
  active,
  saving,
  onClick,
  icon,
  label,
  description,
  t,
}: {
  readonly active: boolean;
  readonly saving: boolean;
  readonly onClick: () => void;
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly description: React.ReactNode;
  readonly t: ReturnType<typeof useContext<typeof ThemeTokensContext>>;
}) {
  return (
    <button
      disabled={saving}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px 14px', borderRadius: 9,
        border: `1px solid ${active ? t.borderStrong : t.border}`,
        background: active ? t.accentSoft : 'transparent',
        color: active ? t.fg : t.fgMuted,
        cursor: saving ? 'not-allowed' : 'pointer',
        textAlign: 'left', fontFamily: t.mono,
        opacity: saving ? 0.7 : 1,
      }}
    >
      <RadioDot active={active} t={t} />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          {icon}
          <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
        </div>
        <div style={{ fontSize: 10, color: t.fgSub, lineHeight: 1.5 }}>{description}</div>
      </div>
    </button>
  );
}

export default function SitePanel() {
  const t = useContext(ThemeTokensContext);

  const [config, setConfig]   = useState<SiteConfig>({ useLanding: false, showDotWaveBackground: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() =>
    typeof document === 'undefined' ? true : document.documentElement.classList.contains('dark')
  );
  const [themeColors, setThemeColors] = useState(() => ({
    dark: { ...DEFAULT_THEME_COLORS.dark },
    light: { ...DEFAULT_THEME_COLORS.light },
  }));

  // Хранит предыдущее значение конфига для отката при ошибке сохранения
  const prevConfig = useRef<SiteConfig>(config);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { config: cfg } = await bridge.readSiteConfig();
      setConfig({
        useLanding: cfg.useLanding === true,
        showDotWaveBackground: cfg.showDotWaveBackground !== false,
      });
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onTheme = (e: Event) => {
      const next = (e as CustomEvent<{ isDark: boolean }>).detail.isDark;
      setIsDarkTheme(next);
    };
    globalThis.addEventListener('hub:theme-change', onTheme);
    return () => globalThis.removeEventListener('hub:theme-change', onTheme);
  }, []);

  useEffect(() => {
    const ov = readThemeColorOverrides();
    setThemeColors({
      dark: { ...DEFAULT_THEME_COLORS.dark, ...ov.dark },
      light: { ...DEFAULT_THEME_COLORS.light, ...ov.light },
    });
  }, []);

  const dispatchThemeUpdate = useCallback(() => {
    const next = makeTokens(isDarkTheme);
    document.documentElement.style.backgroundColor = next.bgPage;
    globalThis.dispatchEvent(new CustomEvent('hub:theme-change', { detail: { isDark: isDarkTheme } }));
  }, [isDarkTheme]);

  const saveThemeColors = () => {
    const payload = { dark: themeColors.dark, light: themeColors.light };
    localStorage.setItem(THEME_COLOR_STORAGE_KEY, JSON.stringify(payload));
    applyThemeColorOverrides(payload);
    dispatchThemeUpdate();
    toast.success('Цвета тем обновлены');
  };

  const resetThemeColors = () => {
    const defaults = { dark: { ...DEFAULT_THEME_COLORS.dark }, light: { ...DEFAULT_THEME_COLORS.light } };
    setThemeColors(defaults);
    localStorage.setItem(THEME_COLOR_STORAGE_KEY, JSON.stringify(defaults));
    applyThemeColorOverrides(defaults);
    dispatchThemeUpdate();
    toast.success('Цвета тем сброшены');
  };

  // Универсальный хэндлер обновления конфига с откатом при ошибке
  const applyConfigChange = async (next: SiteConfig, successMsg: string) => {
    prevConfig.current = config;
    setConfig(next);
    setSaving(true);
    setError('');
    try {
      await bridge.writeSiteConfig(next);
      toast.success(successMsg);
    } catch (e: unknown) {
      setError((e as Error).message);
      setConfig(prevConfig.current);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLanding = (value: boolean) =>
    applyConfigChange(
      { ...config, useLanding: value },
      value ? 'Лендинг включён' : 'Welcome.md включён',
    );

  const handleToggleDotWave = (value: boolean) =>
    applyConfigChange(
      { ...config, showDotWaveBackground: value },
      value ? 'DotWave фон включён' : 'DotWave фон отключён',
    );

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.fgSub, fontSize: 12 }}>
        <Loader2 size={14} style={{ animation: 'devSpin 1s linear infinite' }} /> Загрузка...
      </div>
    );
  }

  const dotWaveEnabled = config.showDotWaveBackground ?? true;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: t.bg }} className="adm-scroll">

      {/* Заголовок */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 9, fontWeight: 700, color: t.fgSub,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
      }}>
        ГЛАВНАЯ СТРАНИЦА
      </div>

      {/* Описание */}
      <div style={{
        fontSize: 11, color: t.fgMuted, lineHeight: 1.55,
        marginBottom: 16, padding: '8px 10px',
        borderRadius: 7, border: `1px solid ${t.border}`,
        background: t.surface,
      }}>
        Выберите, что отображается на главной странице (<code style={{ fontFamily: t.mono, fontSize: 10 }}>/</code>).
        Изменение вступит в силу при следующем обращении к странице.
      </div>

      {/* Переключатель режима главной страницы */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <ModeButton
          active={!config.useLanding}
          saving={saving}
          onClick={() => handleToggleLanding(false)}
          icon={<FileText size={13} style={{ color: config.useLanding ? t.fgMuted : t.fg }} />}
          label="Welcome.md"
          description={<>Стандартная документация. Файл <code style={{ fontFamily: t.mono }}>Docs/welcome.md</code> отображается как главная страница.</>}
          t={t}
        />
        <ModeButton
          active={config.useLanding}
          saving={saving}
          onClick={() => handleToggleLanding(true)}
          icon={<LayoutTemplate size={13} style={{ color: config.useLanding ? t.fg : t.fgMuted }} />}
          label="Лендинг"
          description={<>Визуальная посадочная страница из <code style={{ fontFamily: t.mono }}>GeneralPage.tsx</code>. Welcome.md игнорируется.</>}
          t={t}
        />
      </div>

      {/* Статус сохранения */}
      {saving && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, color: t.fgMuted, marginBottom: 10,
        }}>
          <Loader2 size={11} style={{ animation: 'devSpin 1s linear infinite' }} />
          Сохранение...
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div style={{
          padding: '8px 10px', borderRadius: 6,
          background: t.bg, border: `1px solid ${t.danger}44`,
          color: t.danger, fontSize: 11,
          display: 'flex', gap: 6, alignItems: 'center',
          marginBottom: 10,
        }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}

      <div style={{ height: 1, background: t.border, margin: '8px 0 12px' }} />

      {/* Настройка DotWave фона */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10, padding: '10px 12px',
        borderRadius: 7, border: `1px solid ${t.border}`, background: t.surface,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, color: t.fgMuted, fontWeight: 600 }}>DotWave фон в шапке документа</span>
          <span style={{ fontSize: 10, color: t.fgSub }}>Если выключить, фон будет как у навигации.</span>
        </div>
        <button
          disabled={saving}
          onClick={() => handleToggleDotWave(!dotWaveEnabled)}
          style={{
            border: `1px solid ${t.border}`,
            background: dotWaveEnabled ? t.accentSoft : 'transparent',
            color: t.fgMuted,
            borderRadius: 6,
            padding: '5px 9px',
            fontSize: 10,
            fontFamily: t.mono,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {dotWaveEnabled ? 'ВКЛ' : 'ВЫКЛ'}
        </button>
      </div>

      {/* Текущее состояние */}
      <div style={{
        fontSize: 10, color: t.fgSub,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>
          Сейчас: <strong style={{ color: t.fgMuted }}>
            {config.useLanding ? 'Лендинг' : 'Welcome.md'} · DotWave: {dotWaveEnabled ? 'вкл' : 'выкл'}
          </strong>
        </span>
        <button
          onClick={load}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 5,
            border: `1px solid ${t.border}`, background: 'transparent',
            color: t.fgMuted, fontSize: 10, cursor: 'pointer', fontFamily: t.mono,
          }}
        >
          <RefreshCw size={9} /> Обновить
        </button>
      </div>

      {/* Подсказка о перезагрузке */}
      <div style={{
        marginTop: 16, padding: '8px 10px', borderRadius: 7,
        border: `1px solid ${t.border}`, background: t.surface,
        fontSize: 10, color: t.fgSub, lineHeight: 1.55,
      }}>
        💡 После изменения режима в dev-режиме достаточно обновить страницу (<code style={{ fontFamily: t.mono }}>F5</code>).
        В продакшне потребуется пересборка.
      </div>

      <div style={{ height: 1, background: t.border, margin: '12px 0' }} />

      {/* Цвета тем */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 700, color: t.fgSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        ЦВЕТА ТЕМ
      </div>
      <div style={{
        marginBottom: 10, padding: '8px 10px', borderRadius: 7,
        border: `1px solid ${t.border}`, background: t.surface,
        fontSize: 10, color: t.fgMuted, lineHeight: 1.55,
      }}>
        Здесь можно менять ВСЕ токены цветов. У каждого поля указано, где этот цвет используется.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 330, overflowY: 'auto', paddingRight: 2 }} className="adm-scroll">
        {(Object.keys(THEME_COLOR_META) as ThemeColorKey[]).map((key) => (
          <div key={key} style={{ border: `1px solid ${t.border}`, borderRadius: 8, padding: 8, background: t.surface }}>
            <div style={{ fontSize: 11, color: t.fg, fontWeight: 600 }}>{THEME_COLOR_META[key].label}</div>
            <div style={{ fontSize: 10, color: t.fgSub, margin: '2px 0 6px' }}>{THEME_COLOR_META[key].usage}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10, color: t.fgMuted }}>
                Dark ({key})
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="color"
                    value={themeColors.dark[key].startsWith('#') ? themeColors.dark[key] : '#000000'}
                    onChange={e => setThemeColors(prev => ({ dark: { ...prev.dark, [key]: e.target.value }, light: prev.light }))}
                    style={{ width: 34, height: 28, background: 'transparent', border: `1px solid ${t.border}`, borderRadius: 6, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={themeColors.dark[key]}
                    onChange={e => setThemeColors(prev => ({ dark: { ...prev.dark, [key]: e.target.value }, light: prev.light }))}
                    style={{ flex: 1, height: 28, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 6, color: t.fgMuted, padding: '0 8px', fontSize: 10, fontFamily: t.mono }}
                  />
                </div>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10, color: t.fgMuted }}>
                Light ({key})
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="color"
                    value={themeColors.light[key].startsWith('#') ? themeColors.light[key] : '#ffffff'}
                    onChange={e => setThemeColors(prev => ({ dark: prev.dark, light: { ...prev.light, [key]: e.target.value } }))}
                    style={{ width: 34, height: 28, background: 'transparent', border: `1px solid ${t.border}`, borderRadius: 6, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={themeColors.light[key]}
                    onChange={e => setThemeColors(prev => ({ dark: prev.dark, light: { ...prev.light, [key]: e.target.value } }))}
                    style={{ flex: 1, height: 28, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 6, color: t.fgMuted, padding: '0 8px', fontSize: 10, fontFamily: t.mono }}
                  />
                </div>
              </label>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={saveThemeColors}
          style={{
            flex: 1, borderRadius: 8, padding: '8px 10px',
            border: `1px solid ${t.borderStrong}`,
            background: t.accentSoft,
            color: t.fg,
            fontSize: 11, fontFamily: t.mono, cursor: 'pointer',
          }}
        >
          Применить
        </button>
        <button
          onClick={resetThemeColors}
          style={{
            flex: 1, borderRadius: 8, padding: '8px 10px',
            border: `1px solid ${t.border}`,
            background: 'transparent',
            color: t.fgMuted,
            fontSize: 11, fontFamily: t.mono, cursor: 'pointer',
          }}
        >
          Сбросить
        </button>
      </div>
    </div>
  );
}