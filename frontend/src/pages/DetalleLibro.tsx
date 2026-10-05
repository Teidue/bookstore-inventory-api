import { Calculator, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DesglosePrecio } from '../components/books/DesglosePrecio';
import { DialogoConfirmacion } from '../components/ui/DialogoConfirmacion';
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina';
import { Cargando, ErrorVista } from '../components/ui/EstadoVista';
import { EtiquetaStock } from '../components/ui/EtiquetaStock';
import { MONEDA_LOCAL } from '../config';
import { useConsulta } from '../hooks/useConsulta';
import { useNotificaciones } from '../hooks/useNotificaciones';
import { booksServicio } from '../services/books.service';
import { ErrorPeticion } from '../services/clienteApi';
import type { Book, CalculoPrecio } from '../types/api';
import { formatearFecha, formatearMoneda, formatearUsd } from '../utils/formato';

export function DetalleLibro() {
  const { id = '' } = useParams();
  const idLibro = Number(id);
  const navegar = useNavigate();
  const { notificar } = useNotificaciones();

  const [calculo, setCalculo] = useState<CalculoPrecio | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [confirmandoEliminacion, setConfirmandoEliminacion] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const consultar = useCallback(
    (señal: AbortSignal) => booksServicio.obtener(idLibro, señal),
    [idLibro],
  );
  const { estado, recargar } = useConsulta<Book>(consultar, [idLibro]);

  const calcularPrecio = async () => {
    setCalculando(true);

    try {
      const resultado = await booksServicio.calcularPrecio(idLibro);
      setCalculo(resultado);
      notificar(
        'exito',
        `Precio calculado: ${formatearMoneda(resultado.selling_price_local, resultado.currency)}`,
        resultado.rate_source === 'fallback'
          ? 'Se ha usado la tasa de respaldo porque la API no respondió.'
          : `Tasa aplicada: 1 USD = ${resultado.exchange_rate} ${resultado.currency}`,
      );
      recargar();
    } catch (error) {
      notificar(
        'error',
        error instanceof ErrorPeticion && error.esServicioNoDisponible
          ? 'Servicio de tasas no disponible'
          : 'No se pudo calcular el precio',
        error instanceof ErrorPeticion ? error.message : 'Inténtalo de nuevo.',
      );
    } finally {
      setCalculando(false);
    }
  };

  const eliminar = async () => {
    setEliminando(true);

    try {
      await booksServicio.eliminar(idLibro);
      notificar('exito', 'Libro eliminado');
      navegar('/', { replace: true });
    } catch (error) {
      setConfirmandoEliminacion(false);
      notificar(
        'error',
        'No se pudo eliminar',
        error instanceof ErrorPeticion ? error.message : 'Inténtalo de nuevo.',
      );
    } finally {
      setEliminando(false);
    }
  };

  if (estado.situacion === 'cargando' && !estado.datos) {
    return <Cargando mensaje="Cargando libro..." />;
  }

  if (estado.situacion === 'error' && !estado.datos) {
    return (
      <>
        <EncabezadoPagina volver={{ a: '/', texto: 'Volver al inventario' }} titulo="Libro" />
        <ErrorVista error={estado.error} onReintentar={recargar}>
          <Link className="boton boton--secundario" to="/">
            Volver al inventario
          </Link>
        </ErrorVista>
      </>
    );
  }

  const libro = estado.datos;
  if (!libro) return null;

  return (
    <>
      <EncabezadoPagina
        volver={{ a: '/', texto: 'Volver al inventario' }}
        titulo={libro.title}
        subtitulo={`${libro.author} · ISBN ${libro.isbn}`}
        acciones={
          <>
            <Link className="boton boton--secundario" to={`/books/${libro.id}/edit`}>
              <Pencil size={16} aria-hidden="true" />
              Editar
            </Link>
            <button
              type="button"
              className="boton boton--peligro-suave"
              onClick={() => setConfirmandoEliminacion(true)}
            >
              <Trash2 size={16} aria-hidden="true" />
              Eliminar
            </button>
          </>
        }
      />

      <div className="detalle__rejilla">
        <div className="detalle__columna">
          <section className="tarjeta">
            <div className="tarjeta__cuerpo">
              <div className="cifra-destacada">
                <div>
                  <p className="cifra-destacada__etiqueta">Coste de importación</p>
                  <p className="cifra-destacada__valor">{formatearUsd(libro.cost_usd)}</p>
                </div>
                <EtiquetaStock cantidad={libro.stock_quantity} />
              </div>

              <dl className="lista-definiciones">
                <dt>Categoría</dt>
                <dd>{libro.category}</dd>

                <dt>País del proveedor</dt>
                <dd>{libro.supplier_country}</dd>

                <dt>Stock</dt>
                <dd>{libro.stock_quantity}</dd>

                <dt>Precio de venta</dt>
                <dd>
                  {libro.selling_price_local === null ? (
                    <span className="sin-precio">Sin calcular</span>
                  ) : (
                    formatearMoneda(libro.selling_price_local, MONEDA_LOCAL)
                  )}
                </dd>

                <dt>Alta</dt>
                <dd>{formatearFecha(libro.created_at)}</dd>

                <dt>Última actualización</dt>
                <dd>{formatearFecha(libro.updated_at)}</dd>
              </dl>
            </div>
          </section>
        </div>

        <aside className="detalle__columna">
          <section className="tarjeta">
            <div className="tarjeta__cabecera">
              <h2 className="tarjeta__titulo">
                <Calculator size={16} aria-hidden="true" />
                Precio de venta
              </h2>
            </div>
            <div className="tarjeta__cuerpo">
              {calculo ? (
                <DesglosePrecio calculo={calculo} />
              ) : (
                <p className="texto-secundario">
                  Calcula el precio sugerido con la tasa de cambio actual y un margen del 40%. El
                  resultado se guarda en el libro.
                </p>
              )}

              <button
                type="button"
                className="boton boton--bloque"
                onClick={calcularPrecio}
                disabled={calculando}
                style={{ marginTop: 16 }}
              >
                {calculando ? (
                  <>
                    <Loader2 size={16} className="icono-girando" aria-hidden="true" />
                    Consultando tasa...
                  </>
                ) : (
                  <>
                    <Calculator size={16} aria-hidden="true" />
                    {calculo ? 'Recalcular precio' : 'Calcular precio de venta'}
                  </>
                )}
              </button>
            </div>
          </section>
        </aside>
      </div>

      {confirmandoEliminacion && (
        <DialogoConfirmacion
          titulo="¿Eliminar este libro?"
          descripcion={
            <>
              Se eliminará <strong>{libro.title}</strong> del inventario. Esta acción no se puede
              deshacer.
            </>
          }
          textoConfirmar="Eliminar libro"
          textoProcesando="Eliminando..."
          procesando={eliminando}
          onConfirmar={eliminar}
          onCancelar={() => setConfirmandoEliminacion(false)}
        />
      )}
    </>
  );
}
