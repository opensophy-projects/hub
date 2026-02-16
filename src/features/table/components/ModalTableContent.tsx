import React from 'react';
import DOMPurify from 'isomorphic-dompurify';

interface ModalTableContentProps {
  isDark: boolean;
  headers: Array<{ text: string; colIndex: number }>;
  filteredRows: Array<Record<string, string>>;
  visibleColumns: Set<string>;
}

const getRowClassName = (rowIndex: number, isDark: boolean): string => {
  const isEvenRow = rowIndex % 2 === 0;
  const baseClass = 'border-t';
  
  if (isEvenRow) {
    return `${baseClass} ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`;
  }
  
  return `${baseClass} ${isDark ? 'bg-[#252525]' : 'bg-gray-50'}`;
};

const generateRowKey = (row: Record<string, string>, index: number, headers: Array<{ text: string; colIndex: number }>): string => {
  const rowContent = headers.map(h => row[h.text] || '').join('|');
  return `row-${index}-${rowContent.substring(0, 50)}`;
};

const CellContent: React.FC<{ html: string }> = ({ html }) => {
  const contentRef = React.useRef<HTMLTableCellElement>(null);

  React.useEffect(() => {
    if (!contentRef.current) return;

    const sanitizedHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'strong', 'b', 'em', 'i', 'code', 'a', 'br', 
        'u', 'del', 's', 'strike', 'sub', 'sup', 'mark',
        'span', 'div', 'p'
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
      ALLOW_DATA_ATTR: false,
    });

    contentRef.current.innerHTML = sanitizedHtml;
  }, [html]);

  return <td ref={contentRef} className="border p-2" />;
};

export const ModalTableContent: React.FC<ModalTableContentProps> = ({
  isDark,
  headers,
  filteredRows,
  visibleColumns,
}) => {
  const visibleHeaders = headers.filter((h) => visibleColumns.has(h.text));

  return (
    <div className="overflow-x-auto overflow-y-auto flex-1">
      <table className={`w-full border-collapse text-sm ${isDark ? 'text-white' : 'text-black'}`}>
        <thead className={`sticky top-0 z-10 ${isDark ? 'bg-[#252525]' : 'bg-white'}`}>
          <tr>
            {visibleHeaders.map((header) => (
              <th
                key={header.colIndex}
                className={`border p-2 font-semibold text-left ${isDark ? 'border-white/10' : 'border-black/10'}`}
              >
                {header.text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td colSpan={visibleHeaders.length} className="text-center p-4 italic">
                Нет результатов
              </td>
            </tr>
          ) : (
            filteredRows.map((row, idx) => (
              <tr 
                key={generateRowKey(row, idx, visibleHeaders)} 
                className={getRowClassName(idx, isDark)}
              >
                {visibleHeaders.map((header) => (
                  <CellContent
                    key={`cell-${idx}-${header.colIndex}`}
                    html={row[header.text] || '-'}
                  />
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      <style>{`
        td.border {
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        }
        
        td code {
          background-color: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 0.85em;
          font-family: ui-monospace, monospace;
          border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
        }
        
        td strong, td b { 
          font-weight: 700;
          color: ${isDark ? 'rgba(255, 255, 255, 1)' : 'rgb(0, 0, 0)'};
        }
        
        td em, td i { 
          font-style: italic; 
        }
        
        td u {
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        td del, td s, td strike {
          text-decoration: line-through;
          opacity: 0.7;
        }
        
        td sub {
          vertical-align: sub;
          font-size: 0.75em;
        }
        
        td sup {
          vertical-align: super;
          font-size: 0.75em;
        }
        
        td mark {
          background-color: ${isDark ? 'rgb(202, 138, 4)' : 'rgb(253, 224, 71)'};
          color: ${isDark ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)'};
          padding: 2px 4px;
          border-radius: 2px;
        }
        
        td a {
          color: rgb(59 130 246);
          text-decoration: underline;
          word-break: break-word;
        }
        
        td a:hover { 
          color: rgb(37 99 235); 
        }
      `}</style>
    </div>
  );
};
