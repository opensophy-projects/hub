import React, { useContext } from 'react';
import { TableContext } from '../lib/htmlParser';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ColumnsLayout = 'equal' | 'image-left' | 'image-right' | 'wide-left' | 'wide-right';

export interface ColumnsProps {
  layout?: ColumnsLayout;
  children?: React.ReactNode;
  isDark?: boolean;
}

export interface ColProps {
  children?: React.ReactNode;
}

// ─── Layout → grid template ───────────────────────────────────────────────────

const LAYOUT_TEMPLATES: Record<ColumnsLayout, string> = {
  'equal':       '1fr 1fr',
  'image-left':  '1fr 1.6fr',
  'image-right': '1.6fr 1fr',
  'wide-left':   '2fr 1fr',
  'wide-right':  '1fr 2fr',
};

// ─── Columns ──────────────────────────────────────────────────────────────────

const Columns: React.FC<ColumnsProps> = ({ layout = 'equal', children, isDark = false }) => {
  const template = LAYOUT_TEMPLATES[layout] ?? LAYOUT_TEMPLATES.equal;

  // For image-right we reverse the visual order of columns
  const shouldReverse = layout === 'image-right';

  // Fix 1: replaceAll instead of replace() with global regex (SonarCloud S7781)
  const uid = React.useId().replaceAll(':', '');

  const styleTag = `
    .columns-${uid} {
      display: grid;
      grid-template-columns: ${template};
      gap: 1.5rem;
      margin: 1.5rem 0;
      align-items: start;
    }
    @media (max-width: 768px) {
      .columns-${uid} {
        grid-template-columns: 1fr !important;
      }
    }
  `;

  const cols = React.Children.toArray(children);
  const orderedCols = shouldReverse ? [...cols].reverse() : cols;

  return (
    <>
      <style>{styleTag}</style>
      <div className={`columns-${uid}`}>
        {/* Fix 2: use child.key from React.Children.toArray() instead of array index (SonarCloud S6479)
            React.Children.toArray() guarantees stable, unique keys on each child element */}
        {orderedCols.map((child) => (
          <div key={(child as React.ReactElement).key} style={{ minWidth: 0 }}>
            {child}
          </div>
        ))}
      </div>
    </>
  );
};

// ─── Col (single column wrapper — used internally by parser) ─────────────────

export const Col: React.FC<ColProps> = ({ children }) => {
  return <>{children}</>;
};

// ─── Context-aware export ─────────────────────────────────────────────────────

export const ColumnsWithContext: React.FC<Omit<ColumnsProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <Columns {...props} isDark={isDark} />;
};

export { Columns };
export default ColumnsWithContext;