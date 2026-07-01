import React, { useContext, useMemo, useState, useCallback, useId } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar, Cell,
  PieChart, Pie, Sector,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TableContext } from '../lib/htmlParser';
import { makeTokens } from '@/shared/tokens/theme';

// ─── Типы ─────────────────────────────────────────────────────────────────────

export type ChartType =
  | 'area' | 'area-stacked'
  | 'bar'  | 'bar-stacked' | 'bar-horizontal'
  | 'pie'  | 'pie-donut'
  | 'radar';

export type ChartRow = Record<string, string | number>;

export type CurveType =
  | 'linear' | 'natural' | 'monotone' | 'monotoneX' | 'monotoneY'
  | 'step' | 'stepBefore' | 'stepAfter' | 'bump';

export type StackType = 'default' | 'stacked' | 'expanded';
export type StrokeVariant = 'solid' | 'dashed' | 'animated-dashed';
export type AreaFillVariantProp =
  | 'gradient' | 'gradient-reverse' | 'solid' | 'dotted' | 'lines' | 'hatched';
export type BarFillVariantProp =
  | 'default' | 'hatched' | 'duotone' | 'duotone-reverse' | 'gradient' | 'stripped';
export type RevealTypeProp =
  | 'none' | 'left-to-right' | 'right-to-left' | 'center-out' | 'edges-in';

interface ChartBlockProps {
  type: ChartType;
  data: ChartRow[];
  title?: string;
  colors?: string[];
  isDark: boolean;
  /** Кривая интерполяции для area/radar. По умолчанию 'monotone'. */
  curveType?: CurveType;
  /** Как складываются серии: обычные / stacked (100%-friendly) / expanded (в проценты). Переопределяет type='area-stacked'/'bar-stacked' если задан. */
  stackType?: StackType;
  /** Стиль обводки линии area-чарта. По умолчанию 'animated-dashed'. */
  strokeVariant?: StrokeVariant;
  /** Стиль заливки area-чарта. По умолчанию 'gradient'. */
  areaVariant?: AreaFillVariantProp;
  /** Стиль заливки bar-чарта. По умолчанию 'default'. */
  barVariant?: BarFillVariantProp;
  /** Направление wipe-анимации при первом рендере area-чарта. По умолчанию 'left-to-right'. */
  revealType?: RevealTypeProp;
  /** Soft glow на столбцах bar-чарта. По умолчанию false. */
  barGlowing?: boolean;
}


type BarShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
} & Record<string, string | number | undefined>;

type ActivePieShapeProps = {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
};

// ─── Палитра ──────────────────────────────────────────────────────────────────

const DEFAULT_COLORS = [
  '#8b5cf6', '#22d3ee', '#f59e0b', '#34d399',
  '#f472b6', '#60a5fa', '#fb923c', '#a3e635',
];

// ─── Токены ───────────────────────────────────────────────────────────────────

function tk(isDark: boolean) {
  const t = makeTokens(isDark);
  return {
    outerBg:     t.bg,
    outerBorder: t.border,
    outerShadow: isDark
      ? '0 2px 20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)'
      : '0 1px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.07)',
    tooltipBg:   isDark ? '#18181b' : '#ffffff',
    tooltipBdr:  isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
    tooltipText: isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.85)',
    axisText:    isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.32)',
    titleText:   isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.26)',
    footerText:  isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.3)',
    footerBdr:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    legendText:  isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    legendMuted: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)',
    gridLine:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  };
}

// ─── Ключи данных ─────────────────────────────────────────────────────────────

function detectKeys(data: ChartRow[]): { nameKey: string; valueKeys: string[] } {
  if (!data.length) return { nameKey: 'name', valueKeys: [] };
  const keys = Object.keys(data[0]);
  return { nameKey: keys[0] ?? 'name', valueKeys: keys.slice(1) };
}

// ─── Тултипы ─────────────────────────────────────────────────────────────────

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  t: ReturnType<typeof tk>;
}> = ({ active, payload, label, t }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: t.tooltipBg, border: `1px solid ${t.tooltipBdr}`,
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
      color: t.tooltipText, boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
      pointerEvents: 'none',
    }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4, opacity: 0.7 }}>{label}</div>}
      {payload.map(entry => (
        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <div style={{
            width: 8, height: 8, borderRadius: 2, background: entry.color, flexShrink: 0,
            boxShadow: `0 0 6px ${entry.color}99`,
          }} />
          <span style={{ opacity: 0.7 }}>{entry.name}:</span>
          <span style={{ fontWeight: 600 }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
  t: ReturnType<typeof tk>;
}> = ({ active, payload, t }) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div style={{
      background: t.tooltipBg, border: `1px solid ${t.tooltipBdr}`,
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
      color: t.tooltipText, boxShadow: '0 4px 20px rgba(0,0,0,0.28)',
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 8, height: 8, borderRadius: 2, background: entry.payload.fill, flexShrink: 0,
          boxShadow: `0 0 6px ${entry.payload.fill}99`,
        }} />
        <span style={{ fontWeight: 600 }}>{entry.name}:</span>
        <span>{entry.value}</span>
      </div>
    </div>
  );
};

// ─── Легенда ──────────────────────────────────────────────────────────────────

interface LegendItem { key: string; color: string; }

function legendItemColor(
  isHidden: boolean,
  isDimmed: boolean,
  t: ReturnType<typeof tk>,
): string {
  if (isHidden) return t.legendMuted;
  if (isDimmed)  return t.legendMuted;
  return t.legendText;
}

const CustomLegend: React.FC<{
  items: LegendItem[];
  hidden: Set<string>;
  hovered: string | null;
  onToggle: (key: string) => void;
  onHover: (key: string | null) => void;
  t: ReturnType<typeof tk>;
}> = ({ items, hidden, hovered, onToggle, onHover, t }) => {
  if (items.length <= 1) return null;
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
      gap: '4px 12px', padding: '2px 12px 10px',
    }}>
      {items.map(item => {
        const isHidden = hidden.has(item.key);
        const isDimmed = hovered !== null && hovered !== item.key && !isHidden;
        return (
          <button
            key={item.key}
            onClick={() => onToggle(item.key)}
            onMouseEnter={() => onHover(item.key)}
            onMouseLeave={() => onHover(null)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '3px 6px', borderRadius: 5, outline: 'none',
              color: legendItemColor(isHidden, isDimmed, t),
              fontSize: 11, fontWeight: isHidden ? 400 : 500,
              userSelect: 'none',
              transition: 'color 0.15s, opacity 0.15s',
              opacity: isDimmed ? 0.45 : 1,
            }}
          >
            <div style={{
              width: 10, height: 10, borderRadius: 3, flexShrink: 0,
              background: isHidden ? 'transparent' : item.color,
              border: `2px solid ${isHidden ? t.legendMuted : item.color}`,
              boxShadow: isHidden ? 'none' : `0 0 6px ${item.color}88`,
              transition: 'all 0.15s',
            }} />
            <span style={{ textDecoration: isHidden ? 'line-through' : 'none' }}>
              {item.key}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ─── Высота ───────────────────────────────────────────────────────────────────

function chartHeight(type: ChartType, rowCount: number): number {
  if (type === 'bar-horizontal') return Math.max(120, rowCount * 44 + 40);
  if (type === 'pie' || type === 'pie-donut') return 248;
  if (type === 'radar') return 278;
  if (type === 'bar' || type === 'bar-stacked') return 280;
  return 220;
}

// ─── Пропсы осей ─────────────────────────────────────────────────────────────

function ap(t: ReturnType<typeof tk>) {
  return { tick: { fill: t.axisText, fontSize: 11 }, axisLine: false, tickLine: false };
}

// ─── Вычисление opacity для серии при hover ───────────────────────────────────

function seriesOpacity(key: string, hovered: string | null, hidden: Set<string>): number {
  if (hidden.has(key)) return 0;
  if (hovered === null) return 1;
  return hovered === key ? 1 : 0.2;
}

// ─── Area (полный перенос дизайна evilcharts EvilAreaChart) ──────────────────
//
// Портировано 1-в-1 из area-chart.tsx: цветной horizontal linearGradient на
// stroke/fill, 6 вариантов паттерна заливки (gradient / gradient-reverse /
// solid / dotted / lines / hatched), motion.dev reveal-маска на маунт,
// анимированный пунктирный stroke, glow-фильтр и custom dot на активной точке.
// Состояние "выбрана серия" в оригинале — selectedDataKey/selectDataKey из
// контекста; здесь роль этого состояния играют hidden/hovered.

type AreaFillVariant = 'gradient' | 'gradient-reverse' | 'solid' | 'dotted' | 'lines' | 'hatched';
type RevealType = 'left-to-right' | 'right-to-left' | 'center-out' | 'edges-in' | 'none';

const AREA_STROKE_WIDTH = 0.8;
const AREA_REVEAL_DURATION = 1;
const AREA_REVEAL_EASE: [number, number, number, number] = [0, 0.7, 0.5, 1];

const AREA_SINGLE_REVEAL_ORIGIN: Record<Exclude<RevealType, 'edges-in' | 'none'>, number> = {
  'left-to-right': 0,
  'right-to-left': 1,
  'center-out': 0.5,
};

// Wipe-маска, проигрывается один раз при маунте <Area /> — чистый CSS
// (@keyframes area-reveal-* объявлены глобально в ChartBlock, ниже)
const AreaRevealMask: React.FC<{ id: string; type: RevealType }> = ({ id, type }) => {
  if (type === 'none') return null;
  const animBase: React.CSSProperties = {
    animationDuration: `${AREA_REVEAL_DURATION}s`,
    animationTimingFunction: `cubic-bezier(${AREA_REVEAL_EASE.join(',')})`,
    animationFillMode: 'forwards',
    transformBox: 'fill-box',
  };
  return (
    <mask id={`${id}-reveal-mask`} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse"
      x="0" y="0" width="100%" height="100%">
      {type === 'edges-in' ? (
        <>
          <rect x="0" y="0" width="50%" height="100%" fill="white"
            style={{ ...animBase, transformOrigin: '0% 50%', animationName: 'area-reveal-scalex' }} />
          <rect x="50%" y="0" width="50%" height="100%" fill="white"
            style={{ ...animBase, transformOrigin: '100% 50%', animationName: 'area-reveal-scalex' }} />
        </>
      ) : (
        <rect x="0" y="0" width="100%" height="100%" fill="white"
          style={{
            ...animBase,
            transformOrigin: `${AREA_SINGLE_REVEAL_ORIGIN[type as Exclude<RevealType, 'edges-in' | 'none'>] * 100}% 50%`,
            animationName: 'area-reveal-scalex',
          }} />
      )}
    </mask>
  );
};

// Анимированный пунктир (marching ants), рендерится ребёнком <Area />
const AreaAnimatedDashedStroke: React.FC = () => (
  <>
    <animate attributeName="stroke-dasharray" values="3 3; 0 3; 3 3" dur="1s" repeatCount="indefinite" keyTimes="0;0.5;1" />
    <animate attributeName="stroke-dashoffset" values="0; -6" dur="1s" repeatCount="indefinite" keyTimes="0;1" />
  </>
);

// Горизонтальный цветной градиент — красит и stroke, и fill-паттерны серии
const AreaColorGradient: React.FC<{ id: string; color: string }> = ({ id, color }) => (
  <linearGradient id={`${id}-colors`} x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stopColor={color} />
    <stop offset="100%" stopColor={color} />
  </linearGradient>
);

// gradient: fade сверху-вниз (видимый → прозрачный)
const AreaGradientPattern: React.FC<{ id: string }> = ({ id }) => (
  <>
    <linearGradient id={`${id}-vertical-fade`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="white" stopOpacity={0.1} />
      <stop offset="100%" stopColor="white" stopOpacity={0} />
    </linearGradient>
    <mask id={`${id}-gradient-mask`}><rect width="100%" height="100%" fill={`url(#${id}-vertical-fade)`} /></mask>
    <pattern id={`${id}-gradient`} patternUnits="userSpaceOnUse" width="100%" height="100%">
      <rect width="100%" height="100%" fill={`url(#${id}-colors)`} mask={`url(#${id}-gradient-mask)`} />
    </pattern>
  </>
);

// gradient-reverse: fade снизу-вверх (прозрачный → видимый)
const AreaReverseGradientPattern: React.FC<{ id: string }> = ({ id }) => (
  <>
    <linearGradient id={`${id}-vertical-fade-reverse`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="white" stopOpacity={0} />
      <stop offset="100%" stopColor="white" stopOpacity={0.1} />
    </linearGradient>
    <mask id={`${id}-gradient-reverse-mask`}><rect width="100%" height="100%" fill={`url(#${id}-vertical-fade-reverse)`} /></mask>
    <pattern id={`${id}-gradient-reverse`} patternUnits="userSpaceOnUse" width="100%" height="100%">
      <rect width="100%" height="100%" fill={`url(#${id}-colors)`} mask={`url(#${id}-gradient-reverse-mask)`} />
    </pattern>
  </>
);

// solid: равномерная низкая непрозрачность без fade
const AreaSolidPattern: React.FC<{ id: string }> = ({ id }) => (
  <>
    <linearGradient id={`${id}-solid-fade`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="white" stopOpacity={0.1} />
      <stop offset="100%" stopColor="white" stopOpacity={0.1} />
    </linearGradient>
    <mask id={`${id}-solid-mask`}><rect width="100%" height="100%" fill={`url(#${id}-solid-fade)`} /></mask>
    <pattern id={`${id}-solid`} patternUnits="userSpaceOnUse" width="100%" height="100%">
      <rect width="100%" height="100%" fill={`url(#${id}-colors)`} mask={`url(#${id}-solid-mask)`} />
    </pattern>
  </>
);

// lines: диагональная штриховка
const AreaLinesPattern: React.FC<{ id: string }> = ({ id }) => (
  <>
    <pattern id={`${id}-lines-texture`} patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="5" stroke="white" strokeWidth="1" />
    </pattern>
    <mask id={`${id}-lines-mask`}><rect width="100%" height="100%" fill={`url(#${id}-lines-texture)`} fillOpacity="0.3" /></mask>
    <pattern id={`${id}-lines`} patternUnits="userSpaceOnUse" width="100%" height="100%">
      <rect width="100%" height="100%" fill={`url(#${id}-colors)`} mask={`url(#${id}-lines-mask)`} />
    </pattern>
  </>
);

// dotted: точечная текстура
const AreaDottedPattern: React.FC<{ id: string }> = ({ id }) => (
  <>
    <pattern id={`${id}-dotted-texture`} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="0.5" fill="white" />
    </pattern>
    <mask id={`${id}-dotted-mask`}><rect width="100%" height="100%" fill={`url(#${id}-dotted-texture)`} fillOpacity="0.5" /></mask>
    <pattern id={`${id}-dotted`} patternUnits="userSpaceOnUse" width="100%" height="100%">
      <rect width="100%" height="100%" fill={`url(#${id}-colors)`} mask={`url(#${id}-dotted-mask)`} />
    </pattern>
  </>
);

// hatched: полосы с мягким градиентом внутри каждой полосы
const AreaHatchedPattern: React.FC<{ id: string }> = ({ id }) => (
  <>
    <linearGradient id={`${id}-hatched-stripe`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="50%" stopColor="white" stopOpacity={0.2} />
      <stop offset="50%" stopColor="white" stopOpacity={1} />
    </linearGradient>
    <pattern id={`${id}-hatched-texture`} x="0" y="0" width="20" height="10"
      patternUnits="userSpaceOnUse" overflow="visible" patternTransform="rotate(20)">
      <rect width="20" height="10" fill={`url(#${id}-hatched-stripe)`} />
    </pattern>
    <mask id={`${id}-hatched-mask`}><rect width="100%" height="100%" fill={`url(#${id}-hatched-texture)`} fillOpacity="0.2" /></mask>
    <pattern id={`${id}-hatched`} patternUnits="userSpaceOnUse" width="100%" height="100%">
      <rect width="100%" height="100%" fill={`url(#${id}-colors)`} mask={`url(#${id}-hatched-mask)`} />
    </pattern>
  </>
);

// Диагональная штриховка для "невыбранной" серии, когда есть hover/selection
const AreaUnselectedPattern: React.FC<{ id: string }> = ({ id }) => (
  <>
    <pattern id={`${id}-unselected-texture`} patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="5" stroke="white" strokeWidth="1" />
    </pattern>
    <mask id={`${id}-unselected-mask`}><rect width="100%" height="100%" fill={`url(#${id}-unselected-texture)`} fillOpacity="0.3" /></mask>
    <pattern id={`${id}-unselected`} patternUnits="userSpaceOnUse" width="100%" height="100%">
      <rect width="100%" height="100%" fill={`url(#${id}-colors)`} mask={`url(#${id}-unselected-mask)`} />
    </pattern>
  </>
);

function getFillPatternUrl(id: string, variant: AreaFillVariant, showUnselected: boolean): string {
  if (showUnselected) return `url(#${id}-unselected)`;
  return `url(#${id}-${variant})`;
}

// Opacity fill/stroke: как getOpacity в оригинале — дим только когда есть hover
// на ДРУГОЙ серии (роль selectedDataKey играет hovered)
function getAreaOpacity(hovered: string | null, key: string): { fill: number; stroke: number } {
  if (hovered === null) return { fill: 0.8, stroke: 0.8 };
  return hovered === key ? { fill: 0.8, stroke: 0.8 } : { fill: 0.2, stroke: 0.3 };
}

interface RenderAreaOptions {
  data: ChartRow[];
  nameKey: string;
  valueKeys: string[];
  palette: string[];
  stacked: boolean;
  isExpanded?: boolean;
  hidden: Set<string>;
  hovered: string | null;
  t: ReturnType<typeof tk>;
  variant?: AreaFillVariant;
  strokeVariant?: StrokeVariant;
  revealType?: RevealType;
  curveType?: CurveType;
}

// evilcharts не знает 'bump' у recharts — ближайший визуальный аналог 'natural'
function toRechartsCurve(curveType: CurveType): 'linear' | 'natural' | 'monotone' | 'monotoneX' | 'monotoneY' | 'step' | 'stepBefore' | 'stepAfter' {
  if (curveType === 'bump') return 'natural';
  return curveType;
}

// Одна серия площади — полный аналог <Area /> из evilcharts: сама генерит
// свои defs под уникальным id, поэтому любое число серий с разными вариантами
// заливки живёт в одном чарте без коллизий стилей.
const AreaSeries: React.FC<{
  dataKey: string;
  color: string;
  stacked: boolean;
  variant: AreaFillVariant;
  strokeVariant: StrokeVariant;
  revealType: RevealType;
  curveType: CurveType;
  hovered: string | null;
  hidden: Set<string>;
}> = ({ dataKey, color, stacked, variant, strokeVariant, revealType, curveType, hovered, hidden }) => {
  const rawId = useId().replace(/:/g, '');
  const id = `area-${rawId}`;
  const maskId = revealType === 'none' ? undefined : `${id}-reveal-mask`;

  const isHidden = hidden.has(dataKey);
  if (isHidden) return null;

  const hasHover = hovered !== null;
  const isHoveredSeries = hovered === dataKey;
  const showUnselected = hasHover && !isHoveredSeries;
  const opacity = getAreaOpacity(hovered, dataKey);

  const isDashed = strokeVariant === 'dashed' || strokeVariant === 'animated-dashed';
  const isAnimatedDashed = strokeVariant === 'animated-dashed';

  return (
    <>
      <Area
        type={toRechartsCurve(curveType)}
        dataKey={dataKey}
        connectNulls={false}
        fillOpacity={opacity.fill}
        strokeOpacity={opacity.stroke}
        fill={getFillPatternUrl(id, variant, showUnselected)}
        stroke={`url(#${id}-colors)`}
        stackId={stacked ? 'area-stack' : undefined}
        dot={false}
        activeDot={{
          r: 4,
          strokeWidth: 0,
          fill: color,
          filter: `drop-shadow(0 0 4px ${color})`,
        }}
        strokeWidth={AREA_STROKE_WIDTH}
        strokeDasharray={isDashed ? '3 3' : undefined}
        isAnimationActive={false}
        style={{
          ...(maskId ? { mask: `url(#${maskId})` } : {}),
          filter: isHoveredSeries ? `drop-shadow(0 0 5px ${color}cc)` : 'none',
          transition: 'filter 0.2s',
        }}
      >
        {isAnimatedDashed && !hasHover && <AreaAnimatedDashedStroke />}
      </Area>
      <defs>
        <AreaRevealMask id={id} type={revealType} />
        <AreaColorGradient id={id} color={color} />
        {variant === 'gradient' && <AreaGradientPattern id={id} />}
        {variant === 'gradient-reverse' && <AreaReverseGradientPattern id={id} />}
        {variant === 'solid' && <AreaSolidPattern id={id} />}
        {variant === 'dotted' && <AreaDottedPattern id={id} />}
        {variant === 'lines' && <AreaLinesPattern id={id} />}
        {variant === 'hatched' && <AreaHatchedPattern id={id} />}
        {showUnselected && <AreaUnselectedPattern id={id} />}
      </defs>
    </>
  );
};

function renderArea({
  data, nameKey, valueKeys, palette,
  stacked, isExpanded = false, hidden, hovered, t,
  variant = 'gradient',
  strokeVariant = 'animated-dashed',
  revealType = 'left-to-right',
  curveType = 'monotone',
}: RenderAreaOptions) {
  return (
    <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      stackOffset={isExpanded ? 'expand' : undefined}>
      <XAxis dataKey={nameKey} {...ap(t)} />
      <YAxis {...ap(t)} width={38}
        tickFormatter={isExpanded ? (v: number) => `${Math.round(v * 100)}%` : undefined} />
      <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: t.gridLine, strokeWidth: 1 }} />
      {valueKeys.map((key) => {
        const idx = valueKeys.indexOf(key);
        const color = palette[idx % palette.length];
        return (
          <AreaSeries
            key={key}
            dataKey={key}
            color={color}
            stacked={stacked || isExpanded}
            variant={variant}
            strokeVariant={strokeVariant}
            revealType={revealType}
            curveType={curveType}
            hovered={hovered}
            hidden={hidden}
          />
        );
      })}
    </AreaChart>
  );
}

// ─── Bar (полный перенос дизайна evilcharts EvilBarChart) ────────────────────
//
// Портировано из bar-chart.tsx: 6 вариантов заливки (default / hatched /
// duotone / duotone-reverse / gradient / stripped), soft glow-filter,
// stackType default/stacked/percent (percent → stackOffset="expand").
// Роль selectedDataKey/isClickable в оригинале здесь играют hovered/hidden —
// как и в area-переносе, у ChartBlock нет отдельного click-select контекста.

type BarFillVariant = 'default' | 'hatched' | 'duotone' | 'duotone-reverse' | 'gradient' | 'stripped';
export type BarStackType = 'default' | 'stacked' | 'percent';

function getMaxBarSize(seriesCount: number): number {
  if (seriesCount <= 1) return 96;
  if (seriesCount <= 3) return 72;
  return 52;
}

function getCategoryGap(rowCount: number): string {
  if (rowCount <= 3)  return '18%';
  if (rowCount <= 6)  return '22%';
  if (rowCount <= 10) return '26%';
  return '30%';
}

interface RenderBarOptions {
  data: ChartRow[];
  nameKey: string;
  valueKeys: string[];
  palette: string[];
  stackType: BarStackType;
  horizontal: boolean;
  hidden: Set<string>;
  hovered: string | null;
  t: ReturnType<typeof tk>;
  variant?: BarFillVariant;
  glowing?: boolean;
}

function getBarRadius(
  stacked: boolean,
  horizontal: boolean,
  isLastVisible: boolean
): [number, number, number, number] {
  if (!stacked) return horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0];
  if (isLastVisible) return horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0];
  return [0, 0, 0, 0];
}

function getMultiSeriesOpacity(hovered: string | null, key: string): number {
  if (hovered === null) return 1;
  return hovered === key ? 1 : 0.22;
}

function getCellOpacity(
  useRowColors: boolean,
  hovered: string | null,
  rowName: string,
  multiSeriesOp: number,
): number {
  if (!useRowColors) return multiSeriesOp;
  if (hovered === null) return 1;
  return hovered === rowName ? 1 : 0.22;
}

// Вертикальный цветной градиент серии — как ColorGradient из оригинала
const BarColorGradient: React.FC<{ id: string; color: string }> = ({ id, color }) => (
  <linearGradient id={`${id}-colors`} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor={color} />
    <stop offset="100%" stopColor={color} />
  </linearGradient>
);

// hatched: диагональная штриховка
const BarHatchedPattern: React.FC<{ id: string }> = ({ id }) => (
  <>
    <pattern id={`${id}-hatched-mask-pattern`} x="0" y="0" width="5" height="5"
      patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <rect width="5" height="5" fill="white" fillOpacity={0.3} />
      <rect width="1.5" height="5" fill="white" fillOpacity={1} />
    </pattern>
    <mask id={`${id}-hatched-mask`}><rect width="100%" height="100%" fill={`url(#${id}-hatched-mask-pattern)`} /></mask>
    <pattern id={`${id}-hatched`} patternUnits="userSpaceOnUse" width="100%" height="100%">
      <rect width="100%" height="100%" fill={`url(#${id}-colors)`} mask={`url(#${id}-hatched-mask)`} />
    </pattern>
  </>
);

// duotone: половина столбца тусклая, половина насыщенная (по горизонтали)
const BarDuotonePattern: React.FC<{ id: string; reverse?: boolean }> = ({ id, reverse }) => {
  const key = reverse ? 'duotone-reverse' : 'duotone';
  const [a, b] = reverse ? [1, 0.4] : [0.4, 1];
  return (
    <>
      <linearGradient id={`${id}-${key}-mask-gradient`} gradientUnits="objectBoundingBox" x1="0" y1="0" x2="1" y2="0">
        <stop offset="50%" stopColor="white" stopOpacity={a} />
        <stop offset="50%" stopColor="white" stopOpacity={b} />
      </linearGradient>
      <mask id={`${id}-${key}-mask`} maskContentUnits="objectBoundingBox">
        <rect x="0" y="0" width="1" height="1" fill={`url(#${id}-${key}-mask-gradient)`} />
      </mask>
      <pattern id={`${id}-${key}`} patternUnits="objectBoundingBox" patternContentUnits="objectBoundingBox" width="1" height="1">
        <rect x="0" y="0" width="1" height="1" fill={`url(#${id}-colors)`} mask={`url(#${id}-${key}-mask)`} />
      </pattern>
    </>
  );
};

// gradient: fade сверху вниз
const BarGradientPattern: React.FC<{ id: string }> = ({ id }) => (
  <>
    <linearGradient id={`${id}-gradient-mask-gradient`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="20%" stopColor="white" stopOpacity={1} />
      <stop offset="90%" stopColor="white" stopOpacity={0} />
    </linearGradient>
    <mask id={`${id}-gradient-mask`}><rect width="100%" height="100%" fill={`url(#${id}-gradient-mask-gradient)`} /></mask>
    <pattern id={`${id}-gradient`} patternUnits="userSpaceOnUse" width="100%" height="100%">
      <rect width="100%" height="100%" fill={`url(#${id}-colors)`} mask={`url(#${id}-gradient-mask)`} />
    </pattern>
  </>
);

// stripped: тусклое тело + сплошная полоса сверху (полоса рисуется отдельным rect в BarSeries)
const BarStrippedPattern: React.FC<{ id: string }> = ({ id }) => (
  <>
    <linearGradient id={`${id}-stripped-mask-gradient`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="white" stopOpacity={0.2} />
      <stop offset="100%" stopColor="white" stopOpacity={0.2} />
    </linearGradient>
    <mask id={`${id}-stripped-mask`}><rect width="100%" height="100%" fill={`url(#${id}-stripped-mask-gradient)`} /></mask>
    <pattern id={`${id}-stripped`} patternUnits="userSpaceOnUse" width="100%" height="100%">
      <rect width="100%" height="100%" fill={`url(#${id}-colors)`} mask={`url(#${id}-stripped-mask)`} />
    </pattern>
  </>
);

// soft outer glow, применяется через SVG filter на последнем сегменте стека
const BarGlowFilter: React.FC<{ id: string }> = ({ id }) => (
  <filter id={`${id}-glow`} x="-100%" y="-100%" width="300%" height="300%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
    <feColorMatrix in="blur" type="matrix"
      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0" result="glow" />
    <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
  </filter>
);

function getBarVariantFillUrl(id: string, variant: BarFillVariant): string {
  if (variant === 'default') return `url(#${id}-colors)`;
  return `url(#${id}-${variant})`;
}

// Одна серия столбцов — аналог <Bar /> из оригинала: сама генерит свои defs
// под уникальным id, поэтому разные варианты заливки не сталкиваются стилями.
const BarSeries: React.FC<{
  dataKey: string;
  color: string;
  stackType: BarStackType;
  horizontal: boolean;
  isLastVisible: boolean;
  variant: BarFillVariant;
  glowing: boolean;
  useRowColors: boolean;
  data: ChartRow[];
  visibleData: ChartRow[];
  nameKey: string;
  palette: string[];
  hovered: string | null;
  maxSize: number;
}> = ({
  dataKey, color, stackType, horizontal, isLastVisible, variant, glowing,
  useRowColors, data, visibleData, nameKey, palette, hovered, maxSize,
}) => {
  const rawId = useId().replace(/:/g, '');
  const id = `bar-${rawId}`;
  const isStacked = stackType !== 'default';
  const radius = getBarRadius(isStacked, horizontal, isLastVisible);
  const isStripped = variant === 'stripped';
  const glow = glowing && (!isStacked || isLastVisible);

  return (
    <Bar
      dataKey={dataKey}
      fill={getBarVariantFillUrl(id, variant)}
      radius={radius}
      stackId={isStacked ? 'evil-stack' : undefined}
      maxBarSize={maxSize}
      isAnimationActive={false}
      shape={(props: BarShapeProps) => {
        const rowName = String(props[nameKey] ?? visibleData[props.index ?? -1]?.[nameKey] ?? '');
        const multiSeriesOp = getMultiSeriesOpacity(hovered, dataKey);
        const cellOp = getCellOpacity(useRowColors, hovered, rowName, multiSeriesOp);
        const cellFill = useRowColors
          ? palette[(data.findIndex(d => String(d[nameKey]) === rowName) + data.length) % palette.length]
          : `url(#${id}-${variant === 'default' ? 'colors' : variant})`;
        const h = Math.max(0, (props.height ?? 0) - 3);

        return (
          <g opacity={cellOp} style={{ transition: 'opacity 0.18s' }}>
            <rect x={props.x} y={props.y} width={props.width} height={props.height} fill="transparent" />
            <rect
              x={props.x} y={props.y}
              width={props.width} height={h}
              rx={radius[0]}
              fill={cellFill}
              filter={glow ? `url(#${id}-glow)` : undefined}
            />
            {isStripped && (
              <rect
                x={props.x} y={(props.y ?? 0) - 4}
                width={props.width} height={2}
                rx={1}
                fill={useRowColors ? cellFill : `url(#${id}-colors)`}
              />
            )}
          </g>
        );
      }}
    >
      {useRowColors && (
        <>
          <defs>
            <BarColorGradient id={id} color={color} />
          </defs>
          {visibleData.map((row, rowIdx) => {
            const origIdx = data.indexOf(row);
            const rowName = String(row[nameKey]);
            return (
              <Cell
                key={`cell-${rowName}`}
                fill={palette[(origIdx === -1 ? rowIdx : origIdx) % palette.length]}
              />
            );
          })}
        </>
      )}
      {!useRowColors && (
        <defs>
          <BarColorGradient id={id} color={color} />
          {variant === 'hatched' && <BarHatchedPattern id={id} />}
          {variant === 'duotone' && <BarDuotonePattern id={id} />}
          {variant === 'duotone-reverse' && <BarDuotonePattern id={id} reverse />}
          {variant === 'gradient' && <BarGradientPattern id={id} />}
          {variant === 'stripped' && <BarStrippedPattern id={id} />}
          {glowing && <BarGlowFilter id={id} />}
        </defs>
      )}
    </Bar>
  );
};

function renderBar({
  data, nameKey, valueKeys, palette,
  stackType, horizontal, hidden, hovered, t,
  variant = 'default',
  glowing = false,
}: RenderBarOptions) {
  const isSingleSeries = valueKeys.length === 1;

  const visibleData = (isSingleSeries && horizontal)
    ? data.filter(d => !hidden.has(String(d[nameKey])))
    : data;
  const visible = (!isSingleSeries || !horizontal)
    ? valueKeys.filter(k => !hidden.has(k))
    : valueKeys;

  const useRowColors = isSingleSeries;
  const a = ap(t);
  const maxSize = getMaxBarSize(visible.length);
  const bGap = visible.length <= 2 ? 4 : 2;

  return (
    <BarChart
      data={visibleData}
      layout={horizontal ? 'vertical' : 'horizontal'}
      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      barCategoryGap={getCategoryGap(data.length)}
      barGap={bGap}
      stackOffset={stackType === 'percent' ? 'expand' : undefined}
    >
      {horizontal
        ? <><YAxis dataKey={nameKey} type="category" {...a} width={90} /><XAxis type="number" {...a} /></>
        : <><XAxis dataKey={nameKey} {...a} /><YAxis {...a} width={38} /></>
      }
      <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: t.gridLine }} />
      {visible.map((key) => {
        const idx = valueKeys.indexOf(key);
        const seriesColor = palette[idx % palette.length];
        const isLastVisible = visible.indexOf(key) === visible.length - 1;
        return (
          <BarSeries
            key={key}
            dataKey={key}
            color={seriesColor}
            stackType={stackType}
            horizontal={horizontal}
            isLastVisible={isLastVisible}
            variant={variant}
            glowing={glowing}
            useRowColors={useRowColors}
            data={data}
            visibleData={visibleData}
            nameKey={nameKey}
            palette={palette}
            hovered={hovered}
            maxSize={maxSize}
          />
        );
      })}
    </BarChart>
  );
}

// ─── Pie (полный перенос дизайна evilcharts EvilPieChart) ────────────────────
//
// Радиальный (диагональный) цветной градиент на каждый сектор вместо плоской
// заливки, + опциональный glow на выбранном/наведённом секторе.

interface PieChartInnerProps {
  data: ChartRow[];
  nameKey: string;
  valueKeys: string[];
  palette: string[];
  donut: boolean;
  hidden: Set<string>;
  hovered: string | null;
  t: ReturnType<typeof tk>;
  glowOnHover?: boolean;
}

function getPieSectorOpacity(hovered: string | null, rowName: string): number {
  if (hovered === null) return 1;
  return hovered === rowName ? 1 : 0.22;
}

// Радиальный (диагональный x1y1→x2y2) градиент — как RadialColorGradient
const PieSectorGradient: React.FC<{ id: string; rowName: string; color: string }> = ({ id, rowName, color }) => (
  <linearGradient id={`${id}-colors-${rowName}`} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stopColor={color} />
    <stop offset="100%" stopColor={color} />
  </linearGradient>
);

const PieGlowFilter: React.FC<{ id: string; rowName: string }> = ({ id, rowName }) => (
  <filter id={`${id}-glow-${rowName}`} x="-100%" y="-100%" width="300%" height="300%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
    <feColorMatrix in="blur" type="matrix"
      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0" result="glow" />
    <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
  </filter>
);

const PieChartInner: React.FC<PieChartInnerProps> = ({
  data, nameKey, valueKeys, palette, donut, hidden, hovered, t, glowOnHover = true,
}) => {
  const valueKey = valueKeys[0] ?? 'value';
  const rawId = useId().replace(/:/g, '');
  const id = `pie-${rawId}`;
  const visibleData = data.filter(d => !hidden.has(String(d[nameKey])));
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  const resolvedActiveIndex = useMemo(() => {
    if (hovered !== null) {
      const idx = visibleData.findIndex(d => String(d[nameKey]) === hovered);
      return idx >= 0 ? idx : activeIndex;
    }
    return activeIndex;
  }, [hovered, visibleData, nameKey, activeIndex]);

  const renderActive = useCallback((props: ActivePieShapeProps) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    const rowName = hovered ?? '';
    return (
      <g>
        <Sector
          cx={cx} cy={cy}
          innerRadius={donut ? innerRadius - 2 : 0}
          outerRadius={outerRadius + 6}
          startAngle={startAngle} endAngle={endAngle}
          fill={fill}
          filter={glowOnHover ? `url(#${id}-glow-${rowName})` : undefined}
          style={glowOnHover ? undefined : { filter: `drop-shadow(0 0 8px ${fill}cc)` }}
        />
      </g>
    );
  }, [donut, glowOnHover, hovered, id]);

  return (
    <PieChart margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
      <defs>
        {data.map((entry, i) => {
          const rowName = String(entry[nameKey]);
          return (
            <React.Fragment key={rowName}>
              <PieSectorGradient id={id} rowName={rowName} color={palette[i % palette.length]} />
              {glowOnHover && <PieGlowFilter id={id} rowName={rowName} />}
            </React.Fragment>
          );
        })}
      </defs>
      <Pie
        data={visibleData} dataKey={valueKey} nameKey={nameKey}
        cx="50%" cy="50%"
        innerRadius={donut ? '50%' : '0%'} outerRadius="76%"
        paddingAngle={2.5} strokeWidth={0}
        style={{ outline: 'none' }}
        isAnimationActive={false}
        activeIndex={resolvedActiveIndex}
        activeShape={renderActive}
        onMouseEnter={(_, index) => setActiveIndex(index)}
        onMouseLeave={() => setActiveIndex(undefined)}
      >
        {visibleData.map((entry) => {
          const rowName = String(entry[nameKey]);
          const op = getPieSectorOpacity(hovered, rowName);
          return (
            <Cell
              key={rowName}
              fill={`url(#${id}-colors-${rowName})`}
              opacity={op}
              style={{ outline: 'none', cursor: 'default', transition: 'opacity 0.18s' }}
            />
          );
        })}
      </Pie>
      <Tooltip content={<PieTooltip t={t} />} />
    </PieChart>
  );
};

// ─── Radar ────────────────────────────────────────────────────────────────────

function renderRadar(
  data: ChartRow[],
  nameKey: string, valueKeys: string[], palette: string[],
  hidden: Set<string>, hovered: string | null,
  t: ReturnType<typeof tk>
) {
  const visible = valueKeys.filter(k => !hidden.has(k));
  return (
    <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%"
      margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
      <PolarGrid stroke={t.gridLine} />
      <PolarAngleAxis dataKey={nameKey} tick={{ fill: t.axisText, fontSize: 11 }} />
      <Tooltip content={<CustomTooltip t={t} />} />
      {visible.map((key) => {
        const idx = valueKeys.indexOf(key);
        const color = palette[idx % palette.length];
        const op = seriesOpacity(key, hovered, hidden);
        return (
          <Radar key={key} dataKey={key}
            stroke={color} fill={color}
            fillOpacity={op * 0.14}
            strokeOpacity={op}
            strokeWidth={hovered === key ? 2.5 : 1.8}
            style={{ filter: hovered === key ? `drop-shadow(0 0 5px ${color}cc)` : 'none', transition: 'all 0.2s' }}
            isAnimationActive={false}
          />
        );
      })}
    </RadarChart>
  );
}

// ─── Вспомогательные ─────────────────────────────────────────────────────────

function pluralRecords(n: number): string {
  if (n === 1) return 'запись';
  if (n < 5)   return 'записи';
  return 'записей';
}

// ─── ChartBlock ───────────────────────────────────────────────────────────────

const ChartBlock: React.FC<ChartBlockProps> = ({
  type, data, title, colors, isDark,
  curveType = 'monotone',
  stackType,
  strokeVariant = 'animated-dashed',
  areaVariant = 'gradient',
  barVariant = 'default',
  revealType = 'left-to-right',
  barGlowing = false,
}) => {
  const t       = tk(isDark);
  const palette = colors?.length ? colors : DEFAULT_COLORS;
  const { nameKey, valueKeys } = useMemo(() => detectKeys(data), [data]);

  const [hidden,  setHidden]  = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);

  const toggleHidden = useCallback((key: string) => {
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const isEmpty = !data.length || !valueKeys.length;

  const legendItems: LegendItem[] = useMemo(() => {
    const isPie = type === 'pie' || type === 'pie-donut';
    const isSingleBar = (type === 'bar' || type === 'bar-horizontal') && valueKeys.length === 1;
    if (isPie || isSingleBar) {
      return data.map((d, i) => ({
        key:   String(d[nameKey]),
        color: palette[i % palette.length],
      }));
    }
    return valueKeys.map((k, i) => ({
      key: k, color: palette[i % palette.length],
    }));
  }, [type, data, nameKey, valueKeys, palette]);

  const height = chartHeight(type, data.length);

  const chart = useMemo(() => {
    if (isEmpty) return null;
    // stackType (если передан явно) переопределяет 'area-stacked'/'bar-stacked' из type
    const areaStacked = stackType ? stackType !== 'default' : type === 'area-stacked';
    const areaExpanded = stackType === 'expanded';
    const barStackType: BarStackType = stackType === 'expanded' ? 'percent'
      : stackType === 'stacked' ? 'stacked'
      : stackType === 'default' ? 'default'
      : (type === 'bar-stacked' ? 'stacked' : 'default');

    switch (type) {
      case 'area':
      case 'area-stacked':
        return renderArea({
          data, nameKey, valueKeys, palette, hidden, hovered, t,
          stacked: areaStacked, isExpanded: areaExpanded,
          variant: areaVariant, strokeVariant, revealType, curveType,
        });
      case 'bar':
        return renderBar({
          data, nameKey, valueKeys, palette, hidden, hovered, t,
          stackType: barStackType, horizontal: false,
          variant: barVariant, glowing: barGlowing,
        });
      case 'bar-stacked':
        return renderBar({
          data, nameKey, valueKeys, palette, hidden, hovered, t,
          stackType: barStackType === 'default' ? 'stacked' : barStackType, horizontal: false,
          variant: barVariant, glowing: barGlowing,
        });
      case 'bar-horizontal':
        return renderBar({
          data, nameKey, valueKeys, palette, hidden, hovered, t,
          stackType: barStackType, horizontal: true,
          variant: barVariant, glowing: barGlowing,
        });
      case 'pie':
      case 'pie-donut':
        return (
          <PieChartInner
            data={data}
            nameKey={nameKey}
            valueKeys={valueKeys}
            palette={palette}
            donut={type === 'pie-donut'}
            hidden={hidden}
            hovered={hovered}
            t={t}
          />
        );
      case 'radar':
        return renderRadar(data, nameKey, valueKeys, palette, hidden, hovered, t);
      default:
        return null;
    }
  }, [
    type, data, nameKey, valueKeys, palette, hidden, hovered, t, isEmpty,
    curveType, stackType, strokeVariant, areaVariant, barVariant, revealType, barGlowing,
  ]);

  return (
    <div className="not-prose" style={{ margin: '1.25rem 0' }}>
      <style>{`
        .recharts-wrapper:focus,
        .recharts-wrapper *:focus,
        .recharts-surface:focus,
        .recharts-pie-sector:focus,
        .recharts-sector:focus,
        .recharts-rectangle:focus,
        .recharts-curve:focus,
        .recharts-layer:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        @keyframes area-reveal-scalex {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="area-reveal-scalex"] {
            animation: none !important;
            transform: scaleX(1) !important;
          }
        }
      `}</style>
      <div style={{
        borderRadius: 12,
        border: `1px solid ${t.outerBorder}`,
        background: t.outerBg,
        boxShadow: t.outerShadow,
        overflow: 'hidden',
        outline: 'none',
      }}>
        {title && (
          <div style={{
            padding: '10px 16px 0',
            fontSize: '0.68rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            color: t.titleText,
          }}>
            {title}
          </div>
        )}

        <div style={{ padding: title ? '10px 4px 0' : '14px 4px 0', outline: 'none' }}>
          {isEmpty ? (
            <div style={{
              height: 140, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13,
              color: t.axisText, fontStyle: 'italic',
            }}>
              Нет данных
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={height}>
              {chart ?? <div />}
            </ResponsiveContainer>
          )}
        </div>

        {!isEmpty && (
          <CustomLegend
            items={legendItems}
            hidden={hidden}
            hovered={hovered}
            onToggle={toggleHidden}
            onHover={setHovered}
            t={t}
          />
        )}

        <div style={{
          padding: '5px 16px 7px', fontSize: 11, color: t.footerText,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: `1px solid ${t.footerBdr}`, userSelect: 'none',
        }}>
          <span>{data.length}{' '}{pluralRecords(data.length)}</span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, opacity: 0.6 }}>
            {type}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Экспорт ──────────────────────────────────────────────────────────────────

export const ChartBlockWithContext: React.FC<Omit<ChartBlockProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <ChartBlock {...props} isDark={isDark} />;
};

export default ChartBlockWithContext;