import React, { useContext } from 'react';
import { TableContext } from '../lib/htmlParser';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StepStatus = 'done' | 'active' | 'pending' | 'default';

export interface StepData {
  title: string;
  status: StepStatus;
  content: React.ReactNode;
  /** Custom accent color for this step's dot and line (e.g. '#f59e0b', 'rgb(99,102,241)') */
  color?: string;
}

export interface StepperProps {
  steps: StepData[];
  isDark?: boolean;
  /** Global accent color override for all steps (individual step.color takes priority) */
  accentColor?: string;
}

// ─── Step colors ──────────────────────────────────────────────────────────────

interface StepColors {
  dotBg: string;
  dotBorder: string;
  dotText: string;
  lineColor: string;
  titleColor: string;
  contentColor: string;
}

type ThemePair = { dark: string; light: string };

const STEP_COLORS: Record<StepStatus, {
  dotBg:        string | ThemePair;
  dotBorder:    string | ThemePair;
  dotText:      string | ThemePair;
  lineColor:    string | ThemePair;
  titleColor:   ThemePair;
  contentColor: ThemePair;
}> = {
  done: {
    dotBg:        '#22c55e',
    dotBorder:    '#22c55e',
    dotText:      '#fff',
    lineColor:    '#22c55e',
    titleColor:   { dark: 'rgba(255,255,255,0.9)',  light: 'rgba(0,0,0,0.9)'  },
    contentColor: { dark: 'rgba(255,255,255,0.55)', light: 'rgba(0,0,0,0.6)'  },
  },
  active: {
    dotBg:        '#7234ff',
    dotBorder:    '#7234ff',
    dotText:      '#fff',
    lineColor:    { dark: 'rgba(255,255,255,0.12)', light: 'rgba(0,0,0,0.12)' },
    titleColor:   { dark: '#fff',                  light: '#0a0a0a'           },
    contentColor: { dark: 'rgba(255,255,255,0.7)',  light: 'rgba(0,0,0,0.7)'  },
  },
  pending: {
    dotBg:        'transparent',
    dotBorder:    { dark: 'rgba(255,255,255,0.2)',  light: 'rgba(0,0,0,0.2)'  },
    dotText:      { dark: 'rgba(255,255,255,0.3)',  light: 'rgba(0,0,0,0.3)'  },
    lineColor:    { dark: 'rgba(255,255,255,0.08)', light: 'rgba(0,0,0,0.08)' },
    titleColor:   { dark: 'rgba(255,255,255,0.4)',  light: 'rgba(0,0,0,0.4)'  },
    contentColor: { dark: 'rgba(255,255,255,0.3)',  light: 'rgba(0,0,0,0.3)'  },
  },
  default: {
    dotBg:        'transparent',
    dotBorder:    { dark: 'rgba(255,255,255,0.3)',  light: 'rgba(0,0,0,0.25)' },
    dotText:      { dark: 'rgba(255,255,255,0.7)',  light: 'rgba(0,0,0,0.6)'  },
    lineColor:    { dark: 'rgba(255,255,255,0.12)', light: 'rgba(0,0,0,0.1)'  },
    titleColor:   { dark: 'rgba(255,255,255,0.85)', light: 'rgba(0,0,0,0.85)' },
    contentColor: { dark: 'rgba(255,255,255,0.55)', light: 'rgba(0,0,0,0.6)'  },
  },
};

function pick(v: string | ThemePair, isDark: boolean): string {
  if (typeof v === 'string') return v;
  return isDark ? v.dark : v.light;
}

/**
 * Resolves step colors.
 * Custom color (step.color or global accentColor) overrides dot/border/line
 * for non-pending statuses.
 */
function getStepColors(
  status: StepStatus,
  isDark: boolean,
  customColor?: string
): StepColors {
  const c = STEP_COLORS[status];
  const base: StepColors = {
    dotBg:        pick(c.dotBg,        isDark),
    dotBorder:    pick(c.dotBorder,    isDark),
    dotText:      pick(c.dotText,      isDark),
    lineColor:    pick(c.lineColor,    isDark),
    titleColor:   pick(c.titleColor,   isDark),
    contentColor: pick(c.contentColor, isDark),
  };

  if (customColor && status !== 'pending') {
    base.dotBg     = status === 'default' ? 'transparent' : customColor;
    base.dotBorder = customColor;
    base.dotText   = status === 'default' ? pick(c.dotText, isDark) : '#fff';
    if (status === 'done') {
      base.lineColor = customColor;
    }
  }

  return base;
}

// ─── StepItem ─────────────────────────────────────────────────────────────────

interface StepItemProps {
  step: StepData;
  index: number;
  isLast: boolean;
  isDark: boolean;
  accentColor?: string;
}

const StepItem: React.FC<StepItemProps> = ({ step, index, isLast, isDark, accentColor }) => {
  // Step-level color overrides global accentColor
  const resolvedColor = step.color ?? accentColor;
  const colors = getStepColors(step.status, isDark, resolvedColor);

  return (
    <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
      {/* Left: dot + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '32px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: colors.dotBg, border: `2px solid ${colors.dotBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: step.status === 'done' ? '14px' : '0.75rem',
          fontWeight: 700, color: colors.dotText,
          flexShrink: 0, zIndex: 1, transition: 'all 0.2s',
        }}>
          {step.status === 'done' ? '✓' : index + 1}
        </div>
        {!isLast && (
          <div style={{
            width: '2px', flex: 1, minHeight: '24px',
            background: colors.lineColor, margin: '4px 0',
            borderRadius: '2px', transition: 'background 0.2s',
          }} />
        )}
      </div>

      {/* Right: title + content */}
      <div style={{
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        paddingBottom: isLast ? 0 : '1.5rem',
        paddingTop: '4px',
      }}>
        <p style={{
          margin: '0 0 0.4rem 0', fontSize: '0.95rem', fontWeight: 700,
          color: colors.titleColor, lineHeight: 1.3, transition: 'color 0.2s',
        }}>
          {step.title}
        </p>
        <div style={{
          fontSize: '0.85rem', color: colors.contentColor,
          lineHeight: 1.65, transition: 'color 0.2s',
          maxWidth: '100%',
        }}>
          {step.content}
        </div>
      </div>
    </div>
  );
};

// ─── Stepper ─────────────────────────────────────────────────────────────────

const Stepper: React.FC<StepperProps> = ({ steps, isDark = false, accentColor }) => (
  <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
    {steps.map((step, index) => (
      <StepItem
        key={`${step.title}-${index}`}
        step={step}
        index={index}
        isLast={index === steps.length - 1}
        isDark={isDark}
        accentColor={accentColor}
      />
    ))}
  </div>
);

// ─── Context-aware export ─────────────────────────────────────────────────────

export const StepperWithContext: React.FC<Omit<StepperProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <Stepper {...props} isDark={isDark} />;
};

export { Stepper };
export default StepperWithContext;