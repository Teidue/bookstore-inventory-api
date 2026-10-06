import { Calculator, CircleCheck, Info } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookForm } from '../components/books/BookForm';
import { EMPTY_VALUES, toPayload, type BookFormValues } from '../components/books/book.utils';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { ErrorAlert } from '../components/ui/ViewStates';
import { useToasts } from '../hooks/useToasts';
import { RequestError } from '../services/apiClient';
import { booksService } from '../services/books.service';

export function NewBook() {
  const navigate = useNavigate();
  const { notify } = useToasts();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (values: BookFormValues) => {
    setServerError(null);
    setSubmitting(true);

    try {
      const created = await booksService.create(toPayload(values));
      notify('success', 'Libro añadido al inventario', created.title);
      navigate(`/books/${created.id}`, { replace: true });
    } catch (error) {
      // El ISBN duplicado sólo lo sabe el servidor (409): es justo el caso que
      // la validación de cliente no puede cubrir.
      const message =
        error instanceof RequestError ? error.message : 'No se ha podido crear el libro.';
      setServerError(message);
      notify('error', 'No se pudo crear el libro', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        back={{ to: '/', label: 'Volver al inventario' }}
        title="Añadir libro"
        subtitle="Da de alta un ejemplar en el catálogo."
      />

      {serverError && <ErrorAlert message={serverError} />}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
        <BookForm
          initialValues={EMPTY_VALUES}
          submitting={submitting}
          submitLabel="Crear libro"
          onSubmit={submit}
          onCancel={() => navigate('/')}
        />

        <Card>
          <CardHeader title="Cómo funciona" icon={<Info size={15} aria-hidden="true" />} />
          <CardBody>
            <ul className="flex flex-col gap-5">
              <li className="flex gap-3">
                <CircleCheck size={16} className="mt-0.5 shrink-0 text-ink-subtle" aria-hidden="true" />
                <div>
                  <strong className="block text-[13px] font-semibold text-ink">ISBN único</strong>
                  <span className="mt-1 block text-[12px] leading-relaxed text-ink-muted">
                    Da igual cómo escribas los guiones: el mismo ISBN no se puede repetir.
                  </span>
                </div>
              </li>
              <li className="flex gap-3">
                <Calculator size={16} className="mt-0.5 shrink-0 text-ink-subtle" aria-hidden="true" />
                <div>
                  <strong className="block text-[13px] font-semibold text-ink">
                    El precio se calcula aparte
                  </strong>
                  <span className="mt-1 block text-[12px] leading-relaxed text-ink-muted">
                    Nace vacío y se obtiene con la tasa de cambio del día más un 40% de margen.
                  </span>
                </div>
              </li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
