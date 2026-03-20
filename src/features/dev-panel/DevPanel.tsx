/**
 * DevPanel — главная оболочка dev-панели
 * Floating боковая панель с табами. Только в dev-режиме.
 * Стиль: утилитарный инструмент разработчика, тёмный, плотный, без лишнего.
 */

import React, {
  useState, useCallback, useEffect, useRef, Suspense, lazy,
} from 'react';
import { createPortal } from 'react-dom';
import { useDevBridge } from './useDevBridge';
import {
  Settings, FileText, Navigation, Users, Palette,
  Image, ChevronLeft, ChevronRight, Terminal, Zap,
  RefreshCw, X, AlertCircle, Wifi, WifiOff,
} from 'lucide-react';

// Ленивая загрузка панелей
const ThemePanel     = lazy(() => import('./panels/ThemePanel'));
const NavEditorPanel = lazy(() => import('./panels/NavEditorPanel'));
const PageEditorPanel= lazy(() => import('./panels/PageEditorPanel'));
const ContactsPanel  = lazy(() => import('./panels/ContactsPanel'));
const AssetsPanel    = lazy(() => import('./panels/AssetsPanel'));
const GeneratePanel  = lazy(() => import('./panels/GeneratePanel'));

// ─── Токены ───────────────────────────────────────────────────────────────────

const T = {
  bg:         '#0c0c0e',
  bgPanel:    '#111114',
  bgHov:      '#1a1a1f',
  bgActive:   '#1e1e24',
  border:     'rgba(255,255,255,0.08)',
  borderHov:  'rgba(255,255,255,0.14)',
  fg:         'rgba(255,255,255,0.9)',
  fgMuted:    'rgba(255,255,255,0.4)',
  fgSub:      'rgba(255,255,255,0.22)',
  accent:     '#7c5cfc',
  accentGlow: 'rgba(124,92,252,0.3)',
  accentSoft: 'rgba(124,92,252,0.12)',
  success:    '#22c55e',
  warning:    '#f59e0b',
  danger:     '#ef4444',
  dangerSoft: 'rgba(239,68,68,0.1)',
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType<{ onClose?: () => void }>;
}

const TABS: Tab[] = [
  { id: 'theme',    label: 'Тема',      icon: <Palette    size={15}/>, component: ThemePanel      },
  { id: 'nav',      label: 'Навигация', icon: <Navigation size={15}/>, component: NavEditorPanel  },
  { id: 'pages',    label: 'Страницы',  icon: <FileText   size={15}/>, component: PageEditorPanel },
  { id: 'contacts', label: 'Контакты',  icon: <Users      size={15}/>, component: ContactsPanel   },
  { id: 'assets',   label: 'Ассеты',    icon: <Image      size={15}/>, component: AssetsPanel     },
  { id: 'generate', label: 'Билд',      icon: <Terminal   size={15}/>, component: GeneratePanel   },
];

// ─── PanelShell ───────────────────────────────────────────────────────────────

interface PanelShellProps {
  visible: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (id: string) => void;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

function PanelShell({ visible, onClose, activeTab, onTabChange, status }: PanelShellProps) {
  const [width, setWidth] = useState(420);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartW = useRef(0);

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartW.current = width;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = dragStartX.current - ev.clientX;
      setWidth(Math.max(340, Math.min(680, dragStartW.current + delta)));
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [width]);

  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component ?? ThemePanel;

  const statusColor = status === 'connected' ? T.success
    : status === 'connecting' ? T.warning
    : T.danger;

  const statusLabel = status === 'connected' ? 'Подключено'
    : status === 'connecting' ? 'Подключение...'
    : 'Отключено';

  return (
    <div style={{
      position: 'fixed',
      right: visible ? 0 : -width - 10,
      top: 0,
      height: '100vh',
      width,
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      background: T.bg,
      borderLeft: `1px solid ${T.border}`,
      boxShadow: '-4px 0 40px rgba(0,0,0,0.6)',
      transition: 'right 0.25s cubic-bezier(0.4,0,0.2,1)',
      fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
    }}>
      {/* Resize handle */}
      <div
        onMouseDown={onResizeMouseDown}
        style={{
          position: 'absolute',
          left: -4,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: 'col-resize',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{
          width: 3,
          height: 48,
          borderRadius: 3,
          background: T.border,
          transition: 'background 0.15s',
        }} />
      </div>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
        background: T.bgPanel,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flex: 1,
        }}>
          <div style={{
            width: 22,
            height: 22,
            borderRadius: 5,
            background: T.accentSoft,
            border: `1px solid ${T.accent}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Zap size={12} style={{ color: T.accent }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.fg, letterSpacing: '0.05em' }}>
            HUB DEV
          </span>
          <span style={{
            fontSize: 9,
            fontWeight: 600,
            color: T.accent,
            background: T.accentSoft,
            border: `1px solid ${T.accent}33`,
            borderRadius: 4,
            padding: '1px 5px',
            letterSpacing: '0.08em',
          }}>
            DEV ONLY
          </span>
        </div>

        {/* Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 10,
          color: statusColor,
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: statusColor,
            boxShadow: status === 'connected' ? `0 0 6px ${T.success}` : 'none',
          }} />
          {statusLabel}
        </div>

        <button
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: 5,
            border: `1px solid ${T.border}`,
            background: 'transparent',
            color: T.fgMuted,
            cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = T.fg; (e.currentTarget as HTMLButtonElement).style.background = T.bgHov; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = T.fgMuted; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${T.border}`,
        background: T.bgPanel,
        flexShrink: 0,
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '8px 12px',
                border: 'none',
                borderBottom: isActive ? `2px solid ${T.accent}` : '2px solid transparent',
                background: isActive ? T.accentSoft : 'transparent',
                color: isActive ? T.accent : T.fgMuted,
                fontSize: 11,
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.12s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = T.fg;
                  (e.currentTarget as HTMLButtonElement).style.background = T.bgHov;
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = T.fgMuted;
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: T.fgSub, fontSize: 12 }}>
            Загрузка...
          </div>
        }>
          <ActiveComponent />
        </Suspense>
      </div>
    </div>
  );
}

// ─── Toggle button ─────────────────────────────────────────────────────────────

function ToggleButton({ visible, onClick, hasError }: { visible: boolean; onClick: () => void; hasError: boolean }) {
  const [hov, setHov] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={visible ? 'Скрыть Dev Panel' : 'Открыть Dev Panel'}
      style={{
        position: 'fixed',
        right: visible ? 0 : 0,
        bottom: 80,
        zIndex: 99998,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 10px',
        background: hov ? T.accent : T.bg,
        border: `1px solid ${hov ? T.accent : T.border}`,
        borderRight: 'none',
        borderRadius: '8px 0 0 8px',
        color: hov ? '#fff' : T.fgMuted,
        cursor: 'pointer',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        transition: 'all 0.15s',
        boxShadow: hov ? `-4px 0 20px ${T.accentGlow}` : '-2px 0 12px rgba(0,0,0,0.4)',
        fontFamily: 'ui-monospace, monospace',
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
      }}
    >
      {hasError && <AlertCircle size={11} style={{ color: T.danger }} />}
      <Zap size={11} />
      <span>DEV</span>
    </button>
  );
}

// ─── DevPanel root ─────────────────────────────────────────────────────────────

export default function DevPanel() {
  const { status } = useDevBridge();
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('theme');

  // Keyboard shortcut: Ctrl+Shift+D
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setVisible(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <ToggleButton
        visible={visible}
        onClick={() => setVisible(v => !v)}
        hasError={status === 'error' || status === 'disconnected'}
      />
      <PanelShell
        visible={visible}
        onClose={() => setVisible(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        status={status}
      />
    </>,
    document.body
  );
}

export { T };