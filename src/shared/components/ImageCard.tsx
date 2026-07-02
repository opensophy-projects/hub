import React, { useContext, useState } from 'react';
import { ZoomIn, X } from 'lucide-react';
import { TableContext } from '../lib/htmlParser';
import Overlay from './Overlay';

interface ImageCardProps {
  src: string;
  alt: string;
  title?: string;
  isDark?: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({ src, alt, title, isDark = false }) => {
  const [isZoomed, setIsZoomed] = useState(false);
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
            <ZoomIn size={16} />
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

      {isZoomed && (
        <Overlay onClose={() => setIsZoomed(false)} backdropCursor="zoom-out">
          <figure
            aria-label={title || alt}
            style={{
              position: 'relative',
              margin: 0,
              maxWidth: '96vw',
              maxHeight: '92vh',
            }}
          >
            <img
              src={src}
              alt={alt}
              style={{
                display: 'block',
                maxWidth: '96vw',
                maxHeight: '92vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                background: 'transparent',
                borderRadius: '10px',
                boxShadow: '0 8px 60px rgba(0,0,0,0.8)',
                userSelect: 'none',
              }}
            />
            <button
              type="button"
              aria-label="Закрыть увеличенное изображение"
              onClick={() => setIsZoomed(false)}
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
              <X size={20} />
            </button>
          </figure>
        </Overlay>
      )}
    </>
  );
};

const ImageCardWithContext: React.FC<Omit<ImageCardProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <ImageCard {...props} isDark={isDark} />;
};

export default ImageCardWithContext;
