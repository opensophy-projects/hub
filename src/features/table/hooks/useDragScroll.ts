import { useRef, useState, useCallback } from 'react';

const DRAG_THRESHOLD = 5;

/**
 * Хук для drag-scroll контейнера.
 * - До порога DRAG_THRESHOLD px — обычный клик / выделение текста работает нормально.
 * - После порога — активируется перетаскивание, текст не выделяется.
 * - userSelect и cursor управляются через возвращаемый style.
 */
export function useDragScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [dragging, setDragging] = useState(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Не перехватываем th (сортировка) и input (поиск)
    const target = e.target as HTMLElement;
    if (target.closest('th') || target.closest('input')) return;

    const el = scrollRef.current;
    if (!el) return;

    isDragging.current = false;
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    // Только если зажата левая кнопка
    if (e.buttons !== 1) return;

    const el = scrollRef.current;
    if (!el) return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    if (!isDragging.current) {
      if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      // Порог пройден — начинаем drag
      isDragging.current = true;
      setDragging(true);
      window.getSelection()?.removeAllRanges();
    }

    e.preventDefault();
    el.scrollLeft = dragStartPos.current.scrollLeft - dx;
    el.scrollTop = dragStartPos.current.scrollTop - dy;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    setDragging(false);
  }, []);

  const onMouseLeave = useCallback(() => {
    isDragging.current = false;
    setDragging(false);
  }, []);

  const dragStyle: React.CSSProperties = {
    cursor: dragging ? 'grabbing' : 'default',
    userSelect: dragging ? 'none' : 'text',
  };

  const dragHandlers = {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
  };

  return { scrollRef, dragStyle, dragHandlers };
}