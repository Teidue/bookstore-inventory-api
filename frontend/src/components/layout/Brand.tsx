import { Library } from 'lucide-react';

/** Logotipo y nombre de la aplicación. */
export function Brand() {
  return (
    <>
      <span
        className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-white shadow-card"
        aria-hidden="true"
      >
        <Library size={17} strokeWidth={2} />
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
