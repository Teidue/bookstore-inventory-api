import { Library } from 'lucide-react';

/** Logotipo y nombre de la aplicación. */
export function Brand() {
  return (
    <>
      <span
        className="grid h-8.5 w-8.5 place-items-center rounded-[10px] bg-linear-to-br from-brand to-brand-strong text-white shadow-brand"
        aria-hidden="true"
      >
        <Library size={17} strokeWidth={2.1} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[14px] font-semibold tracking-[-0.015em] text-ink">
          Bookstore Inventory
        </span>
        <span className="mt-1 text-[11px] text-ink-subtle">Catálogo y precios de venta</span>
      </span>
    </>
  );
}
