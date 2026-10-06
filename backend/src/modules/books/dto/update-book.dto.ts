import { CreateBookDto } from './create-book.dto';

/**
 * Actualización completa de un libro (`PUT`).
 *
 * Hereda del alta sin volverlo parcial, porque eso es exactamente lo que
 * significa PUT: el cuerpo sustituye al recurso entero.  Admitir campos
 * sueltos sería un PATCH, que el enunciado no pide.
 *
 * Tampoco acepta `selling_price_local`: ese valor sólo lo escribe el cálculo
 * de precio, para que no pueda quedar un precio de venta incoherente con el
 * coste y la tasa con la que se obtuvo.
 */
export class UpdateBookDto extends CreateBookDto {}
