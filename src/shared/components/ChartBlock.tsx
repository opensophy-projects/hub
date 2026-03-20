import React, { useContext, useMemo, useState, useCallback } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar, Cell,
  PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TableContext } from '../lib/htmlParser';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChartType =
  | 'area' | 'area-stacked'
  | 'bar'  | 'bar-stacked' | 'bar-horizontal'
  | 'pie'  | 'pie-donut'
  | 'radar';

interface ChartBlockProps {
  type: ChartType;
  data: Record<string, unknown>[];
  title?: string;
  colors?: string[];
  isDark: boolean;
}

// ─── Default palette ──────────────────────────────────────────────────────────

const DEFAULT_COLORS = [
  '#7234ff', '#22c55e', '#f59e0b', '#3b82f6',
  '#ef4444', '#ec4899', '#14b8a6', '#f97316',
];

// ─── Tokens ───────────────────────────────────────────────────────────────────

function tk(isDark: boolean) {
  return {
    outerBg:     isDark ? '#0a0a0a'                : '#E8E7E3',
    outerBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    outerShadow: isDark
      ? '0 2px 12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)'
      : '0 1px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.07)',
    tooltipBg:   isDark ? '#1a1a1a'                : '#ffffff',
    tooltipBdr:  isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    tooltipText: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)',
    axisText:    isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
    titleText:   isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.28)',
    footerText:  isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.32)',
    footerBdr:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    legendText:  isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
    legendMuted: isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.2)',
    gridLine:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  };
}

// ─── Key detection ────────────────────────────────────────────────────────────

function detectKeys(data: Record<string, unknown>[]): { nameKey: string; valueKeys: string[] } {
  if (!data.length) return { nameKey: 'name', valueKeys: [] };
  const keys = Object.keys(data[0]);
  return { nameKey: keys[0] ?? 'name', valueKeys: keys.slice(1) };
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────

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
      color: t.tooltipText, boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      pointerEvents: 'none',
    }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4, opacity: 0.7 }}>{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: entry.color, flexShrink: 0 }} />
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
      color: t.tooltipText, boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: entry.payload.fill, flexShrink: 0 }} />
        <span style={{ fontWeight: 600 }}>{entry.name}:</span>
        <span>{entry.value}</span>
      </div>
    </div>
  );
};

// ─── Custom Legend ────────────────────────────────────────────────────────────

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
      gap: '4px 12px', padding: '2px 12px 10px',
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
              padding: '3px 6px', borderRadius: 5, outline: 'none',
              color: isHidden ? t.legendMuted : t.legendText,
              fontSize: 11, fontWeight: isHidden ? 400 : 500,
              userSelect: 'none', transition: 'color 0.12s',
            }}
          >
            <div style={{
              width: 10, height: 10, borderRadius: 3, flexShrink: 0,
              background: isHidden ? 'transparent' : item.color,
              border: `2px solid ${isHidden ? t.legendMuted : item.color}`,
              transition: 'all 0.12s',
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

// ─── Chart height ─────────────────────────────────────────────────────────────

function chartHeight(type: ChartType, rowCount: number): number {
  if (type === 'bar-horizontal') return Math.max(100, rowCount * 40 + 36);
  if (type === 'pie' || type === 'pie-donut') return 240;
  if (type === 'radar') return 270;
  return 210;
}

// ─── Axis props ───────────────────────────────────────────────────────────────

function ap(t: ReturnType<typeof tk>) {
  return { tick: { fill: t.axisText, fontSize: 11 }, axisLine: false, tickLine: false };
}

// ─── AREA ─────────────────────────────────────────────────────────────────────

function renderArea(
  data: Record<string, unknown>[],
  nameKey: string, valueKeys: string[], palette: string[],
  stacked: boolean, hidden: Set<string>, t: ReturnType<typeof tk>
) {
  const visible = valueKeys.filter(k => !hidden.has(k));
  return (
    <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
      <XAxis dataKey={nameKey} {...ap(t)} />
      <YAxis {...ap(t)} width={38} />
      <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: t.gridLine, strokeWidth: 1 }} />
      {visible.map((key) => {
        const idx = valueKeys.indexOf(key);
        const color = palette[idx % palette.length];
        return (
          <Area key={key} type="monotone" dataKey={key}
            stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2}
            stackId={stacked ? 'stack' : undefined}
            dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        );
      })}
    </AreaChart>
  );
}

// ─── BAR ──────────────────────────────────────────────────────────────────────
//
// FIX: when there is only one value series (single column of data), each bar
// gets its own color from the palette (like a pie chart does).
// When there are multiple series, each series keeps its own single color.
//
// Bar sizing strategy:
//   barCategoryGap — space between groups as % of category width.
//     Fewer rows → more gap → bars look thin, so we reduce the gap.
//   barGap — gap between bars within a group (multi-series).
//   maxBarSize — hard upper cap so bars don't become too wide on few rows.

function getCategoryGap(rowCount: number): string {
  if (rowCount <= 3)  return '15%';
  if (rowCount <= 6)  return '20%';
  if (rowCount <= 10) return '25%';
  return '30%';
}

function renderBar(
  data: Record<string, unknown>[],
  nameKey: string, valueKeys: string[], palette: string[],
  stacked: boolean, horizontal: boolean,
  hidden: Set<string>, t: ReturnType<typeof tk>
) {
  const visible = valueKeys.filter(k => !hidden.has(k));
  // Color each bar individually only when there is a single value series
  const useRowColors = visible.length === 1;
  const a = ap(t);

  // maxBarSize scales down when there are many series so groups stay compact
  const maxSize = visible.length <= 1 ? 72 : visible.length <= 3 ? 56 : 40;
  // barGap: tighter for many series
  const bGap = visible.length <= 2 ? 3 : 2;

  return (
    <BarChart
      data={data}
      layout={horizontal ? 'vertical' : 'horizontal'}
      margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
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
        // For stacked: only the last visible series gets rounded top corners
        const isLast = idx === visible.length - 1;
        const radius: [number, number, number, number] = stacked
          ? (isLast ? (horizontal ? [0,3,3,0] : [3,3,0,0]) : [0,0,0,0])
          : (horizontal ? [0,3,3,0] : [3,3,0,0]);
        return (
          <Bar key={key} dataKey={key} fill={seriesColor}
            radius={radius}
            stackId={stacked ? 'stack' : undefined}
            maxBarSize={maxSize} isAnimationActive={false}
          >
            {useRowColors && data.map((_, rowIdx) => (
              <Cell key={`cell-${rowIdx}`} fill={palette[rowIdx % palette.length]} />
            ))}
          </Bar>
        );
      })}
    </BarChart>
  );
}

// ─── PIE ──────────────────────────────────────────────────────────────────────

function renderPie(
  data: Record<string, unknown>[],
  nameKey: string, valueKeys: string[], palette: string[],
  donut: boolean, hidden: Set<string>, t: ReturnType<typeof tk>
) {
  const valueKey = valueKeys[0] ?? 'value';
  const visibleData = data.filter(d => !hidden.has(String(d[nameKey])));
  return (
    <PieChart margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
      <Pie
        data={visibleData} dataKey={valueKey} nameKey={nameKey}
        cx="50%" cy="50%"
        innerRadius={donut ? '50%' : '0%'} outerRadius="78%"
        paddingAngle={2} strokeWidth={0}
        style={{ outline: 'none' }}
        isAnimationActive={false}
      >
        {visibleData.map((entry, i) => {
          const origIdx = data.findIndex(d => d[nameKey] === entry[nameKey]);
          return (
            <Cell key={i}
              fill={palette[origIdx % palette.length]}
              style={{ outline: 'none', cursor: 'default' }}
            />
          );
        })}
      </Pie>
      <Tooltip content={<PieTooltip t={t} />} />
    </PieChart>
  );
}

// ─── RADAR ────────────────────────────────────────────────────────────────────

function renderRadar(
  data: Record<string, unknown>[],
  nameKey: string, valueKeys: string[], palette: string[],
  hidden: Set<string>, t: ReturnType<typeof tk>
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
        return (
          <Radar key={key} dataKey={key}
            stroke={color} fill={color} fillOpacity={0.12} strokeWidth={2}
            isAnimationActive={false}
          />
        );
      })}
    </RadarChart>
  );
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
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const isEmpty = !data.length || !valueKeys.length;

  // Legend: for single-series bar/area charts with row-level colors, show one
  // item per data row. For multi-series and pie, keep existing behaviour.
  const legendItems: LegendItem[] = useMemo(() => {
    if (type === 'pie' || type === 'pie-donut') {
      return data.map((d, i) => ({
        key:   String(d[nameKey]),
        color: palette[i % palette.length],
      }));
    }
    const isSingleSeries = (type === 'bar' || type === 'bar-horizontal') && valueKeys.length === 1;
    if (isSingleSeries) {
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
      case 'area':           return renderArea(data, nameKey, valueKeys, palette, false, hidden, t);
      case 'area-stacked':   return renderArea(data, nameKey, valueKeys, palette, true,  hidden, t);
      case 'bar':            return renderBar(data, nameKey, valueKeys, palette, false, false, hidden, t);
      case 'bar-stacked':    return renderBar(data, nameKey, valueKeys, palette, true,  false, hidden, t);
      case 'bar-horizontal': return renderBar(data, nameKey, valueKeys, palette, false, true,  hidden, t);
      case 'pie':            return renderPie(data, nameKey, valueKeys, palette, false, hidden, t);
      case 'pie-donut':      return renderPie(data, nameKey, valueKeys, palette, true,  hidden, t);
      case 'radar':          return renderRadar(data, nameKey, valueKeys, palette, hidden, t);
      default:               return null;
    }
  }, [type, data, nameKey, valueKeys, palette, hidden, t, isEmpty]);

  return (
    <div className="not-prose" style={{ margin: '1.25rem 0' }}>
      {/* Глобальный сброс outline для всех recharts-элементов */}
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
          <CustomLegend items={legendItems} hidden={hidden} onToggle={toggleHidden} t={t} />
        )}

        <div style={{
          padding: '5px 16px 7px', fontSize: 11, color: t.footerText,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: `1px solid ${t.footerBdr}`, userSelect: 'none',
        }}>
          <span>
            {data.length}{' '}
            {data.length === 1 ? 'запись' : data.length < 5 ? 'записи' : 'записей'}
          </span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, opacity: 0.6 }}>
            {type}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Context-aware export ─────────────────────────────────────────────────────

export const ChartBlockWithContext: React.FC<Omit<ChartBlockProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <ChartBlock {...props} isDark={isDark} />;
};

export default ChartBlockWithContext;