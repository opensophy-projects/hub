const e=`import React from 'react';

const palettes = [
  { title: 'Dark theme', text: '#ffffff', bg: '#0a0a0a', colors: [['Фон · слой 1', '#0a0a0a'], ['Фон · слой 2', '#111111'], ['Фон · слой 3', '#1a1a1a']] },
  { title: 'Light theme', text: '#111111', bg: '#E8E7E3', colors: [['Фон · слой 1', '#E8E7E3'], ['Фон · слой 2', '#d8d7d3'], ['Фон · слой 3', '#dddcd8']] },
] as const;

export default function OpensophyPalettePreview() {
  return <div style={{ display: 'grid', gap: 22, width: '100%', fontFamily: 'Inter, system-ui, sans-serif' }}>{palettes.map(p => <section key={p.title} style={{ padding: 18, borderRadius: 18, background: p.bg, color: p.text, border: '1px solid rgba(127,127,127,.18)' }}><h3 style={{ margin: '0 0 14px', fontSize: 24 }}>{p.title}</h3><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>{p.colors.map(([name, hex]) => <article key={hex} style={{ overflow: 'hidden', borderRadius: 16, border: '1px solid rgba(127,127,127,.24)', background: p.title.startsWith('Dark') ? '#0f0f0f' : '#ecebe7' }}><div style={{ height: 108, background: hex }} /><div style={{ padding: 12, color: p.text }}><strong style={{ display: 'block', fontSize: 13 }}>{name}</strong><code style={{ display: 'block', marginTop: 7, fontSize: 12, color: p.text, opacity: .72 }}>{hex}</code></div></article>)}</div></section>)}</div>;
}
`;export{e as default};
