import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MetadatosPaginacion } from '../../types/api';

type Elemento = number | 'elipsis';

/** Primera, última y vecinas de la actual, con elipsis entre medias. */
function paginasVisibles(actual: number, total: number): Elemento[] {
  if (total <= 7) return Array.from({ length: total }, (_, indice) => indice + 1);

  const paginas: Elemento[] = [1];
  const inicio = Math.max(2, actual - 1);
  const fin = Math.min(total - 1, actual + 1);

  if (inicio > 2) paginas.push('elipsis');
  for (let pagina = inicio; pagina <= fin; pagina += 1) paginas.push(pagina);
  if (fin < total - 1) paginas.push('elipsis');
  paginas.push(total);

  return paginas;
}

interface PropsPaginacion {
  meta: MetadatosPaginacion;
  onCambiarPagina: (page: number) => void;
  deshabilitado?: boolean;
}

/**
 * Controles de página.  Los números salen de `meta`, que el servidor calcula
 * con un COUNT: el cliente no sabe cuántos registros hay ni debe saberlo.
 */
export function Paginacion({ meta, onCambiarPagina, deshabilitado = false }: PropsPaginacion) {
  if (meta.total_pages <= 1) return null;

  const desde = Math.min((meta.page - 1) * meta.limit + 1, meta.total);
  const hasta = Math.min(meta.page * meta.limit, meta.total);

  return (
    <nav className="paginacion" aria-label="Paginación">
      <p className="paginacion__info">
        Mostrando{' '}
        <strong>
          {desde}–{hasta}
        </strong>{' '}
        de <strong>{meta.total}</strong> · Página {meta.page} de {meta.total_pages}
      </p>

      <div className="paginacion__controles">
        <button
          type="button"
          className="paginacion__pagina"
          onClick={() => onCambiarPagina(meta.page - 1)}
          disabled={deshabilitado || meta.page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        {paginasVisibles(meta.page, meta.total_pages).map((elemento, indice) =>
          elemento === 'elipsis' ? (
            <span key={`elipsis-${indice}`} className="paginacion__elipsis" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={elemento}
              type="button"
              className="paginacion__pagina"
              onClick={() => onCambiarPagina(elemento)}
              disabled={deshabilitado || elemento === meta.page}
              aria-current={elemento === meta.page ? 'page' : undefined}
              aria-label={`Página ${elemento}`}
            >
              {elemento}
            </button>
          ),
        )}

        <button
          type="button"
          className="paginacion__pagina"
          onClick={() => onCambiarPagina(meta.page + 1)}
          disabled={deshabilitado || meta.page >= meta.total_pages}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
