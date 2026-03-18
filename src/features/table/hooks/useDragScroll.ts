import { useRef, useState, useCallback } from 'react';

const DRAG_THRESHOLD = 5;

/**
 * Хук для drag-scroll контейнера.
 * - До порога DRAG_THRESHOLD px — обычный клик / выделение текста работает нормально.
 * - После порога — активируется перетаскивание, текст не выделяется.
 * - Поддерживает touch (один палец = скролл, два пальца = нативный зум/скролл).
 * - userSelect и cursor управляются через возвращаемый style.
 */
export function useDragScroll() {
  const scrollRef    = useRef<HTMLDivElement>(null);
  const isDragging   = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [dragging, setDragging] = useState(false);

  // ── Mouse drag ────────────────────────────────────────────────────────────

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('th') || target.closest('input')) return;

    const el = scrollRef.current;
    if (!el) return;

    isDragging.current = false;
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop:  el.scrollTop,
    };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (e.buttons !== 1) return;

    const el = scrollRef.current;
    if (!el) return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    if (!isDragging.current) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      isDragging.current = true;
      setDragging(true);
      globalThis.window.getSelection()?.removeAllRanges();
    }

    e.preventDefault();
    el.scrollLeft = dragStartPos.current.scrollLeft - dx;
    el.scrollTop  = dragStartPos.current.scrollTop  - dy;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    setDragging(false);
  }, []);

  const onMouseLeave = useCallback(() => {
    isDragging.current = false;
    setDragging(false);
  }, []);

  // ── Touch drag (single finger pan) ───────────────────────────────────────

  const touchStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const touchActive = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const el = scrollRef.current;
    if (!el) return;
    touchActive.current = true;
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      scrollLeft: el.scrollLeft,
      scrollTop:  el.scrollTop,
    };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchActive.current || e.touches.length !== 1) return;
    const el = scrollRef.current;
    if (!el) return;

    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;

    // Only prevent default if we're scrolling horizontally more than vertically
    // This preserves native vertical page scroll when needed
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
      el.scrollLeft = touchStart.current.scrollLeft - dx;
    } else {
      el.scrollTop = touchStart.current.scrollTop - dy;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    touchActive.current = false;
  }, []);

  // ── Return ────────────────────────────────────────────────────────────────

  const dragStyle: React.CSSProperties = {
    cursor:     dragging ? 'grabbing' : 'grab',
    userSelect: dragging ? 'none'     : 'text',
  };

  const dragHandlers = {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };

  return { scrollRef, dragStyle, dragHandlers };
}