import React, { useState } from 'react';
import { Copy, Check, Maximize2, ChevronDown } from 'lucide-react';

interface CodeFile {
  language: string;
  filename: string;
  code: string;
}

interface CodeBlockProps {
  code: string | CodeFile[];
  language?: string;
  isDark: boolean;
  onFullscreen?: (code: string, language: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'plaintext', isDark, onFullscreen }) => {
  const [copied, setCopied] = useState(false);
  const [activeFile, setActiveFile] = useState(0);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  const isMultiFile = Array.isArray(code);
  const files: CodeFile[] = isMultiFile 
    ? code 
    : [{ language, filename: language, code }];

  const currentFile = files[activeFile];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentFile.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFullscreen = () => {
    if (onFullscreen) {
      onFullscreen(currentFile.code, currentFile.language);
    }
  };

  const lines = currentFile.code.split('\n');

  return (
    <div className={`relative rounded-lg border overflow-hidden my-4 ${
      isDark ? 'border-white/10 bg-[#1a1a1a]' : 'border-black/10 bg-gray-50'
    }`}>
      <div className={`flex items-center justify-between px-4 py-2 border-b ${
        isDark ? 'border-white/10 bg-[#0a0a0a]' : 'border-black/10 bg-gray-100'
      }`}>
        <div className="flex items-center gap-3">
          {isMultiFile && files.length > 1 ? (
            <div className="flex items-center gap-2">
              {files.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setActiveFile(index)}
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                    activeFile === index
                      ? isDark
                        ? 'bg-white/20 text-white'
                        : 'bg-black/20 text-black'
                      : isDark
                      ? 'text-white/60 hover:bg-white/10 hover:text-white'
                      : 'text-black/60 hover:bg-black/10 hover:text-black'
                  }`}
                >
                  {file.filename}
                </button>
              ))}
              
              {files.length > 3 && (
                <div className="relative">
                  <button
                    onClick={() => setIsSelectOpen(!isSelectOpen)}
                    className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors ${
                      isDark
                        ? 'text-white/60 hover:bg-white/10 hover:text-white'
                        : 'text-black/60 hover:bg-black/10 hover:text-black'
                    }`}
                  >
                    <span className="font-mono">{currentFile.language}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {isSelectOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsSelectOpen(false)}
                      />
                      <div className={`absolute top-full left-0 mt-1 rounded-lg border shadow-lg z-20 min-w-[150px] ${
                        isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10'
                      }`}>
                        {files.map((file, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setActiveFile(index);
                              setIsSelectOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors ${
                              activeFile === index
                                ? isDark
                                  ? 'bg-white/20 text-white'
                                  : 'bg-black/20 text-black'
                                : isDark
                                ? 'text-white/70 hover:bg-white/10'
                                : 'text-black/70 hover:bg-black/10'
                            }`}
                          >
                            {file.filename}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <span className={`text-xs font-mono ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              {currentFile.filename}
            </span>
          )}
        </div>
        
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
          
          {onFullscreen && (
            <button
              onClick={handleFullscreen}
              className={`p-1 rounded transition-colors ${
                isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'
              }`}
              title="Открыть на весь экран"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex overflow-x-auto">
        <div className={`select-none py-4 px-2 text-right border-r ${
          isDark ? 'bg-[#0a0a0a] border-white/10 text-white/30' : 'bg-gray-100 border-black/10 text-black/30'
        }`}>
          {lines.map((_, index) => (
            <div key={index} className="font-mono text-xs leading-5">
              {index + 1}
            </div>
          ))}
        </div>

        <pre className={`flex-1 p-4 overflow-x-auto text-sm ${
          isDark ? 'text-white/90' : 'text-black/90'
        }`}>
          <code className={`language-${currentFile.language} block`} style={{ lineHeight: '1.25rem' }}>
            {currentFile.code}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
