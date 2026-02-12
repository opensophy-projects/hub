import { useState, useEffect } from 'react';

/**
 * Хук для отложенного обновления значения (debounce)
 * @param value - исходное значение
 * @param delay - задержка в миллисекундах (по умолчанию 300)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
