# REST API Requirements

## 1. Conventions

Base path: `/api/v1`.

Use nouns for resources, HTTP methods for operations and consistent plural resource names. Use `PATCH` for partial updates. Use `DELETE` for deletion/deactivation where semantics are clear. Use explicit action subresources only for domain commands that are not ordinary CRUD, e.g. `POST /orders/{id}/cancel`.

## 2. Response contract

Success:
```json
{
  "success": true,
  "data": {},
  "meta": null
}
```

Error:
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "The requested product was not found",
    "details": null,
    "requestId": "request-id"
  }
}
```

Do not expose stack traces, SQL, internal hostnames or secrets in production responses.

## 3. Status code guidance

| Code | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 202 | Accepted for asynchronous processing |
| 204 | Successful with no body |
| 400 | Malformed request |
| 401 | Missing/invalid authentication |
| 403 | Authenticated but not permitted |
| 404 | Resource not found or intentionally concealed |
| 409 | State/uniqueness/idempotency conflict |
| 422 | Valid syntax but invalid business input |
| 429 | Rate limit exceeded |
| 500 | Unexpected internal error |
| 503 | Required dependency unavailable |

## 4. Endpoint catalogue (initial)

### Authentication
- `POST /auth/register`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/change-password`
- `GET /auth/me`
- `GET /auth/sessions`
- `DELETE /auth/sessions/{sessionId}`
- JWT-mode: `POST /auth/refresh`

### Users and addresses
- `GET /users/me`
- `PATCH /users/me`
- `GET /users/me/addresses`
- `POST /users/me/addresses`
- `PATCH /users/me/addresses/{addressId}`
- `DELETE /users/me/addresses/{addressId}`

### Catalog
- `GET /products`
- `GET /products/{productIdOrSlug}`
- `GET /categories`
- `GET /categories/{slug}`
- Admin product/category/brand/variant CRUD endpoints.

### Cart and wishlist
- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/{itemId}`
- `DELETE /cart/items/{itemId}`
- `DELETE /cart/items`
- `GET /wishlist`
- `POST /wishlist/items`
- `DELETE /wishlist/items/{itemId}`

### Checkout and orders
- `POST /checkout/quote`
- `POST /checkout`
- `GET /orders`
- `GET /orders/{orderId}`
- `POST /orders/{orderId}/cancel`
- `POST /orders/{orderId}/returns`

### Payments and webhooks
- `POST /payments`
- `GET /payments/{paymentId}`
- `POST /payments/{paymentId}/verify` where provider flow requires it
- `POST /webhooks/{provider}`

### Reviews and notifications
- `GET /products/{productId}/reviews`
- `POST /products/{productId}/reviews`
- `PATCH /reviews/{reviewId}`
- `GET /notifications`
- `PATCH /notifications/{notificationId}/read`

### Admin
- `/admin/products`, `/admin/categories`, `/admin/inventory`, `/admin/orders`, `/admin/coupons`, `/admin/users`, `/admin/roles`, `/admin/reports`.

## 5. List endpoint requirements

Support a consistent subset of:
- `page`, `pageSize` for offset pagination.
- Cursor pagination for large/changing datasets.
- `sort` with allowlisted fields and direction.
- Explicit filter parameters.
- Maximum page size.
- Stable deterministic ordering.
- Response metadata with total count only when needed; counts can be expensive.

Never pass arbitrary user-supplied field names directly into SQL `ORDER BY`.

## 6. API behavior requirements

- Validate params, query and body.
- Validate content type and request size.
- Document auth requirements and permission scopes.
- Document request and response schemas in OpenAPI.
- Use an idempotency key for checkout/payment creation where appropriate.
- Use ETags/conditional requests only where semantics are clear.
- Set appropriate `Cache-Control` for public catalog responses and `private, no-store` for sensitive responses.
- Use request IDs across logs and error responses.
- Do not return ORM entities directly; use explicit response DTOs.
- Keep API contracts backward compatible within a version.
