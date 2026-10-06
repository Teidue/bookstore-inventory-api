import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BookForm } from "../components/books/BookForm";
import {
  toFormValues,
  toPayload,
  type BookFormValues,
} from "../components/books/book.utils";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorAlert, ErrorView, Loading } from "../components/ui/ViewStates";
import { buttonStyles } from "../components/ui/button-styles";
import { useQuery } from "../hooks/useQuery";
import { useToasts } from "../hooks/useToasts";
import { RequestError } from "../services/apiClient";
import { booksService } from "../services/books.service";
import type { Book } from "../types/api";

export function EditBook() {
  const { id = "" } = useParams();
  const bookId = Number(id);
  const navigate = useNavigate();
  const { notify } = useToasts();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchBook = useCallback(
    (signal: AbortSignal) => booksService.get(bookId, signal),
    [bookId],
  );
  const { state, refetch } = useQuery<Book>(fetchBook, [bookId]);

  if (state.status === "loading" && !state.data) {
    return <Loading message="Cargando libro..." />;
  }

  if (state.status === "error" && !state.data) {
    return (
      <>
        <PageHeader
          back={{ to: "/", label: "Volver al inventario" }}
          title="Editar libro"
        />
        <ErrorView error={state.error} onRetry={refetch}>
          <Link className={buttonStyles("secondary")} to="/">
            Volver al inventario
          </Link>
        </ErrorView>
      </>
    );
  }

  const book = state.data;
  if (!book) return null;

  const submit = async (values: BookFormValues) => {
    setServerError(null);
    setSubmitting(true);

    try {
      const payload = toPayload(values);
      await booksService.update(bookId, payload);

      // Si cambia el coste, la API reinicia el precio de venta (ya no
      // corresponde al coste nuevo). Se avisa para que no sorprenda al verlo
      // «Sin calcular» en el detalle.
      const priceWasReset =
        book.selling_price_local !== null && payload.cost_usd !== book.cost_usd;
      notify(
        "success",
        "Cambios guardados",
        priceWasReset
          ? `${values.title}. El coste ha cambiado, así que el precio de venta se ha reiniciado: vuelve a calcularlo.`
          : values.title,
      );
      navigate(`/books/${bookId}`, { replace: true });
    } catch (error) {
      const message =
        error instanceof RequestError
          ? error.message
          : "No se han podido guardar los cambios.";
      setServerError(message);
      notify("error", "No se pudo guardar", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        back={{ to: `/books/${bookId}`, label: "Volver al detalle" }}
        title="Editar libro"
        subtitle={book.title}
      />

      {serverError && <ErrorAlert message={serverError} />}

      <BookForm
        initialValues={toFormValues(book)}
        submitting={submitting}
        submitLabel="Guardar cambios"
        onSubmit={submit}
        onCancel={() => navigate(`/books/${bookId}`)}
      />
    </>
  );
}
