import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { ErrorCode } from '../constants/error-codes';
import { DomainException } from '../exceptions/domain-exception';
import { ExceptionsFilter } from './exceptions.filter';

/** Simula el contexto HTTP de Nest y captura lo que el filtro responde. */
function fakeContext(url = '/books/1') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });

  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url, method: 'GET' }),
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('FiltroExcepciones', () => {
  let filtro: ExceptionsFilter;

  beforeEach(() => {
    filtro = new ExceptionsFilter();
    // El filtro registra los 5xx; se silencia para no ensuciar la salida.
    jest.spyOn(filtro['logger'], 'error').mockImplementation(() => undefined);
  });

  it('traduce una excepción de dominio conservando su código', () => {
    const { host, status, json } = fakeContext('/books/999');

    filtro.catch(DomainException.noEncontrado(ErrorCode.BOOK_NOT_FOUND, 'No existe.'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        code: 'BOOK_NOT_FOUND',
        message: 'No existe.',
        path: '/books/999',
      }),
    );
  });

  it('convierte los mensajes del ValidationPipe en un error de validación', () => {
    const { host, json } = fakeContext('/books');

    filtro.catch(
      new HttpException(
        { statusCode: 400, message: ['cost_usd debe ser mayor que 0.', 'isbn inválido.'] },
        HttpStatus.BAD_REQUEST,
      ),
      host,
    );

    const cuerpo = json.mock.calls[0][0] as Record<string, unknown>;
    expect(cuerpo.statusCode).toBe(400);
    expect(cuerpo.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(cuerpo.message).toBe('cost_usd debe ser mayor que 0.');
    expect(cuerpo.details).toHaveLength(2);
  });

  it('un fallo no previsto responde 500 sin filtrar detalles internos', () => {
    const { host, status, json } = fakeContext();

    filtro.catch(new Error('connection pool exhausted at /src/secretos.ts:42'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const cuerpo = json.mock.calls[0][0] as Record<string, unknown>;
    expect(cuerpo.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(cuerpo.message).toBe('Error interno del servidor.');
    // Lo importante: el mensaje real del error no llega al cliente.
    expect(JSON.stringify(cuerpo)).not.toContain('connection pool');
    expect(JSON.stringify(cuerpo)).not.toContain('secretos.ts');
  });

  it('un error de SQL tampoco revela la consulta', () => {
    const { host, status, json } = fakeContext();

    filtro.catch(
      new QueryFailedError('SELECT * FROM book WHERE secreto = $1', [], new Error('boom')),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('SELECT');
  });

  it('toda respuesta de error lleva siempre la misma forma', () => {
    const { host, json } = fakeContext();

    filtro.catch(new Error('fallo'), host);

    const cuerpo = json.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(cuerpo).sort()).toEqual([
      'code',
      'message',
      'path',
      'statusCode',
      'timestamp',
    ]);
  });
});
