import { Calculator, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Book } from '../../types/api';
import { formatearMoneda, formatearUsd } from '../../utils/formato';
import { EtiquetaStock } from '../ui/EtiquetaStock';

interface PropsFilaLibro {
  libro: Book;
  moneda: string;
  calculando: boolean;
  onCalcularPrecio: (libro: Book) => void;
  onEliminar: (libro: Book) => void;
}

/** Fila de la tabla de inventario. */
export function FilaLibro({
  libro,
  moneda,
  calculando,
  onCalcularPrecio,
  onEliminar,
}: PropsFilaLibro) {
  return (
    <tr>
      <td>
        <div className="celda-libro__titulo">
          <Link to={`/books/${libro.id}`}>{libro.title}</Link>
        </div>
        <div className="celda-libro__meta">
          {libro.author} · ISBN {libro.isbn}
        </div>
      </td>
      <td>
        <span className="etiqueta etiqueta--neutra etiqueta--sin-punto">{libro.category}</span>
      </td>
      <td>
        <EtiquetaStock cantidad={libro.stock_quantity} />
      </td>
      <td className="celda-numero">{formatearUsd(libro.cost_usd)}</td>
      <td className="celda-numero">
        {libro.selling_price_local === null ? (
          <span className="sin-precio">Sin calcular</span>
        ) : (
          formatearMoneda(libro.selling_price_local, moneda)
        )}
      </td>
      <td>{libro.supplier_country}</td>
      <td>
        <div className="celda-acciones">
          <button
            type="button"
            className="boton boton--secundario boton--pequeno"
            onClick={() => onCalcularPrecio(libro)}
            disabled={calculando}
            title="Calcular precio de venta con la tasa de cambio actual"
          >
            {calculando ? (
              <Loader2 size={14} className="icono-girando" aria-hidden="true" />
            ) : (
              <Calculator size={14} aria-hidden="true" />
            )}
            <span className="oculto-movil">Calcular precio</span>
          </button>

          <Link
            className="boton boton--secundario boton--icono"
            to={`/books/${libro.id}/edit`}
            aria-label={`Editar ${libro.title}`}
            title="Editar"
          >
            <Pencil size={14} aria-hidden="true" />
          </Link>

          <button
            type="button"
            className="boton boton--peligro-suave boton--icono"
            onClick={() => onEliminar(libro)}
            aria-label={`Eliminar ${libro.title}`}
            title="Eliminar"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}
