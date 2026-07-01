import React, { useContext, useMemo, useState, useCallback } from 'react';
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

interface ChartBlockProps {
  type: ChartType;
  data: ChartRow[];
  title?: string;
  colors?: string[];
  isDark: boolean;
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

// ─── Area (дизайн в стиле evilcharts: горизонтальный цветной градиент по stroke,
//     вертикальный fade-градиент заливки через маску, пунктирный stroke) ───────

interface RenderAreaOptions {
  data: ChartRow[];
  nameKey: string;
  valueKeys: string[];
  palette: string[];
  stacked: boolean;
  hidden: Set<string>;
  hovered: string | null;
  t: ReturnType<typeof tk>;
}

function renderArea({
  data, nameKey, valueKeys, palette,
  stacked, hidden, hovered, t,
}: RenderAreaOptions) {
  const visible = valueKeys.filter(k => !hidden.has(k));

  return (
    <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
      <defs>
        {valueKeys.map((key) => {
          const idx   = valueKeys.indexOf(key);
          const color = palette[idx % palette.length];

          return (
            <React.Fragment key={`defs-${key}`}>
              {/* горизонтальный цветной градиент — красит и stroke, и fill */}
              <linearGradient id={`area-colors-${idx}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor={color} />
              </linearGradient>

              {/* вертикальный fade: сверху видимый, снизу прозрачный */}
              <linearGradient id={`area-vertical-fade-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity={0.35} />
                <stop offset="100%" stopColor="white" stopOpacity={0} />
              </linearGradient>
              <mask id={`area-fade-mask-${idx}`}>
                <rect width="100%" height="100%" fill={`url(#area-vertical-fade-${idx})`} />
              </mask>
              <pattern id={`area-fill-${idx}`} patternUnits="userSpaceOnUse" width="100%" height="100%">
                <rect
                  width="100%" height="100%"
                  fill={`url(#area-colors-${idx})`}
                  mask={`url(#area-fade-mask-${idx})`}
                />
              </pattern>

              {/* glow под линией при hover */}
              <filter id={`area-glow-${idx}`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </React.Fragment>
          );
        })}
      </defs>
      <XAxis dataKey={nameKey} {...ap(t)} />
      <YAxis {...ap(t)} width={38} />
      <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: t.gridLine, strokeWidth: 1 }} />
      {visible.map((key) => {
        const idx   = valueKeys.indexOf(key);
        const color = palette[idx % palette.length];
        const op    = seriesOpacity(key, hovered, hidden);
        const isActive = hovered === key;

        return (
          <Area key={key} type="monotone" dataKey={key}
            stroke={`url(#area-colors-${idx})`}
            fill={`url(#area-fill-${idx})`}
            fillOpacity={op}
            strokeWidth={isActive ? 1.6 : 0.8}
            strokeOpacity={op}
            strokeDasharray="3 3"
            style={{
              filter: isActive ? `url(#area-glow-${idx})` : 'none',
              transition: 'all 0.2s',
            }}
            stackId={stacked ? 'stack' : undefined}
            dot={false}
            activeDot={{
              r: 4,
              strokeWidth: 0,
              fill: color,
              filter: `drop-shadow(0 0 4px ${color})`,
            }}
            isAnimationActive={false}
          />
        );
      })}
    </AreaChart>
  );
}

// ─── Bar ──────────────────────────────────────────────────────────────────────

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
  stacked: boolean;
  horizontal: boolean;
  hidden: Set<string>;
  hovered: string | null;
  t: ReturnType<typeof tk>;
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

function renderBar({
  data, nameKey, valueKeys, palette,
  stacked, horizontal, hidden, hovered, t,
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
        const radius = getBarRadius(stacked, horizontal, isLastVisible);
        const multiSeriesOp = getMultiSeriesOpacity(hovered, key);

        return (
          <Bar key={key} dataKey={key}
            fill={seriesColor}
            radius={radius}
            stackId={stacked ? 'stack' : undefined}
            maxBarSize={maxSize}
            isAnimationActive={false}
            shape={(props: BarShapeProps) => {
              const glow = !stacked || isLastVisible;

              const rowName = String(props[nameKey] ?? visibleData[props.index]?.[nameKey] ?? '');

              const cellFill = useRowColors
                ? palette[(data.findIndex(d => String(d[nameKey]) === rowName) + data.length) % palette.length]
                : seriesColor;

              const cellOp = getCellOpacity(useRowColors, hovered, rowName, multiSeriesOp);

              return (
                <g opacity={cellOp} style={{ transition: 'opacity 0.18s' }}>
                  {glow && (
                    <rect
                      x={(props.x ?? 0) - 2}
                      y={(props.y ?? 0) - 2}
                      width={(props.width ?? 0) + 4}
                      height={(props.height ?? 0) + 4}
                      rx={radius[0]}
                      fill={cellFill}
                      style={{ filter: 'blur(7px)', opacity: 0.5 }}
                    />
                  )}
                  <rect
                    x={props.x} y={props.y}
                    width={props.width} height={props.height}
                    rx={radius[0]}
                    fill={cellFill}
                  />
                </g>
              );
            }}
          >
            {useRowColors && visibleData.map((row, rowIdx) => {
              const origIdx = data.indexOf(row);
              return (
                <Cell
                  key={`cell-${String(row[nameKey])}`}
                  fill={palette[(origIdx === -1 ? rowIdx : origIdx) % palette.length]}
                />
              );
            })}
          </Bar>
        );
      })}
    </BarChart>
  );
}

// ─── Pie ──────────────────────────────────────────────────────────────────────

interface PieChartInnerProps {
  data: ChartRow[];
  nameKey: string;
  valueKeys: string[];
  palette: string[];
  donut: boolean;
  hidden: Set<string>;
  hovered: string | null;
  t: ReturnType<typeof tk>;
}

function getPieSectorOpacity(hovered: string | null, rowName: string): number {
  if (hovered === null) return 1;
  return hovered === rowName ? 1 : 0.22;
}

const PieChartInner: React.FC<PieChartInnerProps> = ({
  data, nameKey, valueKeys, palette, donut, hidden, hovered, t,
}) => {
  const valueKey = valueKeys[0] ?? 'value';
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
    return (
      <g>
        <Sector
          cx={cx} cy={cy}
          innerRadius={donut ? innerRadius - 2 : 0}
          outerRadius={outerRadius + 6}
          startAngle={startAngle} endAngle={endAngle}
          fill={fill}
          style={{ filter: `drop-shadow(0 0 8px ${fill}cc)` }}
        />
      </g>
    );
  }, [donut]);

  return (
    <PieChart margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
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
          const origIdx = data.findIndex(d => String(d[nameKey]) === rowName);
          const op = getPieSectorOpacity(hovered, rowName);
          return (
            <Cell
              key={rowName}
              fill={palette[origIdx % palette.length]}
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

const ChartBlock: React.FC<ChartBlockProps> = ({ type, data, title, colors, isDark }) => {
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
    switch (type) {
      case 'area':
        return renderArea({ data, nameKey, valueKeys, palette, stacked: false, hidden, hovered, t });
      case 'area-stacked':
        return renderArea({ data, nameKey, valueKeys, palette, stacked: true,  hidden, hovered, t });
      case 'bar':
        return renderBar({ data, nameKey, valueKeys, palette, stacked: false, horizontal: false, hidden, hovered, t });
      case 'bar-stacked':
        return renderBar({ data, nameKey, valueKeys, palette, stacked: true,  horizontal: false, hidden, hovered, t });
      case 'bar-horizontal':
        return renderBar({ data, nameKey, valueKeys, palette, stacked: false, horizontal: true,  hidden, hovered, t });
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
  }, [type, data, nameKey, valueKeys, palette, hidden, hovered, t, isEmpty]);

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