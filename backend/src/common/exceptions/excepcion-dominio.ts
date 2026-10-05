import { HttpException, HttpStatus } from '@nestjs/common';
import { CodigoError } from '../constants/codigos-error';

/**
 * Excepción de dominio: además del status HTTP transporta un `CodigoError`
 * estable.  El filtro global lo lee y lo publica en el campo `code` de la
 * respuesta, de modo que el cliente nunca tenga que parsear mensajes.
 */
export class ExcepcionDominio extends HttpException {
  constructor(
    readonly codigo: CodigoError,
    mensaje: string,
    status: HttpStatus,
  ) {
    super({ code: codigo, message: mensaje }, status);
  }

  static noEncontrado(codigo: CodigoError, mensaje: string): ExcepcionDominio {
    return new ExcepcionDominio(codigo, mensaje, HttpStatus.NOT_FOUND);
  }

  static conflicto(codigo: CodigoError, mensaje: string): ExcepcionDominio {
    return new ExcepcionDominio(codigo, mensaje, HttpStatus.CONFLICT);
  }

  static peticionInvalida(codigo: CodigoError, mensaje: string): ExcepcionDominio {
    return new ExcepcionDominio(codigo, mensaje, HttpStatus.BAD_REQUEST);
  }

  static servicioNoDisponible(codigo: CodigoError, mensaje: string): ExcepcionDominio {
    return new ExcepcionDominio(codigo, mensaje, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
