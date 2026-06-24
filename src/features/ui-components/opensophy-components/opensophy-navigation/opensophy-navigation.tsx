import React from 'react';
import {
  BookOpen, CalendarDays, ChevronDown, ChevronRight, CircleDot, Component,
  Folder, Hash, Mail, PanelLeftClose, Search, Sparkles, Sun, List,
} from 'lucide-react';
import { useTheme } from '@/shared/contexts/useTheme';

type NavMode = 'simple' | 'categories' | 'doc' | 'doc-toc';
interface OpensophyNavigationMockProps { mode?: NavMode; }

function colors(isDark: boolean) {
  return isDark ? {
    page: '#0a0a0a', panel: '#0f0f0f', control: '#0b0b0b', card: '#202020', card2: '#111111',
    border: 'rgba(255,255,255,0.10)', borderStrong: 'rgba(255,255,255,0.18)', text: 'rgba(255,255,255,0.92)', muted: 'rgba(255,255,255,0.56)', sub: 'rgba(255,255,255,0.36)',
  } : {
    page: '#E8E7E3', panel: '#dddcd8', control: '#d8d7d3', card: '#ecebe7', card2: '#d8d7d3',
    border: 'rgba(0,0,0,0.12)', borderStrong: 'rgba(0,0,0,0.22)', text: 'rgba(0,0,0,0.88)', muted: 'rgba(0,0,0,0.56)', sub: 'rgba(0,0,0,0.36)',
  };
}

function ControlButton({ children, dark = false, right }: { children: React.ReactNode; dark?: boolean; right?: React.ReactNode }) {
  const { isDark } = useTheme();
  const c = colors(isDark);
  return <button style={{ width: '100%', height: 36, borderRadius: 8, border: `1px solid ${c.borderStrong}`, background: dark ? (isDark ? '#090909' : '#d2d1cd') : c.control, color: c.text, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 10px', fontSize: 13, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)' : '0 1px 4px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.55)' }}><span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>{children}</span>{right}</button>;
}

function Rail() {
  const { isDark } = useTheme();
  const c = colors(isDark);
  const items = [[<PanelLeftClose size={17} />, 'Скрыть\nпанель'], [<Sun size={17} />, 'Тема'], [<Search size={18} />, 'Поиск'], [<Folder size={18} />, 'Разделы'], [<BookOpen size={18} />, 'Режим\nчтения'], [<Mail size={18} />, 'Контакты']];
  return <aside style={{ width: 64, padding: '22px 8px 14px', borderRight: `1px solid ${c.border}`, background: c.page, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
    <div style={{ width: 27, height: 27, borderRadius: 999, background: 'radial-gradient(circle at 35% 30%, #fff, #d9d9d9 36%, #707070 70%, #111)', border: `1px solid ${c.borderStrong}`, boxShadow: '0 0 0 1px rgba(255,255,255,.12)' }} />
    {items.map(([icon, label], i) => <button key={String(label)} style={{ width: 54, border: 0, background: 'transparent', color: i === 3 ? c.text : c.muted, display: 'grid', placeItems: 'center', gap: 5, cursor: 'pointer' }}>{icon}<span style={{ whiteSpace: 'pre-line', fontSize: 10, lineHeight: 1.1, fontWeight: i === 3 ? 700 : 500 }}>{label}</span></button>)}
  </aside>;
}

function SidePanel({ mode }: { mode: NavMode }) {
  const { isDark } = useTheme();
  const c = colors(isDark);
  if (mode === 'simple') return null;
  const docMode = mode === 'doc' || mode === 'doc-toc';
  return <aside style={{ width: 255, padding: '10px 14px', borderRight: `1px solid ${c.border}`, background: c.panel }}>
    <header style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><strong style={{ color: c.muted, textTransform: 'uppercase', letterSpacing: '.08em', fontSize: 12 }}>Навигация</strong><button style={{ width: 26, height: 26, borderRadius: 8, border: `1px solid ${c.borderStrong}`, background: isDark ? '#090909' : '#d2d1cd', color: c.muted, display: 'grid', placeItems: 'center' }}>×</button></header>
    <div style={{ display: 'grid', gap: 10 }}>
      <ControlButton dark><Search size={14} /><span style={{ color: c.muted }}>Поиск...</span></ControlButton>
      <ControlButton dark right={<ChevronDown size={13} style={{ color: c.muted }} />}><Component size={14} />UI Библиотека</ControlButton>
      {docMode && <article style={{ display: 'grid', gridTemplateColumns: '25px 1fr', gap: 10, padding: '12px 10px', borderRadius: 9, border: `1px solid ${c.borderStrong}`, background: c.card, color: c.text }}><Component size={16} style={{ marginTop: 23, color: c.muted }} /><div><b style={{ fontSize: 14 }}>UI Библиотека</b><p style={{ margin: '5px 0 0', color: c.muted, fontSize: 12, lineHeight: 1.45 }}>Обзор UI библиотеки Opensophy Hub — community-компоненты, будущие Opensophy-компоненты и как всё это устроено.</p></div></article>}
      {['Фон', 'Opensophy components', 'Типографика'].map((x, i) => <div key={x} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 34px', alignItems: 'center', minHeight: 39, borderRadius: 8, border: `1px solid ${c.border}`, background: c.panel, color: c.text, overflow: 'hidden' }}><span style={{ height: '100%', display: 'grid', placeItems: 'center', borderRight: `1px solid ${c.border}` }}><ChevronRight size={13} /></span><span style={{ display: 'flex', alignItems: 'center', gap: 9, paddingLeft: 10, fontWeight: 700, fontSize: 14 }}>{i === 2 ? <span style={{ fontSize: 10 }}>AA</span> : <Component size={14} />}{x}</span><span style={{ justifySelf: 'center', color: c.muted, background: isDark ? '#242424' : '#cccac5', borderRadius: 5, padding: '3px 7px', fontSize: 11 }}>{i === 1 ? 4 : 20}</span></div>)}
      {!docMode && <div style={{ marginLeft: 38, display: 'grid', gap: 6, color: c.muted, fontSize: 12 }}><span><Hash size={12} /> Навигация</span><span><Hash size={12} /> Карточки</span><span><Hash size={12} /> Кнопки</span></div>}
    </div>
  </aside>;
}

function Content({ mode }: { mode: NavMode }) {
  const { isDark } = useTheme();
  const c = colors(isDark);
  return <main style={{ minHeight: 470, background: c.page, color: c.text, overflow: 'hidden' }}>
    <section style={{ minHeight: 180, padding: '52px 34px 34px', borderBottom: `1px solid ${c.border}`, background: `radial-gradient(circle at 70% 20%, ${isDark ? 'rgba(255,255,255,.055)' : 'rgba(0,0,0,.045)'}, transparent 32%), ${c.page}` }}>
      <div style={{ display: 'flex', gap: 18, color: c.muted, fontSize: 12 }}><span><CalendarDays size={13} /> 3 июня 2026 г.</span><span>↻ Обновлено: 3 июня 2026 г.</span></div>
      <h1 style={{ margin: '22px 0 12px', fontSize: 44, lineHeight: 1.05 }}>UI Библиотека</h1><p style={{ margin: 0, color: c.muted, maxWidth: 760, fontSize: 17, lineHeight: 1.55 }}>Обзор UI библиотеки Opensophy Hub — community-компоненты, будущие Opensophy-компоненты и как всё это устроено.</p>
    </section>
    <section style={{ padding: 34 }}><h2 style={{ fontSize: 34, margin: '0 0 16px' }}>UI Библиотека</h2><p style={{ color: c.text, lineHeight: 1.6 }}><b>UI Библиотека</b> — каталог интерактивных React-компонентов для Opensophy Hub.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginTop: 28 }}><div style={{ border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, background: c.page }}><CircleDot size={20} /><h3>Community компоненты</h3><p style={{ color: c.muted }}>Карточка соответствует основному Hub стилю.</p></div><div style={{ border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, background: c.page }}><Sparkles size={20} /><h3>Opensophy компоненты</h3><p style={{ color: c.muted }}>Минимальный макет будущих компонентов.</p></div></div></section>
    {mode === 'doc-toc' && <div style={{ position: 'absolute', right: 18, top: 22, width: 190, padding: 12, border: `1px solid ${c.border}`, borderRadius: 12, background: c.panel }}><b style={{ display: 'flex', gap: 8, alignItems: 'center' }}><List size={15} />Оглавление</b>{['Обзор', 'Два направления', 'Community', 'Opensophy'].map((x, i) => <div key={x} style={{ marginTop: 8, paddingLeft: 8, borderLeft: `2px solid ${i === 1 ? c.text : c.border}`, color: i === 1 ? c.text : c.muted, fontSize: 12 }}>{x}</div>)}</div>}
  </main>;
}

export function OpensophyNavigationMock({ mode = 'categories' }: OpensophyNavigationMockProps) {
  const { isDark } = useTheme();
  const c = colors(isDark);
  return <div style={{ position: 'relative', width: '100%', minHeight: 470, display: 'flex', overflow: 'hidden', border: `1px solid ${c.border}`, borderRadius: 18, background: c.page, fontFamily: 'Inter, system-ui, sans-serif' }}><Rail /><SidePanel mode={mode} /><div style={{ flex: 1, position: 'relative' }}><Content mode={mode} /></div></div>;
}

export default function OpensophyNavigationPreview() { return <div style={{ display: 'grid', gap: 22, width: '100%' }}>{(['simple', 'categories', 'doc', 'doc-toc'] as NavMode[]).map(m => <section key={m}><h3 style={{ margin: '0 0 10px', textTransform: 'capitalize' }}>{m}</h3><OpensophyNavigationMock mode={m} /></section>)}</div>; }
