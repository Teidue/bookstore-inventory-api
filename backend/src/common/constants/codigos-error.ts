/**
 * Códigos de error estables del dominio.
 *
 * El `statusCode` HTTP dice *qué tipo* de problema hubo; este código dice
 * *cuál* problema concreto fue.  El cliente conmuta sobre el código, nunca
 * sobre el texto del mensaje, que es para humanos y puede cambiar.
 */
export enum CodigoError {
  // Validación de la petición (400)
  VALIDACION = 'VALIDACION',

  // Recursos (404)
  LIBRO_NO_ENCONTRADO = 'LIBRO_NO_ENCONTRADO',

  // Conflictos de unicidad (409)
  ISBN_DUPLICADO = 'ISBN_DUPLICADO',

  // Dependencias externas (503)
  TASA_CAMBIO_NO_DISPONIBLE = 'TASA_CAMBIO_NO_DISPONIBLE',

  // Genérico (500)
  ERROR_INTERNO = 'ERROR_INTERNO',
}
