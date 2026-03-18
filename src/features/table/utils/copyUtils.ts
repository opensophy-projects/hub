export type CopyFormat = 'md' | 'excel';

export function parseTableForCopy(html: string): { headers: string[]; rows: string[][] } {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const tbl = doc.querySelector('table');
  if (!tbl) return { headers: [], rows: [] };
  return {
    headers: Array.from(tbl.querySelectorAll('thead th')).map(
      (th) => (th.textContent ?? '').trim()
    ),
    rows: Array.from(tbl.querySelectorAll('tbody tr')).map((tr) =>
      Array.from(tr.querySelectorAll('td')).map((td) => (td.textContent ?? '').trim())
    ),
  };
}

export function toMd(headers: string[], rows: string[][]): string {
  if (!headers.length) return '';
  const e = (s: string) => s.replaceAll('|', String.raw`\|`);
  return [
    `| ${headers.map(e).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.map(e).join(' | ')} |`),
  ].join('\n');
}

export function toTsv(headers: string[], rows: string[][]): string {
  if (!headers.length) return '';
  return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
}