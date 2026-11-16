/**
 * - `network`: no HTTP response (offline, server down, DNS failure, CORS block)
 * - `timeout`: the request exceeded its `timeout` option
 * - `client` / `server`: the API answered with a 4xx / 5xx status
 * - `unknown`: anything else (e.g. a non-HTTP error or an unreadable response)
 */
export type ApiErrorKind = 'network' | 'timeout' | 'client' | 'server' | 'unknown';

export interface ApiErrorInit {
  kind: ApiErrorKind;
  status: number;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string | null;
}

/**
 * Normalized error for every failed HTTP request, produced by `errorInterceptor`.
 * Mirrors the backend's AppError so features can branch on `kind`, `status` or `code`.
 */
export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly kind: ApiErrorKind;
  /** HTTP status, or `0` when no response was received. */
  readonly status: number;
  /** Backend error code, or `NETWORK_ERROR`, `TIMEOUT`, `HTTP_<status>`, `UNKNOWN_ERROR`. */
  readonly code: string;
  readonly details: unknown;
  /** Backend request ID for correlating with server logs, when the API provided one. */
  readonly requestId: string | null;

  constructor({ kind, status, code, message, details = null, requestId = null }: ApiErrorInit) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}
