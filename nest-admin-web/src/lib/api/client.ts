import { ENV } from "../env";
import { ApiError } from "./errors";

/**
 * Cliente HTTP — espejo de `nest-mobile/lib/api/client.ts`.
 *
 * El token y el handler de 401 se inyectan desde el auth-store vía
 * `configureApi`, igual que en el móvil, para no acoplar el cliente a la capa
 * de estado. Todas las peticiones llevan Bearer por default.
 */
type TokenProvider = () => string | null;
type UnauthorizedHandler = () => void;

let getToken: TokenProvider = () => null;
let onUnauthorized: UnauthorizedHandler = () => {};

export function configureApi(opts: {
  getToken?: TokenProvider;
  onUnauthorized?: UnauthorizedHandler;
}) {
  if (opts.getToken) getToken = opts.getToken;
  if (opts.onUnauthorized) onUnauthorized = opts.onUnauthorized;
}

export type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiFetch<T>(
  path: string,
  { body, auth = true, headers, ...rest }: RequestOptions = {},
): Promise<T> {
  const url = `${ENV.API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] =
      finalHeaders["Content-Type"] ?? "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch (e) {
    throw new ApiError(0, (e as Error)?.message ?? "Network error");
  }

  const text = await response.text();
  const parsed = text ? safeJson(text) : null;

  if (!response.ok) {
    if (response.status === 401 && auth) onUnauthorized();
    const message =
      (parsed as { message?: unknown })?.message ??
      response.statusText ??
      `HTTP ${response.status}`;
    throw new ApiError(
      response.status,
      Array.isArray(message) ? message.join(", ") : String(message),
      parsed,
    );
  }

  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
