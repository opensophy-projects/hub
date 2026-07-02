const e=`import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Lightbulb, OctagonX, Sparkles } from 'lucide-react';
import { useTheme } from '@/shared/contexts/useTheme';
import { makeTokens } from '@/shared/tokens/theme';

export type OpensophyRadius = 'round' | 'soft' | 'sharp';
export type OpensophyAlertTone = 'green' | 'purple' | 'yellow' | 'orange' | 'red' | 'blue';

export interface OpensophyCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  radius?: OpensophyRadius;
  alert?: OpensophyAlertTone;
  children?: React.ReactNode;
}

const radiusMap: Record<OpensophyRadius, number> = { round: 24, soft: 14, sharp: 2 };
const darkAlerts: Record<OpensophyAlertTone, [string, string, string]> = {
  green: ['rgba(34,197,94,0.07)', 'rgba(34,197,94,0.18)', 'rgba(134,239,172,0.92)'],
  purple: ['rgba(168,85,247,0.07)', 'rgba(168,85,247,0.18)', 'rgba(216,180,254,0.92)'],
  yellow: ['rgba(234,179,8,0.08)', 'rgba(234,179,8,0.2)', 'rgba(253,224,71,0.92)'],
  orange: ['rgba(249,115,22,0.08)', 'rgba(249,115,22,0.2)', 'rgba(253,186,116,0.92)'],
  red: ['rgba(239,68,68,0.08)', 'rgba(239,68,68,0.2)', 'rgba(252,165,165,0.92)'],
  blue: ['rgba(59,130,246,0.07)', 'rgba(59,130,246,0.18)', 'rgba(147,197,253,0.92)'],
};
const lightAlerts: Record<OpensophyAlertTone, [string, string, string]> = {
  green: ['#d4ddd4', 'rgba(82,130,90,0.22)', '#446a4c'],
  purple: ['#dad4e0', 'rgba(122,90,160,0.22)', '#664888'],
  yellow: ['#dedad0', 'rgba(143,120,48,0.22)', '#7a6428'],
  orange: ['#dfd7d0', 'rgba(170,101,43,0.22)', '#8a5428'],
  red: ['#ddd4d4', 'rgba(160,82,82,0.22)', '#884040'],
  blue: ['#d4d9e0', 'rgba(85,128,160,0.22)', '#4a6f8a'],
};

export function OpensophyCard({ title, description, icon, radius = 'soft', alert, children }: OpensophyCardProps) {
  const { isDark } = useTheme();
  const t = makeTokens(isDark);
  const alertColors = alert ? (isDark ? darkAlerts : lightAlerts)[alert] : undefined;
  const bg = alertColors?.[0] ?? (isDark ? '#0f0f0f' : 'rgba(0,0,0,0.02)');
  const border = alertColors?.[1] ?? t.border;
  const iconColor = alertColors?.[2] ?? t.fgMuted;

  return (
    <article style={{
      position: 'relative', overflow: 'hidden', minHeight: 150, padding: 20,
      borderRadius: radiusMap[radius], border: \`1px solid \${border}\`, background: bg,
      boxShadow: alert ? 'none' : t.shadowSoft, color: t.fg,
      transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease',
    }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {icon && <div style={{ width: 36, height: 36, borderRadius: Math.max(2, radiusMap[radius] - 8), display: 'grid', placeItems: 'center', color: iconColor, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', border: \`1px solid \${border}\`, flexShrink: 0 }}>{icon}</div>}
        <div style={{ minWidth: 0 }}>
          {title && <h3 style={{ margin: 0, fontSize: 16, lineHeight: 1.3 }}>{title}</h3>}
          {description && <p style={{ margin: '7px 0 0', color: alert ? iconColor : t.fgMuted, fontSize: 13, lineHeight: 1.55 }}>{description}</p>}
          {children && <div style={{ marginTop: 10, color: t.fgMuted, fontSize: 13, lineHeight: 1.6 }}>{children}</div>}
        </div>
      </div>
    </article>
  );
}

export default function OpensophyCardsPreview() {
  const cards = [
    ['Без иконки', undefined, undefined, 'soft'], ['С иконкой', <Sparkles size={18} />, undefined, 'soft'], ['Круглые углы', <Sparkles size={18} />, undefined, 'round'], ['Слегка круглые', <Sparkles size={18} />, undefined, 'soft'], ['Острые углы', <Sparkles size={18} />, undefined, 'sharp'],
    ['Green alert', <CheckCircle2 size={18} />, 'green', 'soft'], ['Purple alert', <AlertCircle size={18} />, 'purple', 'soft'], ['Yellow alert', <Lightbulb size={18} />, 'yellow', 'soft'], ['Orange alert', <AlertTriangle size={18} />, 'orange', 'soft'], ['Red alert', <OctagonX size={18} />, 'red', 'soft'],
  ] as const;
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, width: '100%' }}>{cards.map(([title, icon, alert, radius]) => <OpensophyCard key={title} title={title} icon={icon ?? (title === 'Без иконки' ? undefined : <Info size={18} />)} alert={alert} radius={radius} description="Минимальная карточка в стиле Hub с управляемыми пропсами." />)}</div>;
}
`;export{e as default};
