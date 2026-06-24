import React from 'react';
import { ChevronDown, Component, Copy, Search, Settings, X } from 'lucide-react';
import { useTheme } from '@/shared/contexts/useTheme';

type ButtonVariant = 'close' | 'search' | 'section' | 'ghost' | 'solid' | 'outline' | 'card';
type ButtonRadius = 'round' | 'soft' | 'sharp';
interface OpensophyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: ButtonVariant; radius?: ButtonRadius; icon?: React.ReactNode; label?: string; }
const radii: Record<ButtonRadius, number> = { round: 999, soft: 8, sharp: 2 };
function c(isDark: boolean) { return isDark ? { bg: '#0a0a0a', panel: '#0f0f0f', control: '#090909', active: '#202020', border: 'rgba(255,255,255,.13)', border2: 'rgba(255,255,255,.22)', text: 'rgba(255,255,255,.9)', muted: 'rgba(255,255,255,.56)' } : { bg: '#E8E7E3', panel: '#dddcd8', control: '#d2d1cd', active: '#ecebe7', border: 'rgba(0,0,0,.13)', border2: 'rgba(0,0,0,.22)', text: 'rgba(0,0,0,.88)', muted: 'rgba(0,0,0,.56)' }; }

export function OpensophyButton({ variant = 'ghost', radius = 'soft', icon, label, children, style, ...props }: OpensophyButtonProps) {
  const { isDark } = useTheme();
  const t = c(isDark);
  const base: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 36, padding: '0 12px', borderRadius: radii[radius], cursor: 'pointer', fontWeight: 600, fontSize: 13, color: t.text, transition: 'transform .14s ease, background .14s ease, border-color .14s ease', fontFamily: 'Inter, system-ui, sans-serif', boxShadow: 'none' };
  const variants: Record<ButtonVariant, React.CSSProperties> = {
    close: { width: 26, minHeight: 26, padding: 0, background: t.control, border: `1px solid ${t.border}`, color: t.muted },
    search: { minWidth: 220, justifyContent: 'flex-start', background: t.control, border: `1px solid ${t.border}`, color: t.muted, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)' : '0 1px 4px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.55)' },
    section: { minWidth: 220, justifyContent: 'space-between', background: t.control, border: `1px solid ${t.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)' : '0 1px 4px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.55)' },
    ghost: { background: 'transparent', border: '1px solid transparent', color: t.muted },
    solid: { background: t.text, color: isDark ? '#0a0a0a' : '#fff', border: `1px solid ${t.text}` },
    outline: { background: 'transparent', border: `1px solid ${t.border2}` },
    card: { minHeight: 78, padding: '18px', justifyContent: 'flex-start', background: t.bg, border: `1px solid ${t.border}`, width: '100%', borderRadius: radii[radius] === 999 ? 24 : 16 },
  };
  const content = variant === 'close' ? (icon ?? <X size={13} />) : <>{icon}{label ?? children}{variant === 'section' && <ChevronDown size={13} style={{ marginLeft: 'auto', color: t.muted }} />}</>;
  return <button {...props} style={{ ...base, ...variants[variant], ...style }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>{content}</button>;
}

export default function OpensophyButtonsPreview() {
  return <div style={{ display: 'grid', gap: 18, width: '100%' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <OpensophyButton variant="close" aria-label="Закрыть" />
      <OpensophyButton variant="search" icon={<Search size={14} />}>Поиск...</OpensophyButton>
      <OpensophyButton variant="section" icon={<Component size={14} />}>UI Библиотека</OpensophyButton>
      <OpensophyButton variant="ghost" icon={<Settings size={16} />}>Ghost</OpensophyButton>
      <OpensophyButton variant="outline" icon={<Copy size={16} />}>Outline</OpensophyButton>
      <OpensophyButton variant="solid" icon={<Component size={16} />}>Solid</OpensophyButton>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
      <OpensophyButton variant="card" icon={<Component size={18} />}>Кнопка-карточка</OpensophyButton>
      <OpensophyButton variant="card" radius="round" icon={<Settings size={18} />}>Round card action</OpensophyButton>
    </div>
  </div>;
}
