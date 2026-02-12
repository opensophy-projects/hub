/**
 * Утилиты для генерации часто используемых CSS-классов на основе темы
 */
export const getButtonClasses = (
  isDark: boolean,
  variant: 'primary' | 'secondary' | 'ghost' = 'primary'
): string => {
  const variants = {
    primary: isDark
      ? 'bg-white/10 hover:bg-white/20 text-white'
      : 'bg-black/10 hover:bg-black/20 text-black',
    secondary: isDark
      ? 'bg-white/5 hover:bg-white/10 text-white/70'
      : 'bg-black/5 hover:bg-black/10 text-black/70',
    ghost: isDark
      ? 'text-white/60 hover:text-white hover:bg-white/5'
      : 'text-black/60 hover:text-black hover:bg-black/5',
  };
  return variants[variant];
};

export const getInputClasses = (isDark: boolean): string => {
  return isDark
    ? 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:bg-white/15 focus:border-white/40'
    : 'bg-[#E8E7E3] border-black/20 text-black placeholder-black/50 focus:border-black/40';
};

export const getCardClasses = (isDark: boolean): string => {
  return isDark
    ? 'bg-[#0a0a0a] border-white/10 hover:border-white/20'
    : 'bg-[#E8E7E3] border-black/10 hover:border-black/20';
};

export const getBorderClasses = (isDark: boolean): string => {
  return isDark ? 'border-white/10' : 'border-black/10';
};

export const getTextClasses = (isDark: boolean, opacity: '50' | '60' | '70' | '80' | '90' = '70'): string => {
  return isDark ? `text-white/${opacity}` : `text-black/${opacity}`;
};

export const getBadgeClasses = (isDark: boolean, variant: 'default' | 'light' = 'default'): string => {
  const variants = {
    default: isDark ? 'bg-white/10 text-white/70' : 'bg-black/10 text-black/70',
    light: isDark ? 'bg-white/5 text-white/60' : 'bg-black/5 text-black/60',
  };
  return variants[variant];
};

export const getContainerClasses = (isDark: boolean): string => {
  return isDark ? 'bg-[#0a0a0a]' : 'bg-[#E8E7E3]';
};