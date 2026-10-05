import { Library } from 'lucide-react';

/** Logotipo y nombre de la aplicación. */
export function Marca() {
  return (
    <>
      <span className="marca__logo" aria-hidden="true">
        <Library size={18} strokeWidth={2.25} />
      </span>
      <span className="marca__texto">
        Bookstore Inventory
        <small>Catálogo y precios de venta</small>
      </span>
    </>
  );
}
