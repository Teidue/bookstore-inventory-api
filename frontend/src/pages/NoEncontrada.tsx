import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function NoEncontrada() {
  return (
    <div className="no-encontrada">
      <span className="no-encontrada__codigo" aria-hidden="true">
        404
      </span>
      <h1>Página no encontrada</h1>
      <p className="texto-secundario">La dirección que buscas no existe o ya no está disponible.</p>
      <Link className="boton" to="/">
        <ArrowLeft size={16} aria-hidden="true" />
        Volver al inventario
      </Link>
    </div>
  );
}
