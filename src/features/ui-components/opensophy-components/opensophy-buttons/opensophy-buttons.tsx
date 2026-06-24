import React from 'react';
import { ArrowRight, Component, Copy, Settings, X } from 'lucide-react';
import { useTheme } from '@/shared/contexts/useTheme';
import { makeTokens } from '@/shared/tokens/theme';

type ButtonVariant = 'close' | 'ghost' | 'solid' | 'outline' | 'card';
type ButtonRadius = 'round' | 'soft' | 'sharp';
interface OpensophyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: ButtonVariant; radius?: ButtonRadius; icon?: React.ReactNode; label?: string; }
const radii: Record<ButtonRadius, number> = { round: 999, soft: 10, sharp: 2 };

export function OpensophyButton({ variant = 'ghost', radius = 'soft', icon, label, children, style, ...props }: OpensophyButtonProps) {
  const { isDark } = useTheme();
  const t = makeTokens(isDark);
  const base: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 38, padding: '0 14px', borderRadius: radii[radius], cursor: 'pointer', fontWeight: 650, fontSize: 13, color: t.fg, transition: 'transform .14s ease, background .14s ease, border-color .14s ease', fontFamily: 'Inter, system-ui, sans-serif' };
  const variants: Record<ButtonVariant, React.CSSProperties> = {
    close: { width: 38, padding: 0, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border: `1px solid ${t.borderStrong}` },
    ghost: { background: 'transparent', border: `1px solid transparent`, color: t.fgMuted },
    solid: { background: t.accent, color: isDark ? '#0a0a0a' : '#fff', border: `1px solid ${t.accent}` },
    outline: { background: 'transparent', border: `1px solid ${t.borderStrong}` },
    card: { minHeight: 74, padding: '16px 18px', justifyContent: 'space-between', background: isDark ? '#0f0f0f' : 'rgba(0,0,0,0.025)', border: `1px solid ${t.border}`, boxShadow: t.shadowSoft, width: '100%' },
  };
  return <button {...props} style={{ ...base, ...variants[variant], ...style }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>{variant === 'close' ? (icon ?? <X size={18} />) : icon}{label ?? children}{variant === 'card' && <ArrowRight size={16} />}</button>;
}

export default function OpensophyButtonsPreview() {
  return <div style={{ display: 'grid', gap: 18, width: '100%' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <OpensophyButton variant="close" aria-label="Закрыть" />
      <OpensophyButton variant="ghost" icon={<Settings size={16} />}>Ghost</OpensophyButton>
      <OpensophyButton variant="outline" icon={<Copy size={16} />}>Outline</OpensophyButton>
      <OpensophyButton variant="solid" icon={<Component size={16} />}>Solid</OpensophyButton>
      <OpensophyButton variant="outline" radius="round">Round</OpensophyButton>
      <OpensophyButton variant="outline" radius="sharp">Sharp</OpensophyButton>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
      <OpensophyButton variant="card" icon={<Component size={18} />}>Кнопка-карточка</OpensophyButton>
      <OpensophyButton variant="card" radius="round" icon={<Settings size={18} />}>Round card action</OpensophyButton>
    </div>
  </div>;
}
