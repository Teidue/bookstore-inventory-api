/**
 * Códigos de error estables del dominio.
 *
 * El `statusCode` HTTP dice *qué tipo* de problema hubo; este código dice
 * *cuál* problema concreto fue.  El cliente conmuta sobre el código, nunca
 * sobre el texto del mensaje, que es para humanos y puede cambiar.
 */
export enum ErrorCode {
  // Validación de la petición (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Recursos (404)
  BOOK_NOT_FOUND = 'BOOK_NOT_FOUND',

  // Conflictos de unicidad (409)
  DUPLICATE_ISBN = 'DUPLICATE_ISBN',

  // Dependencias externas (503)
  EXCHANGE_RATE_UNAVAILABLE = 'EXCHANGE_RATE_UNAVAILABLE',

  // Genérico (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
