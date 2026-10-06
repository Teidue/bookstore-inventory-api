import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'bookstore-theme';

/** Preferencia guardada, o la del sistema si el usuario nunca eligió. */
function readInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // El almacenamiento puede estar bloqueado (modo privado): se ignora.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Tema de la interfaz.
 *
 * El atributo `data-theme` lo fija también un script en línea del `index.html`
 * antes del primer pintado; este hook sólo lo mantiene y permite cambiarlo.
 * Sin ese script, quien prefiere oscuro vería un destello blanco en cada carga.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = useCallback(() => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 350);

    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Sin almacenamiento el tema sigue cambiando, sólo que no se recuerda.
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
