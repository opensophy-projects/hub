import React, { useEffect, useState } from 'react';
import { Copy, Check, X } from 'lucide-react';

interface CodeModalProps {
  isOpen: boolean;
  code: string;
  language: string;
  isDark: boolean;
  onClose: () => void;
}

const CodeModal: React.FC<CodeModalProps> = ({ isOpen, code, language, isDark, onClose }) => {
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const lines = code.split('\n');

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
          flexDirection: 'column',
          minWidth: '80vw'
        }}
      >
        <div
          className={`sticky top-0 flex items-center justify-between p-4 border-b z-10 ${
            isDark ? 'bg-[#0a0a0a] border-gray-500' : 'bg-white border-gray-400'
          }`}
        >
          <div className="flex items-center gap-4">
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Код в полном размере
            </h3>
            <span className={`text-sm font-mono ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              {language}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Скопировано
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Копировать
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto flex-1">
          {/* Номера строк */}
          <div className={`select-none py-4 px-3 text-right border-r ${
            isDark ? 'bg-[#0a0a0a] border-white/10 text-white/30' : 'bg-gray-100 border-black/10 text-black/30'
          }`}>
            {lines.map((_, index) => (
              <div key={index} className="font-mono text-sm leading-6">
                {index + 1}
              </div>
            ))}
          </div>

          {/* Код */}
          <pre className={`flex-1 p-6 overflow-x-auto ${
            isDark ? 'text-white/90' : 'text-black/90'
          }`}>
            <code className={`language-${language} text-sm`} style={{ lineHeight: '1.5rem' }}>
              {code}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CodeModal;
