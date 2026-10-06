import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';

/** Marco común de todas las pantallas. */
export function Layout() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </>
  );
}
