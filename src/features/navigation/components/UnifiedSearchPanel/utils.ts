import { SearchResult } from './types';

export const matchesSearchQuery = (doc: SearchResult, query: string): boolean => {
  const lowerQuery = query.toLowerCase();
  
  if (doc.title.toLowerCase().includes(lowerQuery)) return true;
  if (doc.description.toLowerCase().includes(lowerQuery)) return true;
  if (doc.author?.toLowerCase().includes(lowerQuery)) return true;
  if (doc.typename?.toLowerCase().includes(lowerQuery)) return true;
  if (doc.type?.toLowerCase().includes(lowerQuery)) return true;
  if (doc.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) return true;
  
  return false;
};

export const buildDocUrl = (doc: SearchResult): string => {
  if (doc.slug === 'welcome') return '/';
  return doc.type?.trim() ? `/${doc.type}/${doc.slug}` : `/${doc.slug}`;
};

export const navigateToUrl = (url: string): void => {
  globalThis.location.href = url;
};

export const getFilterButtonClasses = (isActive: boolean, isDark: boolean): string => {
  if (isActive) {
    return isDark
      ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-2 border-blue-500 font-semibold'
      : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-2 border-blue-600 font-semibold';
  }
  return isDark
    ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-2 border-transparent'
    : 'bg-black/5 hover:bg-black/10 text-black/70 hover:text-black border-2 border-transparent';
};