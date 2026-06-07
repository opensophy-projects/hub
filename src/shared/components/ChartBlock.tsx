import React, {
  useContext, useMemo, useState, useCallback, useRef, useEffect,
} from 'react';
import {
  AreaChart, Area,
  BarChart, Bar, Cell,
  PieChart as RechartsPieChart, Pie, Sector,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TableContext } from '../lib/htmlParser';
import { makeTokens } from '@/shared/tokens/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Палитра ──────────────────────────────────────────────────────────────────

const DEFAULT_COLORS = [
  '#7c3aed', '#10b981', '#f59e0b', '#3b82f6',
  '#f43f5e', '#8b5cf6', '#06b6d4', '#fb923c',
];

// ─── Токены ───────────────────────────────────────────────────────────────────

function tk(isDark: boolean) {
  const t = makeTokens(isDark);
  return {
    outerBg:      t.bg,
    outerBorder:  isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
    outerShadow:  isDark
      ? '0 4px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.04) inset'
      : '0 2px 16px rgba(0,0,0,0.08)',
    tooltipBg:    isDark ? '#141418' : '#ffffff',
    tooltipBdr:   isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    tooltipText:  isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.87)',
    tooltipShadow: isDark
      ? '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07)'
      : '0 8px 24px rgba(0,0,0,0.14)',
    axisText:     isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.32)',
    titleText:    isDark ? 'rgba(255,255,255,0.9)'  : 'rgba(0,0,0,0.85)',
    subtitleText: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.42)',
    footerText:   isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.28)',
    footerBdr:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    legendText:   isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    legendMuted:  isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.2)',
    gridLine:     isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    cursorFill:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    dotBg:        isDark ? '#141418' : '#ffffff',
    pieCenterBg:  isDark ? '#0e0e12' : '#f5f5f7',
  };
}

// ─── Определение ключей ───────────────────────────────────────────────────────

function detectKeys(data: ChartRow[]): { nameKey: string; valueKeys: string[] } {
  if (!data.length) return { nameKey: 'name', valueKeys: [] };
  const keys = Object.keys(data[0]);
  return { nameKey: keys[0] ?? 'name', valueKeys: keys.slice(1) };
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  t: ReturnType<typeof tk>;
}> = ({ active, payload, label, t }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: t.tooltipBg,
      border: `1px solid ${t.tooltipBdr}`,
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 12,
      color: t.tooltipText,
      boxShadow: t.tooltipShadow,
      pointerEvents: 'none',
      minWidth: 130,
    }}>
      {label && (
        <div style={{
          fontWeight: 600, fontSize: 11, marginBottom: 8,
          opacity: 0.45, letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {label}
        </div>
      )}
      {payload.map(entry => (
        <div key={entry.name} style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 16, marginTop: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: entry.color, flexShrink: 0,
              boxShadow: `0 0 0 2.5px ${entry.color}30`,
            }} />
            <span style={{ opacity: 0.55, fontSize: 11 }}>{entry.name}</span>
          </div>
          <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {entry.value.toLocaleString()}
          </span>
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
      borderRadius: 10, padding: '9px 13px', fontSize: 12,
      color: t.tooltipText, boxShadow: t.tooltipShadow, pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: entry.payload.fill, flexShrink: 0,
        }} />
        <span style={{ fontWeight: 600 }}>{entry.name}</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {entry.value.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// ─── Легенда ──────────────────────────────────────────────────────────────────

interface LegendItem { key: string; color: string; }

const CustomLegend: React.FC<{
  items: LegendItem[];
  hidden: Set<string>;
  onToggle: (key: string) => void;
  t: ReturnType<typeof tk>;
}> = ({ items, hidden, onToggle, t }) => {
  if (items.length <= 1) return null;
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
      gap: '4px 10px', padding: '0 16px 14px',
    }}>
      {items.map(item => {
        const isHidden = hidden.has(item.key);
        return (
          <button
            key={item.key}
            onClick={() => onToggle(item.key)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '3px 0', outline: 'none',
              color: isHidden ? t.legendMuted : t.legendText,
              fontSize: 12, fontWeight: 500, userSelect: 'none',
              transition: 'color 0.15s',
            }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: isHidden ? 'transparent' : item.color,
              border: `2px solid ${isHidden ? t.legendMuted : item.color}`,
              transition: 'all 0.15s',
            }} />
            <span style={{ opacity: isHidden ? 0.4 : 1 }}>{item.key}</span>
          </button>
        );
      })}
    </div>
  );
};

// ─── Размеры ──────────────────────────────────────────────────────────────────

function chartHeight(type: ChartType, rowCount: number): number {
  if (type === 'bar-horizontal') return Math.max(120, rowCount * 44 + 44);
  if (type === 'pie' || type === 'pie-donut') return 260;
  if (type === 'radar') return 280;
  return 220;
}

// ─── Оси ─────────────────────────────────────────────────────────────────────

function ap(t: ReturnType<typeof tk>) {
  return {
    tick: { fill: t.axisText, fontSize: 11, fontWeight: 500 },
    axisLine: false, tickLine: false,
  };
}

// ─── AREA ─────────────────────────────────────────────────────────────────────

function renderArea(
  data: ChartRow[], nameKey: string, valueKeys: string[],
  palette: string[], stacked: boolean, hidden: Set<string>, t: ReturnType<typeof tk>
) {
  const visible = valueKeys.filter(k => !hidden.has(k));
  return (
    <AreaChart data={data} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
      <defs>
        {visible.map((key) => {
          const idx = valueKeys.indexOf(key);
          const color = palette[idx % palette.length];
          return (
            <linearGradient key={key} id={`ag-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity={0.35} />
              <stop offset="75%"  stopColor={color} stopOpacity={0.08} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          );
        })}
      </defs>
      <XAxis dataKey={nameKey} {...ap(t)} tickMargin={10} />
      <YAxis {...ap(t)} width={38} tickMargin={4} />
      <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: t.gridLine, strokeWidth: 1 }} />
      {visible.map((key) => {
        const idx = valueKeys.indexOf(key);
        const color = palette[idx % palette.length];
        return (
          <Area key={key} type="monotone" dataKey={key}
            stroke={color} strokeWidth={2.5}
            fill={`url(#ag-${idx})`}
            stackId={stacked ? 'stack' : undefined}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2.5, stroke: t.dotBg, fill: color }}
            isAnimationActive={false}
          />
        );
      })}
    </AreaChart>
  );
}

// ─── BAR ─────────────────────────────────────────────────────────────────────

function getMaxBarSize(n: number): number {
  if (n <= 1) return 60;
  if (n <= 3) return 48;
  return 36;
}

function getCategoryGap(n: number): string {
  if (n <= 3)  return '16%';
  if (n <= 6)  return '20%';
  if (n <= 10) return '26%';
  return '30%';
}

function getBarRadius(
  stacked: boolean, horizontal: boolean, isLast: boolean
): [number, number, number, number] {
  if (!stacked) return horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0];
  if (isLast)   return horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0];
  return [0, 0, 0, 0];
}

// Кастомный бар с gradient-заливкой
const GradientBar = (palette: string[], nameKey: string, horizontal: boolean) => {
  // eslint-disable-next-line react/display-name
  return (props: Record<string, unknown>) => {
    const { x, y, width, height, fill, index } = props as {
      x: number; y: number; width: number; height: number;
      fill: string; index: number;
    };
    const gradId = `bar-grad-${index}`;
    const color = fill;
    return (
      <g>
        <defs>
          <linearGradient id={gradId} x1={horizontal ? '0' : '0'} y1={horizontal ? '0' : '1'} x2={horizontal ? '1' : '0'} y2={horizontal ? '0' : '0'}>
            <stop offset="0%"   stopColor={color} stopOpacity={horizontal ? 0.35 : 0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={horizontal ? 0.9  : 0.9} />
          </linearGradient>
        </defs>
        <rect
          x={x} y={y} width={width} height={height}
          fill={`url(#${gradId})`}
          rx={horizontal ? 0 : 5} ry={horizontal ? 0 : 5}
        />
      </g>
    );
  };
};

interface RenderBarOptions {
  data: ChartRow[]; nameKey: string; valueKeys: string[];
  palette: string[]; stacked: boolean; horizontal: boolean;
  hidden: Set<string>; t: ReturnType<typeof tk>;
}

function renderBar({
  data, nameKey, valueKeys, palette, stacked, horizontal, hidden, t,
}: RenderBarOptions) {
  const isSingle = valueKeys.length === 1;
  const visibleData = (isSingle && horizontal)
    ? data.filter(d => !hidden.has(String(d[nameKey])))
    : data;
  const visible = (!isSingle || !horizontal)
    ? valueKeys.filter(k => !hidden.has(k))
    : valueKeys;

  const a = ap(t);
  const maxSize = getMaxBarSize(visible.length);
  const bGap = visible.length <= 2 ? 4 : 3;

  return (
    <BarChart
      data={visibleData}
      layout={horizontal ? 'vertical' : 'horizontal'}
      margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
      barCategoryGap={getCategoryGap(data.length)}
      barGap={bGap}
    >
      <defs>
        {palette.map((color, idx) => (
          <linearGradient key={idx} id={`bg-${idx}`}
            x1={horizontal ? '0' : '0'} y1={horizontal ? '0' : '1'}
            x2={horizontal ? '1' : '0'} y2={horizontal ? '0' : '0'}>
            <stop offset="0%"   stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.9} />
          </linearGradient>
        ))}
      </defs>
      {horizontal
        ? <>
            <YAxis dataKey={nameKey} type="category" {...a} width={96} tickMargin={8} />
            <XAxis type="number" {...a} tickMargin={8} />
          </>
        : <>
            <XAxis dataKey={nameKey} {...a} tickMargin={10} />
            <YAxis {...a} width={38} tickMargin={4} />
          </>
      }
      <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: t.cursorFill }} />
      {visible.map((key) => {
        const idx = valueKeys.indexOf(key);
        const color = palette[idx % palette.length];
        const isLast = visible.indexOf(key) === visible.length - 1;
        const radius = getBarRadius(stacked, horizontal, isLast);
        return (
          <Bar key={key} dataKey={key}
            fill={`url(#bg-${idx % palette.length})`}
            radius={radius}
            stackId={stacked ? 'stack' : undefined}
            maxBarSize={maxSize}
            isAnimationActive={false}
          >
            {isSingle && visibleData.map((_, rowIdx) => {
              const orig = data.indexOf(visibleData[rowIdx]);
              const ci = (orig === -1 ? rowIdx : orig) % palette.length;
              return (
                <Cell key={`c-${rowIdx}`} fill={`url(#bg-${ci})`} />
              );
            })}
          </Bar>
        );
      })}
    </BarChart>
  );
}

// ─── PIE ─────────────────────────────────────────────────────────────────────

// Active shape — выдвинутый сектор как в примере
const renderActiveShape = (props: Record<string, unknown>) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill,
  } = props as {
    cx: number; cy: number; innerRadius: number; outerRadius: number;
    startAngle: number; endAngle: number; fill: string;
  };
  return (
    <g>
      <Sector
        cx={cx as number} cy={cy as number}
        innerRadius={innerRadius as number}
        outerRadius={(outerRadius as number) + 8}
        startAngle={startAngle as number}
        endAngle={endAngle as number}
        fill={fill as string}
        style={{ filter: `drop-shadow(0 0 8px ${fill}80)` }}
      />
    </g>
  );
};

function PieChartComponent({
  data, nameKey, valueKeys, palette, donut, hidden, t,
}: {
  data: ChartRow[]; nameKey: string; valueKeys: string[];
  palette: string[]; donut: boolean; hidden: Set<string>; t: ReturnType<typeof tk>;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const valueKey = valueKeys[0] ?? 'value';
  const visibleData = data.filter(d => !hidden.has(String(d[nameKey])));

  const totalValue = useMemo(
    () => visibleData.reduce((sum, d) => sum + (Number(d[valueKey]) || 0), 0),
    [visibleData, valueKey]
  );

  return (
    <RechartsPieChart margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
      <Pie
        data={visibleData}
        dataKey={valueKey}
        nameKey={nameKey}
        cx="50%" cy="50%"
        innerRadius={donut ? '52%' : '0%'}
        outerRadius="80%"
        paddingAngle={donut ? 3 : 1.5}
        strokeWidth={0}
        activeIndex={activeIndex ?? undefined}
        activeShape={renderActiveShape as unknown as React.ReactElement}
        onMouseEnter={(_, idx) => setActiveIndex(idx)}
        onMouseLeave={() => setActiveIndex(null)}
        style={{ outline: 'none', cursor: 'pointer' }}
        isAnimationActive={false}
      >
        {visibleData.map((entry) => {
          const rowName = String(entry[nameKey]);
          const origIdx = data.findIndex(d => String(d[nameKey]) === rowName);
          return (
            <Cell
              key={rowName}
              fill={palette[origIdx % palette.length]}
              style={{ outline: 'none' }}
            />
          );
        })}
      </Pie>
      <Tooltip content={<PieTooltip t={t} />} />

      {/* Центр для donut */}
      {donut && (
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
          <tspan
            x="50%" dy="-0.15em"
            style={{
              fontSize: 26, fontWeight: 700, fill: t.tooltipText,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {totalValue.toLocaleString()}
          </tspan>
          <tspan
            x="50%" dy="1.5em"
            style={{ fontSize: 11, fill: t.axisText, fontWeight: 500 }}
          >
            Total
          </tspan>
        </text>
      )}
    </RechartsPieChart>
  );
}

// ─── RADAR ────────────────────────────────────────────────────────────────────

function renderRadar(
  data: ChartRow[], nameKey: string, valueKeys: string[],
  palette: string[], hidden: Set<string>, t: ReturnType<typeof tk>
) {
  const visible = valueKeys.filter(k => !hidden.has(k));
  return (
    <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%"
      margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
      <PolarGrid stroke={t.gridLine} strokeWidth={1} />
      <PolarAngleAxis dataKey={nameKey}
        tick={{ fill: t.axisText, fontSize: 11, fontWeight: 500 }} />
      <Tooltip content={<CustomTooltip t={t} />} />
      {visible.map((key) => {
        const idx = valueKeys.indexOf(key);
        const color = palette[idx % palette.length];
        return (
          <Radar key={key} dataKey={key}
            stroke={color} fill={color} fillOpacity={0.12} strokeWidth={2}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        );
      })}
    </RadarChart>
  );
}

// ─── Склонение ────────────────────────────────────────────────────────────────

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

  const [hidden, setHidden] = useState<Set<string>>(new Set());

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
    return valueKeys.map((k, i) => ({ key: k, color: palette[i % palette.length] }));
  }, [type, data, nameKey, valueKeys, palette]);

  const height = chartHeight(type, data.length);

  const chart = useMemo(() => {
    if (isEmpty) return null;
    switch (type) {
      case 'area':
        return renderArea(data, nameKey, valueKeys, palette, false, hidden, t);
      case 'area-stacked':
        return renderArea(data, nameKey, valueKeys, palette, true, hidden, t);
      case 'bar':
        return renderBar({ data, nameKey, valueKeys, palette, stacked: false, horizontal: false, hidden, t });
      case 'bar-stacked':
        return renderBar({ data, nameKey, valueKeys, palette, stacked: true, horizontal: false, hidden, t });
      case 'bar-horizontal':
        return renderBar({ data, nameKey, valueKeys, palette, stacked: false, horizontal: true, hidden, t });
      case 'pie':
        return <PieChartComponent data={data} nameKey={nameKey} valueKeys={valueKeys} palette={palette} donut={false} hidden={hidden} t={t} />;
      case 'pie-donut':
        return <PieChartComponent data={data} nameKey={nameKey} valueKeys={valueKeys} palette={palette} donut={true} hidden={hidden} t={t} />;
      case 'radar':
        return renderRadar(data, nameKey, valueKeys, palette, hidden, t);
      default:
        return null;
    }
  }, [type, data, nameKey, valueKeys, palette, hidden, t, isEmpty]);

  return (
    <div className="not-prose" style={{ margin: '1.5rem 0' }}>
      <style>{`
        .recharts-wrapper:focus,
        .recharts-wrapper *:focus,
        .recharts-surface:focus,
        .recharts-pie-sector:focus,
        .recharts-sector:focus,
        .recharts-rectangle:focus,
        .recharts-curve:focus,
        .recharts-layer:focus { outline: none !important; box-shadow: none !important; }
      `}</style>

      <div style={{
        borderRadius: 14,
        border: `1px solid ${t.outerBorder}`,
        background: t.outerBg,
        boxShadow: t.outerShadow,
        overflow: 'hidden',
      }}>
        {/* Шапка */}
        {title && (
          <div style={{ padding: '14px 18px 0' }}>
            <div style={{
              fontSize: 14, fontWeight: 600, color: t.titleText, lineHeight: 1.3,
            }}>
              {title}
            </div>
          </div>
        )}

        {/* Тело */}
        <div style={{ padding: title ? '10px 4px 0' : '14px 4px 0' }}>
          {isEmpty ? (
            <div style={{
              height: 140, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13,
              color: t.axisText, fontStyle: 'italic', opacity: 0.6,
            }}>
              Нет данных
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={height}>
              {chart ?? <div />}
            </ResponsiveContainer>
          )}
        </div>

        {/* Легенда */}
        {!isEmpty && (
          <div style={{ padding: '10px 12px 0' }}>
            <CustomLegend items={legendItems} hidden={hidden} onToggle={toggleHidden} t={t} />
          </div>
        )}

        {/* Футер */}
        <div style={{
          padding: '6px 18px 9px', fontSize: 11, color: t.footerText,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: `1px solid ${t.footerBdr}`, marginTop: 4, userSelect: 'none',
        }}>
          <span>{data.length} {pluralRecords(data.length)}</span>
          <span style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 10,
            opacity: 0.4, letterSpacing: '0.04em',
          }}>
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