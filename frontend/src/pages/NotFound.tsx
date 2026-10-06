import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buttonStyles } from '../components/ui/button-styles';

export function NotFound() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <span
        className="text-[3.5rem] leading-none font-semibold tabular tracking-[-0.03em] text-line-strong"
        aria-hidden="true"
      >
        404
      </span>
      <h1 className="mt-4 text-[1.25rem] font-semibold tracking-[-0.02em] text-ink">
        Página no encontrada
      </h1>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-muted">
        La dirección que buscas no existe o ya no está disponible.
      </p>
      <Link className={`${buttonStyles()} mt-5`} to="/">
        <ArrowLeft size={15} aria-hidden="true" />
        Volver al inventario
      </Link>
    </div>
  );
}
