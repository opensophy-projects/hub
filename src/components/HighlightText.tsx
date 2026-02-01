import React from 'react';
import { escapeRegExp } from '../lib/utils';

interface HighlightTextProps {
  text: string;
  query: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, query }) => {
  if (!query) {
    return <>{text}</>;
  }

  const escapedQuery = escapeRegExp(query);
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={`hl-${i}-${part}`}
            style={{
              backgroundColor: 'rgb(59, 130, 246)',
              color: 'white',
              padding: '2px 4px',
              borderRadius: '2px',
              fontWeight: 600,
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={`txt-${i}-${part}`}>{part}</span>
        )
      )}
    </>
  );
};
