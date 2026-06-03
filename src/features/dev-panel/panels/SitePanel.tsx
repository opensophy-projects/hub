import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { bridge } from '../useDevBridge';
import { ThemeTokensContext } from '../theme';
import { toast } from '../components/toastBus';
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
        padding: '14px 16px', borderRadius: 9,
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
          <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
        </div>
        <div style={{ fontSize: 12, color: t.fgSub, lineHeight: 1.5 }}>{description}</div>
      </div>
    </button>
  );
}

export default function SitePanel() {
  const t = useContext(ThemeTokensContext);

  const [config, setConfig]   = useState<SiteConfig>({ useLanding: false, showDotWaveBackground: true, introLoaderText: 'opensophy' });
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
        introLoaderText: typeof cfg.introLoaderText === 'string' && cfg.introLoaderText.trim() ? cfg.introLoaderText : 'opensophy',
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
      value ? 'Режим: лендинг' : 'Режим: документация',
    );

  const handleToggleDotWave = (value: boolean) =>
    applyConfigChange(
      { ...config, showDotWaveBackground: value },
      value ? 'Фон шапки включён' : 'Фон шапки отключён',
    );

  const handleIntroLoaderTextBlur = () => {
    const nextText = (config.introLoaderText || '').trim() || 'opensophy';
    if (nextText === config.introLoaderText) return;
    void applyConfigChange(
      { ...config, introLoaderText: nextText },
      'Текст загрузчика обновлён',
    );
  };

  const handleIntroLoaderTextSave = () => {
    const nextText = (config.introLoaderText || '').trim() || 'opensophy';
    void applyConfigChange(
      { ...config, introLoaderText: nextText },
      'Текст загрузчика обновлён',
    );
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.fgSub, fontSize: 14 }}>
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
        fontSize: 11, fontWeight: 700, color: t.fgSub,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12,
      }}>
        ГЛАВНАЯ СТРАНИЦА
      </div>

      {/* Описание */}
      <div style={{
        fontSize: 13, color: t.fgMuted, lineHeight: 1.55,
        marginBottom: 16, padding: '10px 12px',
        borderRadius: 7, border: `1px solid ${t.border}`,
        background: t.surface,
      }}>
        Выберите, что отображается на главной странице (<code style={{ fontFamily: t.mono, fontSize: 12 }}>/</code>).
        Изменение вступит в силу при следующем обращении к странице.
      </div>

      {/* Переключатель режима главной страницы */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <ModeButton
          active={!config.useLanding}
          saving={saving}
          onClick={() => handleToggleLanding(false)}
          icon={<FileText size={15} style={{ color: config.useLanding ? t.fgMuted : t.fg }} />}
          label="Welcome.md"
          description={<>Показывать обычную главную документации из файла <code style={{ fontFamily: t.mono }}>Docs/welcome.md</code>.</>}
          t={t}
        />
        <ModeButton
          active={config.useLanding}
          saving={saving}
          onClick={() => handleToggleLanding(true)}
          icon={<LayoutTemplate size={15} style={{ color: config.useLanding ? t.fg : t.fgMuted }} />}
          label="Лендинг"
          description={<>Показывать лендинг-страницу. В этом режиме <code style={{ fontFamily: t.mono }}>Welcome.md</code> не используется.</>}
          t={t}
        />
      </div>

      {/* Статус сохранения */}
      {saving && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: t.fgMuted, marginBottom: 10,
        }}>
          <Loader2 size={13} style={{ animation: 'devSpin 1s linear infinite' }} />
          Сохранение...
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div style={{
          padding: '10px 12px', borderRadius: 6,
          background: t.bg, border: `1px solid ${t.danger}44`,
          color: t.danger, fontSize: 13,
          display: 'flex', gap: 6, alignItems: 'center',
          marginBottom: 10,
        }}>
          <AlertCircle size={14} /> {error}
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
          <span style={{ fontSize: 13, color: t.fgMuted, fontWeight: 600 }}>Фон в шапке страницы</span>
          <span style={{ fontSize: 12, color: t.fgSub }}>Если выключить, шапка станет спокойнее и ближе к фону навигации.</span>
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
            fontSize: 12,
            fontFamily: t.mono,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {dotWaveEnabled ? 'ВКЛ' : 'ВЫКЛ'}
        </button>
      </div>

      {/* Отображение загрузчика */}
      <div style={{ height: 1, background: t.border, margin: '12px 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: t.fgSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        ОТОБРАЖЕНИЕ ЗАГРУЗЧИКА
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        marginBottom: 12, padding: '10px 12px',
        borderRadius: 7, border: `1px solid ${t.border}`, background: t.surface,
      }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: t.fgMuted }}>
          Текст intro loader
          <input
            type="text"
            value={config.introLoaderText || 'opensophy'}
            disabled={saving}
            onChange={e => setConfig(prev => ({ ...prev, introLoaderText: e.target.value }))}
            onBlur={handleIntroLoaderTextBlur}
            placeholder="opensophy"
            style={{
              height: 34, background: t.bg, border: `1px solid ${t.border}`,
              borderRadius: 7, color: t.fg, padding: '0 10px',
              fontSize: 13, fontFamily: t.mono, outline: 'none',
            }}
          />
        </label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 12, color: t.fgSub, lineHeight: 1.45 }}>
            Используется на первом экране загрузки. Цвета берутся из текущих токенов темы.
          </span>
          <button
            disabled={saving}
            onClick={handleIntroLoaderTextSave}
            style={{
              flexShrink: 0, border: `1px solid ${t.borderStrong}`,
              background: t.accentSoft, color: t.fg,
              borderRadius: 6, padding: '7px 10px', fontSize: 12,
              fontFamily: t.mono, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            Сохранить
          </button>
        </div>
      </div>

      {/* Текущее состояние */}
      <div style={{
        fontSize: 12, color: t.fgSub,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>
          Сейчас: <strong style={{ color: t.fgMuted }}>
            {config.useLanding ? 'Лендинг' : 'Документация'} · Фон шапки: {dotWaveEnabled ? 'вкл' : 'выкл'} · Loader: {config.introLoaderText || 'opensophy'}
          </strong>
        </span>
        <button
          onClick={load}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 5,
            border: `1px solid ${t.border}`, background: 'transparent',
            color: t.fgMuted, fontSize: 12, cursor: 'pointer', fontFamily: t.mono,
          }}
        >
          <RefreshCw size={9} /> Обновить
        </button>
      </div>

      {/* Подсказка о перезагрузке */}
      <div style={{
        marginTop: 16, padding: '10px 12px', borderRadius: 7,
        border: `1px solid ${t.border}`, background: t.surface,
        fontSize: 12, color: t.fgSub, lineHeight: 1.55,
      }}>
        💡 После изменения режима обновите страницу сайта (<code style={{ fontFamily: t.mono }}>F5</code>).
        В production-окружении может понадобиться пересборка.
      </div>

      <div style={{ height: 1, background: t.border, margin: '12px 0' }} />

      {/* Цвета тем */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: t.fgSub, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        ЦВЕТА САЙТА
      </div>
      <div style={{
        marginBottom: 10, padding: '10px 12px', borderRadius: 7,
        border: `1px solid ${t.border}`, background: t.surface,
        fontSize: 12, color: t.fgMuted, lineHeight: 1.55,
      }}>
        Здесь можно настроить цвета светлой и тёмной тем. У каждого параметра есть подсказка — где он применяется.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 330, overflowY: 'auto', paddingRight: 2 }} className="adm-scroll">
        {(Object.keys(THEME_COLOR_META) as ThemeColorKey[]).map((key) => (
          <div key={key} style={{ border: `1px solid ${t.border}`, borderRadius: 8, padding: 8, background: t.surface }}>
            <div style={{ fontSize: 13, color: t.fg, fontWeight: 600 }}>{THEME_COLOR_META[key].label}</div>
            <div style={{ fontSize: 12, color: t.fgSub, margin: '2px 0 6px' }}>{THEME_COLOR_META[key].usage}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: t.fgMuted }}>
                Тёмная тема ({key})
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
                    style={{ flex: 1, height: 28, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 6, color: t.fgMuted, padding: '0 8px', fontSize: 12, fontFamily: t.mono }}
                  />
                </div>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: t.fgMuted }}>
                Светлая тема ({key})
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
                    style={{ flex: 1, height: 28, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 6, color: t.fgMuted, padding: '0 8px', fontSize: 12, fontFamily: t.mono }}
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
            flex: 1, borderRadius: 8, padding: '10px 12px',
            border: `1px solid ${t.borderStrong}`,
            background: t.accentSoft,
            color: t.fg,
            fontSize: 13, fontFamily: t.mono, cursor: 'pointer',
          }}
        >
          Сохранить цвета
        </button>
        <button
          onClick={resetThemeColors}
          style={{
            flex: 1, borderRadius: 8, padding: '10px 12px',
            border: `1px solid ${t.border}`,
            background: 'transparent',
            color: t.fgMuted,
            fontSize: 13, fontFamily: t.mono, cursor: 'pointer',
          }}
        >
          Вернуть стандартные
        </button>
      </div>
    </div>
  );
}