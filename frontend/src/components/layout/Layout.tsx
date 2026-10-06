import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';

/** Marco común de todas las pantallas. */
export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-9">
        <Outlet />
      </main>
    </div>
  );
}
