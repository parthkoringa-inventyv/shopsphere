/** Success envelope returned by every ShopSphere API endpoint. */
export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
  meta: unknown;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details: unknown;
  requestId: string;
  /** Sent by the API's 404 handler. */
  path?: string;
}

/** Error envelope returned by the API's centralized error handler. */
export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { success, error } = value as Partial<ApiErrorResponse>;

  return (
    success === false &&
    typeof error === 'object' &&
    error !== null &&
    typeof error.code === 'string' &&
    typeof error.message === 'string'
  );
}
