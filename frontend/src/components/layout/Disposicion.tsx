import { Outlet } from 'react-router-dom';
import { BarraNavegacion } from './BarraNavegacion';

/** Marco común de todas las pantallas. */
export function Disposicion() {
  return (
    <>
      <BarraNavegacion />
      <main className="contenido">
        <Outlet />
      </main>
    </>
  );
}
