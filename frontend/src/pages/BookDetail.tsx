import { Calculator, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PriceBreakdown } from '../components/books/PriceBreakdown';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { StockBadge } from '../components/ui/StockBadge';
import { ErrorView, Loading } from '../components/ui/ViewStates';
import { buttonStyles } from '../components/ui/button-styles';
import { LOCAL_CURRENCY } from '../config';
import { useQuery } from '../hooks/useQuery';
import { useToasts } from '../hooks/useToasts';
import { RequestError } from '../services/apiClient';
import { booksService } from '../services/books.service';
import type { Book, PriceCalculation } from '../types/api';
import { formatCurrency, formatDate, formatUsd } from '../utils/format';

/** Una línea de la ficha: etiqueta a la izquierda, dato a la derecha. */
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-[13px]">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{children}</dd>
    </div>
  );
}

export function BookDetail() {
  const { id = '' } = useParams();
  const bookId = Number(id);
  const navigate = useNavigate();
  const { notify } = useToasts();

  const [calculation, setCalculation] = useState<PriceCalculation | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchBook = useCallback((signal: AbortSignal) => booksService.get(bookId, signal), [bookId]);
  const { state, refetch } = useQuery<Book>(fetchBook, [bookId]);

  const calculatePrice = async () => {
    setCalculating(true);

    try {
      const result = await booksService.calculatePrice(bookId);
      setCalculation(result);
      notify(
        'success',
        `Precio calculado: ${formatCurrency(result.selling_price_local, result.currency)}`,
        result.rate_source === 'fallback'
          ? 'Se ha usado la tasa de respaldo porque la API no respondió.'
          : `Tasa aplicada: 1 USD = ${result.exchange_rate} ${result.currency}`,
      );
      refetch();
    } catch (error) {
      notify(
        'error',
        error instanceof RequestError && error.isServiceUnavailable
          ? 'Servicio de tasas no disponible'
          : 'No se pudo calcular el precio',
        error instanceof RequestError ? error.message : 'Inténtalo de nuevo.',
      );
    } finally {
      setCalculating(false);
    }
  };

  const remove = async () => {
    setDeleting(true);

    try {
      await booksService.remove(bookId);
      notify('success', 'Libro eliminado');
      navigate('/', { replace: true });
    } catch (error) {
      setConfirmingDeletion(false);
      notify(
        'error',
        'No se pudo eliminar',
        error instanceof RequestError ? error.message : 'Inténtalo de nuevo.',
      );
    } finally {
      setDeleting(false);
    }
  };

  if (state.status === 'loading' && !state.data) {
    return <Loading message="Cargando libro..." />;
  }

  if (state.status === 'error' && !state.data) {
    return (
      <>
        <PageHeader back={{ to: '/', label: 'Volver al inventario' }} title="Libro" />
        <ErrorView error={state.error} onRetry={refetch}>
          <Link className={buttonStyles('secondary')} to="/">
            Volver al inventario
          </Link>
        </ErrorView>
      </>
    );
  }

  const book = state.data;
  if (!book) return null;

  return (
    <>
      <PageHeader
        back={{ to: '/', label: 'Volver al inventario' }}
        title={book.title}
        subtitle={
          <>
            {book.author}
            <span className="mx-2 text-line-strong">·</span>
            <span className="tabular">ISBN {book.isbn}</span>
          </>
        }
        actions={
          <>
            <Link className={buttonStyles('secondary')} to={`/books/${book.id}/edit`}>
              <Pencil size={15} aria-hidden="true" />
              Editar
            </Link>
            <Button type="button" variant="secondary" onClick={() => setConfirmingDeletion(true)}>
              <Trash2 size={15} aria-hidden="true" />
              Eliminar
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardBody>
            {/* El coste es el dato del que cuelga todo lo demás de la pantalla,
                así que abre la ficha en lugar de ser un renglón más. */}
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-line pb-5">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.04em] text-ink-subtle uppercase">
                  Coste de importación
                </p>
                <p className="mt-2 text-[2rem] leading-none font-semibold tabular tracking-[-0.025em] text-ink">
                  {formatUsd(book.cost_usd)}
                </p>
              </div>
              <StockBadge quantity={book.stock_quantity} />
            </div>

            <dl className="divide-y divide-line" data-testid="book-details">
              <DetailRow label="Categoría">{book.category}</DetailRow>
              <DetailRow label="País del proveedor">{book.supplier_country}</DetailRow>
              <DetailRow label="Stock">
                <span className="tabular">{book.stock_quantity}</span>
              </DetailRow>
              <DetailRow label="Precio de venta">
                {book.selling_price_local === null ? (
                  <span className="font-normal text-ink-subtle">Sin calcular</span>
                ) : (
                  <span className="tabular">
                    {formatCurrency(book.selling_price_local, LOCAL_CURRENCY)}
                  </span>
                )}
              </DetailRow>
              <DetailRow label="Alta">{formatDate(book.created_at)}</DetailRow>
              <DetailRow label="Última actualización">{formatDate(book.updated_at)}</DetailRow>
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Precio de venta" icon={<Calculator size={15} aria-hidden="true" />} />
          <CardBody>
            {calculation ? (
              <PriceBreakdown calculation={calculation} />
            ) : (
              <p className="text-[13px] leading-relaxed text-ink-muted">
                Calcula el precio sugerido con la tasa de cambio actual y un margen del 40%. El
                resultado se guarda en el libro.
              </p>
            )}

            <Button
              type="button"
              className="mt-4 w-full"
              onClick={calculatePrice}
              disabled={calculating}
            >
              {calculating ? (
                <>
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                  Consultando tasa...
                </>
              ) : (
                <>
                  <Calculator size={15} aria-hidden="true" />
                  {calculation ? 'Recalcular precio' : 'Calcular precio de venta'}
                </>
              )}
            </Button>
          </CardBody>
        </Card>
      </div>

      {confirmingDeletion && (
        <ConfirmDialog
          title="¿Eliminar este libro?"
          description={
            <>
              Se eliminará <strong className="font-semibold text-ink">{book.title}</strong> del
              inventario. Esta acción no se puede deshacer.
            </>
          }
          confirmLabel="Eliminar libro"
          pendingLabel="Eliminando..."
          pending={deleting}
          onConfirm={remove}
          onCancel={() => setConfirmingDeletion(false)}
        />
      )}
    </>
  );
}
