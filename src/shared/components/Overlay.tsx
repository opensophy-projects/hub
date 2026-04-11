import React, { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface OverlayProps {
  onClose: () => void;
  children: ReactNode;
  zIndex?: number;
  /** Override backdrop cursor. Default: zoom-out */
  backdropCursor?: React.CSSProperties['cursor'];
}

/**
 * Shared fullscreen overlay — unified backdrop across ImageCard, CodeBlock, TableModal.
 * Backdrop: rgba(0,0,0,0.6) + blur(12px) everywhere.
 * Handles: createPortal, Esc keydown, body overflow:hidden, backdrop button.
 */
const Overlay: React.FC<OverlayProps> = ({
  onClose,
  children,
  zIndex = 9999,
  backdropCursor = 'zoom-out',
}) => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Unified backdrop: blur(12px) + rgba(0,0,0,0.6) everywhere */}
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: 'none',
          padding: 0,
          cursor: backdropCursor,
          display: 'block',
          width: '100%',
        }}
      />
      {/* Content sits above backdrop */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default Overlay;
