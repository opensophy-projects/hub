import React from 'react';
import { getFilterButtonClasses } from './utils';

interface TypenameFiltersProps {
  allTypenames: string[];
  selectedTypenames: Set<string>;
  onToggle: (typename: string) => void;
  isDark: boolean;
  borderColor: string;
}

export const TypenameFilters: React.FC<TypenameFiltersProps> = ({
  allTypenames,
  selectedTypenames,
  onToggle,
  isDark,
  borderColor
}) => {
  if (allTypenames.length === 0) return null;

  return (
    <div className="flex-shrink-0 px-4 py-3 border-b flex gap-2 flex-wrap" style={{ borderColor }}>
      {allTypenames.map(t => (
        <button
          key={t}
          onClick={() => onToggle(t)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            getFilterButtonClasses(selectedTypenames.has(t), isDark)
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
};