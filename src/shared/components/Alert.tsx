import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Info, Lightbulb, AlertCircle, AlertTriangle, OctagonX } from 'lucide-react';

interface AlertProps {
  type: 'note' | 'tip' | 'important' | 'warning' | 'caution';
  children: React.ReactNode;
}

interface AlertColors {
  bg: string;
  leftBar: string;  // accent left border strip
  border: string;   // subtle outer border
  text: string;
  title: string;
  iconColor: string;
}

function getColors(type: AlertProps['type'], isDark: boolean): AlertColors {
  if (isDark) {
    const dark: Record<AlertProps['type'], AlertColors> = {
      note: {
        bg:        'rgba(59,130,246,0.06)',
        leftBar:   'rgba(59,130,246,0.5)',
        border:    'rgba(59,130,246,0.15)',
        text:      'rgba(147,197,253,0.8)',
        title:     'rgba(147,197,253,0.95)',
        iconColor: 'rgba(96,165,250,0.85)',
      },
      tip: {
        bg:        'rgba(34,197,94,0.06)',
        leftBar:   'rgba(34,197,94,0.5)',
        border:    'rgba(34,197,94,0.15)',
        text:      'rgba(134,239,172,0.8)',
        title:     'rgba(134,239,172,0.95)',
        iconColor: 'rgba(74,222,128,0.85)',
      },
      important: {
        bg:        'rgba(168,85,247,0.06)',
        leftBar:   'rgba(168,85,247,0.5)',
        border:    'rgba(168,85,247,0.15)',
        text:      'rgba(216,180,254,0.8)',
        title:     'rgba(216,180,254,0.95)',
        iconColor: 'rgba(192,132,252,0.85)',
      },
      warning: {
        bg:        'rgba(234,179,8,0.06)',
        leftBar:   'rgba(234,179,8,0.5)',
        border:    'rgba(234,179,8,0.15)',
        text:      'rgba(253,224,71,0.8)',
        title:     'rgba(253,224,71,0.95)',
        iconColor: 'rgba(250,204,21,0.85)',
      },
      caution: {
        bg:        'rgba(239,68,68,0.06)',
        leftBar:   'rgba(239,68,68,0.5)',
        border:    'rgba(239,68,68,0.15)',
        text:      'rgba(252,165,165,0.8)',
        title:     'rgba(252,165,165,0.95)',
        iconColor: 'rgba(248,113,113,0.85)',
      },
    };
    return dark[type];
  }

  // Light theme — backgrounds sit just 2-4% off #E8E7E3,
  // identity comes from the left accent bar and icon color only.
  // All bg values are hand-mixed from #E8E7E3 + a tiny hue push.
  const light: Record<AlertProps['type'], AlertColors> = {
    note: {
      bg:        '#e3e8ef',   // #E8E7E3 + faint cool blue push
      leftBar:   '#6b9ac4',
      border:    'rgba(107,154,196,0.25)',
      text:      'rgba(0,0,0,0.6)',
      title:     'rgba(0,0,0,0.78)',
      iconColor: '#5580a0',
    },
    tip: {
      bg:        '#e3ebe3',   // #E8E7E3 + faint green push
      leftBar:   '#6b9e6b',
      border:    'rgba(107,158,107,0.25)',
      text:      'rgba(0,0,0,0.6)',
      title:     'rgba(0,0,0,0.78)',
      iconColor: '#527a52',
    },
    important: {
      bg:        '#eae3ef',   // #E8E7E3 + faint violet push
      leftBar:   '#9c7ec4',
      border:    'rgba(156,126,196,0.25)',
      text:      'rgba(0,0,0,0.6)',
      title:     'rgba(0,0,0,0.78)',
      iconColor: '#7a5aa0',
    },
    warning: {
      bg:        '#ede9dc',   // #E8E7E3 + faint warm amber push
      leftBar:   '#b89a3a',
      border:    'rgba(184,154,58,0.25)',
      text:      'rgba(0,0,0,0.6)',
      title:     'rgba(0,0,0,0.78)',
      iconColor: '#8f7830',
    },
    caution: {
      bg:        '#ede3e3',   // #E8E7E3 + faint rose push
      leftBar:   '#c47070',
      border:    'rgba(196,112,112,0.25)',
      text:      'rgba(0,0,0,0.6)',
      title:     'rgba(0,0,0,0.78)',
      iconColor: '#a05252',
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
        borderLeft:   `3px solid ${c.leftBar}`,
        background:   c.bg,
        margin:       '1rem 0',
      }}
    >
      <Icon
        size={17}
        style={{ color: c.iconColor, flexShrink: 0, marginTop: '2px' }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin:     '0 0 0.2rem 0',
          fontWeight: 700,
          fontSize:   '0.78rem',
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