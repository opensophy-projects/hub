import React, { useContext, useMemo } from 'react';
import { TableContext } from '../lib/htmlParser';
import {
  EvilAreaChart, Area, XAxis as AreaXAxis, YAxis as AreaYAxis, Tooltip as AreaTooltip, Legend as AreaLegend,
} from '@/shared/evilcharts/charts/area-chart';
import {
  EvilLineChart, Line, XAxis as LineXAxis, YAxis as LineYAxis, Tooltip as LineTooltip, Legend as LineLegend,
} from '@/shared/evilcharts/charts/line-chart';
import {
  EvilBarChart, Bar, XAxis as BarXAxis, YAxis as BarYAxis, Tooltip as BarTooltip, Legend as BarLegend,
} from '@/shared/evilcharts/charts/bar-chart';
import {
  EvilPieChart, Pie, Tooltip as PieTooltip, Legend as PieLegend, Background as PieBackground,
} from '@/shared/evilcharts/charts/pie-chart';
import {
  EvilRadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip as RadarTooltip, Legend as RadarLegend,
} from '@/shared/evilcharts/charts/radar-chart';
import type { ChartConfig } from '@/shared/evilcharts/ui/chart';

export type ChartType =
  | 'area' | 'area-stacked' | 'area-expanded'
  | 'line'
  | 'bar' | 'bar-stacked' | 'bar-percent' | 'bar-horizontal'
  | 'pie' | 'pie-donut'
  | 'radar';

export type ChartRow = Record<string, string | number>;
export type ChartDesign = 'default' | 'gradient' | 'hatched' | 'duotone' | 'duotone-reverse' | 'stripped' | 'solid' | 'dotted' | 'lines' | 'glowing';
export type ChartBackground = 'dots' | 'grid' | 'cross-hatch' | 'diagonal-lines' | 'tiny-checkers' | 'plus' | 'bubbles' | 'wiggle-lines' | 'falling-triangles' | 'overlapping-circles' | '4-pointed-star';
export type ChartTooltip = 'default' | 'glass' | 'frosted' | 'minimal';
export type ChartLegend = 'circle' | 'square' | 'rounded-square' | 'circle-outline' | 'rounded-square-outline';

interface ChartBlockProps {
  type: ChartType;
  data: ChartRow[];
  title?: string;
  colors?: string[];
  design?: ChartDesign;
  background?: ChartBackground;
  tooltip?: ChartTooltip;
  legend?: ChartLegend;
  curve?: 'linear' | 'monotone' | 'monotoneX' | 'step' | 'bump';
  isDark: boolean;
}

const DEFAULT_COLORS = ['#8b5cf6', '#22d3ee', '#f59e0b', '#34d399', '#f472b6', '#60a5fa', '#fb923c', '#a3e635'];

function detectKeys(data: ChartRow[]): { nameKey: string; valueKeys: string[] } {
  if (!data.length) return { nameKey: 'name', valueKeys: [] };
  const keys = Object.keys(data[0]);
  return { nameKey: keys[0] ?? 'name', valueKeys: keys.slice(1) };
}

function buildConfig(valueKeys: string[], palette: string[]): ChartConfig {
  return Object.fromEntries(valueKeys.map((key, index) => [
    key,
    { label: key, colors: { light: [palette[index % palette.length]], dark: [palette[index % palette.length]] } },
  ]));
}

function normalizeCurve(curve?: ChartBlockProps['curve']) {
  if (curve === 'monotone') return 'monotoneX';
  return curve ?? 'linear';
}

function normalizeTooltip(tooltip?: ChartTooltip) {
  return tooltip === 'glass' ? 'frosted' : tooltip;
}

function renderSeries(valueKeys: string[], kind: 'area' | 'line' | 'bar' | 'radar', design: ChartDesign) {
  return valueKeys.map((key) => {
    if (kind === 'bar') return <Bar key={key} dataKey={key} variant={design === 'solid' || design === 'glowing' ? 'default' : design as any} glowing={design === 'glowing'} enableHoverHighlight />;
    if (kind === 'area') return <Area key={key} dataKey={key} variant={design === 'solid' || design === 'glowing' ? 'solid' : design as any} strokeVariant={design === 'dotted' ? 'dotted' : design === 'solid' ? 'solid' : 'dashed'} isClickable />;
    if (kind === 'line') return <Line key={key} dataKey={key} strokeVariant={design === 'dotted' ? 'dotted' : design === 'solid' ? 'solid' : 'dashed'} glowing={design === 'glowing'} isClickable />;
    return <Radar key={key} dataKey={key} variant={design === 'lines' ? 'lines' : 'filled'} isClickable />;
  });
}

const ChartBlock: React.FC<ChartBlockProps> = ({ type, data, title, colors, design = 'gradient', background, tooltip = 'default', legend = 'rounded-square', curve, isDark }) => {
  const palette = colors?.length ? colors : DEFAULT_COLORS;
  const { nameKey, valueKeys } = useMemo(() => detectKeys(data), [data]);
  const config = useMemo(() => buildConfig(valueKeys, palette), [valueKeys, palette]);
  const empty = !data.length || !valueKeys.length;

  if (empty) {
    return <div className="not-prose my-5 rounded-xl border p-8 text-center text-sm opacity-60">Нет данных</div>;
  }

  const commonHeader = title ? <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</div> : null;
  const commonClass = `not-prose my-5 rounded-xl border ${isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-white'} p-4 shadow-sm`;
  const tip = normalizeTooltip(tooltip) as any;

  let chart: React.ReactNode;
  if (type.startsWith('area')) {
    chart = <EvilAreaChart config={config} data={data} stackType={type === 'area-stacked' ? 'stacked' : type === 'area-expanded' ? 'expanded' : 'default'} curveType={normalizeCurve(curve) as any} className="h-[320px]"><AreaXAxis dataKey={nameKey} /><AreaYAxis /><AreaTooltip variant={tip} /><AreaLegend variant={legend as any} isClickable />{renderSeries(valueKeys, 'area', design)}</EvilAreaChart>;
  } else if (type === 'line') {
    chart = <EvilLineChart config={config} data={data} curveType={normalizeCurve(curve) as any} backgroundVariant={background as any} className="h-[320px]"><LineXAxis dataKey={nameKey} /><LineYAxis /><LineTooltip variant={tip} /><LineLegend variant={legend as any} isClickable />{renderSeries(valueKeys, 'line', design)}</EvilLineChart>;
  } else if (type.startsWith('bar')) {
    chart = <EvilBarChart config={config} data={data} stackType={type === 'bar-stacked' ? 'stacked' : type === 'bar-percent' ? 'percent' : 'default'} layout={type === 'bar-horizontal' ? 'horizontal' : 'vertical'} backgroundVariant={background as any} className="h-[320px]"><BarXAxis dataKey={nameKey} /><BarYAxis /><BarTooltip variant={tip} /><BarLegend variant={legend as any} isClickable />{renderSeries(valueKeys, 'bar', design)}</EvilBarChart>;
  } else if (type.startsWith('pie')) {
    const pieConfig = buildConfig(data.map((row) => String(row[nameKey])), palette);
    chart = <EvilPieChart config={pieConfig} data={data} nameKey={nameKey} dataKey={valueKeys[0]} className="h-[320px]"><Pie variant={design === 'glowing' ? 'gradient' : design as any} innerRadius={type === 'pie-donut' ? '52%' : 0} isClickable />{background && <PieBackground variant={background as any} />}<PieTooltip variant={tip} /><PieLegend variant={legend as any} isClickable /></EvilPieChart>;
  } else {
    chart = <EvilRadarChart config={config} data={data} backgroundVariant={background as any} className="h-[340px]"><PolarGrid /><PolarAngleAxis dataKey={nameKey} /><RadarTooltip variant={tip} /><RadarLegend variant={legend as any} isClickable />{renderSeries(valueKeys, 'radar', design)}</EvilRadarChart>;
  }

  return <div className={commonClass}>{commonHeader}{chart}<div className="mt-3 flex justify-between border-t pt-2 text-[11px] opacity-50"><span>{data.length} записей</span><span className="font-mono">{type} · {design}</span></div></div>;
};

export const ChartBlockWithContext: React.FC<Omit<ChartBlockProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <ChartBlock {...props} isDark={isDark} />;
};

export default ChartBlockWithContext;