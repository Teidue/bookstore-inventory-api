import { Search, X } from 'lucide-react';
import type { FiltrosLibros } from '../../types/api';
import { UMBRAL_STOCK_BAJO } from '../ui/EtiquetaStock';

interface PropsFiltros {
  filtros: FiltrosLibros;
  onCambiar: (cambios: Partial<FiltrosLibros>) => void;
  onLimpiar: () => void;
  hayFiltros: boolean;
}

/**
 * Panel de filtros del inventario.
 *
 * Cada cambio reinicia la página a 1 y dispara una consulta nueva al servidor
 * (lo hace la página): no se filtra el array ya descargado, así que el total y
 * los resultados corresponden al catálogo completo, no a la página visible.
 */
export function FiltrosLibrosPanel({ filtros, onCambiar, onLimpiar, hayFiltros }: PropsFiltros) {
  const soloStockBajo = filtros.low_stock_threshold !== '';

  return (
    <section className="tarjeta panel-filtros" aria-label="Filtros del inventario">
      <div className="panel-filtros__fila">
        <div className="campo">
          <label className="campo__etiqueta" htmlFor="filtro-busqueda">
            Buscar por título o autor
          </label>
          <div className="control control--con-icono">
            <Search className="control__icono" size={16} aria-hidden="true" />
            <input
              id="filtro-busqueda"
              className="campo__control"
              type="search"
              placeholder="Cervantes, Clean Code..."
              value={filtros.search}
              onChange={(evento) => onCambiar({ search: evento.target.value })}
            />
          </div>
        </div>

        <div className="campo">
          <label className="campo__etiqueta" htmlFor="filtro-categoria">
            Categoría
          </label>
          <input
            id="filtro-categoria"
            className="campo__control"
            placeholder="Todas"
            value={filtros.category}
            onChange={(evento) => onCambiar({ category: evento.target.value })}
          />
        </div>

        <div className="campo">
          <label className="campo__etiqueta" htmlFor="filtro-umbral">
            Umbral de stock bajo
          </label>
          <input
            id="filtro-umbral"
            className="campo__control"
            type="number"
            min="0"
            step="1"
            placeholder={String(UMBRAL_STOCK_BAJO)}
            value={filtros.low_stock_threshold}
            onChange={(evento) => onCambiar({ low_stock_threshold: evento.target.value })}
            disabled={!soloStockBajo}
          />
        </div>

        <div className="panel-filtros__opcion">
          <label className="interruptor" htmlFor="filtro-stock-bajo">
            <input
              id="filtro-stock-bajo"
              type="checkbox"
              checked={soloStockBajo}
              onChange={(evento) =>
                onCambiar({
                  low_stock_threshold: evento.target.checked ? String(UMBRAL_STOCK_BAJO) : '',
                })
              }
            />
            Solo stock bajo
          </label>

          <button
            type="button"
            className="boton boton--fantasma"
            onClick={onLimpiar}
            disabled={!hayFiltros}
          >
            <X size={16} aria-hidden="true" />
            Limpiar
          </button>
        </div>
      </div>
    </section>
  );
}
