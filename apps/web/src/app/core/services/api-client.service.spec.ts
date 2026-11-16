import { TestBed } from '@angular/core/testing';
import { HttpContext, HttpContextToken, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '../../../environments/environment';
import { SHOW_LOADER } from '../interceptors/loader.interceptor';
import { ApiSuccessResponse } from '../models/api-response.model';
import { ApiClientService } from './api-client.service';

describe('ApiClientService', () => {
  let service: ApiClientService;
  let httpMock: HttpTestingController;

  const origin = environment.apiOrigin;
  const envelope: ApiSuccessResponse<{ id: string }> = {
    success: true,
    data: { id: '1' },
    meta: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ApiClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should prefix the path with the configured API origin and return the response', () => {
    let response: ApiSuccessResponse<{ id: string }> | undefined;

    service.get<{ id: string }>('/api/v1/products').subscribe((res) => (response = res));

    const req = httpMock.expectOne(`${origin}/api/v1/products`);
    expect(req.request.method).toBe('GET');
    req.flush(envelope);

    expect(response).toEqual(envelope);
  });

  it('should substitute and encode path params', () => {
    service
      .get('/api/v1/products/:productId/reviews/:reviewId', {
        pathParams: { productId: 'a b/c', reviewId: 42 },
      })
      .subscribe();

    httpMock.expectOne(`${origin}/api/v1/products/a%20b%2Fc/reviews/42`).flush(envelope);
  });

  it('should throw when a path param is missing', () => {
    expect(() => service.get('/api/v1/products/:productId')).toThrowError(
      'Missing value for path param ":productId"',
    );
  });

  it('should serialize query params, skipping null and undefined values', () => {
    service
      .get('/api/v1/products', {
        queryParams: { page: 2, search: 'shoe', inStock: true, brand: null, sort: undefined },
      })
      .subscribe();

    const req = httpMock.expectOne((request) => request.url === `${origin}/api/v1/products`);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('search')).toBe('shoe');
    expect(req.request.params.get('inStock')).toBe('true');
    expect(req.request.params.has('brand')).toBe(false);
    expect(req.request.params.has('sort')).toBe(false);
    req.flush(envelope);
  });

  it('should repeat array query param values', () => {
    service.get('/api/v1/products', { queryParams: { tag: ['new', 'sale'] } }).subscribe();

    const req = httpMock.expectOne((request) => request.url === `${origin}/api/v1/products`);
    expect(req.request.params.getAll('tag')).toEqual(['new', 'sale']);
    req.flush(envelope);
  });

  it('should forward headers and withCredentials', () => {
    service
      .get('/api/v1/auth/me', { headers: { 'X-Test': 'yes' }, withCredentials: true })
      .subscribe();

    const req = httpMock.expectOne(`${origin}/api/v1/auth/me`);
    expect(req.request.headers.get('X-Test')).toBe('yes');
    expect(req.request.withCredentials).toBe(true);
    req.flush(envelope);
  });

  it('should forward the timeout option', () => {
    service.get('/api/v1/products', { timeout: 2000 }).subscribe();

    const req = httpMock.expectOne(`${origin}/api/v1/products`);
    expect(req.request.timeout).toBe(2000);
    req.flush(envelope);
  });

  it('should flag the request for the global loader when showLoader is true', () => {
    service.get('/api/v1/products', { showLoader: true }).subscribe();

    const req = httpMock.expectOne(`${origin}/api/v1/products`);
    expect(req.request.context.get(SHOW_LOADER)).toBe(true);
    req.flush(envelope);
  });

  it('should not flag the request for the global loader by default', () => {
    service.get('/api/v1/products').subscribe();

    const req = httpMock.expectOne(`${origin}/api/v1/products`);
    expect(req.request.context.get(SHOW_LOADER)).toBe(false);
    req.flush(envelope);
  });

  it('should keep tokens from a caller-provided context alongside showLoader', () => {
    const TRACE = new HttpContextToken<string>(() => '');
    const context = new HttpContext().set(TRACE, 'abc');

    service.get('/api/v1/products', { context, showLoader: true }).subscribe();

    const req = httpMock.expectOne(`${origin}/api/v1/products`);
    expect(req.request.context.get(TRACE)).toBe('abc');
    expect(req.request.context.get(SHOW_LOADER)).toBe(true);
    req.flush(envelope);
  });

  it.each([
    ['POST', 'post'],
    ['PUT', 'put'],
    ['PATCH', 'patch'],
  ] as const)('should send a %s request with the body', (method, fn) => {
    const body = { name: 'Shoe' };

    service[fn]('/api/v1/products/:id', body, { pathParams: { id: '1' } }).subscribe();

    const req = httpMock.expectOne(`${origin}/api/v1/products/1`);
    expect(req.request.method).toBe(method);
    expect(req.request.body).toEqual(body);
    req.flush(envelope);
  });

  it('should send a DELETE request', () => {
    service.delete('/api/v1/cart/items/:itemId', { pathParams: { itemId: '7' } }).subscribe();

    const req = httpMock.expectOne(`${origin}/api/v1/cart/items/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(envelope);
  });
});
