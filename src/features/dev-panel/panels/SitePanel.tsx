import React, { useState, useEffect, useCallback, useContext } from 'react';
import { bridge } from '../useDevBridge';
import { ThemeTokensContext } from '../DevPanel';
import { toast } from '../components/Toast';
import { Loader2, LayoutTemplate, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import type { SiteConfig } from '../useDevBridge';

export default function SitePanel() {
  const t = useContext(ThemeTokensContext);

  const [config, setConfig]   = useState<SiteConfig>({ useLanding: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { config: cfg } = await bridge.readSiteConfig();
      setConfig(cfg);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleLanding = async (value: boolean) => {
    const next = { ...config, useLanding: value };
    setConfig(next);
    setSaving(true);
    setError('');
    try {
      await bridge.writeSiteConfig(next);
      toast.success(value ? 'Лендинг включён' : 'Welcome.md включён');
    } catch (e: unknown) {
      setError((e as Error).message);
      // Откатываем при ошибке
      setConfig(config);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.fgSub, fontSize: 12 }}>
      <Loader2 size={14} style={{ animation: 'devSpin 1s linear infinite' }}/> Загрузка...
    </div>
  );

  const optionBg     = (active: boolean) => active ? t.accentSoft : 'transparent';
  const optionBorder = (active: boolean) => active ? t.borderStrong : t.border;
  const optionColor  = (active: boolean) => active ? t.fg : t.fgMuted;

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

      {/* Переключатель */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>

        {/* Welcome.md */}
        <button
          disabled={saving}
          onClick={() => handleToggleLanding(false)}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 14px', borderRadius: 9,
            border: `1px solid ${optionBorder(!config.useLanding)}`,
            background: optionBg(!config.useLanding),
            color: optionColor(!config.useLanding),
            cursor: saving ? 'not-allowed' : 'pointer',
            textAlign: 'left', fontFamily: t.mono,
            opacity: saving ? 0.7 : 1,
          }}
        >
          <div style={{
            width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
            border: `2px solid ${!config.useLanding ? t.fg : t.border}`,
            background: !config.useLanding ? t.fg : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {!config.useLanding && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.bg }} />
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <FileText size={13} style={{ color: !config.useLanding ? t.fg : t.fgMuted }} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Welcome.md</span>
            </div>
            <div style={{ fontSize: 10, color: t.fgSub, lineHeight: 1.5 }}>
              Стандартная документация. Файл <code style={{ fontFamily: t.mono }}>Docs/welcome.md</code> отображается как главная страница.
            </div>
          </div>
        </button>

        {/* Лендинг */}
        <button
          disabled={saving}
          onClick={() => handleToggleLanding(true)}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 14px', borderRadius: 9,
            border: `1px solid ${optionBorder(config.useLanding)}`,
            background: optionBg(config.useLanding),
            color: optionColor(config.useLanding),
            cursor: saving ? 'not-allowed' : 'pointer',
            textAlign: 'left', fontFamily: t.mono,
            opacity: saving ? 0.7 : 1,
          }}
        >
          <div style={{
            width: 16, height: 16, borderRadius: '50%', flexShrink: 0, marginTop: 1,
            border: `2px solid ${config.useLanding ? t.fg : t.border}`,
            background: config.useLanding ? t.fg : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {config.useLanding && (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.bg }} />
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <LayoutTemplate size={13} style={{ color: config.useLanding ? t.fg : t.fgMuted }} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>Лендинг</span>
            </div>
            <div style={{ fontSize: 10, color: t.fgSub, lineHeight: 1.5 }}>
              Визуальная посадочная страница из <code style={{ fontFamily: t.mono }}>GeneralPage.tsx</code>. Welcome.md игнорируется.
            </div>
          </div>
        </button>
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

      {/* Разделитель */}
      <div style={{ height: 1, background: t.border, margin: '8px 0 12px' }} />

      {/* Текущее состояние */}
      <div style={{
        fontSize: 10, color: t.fgSub,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>
          Сейчас: <strong style={{ color: t.fgMuted }}>
            {config.useLanding ? 'Лендинг' : 'Welcome.md'}
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
    </div>
  );
}