import { Search, X } from 'lucide-react';
import { LOW_STOCK_THRESHOLD } from '../../config';
import type { BookFilters } from '../../types/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Field } from '../ui/Field';
import { inputStyles } from '../ui/input-styles';

interface BookFiltersPanelProps {
  filters: BookFilters;
  onChange: (changes: Partial<BookFilters>) => void;
  onClear: () => void;
  hasFilters: boolean;
}

/**
 * Panel de filtros del inventario.
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
  const onlyLowStock = filters.low_stock_threshold !== '';

  return (
    <Card className="mb-5">
      <div
        className="grid items-end gap-4 p-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,9rem)_auto]"
        aria-label="Filtros del inventario"
      >
        <Field id="filter-search" label="Buscar por título o autor">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
              size={16}
              aria-hidden="true"
            />
            <input
              id="filter-search"
              className={`${inputStyles()} pl-9`}
              type="search"
              placeholder="Cervantes, Clean Code..."
              value={filters.search}
              onChange={(event) => onChange({ search: event.target.value })}
            />
          </div>
        </Field>

        <Field id="filter-category" label="Categoría">
          <input
            id="filter-category"
            className={inputStyles()}
            placeholder="Todas"
            value={filters.category}
            onChange={(event) => onChange({ category: event.target.value })}
          />
        </Field>

        <Field id="filter-threshold" label="Umbral de stock bajo">
          <input
            id="filter-threshold"
            className={inputStyles()}
            type="number"
            min="0"
            step="1"
            placeholder={String(LOW_STOCK_THRESHOLD)}
            value={filters.low_stock_threshold}
            onChange={(event) => onChange({ low_stock_threshold: event.target.value })}
            disabled={!onlyLowStock}
          />
        </Field>

        <div className="flex items-end gap-3 pb-0.5">
          <label
            className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-semibold whitespace-nowrap text-slate-900"
            htmlFor="filter-low-stock"
          >
            <input
              id="filter-low-stock"
              type="checkbox"
              className="h-4 w-4 cursor-pointer accent-blue-600"
              checked={onlyLowStock}
              onChange={(event) =>
                onChange({
                  low_stock_threshold: event.target.checked ? String(LOW_STOCK_THRESHOLD) : '',
                })
              }
            />
            Solo stock bajo
          </label>

          <Button type="button" variant="ghost" onClick={onClear} disabled={!hasFilters}>
            <X size={16} aria-hidden="true" />
            Limpiar
          </Button>
        </div>
      </div>
    </Card>
  );
}
