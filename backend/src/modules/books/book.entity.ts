import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Libro del inventario.
 *
 * Las columnas van en snake_case porque es el contrato que fija el enunciado
 * para el JSON; las propiedades de TypeScript van en camelCase, que es la
 * convención del lenguaje.  La traducción entre ambos mundos ocurre en los
 * DTO de entrada y en el mapeador de salida, en un único sitio.
 */
@Entity('book')
// Índices sobre lo que el listado filtra de verdad: el catálogo por categoría
// y el aviso de inventario bajo.
@Index('IDX_book_category', ['category'])
@Index('IDX_book_stock_quantity', ['stockQuantity'])
export class Book {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  author: string;

  /** ISBN tal y como lo escribió el usuario, con sus guiones si los tenía. */
  @Column({ type: 'varchar', length: 20 })
  isbn: string;

  /**
   * Mismo ISBN sin guiones ni espacios.  Es la columna que lleva el índice
   * único: así `978-84-376-0494-7` y `9788437604947` no pueden coexistir.
   */
  @Index('UQ_book_isbn_normalized', { unique: true })
  @Column({ name: 'isbn_normalized', type: 'varchar', length: 13 })
  isbnNormalized: string;

  /**
   * Coste de importación en dólares.
   *
   * `numeric`, no `float`: un `double` no puede representar 0.1 y acumula
   * error al multiplicar, y aquí se multiplica por la tasa de cambio y por el
   * margen.  El driver lo devuelve como string para no perder precisión, y
   * sólo se convierte a número al construir la respuesta.
   */
  @Column({ name: 'cost_usd', type: 'numeric', precision: 10, scale: 2 })
  costUsd: string;

  /**
   * Precio de venta en moneda local.  Nace nulo: no existe hasta que se
   * calcula con la tasa de cambio del día.
   */
  @Column({
    name: 'selling_price_local',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  sellingPriceLocal: string | null;

  @Column({ name: 'stock_quantity', type: 'integer' })
  stockQuantity: number;

  @Column({ type: 'varchar', length: 120 })
  category: string;

  /** Código de país ISO 3166-1 alfa-2 del proveedor, por ejemplo `ES`. */
  @Column({ name: 'supplier_country', type: 'char', length: 2 })
  supplierCountry: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
