import { Library } from 'lucide-react';

/** Logotipo y nombre de la aplicación. */
export function Brand() {
  return (
    <>
      <span
        className="grid h-9 w-9 place-items-center rounded-lg bg-blue-600 text-white shadow-sm"
        aria-hidden="true"
      >
        <Library size={18} strokeWidth={2.25} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-bold tracking-tight text-slate-900">Bookstore Inventory</span>
        <span className="text-[11px] text-slate-500">Catálogo y precios de venta</span>
      </span>
    </>
  );
}
