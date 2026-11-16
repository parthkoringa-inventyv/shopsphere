import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SHOW_LOADER } from '../interceptors/loader.interceptor';
import { ApiSuccessResponse } from '../models/api-response.model';

type QueryParamValue = string | number | boolean;

/** Values for `:name` tokens in a path, e.g. `/products/:productId`. */
export type PathParams = Readonly<Record<string, string | number>>;

/** Query string values; `null` and `undefined` entries are omitted from the request. */
export type QueryParams = Readonly<
  Record<string, QueryParamValue | readonly QueryParamValue[] | null | undefined>
>;

export interface ApiRequestOptions {
  pathParams?: PathParams;
  queryParams?: QueryParams;
  headers?: HttpHeaders | Record<string, string | string[]>;
  context?: HttpContext;
  withCredentials?: boolean;
  /** Show the global loader while this request is in flight. Defaults to `false`. */
  showLoader?: boolean;
  /** Abort after this many milliseconds; the request then fails with an `ApiError` of kind `timeout`. */
  timeout?: number;
}

/**
 * Single entry point for calling the ShopSphere API.
 * Feature services pass a path such as `/api/v1/health/live`; the client adds the
 * configured API origin, fills path params and builds query params.
 * Pass `showLoader: true` to display the global loader for the request.
 * Failed requests error with a normalized `ApiError` (see `errorInterceptor`).
 */
@Injectable({
  providedIn: 'root',
})
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly apiOrigin = environment.apiOrigin;

  get<TData>(path: string, options: ApiRequestOptions = {}): Observable<ApiSuccessResponse<TData>> {
    return this.http.get<ApiSuccessResponse<TData>>(
      this.buildUrl(path, options.pathParams),
      this.buildHttpOptions(options),
    );
  }

  post<TData>(
    path: string,
    body: unknown,
    options: ApiRequestOptions = {},
  ): Observable<ApiSuccessResponse<TData>> {
    return this.http.post<ApiSuccessResponse<TData>>(
      this.buildUrl(path, options.pathParams),
      body,
      this.buildHttpOptions(options),
    );
  }

  put<TData>(
    path: string,
    body: unknown,
    options: ApiRequestOptions = {},
  ): Observable<ApiSuccessResponse<TData>> {
    return this.http.put<ApiSuccessResponse<TData>>(
      this.buildUrl(path, options.pathParams),
      body,
      this.buildHttpOptions(options),
    );
  }

  patch<TData>(
    path: string,
    body: unknown,
    options: ApiRequestOptions = {},
  ): Observable<ApiSuccessResponse<TData>> {
    return this.http.patch<ApiSuccessResponse<TData>>(
      this.buildUrl(path, options.pathParams),
      body,
      this.buildHttpOptions(options),
    );
  }

  delete<TData>(
    path: string,
    options: ApiRequestOptions = {},
  ): Observable<ApiSuccessResponse<TData>> {
    return this.http.delete<ApiSuccessResponse<TData>>(
      this.buildUrl(path, options.pathParams),
      this.buildHttpOptions(options),
    );
  }

  private buildUrl(path: string, pathParams: PathParams = {}): string {
    const resolvedPath = path.replace(/:([A-Za-z0-9_]+)/g, (_token, name: string) => {
      const value = pathParams[name];

      if (value === undefined) {
        throw new Error(`Missing value for path param ":${name}" in "${path}"`);
      }

      return encodeURIComponent(String(value));
    });

    return `${this.apiOrigin}${resolvedPath}`;
  }

  private buildHttpOptions(options: ApiRequestOptions) {
    return {
      headers: options.headers,
      context: this.buildContext(options),
      withCredentials: options.withCredentials,
      timeout: options.timeout,
      params: this.buildQueryParams(options.queryParams),
    };
  }

  private buildContext({ context, showLoader = false }: ApiRequestOptions): HttpContext {
    return (context ?? new HttpContext()).set(SHOW_LOADER, showLoader);
  }

  private buildQueryParams(queryParams: QueryParams = {}): HttpParams {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(queryParams)) {
      if (value === null || value === undefined) {
        continue;
      }

      const values: readonly QueryParamValue[] = Array.isArray(value) ? value : [value];

      for (const item of values) {
        params = params.append(key, String(item));
      }
    }

    return params;
  }
}
