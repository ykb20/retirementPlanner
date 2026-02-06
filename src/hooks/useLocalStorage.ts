import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // ignore parse errors
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  }, [key, value]);

  return [value, setValue];
}

export function useResetToDefaults<T>(
  defaultValue: T,
  setValue: React.Dispatch<React.SetStateAction<T>>
) {
  return useCallback(() => {
    setValue(defaultValue);
  }, [defaultValue, setValue]);
}
