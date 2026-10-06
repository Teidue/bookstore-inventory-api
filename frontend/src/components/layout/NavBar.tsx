import { BookPlus, PackageSearch } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Brand } from './Brand';

const BASE_LINK =
  'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  isActive
    ? `${BASE_LINK} bg-accent-soft text-accent-strong`
    : `${BASE_LINK} text-ink-muted hover:bg-accent-soft/60 hover:text-ink`;

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Brand />
        </Link>

        <nav className="flex items-center gap-1" aria-label="Principal">
          <NavLink to="/" end className={linkClass}>
            <PackageSearch size={15} aria-hidden="true" />
            Inventario
          </NavLink>
          <NavLink to="/books/new" className={linkClass}>
            <BookPlus size={15} aria-hidden="true" />
            Añadir libro
          </NavLink>
          <span className="mx-1.5 h-5 w-px bg-line-strong" aria-hidden="true" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
