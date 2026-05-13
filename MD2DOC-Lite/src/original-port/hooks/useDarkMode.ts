import { useCallback, useEffect, useState } from 'react';

export interface UseDarkModeOptions {
  storageKey?: string;
  className?: string;
  attribute?: string;
}

function getInitialDarkMode(storageKey: string): boolean {
  if (typeof window === 'undefined') return false;

  const stored = window.localStorage.getItem(storageKey);
  if (stored === 'dark') return true;
  if (stored === 'light') return false;

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function useDarkMode(options: UseDarkModeOptions = {}) {
  const { storageKey = 'app_theme', className = 'dark', attribute = 'data-theme' } = options;
  const [isDark, setIsDark] = useState(() => getInitialDarkMode(storageKey));

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.classList.toggle(className, isDark);
    root.setAttribute(attribute, isDark ? 'dark' : 'light');
    window.localStorage.setItem(storageKey, isDark ? 'dark' : 'light');
  }, [attribute, className, isDark, storageKey]);

  const toggleDarkMode = useCallback(() => {
    setIsDark((value) => !value);
  }, []);

  return { isDark, setIsDark, toggleDarkMode };
}
