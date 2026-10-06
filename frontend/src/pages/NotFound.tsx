import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonStyles } from '../components/ui/button-styles';

export function NotFound() {
  return (
    <div className="flex flex-col items-center gap-2 py-20 text-center">
      <span className="text-5xl font-bold tracking-tight text-slate-300" aria-hidden="true">
        404
      </span>
      <h1 className="text-xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="text-sm text-slate-500">
        La dirección que buscas no existe o ya no está disponible.
      </p>
      <Link className={`${buttonStyles()} mt-3`} to="/">
        <ArrowLeft size={16} aria-hidden="true" />
        Volver al inventario
      </Link>
    </div>
  );
}
