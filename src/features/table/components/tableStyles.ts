export function getTableStyles(isDark: boolean): string {
  const cellColor    = isDark ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.88)';
  const codeBg       = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const codeBorder   = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)';
  const strongColor  = isDark ? '#ffffff'                : '#0f0f14';
  const markBg       = isDark ? 'rgba(251,191,36,0.25)'  : 'rgba(251,191,36,0.35)';
  const markColor    = isDark ? '#fbbf24'                : '#92400e';

  return `
    table {
      border-collapse: separate;
      border-spacing: 0;
      /*
       * FIX: width:auto + min-width:100% вместо width:100% + min-width:max-content.
       * - min-width:100% гарантирует, что таблица заполняет контейнер,
       *   когда её контент уже контейнера.
       * - width:auto позволяет таблице расти за пределы контейнера
       *   при широком контенте, что запускает горизонтальный скролл.
       * - Это устраняет пустое место справа на планшетных размерах (~660–764px)
       *   при таблицах с малым числом колонок.
       */
      width: auto;
      min-width: 100%;
    }
    th, td {
      padding: 0.65rem 1rem;
      color: ${cellColor};
      white-space: nowrap;
    }
    th {
      font-weight: 600;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    td code {
      background: ${codeBg};
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.82em;
      font-family: ui-monospace, 'Cascadia Code', monospace;
      white-space: pre-wrap;
      word-break: break-word;
      border: 1px solid ${codeBorder};
    }
    td strong, td b { font-weight: 700; color: ${strongColor}; }
    td em, td i     { font-style: italic; opacity: 0.85; }
    td u            { text-decoration: underline; text-underline-offset: 3px; }
    td del, td s, td strike { text-decoration: line-through; opacity: 0.5; }
    td sub  { vertical-align: sub;   font-size: 0.75em; }
    td sup  { vertical-align: super; font-size: 0.75em; }
    td mark {
      background: ${markBg};
      color: ${markColor};
      padding: 1px 5px;
      border-radius: 3px;
    }
    td a       { color: #3b82f6; text-decoration: underline; text-underline-offset: 2px; word-break: break-word; }
    td a:hover { color: #2563eb; }
  `;
}