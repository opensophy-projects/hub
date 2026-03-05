import React, { useState, useEffect, useContext } from 'react';
import { TableContext } from '../lib/htmlParser';

// ─── Lightbox ─────────────────────────────────────────────────────────────────

const ImageLightbox: React.FC<{
  src: string;
  alt: string;
  onClose: () => void;
}> = ({ src, alt, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        cursor: 'zoom-out',
      }}
    >
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          objectFit: 'contain',
          borderRadius: '10px',
          boxShadow: '0 8px 60px rgba(0,0,0,0.8)',
          cursor: 'default',
          userSelect: 'none',
        }}
      />
      <button
        onClick={onClose}
        aria-label="Закрыть"
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          color: '#fff',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '18px',
          lineHeight: 1,
          zIndex: 10000,
        }}
      >
        ✕
      </button>
    </div>
  );
};

// ─── ImageCard ────────────────────────────────────────────────────────────────

interface ImageCardProps {
  src: string;
  alt: string;
  title?: string;
  isDark?: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({ src, alt, title, isDark = false }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <span
        style={{
          display: 'inline-block',
          maxWidth: '100%',
          margin: '1.25rem 0',
          borderRadius: '10px',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          overflow: 'hidden',
          boxShadow: isDark
            ? '0 2px 16px rgba(0,0,0,0.5)'
            : '0 2px 12px rgba(0,0,0,0.08)',
          verticalAlign: 'top',
        }}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onClick={() => setLightboxOpen(true)}
          style={{
            display: 'block',
            maxWidth: '100%',
            maxHeight: '480px',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            cursor: 'zoom-in',
            margin: 0,
            border: 'none',
            borderRadius: title ? '0' : '9px',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        />
        {title && (
          <span
            style={{
              display: 'block',
              textAlign: 'center',
              fontSize: '0.78rem',
              fontStyle: 'italic',
              padding: '0.5rem 0.75rem',
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              borderTop: isDark
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid rgba(0,0,0,0.07)',
              lineHeight: 1.4,
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            }}
          >
            {title}
          </span>
        )}
      </span>

      {lightboxOpen && (
        <ImageLightbox src={src} alt={alt} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
};

// ─── Обёртка с контекстом темы ────────────────────────────────────────────────

const ImageCardWithContext: React.FC<Omit<ImageCardProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <ImageCard {...props} isDark={isDark} />;
};

export default ImageCardWithContext;