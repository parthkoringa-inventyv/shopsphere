# Architecture and Design

## 1. Architectural style

Use a **modular monolith**. One Express application initially hosts multiple business modules. Modules communicate through explicit service interfaces and domain events rather than importing each other's repositories freely.

Why:
- Easier local development and free deployment.
- One database transaction can cover core business invariants.
- Lower operational complexity than microservices.
- Clear module boundaries make future extraction possible.

Do not split services merely because folders exist.

## 2. Logical architecture

```text
Angular SPA
   |
   | HTTPS / JSON / Cookie or Bearer token
   v
Express API (/api/v1)
   |
   +-- Middleware: request ID, security headers, CORS, parsing, auth, validation
   |
   +-- Modules
   |    +-- Auth / Users / Access control
   |    +-- Catalog / Inventory
   |    +-- Cart / Wishlist / Pricing
   |    +-- Checkout / Orders / Payments / Shipping
   |    +-- Reviews / Notifications / Admin / Analytics
   |
   +-- Infrastructure adapters
        +-- Prisma + PostgreSQL
        +-- Raw SQL for measured/educational queries
        +-- Redis-compatible cache/session/queue
        +-- Object storage adapter
        +-- Payment provider adapter
        +-- Email adapter
        +-- Background worker / outbox dispatcher
```

## 3. Trust boundaries

- Browser input is untrusted.
- The API is the authorization and business-rule enforcement boundary.
- PostgreSQL is the durable source of truth.
- Redis is disposable/ephemeral infrastructure; its loss must not destroy orders or inventory truth.
- Payment and shipping providers are external systems whose callbacks must be authenticated and treated as at-least-once delivery.
- Uploaded files are untrusted content and must be validated.

## 4. Backend request flow

1. Assign or validate a request ID.
2. Apply security headers, CORS and request size/time limits.
3. Parse supported content types.
4. Authenticate the caller using the selected strategy.
5. Validate request parameters/body/query.
6. Authorize action and resource ownership.
7. Execute application service/business logic.
8. Access database through repository/query layer.
9. Commit transaction before emitting externally visible side effects.
10. Return a stable response envelope.
11. Log method, route, status, duration and request ID without secrets.

## 5. Module boundaries

| Module | Owns |
|---|---|
| Auth | Credentials, sessions, refresh-token families, verification/reset tokens |
| Users | Profile and account lifecycle |
| Access control | Roles, permissions and policy checks |
| Catalog | Products, categories, brands, variants and attributes |
| Inventory | Stock, reservations and movements |
| Cart | Cart and cart-item rules |
| Pricing | Price/tax/discount calculation |
| Coupons | Coupon eligibility and redemption limits |
| Checkout | Orchestration of address, pricing, stock and order creation |
| Orders | Order snapshots, state machine and status history |
| Payments | Provider payment/refund records and webhook inbox |
| Shipping | Shipment and tracking lifecycle |
| Reviews | Reviews, moderation and aggregates |
| Notifications | Notification records and delivery orchestration |
| Admin/Audit | Administrative use cases and immutable audit records |

## 6. Authentication strategy selection

Expose two separately configured modes for learning:
- `AUTH_MODE=session`
- `AUTH_MODE=jwt`

Do not allow a request to silently authenticate by whichever credential happens to be present. Each mode has a clearly defined credential transport and middleware.

Session mode:
- Opaque cookie identifier.
- Server-side session store.
- CSRF defense for unsafe methods.
- Rotation, idle timeout, absolute expiry and revocation.

JWT mode:
- Short-lived access token.
- Rotating refresh token with server-side family tracking.
- Strict claim validation.
- Refresh/logout CSRF defense if refresh token is cookie-based.
- Reuse detection and family revocation.

A deployment should select one active mode at a time unless an explicit migration/dual-mode design is documented. Both implementations are built and tested, but users should not have ambiguous mixed credentials.

## 7. Data consistency boundaries

Use PostgreSQL transactions for:
- Stock reservation and reservation rows.
- Order and order-item creation.
- Coupon redemption limits.
- Payment state changes and related order transitions.
- Refund state and inventory restoration when policy requires it.

Never call a payment provider or email service inside a long-running database transaction. Persist intent/outbox record, commit, then call the external system asynchronously.

## 8. Caching strategy

- Cache-aside for public catalog reads.
- Cache keys include relevant filters/sort/page and catalog version where needed.
- Invalidate or version keys after product/category changes.
- Never cache private user data without user-scoped keys and strict expiry.
- Do not cache authorization decisions beyond their safe invalidation window.
- Do not make Redis the authority for stock counts or payment status.
- Define a safe degraded behavior when Redis is unavailable.

## 9. Deployment topology (free-tier learning topology)

```text
Browser
  |
  +--> Cloudflare Pages (Angular static build)
  |
  +--> Render free web service (Express API; cold starts)
           |
           +--> Supabase free PostgreSQL
           |
           +--> Upstash free Redis
           |
           +--> External sandbox provider(s)
```

The exact provider choice is provisional and must be re-verified at deployment time. Free service terms and quotas change. See `FREE_DEPLOYMENT.md`.

## 10. Quality attributes and trade-offs

| Decision | Benefit | Cost / limitation |
|---|---|---|
| Modular monolith | Simple deployment, clear domain boundaries | Requires discipline to avoid module coupling |
| PostgreSQL | Strong transactions and relational constraints | Requires query/index knowledge |
| Prisma + raw SQL | Productive CRUD plus SQL learning | Must understand generated queries and transaction semantics |
| Redis | Fast ephemeral state and cache | Another dependency and consistency concerns |
| Both auth models | Broad learning | More implementation and security review |
| Free hosting | $0 learning deployment | Sleep, quotas, pauses, no SLA |
| Angular SPA | Strong typed client architecture | SEO needs extra consideration; storefront can initially be app-rendered |

## 11. Architecture decision process

For any significant decision, record:
- Context/problem.
- Options considered.
- Decision.
- Consequences and trade-offs.
- How the decision will be validated.
