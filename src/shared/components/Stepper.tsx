import React, { useContext } from 'react';
import { TableContext } from '../lib/htmlParser';

// ─── Types ────────────────────────────────────────────────────────────────────

export type StepStatus = 'done' | 'active' | 'pending' | 'default';

export interface StepData {
  title: string;
  status: StepStatus;
  content: React.ReactNode;
}

export interface StepperProps {
  steps: StepData[];
  isDark?: boolean;
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

function getStepColors(status: StepStatus, isDark: boolean): StepColors {
  if (status === 'done') {
    return {
      dotBg:        '#22c55e',
      dotBorder:    '#22c55e',
      dotText:      '#fff',
      lineColor:    '#22c55e',
      titleColor:   isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
      contentColor: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.6)',
    };
  }

  if (status === 'active') {
    return {
      dotBg:        '#7234ff',
      dotBorder:    '#7234ff',
      dotText:      '#fff',
      lineColor:    isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
      titleColor:   isDark ? '#fff' : '#0a0a0a',
      contentColor: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
    };
  }

  if (status === 'pending') {
    return {
      dotBg:        'transparent',
      dotBorder:    isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
      dotText:      isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
      lineColor:    isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      titleColor:   isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
      contentColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
    };
  }

  // default — neutral
  return {
    dotBg:        'transparent',
    dotBorder:    isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
    dotText:      isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
    lineColor:    isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
    titleColor:   isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
    contentColor: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.6)',
  };
}

// ─── StepItem ─────────────────────────────────────────────────────────────────

interface StepItemProps {
  step: StepData;
  index: number;
  isLast: boolean;
  isDark: boolean;
}

const StepItem: React.FC<StepItemProps> = ({ step, index, isLast, isDark }) => {
  const colors = getStepColors(step.status, isDark);

  return (
    <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
      {/* Left: dot + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '32px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: colors.dotBg,
            border: `2px solid ${colors.dotBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: step.status === 'done' ? '14px' : '0.75rem',
            fontWeight: 700,
            color: colors.dotText,
            flexShrink: 0,
            zIndex: 1,
            transition: 'all 0.2s',
          }}
        >
          {step.status === 'done' ? '✓' : index + 1}
        </div>
        {!isLast && (
          <div
            style={{
              width: '2px',
              flex: 1,
              minHeight: '24px',
              background: colors.lineColor,
              margin: '4px 0',
              borderRadius: '2px',
              transition: 'background 0.2s',
            }}
          />
        )}
      </div>

      {/* Right: content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : '1.5rem', paddingTop: '4px' }}>
        <p
          style={{
            margin: '0 0 0.4rem 0',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: colors.titleColor,
            lineHeight: 1.3,
            transition: 'color 0.2s',
          }}
        >
          {step.title}
        </p>
        <div
          style={{
            fontSize: '0.85rem',
            color: colors.contentColor,
            lineHeight: 1.65,
            transition: 'color 0.2s',
          }}
        >
          {step.content}
        </div>
      </div>
    </div>
  );
};

// ─── Stepper ─────────────────────────────────────────────────────────────────

const Stepper: React.FC<StepperProps> = ({ steps, isDark = false }) => (
  <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
    {steps.map((step, index) => (
      // FIX S6479: use stable key combining title + index (title alone may not be unique)
      <StepItem
        key={`${step.title}-${index}`}
        step={step}
        index={index}
        isLast={index === steps.length - 1}
        isDark={isDark}
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