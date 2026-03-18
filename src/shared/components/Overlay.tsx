import React, { useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface OverlayProps {
  onClose: () => void;
  children: ReactNode;
  /** Apply backdrop-filter: blur on the backdrop. Default: false */
  blur?: boolean;
  isDark?: boolean;
  zIndex?: number;
}

/**
 * Shared fullscreen overlay.
 * Handles: createPortal, Esc keydown, body overflow:hidden, backdrop button.
 * Content is rendered above the backdrop via z-index.
 */
const Overlay: React.FC<OverlayProps> = ({
  onClose,
  children,
  blur = false,
  isDark = false,
  zIndex = 9999,
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

  const backdropBg = isDark ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.55)';

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
      {/* Backdrop — closes overlay on click */}
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: backdropBg,
          backdropFilter: blur ? 'blur(8px)' : undefined,
          WebkitBackdropFilter: blur ? 'blur(8px)' : undefined,
          border: 'none',
          padding: 0,
          cursor: 'zoom-out',
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