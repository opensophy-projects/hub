import React, { createContext } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { CodeBlock } from '../components/CodeBlock';
import TableWithControls from '@/features/table/components/TableWithControls';
import Alert from '../components/Alert';
import NewUIComponentViewer from '@/features/ui-components/NewUIComponentViewer';
import ImageCard from '../components/ImageCard';
import { CardWithContext, CardGridWithContext } from '../components/Card';
import { ColumnsWithContext } from '../components/Columns';
import { StepperWithContext } from '../components/Stepper';
import type { StepData, StepStatus } from '../components/Stepper';
import type { ColumnsLayout } from '../components/Columns';

// ─── § Exports & context ──────────────────────────────────────────────────────
//
// TableContext is a React context threaded through the entire parsed tree.
// It carries two values:
//   onTableClick — callback that opens the fullscreen TableModal in DocContent
//   isDark       — current theme flag, needed by all leaf components
//
// It is consumed by TableWithControls, CodeBlock, Card, and other leaf nodes
// that need the theme but don't have direct access to useTheme() because they
// are rendered as plain React elements (not hooks-capable function components).

export const TableContext = createContext<{
  onTableClick?: (tableHtml: string) => void;
  isDark: boolean;
}>({ isDark: false });

// Allowlists used for the single DOMPurify sanitize pass.
// SANITIZE_TAGS and SANITIZE_ATTR are exported so any future consumer
// can reuse the same policy without copy-pasting.

export const SANITIZE_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'strong', 'em', 'u', 'a',
  'ul', 'ol', 'li', 'blockquote', 'code',
  'pre', 'img', 'table', 'tr', 'td', 'th',
  'thead', 'tbody', 'div', 'span', 'hr', 'figure', 'figcaption',
  'del', 'input', 'sub', 'sup', 'details', 'summary', 'mark',
  // KaTeX-generated elements
  'math', 'semantics', 'mrow', 'mi', 'mn', 'mo', 'mtext', 'mspace',
  'mover', 'munder', 'munderover', 'msup', 'msub', 'msubsup', 'mfrac',
  'msqrt', 'mroot', 'mtable', 'mtr', 'mtd', 'mstyle', 'menclose',
  'annotation', 'svg', 'path', 'line', 'rect', 'circle', 'g', 'use',
  'defs', 'clippath',
];

export const SANITIZE_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id',
  'data-language', 'data-lang', 'data-alert-type',
  'data-cols', 'data-layout', 'data-status', 'data-title',
  'data-color', 'data-icon',
  'type', 'checked', 'disabled', 'open', 'style', 'align',
  // KaTeX / SVG attributes
  'xmlns', 'viewBox', 'd', 'fill', 'stroke', 'stroke-width',
  'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'cx', 'cy', 'r', 'transform', 'clip-path', 'clip-rule',
  'fill-rule', 'stroke-linecap', 'stroke-linejoin',
  'mathvariant', 'mathsize', 'stretchy', 'fence', 'separator',
  'lspace', 'rspace', 'minsize', 'maxsize', 'columnalign',
  'rowspacing', 'columnspacing', 'href', 'aria-hidden',
];

// Internal re-sanitize used ONLY for table.outerHTML, which is re-serialised
// from DOM back to string before passing to TableWithControls.
const sanitizeHtml = (html: string): string =>
  DOMPurify.sanitize(html, { ALLOWED_TAGS: SANITIZE_TAGS, ALLOWED_ATTR: SANITIZE_ATTR, ALLOW_DATA_ATTR: true });

// ─── § Slug helper ────────────────────────────────────────────────────────────
//
// Converts heading text to an id-safe slug.
// Must match the slugifyHeading in useTableOfContents.ts — they share the
// same algorithm so that TOC links and heading ids always align.

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

// ─── § Heading styles ─────────────────────────────────────────────────────────
//
// Inline styles applied to h1-h6 elements.
// scrollMarginTop: '5rem' ensures that when a TOC link scrolls to a heading,
// the heading is not hidden behind the fixed top bar.

const TAG_STYLES: Record<number, React.CSSProperties> = {
  1: { fontSize: 'clamp(1.4rem,3vw,2.25rem)',    fontWeight: 700, marginTop: '2rem',    marginBottom: '1rem',    lineHeight: 1.2,  scrollMarginTop: '5rem' },
  2: { fontSize: 'clamp(1.2rem,2.5vw,1.875rem)', fontWeight: 700, marginTop: '2rem',    marginBottom: '1rem',    lineHeight: 1.25, scrollMarginTop: '5rem' },
  3: { fontSize: 'clamp(1.05rem,2vw,1.5rem)',    fontWeight: 700, marginTop: '1.5rem',  marginBottom: '0.75rem', lineHeight: 1.3,  scrollMarginTop: '5rem' },
  4: { fontSize: 'clamp(1rem,1.8vw,1.25rem)',    fontWeight: 700, marginTop: '1.5rem',  marginBottom: '0.75rem',                   scrollMarginTop: '5rem' },
  5: { fontSize: '1rem',                          fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem',                    scrollMarginTop: '5rem' },
  6: { fontSize: '0.875rem',                      fontWeight: 700, marginTop: '1rem',    marginBottom: '0.5rem',  textTransform: 'uppercase', letterSpacing: '0.05em', scrollMarginTop: '5rem' },
};

// ─── § Element processors ─────────────────────────────────────────────────────
//
// Convention: every processor receives an already-sanitized DOM element and
// pushes one or more React nodes into the `elements` array.
// Processors must NOT modify the DOM — they are purely read-only.

// <pre><code> → CodeBlock React component
const processPreElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const codeElement = element.querySelector('code');
  if (!codeElement) return;
  const code = codeElement.textContent || '';
  const language =
    element.dataset.lang ||
    element.dataset.language ||
    codeElement.className.replace('language-', '') ||
    '';
  elements.push(React.createElement(CodeBlock, { key, code: code.trim(), language }));
};

// Inline <code> (not inside <pre>) — rendered as a simple styled element.
// We skip it if the parent is <pre> because processPreElement already handles that case.
const processCodeElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  if (element.parentElement?.tagName.toLowerCase() === 'pre') return;
  elements.push(
    React.createElement(
      'code',
      { key, className: 'bg-slate-900 px-2 py-1 rounded text-slate-100 font-mono text-sm' },
      element.textContent
    )
  );
};

// h1-h6 — assigns a slug id for TOC anchor linking
const processHeadingElement = (element: Element, tagName: string, key: string, elements: React.ReactNode[]) => {
  const text  = element.textContent || '';
  const id    = element.id || slugifyHeading(text);
  const level = Number.parseInt(tagName[1], 10);
  const Tag   = tagName as keyof JSX.IntrinsicElements;
  // innerHTML is already sanitized — safe to use directly via dangerouslySetInnerHTML
  elements.push(
    React.createElement(Tag, {
      key, id,
      style: TAG_STYLES[level],
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    })
  );
};

// ul / ol — task lists get a special className so CSS can style the checkboxes
const processListElement = (element: Element, tagName: string, key: string, elements: React.ReactNode[]) => {
  const hasTaskList = element.querySelector('input[type="checkbox"]');
  elements.push(
    React.createElement(tagName, {
      key,
      dangerouslySetInnerHTML: { __html: element.innerHTML },
      className: hasTaskList ? 'task-list' : undefined,
    })
  );
};

// <a> — if the sole child is an <img>, treat the whole thing as an ImageCard
// so clicking the image opens the lightbox rather than navigating.
const processLinkElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const children = Array.from(element.childNodes).filter(
    (n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent?.trim())
  );
  if (children.length === 1 && (children[0] as Element).tagName?.toLowerCase() === 'img') {
    const img = children[0] as Element;
    elements.push(React.createElement(ImageCard, {
      key,
      src:   img.getAttribute('src')   || '',
      alt:   img.getAttribute('alt')   || 'Image',
      title: img.getAttribute('title') || undefined,
    }));
    return;
  }
  elements.push(
    React.createElement('a', {
      key,
      href: element.getAttribute('href') || '#',
      target: '_blank',
      rel: 'noopener noreferrer',
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    })
  );
};

// Standalone <img> → ImageCard with lightbox
const processImageElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(React.createElement(ImageCard, {
    key,
    src:   element.getAttribute('src')   || '',
    alt:   element.getAttribute('alt')   || 'Image',
    title: element.getAttribute('title') || undefined,
  }));
};

const processBlockquoteElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement('blockquote', {
      key,
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    })
  );
};

// <table> → TableWithControls (sortable, filterable, fullscreen modal)
// The table HTML is re-serialised from DOM to string here, so one sanitize
// pass is appropriate before handing it off to the table component.
const processTableElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const tableHtml = sanitizeHtml(element.outerHTML);
  elements.push(
    React.createElement(
      TableContext.Consumer,
      { key },
      ({ onTableClick, isDark }: { onTableClick?: (html: string) => void; isDark: boolean }) =>
        React.createElement(TableWithControls, {
          tableHtml,
          isDark,
          onFullscreen: (html: string) => onTableClick?.(sanitizeHtml(html)),
        })
    )
  );
};

// Generic inline wrapper for strong / em / u / del / sub / sup
const processInlineElement = (tag: string, element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement(tag, {
      key,
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    })
  );
};

// <details><summary> — content inside is recursively parsed so nested custom
// blocks (tables, code blocks) work correctly inside accordions.
const processDetailsElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const summary     = element.querySelector('summary');
  const summaryText = summary?.textContent || 'Подробности';
  const contentHTML = summary ? element.innerHTML.replace(summary.outerHTML, '') : element.innerHTML;
  const contentElements = parseHtmlToReact(contentHTML);
  elements.push(
    React.createElement(
      'details',
      { key, open: element.hasAttribute('open'), className: 'my-4' },
      React.createElement('summary', null, summaryText),
      React.createElement('div', { className: 'details-content pt-2 pb-3' }, ...contentElements)
    )
  );
};

// .custom-alert[data-alert-type] → Alert component
// Generated by preprocessMarkdownExtensions from :::note / :::tip / etc.
const processAlertElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const alertType = element.dataset.alertType as 'note' | 'tip' | 'important' | 'warning' | 'caution';
  if (!alertType) return;
  const contentElements = parseHtmlToReact(element.innerHTML);
  elements.push(React.createElement(Alert, { key, type: alertType }, ...contentElements));
};

// .custom-card → Card (with optional color, title, icon from data attributes)
const processCardElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const contentElements = parseHtmlToReact(element.innerHTML);
  elements.push(
    React.createElement(
      CardWithContext,
      { key, color: element.dataset.color, title: element.dataset.title, icon: element.dataset.icon },
      ...contentElements
    )
  );
};

// .custom-cardgrid → CardGrid wrapping individual Card children
const processCardGridElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const cols = Number.parseInt(element.dataset.cols || '2', 10);
  const cardElements: React.ReactNode[] = [];
  for (const [i, child] of Array.from(element.children).entries()) {
    if (child.classList.contains('custom-card')) processCardElement(child, `${key}-card-${i}`, cardElements);
  }
  elements.push(React.createElement(CardGridWithContext, { key, cols }, ...cardElements));
};

// .custom-columns → Columns layout component
const processColumnsElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const layout = (element.dataset.layout || 'equal') as ColumnsLayout;
  const colElements: React.ReactNode[] = [];
  for (const [i, col] of Array.from(element.children).entries()) {
    if (col.classList.contains('custom-col')) {
      const colContent = parseHtmlToReact(col.innerHTML);
      colElements.push(React.createElement('div', { key: `${key}-col-${i}` }, ...colContent));
    }
  }
  elements.push(React.createElement(ColumnsWithContext, { key, layout }, ...colElements));
};

// .custom-steps → Stepper component
// Each .custom-step child carries title/status/color via data attributes.
const processStepsElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const steps: StepData[] = [];
  for (const stepEl of Array.from(element.children)) {
    if (stepEl.classList.contains('custom-step')) {
      const contentNodes = parseHtmlToReact(stepEl.innerHTML);
      steps.push({
        title:   stepEl.dataset.title || '',
        status:  (stepEl.dataset.status || 'default') as StepStatus,
        color:   stepEl.dataset.color || undefined,
        content: React.createElement(React.Fragment, null, ...contentNodes),
      });
    }
  }
  elements.push(React.createElement(StepperWithContext, { key, steps }));
};

// [uic:component-id] inside a <p> → UIComponentViewer
// Authors embed interactive component demos in markdown using this shortcode.
// Returns true if the paragraph was consumed as a UI component.
const processUIComponent = (
  element: Element,
  key: string,
  textContent: string,
  elements: React.ReactNode[]
): boolean => {
  const match = /\[uic:([a-z-]+)\]/.exec(textContent);
  if (!match) return false;
  elements.push(
    React.createElement('div', { key, className: 'my-6' },
      React.createElement(NewUIComponentViewer, { componentId: match[1] })
    )
  );
  return true;
};

// Raw text nodes — only emitted when they contain non-whitespace content
const processTextNode = (node: ChildNode, key: string, elements: React.ReactNode[]) => {
  const text = node.textContent || '';
  if (text.trim()) elements.push(React.createElement('span', { key }, text));
};

// ─── § Figure processor ───────────────────────────────────────────────────────
//
// <figure><img><figcaption> → ImageCard with the caption as the title.
// Falls back to recursive parsing if there is no <img> inside.

const processFigureElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const img        = element.querySelector('img');
  const figcaption = element.querySelector('figcaption');

  if (img) {
    const title =
      figcaption?.textContent?.trim() ||
      img.getAttribute('title') ||
      undefined;
    elements.push(React.createElement(ImageCard, {
      key,
      src:   img.getAttribute('src')  || '',
      alt:   img.getAttribute('alt')  || 'Image',
      title,
    }));
    return;
  }

  const children = parseHtmlToReact(element.innerHTML);
  elements.push(React.createElement('figure', { key }, ...children));
};

// ─── § KaTeX processors ───────────────────────────────────────────────────────
//
// KaTeX nodes are extracted before DOMPurify runs (to prevent mangling)
// and stored in katexStore with a data-katex-idx placeholder.
// These processors restore them into the React tree using
// dangerouslySetInnerHTML — safe because the KaTeX HTML was generated by us,
// not from user input.

const processKatexBlock = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement('div', {
      key,
      className: 'katex-block not-prose',
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    })
  );
};

const processKatexInline = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement('span', {
      key,
      className: 'katex-inline',
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    })
  );
};

// ─── § Div dispatcher ─────────────────────────────────────────────────────────
//
// <div> elements are dispatched by className.
// Order matters: more specific classes should come first.
// If no class matches, child nodes are processed recursively.
//
// NOTE: diagram classes (mermaid, diagram, etc.) are intentionally absent.
//       Diagrams were removed from production and must not be added back.

const DIV_CLASS_HANDLERS: Array<[string, (el: Element, key: string, els: React.ReactNode[]) => void]> = [
  ['katex-block',     processKatexBlock],
  ['custom-alert',    processAlertElement],
  ['custom-cardgrid', processCardGridElement],
  ['custom-card',     processCardElement],
  ['custom-columns',  processColumnsElement],
  ['custom-steps',    processStepsElement],
];

const processDivElement = (
  element: Element,
  key: string,
  elements: React.ReactNode[],
  processNodes: (nodes: NodeListOf<ChildNode>, parentKey: string) => void
): void => {
  for (const [cls, handler] of DIV_CLASS_HANDLERS) {
    if (element.classList.contains(cls)) {
      handler(element, key, elements);
      return;
    }
  }
  // Unknown div — recurse into children so we don't silently drop content
  if (element.childNodes.length > 0) processNodes(element.childNodes, key);
};

// ─── § Paragraph dispatcher ───────────────────────────────────────────────────
//
// <p> elements are split into "runs" because a single markdown paragraph can
// contain a mix of text and images, e.g.:
//
//   Some intro text
//   ![image](/foo.png)
//   More text after
//
// marked() wraps all of this in one <p>. We split it into separate elements
// so each image becomes an ImageCard while the text remains a <p>.
//
// Special cases handled before splitting:
//   1. [uic:id] shortcode  → UIComponentViewer (early return)
//   2. KaTeX placeholders  → restored inline without splitting

function getImgFromLink(el: Element): Element | null {
  const nonEmpty = Array.from(el.childNodes).filter(
    (n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent?.trim())
  );
  if (nonEmpty.length === 1 && (nonEmpty[0] as Element).tagName?.toLowerCase() === 'img') {
    return nonEmpty[0] as Element;
  }
  return null;
}

function isBrOrEmpty(node: ChildNode): boolean {
  if (node.nodeType === Node.ELEMENT_NODE) {
    return (node as Element).tagName.toLowerCase() === 'br';
  }
  if (node.nodeType === Node.TEXT_NODE) {
    return !node.textContent?.trim();
  }
  return false;
}

type ParagraphRun = { type: 'img'; el: Element } | { type: 'text'; html: string };

function splitParagraphIntoRuns(element: Element): ParagraphRun[] {
  const result: ParagraphRun[] = [];
  let textBuffer = '';

  const flushText = () => {
    if (!textBuffer.trim()) { textBuffer = ''; return; }
    const tmp = document.createElement('div');
    tmp.innerHTML = textBuffer.trim();
    while (tmp.firstChild && isBrOrEmpty(tmp.firstChild)) tmp.firstChild.remove();
    while (tmp.lastChild  && isBrOrEmpty(tmp.lastChild))  tmp.lastChild.remove();
    const cleaned = tmp.innerHTML.trim();
    if (cleaned) result.push({ type: 'text', html: cleaned });
    textBuffer = '';
  };

  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el  = node as Element;
      const tag = el.tagName.toLowerCase();
      if (tag === 'img') { flushText(); result.push({ type: 'img', el }); continue; }
      if (tag === 'a') {
        const img = getImgFromLink(el);
        if (img) { flushText(); result.push({ type: 'img', el: img }); continue; }
      }
      textBuffer += el.outerHTML;
    } else if (node.nodeType === Node.TEXT_NODE) {
      textBuffer += node.textContent ?? '';
    }
  }

  flushText();
  return result;
}

const processParagraphElement = (
  element: Element,
  key: string,
  elements: React.ReactNode[],
  katexStore: Array<{ tag: 'div' | 'span'; cls: string; inner: string }>
): void => {
  // Case 1: UIComponent shortcode — consume the whole paragraph
  if (processUIComponent(element, key, element.textContent || '', elements)) return;

  const hasKatex = element.querySelector('[data-katex-idx]');
  const hasImg   = element.querySelector('img');

  // Case 2: plain paragraph — fast path
  if (!hasKatex && !hasImg) {
    elements.push(
      React.createElement('p', {
        key,
        dangerouslySetInnerHTML: { __html: element.innerHTML },
      })
    );
    return;
  }

  // Case 3: paragraph with KaTeX but no images — restore KaTeX nodes inline
  if (hasKatex && !hasImg) {
    const kids: React.ReactNode[] = [];
    Array.from(element.childNodes).forEach((child, ci) => {
      const ckey = `${key}-k${ci}`;
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? '';
        if (text) kids.push(text);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el  = child as Element;
        const idx = el.getAttribute('data-katex-idx');
        if (idx !== null) {
          const stored = katexStore[Number.parseInt(idx, 10)];
          if (stored) {
            kids.push(
              React.createElement(stored.tag, {
                key: ckey,
                className: stored.cls,
                dangerouslySetInnerHTML: { __html: stored.inner },
              })
            );
            return;
          }
        }
        kids.push(
          React.createElement('span', {
            key: ckey,
            dangerouslySetInnerHTML: { __html: el.outerHTML },
          })
        );
      }
    });
    elements.push(React.createElement('p', { key }, ...kids));
    return;
  }

  // Case 4: paragraph contains images — split into text runs and image cards
  const runs = splitParagraphIntoRuns(element);
  runs.forEach((run, i) => {
    const runKey = `${key}-r${i}`;
    if (run.type === 'img') {
      elements.push(React.createElement(ImageCard, {
        key: runKey,
        src:   run.el.getAttribute('src')   || '',
        alt:   run.el.getAttribute('alt')   || 'Image',
        title: run.el.getAttribute('title') || undefined,
      }));
    } else {
      elements.push(
        React.createElement('p', {
          key: runKey,
          dangerouslySetInnerHTML: { __html: run.html },
        })
      );
    }
  });
};

// ─── § Main element dispatcher ────────────────────────────────────────────────
//
// Routes a DOM element to the appropriate processor by tagName.
// <div> and <p> are handled by their own dispatchers above.
// Unknown tags with child content are recursed into (no silent drops).

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const INLINE_TAGS  = new Set(['strong', 'em', 'u', 'del', 'sub', 'sup']);

const processElement = (
  element: Element,
  tagName: string,
  key: string,
  elements: React.ReactNode[],
  processNodes: (nodes: NodeListOf<ChildNode>, parentKey: string) => void
) => {
  if (HEADING_TAGS.has(tagName)) { processHeadingElement(element, tagName, key, elements); return; }
  if (INLINE_TAGS.has(tagName))  { processInlineElement(tagName, element, key, elements); return; }

  switch (tagName) {
    case 'pre':        return processPreElement(element, key, elements);
    case 'code':       return processCodeElement(element, key, elements);
    case 'ul':
    case 'ol':         return processListElement(element, tagName, key, elements);
    case 'a':          return processLinkElement(element, key, elements);
    case 'img':        return processImageElement(element, key, elements);
    case 'figure':     return processFigureElement(element, key, elements);
    case 'blockquote': return processBlockquoteElement(element, key, elements);
    case 'table':      return processTableElement(element, key, elements);
    case 'hr':         elements.push(React.createElement('hr', { key })); return;
    case 'details':    return processDetailsElement(element, key, elements);
    default:
      if (element.childNodes.length > 0) processNodes(element.childNodes, key);
  }
};

// ─── § Public API ─────────────────────────────────────────────────────────────
//
// parseHtmlToReact(html) — the sole public export.
//
// Full pipeline:
//   1. Parse html string into a raw DOM document
//   2. Extract KaTeX nodes before DOMPurify (stored in katexStore with
//      data-katex-idx placeholders so DOMPurify can't mangle them)
//   3. Single DOMPurify.sanitize() pass on the entire document
//   4. Walk the sanitized DOM, dispatching each node to its processor
//   5. Return the flat array of React nodes
//
// The resulting array is spread into a <div data-article-content> in DocContent.

export const parseHtmlToReact = (html: string): React.ReactNode[] => {
  const rawDoc = new DOMParser().parseFromString(html, 'text/html');

  // Step 1: protect KaTeX nodes from DOMPurify mangling.
  // DOMPurify strips SVG attributes and MathML elements that KaTeX needs.
  // We replace them with placeholder <div data-katex-idx="N"> before sanitizing
  // and restore them in processParagraphElement / processKatexBlock.
  const katexStore: Array<{ tag: 'div' | 'span'; cls: string; inner: string }> = [];

  rawDoc.querySelectorAll('div.katex-block, span.katex-inline').forEach((el) => {
    const tag = el.tagName.toLowerCase() as 'div' | 'span';
    const cls = el.className;
    const inner = el.innerHTML;
    const idx = katexStore.push({ tag, cls, inner }) - 1;
    const placeholder = rawDoc.createElement(tag);
    placeholder.setAttribute('data-katex-idx', String(idx));
    el.replaceWith(placeholder);
  });

  // Step 2: single DOMPurify sanitize — all processors below work with this DOM
  const sanitized = DOMPurify.sanitize(rawDoc.body.innerHTML, {
    ALLOWED_TAGS: [...SANITIZE_TAGS],
    ALLOWED_ATTR: [...SANITIZE_ATTR],
    ADD_ATTR: ['data-katex-idx'],
    ALLOW_DATA_ATTR: true,
    FORCE_BODY: false,
  });

  const doc      = new DOMParser().parseFromString(sanitized, 'text/html');
  const elements: React.ReactNode[] = [];

  // Step 3: walk and dispatch
  const processNodes = (nodes: NodeListOf<ChildNode>, parentKey = '') => {
    Array.from(nodes).forEach((node, index) => {
      const key = `${parentKey}-${index}`;

      if (node.nodeType === Node.TEXT_NODE)    { processTextNode(node, key, elements); return; }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      // Restore KaTeX placeholder before any other processing
      const katexIdx = element.getAttribute('data-katex-idx');
      if (katexIdx !== null) {
        const stored = katexStore[Number.parseInt(katexIdx, 10)];
        if (stored) {
          elements.push(
            React.createElement(stored.tag, {
              key,
              className: stored.cls,
              dangerouslySetInnerHTML: { __html: stored.inner },
            })
          );
          return;
        }
      }

      if (tagName === 'div') { processDivElement(element, key, elements, processNodes); return; }
      if (tagName === 'p')   { processParagraphElement(element, key, elements, katexStore); return; }

      processElement(element, tagName, key, elements, processNodes);
    });
  };

  processNodes(doc.body.childNodes);
  return elements;
};