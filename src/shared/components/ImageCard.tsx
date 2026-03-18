import React, { useState, useContext } from 'react';
import { TableContext } from '../lib/htmlParser';
import Overlay from './Overlay';

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
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={`Открыть изображение: ${alt}`}
          style={{
            display: 'block',
            padding: 0,
            border: 'none',
            background: 'transparent',
            cursor: 'zoom-in',
            borderRadius: title ? '0' : '9px',
            overflow: 'hidden',
          }}
        >
          <img
            src={src}
            alt={alt}
            loading="lazy"
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: '480px',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              margin: 0,
              border: 'none',
              borderRadius: title ? '0' : '9px',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          />
        </button>

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
        <Overlay
          onClose={() => setLightboxOpen(false)}
          isDark
          zIndex={9999}
        >
          {/* cursor:zoom-out on the backdrop is handled by Overlay's backdrop button */}
          <div style={{ position: 'relative' }}>
            <img
              src={src}
              alt={alt}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '10px',
                boxShadow: '0 8px 60px rgba(0,0,0,0.8)',
                userSelect: 'none',
                display: 'block',
              }}
            />
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
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
                zIndex: 1,
              }}
            >
              ✕
            </button>
          </div>
        </Overlay>
      )}
    </>
  );
};

// ─── Context wrapper ──────────────────────────────────────────────────────────

const ImageCardWithContext: React.FC<Omit<ImageCardProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <ImageCard {...props} isDark={isDark} />;
};

export default ImageCardWithContext;