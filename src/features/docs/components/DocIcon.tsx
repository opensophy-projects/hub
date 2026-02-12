import React from 'react';
import { Album, Newspaper, FileText } from 'lucide-react';

interface DocIconProps {
  type: string;
  className?: string;
}

const DocIcon: React.FC<DocIconProps> = ({ type, className = 'w-10 h-10' }) => {
  if (type === 'blog') {
    return <Album className={className} />;
  }

  if (type === 'news') {
    return <Newspaper className={className} />;
  }

  return <FileText className={className} />;
};

export default DocIcon;
