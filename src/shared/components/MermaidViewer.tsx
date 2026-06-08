import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { Maximize2, Minus, Move, Plus, RefreshCcw } from 'lucide-react';
import { makeTokens } from '@/shared/tokens/theme';

interface MermaidViewerProps {
  readonly chart: string;
  readonly isDark: boolean;
}

type ViewState = {
  scale: number;
  x: number;
  y: number;
};

type PointerPoint = {
  x: number;
  y: number;
};

type DiagramTheme = ReturnType<typeof makeDiagramTheme>;

type FlowNode = {
  id: string;
  label: string;
  shape: 'rect' | 'round' | 'stadium' | 'diamond';
};

type FlowEdge = {
  from: string;
  to: string;
  label?: string;
};

type SequenceMessage = {
  from: string;
  to: string;
  text: string;
  dashed: boolean;
};

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const SCALE_STEP = 0.2;
const SANITIZE_SVG_TAGS = [
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'text', 'tspan', 'defs', 'marker', 'pattern', 'clipPath', 'mask', 'style', 'title', 'desc',
];
const SANITIZE_SVG_ATTR = [
  'id', 'class', 'style', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'cx', 'cy', 'r', 'rx', 'ry',
  'd', 'points', 'width', 'height', 'viewBox', 'transform', 'fill', 'stroke', 'stroke-width',
  'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'marker-end', 'marker-start',
  'marker-mid', 'orient', 'refX', 'refY', 'markerWidth', 'markerHeight', 'text-anchor',
  'dominant-baseline', 'font-size', 'font-family', 'font-weight', 'xmlns', 'role', 'aria-label',
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function escapeSvg(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function makeDiagramTheme(isDark: boolean) {
  const t = makeTokens(isDark);
  return {
    bg: t.codeBg,
    nodeBg: t.surface,
    nodeBgAlt: t.surfaceHov,
    nodeBorder: t.borderStrong,
    clusterBg: t.accentSoft,
    text: t.fg,
    muted: t.fgMuted,
    edge: t.fgMuted,
    labelBg: t.bg,
    accent: isDark ? '#8b5cf6' : '#6d28d9',
  };
}

function splitLabel(label: string, maxChars = 18): string[] {
  const words = label.replaceAll(/<br\s*\/?>/gi, ' ').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) { current = word; continue; }
    if (`${current} ${word}`.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current += ` ${word}`;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines.slice(0, 4) : [''];
}

function renderText(label: string, x: number, y: number, color: string, size = 14, weight = 600): string {
  const lines = splitLabel(label);
  const startY = y - ((lines.length - 1) * 9);
  const tspans = lines.map((line, index) => (
    `<tspan x="${x}" y="${startY + index * 18}">${escapeSvg(line)}</tspan>`
  )).join('');

  return `<text text-anchor="middle" dominant-baseline="middle" font-size="${size}" font-weight="${weight}" fill="${color}" font-family="Inter, system-ui, sans-serif">${tspans}</text>`;
}

function cleanLabel(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  return raw.trim()
    .replace(/^\[|\]$/g, '')
    .replace(/^\(|\)$/g, '')
    .replace(/^\{|\}$/g, '')
    .replace(/^"|"$/g, '')
    .trim() || fallback;
}

function parseNodeToken(token: string): FlowNode {
  const id = token.match(/^([A-Za-zА-Яа-я0-9_-]+)/)?.[1] ?? token.trim();
  const rawShape = token.slice(id.length).trim();

  if (rawShape.startsWith('([') && rawShape.endsWith('])')) {
    return { id, label: cleanLabel(rawShape.slice(2, -2), id), shape: 'stadium' };
  }
  if (rawShape.startsWith('((') && rawShape.endsWith('))')) {
    return { id, label: cleanLabel(rawShape.slice(2, -2), id), shape: 'round' };
  }
  if (rawShape.startsWith('{') && rawShape.endsWith('}')) {
    return { id, label: cleanLabel(rawShape.slice(1, -1), id), shape: 'diamond' };
  }
  if (rawShape.startsWith('[') && rawShape.endsWith(']')) {
    return { id, label: cleanLabel(rawShape.slice(1, -1), id), shape: 'rect' };
  }
  if (rawShape.startsWith('(') && rawShape.endsWith(')')) {
    return { id, label: cleanLabel(rawShape.slice(1, -1), id), shape: 'round' };
  }

  return { id, label: id, shape: 'rect' };
}

function parseFlowchart(chart: string): { direction: 'TD' | 'LR'; nodes: FlowNode[]; edges: FlowEdge[] } {
  const lines = chart.split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('%%'));
  const first = lines[0] ?? '';
  const direction = /\b(LR|RL)\b/i.test(first) ? 'LR' : 'TD';
  const nodes = new Map<string, FlowNode>();
  const edges: FlowEdge[] = [];

  for (const line of lines.slice(1)) {
    const edgeMatch = line.match(/^(.*?)\s*(?:--\s*([^>-]+?)\s*)?-{1,2}>\s*(.*?)\s*;?$/);
    if (!edgeMatch) {
      const node = parseNodeToken(line.replace(/;$/, ''));
      nodes.set(node.id, { ...nodes.get(node.id), ...node });
      continue;
    }

    const from = parseNodeToken(edgeMatch[1].trim());
    const to = parseNodeToken(edgeMatch[3].trim());
    nodes.set(from.id, { ...nodes.get(from.id), ...from });
    nodes.set(to.id, { ...nodes.get(to.id), ...to });
    edges.push({ from: from.id, to: to.id, label: edgeMatch[2]?.trim() });
  }

  return { direction, nodes: Array.from(nodes.values()), edges };
}

function layoutFlow(nodes: FlowNode[], edges: FlowEdge[], direction: 'TD' | 'LR') {
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();

  for (const edge of edges) {
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge.to]);
  }

  const levels = new Map<string, number>();
  const queue = nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0).map((node) => node.id);
  if (!queue.length && nodes[0]) queue.push(nodes[0].id);
  queue.forEach((id) => levels.set(id, 0));

  while (queue.length) {
    const id = queue.shift()!;
    const nextLevel = (levels.get(id) ?? 0) + 1;
    for (const next of outgoing.get(id) ?? []) {
      if ((levels.get(next) ?? -1) < nextLevel) levels.set(next, nextLevel);
      queue.push(next);
    }
  }

  for (const node of nodes) {
    if (!levels.has(node.id)) levels.set(node.id, Math.max(0, levels.size));
  }

  const byLevel = new Map<number, FlowNode[]>();
  for (const node of nodes) {
    const level = levels.get(node.id) ?? 0;
    byLevel.set(level, [...(byLevel.get(level) ?? []), node]);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const nodeW = 188;
  const nodeH = 72;
  const gapX = direction === 'LR' ? 110 : 64;
  const gapY = direction === 'LR' ? 58 : 96;
  const maxLevelSize = Math.max(1, ...Array.from(byLevel.values()).map((items) => items.length));
  const levelCount = Math.max(1, ...Array.from(byLevel.keys())) + 1;
  const width = direction === 'LR'
    ? 80 + levelCount * nodeW + (levelCount - 1) * gapX
    : Math.max(520, 80 + maxLevelSize * nodeW + (maxLevelSize - 1) * gapX);
  const height = direction === 'LR'
    ? Math.max(320, 80 + maxLevelSize * nodeH + (maxLevelSize - 1) * gapY)
    : 80 + levelCount * nodeH + (levelCount - 1) * gapY;

  for (const [level, items] of byLevel.entries()) {
    items.forEach((node, index) => {
      if (direction === 'LR') {
        const totalH = items.length * nodeH + (items.length - 1) * gapY;
        positions.set(node.id, { x: 40 + nodeW / 2 + level * (nodeW + gapX), y: height / 2 - totalH / 2 + nodeH / 2 + index * (nodeH + gapY) });
      } else {
        const totalW = items.length * nodeW + (items.length - 1) * gapX;
        positions.set(node.id, { x: width / 2 - totalW / 2 + nodeW / 2 + index * (nodeW + gapX), y: 40 + nodeH / 2 + level * (nodeH + gapY) });
      }
    });
  }

  return { positions, width, height, nodeW, nodeH };
}

function renderFlowchart(chart: string, theme: DiagramTheme): string {
  const { direction, nodes, edges } = parseFlowchart(chart);
  const { positions, width, height, nodeW, nodeH } = layoutFlow(nodes, edges, direction);
  const markerId = `arrow-${Math.random().toString(36).slice(2)}`;

  const edgeSvg = edges.map((edge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) return '';

    const startX = direction === 'LR' ? from.x + nodeW / 2 : from.x;
    const startY = direction === 'LR' ? from.y : from.y + nodeH / 2;
    const endX = direction === 'LR' ? to.x - nodeW / 2 : to.x;
    const endY = direction === 'LR' ? to.y : to.y - nodeH / 2;
    const c1x = direction === 'LR' ? startX + 52 : startX;
    const c1y = direction === 'LR' ? startY : startY + 52;
    const c2x = direction === 'LR' ? endX - 52 : endX;
    const c2y = direction === 'LR' ? endY : endY - 52;
    const labelX = (startX + endX) / 2;
    const labelY = (startY + endY) / 2 - 8;

    return `<path d="M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}" fill="none" stroke="${theme.edge}" stroke-width="2" marker-end="url(#${markerId})"/>${edge.label ? `<rect x="${labelX - 36}" y="${labelY - 13}" width="72" height="22" rx="11" fill="${theme.labelBg}" stroke="${theme.nodeBorder}" stroke-width="1"/><text x="${labelX}" y="${labelY + 1}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="${theme.muted}" font-family="Inter, system-ui, sans-serif">${escapeSvg(edge.label)}</text>` : ''}`;
  }).join('');

  const nodeSvg = nodes.map((node) => {
    const pos = positions.get(node.id);
    if (!pos) return '';
    const x = pos.x - nodeW / 2;
    const y = pos.y - nodeH / 2;

    if (node.shape === 'diamond') {
      const points = `${pos.x},${y} ${x + nodeW},${pos.y} ${pos.x},${y + nodeH} ${x},${pos.y}`;
      return `<polygon points="${points}" fill="${theme.nodeBgAlt}" stroke="${theme.accent}" stroke-width="2"/>${renderText(node.label, pos.x, pos.y, theme.text, 13, 700)}`;
    }

    const radius = node.shape === 'rect' ? 14 : 36;
    const stroke = node.shape === 'stadium' ? theme.accent : theme.nodeBorder;
    return `<rect x="${x}" y="${y}" width="${nodeW}" height="${nodeH}" rx="${radius}" fill="${theme.nodeBg}" stroke="${stroke}" stroke-width="2"/>${renderText(node.label, pos.x, pos.y, theme.text)}`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Mermaid flowchart"><defs><marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${theme.edge}"/></marker></defs><rect width="100%" height="100%" rx="18" fill="${theme.bg}"/>${edgeSvg}${nodeSvg}</svg>`;
}

function parseSequence(chart: string) {
  const participants = new Map<string, string>();
  const messages: SequenceMessage[] = [];

  for (const rawLine of chart.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('sequenceDiagram') || line.startsWith('%%')) continue;

    const participantMatch = line.match(/^participant\s+(\S+)(?:\s+as\s+(.+))?$/i);
    if (participantMatch) {
      participants.set(participantMatch[1], cleanLabel(participantMatch[2], participantMatch[1]));
      continue;
    }

    const messageMatch = line.match(/^(\S+)\s*(-{1,2}>>|-->>|->>)\s*(\S+)\s*:\s*(.+)$/);
    if (messageMatch) {
      const from = messageMatch[1];
      const to = messageMatch[3];
      if (!participants.has(from)) participants.set(from, from);
      if (!participants.has(to)) participants.set(to, to);
      messages.push({ from, to, text: messageMatch[4].trim(), dashed: messageMatch[2].startsWith('--') });
    }
  }

  return { participants: Array.from(participants.entries()), messages };
}

function renderSequence(chart: string, theme: DiagramTheme): string {
  const { participants, messages } = parseSequence(chart);
  const count = Math.max(1, participants.length);
  const laneGap = 190;
  const top = 62;
  const messageGap = 74;
  const width = Math.max(520, 80 + (count - 1) * laneGap + 180);
  const height = 130 + Math.max(1, messages.length) * messageGap;
  const markerId = `seq-arrow-${Math.random().toString(36).slice(2)}`;
  const xFor = new Map(participants.map(([id], index) => [id, 90 + index * laneGap]));

  const participantSvg = participants.map(([id, label]) => {
    const x = xFor.get(id) ?? 90;
    return `<rect x="${x - 70}" y="24" width="140" height="44" rx="14" fill="${theme.nodeBg}" stroke="${theme.nodeBorder}" stroke-width="2"/>${renderText(label, x, 46, theme.text, 13, 700)}<line x1="${x}" y1="68" x2="${x}" y2="${height - 34}" stroke="${theme.nodeBorder}" stroke-width="1.5" stroke-dasharray="6 8"/>`;
  }).join('');

  const messageSvg = messages.map((message, index) => {
    const y = top + 48 + index * messageGap;
    const fromX = xFor.get(message.from) ?? 90;
    const toX = xFor.get(message.to) ?? fromX + laneGap;
    const labelX = (fromX + toX) / 2;
    const dash = message.dashed ? 'stroke-dasharray="7 7"' : '';
    return `<line x1="${fromX}" y1="${y}" x2="${toX}" y2="${y}" stroke="${theme.edge}" stroke-width="2" ${dash} marker-end="url(#${markerId})"/><rect x="${labelX - 76}" y="${y - 32}" width="152" height="24" rx="12" fill="${theme.labelBg}" stroke="${theme.nodeBorder}" stroke-width="1"/>${renderText(message.text, labelX, y - 20, theme.text, 12, 600)}`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Mermaid sequence diagram"><defs><marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${theme.edge}"/></marker></defs><rect width="100%" height="100%" rx="18" fill="${theme.bg}"/>${participantSvg}${messageSvg}</svg>`;
}

function renderLocalMermaid(chart: string, isDark: boolean): string {
  const theme = makeDiagramTheme(isDark);
  const firstLine = chart.trim().split('\n')[0]?.trim().toLowerCase() ?? '';

  if (firstLine.startsWith('sequencediagram')) return renderSequence(chart, theme);
  if (firstLine.startsWith('flowchart') || firstLine.startsWith('graph')) return renderFlowchart(chart, theme);

  throw new Error('Локальный Mermaid viewer сейчас поддерживает flowchart/graph и sequenceDiagram.');
}

function prepareSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: SANITIZE_SVG_TAGS,
    ADD_ATTR: SANITIZE_SVG_ATTR,
  });
}

function getDistance(a: PointerPoint, b: PointerPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getMidpoint(a: PointerPoint, b: PointerPoint): PointerPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function toLocalPoint(target: HTMLElement, event: React.PointerEvent<HTMLDivElement>): PointerPoint {
  const rect = target.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

const MermaidViewer: React.FC<MermaidViewerProps> = ({ chart, isDark }) => {
  const t = useMemo(() => makeTokens(isDark), [isDark]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef(new Map<number, PointerPoint>());
  const dragRef = useRef<{ pointerId: number; start: PointerPoint; origin: ViewState } | null>(null);
  const pinchRef = useRef<{ distance: number; midpoint: PointerPoint; origin: ViewState } | null>(null);
  const [view, setView] = useState<ViewState>({ scale: 1, x: 0, y: 0 });
  const [svg, setSvg] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const styles = useMemo(() => ({
    wrapBg: t.bg,
    panelBg: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.42)',
    border: t.border,
    text: t.fg,
    muted: t.fgMuted,
    buttonBg: t.surface,
    codeBg: t.codeBg,
  }), [isDark, t]);

  useEffect(() => {
    try {
      setStatus('loading');
      setErrorMessage('');
      setSvg(prepareSvg(renderLocalMermaid(chart.trim(), isDark)));
      setView({ scale: 1, x: 0, y: 0 });
      setStatus('ready');
    } catch (error: unknown) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Не удалось отрисовать Mermaid-схему');
    }
  }, [chart, isDark]);

  const zoomAt = useCallback((nextScale: number, clientX?: number, clientY?: number) => {
    const viewport = viewportRef.current;
    const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);

    setView((current) => {
      if (!viewport || clientX === undefined || clientY === undefined) {
        return { ...current, scale: clampedScale };
      }

      const rect = viewport.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const ratio = clampedScale / current.scale;

      return {
        scale: clampedScale,
        x: localX - (localX - current.x) * ratio,
        y: localY - (localY - current.y) * ratio,
      };
    });
  }, []);

  const resetView = useCallback(() => {
    setView({ scale: 1, x: 0, y: 0 });
  }, []);

  const fitToScreen = useCallback(() => {
    const viewport = viewportRef.current;
    const svgElement = viewport?.querySelector('svg');
    if (!viewport || !svgElement) { resetView(); return; }

    const viewportRect = viewport.getBoundingClientRect();
    const svgBox = svgElement.getBBox?.();
    const svgWidth = svgBox?.width || svgElement.clientWidth || 1;
    const svgHeight = svgBox?.height || svgElement.clientHeight || 1;
    const scale = clamp(Math.min((viewportRect.width - 48) / svgWidth, (viewportRect.height - 48) / svgHeight), MIN_SCALE, MAX_SCALE);

    setView({
      scale,
      x: Math.max(24, (viewportRect.width - svgWidth * scale) / 2),
      y: Math.max(24, (viewportRect.height - svgHeight * scale) / 2),
    });
  }, [resetView]);

  const handleWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
    zoomAt(view.scale + delta, event.clientX, event.clientY);
  }, [view.scale, zoomAt]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    const point = toLocalPoint(target, event);
    pointersRef.current.set(event.pointerId, point);

    if (pointersRef.current.size === 1) {
      dragRef.current = { pointerId: event.pointerId, start: point, origin: view };
      pinchRef.current = null;
      return;
    }

    const points = Array.from(pointersRef.current.values());
    if (points.length >= 2) {
      dragRef.current = null;
      pinchRef.current = {
        distance: getDistance(points[0], points[1]),
        midpoint: getMidpoint(points[0], points[1]),
        origin: view,
      };
    }
  }, [view]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, toLocalPoint(event.currentTarget, event));

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const points = Array.from(pointersRef.current.values());
      const distance = getDistance(points[0], points[1]);
      const midpoint = getMidpoint(points[0], points[1]);
      const nextScale = clamp(pinchRef.current.origin.scale * (distance / Math.max(1, pinchRef.current.distance)), MIN_SCALE, MAX_SCALE);
      const ratio = nextScale / pinchRef.current.origin.scale;

      setView({
        scale: nextScale,
        x: midpoint.x - (pinchRef.current.midpoint.x - pinchRef.current.origin.x) * ratio,
        y: midpoint.y - (pinchRef.current.midpoint.y - pinchRef.current.origin.y) * ratio,
      });
      return;
    }

    if (dragRef.current?.pointerId === event.pointerId) {
      const point = toLocalPoint(event.currentTarget, event);
      setView({
        scale: dragRef.current.origin.scale,
        x: dragRef.current.origin.x + point.x - dragRef.current.start.x,
        y: dragRef.current.origin.y + point.y - dragRef.current.start.y,
      });
    }
  }, []);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    dragRef.current = null;
    pinchRef.current = null;

    const remaining = Array.from(pointersRef.current.entries());
    if (remaining.length === 1) {
      const [pointerId, point] = remaining[0];
      dragRef.current = { pointerId, start: point, origin: view };
    }
  }, [view]);

  return (
    <div
      className="not-prose my-6 overflow-hidden rounded-2xl"
      style={{
        background: styles.wrapBg,
        border: `1px solid ${styles.border}`,
        boxShadow: isDark
          ? '0 18px 50px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.04)'
          : '0 14px 34px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.65)',
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          padding: '10px 12px', borderBottom: `1px solid ${styles.border}`, color: styles.text,
          background: styles.panelBg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Move size={16} style={{ color: styles.muted, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Mermaid-схема</span>
          <span style={{ fontSize: 12, color: styles.muted, whiteSpace: 'nowrap' }}>
            {Math.round(view.scale * 100)}%
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button type="button" onClick={() => zoomAt(view.scale - SCALE_STEP)} aria-label="Уменьшить схему" style={buttonStyle(styles)}>
            <Minus size={15} />
          </button>
          <button type="button" onClick={() => zoomAt(view.scale + SCALE_STEP)} aria-label="Увеличить схему" style={buttonStyle(styles)}>
            <Plus size={15} />
          </button>
          <button type="button" onClick={fitToScreen} aria-label="Вписать схему" style={buttonStyle(styles)}>
            <Maximize2 size={15} />
          </button>
          <button type="button" onClick={resetView} aria-label="Сбросить масштаб" style={buttonStyle(styles)}>
            <RefreshCcw size={15} />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'relative', minHeight: 360, maxHeight: 'min(72vh, 760px)', overflow: 'hidden',
          touchAction: 'none', cursor: status === 'ready' ? 'grab' : 'default', background: styles.codeBg,
        }}
      >
        {status === 'loading' && (
          <div style={centerStyle(styles)}>
            <div style={{ fontWeight: 700 }}>Рендерим Mermaid…</div>
            <div style={{ marginTop: 6, fontSize: 13, color: styles.muted }}>Схема будет доступна для зума и перемещения.</div>
          </div>
        )}

        {status === 'error' && (
          <div style={{ ...centerStyle(styles), alignItems: 'stretch', textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: styles.text }}>Не удалось отрисовать Mermaid-схему</div>
            <div style={{ marginTop: 6, color: styles.muted }}>{errorMessage}</div>
            <pre style={{
              marginTop: 14, maxHeight: 220, overflow: 'auto', padding: 12, borderRadius: 12,
              background: styles.wrapBg, border: `1px solid ${styles.border}`, color: styles.text,
              whiteSpace: 'pre-wrap', fontSize: 12,
            }}>{chart}</pre>
          </div>
        )}

        {status === 'ready' && (
          <div
            style={{
              position: 'absolute', left: 0, top: 0, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
              transformOrigin: '0 0', padding: 24, minWidth: 'max-content', minHeight: 'max-content',
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>

      <div style={{
        padding: '8px 12px', borderTop: `1px solid ${styles.border}`, color: styles.muted,
        fontSize: 12, background: styles.panelBg,
      }}>
        Всё рендерится локально: без CDN, облачных API и внешних запросов. Перетаскивайте схему мышью/пальцем, крутите колесо для масштаба или используйте pinch-to-zoom.
      </div>
    </div>
  );
};

function buttonStyle(styles: { buttonBg: string; border: string; text: string }): React.CSSProperties {
  return {
    width: 30,
    height: 30,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    border: `1px solid ${styles.border}`,
    background: styles.buttonBg,
    color: styles.text,
    cursor: 'pointer',
  };
}

function centerStyle(styles: { text: string; muted: string }): React.CSSProperties {
  return {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    textAlign: 'center',
    color: styles.text,
  };
}

export default MermaidViewer;
