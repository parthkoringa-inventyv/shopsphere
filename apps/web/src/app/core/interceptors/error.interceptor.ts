import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { ApiError, ApiErrorKind } from '../models/api-error.model';
import { isApiErrorResponse } from '../models/api-response.model';

const FALLBACK_MESSAGES = {
  network: 'Unable to reach the server. Check your connection and try again.',
  timeout: 'The server took too long to respond. Please try again.',
  client: 'The request could not be completed.',
  server: 'The server encountered an unexpected error. Please try again later.',
  unknown: 'An unexpected error occurred.',
} satisfies Record<ApiErrorKind, string>;

/**
 * Normalizes every failed HTTP request into an `ApiError` and re-throws it.
 * It never swallows errors or shows UI: the calling feature decides what the user sees.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(catchError((error: unknown) => throwError(() => normalizeHttpError(error))));

export function normalizeHttpError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (
    isTimeoutError(error) ||
    (error instanceof HttpErrorResponse && isTimeoutError(error.error))
  ) {
    return new ApiError({
      kind: 'timeout',
      status: 0,
      code: 'TIMEOUT',
      message: FALLBACK_MESSAGES.timeout,
    });
  }

  if (!(error instanceof HttpErrorResponse)) {
    return new ApiError({
      kind: 'unknown',
      status: 0,
      code: 'UNKNOWN_ERROR',
      message: FALLBACK_MESSAGES.unknown,
    });
  }

  // Status 0 means no HTTP response was received.
  if (error.status === 0) {
    return new ApiError({
      kind: 'network',
      status: 0,
      code: 'NETWORK_ERROR',
      message: FALLBACK_MESSAGES.network,
    });
  }

  const kind: ApiErrorKind =
    error.status >= 500 ? 'server' : error.status >= 400 ? 'client' : 'unknown';

  if (isApiErrorResponse(error.error)) {
    const { code, message, details, requestId } = error.error.error;

    return new ApiError({ kind, status: error.status, code, message, details, requestId });
  }

  // No API envelope, e.g. an HTML error page from a proxy/host or an unparsable body.
  return new ApiError({
    kind,
    status: error.status,
    code: `HTTP_${error.status}`,
    message: FALLBACK_MESSAGES[kind],
  });
}

/** Angular's `timeout` option aborts with a DOMException and RxJS `timeout()` throws TimeoutError; both share this name. */
function isTimeoutError(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { name?: unknown }).name === 'TimeoutError'
  );
}
