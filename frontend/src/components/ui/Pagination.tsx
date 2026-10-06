import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../../types/api';
import { buttonStyles } from './button-styles';

type Item = number | 'ellipsis';

/** Primera, última y vecinas de la actual, con elipsis entre medias. */
function visiblePages(current: number, total: number): Item[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages: Item[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('ellipsis');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 1) pages.push('ellipsis');
  pages.push(total);

  return pages;
}

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/**
 * Controles de página. Los números salen de `meta`, que el servidor calcula
 * con un COUNT: el cliente no sabe cuántos registros hay ni debe saberlo.
 */
export function Pagination({ meta, onPageChange, disabled = false }: PaginationProps) {
  if (meta.total_pages <= 1) return null;

  const from = Math.min((meta.page - 1) * meta.limit + 1, meta.total);
  const to = Math.min(meta.page * meta.limit, meta.total);
  const pageButton = buttonStyles('secondary', 'icon');

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3"
      aria-label="Paginación"
      data-testid="pagination"
    >
      <p className="text-[13px] text-slate-500">
        Mostrando{' '}
        <strong className="font-semibold text-slate-900">
          {from}–{to}
        </strong>{' '}
        de <strong className="font-semibold text-slate-900">{meta.total}</strong> · Página{' '}
        {meta.page} de {meta.total_pages}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className={pageButton}
          onClick={() => onPageChange(meta.page - 1)}
          disabled={disabled || meta.page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        {visiblePages(meta.page, meta.total_pages).map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-slate-400" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={
                item === meta.page
                  ? `${buttonStyles('primary', 'icon')} disabled:opacity-100`
                  : pageButton
              }
              onClick={() => onPageChange(item)}
              disabled={disabled || item === meta.page}
              aria-current={item === meta.page ? 'page' : undefined}
              aria-label={`Página ${item}`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          className={pageButton}
          onClick={() => onPageChange(meta.page + 1)}
          disabled={disabled || meta.page >= meta.total_pages}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
