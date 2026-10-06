/**
 * Estilos del control de formulario, con su variante de error.
 *
 * Vive aparte de <Field> porque lo aplican los propios `<input>` que el
 * llamante pasa como hijos: el campo no puede inyectar clases en ellos.
 */
export function inputStyles(invalid = false): string {
  const base =
    'h-9.5 w-full rounded-lg border bg-surface px-3 text-[14px] text-ink shadow-card ' +
    'transition-[border-color,box-shadow] duration-150 placeholder:text-ink-subtle ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-surface ' +
    'disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-subtle';

  return invalid
    ? `${base} border-critical/60 focus:border-critical focus:ring-critical/25`
    : `${base} border-line-strong hover:border-ink-subtle/60 focus:border-accent focus:ring-accent/25`;
}
