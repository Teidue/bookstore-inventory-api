import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ErrorCode } from '../constants/error-codes';

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
  path: string;
  timestamp: string;
  details?: string[];
}

/**
 * Umbral a partir del cual un error es culpa del servidor.
 *
 * Es un `number` y no `HttpStatus.INTERNAL_SERVER_ERROR` porque lo que se
 * compara —`excepcion.getStatus()`— también es un `number` cualquiera, no un
 * miembro del enum: mezclarlos oculta que la comparación no está tipada.
 */
const FIRST_SERVER_ERROR = 500;

/** Statuses que Nest lanza por su cuenta, traducidos a códigos del dominio. */
const CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.VALIDATION_ERROR,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.VALIDATION_ERROR,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.EXCHANGE_RATE_UNAVAILABLE,
};

/**
 * Filtro global de excepciones.
 *
 * Única salida de errores de la API: garantiza que *toda* respuesta de error
 * tenga la misma forma, venga de donde venga (validación, dominio, base de
 * datos o un fallo no previsto).  El enunciado pide manejar 400, 404, 500 y
 * 503; aquí es donde se decide cuál sale en cada caso.
 */
@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const cuerpo = this.buildBody(exception, request.url);

    if (cuerpo.statusCode >= FIRST_SERVER_ERROR) {
      // Sólo los 5xx se registran con traza: son bugs nuestros, no del cliente.
      this.logger.error(
        `${request.method} ${request.url} -> ${cuerpo.statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(cuerpo.statusCode).json(cuerpo);
  }

  private buildBody(exception: unknown, path: string): ErrorBody {
    const timestamp = new Date().toISOString();

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception, path, timestamp);
    }

    // Un error de SQL que llega hasta aquí es un fallo de programación: se
    // registra completo, pero al cliente no se le filtra nada de la consulta.
    if (exception instanceof QueryFailedError) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Error interno del servidor.',
        path,
        timestamp,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Error interno del servidor.',
      path,
      timestamp,
    };
  }

  private fromHttpException(exception: HttpException, path: string, timestamp: string): ErrorBody {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    // Caso 1: excepción de dominio -> { code, message }
    if (typeof response === 'object' && response !== null && 'code' in response) {
      const data = response as { code: string; message: string };
      return { statusCode, code: data.code, message: data.message, path, timestamp };
    }

    // Caso 2: ValidationPipe -> { message: string[], error, statusCode }
    if (typeof response === 'object' && response !== null && 'message' in response) {
      const message = (response as { message: string | string[] }).message;
      const details = Array.isArray(message) ? message : [message];
      return {
        statusCode,
        code: CODE_BY_STATUS[statusCode] ?? this.genericCode(statusCode),
        message: details[0],
        path,
        timestamp,
        ...(details.length > 1 ? { details } : {}),
      };
    }

    // Caso 3: `throw new NotFoundException()` sin cuerpo, 404 de ruta, etc.
    return {
      statusCode,
      code: CODE_BY_STATUS[statusCode] ?? this.genericCode(statusCode),
      message: typeof response === 'string' ? response : exception.message,
      path,
      timestamp,
    };
  }

  private genericCode(statusCode: number): string {
    return statusCode >= FIRST_SERVER_ERROR ? ErrorCode.INTERNAL_ERROR : `HTTP_${statusCode}`;
  }
}
