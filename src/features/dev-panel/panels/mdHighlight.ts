/**
 * Lightweight Markdown syntax highlighter for textarea overlay.
 * Returns an array of {text, class} tokens.
 */

export interface MdToken {
  text: string;
  cls: string; // CSS class name
}

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

function escHtml(s: string): string {
  return s.replace(/[&<>]/g, c => ESCAPE_MAP[c] || c);
}

export function highlightMarkdown(code: string): string {
  const lines = code.split('\n');
  const result: string[] = [];
  let inFence = false;
  let fenceLang = '';

  for (const raw of lines) {
    let line = raw;

    // Fenced code block
    if (/^```/.test(line)) {
      if (!inFence) {
        inFence = true;
        fenceLang = line.slice(3).trim();
        result.push(`<span class="mh-fence">${escHtml(line)}</span>`);
      } else {
        inFence = false;
        result.push(`<span class="mh-fence">${escHtml(line)}</span>`);
      }
      continue;
    }

    if (inFence) {
      result.push(`<span class="mh-code">${escHtml(line)}</span>`);
      continue;
    }

    // Frontmatter
    if (line === '---') {
      result.push(`<span class="mh-fm-sep">${escHtml(line)}</span>`);
      continue;
    }

    // Custom Hub blocks  :::note, :::card, :::steps etc.
    if (/^:::/.test(line)) {
      result.push(`<span class="mh-block">${escHtml(line)}</span>`);
      continue;
    }

    // Heading
    const headingMatch = /^(#{1,6})\s(.*)/.exec(line);
    if (headingMatch) {
      result.push(`<span class="mh-h mh-h${headingMatch[1].length}"><span class="mh-hmark">${escHtml(headingMatch[1])}</span> <span class="mh-htext">${inlineHighlight(headingMatch[2])}</span></span>`);
      continue;
    }

    // HR
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      result.push(`<span class="mh-hr">${escHtml(line)}</span>`);
      continue;
    }

    // Blockquote
    if (/^>/.test(line)) {
      result.push(`<span class="mh-bq">${escHtml(line)}</span>`);
      continue;
    }

    // List item
    if (/^(\s*)([-*+]|\d+\.)/.test(line)) {
      result.push(`<span class="mh-li">${inlineHighlight(line)}</span>`);
      continue;
    }

    // [key]: value  (frontmatter inline or link ref)
    if (/^\[.+\]/.test(line)) {
      result.push(`<span class="mh-block">${inlineHighlight(line)}</span>`);
      continue;
    }

    result.push(`<span class="mh-p">${inlineHighlight(line)}</span>`);
  }

  return result.join('\n');
}

function inlineHighlight(text: string): string {
  // Process inline patterns left-to-right, protecting already-processed spans
  let out = escHtml(text);

  // Bold+italic ***text***
  out = out.replace(/\*\*\*(.+?)\*\*\*/g, '<span class="mh-bi">***$1***</span>');
  // Bold **text**
  out = out.replace(/\*\*(.+?)\*\*/g, '<span class="mh-b">**$1**</span>');
  // Italic *text*
  out = out.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<span class="mh-i">*$1*</span>');
  // Inline code `code`
  out = out.replace(/`([^`]+)`/g, '<span class="mh-ic">`$1`</span>');
  // Link [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
    '<span class="mh-lbr">[</span><span class="mh-ltext">$1</span><span class="mh-lbr">]</span><span class="mh-lparen">(</span><span class="mh-lurl">$2</span><span class="mh-lparen">)</span>');
  // ~~strikethrough~~
  out = out.replace(/~~(.+?)~~/g, '<span class="mh-del">~~$1~~</span>');

  return out;
}

export const MD_HIGHLIGHT_CSS_DARK = `
.mh-h1 { color: #e2e8f0; font-size: 1.1em; }
.mh-h2 { color: #cbd5e1; font-size: 1.05em; }
.mh-h3, .mh-h4, .mh-h5, .mh-h6 { color: #b8c5d6; }
.mh-hmark { color: #7c5cfc; font-weight: bold; }
.mh-htext { color: #e2e8f0; font-weight: bold; }
.mh-b  { color: #f1f5f9; font-weight: bold; }
.mh-bi { color: #f1f5f9; font-weight: bold; font-style: italic; }
.mh-i  { color: #cbd5e1; font-style: italic; }
.mh-ic { color: #86efac; background: rgba(134,239,172,0.1); border-radius: 2px; }
.mh-del { color: #94a3b8; text-decoration: line-through; }
.mh-bq  { color: #94a3b8; border-left: 2px solid #7c5cfc; padding-left: 4px; }
.mh-hr  { color: #475569; }
.mh-li  { color: #e2e8f0; }
.mh-fence { color: #7c5cfc; font-weight: bold; }
.mh-code  { color: #86efac; }
.mh-fm-sep { color: #f59e0b; }
.mh-block { color: #7c5cfc; font-weight: bold; }
.mh-p   { color: #e2e8f0; }
.mh-lbr { color: #7c5cfc; }
.mh-ltext { color: #38bdf8; }
.mh-lparen { color: #94a3b8; }
.mh-lurl { color: #64748b; }
`;

export const MD_HIGHLIGHT_CSS_LIGHT = `
.mh-h1 { color: #0f172a; font-size: 1.1em; }
.mh-h2 { color: #1e293b; font-size: 1.05em; }
.mh-h3, .mh-h4, .mh-h5, .mh-h6 { color: #334155; }
.mh-hmark { color: #6b46e8; font-weight: bold; }
.mh-htext { color: #0f172a; font-weight: bold; }
.mh-b  { color: #0f172a; font-weight: bold; }
.mh-bi { color: #0f172a; font-weight: bold; font-style: italic; }
.mh-i  { color: #334155; font-style: italic; }
.mh-ic { color: #166534; background: rgba(22,101,52,0.08); border-radius: 2px; }
.mh-del { color: #64748b; text-decoration: line-through; }
.mh-bq  { color: #64748b; border-left: 2px solid #6b46e8; padding-left: 4px; }
.mh-hr  { color: #94a3b8; }
.mh-li  { color: #1e293b; }
.mh-fence { color: #6b46e8; font-weight: bold; }
.mh-code  { color: #166534; }
.mh-fm-sep { color: #b45309; }
.mh-block { color: #6b46e8; font-weight: bold; }
.mh-p   { color: #1e293b; }
.mh-lbr { color: #6b46e8; }
.mh-ltext { color: #0369a1; }
.mh-lparen { color: #64748b; }
.mh-lurl { color: #94a3b8; }
`;