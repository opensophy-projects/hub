import React, { useState } from 'react';

interface HeadingAnchorProps {
  id: string;
  level: number;
  html: string;
}

const TAG_STYLES: Record<number, React.CSSProperties> = {
  1: { fontSize: 'clamp(1.4rem,3vw,2.25rem)', fontWeight: 700, marginTop: '2rem', marginBottom: '1rem', lineHeight: 1.2 },
  2: { fontSize: 'clamp(1.2rem,2.5vw,1.875rem)', fontWeight: 700, marginTop: '2rem', marginBottom: '1rem', lineHeight: 1.25 },
  3: { fontSize: 'clamp(1.05rem,2vw,1.5rem)', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.75rem', lineHeight: 1.3 },
  4: { fontSize: 'clamp(1rem,1.8vw,1.25rem)', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.75rem' },
  5: { fontSize: '1rem', fontWeight: 700, marginTop: '1.25rem', marginBottom: '0.5rem' },
  6: { fontSize: '0.875rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
};

const HeadingAnchor: React.FC<HeadingAnchorProps> = ({ id, level, html }) => {
  const [hovered, setHovered] = useState(false);
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  // Якорь "#" показывается только для H2, H3, H4 (те что в TOC)
  const showAnchor = level >= 2 && level <= 4;

  const handleAnchorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.pathname}#${id}`;
    window.history.pushState(null, '', url);

    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <Tag
      id={id}
      data-heading-text={html.replace(/<[^>]*>/g, '')}
      style={{
        ...TAG_STYLES[level],
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        scrollMarginTop: '5rem',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span dangerouslySetInnerHTML={{ __html: html }} />
      {showAnchor && (
        <a
          href={`#${id}`}
          onClick={handleAnchorClick}
          aria-label="Ссылка на раздел"
          style={{
            opacity: hovered ? 0.45 : 0,
            transition: 'opacity 0.15s',
            color: 'inherit',
            textDecoration: 'none',
            fontSize: '0.75em',
            fontWeight: 400,
            lineHeight: 1,
            flexShrink: 0,
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          #
        </a>
      )}
    </Tag>
  );
};

export default HeadingAnchor;