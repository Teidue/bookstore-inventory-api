import { BookPlus, Loader2, PackageSearch, SearchX } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookFiltersPanel } from '../components/books/BookFiltersPanel';
import { BookRow } from '../components/books/BookRow';
import { Button } from '../components/ui/Button';
import { Card, CardFooter } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageHeader } from '../components/ui/PageHeader';
import { Pagination } from '../components/ui/Pagination';
import { SkeletonRows } from '../components/ui/Skeletons';
import { EmptyState, ErrorView } from '../components/ui/ViewStates';
import { buttonStyles } from '../components/ui/button-styles';
import { LOCAL_CURRENCY } from '../config';
import { useDebounce } from '../hooks/useDebounce';
import { useQuery } from '../hooks/useQuery';
import { useToasts } from '../hooks/useToasts';
import { RequestError } from '../services/apiClient';
import { booksService } from '../services/books.service';
import type { Book, BookFilters, PaginatedResponse } from '../types/api';
import { formatCurrency } from '../utils/format';

const INITIAL_FILTERS: BookFilters = {
  page: 1,
  limit: 10,
  category: '',
  search: '',
  low_stock_threshold: '',
};

/** Traduce el error de la API a un aviso que el usuario pueda entender. */
function errorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof RequestError)) return fallback;
  return error.message;
}

const HEADER_CELL =
  'px-5 py-3 text-left text-xs font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase';

export function Dashboard() {
  const { notify } = useToasts();
  const [filters, setFilters] = useState<BookFilters>(INITIAL_FILTERS);
  const [pendingDeletion, setPendingDeletion] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [calculatingId, setCalculatingId] = useState<number | null>(null);

  // El texto se aplica con retardo; el resto de filtros, al instante.
  const search = useDebounce(filters.search);
  const category = useDebounce(filters.category);

  const fetchBooks = useCallback(
    (signal: AbortSignal) => booksService.list({ ...filters, search, category }, signal),
    [filters, search, category],
  );

  const { state, refetch } = useQuery<PaginatedResponse<Book>>(fetchBooks, [
    filters.page,
    filters.limit,
    filters.low_stock_threshold,
    search,
    category,
  ]);

  /**
   * Cualquier cambio de filtro vuelve a la página 1: quedarse en la página 4
   * de un resultado que ahora tiene 2 mostraría una lista vacía que el usuario
   * no sabría interpretar.
   */
  const changeFilters = useCallback((changes: Partial<BookFilters>) => {
    setFilters((previous) => ({ ...previous, ...changes, page: 1 }));
  }, []);

  const changePage = useCallback((page: number) => {
    setFilters((previous) => ({ ...previous, page }));
  }, []);

  const calculatePrice = useCallback(
    async (book: Book) => {
      setCalculatingId(book.id);

      try {
        const calculation = await booksService.calculatePrice(book.id);
        notify(
          'success',
          `Precio calculado: ${formatCurrency(calculation.selling_price_local, calculation.currency)}`,
          `${book.title} · tasa ${calculation.exchange_rate} ${calculation.currency}/USD` +
            (calculation.rate_source === 'fallback' ? ' (tasa de respaldo)' : ''),
        );
        refetch();
      } catch (error) {
        notify(
          'error',
          error instanceof RequestError && error.isServiceUnavailable
            ? 'Servicio de tasas no disponible'
            : 'No se pudo calcular el precio',
          errorMessage(error, 'Inténtalo de nuevo en unos segundos.'),
        );
      } finally {
        setCalculatingId(null);
      }
    },
    [notify, refetch],
  );

  const confirmDeletion = useCallback(async () => {
    if (!pendingDeletion) return;
    setDeleting(true);

    try {
      await booksService.remove(pendingDeletion.id);
      notify('success', 'Libro eliminado', pendingDeletion.title);
      refetch();
    } catch (error) {
      notify('error', 'No se pudo eliminar', errorMessage(error, 'Inténtalo de nuevo.'));
    } finally {
      setDeleting(false);
      setPendingDeletion(null);
    }
  }, [pendingDeletion, notify, refetch]);

  const result = state.data;
  const hasFilters =
    filters.search !== '' || filters.category !== '' || filters.low_stock_threshold !== '';

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle="Catálogo de libros. Los filtros y la paginación se resuelven en el servidor."
        actions={
          <Link className={buttonStyles()} to="/books/new">
            <BookPlus size={16} aria-hidden="true" />
            Añadir libro
          </Link>
        }
      />

      <BookFiltersPanel
        filters={filters}
        onChange={changeFilters}
        onClear={() => setFilters(INITIAL_FILTERS)}
        hasFilters={hasFilters}
      />

      {result && (
        <div
          className="mb-3 flex items-center justify-between gap-3 text-[13px] text-slate-500"
          data-testid="results-summary"
        >
          <p>
            <strong className="font-semibold text-slate-900">{result.meta.total}</strong>{' '}
            {result.meta.total === 1 ? 'libro' : 'libros'}
            {hasFilters && ' con los filtros aplicados'}
          </p>
          {state.status === 'loading' && (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              Actualizando...
            </span>
          )}
        </div>
      )}

      {state.status === 'error' && !result && <ErrorView error={state.error} onRetry={refetch} />}

      {(result || state.status === 'loading') && (
        <Card>
          {state.status === 'loading' && !result && (
            <SkeletonRows message="Cargando inventario..." />
          )}

          {result && result.data.length === 0 && (
            <EmptyState
              icon={hasFilters ? SearchX : PackageSearch}
              variant="plain"
              title={hasFilters ? 'Ningún libro coincide con los filtros' : 'El inventario está vacío'}
              description={
                hasFilters
                  ? 'Prueba a cambiar la categoría o a quitar el filtro de stock bajo.'
                  : 'Añade el primer libro para empezar a gestionar el catálogo.'
              }
            >
              {hasFilters ? (
                <Button type="button" variant="secondary" onClick={() => setFilters(INITIAL_FILTERS)}>
                  Limpiar filtros
                </Button>
              ) : (
                <Link className={buttonStyles()} to="/books/new">
                  <BookPlus size={16} aria-hidden="true" />
                  Añadir libro
                </Link>
              )}
            </EmptyState>
          )}

          {result && result.data.length > 0 && (
            <>
              <div className="overflow-x-auto" aria-busy={state.status === 'loading'}>
                <table className="w-full border-collapse text-sm" data-testid="books-table">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th scope="col" className={HEADER_CELL}>
                        Libro
                      </th>
                      <th scope="col" className={HEADER_CELL}>
                        Categoría
                      </th>
                      <th scope="col" className={HEADER_CELL}>
                        Inventario
                      </th>
                      <th scope="col" className={`${HEADER_CELL} text-right`}>
                        Coste
                      </th>
                      <th scope="col" className={`${HEADER_CELL} text-right`}>
                        Precio de venta
                      </th>
                      <th scope="col" className={HEADER_CELL}>
                        País
                      </th>
                      <th scope="col" className={HEADER_CELL}>
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.map((book) => (
                      <BookRow
                        key={book.id}
                        book={book}
                        currency={LOCAL_CURRENCY}
                        calculating={calculatingId === book.id}
                        onCalculatePrice={calculatePrice}
                        onDelete={setPendingDeletion}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {result.meta.total_pages > 1 && (
                <CardFooter>
                  <Pagination
                    meta={result.meta}
                    onPageChange={changePage}
                    disabled={state.status === 'loading'}
                  />
                </CardFooter>
              )}
            </>
          )}
        </Card>
      )}

      {pendingDeletion && (
        <ConfirmDialog
          title="¿Eliminar este libro?"
          description={
            <>
              Se eliminará <strong>{pendingDeletion.title}</strong> del inventario. Esta acción no
              se puede deshacer.
            </>
          }
          confirmLabel="Eliminar libro"
          pendingLabel="Eliminando..."
          pending={deleting}
          onConfirm={confirmDeletion}
          onCancel={() => setPendingDeletion(null)}
        />
      )}
    </>
  );
}
