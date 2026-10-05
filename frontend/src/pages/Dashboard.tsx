import { BookPlus, Loader2, PackageSearch, SearchX } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilaLibro } from '../components/books/FilaLibro';
import { FiltrosLibrosPanel } from '../components/books/FiltrosLibros';
import { DialogoConfirmacion } from '../components/ui/DialogoConfirmacion';
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina';
import { EsqueletoFilas } from '../components/ui/Esqueletos';
import { ErrorVista, Vacio } from '../components/ui/EstadoVista';
import { Paginacion } from '../components/ui/Paginacion';
import { MONEDA_LOCAL } from '../config';
import { useConsulta } from '../hooks/useConsulta';
import { useNotificaciones } from '../hooks/useNotificaciones';
import { useRetardo } from '../hooks/useRetardo';
import { booksServicio } from '../services/books.service';
import { ErrorPeticion } from '../services/clienteApi';
import type { Book, FiltrosLibros, RespuestaPaginada } from '../types/api';
import { formatearMoneda } from '../utils/formato';

const FILTROS_INICIALES: FiltrosLibros = {
  page: 1,
  limit: 10,
  category: '',
  search: '',
  low_stock_threshold: '',
};

/** Traduce el error de la API a un aviso que el usuario pueda entender. */
function mensajeDeError(error: unknown, porDefecto: string): string {
  if (!(error instanceof ErrorPeticion)) return porDefecto;
  return error.message;
}

export function Dashboard() {
  const { notificar } = useNotificaciones();
  const [filtros, setFiltros] = useState<FiltrosLibros>(FILTROS_INICIALES);
  const [pendienteDeEliminar, setPendienteDeEliminar] = useState<Book | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [calculandoId, setCalculandoId] = useState<number | null>(null);

  // El texto se aplica con retardo; el resto de filtros, al instante.
  const busqueda = useRetardo(filtros.search);
  const categoria = useRetardo(filtros.category);

  const consultar = useCallback(
    (señal: AbortSignal) =>
      booksServicio.listar({ ...filtros, search: busqueda, category: categoria }, señal),
    [filtros, busqueda, categoria],
  );

  const { estado, recargar } = useConsulta<RespuestaPaginada<Book>>(consultar, [
    filtros.page,
    filtros.limit,
    filtros.low_stock_threshold,
    busqueda,
    categoria,
  ]);

  /**
   * Cualquier cambio de filtro vuelve a la página 1: quedarse en la página 4
   * de un resultado que ahora tiene 2 mostraría una lista vacía que el usuario
   * no sabría interpretar.
   */
  const cambiarFiltros = useCallback((cambios: Partial<FiltrosLibros>) => {
    setFiltros((anterior) => ({ ...anterior, ...cambios, page: 1 }));
  }, []);

  const cambiarPagina = useCallback((page: number) => {
    setFiltros((anterior) => ({ ...anterior, page }));
  }, []);

  const calcularPrecio = useCallback(
    async (libro: Book) => {
      setCalculandoId(libro.id);

      try {
        const calculo = await booksServicio.calcularPrecio(libro.id);
        notificar(
          'exito',
          `Precio calculado: ${formatearMoneda(calculo.selling_price_local, calculo.currency)}`,
          `${libro.title} · tasa ${calculo.exchange_rate} ${calculo.currency}/USD` +
            (calculo.rate_source === 'fallback' ? ' (tasa de respaldo)' : ''),
        );
        recargar();
      } catch (error) {
        notificar(
          'error',
          error instanceof ErrorPeticion && error.esServicioNoDisponible
            ? 'Servicio de tasas no disponible'
            : 'No se pudo calcular el precio',
          mensajeDeError(error, 'Inténtalo de nuevo en unos segundos.'),
        );
      } finally {
        setCalculandoId(null);
      }
    },
    [notificar, recargar],
  );

  const confirmarEliminacion = useCallback(async () => {
    if (!pendienteDeEliminar) return;
    setEliminando(true);

    try {
      await booksServicio.eliminar(pendienteDeEliminar.id);
      notificar('exito', 'Libro eliminado', pendienteDeEliminar.title);
      recargar();
    } catch (error) {
      notificar('error', 'No se pudo eliminar', mensajeDeError(error, 'Inténtalo de nuevo.'));
    } finally {
      setEliminando(false);
      setPendienteDeEliminar(null);
    }
  }, [pendienteDeEliminar, notificar, recargar]);

  const resultado = estado.datos;
  const hayFiltros =
    filtros.search !== '' || filtros.category !== '' || filtros.low_stock_threshold !== '';

  return (
    <>
      <EncabezadoPagina
        titulo="Inventario"
        subtitulo="Catálogo de libros. Los filtros y la paginación se resuelven en el servidor."
        acciones={
          <Link className="boton" to="/books/new">
            <BookPlus size={16} aria-hidden="true" />
            Añadir libro
          </Link>
        }
      />

      <FiltrosLibrosPanel
        filtros={filtros}
        onCambiar={cambiarFiltros}
        onLimpiar={() => setFiltros(FILTROS_INICIALES)}
        hayFiltros={hayFiltros}
      />

      {resultado && (
        <div className="resumen-resultados">
          <p>
            <strong>{resultado.meta.total}</strong>{' '}
            {resultado.meta.total === 1 ? 'libro' : 'libros'}
            {hayFiltros && ' con los filtros aplicados'}
          </p>
          {estado.situacion === 'cargando' && (
            <span className="actualizando">
              <Loader2 size={14} className="icono-girando" aria-hidden="true" />
              Actualizando...
            </span>
          )}
        </div>
      )}

      {estado.situacion === 'error' && !resultado && (
        <ErrorVista error={estado.error} onReintentar={recargar} />
      )}

      <section className="tarjeta">
        {estado.situacion === 'cargando' && !resultado && (
          <EsqueletoFilas mensaje="Cargando inventario..." />
        )}

        {resultado && resultado.data.length === 0 && (
          <Vacio
            icono={hayFiltros ? SearchX : PackageSearch}
            variante="plano"
            titulo={
              hayFiltros ? 'Ningún libro coincide con los filtros' : 'El inventario está vacío'
            }
            descripcion={
              hayFiltros
                ? 'Prueba a cambiar la categoría o a quitar el filtro de stock bajo.'
                : 'Añade el primer libro para empezar a gestionar el catálogo.'
            }
          >
            {hayFiltros ? (
              <button
                type="button"
                className="boton boton--secundario"
                onClick={() => setFiltros(FILTROS_INICIALES)}
              >
                Limpiar filtros
              </button>
            ) : (
              <Link className="boton" to="/books/new">
                <BookPlus size={16} aria-hidden="true" />
                Añadir libro
              </Link>
            )}
          </Vacio>
        )}

        {resultado && resultado.data.length > 0 && (
          <>
            <div className="contenedor-tabla" aria-busy={estado.situacion === 'cargando'}>
              <table className="tabla">
                <thead>
                  <tr>
                    <th scope="col">Libro</th>
                    <th scope="col">Categoría</th>
                    <th scope="col">Inventario</th>
                    <th scope="col" className="celda-numero">
                      Coste
                    </th>
                    <th scope="col" className="celda-numero">
                      Precio de venta
                    </th>
                    <th scope="col">País</th>
                    <th scope="col">
                      <span className="solo-lectores">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.data.map((libro) => (
                    <FilaLibro
                      key={libro.id}
                      libro={libro}
                      moneda={MONEDA_LOCAL}
                      calculando={calculandoId === libro.id}
                      onCalcularPrecio={calcularPrecio}
                      onEliminar={setPendienteDeEliminar}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {resultado.meta.total_pages > 1 && (
              <div className="tarjeta__pie">
                <Paginacion
                  meta={resultado.meta}
                  onCambiarPagina={cambiarPagina}
                  deshabilitado={estado.situacion === 'cargando'}
                />
              </div>
            )}
          </>
        )}
      </section>

      {pendienteDeEliminar && (
        <DialogoConfirmacion
          titulo="¿Eliminar este libro?"
          descripcion={
            <>
              Se eliminará <strong>{pendienteDeEliminar.title}</strong> del inventario. Esta acción
              no se puede deshacer.
            </>
          }
          textoConfirmar="Eliminar libro"
          textoProcesando="Eliminando..."
          procesando={eliminando}
          onConfirmar={confirmarEliminacion}
          onCancelar={() => setPendienteDeEliminar(null)}
        />
      )}
    </>
  );
}
