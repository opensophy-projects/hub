import React, { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MagnifyingGlassPlusIcon as ZoomIn, XIcon as X } from '@phosphor-icons/react';
import { TableContext } from '../lib/htmlParser';

interface ImageCardProps {
  src: string;
  alt: string;
  title?: string;
  isDark?: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({ src, alt, title, isDark = false }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!isZoomed) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsZoomed(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isZoomed]);

  const captionColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';

  return (
    <>
      <figure
        style={{
          margin: '1.25rem auto',
          width: '100%',
          maxWidth: 'var(--doc-image-max-width, min(100%, 820px))',
          textAlign: 'center',
        }}
      >
        <button
          type="button"
          onClick={() => setIsZoomed(true)}
          aria-label={`Увеличить изображение: ${alt}`}
          style={{
            display: 'block',
            width: '100%',
            padding: 0,
            border: 0,
            background: 'transparent',
            cursor: 'zoom-in',
            position: 'relative',
          }}
        >
          <img
            src={src}
            alt={alt}
            loading="lazy"
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '100%',
              maxHeight: '70vh',
              height: 'auto',
              objectFit: 'contain',
              margin: '0 auto',
              border: 'none',
              borderRadius: 0,
              background: 'transparent',
              boxShadow: 'none',
            }}
          />
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: 8,
              bottom: 8,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 999,
              background: isDark ? 'rgba(15,15,15,0.82)' : 'rgba(225,223,219,0.9)',
              color: isDark ? '#ffffff' : '#0f0f0f',
              boxShadow: isDark ? '0 4px 18px rgba(0,0,0,0.55)' : '0 4px 18px rgba(0,0,0,0.18)',
            }}
          >
            <ZoomIn size={16} weight="duotone" />
          </span>
        </button>

        {title && (
          <figcaption
            style={{
              textAlign: 'center',
              fontSize: '0.78rem',
              fontStyle: 'italic',
              marginTop: '0.45rem',
              color: captionColor,
              lineHeight: 1.4,
            }}
          >
            {title}
          </figcaption>
        )}
      </figure>

      {isZoomed && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title || alt}
          onClick={() => setIsZoomed(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(1rem, 4vw, 3rem)',
            background: isDark ? 'rgba(0,0,0,0.88)' : 'rgba(15,15,15,0.82)',
            cursor: 'zoom-out',
          }}
        >
          <button
            type="button"
            aria-label="Закрыть увеличенное изображение"
            onClick={(event) => { event.stopPropagation(); setIsZoomed(false); }}
            style={{
              position: 'fixed',
              top: 16,
              right: 16,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(15,15,15,0.82)',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <X size={20} weight="duotone" />
          </button>
          <img
            src={src}
            alt={alt}
            onClick={(event) => event.stopPropagation()}
            style={{
              display: 'block',
              maxWidth: '96vw',
              maxHeight: '92vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              background: 'transparent',
            }}
          />
        </div>,
        document.body,
      )}
    </>
  );
};

const ImageCardWithContext: React.FC<Omit<ImageCardProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <ImageCard {...props} isDark={isDark} />;
};

export default ImageCardWithContext;
