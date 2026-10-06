/**
 * Estilos del control de formulario, con su variante de error.
 *
 * Vive aparte de <Field> porque lo aplican los propios `<input>` que el
 * llamante pasa como hijos: el campo no puede inyectar clases en ellos.
 */
export function inputStyles(invalid = false): string {
  const base =
    'h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors ' +
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 ' +
    'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400';

  return invalid
    ? `${base} border-red-500 focus:border-red-500 focus:ring-red-500/30`
    : `${base} border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/30`;
}
