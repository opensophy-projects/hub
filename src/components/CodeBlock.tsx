import React, { useState } from 'react';
import { Copy, Check, Maximize2 } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  isDark: boolean;
  maxLines?: number;
  onFullscreen?: (code: string, language: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language = 'plaintext', 
  isDark, 
  maxLines,
  onFullscreen 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFullscreen = () => {
    if (onFullscreen) {
      onFullscreen(code, language);
    }
  };

  const lines = code.split('\n');
  const totalLines = lines.length;

  return (
    <div className={`relative rounded-lg border overflow-hidden my-4 ${
      isDark ? 'border-white/10 bg-[#1a1a1a]' : 'border-black/10 bg-gray-50'
    }`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b ${
        isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-gray-100'
      }`}>
        <span className={`text-xs font-mono ${isDark ? 'text-white/60' : 'text-black/60'}`}>
          {language}
        </span>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-3 py-1 rounded text-xs transition-colors ${
              isDark 
                ? 'hover:bg-white/10 text-white' 
                : 'hover:bg-black/10 text-black'
            }`}
            title="Копировать код"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                Скопировано
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Копировать
              </>
            )}
          </button>
          
          <button
            onClick={handleFullscreen}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'
            }`}
            title="Открыть на весь экран"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto">
        {/* Номера строк */}
        <div className={`select-none py-4 px-2 text-right border-r ${
          isDark ? 'bg-[#0a0a0a] border-white/10 text-white/30' : 'bg-gray-100 border-black/10 text-black/30'
        }`}>
          {lines.map((_, index) => (
            <div key={index} className="font-mono text-xs leading-5">
              {index + 1}
            </div>
          ))}
        </div>

        {/* Код */}
        <pre className={`flex-1 p-4 overflow-x-auto text-sm ${
          isDark ? 'text-white/90' : 'text-black/90'
        }`}>
          <code className={`language-${language} block`} style={{ lineHeight: '1.25rem' }}>
            {code}
          </code>
        </pre>
      </div>

      {maxLines && totalLines > maxLines && (
        <div className={`text-center py-2 text-xs ${
          isDark ? 'text-white/40' : 'text-black/40'
        }`}>
          {totalLines} строк
        </div>
      )}
    </div>
  );
};

export default CodeBlock;
