import React, { useContext } from 'react';
import { TableContext } from '../lib/htmlParser';

interface ImageCardProps {
  src: string;
  alt: string;
  title?: string;
  isDark?: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({ src, alt, title, isDark = false }) => {
  return (
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
        }}
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
  );
};

const ImageCardWithContext: React.FC<Omit<ImageCardProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <ImageCard {...props} isDark={isDark} />;
};

export default ImageCardWithContext;
