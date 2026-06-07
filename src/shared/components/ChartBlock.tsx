import React, { useContext, useMemo, useState, useCallback } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar, Cell,
  PieChart, Pie,
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
    outerBorder:  isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    outerShadow:  isDark
      ? '0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset'
      : '0 2px 12px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.9) inset',
    tooltipBg:    isDark ? '#18181b' : '#ffffff',
    tooltipBdr:   isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    tooltipText:  isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
    tooltipShadow: isDark
      ? '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)'
      : '0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
    axisText:     isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
    titleText:    isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.25)',
    footerText:   isDark ? 'rgba(255,255,255,0.2)'  : 'rgba(0,0,0,0.28)',
    footerBdr:    isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    legendText:   isDark ? 'rgba(255,255,255,0.5)'  : 'rgba(0,0,0,0.5)',
    legendMuted:  isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)',
    gridLine:     isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    cursorFill:   isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    dotBg:        isDark ? '#18181b' : '#ffffff',
  };
}

// ─── Определение ключей ───────────────────────────────────────────────────────

function detectKeys(data: ChartRow[]): { nameKey: string; valueKeys: string[] } {
  if (!data.length) return { nameKey: 'name', valueKeys: [] };
  const keys = Object.keys(data[0]);
  return { nameKey: keys[0] ?? 'name', valueKeys: keys.slice(1) };
}

// ─── Кастомный Tooltip ────────────────────────────────────────────────────────

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
      padding: '9px 13px',
      fontSize: 12,
      color: t.tooltipText,
      boxShadow: t.tooltipShadow,
      pointerEvents: 'none',
      minWidth: 120,
    }}>
      {label && (
        <div style={{
          fontWeight: 600,
          fontSize: 11,
          marginBottom: 7,
          opacity: 0.5,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
        }}>
          {label}
        </div>
      )}
      {payload.map(entry => (
        <div key={entry.name} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          marginTop: 3,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: entry.color,
              flexShrink: 0,
              boxShadow: `0 0 0 2px ${entry.color}33`,
            }} />
            <span style={{ opacity: 0.6, fontSize: 11 }}>{entry.name}</span>
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
      background: t.tooltipBg,
      border: `1px solid ${t.tooltipBdr}`,
      borderRadius: 10,
      padding: '9px 13px',
      fontSize: 12,
      color: t.tooltipText,
      boxShadow: t.tooltipShadow,
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: entry.payload.fill,
          flexShrink: 0,
          boxShadow: `0 0 0 2px ${entry.payload.fill}33`,
        }} />
        <span style={{ fontWeight: 600 }}>{entry.name}</span>
        <span style={{ opacity: 0.5, fontSize: 11 }}>·</span>
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
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '3px 8px',
      padding: '0 14px 12px',
    }}>
      {items.map(item => {
        const isHidden = hidden.has(item.key);
        return (
          <button
            key={item.key}
            onClick={() => onToggle(item.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: isHidden
                ? 'transparent'
                : `${item.color}14`,
              border: `1px solid ${isHidden ? t.legendMuted : item.color + '40'}`,
              cursor: 'pointer',
              padding: '3px 9px 3px 7px',
              borderRadius: 20,
              outline: 'none',
              color: isHidden ? t.legendMuted : t.legendText,
              fontSize: 11,
              fontWeight: 500,
              userSelect: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              flexShrink: 0,
              background: isHidden ? t.legendMuted : item.color,
              transition: 'all 0.15s ease',
            }} />
            <span style={{
              textDecoration: isHidden ? 'line-through' : 'none',
              opacity: isHidden ? 0.5 : 1,
            }}>
              {item.key}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ─── Высота чарта ─────────────────────────────────────────────────────────────

function chartHeight(type: ChartType, rowCount: number): number {
  if (type === 'bar-horizontal') return Math.max(110, rowCount * 42 + 40);
  if (type === 'pie' || type === 'pie-donut') return 248;
  if (type === 'radar') return 276;
  return 218;
}

// ─── Пропсы осей ─────────────────────────────────────────────────────────────

function ap(t: ReturnType<typeof tk>) {
  return {
    tick: { fill: t.axisText, fontSize: 11, fontWeight: 500 },
    axisLine: false,
    tickLine: false,
  };
}

// ─── Area ─────────────────────────────────────────────────────────────────────

function renderArea(
  data: ChartRow[],
  nameKey: string,
  valueKeys: string[],
  palette: string[],
  stacked: boolean,
  hidden: Set<string>,
  t: ReturnType<typeof tk>
) {
  const visible = valueKeys.filter(k => !hidden.has(k));
  return (
    <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
      <defs>
        {visible.map((key) => {
          const idx = valueKeys.indexOf(key);
          const color = palette[idx % palette.length];
          return (
            <linearGradient key={key} id={`area-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          );
        })}
      </defs>
      <XAxis dataKey={nameKey} {...ap(t)} tickMargin={8} />
      <YAxis {...ap(t)} width={40} tickMargin={4} />
      <Tooltip
        content={<CustomTooltip t={t} />}
        cursor={{ stroke: t.gridLine, strokeWidth: 1 }}
      />
      {visible.map((key) => {
        const idx = valueKeys.indexOf(key);
        const color = palette[idx % palette.length];
        return (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            fill={`url(#area-grad-${idx})`}
            strokeWidth={2}
            stackId={stacked ? 'stack' : undefined}
            dot={false}
            activeDot={{
              r: 4,
              strokeWidth: 2,
              stroke: t.dotBg,
              fill: color,
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
  if (seriesCount <= 1) return 64;
  if (seriesCount <= 3) return 48;
  return 36;
}

function getCategoryGap(rowCount: number): string {
  if (rowCount <= 3)  return '18%';
  if (rowCount <= 6)  return '22%';
  if (rowCount <= 10) return '28%';
  return '32%';
}

interface RenderBarOptions {
  data: ChartRow[];
  nameKey: string;
  valueKeys: string[];
  palette: string[];
  stacked: boolean;
  horizontal: boolean;
  hidden: Set<string>;
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

function renderBar({
  data, nameKey, valueKeys, palette,
  stacked, horizontal, hidden, t,
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
  const bGap = visible.length <= 2 ? 4 : 3;

  return (
    <BarChart
      data={visibleData}
      layout={horizontal ? 'vertical' : 'horizontal'}
      margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
      barCategoryGap={getCategoryGap(data.length)}
      barGap={bGap}
    >
      {horizontal
        ? (
          <>
            <YAxis dataKey={nameKey} type="category" {...a} width={96} tickMargin={6} />
            <XAxis type="number" {...a} tickMargin={8} />
          </>
        ) : (
          <>
            <XAxis dataKey={nameKey} {...a} tickMargin={8} />
            <YAxis {...a} width={40} tickMargin={4} />
          </>
        )
      }
      <Tooltip
        content={<CustomTooltip t={t} />}
        cursor={{ fill: t.cursorFill }}
      />
      {visible.map((key) => {
        const idx = valueKeys.indexOf(key);
        const seriesColor = palette[idx % palette.length];
        const isLastVisible = visible.indexOf(key) === visible.length - 1;
        const radius = getBarRadius(stacked, horizontal, isLastVisible);
        return (
          <Bar
            key={key}
            dataKey={key}
            fill={seriesColor}
            radius={radius}
            stackId={stacked ? 'stack' : undefined}
            maxBarSize={maxSize}
            isAnimationActive={false}
          >
            {useRowColors && visibleData.map((_, rowIdx) => {
              const origIdx = data.indexOf(visibleData[rowIdx]);
              return (
                <Cell
                  key={`cell-${String(visibleData[rowIdx][nameKey])}`}
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

function renderPie(
  data: ChartRow[],
  nameKey: string,
  valueKeys: string[],
  palette: string[],
  donut: boolean,
  hidden: Set<string>,
  t: ReturnType<typeof tk>
) {
  const valueKey = valueKeys[0] ?? 'value';
  const visibleData = data.filter(d => !hidden.has(String(d[nameKey])));
  return (
    <PieChart margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
      <Pie
        data={visibleData}
        dataKey={valueKey}
        nameKey={nameKey}
        cx="50%"
        cy="50%"
        innerRadius={donut ? '52%' : '0%'}
        outerRadius="80%"
        paddingAngle={donut ? 3 : 1}
        strokeWidth={0}
        style={{ outline: 'none' }}
        isAnimationActive={false}
      >
        {visibleData.map((entry) => {
          const rowName = String(entry[nameKey]);
          const origIdx = data.findIndex(d => String(d[nameKey]) === rowName);
          return (
            <Cell
              key={rowName}
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

// ─── Radar ────────────────────────────────────────────────────────────────────

function renderRadar(
  data: ChartRow[],
  nameKey: string,
  valueKeys: string[],
  palette: string[],
  hidden: Set<string>,
  t: ReturnType<typeof tk>
) {
  const visible = valueKeys.filter(k => !hidden.has(k));
  return (
    <RadarChart
      data={data}
      cx="50%"
      cy="50%"
      outerRadius="72%"
      margin={{ top: 8, right: 20, left: 20, bottom: 8 }}
    >
      <PolarGrid stroke={t.gridLine} strokeWidth={1} />
      <PolarAngleAxis
        dataKey={nameKey}
        tick={{ fill: t.axisText, fontSize: 11, fontWeight: 500 }}
      />
      <Tooltip content={<CustomTooltip t={t} />} />
      {visible.map((key) => {
        const idx = valueKeys.indexOf(key);
        const color = palette[idx % palette.length];
        return (
          <Radar
            key={key}
            dataKey={key}
            stroke={color}
            fill={color}
            fillOpacity={0.1}
            strokeWidth={2}
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
      case 'bar':            return renderBar({ data, nameKey, valueKeys, palette, stacked: false, horizontal: false, hidden, t });
      case 'bar-stacked':    return renderBar({ data, nameKey, valueKeys, palette, stacked: true,  horizontal: false, hidden, t });
      case 'bar-horizontal': return renderBar({ data, nameKey, valueKeys, palette, stacked: false, horizontal: true,  hidden, t });
      case 'pie':            return renderPie(data, nameKey, valueKeys, palette, false, hidden, t);
      case 'pie-donut':      return renderPie(data, nameKey, valueKeys, palette, true,  hidden, t);
      case 'radar':          return renderRadar(data, nameKey, valueKeys, palette, hidden, t);
      default:               return null;
    }
  }, [type, data, nameKey, valueKeys, palette, hidden, t, isEmpty]);

  return (
    <div className="not-prose" style={{ margin: '1.5rem 0' }}>
      {/* Сброс outline для recharts */}
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
        .recharts-active-dot circle {
          filter: drop-shadow(0 0 3px currentColor);
        }
      `}</style>

      <div style={{
        borderRadius: 14,
        border: `1px solid ${t.outerBorder}`,
        background: t.outerBg,
        boxShadow: t.outerShadow,
        overflow: 'hidden',
        outline: 'none',
      }}>
        {/* Шапка */}
        {title && (
          <div style={{
            padding: '12px 18px 0',
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: t.titleText,
          }}>
            {title}
          </div>
        )}

        {/* Тело */}
        <div style={{
          padding: title ? '10px 6px 2px' : '16px 6px 2px',
          outline: 'none',
        }}>
          {isEmpty ? (
            <div style={{
              height: 140,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              color: t.axisText,
              fontStyle: 'italic',
              opacity: 0.6,
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
          <div style={{ padding: '8px 10px 0' }}>
            <CustomLegend
              items={legendItems}
              hidden={hidden}
              onToggle={toggleHidden}
              t={t}
            />
          </div>
        )}

        {/* Футер */}
        <div style={{
          padding: '6px 18px 8px',
          fontSize: 11,
          color: t.footerText,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px solid ${t.footerBdr}`,
          userSelect: 'none',
          marginTop: 4,
        }}>
          <span style={{ opacity: 0.7 }}>
            {data.length} {pluralRecords(data.length)}
          </span>
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 10,
            opacity: 0.45,
            letterSpacing: '0.04em',
          }}>
            {type}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Экспорт с контекстом ─────────────────────────────────────────────────────

export const ChartBlockWithContext: React.FC<Omit<ChartBlockProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <ChartBlock {...props} isDark={isDark} />;
};

export default ChartBlockWithContext;