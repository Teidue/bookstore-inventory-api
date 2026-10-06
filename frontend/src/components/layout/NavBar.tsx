import { Link } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Brand } from './Brand';

/**
 * Barra superior.
 *
 * Sólo lleva la marca (que vuelve al inventario) y el tema. Las acciones de
 * cada pantalla, como «Añadir libro», viven en su cabecera: repetirlas aquí
 * daría dos botones para lo mismo.
 */
export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label="Bookstore Inventory, ir al inventario"
        >
          <Brand />
        </Link>

        <ThemeToggle />
      </div>
    </header>
  );
}
