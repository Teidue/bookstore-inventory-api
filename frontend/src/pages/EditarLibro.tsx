import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FormularioLibro } from '../components/books/FormularioLibro';
import {
  aPayload,
  aValoresFormulario,
  type ValoresFormularioLibro,
} from '../components/books/libro.utilidades';
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina';
import { AlertaError, Cargando, ErrorVista } from '../components/ui/EstadoVista';
import { useConsulta } from '../hooks/useConsulta';
import { useNotificaciones } from '../hooks/useNotificaciones';
import { booksServicio } from '../services/books.service';
import { ErrorPeticion } from '../services/clienteApi';
import type { Book } from '../types/api';

export function EditarLibro() {
  const { id = '' } = useParams();
  const idLibro = Number(id);
  const navegar = useNavigate();
  const { notificar } = useNotificaciones();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const consultar = useCallback(
    (señal: AbortSignal) => booksServicio.obtener(idLibro, señal),
    [idLibro],
  );
  const { estado, recargar } = useConsulta<Book>(consultar, [idLibro]);

  if (estado.situacion === 'cargando' && !estado.datos) {
    return <Cargando mensaje="Cargando libro..." />;
  }

  if (estado.situacion === 'error' && !estado.datos) {
    return (
      <>
        <EncabezadoPagina volver={{ a: '/', texto: 'Volver al inventario' }} titulo="Editar libro" />
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

  const enviar = async (valores: ValoresFormularioLibro) => {
    setErrorServidor(null);
    setEnviando(true);

    try {
      await booksServicio.actualizar(idLibro, aPayload(valores));
      notificar('exito', 'Cambios guardados', valores.title);
      navegar(`/books/${idLibro}`, { replace: true });
    } catch (error) {
      const mensaje =
        error instanceof ErrorPeticion ? error.message : 'No se han podido guardar los cambios.';
      setErrorServidor(mensaje);
      notificar('error', 'No se pudo guardar', mensaje);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <EncabezadoPagina
        volver={{ a: `/books/${idLibro}`, texto: 'Volver al detalle' }}
        titulo="Editar libro"
        subtitulo={libro.title}
      />

      {errorServidor && <AlertaError mensaje={errorServidor} />}

      <FormularioLibro
        valoresIniciales={aValoresFormulario(libro)}
        enviando={enviando}
        textoEnviar="Guardar cambios"
        onEnviar={enviar}
        onCancelar={() => navegar(`/books/${idLibro}`)}
      />
    </>
  );
}
