import { BookOpen, Loader2, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Field } from '../ui/Field';
import { inputStyles } from '../ui/input-styles';
import { validateBookForm, type BookFormValues, type FormErrors } from './book.utils';

interface BookFormProps {
  initialValues: BookFormValues;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (values: BookFormValues) => void;
  onCancel: () => void;
}

const SECTION = 'border-b border-slate-200 p-5 last:border-b-0';
const SECTION_TITLE = 'text-sm font-semibold text-slate-900';
const SECTION_DESCRIPTION = 'mt-1 mb-4 text-[13px] text-slate-500';

export function BookForm({
  initialValues,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: BookFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);

  const update = (field: keyof BookFormValues, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    // Sólo se revalida en vivo tras el primer envío, para no llenar de rojo un
    // formulario que el usuario todavía está rellenando.
    if (touched) setErrors(validateBookForm(next));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);

    const currentErrors = validateBookForm(values);
    setErrors(currentErrors);

    if (Object.keys(currentErrors).length === 0) onSubmit(values);
  };

  return (
    <Card>
      <form onSubmit={submit} noValidate>
        <div className={SECTION}>
          <h2 className={SECTION_TITLE}>Identificación</h2>
          <p className={SECTION_DESCRIPTION}>Título, autor e ISBN del ejemplar.</p>

          <div className="flex flex-col gap-4">
            <Field id="title" label="Título" error={errors.title}>
              <input
                id="title"
                className={inputStyles(Boolean(errors.title))}
                placeholder="El Quijote"
                value={values.title}
                onChange={(event) => update('title', event.target.value)}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field id="author" label="Autor" error={errors.author}>
                <input
                  id="author"
                  className={inputStyles(Boolean(errors.author))}
                  placeholder="Miguel de Cervantes"
                  value={values.author}
                  onChange={(event) => update('author', event.target.value)}
                  aria-invalid={Boolean(errors.author)}
                />
              </Field>

              <Field
                id="isbn"
                label="ISBN"
                error={errors.isbn}
                hint="10 o 13 dígitos. Los guiones se admiten."
              >
                <div className="relative">
                  <BookOpen
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                    size={16}
                    aria-hidden="true"
                  />
                  <input
                    id="isbn"
                    className={`${inputStyles(Boolean(errors.isbn))} pl-9`}
                    placeholder="978-84-376-0494-7"
                    value={values.isbn}
                    onChange={(event) => update('isbn', event.target.value)}
                    aria-invalid={Boolean(errors.isbn)}
                    aria-describedby={errors.isbn ? 'isbn-error' : 'isbn-hint'}
                  />
                </div>
              </Field>
            </div>
          </div>
        </div>

        <div className={SECTION}>
          <h2 className={SECTION_TITLE}>Inventario y origen</h2>
          <p className={SECTION_DESCRIPTION}>Categoría, existencias y país del proveedor.</p>

          <div className="grid gap-4 md:grid-cols-3">
            <Field id="category" label="Categoría" error={errors.category}>
              <input
                id="category"
                className={inputStyles(Boolean(errors.category))}
                placeholder="Literatura Clásica"
                value={values.category}
                onChange={(event) => update('category', event.target.value)}
                aria-invalid={Boolean(errors.category)}
              />
            </Field>

            <Field id="stock_quantity" label="Stock" error={errors.stock_quantity}>
              <input
                id="stock_quantity"
                type="number"
                min="0"
                step="1"
                className={inputStyles(Boolean(errors.stock_quantity))}
                value={values.stock_quantity}
                onChange={(event) => update('stock_quantity', event.target.value)}
                aria-invalid={Boolean(errors.stock_quantity)}
              />
            </Field>

            <Field
              id="supplier_country"
              label="País del proveedor"
              error={errors.supplier_country}
              hint="Código ISO de 2 letras: ES, MX, US..."
            >
              <input
                id="supplier_country"
                className={inputStyles(Boolean(errors.supplier_country))}
                placeholder="ES"
                maxLength={2}
                value={values.supplier_country}
                onChange={(event) => update('supplier_country', event.target.value.toUpperCase())}
                aria-invalid={Boolean(errors.supplier_country)}
              />
            </Field>
          </div>
        </div>

        <div className={SECTION}>
          <h2 className={SECTION_TITLE}>Coste de importación</h2>
          <p className={SECTION_DESCRIPTION}>
            En dólares. El precio de venta se calcula aparte, con la tasa de cambio del día.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              id="cost_usd"
              label="Coste (USD)"
              error={errors.cost_usd}
              hint="Mayor que 0, máximo 2 decimales."
            >
              <div className="relative">
                <input
                  id="cost_usd"
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${inputStyles(Boolean(errors.cost_usd))} pr-14`}
                  placeholder="15.99"
                  value={values.cost_usd}
                  onChange={(event) => update('cost_usd', event.target.value)}
                  aria-invalid={Boolean(errors.cost_usd)}
                  aria-describedby={errors.cost_usd ? 'cost_usd-error' : 'cost_usd-hint'}
                />
                <span
                  className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-slate-400"
                  aria-hidden="true"
                >
                  USD
                </span>
              </div>
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} aria-hidden="true" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
