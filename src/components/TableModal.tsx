import React, { useEffect } from 'react';

interface TableModalProps {
  isOpen: boolean;
  tableHtml: string;
  isDark: boolean;
  onClose: () => void;
}

const TableModal: React.FC<TableModalProps> = ({ isOpen, tableHtml, isDark, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const XIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`fixed inset-0 ${
          isDark ? 'bg-black/80' : 'bg-white/80'
        }`}
        style={{ backdropFilter: 'blur(4px)' }}
      />

      <div
        className={`relative z-[101] max-h-[90vh] max-w-[95vw] overflow-auto rounded-lg shadow-2xl ${
          isDark ? 'bg-[#0a0a0a]' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          className={`sticky top-0 flex items-center justify-between p-4 border-b z-10 ${
            isDark ? 'bg-[#0a0a0a] border-gray-500' : 'bg-white border-gray-400'
          }`}
        >
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>Таблица в полном размере</h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'}`}
          >
            <XIcon />
          </button>
        </div>
        <div 
          className={`p-6 overflow-auto flex-1 prose ${isDark ? 'prose-invert' : ''}`}
          dangerouslySetInnerHTML={{ __html: tableHtml }} 
        />
        <style>{`
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            font-size: 0.9rem;
            table-layout: auto;
          }
          th, td {
            border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)'};
            padding: 0.75rem;
            text-align: left;
            color: ${isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'};
            word-break: break-word;
            overflow-wrap: break-word;
            white-space: normal;
            hyphens: auto;
            min-width: 120px;
          }
          th {
            background-color: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
            font-weight: 600;
            color: ${isDark ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)'};
            position: sticky;
            top: 0;
            z-index: 10;
          }
          tr:nth-child(even) {
            background-color: ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'};
          }
          tr:hover {
            background-color: ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
          }
          @media (max-width: 640px) {
            table {
              font-size: 0.8rem;
            }
            th, td {
              padding: 0.5rem;
              min-width: 80px;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default TableModal;