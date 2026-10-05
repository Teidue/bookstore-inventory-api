import { BookOpen, Loader2, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Campo } from '../ui/Campo';
import {
  validarFormularioLibro,
  type ErroresFormulario,
  type ValoresFormularioLibro,
} from './libro.utilidades';

interface PropsFormularioLibro {
  valoresIniciales: ValoresFormularioLibro;
  enviando: boolean;
  textoEnviar: string;
  onEnviar: (valores: ValoresFormularioLibro) => void;
  onCancelar: () => void;
}

const claseControl = (error?: string): string =>
  error ? 'campo__control campo__control--invalido' : 'campo__control';

export function FormularioLibro({
  valoresIniciales,
  enviando,
  textoEnviar,
  onEnviar,
  onCancelar,
}: PropsFormularioLibro) {
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [tocado, setTocado] = useState(false);

  const actualizar = (campo: keyof ValoresFormularioLibro, valor: string) => {
    const siguientes = { ...valores, [campo]: valor };
    setValores(siguientes);
    // Sólo se revalida en vivo tras el primer envío, para no llenar de rojo un
    // formulario que el usuario todavía está rellenando.
    if (tocado) setErrores(validarFormularioLibro(siguientes));
  };

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    setTocado(true);

    const erroresActuales = validarFormularioLibro(valores);
    setErrores(erroresActuales);

    if (Object.keys(erroresActuales).length === 0) onEnviar(valores);
  };

  return (
    <form className="tarjeta" onSubmit={enviar} noValidate>
      <div className="formulario__seccion">
        <h2 className="formulario__seccion-titulo">Identificación</h2>
        <p className="formulario__seccion-descripcion">Título, autor e ISBN del ejemplar.</p>

        <div className="formulario__campos">
          <Campo id="title" etiqueta="Título" error={errores.title}>
            <input
              id="title"
              className={claseControl(errores.title)}
              placeholder="El Quijote"
              value={valores.title}
              onChange={(evento) => actualizar('title', evento.target.value)}
              aria-invalid={Boolean(errores.title)}
              aria-describedby={errores.title ? 'title-error' : undefined}
            />
          </Campo>

          <div className="formulario__campos formulario__campos--dos">
            <Campo id="author" etiqueta="Autor" error={errores.author}>
              <input
                id="author"
                className={claseControl(errores.author)}
                placeholder="Miguel de Cervantes"
                value={valores.author}
                onChange={(evento) => actualizar('author', evento.target.value)}
                aria-invalid={Boolean(errores.author)}
              />
            </Campo>

            <Campo
              id="isbn"
              etiqueta="ISBN"
              error={errores.isbn}
              ayuda="10 o 13 dígitos. Los guiones se admiten."
            >
              <div className="control control--con-icono">
                <BookOpen className="control__icono" size={16} aria-hidden="true" />
                <input
                  id="isbn"
                  className={claseControl(errores.isbn)}
                  placeholder="978-84-376-0494-7"
                  value={valores.isbn}
                  onChange={(evento) => actualizar('isbn', evento.target.value)}
                  aria-invalid={Boolean(errores.isbn)}
                  aria-describedby={errores.isbn ? 'isbn-error' : 'isbn-ayuda'}
                />
              </div>
            </Campo>
          </div>
        </div>
      </div>

      <div className="formulario__seccion">
        <h2 className="formulario__seccion-titulo">Inventario y origen</h2>
        <p className="formulario__seccion-descripcion">
          Categoría, existencias y país del proveedor.
        </p>

        <div className="formulario__campos formulario__campos--dos">
          <Campo id="category" etiqueta="Categoría" error={errores.category}>
            <input
              id="category"
              className={claseControl(errores.category)}
              placeholder="Literatura Clásica"
              value={valores.category}
              onChange={(evento) => actualizar('category', evento.target.value)}
              aria-invalid={Boolean(errores.category)}
            />
          </Campo>

          <Campo id="stock_quantity" etiqueta="Stock" error={errores.stock_quantity}>
            <input
              id="stock_quantity"
              type="number"
              min="0"
              step="1"
              className={claseControl(errores.stock_quantity)}
              value={valores.stock_quantity}
              onChange={(evento) => actualizar('stock_quantity', evento.target.value)}
              aria-invalid={Boolean(errores.stock_quantity)}
            />
          </Campo>

          <Campo
            id="supplier_country"
            etiqueta="País del proveedor"
            error={errores.supplier_country}
            ayuda="Código ISO de 2 letras: ES, MX, US..."
          >
            <input
              id="supplier_country"
              className={claseControl(errores.supplier_country)}
              placeholder="ES"
              maxLength={2}
              value={valores.supplier_country}
              onChange={(evento) =>
                actualizar('supplier_country', evento.target.value.toUpperCase())
              }
              aria-invalid={Boolean(errores.supplier_country)}
            />
          </Campo>
        </div>
      </div>

      <div className="formulario__seccion">
        <h2 className="formulario__seccion-titulo">Coste de importación</h2>
        <p className="formulario__seccion-descripcion">
          En dólares. El precio de venta se calcula aparte, con la tasa de cambio del día.
        </p>

        <div className="formulario__campos formulario__campos--dos">
          <Campo
            id="cost_usd"
            etiqueta="Coste (USD)"
            error={errores.cost_usd}
            ayuda="Mayor que 0, máximo 2 decimales."
          >
            <div className="control control--con-sufijo">
              <input
                id="cost_usd"
                type="number"
                min="0"
                step="0.01"
                className={claseControl(errores.cost_usd)}
                placeholder="15.99"
                value={valores.cost_usd}
                onChange={(evento) => actualizar('cost_usd', evento.target.value)}
                aria-invalid={Boolean(errores.cost_usd)}
                aria-describedby={errores.cost_usd ? 'cost_usd-error' : 'cost_usd-ayuda'}
              />
              <span className="control__sufijo" aria-hidden="true">
                USD
              </span>
            </div>
          </Campo>
        </div>
      </div>

      <div className="formulario__pie">
        <button
          type="button"
          className="boton boton--secundario"
          onClick={onCancelar}
          disabled={enviando}
        >
          Cancelar
        </button>
        <button type="submit" className="boton" disabled={enviando}>
          {enviando ? (
            <>
              <Loader2 size={16} className="icono-girando" aria-hidden="true" />
              Guardando...
            </>
          ) : (
            <>
              <Save size={16} aria-hidden="true" />
              {textoEnviar}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
