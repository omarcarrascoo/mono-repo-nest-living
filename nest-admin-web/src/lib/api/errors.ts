/**
 * Espejo de `nest-mobile/lib/api/errors.ts` — misma forma de error en ambos
 * clientes para que el manejo (status + message) sea idéntico.
 */
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}
