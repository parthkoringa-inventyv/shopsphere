import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TimeoutError } from 'rxjs';

import { ApiError } from '../models/api-error.model';
import { errorInterceptor, normalizeHttpError } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /** Sends GET /api/test and returns the pending request plus whatever the subscriber received. */
  function send() {
    const received: { value?: unknown; error?: unknown; completed: boolean } = { completed: false };

    http.get('/api/test').subscribe({
      next: (value) => (received.value = value),
      error: (error: unknown) => (received.error = error),
      complete: () => (received.completed = true),
    });

    return { req: httpMock.expectOne('/api/test'), received };
  }

  const envelope = (code: string, details: unknown = null) => ({
    success: false,
    error: { code, message: 'Backend message', details, requestId: 'req-123' },
  });

  it.each([
    [400, 'INVALID_JSON', 'client'],
    [404, 'NOT_FOUND', 'client'],
    [422, 'VALIDATION_FAILED', 'client'],
    [500, 'INTERNAL_SERVER_ERROR', 'server'],
    [503, 'SERVICE_UNAVAILABLE', 'server'],
  ] as const)('should preserve the backend envelope for HTTP %i %s', (status, code, kind) => {
    const { req, received } = send();

    req.flush(envelope(code), { status, statusText: 'Error' });

    expect(received.error).toBeInstanceOf(ApiError);
    expect(received.error).toMatchObject({
      kind,
      status,
      code,
      message: 'Backend message',
      requestId: 'req-123',
    });
  });

  it('should keep envelope details', () => {
    const details = { fields: { email: 'Email is required.' } };
    const { req, received } = send();

    req.flush(envelope('VALIDATION_FAILED', details), { status: 422, statusText: 'Error' });

    expect((received.error as ApiError).details).toEqual(details);
  });

  it('should normalize a server error without the API envelope', () => {
    const { req, received } = send();

    req.flush('<h1>502 Bad Gateway</h1>', { status: 502, statusText: 'Bad Gateway' });

    expect(received.error).toMatchObject({
      kind: 'server',
      status: 502,
      code: 'HTTP_502',
      message: 'The server encountered an unexpected error. Please try again later.',
      requestId: null,
    });
  });

  it('should normalize a client error without the API envelope', () => {
    const { req, received } = send();

    req.flush('Payload Too Large', { status: 413, statusText: 'Payload Too Large' });

    expect(received.error).toMatchObject({ kind: 'client', status: 413, code: 'HTTP_413' });
  });

  it('should normalize a network failure', () => {
    const { req, received } = send();

    req.error(new ProgressEvent('error'));

    expect(received.error).toMatchObject({
      kind: 'network',
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Unable to reach the server. Check your connection and try again.',
    });
  });

  it('should normalize a request timeout', () => {
    const { req, received } = send();

    // Angular's `timeout` option aborts the request with this DOMException.
    req.error(new DOMException('signal timed out', 'TimeoutError') as unknown as ProgressEvent);

    expect(received.error).toMatchObject({ kind: 'timeout', status: 0, code: 'TIMEOUT' });
  });

  it('should re-throw instead of swallowing the error', () => {
    const { req, received } = send();

    req.flush(envelope('SERVICE_UNAVAILABLE'), { status: 503, statusText: 'Error' });

    expect(received.error).toBeInstanceOf(ApiError);
    expect(received.value).toBeUndefined();
    expect(received.completed).toBe(false);
  });

  it('should pass successful responses through unchanged', () => {
    const body = { success: true, data: { status: 'ok' }, meta: null };
    const { req, received } = send();

    req.flush(body);

    expect(received.value).toEqual(body);
    expect(received.error).toBeUndefined();
  });
});

describe('normalizeHttpError', () => {
  it('should return an existing ApiError unchanged', () => {
    const error = new ApiError({ kind: 'client', status: 404, code: 'NOT_FOUND', message: 'x' });

    expect(normalizeHttpError(error)).toBe(error);
  });

  it('should normalize an RxJS TimeoutError', () => {
    expect(normalizeHttpError(new TimeoutError())).toMatchObject({
      kind: 'timeout',
      code: 'TIMEOUT',
    });
  });

  it('should treat an unreadable success response as unknown', () => {
    const error = new HttpErrorResponse({
      status: 200,
      error: new SyntaxError('Unexpected token'),
    });

    expect(normalizeHttpError(error)).toMatchObject({
      kind: 'unknown',
      status: 200,
      code: 'HTTP_200',
    });
  });

  it('should normalize a non-HTTP error', () => {
    expect(normalizeHttpError(new Error('boom'))).toMatchObject({
      kind: 'unknown',
      status: 0,
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred.',
    });
  });
});
