import { BookMarked, PackageSearch } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { Marca } from './Marca';

const claseEnlace = ({ isActive }: { isActive: boolean }): string =>
  isActive ? 'navegacion__enlace navegacion__enlace--activo' : 'navegacion__enlace';

export function BarraNavegacion() {
  return (
    <header className="barra">
      <div className="barra__interior">
        <Link to="/" className="marca">
          <Marca />
        </Link>

        <nav className="navegacion" aria-label="Principal">
          <NavLink to="/" end className={claseEnlace}>
            <PackageSearch size={16} aria-hidden="true" />
            Inventario
          </NavLink>
          <NavLink to="/books/new" className={claseEnlace}>
            <BookMarked size={16} aria-hidden="true" />
            Añadir libro
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
