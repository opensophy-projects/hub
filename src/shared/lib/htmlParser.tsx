import React, { createContext, lazy, Suspense } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { CodeBlock } from '../components/CodeBlock';
import type { CodeTab } from '../components/CodeBlock';
import TableWithControls from '@/features/table/components/TableWithControls';
import Alert from '../components/Alert';
import NewUIComponentViewer from '@/features/ui-components/NewUIComponentViewer';
import ImageCard from '../components/ImageCard';
import { CardWithContext, CardGridWithContext } from '../components/Card';
import { ColumnsWithContext } from '../components/Columns';
import { StepperWithContext } from '../components/Stepper';
import type { StepData, StepStatus } from '../components/Stepper';
import type { ColumnsLayout } from '../components/Columns';

const LazyChartBlock = lazy(() => import('../components/ChartBlock'));

export const TableContext = createContext<{
  onTableClick?: (tableHtml: string) => void;
  isDark: boolean;
}>({ isDark: false });

export const SANITIZE_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'br', 'strong', 'em', 'u', 'a',
  'ul', 'ol', 'li', 'blockquote', 'code',
  'pre', 'img', 'table', 'tr', 'td', 'th',
  'thead', 'tbody', 'div', 'span', 'hr', 'figure', 'figcaption',
  'del', 'input', 'sub', 'sup', 'details', 'summary', 'mark',
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
  'data-color', 'data-icon', 'data-image',
  'data-chart', 'data-colors', 'data-type',
  'data-tabs',
  'type', 'checked', 'disabled', 'open', 'style', 'align',
  'xmlns', 'viewBox', 'd', 'fill', 'stroke', 'stroke-width',
  'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
  'cx', 'cy', 'r', 'transform', 'clip-path', 'clip-rule',
  'fill-rule', 'stroke-linecap', 'stroke-linejoin',
  'mathvariant', 'mathsize', 'stretchy', 'fence', 'separator',
  'lspace', 'rspace', 'minsize', 'maxsize', 'columnalign',
  'rowspacing', 'columnspacing', 'href', 'aria-hidden',
];

const sanitizeHtml = (html: string): string =>
  DOMPurify.sanitize(html, { ALLOWED_TAGS: SANITIZE_TAGS, ALLOWED_ATTR: SANITIZE_ATTR, ALLOW_DATA_ATTR: true });

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '');
}

const TAG_STYLES: Record<number, React.CSSProperties> = {
  1: { fontSize: 'clamp(1.4rem,3vw,2.25rem)',    fontWeight: 700, marginTop: '2rem',    marginBottom: '1rem',    lineHeight: 1.2,  scrollMarginTop: '5rem' },
  2: { fontSize: 'clamp(1.2rem,2.5vw,1.875rem)', fontWeight: 700, marginTop: '2rem',    marginBottom: '1rem',    lineHeight: 1.25, scrollMarginTop: '5rem' },
  3: { fontSize: 'clamp(1.05rem,2vw,1.5rem)',    fontWeight: 700, marginTop: '1.5rem',  marginBottom: '0.75rem', lineHeight: 1.3,  scrollMarginTop: '5rem' },
  4: { fontSize: 'clamp(1rem,1.8vw,1.25rem)',    fontWeight: 700, marginTop: '1.5rem',  marginBottom: '0.75rem',                   scrollMarginTop: '5rem' },
  5: { fontSize: '1rem',                          fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem',                    scrollMarginTop: '5rem' },
  6: { fontSize: '0.875rem',                      fontWeight: 700, marginTop: '1rem',    marginBottom: '0.5rem',  textTransform: 'uppercase', letterSpacing: '0.05em', scrollMarginTop: '5rem' },
};

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

const processHeadingElement = (element: Element, tagName: string, key: string, elements: React.ReactNode[]) => {
  const text  = element.textContent || '';
  const id    = element.id || slugifyHeading(text);
  const level = Number.parseInt(tagName[1], 10);
  const Tag = tagName as keyof JSX.IntrinsicElements;

  elements.push(
    React.createElement(Tag, {
      key,
      id,
      style: TAG_STYLES[level],
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    })
  );
};

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

function decodeDataChartAttr(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith('{') || t.startsWith('[')) return t;
  try {
    return decodeURIComponent(t);
  } catch {
    return t;
  }
}

const processChartElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const decoded = decodeDataChartAttr(element.getAttribute('data-chart'));
  if (!decoded) return;

  try {
    const parsed = JSON.parse(decoded) as {
      labels: string[];
      values: number[];
      type?: string;
      colors?: string[];
      title?: string;
    };
    elements.push(
      <Suspense key={key} fallback={<div className="text-slate-400">Загрузка графика...</div>}>
        <LazyChartBlock
          chartData={{
            labels: parsed.labels || [],
            values: parsed.values || [],
            type:   parsed.type || 'bar',
            colors: parsed.colors || undefined,
            title:  parsed.title || undefined,
          }}
        />
      </Suspense>
    );
  } catch {
    // ignore malformed chart JSON
  }
};

const parseTabTitle = (raw: string): { title: string; icon?: string; status?: string } => {
  let title = (raw || '').trim();
  let icon: string | undefined;
  let status: string | undefined;

  const statusMatch = title.match(/\[(ok|warn|danger|info)\]\s*$/i);
  if (statusMatch) {
    status = statusMatch[1].toLowerCase();
    title = title.replace(/\[(ok|warn|danger|info)\]\s*$/i, '').trim();
  }

  const iconMatch = title.match(/^\[icon:([a-z0-9-]+)\]\s*/i);
  if (iconMatch) {
    icon = iconMatch[1];
    title = title.replace(/^\[icon:[a-z0-9-]+\]\s*/i, '').trim();
  }

  return { title, icon, status };
};

const processTabsElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const rawTabs = element.getAttribute('data-tabs') || '';
  if (!rawTabs) return;

  const tabBlocks = rawTabs.split('|||').map(s => s.trim()).filter(Boolean);
  const tabs: CodeTab[] = tabBlocks.map((block, idx) => {
    const [rawTitle, ...contentParts] = block.split(':::');
    const parsed = parseTabTitle(rawTitle || `Tab ${idx + 1}`);
    return {
      title: parsed.title || `Tab ${idx + 1}`,
      icon: parsed.icon,
      status: parsed.status as StepStatus | undefined,
      code: (contentParts.join(':::') || '').trim(),
      language: element.getAttribute('data-language') || element.getAttribute('data-lang') || '',
    };
  });

  if (!tabs.length) return;
  elements.push(React.createElement(CodeBlock, { key, tabs }));
};

const processAlertElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const type = (element.getAttribute('data-alert-type') || 'info') as 'info' | 'success' | 'warning' | 'error';
  const title = element.getAttribute('data-title') || undefined;
  elements.push(
    React.createElement(Alert, {
      key,
      type,
      title,
      content: element.innerHTML,
    })
  );
};

const parseColumnsLayout = (value: string | null): ColumnsLayout | undefined => {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (v === 'equal' || v === 'sidebar-right' || v === 'sidebar-left' || v === 'golden') return v;
  return undefined;
};

const processColumnsElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const colsRaw = element.getAttribute('data-cols') || '2';
  const cols = Math.max(1, Math.min(4, Number.parseInt(colsRaw, 10) || 2));
  const layout = parseColumnsLayout(element.getAttribute('data-layout'));

  const childCards = Array.from(element.children).filter(ch => ch.tagName.toLowerCase() === 'div');
  if (childCards.length === 0) return;

  const items = childCards.map((cardEl) => ({
    title: cardEl.getAttribute('data-title') || '',
    content: cardEl.innerHTML,
    color: cardEl.getAttribute('data-color') || undefined,
    icon: cardEl.getAttribute('data-icon') || undefined,
    image: cardEl.getAttribute('data-image') || undefined,
  }));

  elements.push(
    React.createElement(ColumnsWithContext, {
      key,
      columns: cols,
      layout,
      items,
    })
  );
};

const processCardsElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const childCards = Array.from(element.children).filter(ch => ch.tagName.toLowerCase() === 'div');
  const items = childCards.map((cardEl) => ({
    title: cardEl.getAttribute('data-title') || '',
    content: cardEl.innerHTML,
    color: cardEl.getAttribute('data-color') || undefined,
    icon: cardEl.getAttribute('data-icon') || undefined,
    image: cardEl.getAttribute('data-image') || undefined,
  }));

  elements.push(
    React.createElement(CardGridWithContext, {
      key,
      items,
    })
  );
};

const processCardElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement(CardWithContext, {
      key,
      title: element.getAttribute('data-title') || '',
      color: element.getAttribute('data-color') || undefined,
      icon: element.getAttribute('data-icon') || undefined,
      image: element.getAttribute('data-image') || undefined,
      content: element.innerHTML,
    })
  );
};

const normalizeStatus = (raw: string | null): StepStatus => {
  const v = (raw || '').trim().toLowerCase();
  if (v === 'done' || v === 'active' || v === 'pending' || v === 'error') return v;
  return 'pending';
};

const processStepperElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const stepNodes = Array.from(element.children).filter(ch => ch.tagName.toLowerCase() === 'div');
  const steps: StepData[] = stepNodes.map((stepEl, idx) => ({
    title: stepEl.getAttribute('data-title') || `Шаг ${idx + 1}`,
    content: stepEl.innerHTML,
    status: normalizeStatus(stepEl.getAttribute('data-status')),
  }));

  if (!steps.length) return;
  elements.push(React.createElement(StepperWithContext, { key, steps }));
};

const processNewUIComponentElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const componentName = element.getAttribute('data-component');
  if (!componentName) return;
  elements.push(
    React.createElement(NewUIComponentViewer, {
      key,
      componentName,
      props: element.getAttribute('data-props') || undefined,
    })
  );
};

const processKatexBlock = (element: Element, key: string, elements: React.ReactNode[]) => {
  elements.push(
    React.createElement('div', {
      key,
      className: 'katex-block my-4 overflow-x-auto',
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

const processElement = (element: Element, key: string, elements: React.ReactNode[]) => {
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'pre') return processPreElement(element, key, elements);
  if (tagName === 'code') return processCodeElement(element, key, elements);
  if (/^h[1-6]$/.test(tagName)) return processHeadingElement(element, tagName, key, elements);
  if (tagName === 'ul' || tagName === 'ol') return processListElement(element, tagName, key, elements);
  if (tagName === 'a') return processLinkElement(element, key, elements);
  if (tagName === 'img') return processImageElement(element, key, elements);
  if (tagName === 'blockquote') return processBlockquoteElement(element, key, elements);
  if (tagName === 'table') return processTableElement(element, key, elements);

  if (tagName === 'div' && element.hasAttribute('data-chart')) return processChartElement(element, key, elements);
  if (tagName === 'div' && element.hasAttribute('data-tabs')) return processTabsElement(element, key, elements);
  if (tagName === 'div' && element.hasAttribute('data-alert-type')) return processAlertElement(element, key, elements);
  if (tagName === 'div' && element.hasAttribute('data-cols')) return processColumnsElement(element, key, elements);
  if (tagName === 'div' && element.classList.contains('cards-grid')) return processCardsElement(element, key, elements);
  if (tagName === 'div' && element.classList.contains('card-item')) return processCardElement(element, key, elements);
  if (tagName === 'div' && element.classList.contains('stepper')) return processStepperElement(element, key, elements);
  if (tagName === 'div' && element.hasAttribute('data-component')) return processNewUIComponentElement(element, key, elements);
  if (tagName === 'div' && element.classList.contains('katex-display')) return processKatexBlock(element, key, elements);
  if (tagName === 'span' && element.classList.contains('katex')) return processKatexInline(element, key, elements);

  elements.push(
    React.createElement(tagName, {
      key,
      dangerouslySetInnerHTML: { __html: element.innerHTML },
    })
  );
};

const parseHtmlToReact = (html: string): React.ReactNode[] => {
  if (!html) return [];
  const safeHtml = sanitizeHtml(html);
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${safeHtml}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return [];

  const elements: React.ReactNode[] = [];
  Array.from(root.children).forEach((el, index) => {
    processElement(el, `el-${index}`, elements);
  });

  return elements;
};

export function renderMarkdownHtml(html: string): React.ReactNode[] {
  return parseHtmlToReact(html);
}