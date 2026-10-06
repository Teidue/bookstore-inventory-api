import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../../types/api';

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

const STEP =
  'grid h-8 w-8 place-items-center rounded-md border border-line-strong bg-surface text-ink-muted ' +
  'transition-colors hover:border-ink-subtle/60 hover:text-ink disabled:pointer-events-none disabled:opacity-40';

const PAGE =
  'h-8 min-w-8 rounded-md px-2 text-[13px] font-medium tabular transition-colors ' +
  'text-ink-muted hover:bg-accent-soft hover:text-accent-strong';

const PAGE_CURRENT =
  'h-8 min-w-8 rounded-md px-2 text-[13px] font-semibold tabular bg-linear-to-b from-brand to-brand-strong text-white shadow-brand';

/**
 * Controles de página. Los números salen de `meta`, que el servidor calcula
 * con un COUNT: el cliente no sabe cuántos registros hay ni debe saberlo.
 */
export function Pagination({ meta, onPageChange, disabled = false }: PaginationProps) {
  if (meta.total_pages <= 1) return null;

  const from = Math.min((meta.page - 1) * meta.limit + 1, meta.total);
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3"
      aria-label="Paginación"
      data-testid="pagination"
    >
      <p className="text-[13px] text-ink-muted">
        <span className="font-medium tabular text-ink">
          {from}–{to}
        </span>{' '}
        de <span className="font-medium tabular text-ink">{meta.total}</span>
        <span className="mx-2 text-line-strong">·</span>
        Página {meta.page} de {meta.total_pages}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className={STEP}
          onClick={() => onPageChange(meta.page - 1)}
          disabled={disabled || meta.page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={15} aria-hidden="true" />
        </button>

        {visiblePages(meta.page, meta.total_pages).map((item, index) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-ink-subtle" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={item === meta.page ? PAGE_CURRENT : PAGE}
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
          className={STEP}
          onClick={() => onPageChange(meta.page + 1)}
          disabled={disabled || meta.page >= meta.total_pages}
          aria-label="Página siguiente"
        >
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
