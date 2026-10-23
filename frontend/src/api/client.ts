export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export class ApiError extends Error {
  status: number;
  details?: string[];

  constructor(status: number, message: string, details?: string[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Disparado quando a API responde 401 — o app volta para o login. */
export const UNAUTHORIZED_EVENT = 'api:unauthorized';

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api${path}`, {
      credentials: 'include',
      ...rest,
      headers: { ...(json !== undefined && { 'Content-Type': 'application/json' }), ...headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError(0, 'Sem conexão. Verifique sua internet.');
  }

  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/login') {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(res.status, body?.message ?? 'Algo deu errado', body?.details);
  }
  return body as T;
}
