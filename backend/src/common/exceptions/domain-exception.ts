import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes';

/**
 * Excepción de dominio: además del status HTTP transporta un `CodigoError`
 * estable.  El filtro global lo lee y lo publica en el campo `code` de la
 * respuesta, de modo que el cliente nunca tenga que parsear mensajes.
 */
export class DomainException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message: string,
    status: HttpStatus,
  ) {
    super({ code: code, message: message }, status);
  }

  static noEncontrado(code: ErrorCode, message: string): DomainException {
    return new DomainException(code, message, HttpStatus.NOT_FOUND);
  }

  static conflicto(code: ErrorCode, message: string): DomainException {
    return new DomainException(code, message, HttpStatus.CONFLICT);
  }

  static peticionInvalida(code: ErrorCode, message: string): DomainException {
    return new DomainException(code, message, HttpStatus.BAD_REQUEST);
  }

  static servicioNoDisponible(code: ErrorCode, message: string): DomainException {
    return new DomainException(code, message, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
