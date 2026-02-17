import React from 'react';
import { useTheme } from '@/shared/contexts/ThemeContext';
import { scrollToElement } from '@/features/docs/utils/scrollUtils';
import BottomSheet from './BottomSheet';

interface ToContentsItem {
  id: string;
  text: string;
  level: number;
}

interface TocPanelProps {
  toc: ToContentsItem[];
  onTocClick: (id: string) => void;
  onClose: () => void;
}

const TocPanel: React.FC<TocPanelProps> = ({ toc, onTocClick, onClose }) => {
  const { isDark } = useTheme();

  const handleClick = (id: string) => {
    scrollToElement(id);
    onClose();
  };

  return (
    <BottomSheet title="На этой странице" onClose={onClose}>
      {toc.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className={`text-sm ${isDark ? 'text-white/50' : 'text-black/50'}`}>
            На этой странице нет оглавления
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-1">
          {toc.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                isDark
                  ? 'text-white/70 hover:bg-white/5 hover:text-white'
                  : 'text-black/70 hover:bg-black/5 hover:text-black'
              }`}
              style={{ paddingLeft: `${12 + (item.level - 2) * 16}px` }}
            >
              {item.text}
            </button>
          ))}
        </div>
      )}
    </BottomSheet>
  );
};

export default TocPanel;