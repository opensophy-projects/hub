import React from 'react';
import { DEFAULT_THEME_COLORS, THEME_COLOR_META } from '@/shared/tokens/theme';
import type { ThemeColorKey } from '@/shared/tokens/theme';

const keys = Object.keys(DEFAULT_THEME_COLORS.dark) as ThemeColorKey[];
function swatchBg(value: string) { return value.startsWith('rgba') ? `linear-gradient(135deg, ${value}, ${value}), repeating-conic-gradient(#999 0% 25%, #fff 0% 50%) 50% / 14px 14px` : value; }
export default function OpensophyPalettePreview() {
  return <div style={{ display: 'grid', gap: 24, width: '100%' }}>{(['dark', 'light'] as const).map(mode => <section key={mode}><h3 style={{ margin: '0 0 12px', textTransform: 'capitalize' }}>{mode} theme</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>{keys.map(k => <div key={`${mode}-${k}`} style={{ border: '1px solid rgba(127,127,127,.18)', borderRadius: 14, overflow: 'hidden', background: mode === 'dark' ? '#0f0f0f' : '#e8e7e3' }}><div style={{ height: 74, background: swatchBg(DEFAULT_THEME_COLORS[mode][k]) }} /><div style={{ padding: 10 }}><strong style={{ display: 'block', fontSize: 12 }}>{THEME_COLOR_META[k].label}</strong><code style={{ display: 'block', marginTop: 6, fontSize: 11, opacity: .72 }}>{DEFAULT_THEME_COLORS[mode][k]}</code></div></div>)}</div></section>)}</div>;
}
