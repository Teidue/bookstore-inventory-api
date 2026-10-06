import { Calculator, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Book } from '../../types/api';
import { formatCurrency, formatUsd } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { StockBadge } from '../ui/StockBadge';
import { buttonStyles } from '../ui/button-styles';

interface BookRowProps {
  book: Book;
  currency: string;
  calculating: boolean;
  onCalculatePrice: (book: Book) => void;
  onDelete: (book: Book) => void;
}

const CELL = 'px-5 py-3.5 align-middle';
const NUMBER_CELL = `${CELL} text-right font-medium tabular-nums whitespace-nowrap`;

/** Fila de la tabla de inventario. */
export function BookRow({ book, currency, calculating, onCalculatePrice, onDelete }: BookRowProps) {
  return (
    <tr className="border-b border-slate-200 transition-colors last:border-b-0 hover:bg-slate-50" data-testid="book-row">
      <td className={CELL}>
        <Link
          to={`/books/${book.id}`}
          className="font-semibold text-slate-900 transition-colors hover:text-blue-700"
        >
          {book.title}
        </Link>
        <div className="mt-0.5 text-xs text-slate-500">
          {book.author} · ISBN {book.isbn}
        </div>
      </td>
      <td className={CELL}>
        <Badge>{book.category}</Badge>
      </td>
      <td className={CELL}>
        <StockBadge quantity={book.stock_quantity} />
      </td>
      <td className={NUMBER_CELL}>{formatUsd(book.cost_usd)}</td>
      <td className={NUMBER_CELL}>
        {book.selling_price_local === null ? (
          <span className="font-normal text-slate-400">Sin calcular</span>
        ) : (
          formatCurrency(book.selling_price_local, currency)
        )}
      </td>
      <td className={`${CELL} text-slate-600`}>{book.supplier_country}</td>
      <td className={CELL}>
        <div className="flex items-center justify-end gap-1.5">
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
            <span className="hidden sm:inline">Calcular precio</span>
          </button>

          <Link
            className={buttonStyles('secondary', 'icon')}
            to={`/books/${book.id}/edit`}
            aria-label={`Editar ${book.title}`}
            title="Editar"
          >
            <Pencil size={14} aria-hidden="true" />
          </Link>

          <button
            type="button"
            className={buttonStyles('dangerSoft', 'icon')}
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
