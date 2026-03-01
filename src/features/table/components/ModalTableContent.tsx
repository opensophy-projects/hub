import React, { useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { useDragScroll } from '../hooks/useDragScroll';

interface ModalTableContentProps {
  isDark: boolean;
  headers: Array<{ text: string; colIndex: number }>;
  filteredRows: Array<Record<string, string>>;
  visibleColumns: Set<string>;
}

const getRowBgColor = (isEvenRow: boolean, isDark: boolean): string => {
  if (isDark) return isEvenRow ? '#1e1e1e' : '#141414';
  return isEvenRow ? '#ffffff' : '#f9f9f9';
};

const getRowHoverBgColor = (isEvenRow: boolean, isDark: boolean): string => {
  if (isDark) return isEvenRow ? '#2a2a2a' : '#202020';
  return '#f0f0f0';
};

const generateRowKey = (
  row: Record<string, string>,
  index: number,
  headers: Array<{ text: string; colIndex: number }>,
): string => {
  const rowContent = headers.map((h) => row[h.text] || '').join('|');
  return `row-${index}-${rowContent.substring(0, 50)}`;
};

const CellContent: React.FC<{ html: string; isDark: boolean; bgColor: string }> = ({
  html,
  isDark,
  bgColor,
}) => {
  const contentRef = React.useRef<HTMLTableCellElement>(null);

  React.useEffect(() => {
    if (!contentRef.current) return;

    const sanitizedHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'strong', 'b', 'em', 'i', 'code', 'a', 'br',
        'u', 'del', 's', 'strike', 'sub', 'sup', 'mark',
        'span', 'div', 'p',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
      ALLOW_DATA_ATTR: false,
    });

    contentRef.current.innerHTML = sanitizedHtml;
  }, [html]);

  return (
    <td
      ref={contentRef}
      className={`border p-2 ${isDark ? 'border-white/10 text-white/90' : 'border-black/10 text-black'}`}
      style={{
        backgroundColor: bgColor,
        transition: 'background-color 0.12s ease',
      }}
    />
  );
};

const ModalTableRow: React.FC<{
  row: Record<string, string>;
  rowIndex: number;
  visibleHeaders: Array<{ text: string; colIndex: number }>;
  isDark: boolean;
}> = ({ row, rowIndex, visibleHeaders, isDark }) => {
  const isEvenRow = rowIndex % 2 === 0;
  const [isHovered, setIsHovered] = useState(false);

  const bgColor = isHovered
    ? getRowHoverBgColor(isEvenRow, isDark)
    : getRowBgColor(isEvenRow, isDark);

  return (
    <tr
      style={{ backgroundColor: bgColor, transition: 'background-color 0.12s ease' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {visibleHeaders.map((header) => (
        <CellContent
          key={`cell-${rowIndex}-${header.colIndex}`}
          html={row[header.text] || '-'}
          isDark={isDark}
          bgColor={bgColor}
        />
      ))}
    </tr>
  );
};

export const ModalTableContent: React.FC<ModalTableContentProps> = ({
  isDark,
  headers,
  filteredRows,
  visibleColumns,
}) => {
  const visibleHeaders = headers.filter((h) => visibleColumns.has(h.text));
  const { scrollRef, dragStyle, dragHandlers } = useDragScroll();

  const thumb = isDark ? 'rgba(150, 150, 150, 0.6)' : 'rgba(0, 0, 0, 0.2)';
  const thumbHover = isDark ? 'rgba(190, 190, 190, 0.85)' : 'rgba(0, 0, 0, 0.35)';
  const track = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';

  const thBg = isDark ? '#252525' : '#ffffff';
  const thBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div
      ref={scrollRef}
      className="modal-table-scroll overflow-x-auto overflow-y-auto flex-1"
      style={{
        scrollbarColor: `${thumb} ${track}`,
        scrollbarWidth: 'thin',
        ...dragStyle,
      }}
      {...dragHandlers}
    >
      <table
        className={`w-full border-collapse text-sm ${isDark ? 'text-white' : 'text-black'}`}
      >
        <thead
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: thBg,
          }}
        >
          <tr>
            {visibleHeaders.map((header) => (
              <th
                key={header.colIndex}
                className="p-2 font-semibold text-left"
                style={{
                  border: `1px solid ${thBorder}`,
                  backgroundColor: thBg,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                }}
              >
                {header.text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRows.length === 0 ? (
            <tr>
              <td
                colSpan={visibleHeaders.length}
                className={`text-center p-4 italic ${isDark ? 'text-white/50' : 'text-black/50'}`}
              >
                Нет результатов
              </td>
            </tr>
          ) : (
            filteredRows.map((row, idx) => (
              <ModalTableRow
                key={generateRowKey(row, idx, visibleHeaders)}
                row={row}
                rowIndex={idx}
                visibleHeaders={visibleHeaders}
                isDark={isDark}
              />
            ))
          )}
        </tbody>
      </table>

      <style>{`
        .modal-table-scroll::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .modal-table-scroll::-webkit-scrollbar-track {
          background: ${track};
          border-radius: 4px;
        }
        .modal-table-scroll::-webkit-scrollbar-thumb {
          background: ${thumb};
          border-radius: 4px;
        }
        .modal-table-scroll::-webkit-scrollbar-thumb:hover {
          background: ${thumbHover};
        }
        .modal-table-scroll::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>
    </div>
  );
};