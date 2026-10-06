import { Calculator, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Book } from '../../types/api';
import { Badge } from '../ui/Badge';
import { StockBadge } from '../ui/StockBadge';
import { buttonStyles } from '../ui/button-styles';
import { formatCurrency, formatUsd } from '../../utils/format';

interface BookRowProps {
  book: Book;
  currency: string;
  calculating: boolean;
  /** Posición en la página, para escalonar la animación de entrada. */
  index: number;
  onCalculatePrice: (book: Book) => void;
  onDelete: (book: Book) => void;
}

const CELL = 'px-5 py-3 align-middle';
const NUMBER_CELL = `${CELL} text-right tabular whitespace-nowrap`;

/** Fila de la tabla de inventario. */
export function BookRow({
  book,
  currency,
  calculating,
  index,
  onCalculatePrice,
  onDelete,
}: BookRowProps) {
  return (
    <tr
      className="animate-rise group border-b border-line transition-colors last:border-b-0 hover:bg-accent-soft/50"
      style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
      data-testid="book-row"
    >
      <td className={CELL}>
        <Link
          to={`/books/${book.id}`}
          title={book.title}
          className="block truncate rounded text-[14px] font-medium text-ink transition-colors hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          {book.title}
        </Link>
        <div className="mt-0.5 truncate text-[12px] text-ink-subtle">
          {book.author}
          <span className="mx-1.5 text-line-strong">·</span>
          <span className="tabular">{book.isbn}</span>
        </div>
      </td>
      <td className={`${CELL} overflow-hidden`}>
        <Badge>{book.category}</Badge>
      </td>
      <td className={CELL}>
        <StockBadge quantity={book.stock_quantity} />
      </td>
      <td className={`${NUMBER_CELL} text-ink-muted`}>{formatUsd(book.cost_usd)}</td>
      <td className={NUMBER_CELL}>
        {book.selling_price_local === null ? (
          <span className="text-[13px] text-ink-subtle">Sin calcular</span>
        ) : (
          <span className="font-medium text-ink">
            {formatCurrency(book.selling_price_local, currency)}
          </span>
        )}
      </td>
      <td className={`${CELL} text-[13px] text-ink-muted`}>{book.supplier_country}</td>
      <td className={`${CELL} pr-4`}>
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            className={buttonStyles('secondary', 'sm')}
            onClick={() => onCalculatePrice(book)}
            disabled={calculating}
            title="Calcular precio de venta con la tasa de cambio actual"
          >
            {calculating ? (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            ) : (
              <Calculator size={14} aria-hidden="true" />
            )}
            <span className="hidden lg:inline">Calcular precio</span>
          </button>

          {/* Las acciones secundarias quedan apagadas y sólo cobran contraste
              al apuntar la fila: con diez filas en pantalla, treinta controles
              a plena tinta compiten con los datos. */}
          <Link
            className={`${buttonStyles('ghost', 'iconSm')} text-ink-subtle group-hover:text-ink-muted`}
            to={`/books/${book.id}/edit`}
            aria-label={`Editar ${book.title}`}
            title="Editar"
          >
            <Pencil size={14} aria-hidden="true" />
          </Link>

          <button
            type="button"
            className={`${buttonStyles('dangerSoft', 'iconSm')} group-hover:text-ink-muted`}
            onClick={() => onDelete(book)}
            aria-label={`Eliminar ${book.title}`}
            title="Eliminar"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}
