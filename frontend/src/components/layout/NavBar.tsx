import { BookMarked, PackageSearch } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { Brand } from './Brand';

const BASE_LINK =
  'inline-flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  isActive
    ? `${BASE_LINK} bg-blue-50 text-blue-700`
    : `${BASE_LINK} text-slate-600 hover:bg-slate-100 hover:text-slate-900`;

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <Brand />
        </Link>

        <nav className="flex items-center gap-1" aria-label="Principal">
          <NavLink to="/" end className={linkClass}>
            <PackageSearch size={16} aria-hidden="true" />
            Inventario
          </NavLink>
          <NavLink to="/books/new" className={linkClass}>
            <BookMarked size={16} aria-hidden="true" />
            Añadir libro
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
