import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HtmlParser from '../lib/htmlParser';
import { setupMarkedConfig, preprocessMarkdown, postprocessMarkdown } from '../lib/markedConfig';
import { X, Maximize2, Code } from 'lucide-react';

interface DocContentProps {
  content: string;
  isDark?: boolean;
}

const DocContent: React.FC<DocContentProps> = ({ content, isDark = false }) => {
  const [renderedHtml, setRenderedHtml] = useState('');
  const [fullscreenCode, setFullscreenCode] = useState<string | null>(null);
  const [fullscreenTable, setFullscreenTable] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const renderContent = async () => {
      try {
        const marked = setupMarkedConfig();
        const preprocessed = preprocessMarkdown(content);
        const html = await marked(preprocessed);
        const postprocessed = postprocessMarkdown(html);
        setRenderedHtml(postprocessed);
      } catch (error) {
        console.error('Error rendering markdown:', error);
        setRenderedHtml(`<p>Error rendering content: ${error instanceof Error ? error.message : 'Unknown error'}</p>`);
      }
    };

    renderContent();
  }, [content]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <div className={`prose prose-invert transition-colors ${isDark ? 'dark' : 'light'}`}>
        <HtmlParser
          html={renderedHtml}
          isDark={isDark}
          onFullscreenCode={setFullscreenCode}
          onFullscreenTable={setFullscreenTable}
        />
      </div>

      <AnimatePresence>
        {/* Полноэкранный код */}
        {fullscreenCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setFullscreenCode(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full h-full max-w-6xl rounded-lg overflow-hidden flex flex-col ${
                isDark ? 'bg-[#0a0a0a]' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Заголовок */}
              <div className={`flex items-center justify-between p-4 border-b ${
                isDark ? 'border-white/10 bg-[#1a1a1a]' : 'border-black/10 bg-gray-50'
              }`}>
                <span className={`text-sm font-mono ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  Исходный код
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(fullscreenCode)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      isDark 
                        ? 'hover:bg-white/10 text-white' 
                        : 'hover:bg-black/10 text-black'
                    }`}
                  >
                    {copied ? 'Скопировано!' : 'Копировать'}
                  </button>
                  
                  <button
                    onClick={() => setFullscreenCode(null)}
                    className={`p-1 rounded transition-colors ${
                      isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Код */}
              <pre className={`flex-1 p-4 overflow-auto text-sm font-mono ${
                isDark ? 'bg-[#0a0a0a] text-white/90' : 'bg-white text-black/90'
              }`}>
                <code>{fullscreenCode}</code>
              </pre>
            </motion.div>
          </motion.div>
        )}

        {/* Полноэкранная таблица */}
        {fullscreenTable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setFullscreenTable(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`relative w-full h-full max-w-6xl rounded-lg overflow-hidden flex flex-col ${
                isDark ? 'bg-[#0a0a0a]' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Заголовок */}
              <div className={`flex items-center justify-between p-4 border-b ${
                isDark ? 'border-white/10 bg-[#1a1a1a]' : 'border-black/10 bg-gray-50'
              }`}>
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  Таблица
                </span>
                
                <button
                  onClick={() => setFullscreenTable(null)}
                  className={`p-1 rounded transition-colors ${
                    isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-black'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Таблица */}
              <div className="flex-1 overflow-auto">
                <div
                  dangerouslySetInnerHTML={{ __html: fullscreenTable }}
                  className={isDark ? 'dark' : ''}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DocContent;
