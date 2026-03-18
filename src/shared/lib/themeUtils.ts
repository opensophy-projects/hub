/**
 * Выбирает значение в зависимости от темы.
 *
 * @example
 * tc(isDark, 'rgba(255,255,255,0.1)', 'rgba(0,0,0,0.1)')
 */
export function tc(isDark: boolean, dark: string, light: string): string {
  return isDark ? dark : light;
}