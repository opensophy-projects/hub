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
    <figure
      style={{
        margin: '1.25rem 0',
        maxWidth: '100%',
      }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          objectFit: 'contain',
          margin: 0,
          border: 'none',
          borderRadius: 0,
          background: 'transparent',
          boxShadow: 'none',
        }}
      />

      {title && (
        <figcaption
          style={{
            textAlign: 'center',
            fontSize: '0.78rem',
            fontStyle: 'italic',
            marginTop: '0.45rem',
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
            lineHeight: 1.4,
          }}
        >
          {title}
        </figcaption>
      )}
    </figure>
  );
};

const ImageCardWithContext: React.FC<Omit<ImageCardProps, 'isDark'>> = (props) => {
  const { isDark } = useContext(TableContext);
  return <ImageCard {...props} isDark={isDark} />;
};

export default ImageCardWithContext;
