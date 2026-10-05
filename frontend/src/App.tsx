import { Route, Routes } from 'react-router-dom';
import { Disposicion } from './components/layout/Disposicion';
import { Dashboard } from './pages/Dashboard';
import { DetalleLibro } from './pages/DetalleLibro';
import { EditarLibro } from './pages/EditarLibro';
import { NoEncontrada } from './pages/NoEncontrada';
import { NuevoLibro } from './pages/NuevoLibro';

export function App() {
  return (
    <Routes>
      <Route element={<Disposicion />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/books/new" element={<NuevoLibro />} />
        <Route path="/books/:id" element={<DetalleLibro />} />
        <Route path="/books/:id/edit" element={<EditarLibro />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
