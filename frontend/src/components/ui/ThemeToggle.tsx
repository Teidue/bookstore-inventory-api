import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

/** Interruptor claro/oscuro. El icono muestra el tema al que se va a pasar. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const toDark = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggle}
      className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-accent-soft hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      aria-label={toDark ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      title={toDark ? 'Tema oscuro' : 'Tema claro'}
    >
      {toDark ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
    </button>
  );
}
