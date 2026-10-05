import { CircleCheck, Calculator, Info } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormularioLibro } from '../components/books/FormularioLibro';
import {
  VALORES_VACIOS,
  aPayload,
  type ValoresFormularioLibro,
} from '../components/books/libro.utilidades';
import { EncabezadoPagina } from '../components/ui/EncabezadoPagina';
import { AlertaError } from '../components/ui/EstadoVista';
import { useNotificaciones } from '../hooks/useNotificaciones';
import { booksServicio } from '../services/books.service';
import { ErrorPeticion } from '../services/clienteApi';

export function NuevoLibro() {
  const navegar = useNavigate();
  const { notificar } = useNotificaciones();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (valores: ValoresFormularioLibro) => {
    setErrorServidor(null);
    setEnviando(true);

    try {
      const creado = await booksServicio.crear(aPayload(valores));
      notificar('exito', 'Libro añadido al inventario', creado.title);
      navegar(`/books/${creado.id}`, { replace: true });
    } catch (error) {
      // El ISBN duplicado sólo lo sabe el servidor (409): es justo el caso que
      // la validación de cliente no puede cubrir.
      const mensaje =
        error instanceof ErrorPeticion ? error.message : 'No se ha podido crear el libro.';
      setErrorServidor(mensaje);
      notificar('error', 'No se pudo crear el libro', mensaje);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <EncabezadoPagina
        volver={{ a: '/', texto: 'Volver al inventario' }}
        titulo="Añadir libro"
        subtitulo="Da de alta un ejemplar en el catálogo."
      />

      {errorServidor && <AlertaError mensaje={errorServidor} />}

      <div className="detalle__rejilla">
        <FormularioLibro
          valoresIniciales={VALORES_VACIOS}
          enviando={enviando}
          textoEnviar="Crear libro"
          onEnviar={enviar}
          onCancelar={() => navegar('/')}
        />

        <aside className="tarjeta">
          <div className="tarjeta__cabecera">
            <h2 className="tarjeta__titulo">
              <Info size={16} aria-hidden="true" />
              Cómo funciona
            </h2>
          </div>
          <div className="tarjeta__cuerpo">
            <ul className="lista-info">
              <li>
                <CircleCheck size={16} aria-hidden="true" />
                <div>
                  <strong>ISBN único</strong>
                  Da igual cómo escribas los guiones: el mismo ISBN no se puede repetir.
                </div>
              </li>
              <li>
                <Calculator size={16} aria-hidden="true" />
                <div>
                  <strong>El precio se calcula aparte</strong>
                  Nace vacío y se obtiene con la tasa de cambio del día más un 40% de margen.
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
