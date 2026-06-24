import React from 'react';
import { BookOpenText, Component, FileText, FolderOpen, Home, List, PanelLeft, Search, Settings, Sun } from 'lucide-react';
import { useTheme } from '@/shared/contexts/useTheme';
import { makeTokens } from '@/shared/tokens/theme';

type NavMode = 'simple' | 'categories' | 'doc' | 'doc-toc';
interface OpensophyNavigationMockProps { mode?: NavMode; }
const items = [{ icon: <Home size={18} />, label: 'Главная' }, { icon: <BookOpenText size={18} />, label: 'Docs' }, { icon: <Component size={18} />, label: 'UI' }, { icon: <Settings size={18} />, label: 'Опции' }];

export function OpensophyNavigationMock({ mode = 'categories' }: OpensophyNavigationMockProps) {
  const { isDark } = useTheme();
  const t = makeTokens(isDark);
  const showPanel = mode !== 'simple';
  const showToc = mode === 'doc-toc';
  return <div style={{ width: '100%', minHeight: 390, display: 'grid', gridTemplateColumns: `64px ${showPanel ? 'minmax(210px, 260px)' : '0px'} 1fr ${showToc ? '220px' : '0px'}`, overflow: 'hidden', border: `1px solid ${t.border}`, borderRadius: 18, background: t.bgPage, color: t.fg }}>
    <aside style={{ padding: 8, borderRight: `1px solid ${t.border}`, background: t.bg, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((it, i) => <button key={it.label} style={{ border: 0, background: i === 2 ? t.accentSoft : 'transparent', color: i === 2 ? t.fg : t.fgMuted, borderRadius: 12, height: 52, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>{it.icon}<span style={{ fontSize: 9 }}>{it.label}</span></button>)}
      <div style={{ flex: 1 }} /><button style={{ border: 0, background: 'transparent', color: t.fgMuted }}><Sun size={17} /></button>
    </aside>
    {showPanel && <aside style={{ padding: 14, borderRight: `1px solid ${t.border}`, background: t.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}><PanelLeft size={16} /><strong>{mode === 'doc' || mode === 'doc-toc' ? 'UI Библиотека' : 'Навигация'}</strong></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', border: `1px solid ${t.inpBdr}`, borderRadius: 10, color: t.fgSub, marginBottom: 14 }}><Search size={15} /> Поиск</div>
      {(mode === 'categories' ? ['Фон', 'Типографика', 'Opensophy components'] : ['Навигация', 'Карточки', 'Кнопки', 'Палитра']).map((name, i) => <div key={name} style={{ marginBottom: 8 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 10, background: i === 0 ? t.surfaceHov : 'transparent', color: i === 0 ? t.fg : t.fgMuted }}><FolderOpen size={15} />{name}</div>{mode === 'categories' && i === 2 && <div style={{ marginLeft: 22, marginTop: 6, display: 'grid', gap: 5, color: t.fgSub, fontSize: 12 }}><span><FileText size={12} /> navigation</span><span><FileText size={12} /> cards</span></div>}</div>)}
    </aside>}
    <main style={{ padding: 22, background: t.bgPage }}><div style={{ border: `1px solid ${t.border}`, background: t.surface, borderRadius: 18, height: '100%', padding: 20 }}><h2 style={{ marginTop: 0 }}>Документ / превью</h2><p style={{ color: t.fgMuted }}>В doc-режиме навигация становится chrome-панелью вокруг markdown страницы. TOC можно включить отдельной правой панелью.</p></div></main>
    {showToc && <aside style={{ padding: 14, borderLeft: `1px solid ${t.border}`, background: t.bg }}><div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}><List size={16} /><strong>Содержание</strong></div>{['Обзор', 'Пропсы', 'Примеры', 'Код'].map((h, i) => <div key={h} style={{ padding: '7px 0 7px 10px', borderLeft: `2px solid ${i === 1 ? t.accent : t.border}`, color: i === 1 ? t.fg : t.fgMuted, fontSize: 13 }}>{h}</div>)}</aside>}
  </div>;
}

export default function OpensophyNavigationPreview() { return <div style={{ display: 'grid', gap: 18, width: '100%' }}>{(['simple', 'categories', 'doc', 'doc-toc'] as NavMode[]).map(m => <section key={m}><h3 style={{ margin: '0 0 10px' }}>{m}</h3><OpensophyNavigationMock mode={m} /></section>)}</div>; }
