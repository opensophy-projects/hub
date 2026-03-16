import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Info, Lightbulb, AlertCircle, AlertTriangle, OctagonX } from 'lucide-react';

interface AlertProps {
  type: 'note' | 'tip' | 'important' | 'warning' | 'caution';
  children: React.ReactNode;
}

// ─── Color tokens ─────────────────────────────────────────────────────────────
//
// Light theme: pastel/muted tones — low saturation, slightly warm backgrounds
// Dark theme:  subtle — very low opacity fills, muted borders and text

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
      note: {
        bg:        'rgba(59,130,246,0.07)',
        border:    'rgba(59,130,246,0.22)',
        text:      'rgba(147,197,253,0.85)',
        title:     'rgba(147,197,253,1)',
        iconColor: 'rgba(96,165,250,0.9)',
      },
      tip: {
        bg:        'rgba(34,197,94,0.07)',
        border:    'rgba(34,197,94,0.22)',
        text:      'rgba(134,239,172,0.85)',
        title:     'rgba(134,239,172,1)',
        iconColor: 'rgba(74,222,128,0.9)',
      },
      important: {
        bg:        'rgba(168,85,247,0.07)',
        border:    'rgba(168,85,247,0.22)',
        text:      'rgba(216,180,254,0.85)',
        title:     'rgba(216,180,254,1)',
        iconColor: 'rgba(192,132,252,0.9)',
      },
      warning: {
        bg:        'rgba(234,179,8,0.07)',
        border:    'rgba(234,179,8,0.22)',
        text:      'rgba(253,224,71,0.85)',
        title:     'rgba(253,224,71,1)',
        iconColor: 'rgba(250,204,21,0.9)',
      },
      caution: {
        bg:        'rgba(239,68,68,0.07)',
        border:    'rgba(239,68,68,0.22)',
        text:      'rgba(252,165,165,0.85)',
        title:     'rgba(252,165,165,1)',
        iconColor: 'rgba(248,113,113,0.9)',
      },
    };
    return dark[type];
  }

  // Light — pastel, desaturated, harmonise with the #E8E7E3 background
  const light: Record<AlertProps['type'], AlertColors> = {
    note: {
      bg:        '#edf1f7',   // dusty slate-blue
      border:    '#b8c9df',
      text:      '#374f6a',
      title:     '#273d55',
      iconColor: '#4e789f',
    },
    tip: {
      bg:        '#edf4ed',   // dusty sage
      border:    '#a8cba8',
      text:      '#365936',
      title:     '#264826',
      iconColor: '#4e8a4e',
    },
    important: {
      bg:        '#f1edf7',   // dusty lavender
      border:    '#c0aedd',
      text:      '#493668',
      title:     '#382654',
      iconColor: '#7158a2',
    },
    warning: {
      bg:        '#f6f1e3',   // dusty warm amber
      border:    '#d4bb7a',
      text:      '#594718',
      title:     '#47380c',
      iconColor: '#907228',
    },
    caution: {
      bg:        '#f6ecec',   // dusty rose
      border:    '#d4a4a4',
      text:      '#6b3636',
      title:     '#542828',
      iconColor: '#a05252',
    },
  };
  return light[type];
}

// ─── Component ────────────────────────────────────────────────────────────────

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
        padding:      '0.875rem 1rem',
        borderRadius: '0.5rem',
        border:       `1px solid ${c.border}`,
        background:   c.bg,
        margin:       '1rem 0',
      }}
    >
      <Icon
        size={18}
        style={{ color: c.iconColor, flexShrink: 0, marginTop: '2px' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin:     '0 0 0.25rem 0',
          fontWeight: 700,
          fontSize:   '0.8rem',
          color:      c.title,
          lineHeight: 1.3,
        }}>
          {TITLES[type]}
        </p>
        <div style={{
          fontSize:   '0.85rem',
          color:      c.text,
          lineHeight: 1.6,
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Alert;