/**
 * Error con el mismo formato que devolvería la API de Laravel:
 * código HTTP (401, 403, 404, 409, 422, 429), mensaje y errores por campo.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly campos: Record<string, string> = {},
  ) {
    super(message);
  }
}

/** Convierte cualquier error en un texto para mostrar al usuario. */
export function mensajeDe(e: unknown): string {
  return e instanceof Error ? e.message : 'Ocurrió un problema. Inténtalo otra vez.';
}

export function camposDe(e: unknown): Record<string, string> {
  return e instanceof ApiError ? e.campos : {};
}
