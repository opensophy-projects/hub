export function getTableStyles(isDark: boolean): string {
  const border       = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.2)';
  const color        = isDark ? 'rgba(255, 255, 255, 0.9)'  : 'rgb(0, 0, 0)';
  const codeBg       = isDark ? 'rgba(255, 255, 255, 0.1)'  : 'rgba(0, 0, 0, 0.1)';
  const codeBorder   = isDark ? 'rgba(255, 255, 255, 0.2)'  : 'rgba(0, 0, 0, 0.2)';
  const strongColor  = isDark ? 'rgba(255, 255, 255, 1)'    : 'rgb(0, 0, 0)';
  const thBg         = isDark ? '#1a1a1a'                   : '#E8E7E3';
  const markBg       = isDark ? 'rgb(202, 138, 4)'          : 'rgb(253, 224, 71)';
  const markColor    = isDark ? 'rgb(255, 255, 255)'        : 'rgb(0, 0, 0)';

  return `
    table { border-collapse: collapse; width: auto; min-width: 100%; }
    th, td {
      border: 1px solid ${border};
      padding: 0.75rem 1rem;
      color: ${color};
      white-space: nowrap;
    }
    th {
      font-weight: 600;
      background-color: ${thBg};
    }
    td code {
      background-color: ${codeBg};
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 0.85em;
      font-family: ui-monospace, monospace;
      white-space: pre-wrap;
      word-break: break-word;
      border: 1px solid ${codeBorder};
    }
    td strong, td b { font-weight: 700; color: ${strongColor}; }
    td em, td i     { font-style: italic; }
    td u            { text-decoration: underline; text-underline-offset: 2px; }
    td del, td s, td strike { text-decoration: line-through; opacity: 0.7; }
    td sub  { vertical-align: sub;   font-size: 0.75em; }
    td sup  { vertical-align: super; font-size: 0.75em; }
    td mark {
      background-color: ${markBg};
      color: ${markColor};
      padding: 2px 4px;
      border-radius: 2px;
    }
    td a       { color: rgb(59 130 246); text-decoration: underline; word-break: break-word; }
    td a:hover { color: rgb(37 99 235); }
  `;
}