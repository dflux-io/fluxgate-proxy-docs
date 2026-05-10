import type { Theme } from '../types';

const STORAGE_KEY = 'fluxdocs-theme';

export function getTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'light' ? 'light' : 'dark';
}

export function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage may be disabled (Safari private mode); we already
    // applied the attribute, so the change still takes effect for the
    // current session.
  }
  window.dispatchEvent(new CustomEvent<Theme>('fluxdocs:themechange', { detail: theme }));
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function onThemeChange(handler: (theme: Theme) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<Theme>).detail);
  window.addEventListener('fluxdocs:themechange', listener);
  return () => window.removeEventListener('fluxdocs:themechange', listener);
}
