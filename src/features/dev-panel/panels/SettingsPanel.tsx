/**
 * SettingsPanel — настройки Dev Panel
 * Общие параметры: WebSocket URL, горячие клавиши, сброс настроек
 */

import React, { useState } from 'react';
import { T, SectionTitle, Btn, Divider } from '../components/ui';
import { toast } from '../components/Toast';
import { Settings, RotateCcw, Keyboard, Wifi } from 'lucide-react';

export default function SettingsPanel() {
  const [wsUrl, setWsUrl] = useState('ws://127.0.0.1:7777');

  const handleReset = () => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('hub-dev'));
      keys.forEach(k => localStorage.removeItem(k));
      toast.success('Настройки сброшены');
    } catch {
      toast.error('Не удалось сбросить настройки');
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>

      {/* WebSocket */}
      <SectionTitle>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Wifi size={11} /> Соединение
        </span>
      </SectionTitle>
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontSize: 10, color: T.fgSub, marginBottom: 6 }}>
          WebSocket URL сервера
        </div>
        <input
          value={wsUrl}
          onChange={e => setWsUrl(e.target.value)}
          style={{
            width: '100%', padding: '6px 9px', borderRadius: 6,
            border: `1px solid ${T.border}`,
            background: T.bgHov, color: T.fg,
            fontSize: 12, outline: 'none',
            boxSizing: 'border-box' as const,
            fontFamily: T.mono,
          }}
        />
        <div style={{ fontSize: 10, color: T.fgSub, marginTop: 6 }}>
          Только localhost — внешние подключения заблокированы сервером
        </div>
      </div>

      <Divider />

      {/* Hotkeys */}
      <SectionTitle>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Keyboard size={11} /> Горячие клавиши
        </span>
      </SectionTitle>
      <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { keys: 'Ctrl+Shift+D', desc: 'Открыть / закрыть панель' },
          { keys: 'Ctrl+Shift+1', desc: 'Вкладка Тема' },
          { keys: 'Ctrl+Shift+2', desc: 'Вкладка Навигация' },
          { keys: 'Ctrl+Shift+3', desc: 'Вкладка Страницы' },
          { keys: 'Ctrl+Shift+4', desc: 'Вкладка Контакты' },
          { keys: 'Ctrl+Shift+5', desc: 'Вкладка Ассеты' },
          { keys: 'Ctrl+Shift+6', desc: 'Вкладка Generate' },
        ].map(({ keys, desc }) => (
          <div key={keys} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <kbd style={{
              background: T.bgActive, border: `1px solid ${T.border}`,
              borderRadius: 4, padding: '2px 7px',
              fontSize: 10, fontFamily: T.mono, color: T.accent,
              flexShrink: 0, whiteSpace: 'nowrap',
            }}>
              {keys}
            </kbd>
            <span style={{ fontSize: 11, color: T.fgMuted }}>{desc}</span>
          </div>
        ))}
      </div>

      <Divider />

      {/* Reset */}
      <SectionTitle>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Settings size={11} /> Сброс
        </span>
      </SectionTitle>
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontSize: 11, color: T.fgSub, marginBottom: 10, lineHeight: 1.5 }}>
          Сбрасывает ширину панели, активную вкладку и другие локальные настройки Dev Panel.
        </div>
        <Btn
          variant="danger"
          icon={<RotateCcw size={11} />}
          onClick={handleReset}
          fullWidth
        >
          Сбросить все настройки
        </Btn>
      </div>

    </div>
  );
}