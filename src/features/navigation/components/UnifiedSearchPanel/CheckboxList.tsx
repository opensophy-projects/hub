import React from 'react';
import { getTextClasses } from '@/shared/lib/classUtils';

interface CheckboxListProps {
  items: string[];
  selected: Set<string>;
  onToggle: (item: string) => void;
  isDark: boolean;
  prefix?: string;
}

export const CheckboxList: React.FC<CheckboxListProps> = ({ 
  items, 
  selected, 
  onToggle, 
  isDark, 
  prefix = '' 
}) => {
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const emptyTextClass = getTextClasses(isDark, '50');
  
  return (
    <div 
      className="space-y-1 max-h-40 overflow-y-auto border rounded-lg p-2" 
      style={{ borderColor }}
    >
      {items.length === 0 ? (
        <p className={`text-xs text-center py-2 ${emptyTextClass}`}>
          Не найдено
        </p>
      ) : (
        items.map(item => {
          const isSelected = selected.has(item);
          
          let itemBgClass: string;
          if (isSelected) {
            itemBgClass = isDark ? 'bg-blue-600/20' : 'bg-blue-100';
          } else {
            itemBgClass = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
          }
          
          let itemTextClass: string;
          if (isSelected) {
            itemTextClass = isDark ? 'text-blue-400 font-semibold' : 'text-blue-700 font-semibold';
          } else {
            itemTextClass = isDark ? 'text-white/70' : 'text-black/70';
          }
          
          return (
            <label
              key={item}
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${itemBgClass}`}
            >
              <input 
                type="checkbox" 
                checked={isSelected} 
                onChange={() => onToggle(item)} 
                className="rounded" 
              />
              <span className={`text-xs ${itemTextClass}`}>
                {prefix}{item}
              </span>
            </label>
          );
        })
      )}
    </div>
  );
};