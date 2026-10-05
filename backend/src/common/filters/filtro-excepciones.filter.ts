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
import { CodigoError } from '../constants/codigos-error';

interface CuerpoError {
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
const PRIMER_ERROR_DE_SERVIDOR = 500;

/** Statuses que Nest lanza por su cuenta, traducidos a códigos del dominio. */
const CODIGO_POR_STATUS: Partial<Record<number, CodigoError>> = {
  [HttpStatus.BAD_REQUEST]: CodigoError.VALIDACION,
  [HttpStatus.UNPROCESSABLE_ENTITY]: CodigoError.VALIDACION,
  [HttpStatus.SERVICE_UNAVAILABLE]: CodigoError.TASA_CAMBIO_NO_DISPONIBLE,
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
export class FiltroExcepciones implements ExceptionFilter {
  private readonly logger = new Logger(FiltroExcepciones.name);

  catch(excepcion: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const respuesta = ctx.getResponse<Response>();
    const peticion = ctx.getRequest<Request>();

    const cuerpo = this.construirCuerpo(excepcion, peticion.url);

    if (cuerpo.statusCode >= PRIMER_ERROR_DE_SERVIDOR) {
      // Sólo los 5xx se registran con traza: son bugs nuestros, no del cliente.
      this.logger.error(
        `${peticion.method} ${peticion.url} -> ${cuerpo.statusCode}`,
        excepcion instanceof Error ? excepcion.stack : String(excepcion),
      );
    }

    respuesta.status(cuerpo.statusCode).json(cuerpo);
  }

  private construirCuerpo(excepcion: unknown, path: string): CuerpoError {
    const timestamp = new Date().toISOString();

    if (excepcion instanceof HttpException) {
      return this.desdeHttpException(excepcion, path, timestamp);
    }

    // Un error de SQL que llega hasta aquí es un fallo de programación: se
    // registra completo, pero al cliente no se le filtra nada de la consulta.
    if (excepcion instanceof QueryFailedError) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: CodigoError.ERROR_INTERNO,
        message: 'Error interno del servidor.',
        path,
        timestamp,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: CodigoError.ERROR_INTERNO,
      message: 'Error interno del servidor.',
      path,
      timestamp,
    };
  }

  private desdeHttpException(
    excepcion: HttpException,
    path: string,
    timestamp: string,
  ): CuerpoError {
    const statusCode = excepcion.getStatus();
    const respuesta = excepcion.getResponse();

    // Caso 1: excepción de dominio -> { code, message }
    if (typeof respuesta === 'object' && respuesta !== null && 'code' in respuesta) {
      const datos = respuesta as { code: string; message: string };
      return { statusCode, code: datos.code, message: datos.message, path, timestamp };
    }

    // Caso 2: ValidationPipe -> { message: string[], error, statusCode }
    if (typeof respuesta === 'object' && respuesta !== null && 'message' in respuesta) {
      const mensaje = (respuesta as { message: string | string[] }).message;
      const details = Array.isArray(mensaje) ? mensaje : [mensaje];
      return {
        statusCode,
        code: CODIGO_POR_STATUS[statusCode] ?? this.codigoGenerico(statusCode),
        message: details[0],
        path,
        timestamp,
        ...(details.length > 1 ? { details } : {}),
      };
    }

    // Caso 3: `throw new NotFoundException()` sin cuerpo, 404 de ruta, etc.
    return {
      statusCode,
      code: CODIGO_POR_STATUS[statusCode] ?? this.codigoGenerico(statusCode),
      message: typeof respuesta === 'string' ? respuesta : excepcion.message,
      path,
      timestamp,
    };
  }

  private codigoGenerico(statusCode: number): string {
    return statusCode >= PRIMER_ERROR_DE_SERVIDOR
      ? CodigoError.ERROR_INTERNO
      : `HTTP_${statusCode}`;
  }
}
