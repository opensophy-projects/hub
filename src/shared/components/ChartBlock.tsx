import React, { useContext, useMemo } from 'react';
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import { TableContext } from '../lib/htmlParser';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChartType =
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

// ─── Token helper — same pattern as rest of codebase ─────────────────────────

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
    axisText:    isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)',
    titleText:   isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.32)',
    footerText:  isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.32)',
    footerBdr:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
  };
}

// ─── Key detection ────────────────────────────────────────────────────────────
// First key = category axis (X / label). Rest = numeric series.

function detectKeys(data: Record<string, unknown>[]): { nameKey: string; valueKeys: string[] } {
  if (!data.length) return { nameKey: 'name', valueKeys: [] };
  const keys = Object.keys(data[0]);
  return {
    nameKey:   keys[0] ?? 'name',
    valueKeys: keys.slice(1),
  };
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

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
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      color: t.tooltipText,
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    }}>
      {label && (
        <div style={{ fontWeight: 600, marginBottom: 4, opacity: 0.7 }}>{label}</div>
      )}
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

// ─── Pie custom tooltip ───────────────────────────────────────────────────────

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
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      color: t.tooltipText,
      boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: entry.payload.fill, flexShrink: 0 }} />
        <span style={{ fontWeight: 600 }}>{entry.name}:</span>
        <span>{entry.value}</span>
      </div>
    </div>
  );
};

// ─── Legend style ─────────────────────────────────────────────────────────────

function legendStyle(t: ReturnType<typeof tk>) {
  return { fontSize: 11, color: t.axisText };
}

// ─── Chart renderers ──────────────────────────────────────────────────────────

function renderArea(
  data: Record<string, unknown>[],
  nameKey: string,
  valueKeys: string[],
  palette: string[],
  stacked: boolean,
  t: ReturnType<typeof tk>
) {
  return (
    <AreaChart data={data}>
      <XAxis dataKey={nameKey} tick={{ fill: t.axisText, fontSize: 11 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: t.axisText, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
      <Tooltip content={<CustomTooltip t={t} />} />
      {valueKeys.length > 1 && <Legend wrapperStyle={legendStyle(t)} />}
      {valueKeys.map((key, i) => (
        <Area
          key={key}
          type="monotone"
          dataKey={key}
          stroke={palette[i % palette.length]}
          fill={palette[i % palette.length]}
          fillOpacity={0.12}
          strokeWidth={2}
          stackId={stacked ? 'stack' : undefined}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      ))}
    </AreaChart>
  );
}

function renderBar(
  data: Record<string, unknown>[],
  nameKey: string,
  valueKeys: string[],
  palette: string[],
  stacked: boolean,
  horizontal: boolean,
  t: ReturnType<typeof tk>
) {
  const axisProps = { tick: { fill: t.axisText, fontSize: 11 }, axisLine: false, tickLine: false };
  return (
    <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'}>
      {horizontal
        ? <><YAxis dataKey={nameKey} type="category" {...axisProps} width={80} /><XAxis type="number" {...axisProps} /></>
        : <><XAxis dataKey={nameKey} {...axisProps} /><YAxis {...axisProps} width={36} /></>
      }
      <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: t.axisText, fillOpacity: 0.06 }} />
      {valueKeys.length > 1 && <Legend wrapperStyle={legendStyle(t)} />}
      {valueKeys.map((key, i) => (
        <Bar
          key={key}
          dataKey={key}
          fill={palette[i % palette.length]}
          radius={stacked ? [0, 0, 0, 0] : (horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0])}
          stackId={stacked ? 'stack' : undefined}
          maxBarSize={48}
        />
      ))}
    </BarChart>
  );
}

function renderPie(
  data: Record<string, unknown>[],
  nameKey: string,
  valueKeys: string[],
  palette: string[],
  donut: boolean,
  t: ReturnType<typeof tk>
) {
  const valueKey = valueKeys[0] ?? 'value';
  const innerR   = donut ? '55%' : '0%';
  return (
    <PieChart>
      <Pie
        data={data}
        dataKey={valueKey}
        nameKey={nameKey}
        cx="50%"
        cy="50%"
        innerRadius={innerR}
        outerRadius="75%"
        paddingAngle={2}
        strokeWidth={0}
      >
        {data.map((_, i) => (
          <Cell key={i} fill={palette[i % palette.length]} />
        ))}
      </Pie>
      <Tooltip content={<PieTooltip t={t} />} />
      <Legend wrapperStyle={legendStyle(t)} />
    </PieChart>
  );
}

function renderRadar(
  data: Record<string, unknown>[],
  nameKey: string,
  valueKeys: string[],
  palette: string[],
  t: ReturnType<typeof tk>
) {
  return (
    <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
      <PolarGrid stroke={t.axisText} strokeOpacity={0.3} />
      <PolarAngleAxis dataKey={nameKey} tick={{ fill: t.axisText, fontSize: 11 }} />
      <Tooltip content={<CustomTooltip t={t} />} />
      {valueKeys.length > 1 && <Legend wrapperStyle={legendStyle(t)} />}
      {valueKeys.map((key, i) => (
        <Radar
          key={key}
          dataKey={key}
          stroke={palette[i % palette.length]}
          fill={palette[i % palette.length]}
          fillOpacity={0.15}
          strokeWidth={2}
        />
      ))}
    </RadarChart>
  );
}

// ─── ChartBlock ───────────────────────────────────────────────────────────────

const ChartBlock: React.FC<ChartBlockProps> = ({ type, data, title, colors, isDark }) => {
  const t       = tk(isDark);
  const palette = colors?.length ? colors : DEFAULT_COLORS;
  const { nameKey, valueKeys } = useMemo(() => detectKeys(data), [data]);

  const chart = useMemo(() => {
    if (!data.length || !valueKeys.length) return null;

    switch (type) {
      case 'area':
        return renderArea(data, nameKey, valueKeys, palette, false, t);
      case 'area-stacked':
        return renderArea(data, nameKey, valueKeys, palette, true, t);
      case 'bar':
        return renderBar(data, nameKey, valueKeys, palette, false, false, t);
      case 'bar-stacked':
        return renderBar(data, nameKey, valueKeys, palette, true, false, t);
      case 'bar-horizontal':
        return renderBar(data, nameKey, valueKeys, palette, false, true, t);
      case 'pie':
        return renderPie(data, nameKey, valueKeys, palette, false, t);
      case 'pie-donut':
        return renderPie(data, nameKey, valueKeys, palette, true, t);
      case 'radar':
        return renderRadar(data, nameKey, valueKeys, palette, t);
      default:
        return null;
    }
  }, [type, data, nameKey, valueKeys, palette, t]);

  const isEmpty = !data.length || !valueKeys.length;

  return (
    <div className="not-prose" style={{ margin: '1.25rem 0' }}>
      <div style={{
        borderRadius: 12,
        border: `1px solid ${t.outerBorder}`,
        background: t.outerBg,
        boxShadow: t.outerShadow,
        overflow: 'hidden',
      }}>
        {title && (
          <div style={{
            padding: '10px 16px 0',
            fontSize: '0.69rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: t.titleText,
          }}>
            {title}
          </div>
        )}

        <div style={{ padding: title ? '12px 8px 4px' : '16px 8px 4px' }}>
          {isEmpty ? (
            <div style={{
              height: 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              color: t.axisText,
              fontStyle: 'italic',
            }}>
              Нет данных
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              {chart ?? <div />}
            </ResponsiveContainer>
          )}
        </div>

        <div style={{
          padding: '4px 16px 8px',
          fontSize: 11,
          color: t.footerText,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px solid ${t.footerBdr}`,
          userSelect: 'none',
        }}>
          <span>{data.length} {data.length === 1 ? 'запись' : data.length < 5 ? 'записи' : 'записей'}</span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, opacity: 0.7 }}>{type}</span>
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

export type { ChartType };
export default ChartBlockWithContext;