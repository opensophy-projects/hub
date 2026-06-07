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

// ─── Цветовая палитра ─────────────────────────────────────────────────────────
// Более насыщенные цвета — лучше читаются и дают более красивый glow

const DEFAULT_COLORS = [
  '#8b5cf6', // violet
  '#22d3ee', // cyan
  '#f59e0b', // amber
  '#34d399', // emerald
  '#f87171', // rose
  '#ec4899', // pink
  '#60a5fa', // blue
  '#fb923c', // orange
];

// ─── Glow-фильтры SVG ─────────────────────────────────────────────────────────

const GlowDefs: React.FC<{ isDark: boolean; colors: string[] }> = ({ isDark, colors }) => {
  if (!isDark) return null; // glow только в тёмной теме
  return (
    <svg width={0} height={0} style={{ position: 'absolute', pointerEvents: 'none' }}>
      <defs>
        {colors.map((color, i) => (
          <filter key={i} id={`glow-${i}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor={color} floodOpacity="0.55" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
        {/* Мягкий фоновый glow для area */}
        {colors.map((color, i) => (
          <filter key={`area-${i}`} id={`area-glow-${i}`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feFlood floodColor={color} floodOpacity="0.25" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>
    </svg>
  );
};

// ─── Токены темы ──────────────────────────────────────────────────────────────

function tk(isDark: boolean) {
  const t = makeTokens(isDark);
  return {
    outerBg:     isDark ? 'rgba(14, 12, 22, 0.95)' : t.bg,
    outerBorder: isDark ? 'rgba(139, 92, 246, 0.2)' : t.border,
    outerShadow: isDark
      ? '0 4px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.15), 0 0 32px rgba(139,92,246,0.06)'
      : '0 1px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.07)',
    tooltipBg:   isDark ? 'rgba(18, 16, 28, 0.97)' : '#ffffff',
    tooltipBdr:  isDark ? 'rgba(139,92,246,0.3)'   : 'rgba(0,0,0,0.12)',
    tooltipText: isDark ? 'rgba(255,255,255,0.9)'   : 'rgba(0,0,0,0.85)',
    axisText:    isDark ? 'rgba(255,255,255,0.3)'   : 'rgba(0,0,0,0.35)',
    titleText:   isDark ? 'rgba(255,255,255,0.22)'  : 'rgba(0,0,0,0.28)',
    footerText:  isDark ? 'rgba(255,255,255,0.2)'   : 'rgba(0,0,0,0.32)',
    footerBdr:   isDark ? 'rgba(255,255,255,0.06)'  : 'rgba(0,0,0,0.07)',
    legendText:  isDark ? 'rgba(255,255,255,0.6)'   : 'rgba(0,0,0,0.55)',
    legendMuted: isDark ? 'rgba(255,255,255,0.18)'  : 'rgba(0,0,0,0.2)',
    gridLine:    isDark ? 'rgba(255,255,255,0.05)'  : 'rgba(0,0,0,0.06)',
    // Горизонтальные grid-линии в тёмной теме чуть заметнее
    gridLinePrimary: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(0,0,0,0.06)',
    isDark,
  };
}

// ─── Определение ключей ───────────────────────────────────────────────────────

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
      background: t.tooltipBg,
      border: `1px solid ${t.tooltipBdr}`,
      borderRadius: 10,
      padding: '8px 12px',
      fontSize: 12,
      color: t.tooltipText,
      boxShadow: t.isDark
        ? '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.15)'
        : '0 4px 16px rgba(0,0,0,0.15)',
      pointerEvents: 'none',
      backdropFilter: t.isDark ? 'blur(8px)' : undefined,
    }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4, opacity: 0.65, fontSize: 11 }}>{label}</div>}
      {payload.map(entry => (
        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <div style={{
            width: 8, height: 8, borderRadius: 2, background: entry.color, flexShrink: 0,
            boxShadow: t.isDark ? `0 0 6px ${entry.color}` : undefined,
          }} />
          <span style={{ opacity: 0.65 }}>{entry.name}:</span>
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
      background: t.tooltipBg,
      border: `1px solid ${t.tooltipBdr}`,
      borderRadius: 10,
      padding: '8px 12px',
      fontSize: 12,
      color: t.tooltipText,
      boxShadow: t.isDark
        ? '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.15)'
        : '0 4px 16px rgba(0,0,0,0.15)',
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 8, height: 8, borderRadius: 2, background: entry.payload.fill, flexShrink: 0,
          boxShadow: t.isDark ? `0 0 6px ${entry.payload.fill}` : undefined,
        }} />
        <span style={{ fontWeight: 600 }}>{entry.name}:</span>
        <span>{entry.value}</span>
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
              boxShadow: (!isHidden && t.isDark) ? `0 0 6px ${item.color}80` : undefined,
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

// ─── Высота графика ───────────────────────────────────────────────────────────

function chartHeight(type: ChartType, rowCount: number): number {
  if (type === 'bar-horizontal') return Math.max(120, rowCount * 46 + 40);
  if (type === 'pie' || type === 'pie-donut') return 260;
  if (type === 'radar') return 290;
  // bar и bar-stacked — немного выше чем раньше
  if (type === 'bar' || type === 'bar-stacked') return 240;
  return 220;
}

// ─── Пропсы осей ─────────────────────────────────────────────────────────────

function ap(t: ReturnType<typeof tk>) {
  return { tick: { fill: t.axisText, fontSize: 11 }, axisLine: false, tickLine: false };
}

// ─── Area ─────────────────────────────────────────────────────────────────────

function renderArea(
  data: ChartRow[],
  nameKey: string, valueKeys: string[], palette: string[],
  stacked: boolean, hidden: Set<string>, t: ReturnType<typeof tk>
) {
  const visible = valueKeys.filter(k => !hidden.has(k));
  return (
    <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
      <defs>
        {visible.map((key) => {
          const idx = valueKeys.indexOf(key);
          const color = palette[idx % palette.length];
          return (
            <linearGradient key={key} id={`area-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={t.isDark ? 0.35 : 0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          );
        })}
      </defs>
      <XAxis dataKey={nameKey} {...ap(t)} />
      <YAxis {...ap(t)} width={38} />
      <Tooltip content={<CustomTooltip t={t} />} cursor={{ stroke: t.gridLine, strokeWidth: 1 }} />
      {visible.map((key) => {
        const idx = valueKeys.indexOf(key);
        const color = palette[idx % palette.length];
        return (
          <Area
            key={key} type="monotone" dataKey={key}
            stroke={color}
            strokeWidth={t.isDark ? 2.5 : 2}
            fill={`url(#area-grad-${idx})`}
            stackId={stacked ? 'stack' : undefined}
            dot={false}
            activeDot={{
              r: 5,
              strokeWidth: 0,
              style: t.isDark ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined,
            }}
            style={t.isDark ? { filter: `drop-shadow(0 0 4px ${color}80)` } : undefined}
            isAnimationActive={false}
          />
        );
      })}
    </AreaChart>
  );
}

// ─── Bar ──────────────────────────────────────────────────────────────────────

// Увеличенные размеры баров
function getMaxBarSize(seriesCount: number): number {
  if (seriesCount <= 1) return 88;
  if (seriesCount <= 3) return 68;
  return 52;
}

function getCategoryGap(rowCount: number): string {
  if (rowCount <= 3)  return '12%';
  if (rowCount <= 6)  return '18%';
  if (rowCount <= 10) return '22%';
  return '28%';
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
  if (!stacked) {
    return horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0];
  }
  if (isLastVisible) {
    return horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0];
  }
  return [0, 0, 0, 0];
}

// Вычислить цвет затемнённого фона за баром (подложка)
function barBgColor(color: string, isDark: boolean): string {
  // Берём hex-цвет и делаем очень прозрачную подложку
  return isDark ? `${color}18` : `${color}10`;
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
      margin={{ top: 6, right: 10, left: 0, bottom: 0 }}
      barCategoryGap={getCategoryGap(data.length)}
      barGap={bGap}
    >
      {/* Определения градиентов для баров */}
      <defs>
        {visible.map((key) => {
          const idx = valueKeys.indexOf(key);
          const color = palette[idx % palette.length];
          const gradId = `bar-grad-${idx}`;
          return (
            <linearGradient
              key={gradId} id={gradId}
              x1={horizontal ? '0' : '0'} y1={horizontal ? '0' : '0'}
              x2={horizontal ? '1' : '0'} y2={horizontal ? '0' : '1'}
            >
              <stop offset="0%" stopColor={color} stopOpacity={t.isDark ? 1 : 0.9} />
              <stop offset="100%" stopColor={color} stopOpacity={t.isDark ? 0.7 : 0.75} />
            </linearGradient>
          );
        })}
        {/* Градиенты для мульти-цветных одиночных серий */}
        {useRowColors && data.map((_, rowIdx) => {
          const color = palette[rowIdx % palette.length];
          return (
            <linearGradient
              key={`row-grad-${rowIdx}`} id={`row-grad-${rowIdx}`}
              x1="0" y1="0" x2="0" y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={t.isDark ? 1 : 0.9} />
              <stop offset="100%" stopColor={color} stopOpacity={t.isDark ? 0.65 : 0.7} />
            </linearGradient>
          );
        })}
      </defs>

      {horizontal
        ? <><YAxis dataKey={nameKey} type="category" {...a} width={90} /><XAxis type="number" {...a} /></>
        : <><XAxis dataKey={nameKey} {...a} /><YAxis {...a} width={38} /></>
      }
      <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: t.isDark ? 'rgba(255,255,255,0.03)' : t.gridLine }} />
      {visible.map((key) => {
        const idx = valueKeys.indexOf(key);
        const seriesColor = palette[idx % palette.length];
        const isLastVisible = visible.indexOf(key) === visible.length - 1;
        const radius = getBarRadius(stacked, horizontal, isLastVisible);

        return (
          <Bar
            key={key} dataKey={key}
            fill={useRowColors ? seriesColor : `url(#bar-grad-${idx})`}
            radius={radius}
            stackId={stacked ? 'stack' : undefined}
            maxBarSize={maxSize}
            isAnimationActive={false}
            style={
              t.isDark
                ? { filter: `drop-shadow(0 0 6px ${seriesColor}60)` }
                : undefined
            }
          >
            {useRowColors && visibleData.map((_, rowIdx) => {
              const origIdx = data.indexOf(visibleData[rowIdx]);
              const ri = origIdx === -1 ? rowIdx : origIdx;
              const rowColor = palette[ri % palette.length];
              return (
                <Cell
                  key={`cell-${String(visibleData[rowIdx][nameKey])}`}
                  fill={`url(#row-grad-${ri})`}
                  style={
                    t.isDark
                      ? { filter: `drop-shadow(0 0 5px ${rowColor}60)` }
                      : undefined
                  }
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
        innerRadius={donut ? '48%' : '0%'} outerRadius="80%"
        paddingAngle={donut ? 3 : 1} strokeWidth={0}
        style={{ outline: 'none' }}
        isAnimationActive={false}
      >
        {visibleData.map((entry) => {
          const rowName = String(entry[nameKey]);
          const origIdx = data.findIndex(d => String(d[nameKey]) === rowName);
          const color = palette[origIdx % palette.length];
          return (
            <Cell
              key={rowName}
              fill={color}
              style={{
                outline: 'none',
                cursor: 'default',
                filter: t.isDark ? `drop-shadow(0 0 6px ${color}80)` : undefined,
              }}
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
  nameKey: string, valueKeys: string[], palette: string[],
  hidden: Set<string>, t: ReturnType<typeof tk>
) {
  const visible = valueKeys.filter(k => !hidden.has(k));
  return (
    <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%"
      margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
      <PolarGrid stroke={t.isDark ? 'rgba(139,92,246,0.12)' : t.gridLine} />
      <PolarAngleAxis dataKey={nameKey} tick={{ fill: t.axisText, fontSize: 11 }} />
      <Tooltip content={<CustomTooltip t={t} />} />
      {visible.map((key) => {
        const idx = valueKeys.indexOf(key);
        const color = palette[idx % palette.length];
        return (
          <Radar key={key} dataKey={key}
            stroke={color} fill={color}
            fillOpacity={t.isDark ? 0.18 : 0.12}
            strokeWidth={t.isDark ? 2.5 : 2}
            style={t.isDark ? { filter: `drop-shadow(0 0 5px ${color}70)` } : undefined}
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
        .recharts-cartesian-grid-horizontal line {
          stroke-dasharray: 3 4;
        }
      `}</style>
      <div style={{
        borderRadius: 14,
        border: `1px solid ${t.outerBorder}`,
        background: t.outerBg,
        boxShadow: t.outerShadow,
        overflow: 'hidden',
        outline: 'none',
        // Дополнительная подсветка снизу в тёмной теме
        ...(isDark ? {
          backgroundImage: 'radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.07) 0%, transparent 65%)',
        } : {}),
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
          <span>{data.length}{' '}{pluralRecords(data.length)}</span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, opacity: 0.6 }}>
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