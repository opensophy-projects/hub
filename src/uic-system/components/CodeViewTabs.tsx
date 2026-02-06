import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { CodeBlock } from '@/components/CodeBlock';

interface CodeViewTabsProps {
  files: Record<string, string>;
}

const CodeViewTabs: React.FC<CodeViewTabsProps> = ({ files }) => {
  const { isDark } = useTheme();
  const fileNames = Object.keys(files).filter(name => 
    name.endsWith('.tsx') || name.endsWith('.ts') || name.endsWith('.css') || name.endsWith('.jsx')
  );
  const [activeFile, setActiveFile] = React.useState(fileNames[0] || '');

  if (fileNames.length === 0) {
    return (
      <div className={`p-6 text-center ${isDark ? 'text-white/50' : 'text-black/50'}`}>
        Нет файлов для отображения
      </div>
    );
  }

  const getLanguage = (fileName: string) => {
    if (fileName.endsWith('.tsx')) return 'tsx';
    if (fileName.endsWith('.jsx')) return 'jsx';
    if (fileName.endsWith('.ts')) return 'typescript';
    if (fileName.endsWith('.css')) return 'css';
    return 'plaintext';
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`flex gap-2 p-4 border-b overflow-x-auto ${
        isDark ? 'border-white/10 bg-white/5' : 'border-black/10 bg-black/5'
      }`}>
        {fileNames.map(fileName => (
          <button
            key={fileName}
            onClick={() => setActiveFile(fileName)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeFile === fileName
                ? isDark
                  ? 'bg-white/10 text-white'
                  : 'bg-black/10 text-black'
                : isDark
                ? 'text-white/50 hover:text-white/70'
                : 'text-black/50 hover:text-black/70'
            }`}
          >
            {fileName}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {files[activeFile] && (
          <CodeBlock
            code={files[activeFile]}
            language={getLanguage(activeFile)}
          />
        )}
      </div>
    </div>
  );
};

export default CodeViewTabs;
