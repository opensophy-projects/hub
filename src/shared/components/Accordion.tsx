import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`my-4 rounded-lg border overflow-hidden ${
        isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
          isDark ? 'hover:bg-white/10' : 'hover:bg-black/10'
        }`}
      >
        <span className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
          {title}
        </span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''} ${
            isDark ? 'text-white/70' : 'text-black/70'
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div className={`px-4 py-3 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <div className="prose max-w-none">{children}</div>
        </div>
      )}
    </div>
  );
};

export default Accordion;
