import { Search, X } from 'lucide-react';
import type { BookFilters } from '../../types/api';
import { inputStyles } from '../ui/input-styles';

interface BookFiltersPanelProps {
  filters: BookFilters;
  onChange: (changes: Partial<BookFilters>) => void;
  onClear: () => void;
  hasFilters: boolean;
}

const LABEL = 'mb-1.5 block text-[12px] font-medium text-ink-muted';

/**
 * Barra de filtros del inventario.
 *
 * Cada cambio reinicia la página a 1 y dispara una consulta nueva al servidor
 * (lo hace la página): no se filtra el array ya descargado, así que el total y
 * los resultados corresponden al catálogo completo, no a la página visible.
 */
export function BookFiltersPanel({
  filters,
  onChange,
  onClear,
  hasFilters,
}: BookFiltersPanelProps) {
  return (
    <div
      className="animate-rise mb-4 rounded-xl border border-line bg-surface p-4 shadow-card [animation-delay:180ms]"
      role="search"
      aria-label="Filtros del inventario"
    >
      <div className="grid items-end gap-3 md:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,9.5rem)_auto]">
        <div className="min-w-0">
          <label className={LABEL} htmlFor="filter-search">
            Buscar
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-subtle"
              size={15}
              aria-hidden="true"
            />
            <input
              id="filter-search"
              className={`${inputStyles()} pl-9`}
              type="search"
              placeholder="Título o autor..."
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
            />
          </div>
        </div>

        <div className="min-w-0">
          <label className={LABEL} htmlFor="filter-category">
            Categoría
          </label>
          <input
            id="filter-category"
            className={inputStyles()}
            placeholder="Todas"
            value={filters.category}
            onChange={(event) => onChange({ category: event.target.value })}
          />
        </div>

        <div className="min-w-0">
          <label className={LABEL} htmlFor="filter-threshold">
            Stock máximo
          </label>
          {/* Único control del umbral. Vacío significa «sin límite»; las
              tarjetas de resumen son atajos que rellenan este mismo campo. */}
          <input
            id="filter-threshold"
            className={`${inputStyles()} tabular`}
            type="number"
            min="0"
            step="1"
            placeholder="Sin límite"
            value={filters.low_stock_threshold}
            onChange={(event) => onChange({ low_stock_threshold: event.target.value })}
          />
        </div>

        {/* El botón sólo aparece cuando hay algo que limpiar: un control
            permanentemente deshabilitado es ruido en una barra estrecha. */}
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-9.5 items-center gap-1 rounded-md px-1.5 text-[13px] font-medium whitespace-nowrap text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <X size={14} aria-hidden="true" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
