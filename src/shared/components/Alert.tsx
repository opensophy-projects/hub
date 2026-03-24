import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Info, Lightbulb, AlertCircle, AlertTriangle, OctagonX } from 'lucide-react';

interface AlertProps {
  type: 'note' | 'tip' | 'important' | 'warning' | 'caution';
  children: React.ReactNode;
}

interface AlertColors {
  bg: string;
  border: string;
  text: string;
  title: string;
  iconColor: string;
}

function getColors(type: AlertProps['type'], isDark: boolean): AlertColors {
  if (isDark) {
    const dark: Record<AlertProps['type'], AlertColors> = {
      note:      { bg: 'rgba(59,130,246,0.06)',  border: 'rgba(59,130,246,0.15)',  text: 'rgba(147,197,253,0.8)', title: 'rgba(147,197,253,0.95)', iconColor: 'rgba(96,165,250,0.85)'  },
      tip:       { bg: 'rgba(34,197,94,0.06)',   border: 'rgba(34,197,94,0.15)',   text: 'rgba(134,239,172,0.8)', title: 'rgba(134,239,172,0.95)', iconColor: 'rgba(74,222,128,0.85)'  },
      important: { bg: 'rgba(168,85,247,0.06)',  border: 'rgba(168,85,247,0.15)', text: 'rgba(216,180,254,0.8)', title: 'rgba(216,180,254,0.95)', iconColor: 'rgba(192,132,252,0.85)' },
      warning:   { bg: 'rgba(234,179,8,0.06)',   border: 'rgba(234,179,8,0.15)',   text: 'rgba(253,224,71,0.8)',  title: 'rgba(253,224,71,0.95)',  iconColor: 'rgba(250,204,21,0.85)'  },
      caution:   { bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.15)',   text: 'rgba(252,165,165,0.8)', title: 'rgba(252,165,165,0.95)', iconColor: 'rgba(248,113,113,0.85)' },
    };
    return dark[type];
  }

  const light: Record<AlertProps['type'], AlertColors> = {
    note: {
      bg:        '#d4d9e0',
      border:    'rgba(85,128,160,0.2)',
      text:      'rgba(0,0,0,0.62)',
      title:     'rgba(0,0,0,0.82)',
      iconColor: '#4a6f8a',
    },
    tip: {
      bg:        '#d4ddd4',
      border:    'rgba(82,130,90,0.2)',
      text:      'rgba(0,0,0,0.62)',
      title:     'rgba(0,0,0,0.82)',
      iconColor: '#446a4c',
    },
    important: {
      bg:        '#dad4e0',
      border:    'rgba(122,90,160,0.2)',
      text:      'rgba(0,0,0,0.62)',
      title:     'rgba(0,0,0,0.82)',
      iconColor: '#664888',
    },
    warning: {
      bg:        '#dedad0',
      border:    'rgba(143,120,48,0.2)',
      text:      'rgba(0,0,0,0.62)',
      title:     'rgba(0,0,0,0.82)',
      iconColor: '#7a6428',
    },
    caution: {
      bg:        '#ddd4d4',
      border:    'rgba(160,82,82,0.2)',
      text:      'rgba(0,0,0,0.62)',
      title:     'rgba(0,0,0,0.82)',
      iconColor: '#884040',
    },
  };
  return light[type];
}

const ICONS: Record<AlertProps['type'], React.ElementType> = {
  note:      Info,
  tip:       Lightbulb,
  important: AlertCircle,
  warning:   AlertTriangle,
  caution:   OctagonX,
};

const TITLES: Record<AlertProps['type'], string> = {
  note:      'Примечание',
  tip:       'Совет',
  important: 'Важно',
  warning:   'Предупреждение',
  caution:   'Осторожно',
};

const Alert: React.FC<AlertProps> = ({ type, children }) => {
  const { isDark } = useTheme();
  const c    = getColors(type, isDark);
  const Icon = ICONS[type];

  return (
    <div
      style={{
        display:      'flex',
        gap:          '0.75rem',
        padding:      '0.8rem 1rem',
        borderRadius: '0.5rem',
        border:       `1px solid ${c.border}`,
        background:   c.bg,
        margin:       '1rem 0',
      }}
    >
      <Icon size={17} style={{ color: c.iconColor, flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 0.2rem 0', fontWeight: 700, fontSize: '0.78rem', color: c.title, lineHeight: 1.3 }}>
          {TITLES[type]}
        </p>
        <div style={{ fontSize: '0.85rem', color: c.text, lineHeight: 1.6 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Alert;