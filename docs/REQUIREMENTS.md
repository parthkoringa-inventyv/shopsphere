# Product and Engineering Requirements

## 1. Purpose and scope

ShopSphere is a single-vendor e-commerce platform used as a comprehensive backend engineering challenge. The first release supports one merchant/store. Multi-vendor capabilities are a later extension.

### Goals
- Deliver a working customer storefront and admin interface.
- Build a maintainable Express + TypeScript modular monolith.
- Learn relational data modeling and SQL, not only ORM CRUD.
- Implement both server-side sessions and a separate JWT authentication mode.
- Demonstrate safe payment, order and inventory workflows.
- Measure performance and deploy within a strict $0 budget.

### Out of scope for first release
- Microservices.
- Multi-vendor seller onboarding and seller settlements.
- Real card-data handling.
- Real logistics integrations before a mock adapter works.
- Native mobile applications.
- High-availability or paid production SLAs.

## 2. Personas and roles

| Persona / role | Capabilities |
|---|---|
| Guest | Browse public catalog, maintain a temporary cart |
| Customer | Manage profile, addresses, cart, wishlist, orders and reviews |
| Administrator | Full administrative access |
| Product manager | Manage catalog and product media |
| Inventory manager | Manage stock and stock adjustments |
| Order manager | Process orders, shipments and eligible refunds |
| Support agent | Read permitted customer/order information and assist users |

Use role-based permissions plus resource-level ownership checks. A customer may access only their own private resources. Do not trust role names or IDs sent by the browser.

## 3. Functional requirements

### FR-01 Identity and accounts
- Register with name, email and password; optionally add phone verification later.
- Enforce normalized unique email addresses.
- Hash passwords using Argon2id with reviewed parameters.
- Verify email with a random, single-use, expiring token.
- Resend verification with abuse controls.
- Login and logout.
- Forgot/reset password with a single-use, expiring token.
- Change password after checking current password.
- Invalidate active sessions/refresh-token families after password reset or compromise.
- Track last login and account status.
- Avoid account enumeration in public responses.
- Rate-limit registration, login, verification resend and password reset.

### FR-02 Session authentication mode
- Issue a cryptographically random opaque session identifier in a secure cookie.
- Store session state server-side (Redis in deployed mode; a documented local adapter for development).
- Support session lookup, expiry, revocation, rotation and logout.
- Support current-device logout and logout-all-devices.
- Support idle timeout and absolute lifetime.
- Store only a hash/HMAC of the session identifier where practical; never log the raw value.
- Use `HttpOnly`, `Secure` in HTTPS environments, an appropriate `SameSite` policy and a host-only cookie.
- Protect cookie-authenticated state-changing requests against CSRF.
- Do not store session IDs in localStorage or sessionStorage.

### FR-03 JWT authentication mode
Implement as a distinct, selectable authentication strategy, not as an accidental second cookie on every request.
- Short-lived signed access token.
- Refresh token rotation with server-side token-family records.
- Store only a hash of refresh tokens.
- Detect reuse of an already-rotated refresh token and revoke the affected token family.
- Validate signature, algorithm allowlist, issuer, audience, expiry and not-before claims.
- Provide refresh, logout and logout-all behavior.
- Define safe browser token transport. Prefer an HttpOnly refresh-token cookie and keep access tokens in memory; protect cookie-based refresh/logout endpoints against CSRF.
- Document why JWT does not automatically make an application stateless when refresh-token revocation is required.

### FR-04 Authorization
- Maintain roles, permissions, user-role and role-permission mappings.
- Enforce permissions on backend routes/services.
- Enforce ownership checks for customer resources.
- Prevent insecure direct object reference (IDOR/BOLA).
- Record sensitive administrative actions in an audit log.
- Frontend guards only improve navigation/UX; they are not security controls.

### FR-05 Catalog
- Manage products, categories, brands, variants, attributes and images.
- Product fields include name, slug, SKU, description, status, SEO metadata and timestamps.
- Variant fields include SKU, option values, optional price override, weight/dimensions and status.
- Support product listing, details, category browsing, search, filters, sort and pagination.
- Support archive/soft-delete where historical orders require product references.
- Validate media type, size and authorization for uploads.
- Keep purchased product name/SKU/price snapshots in order items.

### FR-06 Cart and wishlist
- Support guest and authenticated carts.
- Add, update quantity, remove and clear cart items.
- Merge guest cart on login with documented duplicate/quantity rules.
- Reject invalid quantities and unavailable variants.
- Recalculate price on the server.
- Support wishlist add/remove/list and duplicate prevention.
- Cart totals are previews only; checkout recalculates all values.

### FR-07 Inventory
- Track stock by product variant.
- Record every stock movement with reason, quantity, actor and timestamp.
- Support receiving stock, adjustment, reservation, commit and release.
- Prevent negative available stock using database-level safeguards and transactional updates.
- Reserve inventory during checkout for a configurable expiry period.
- Commit reservation after verified payment; release on failure/expiry/cancellation where policy permits.
- Test simultaneous purchase of the final unit.
- Provide low-stock reporting/notification.

### FR-08 Pricing, tax, coupons
- Centralize server-side price calculation.
- Support fixed and percentage discounts, minimum basket amount, maximum discount, validity window, global and per-customer redemption limits.
- Support product/category eligibility and first-order rules.
- Define coupon stacking behavior explicitly.
- Use integer minor currency units (for INR, paise) or a carefully chosen decimal representation; never use binary floating point for money.
- Store price, discount, tax and shipping snapshots on order records.
- Tax rules are configurable and documented; do not claim legal/tax compliance without proper review.

### FR-09 Checkout and orders
- Select/create delivery address and shipping method.
- Validate address/serviceability as a separate step.
- Recalculate cart, coupon, tax and shipping server-side.
- Create order and order items transactionally with inventory reservation and idempotency protection.
- Persist immutable purchase snapshots.
- Maintain order status history.
- Validate state transitions through a state machine.
- Customer can view only their orders.
- Support cancellation policy, return request, refund workflow and invoice generation.
- Do not mark an order paid based solely on a browser redirect.

### FR-10 Payments
- Use a payment provider sandbox only during learning.
- Create provider payment intent/order on the backend.
- Verify provider callback/signature server-side.
- Verify webhook signatures using the exact raw request body when required by provider.
- Persist webhook event IDs and deduplicate processing.
- Make payment transitions idempotent.
- Handle delayed, duplicate, failed and out-of-order webhook events.
- Record payment attempts, provider references and refund records.
- Implement reconciliation/manual review for mismatches.
- Never store card numbers, CVV or raw payment credentials.

### FR-11 Shipping
- Start with a mock shipping-provider adapter.
- Support shipping methods, charges, shipment creation, tracking events and delivery status.
- Keep provider-specific code behind an interface.
- Support return shipment later.

### FR-12 Reviews
- Permit eligible customers to review products.
- Enforce one review per eligible order item/purchase according to policy.
- Rating 1–5, text and optional image.
- Edit/delete under defined policy.
- Moderation, report and aggregate rating.
- Prevent spoofing of verified-purchase status.

### FR-13 Notifications and background work
- Email verification, password reset, order confirmation, payment result, shipment updates, delivery, cancellation and refund notifications.
- In-app notification inbox.
- Process non-critical work asynchronously.
- Use retries with exponential backoff and bounded attempts.
- Make jobs idempotent.
- Record failed jobs and provide a retry/dead-letter handling policy.
- Use a transactional outbox for important domain events.
- Free deployment may require API and worker to share one compute process initially; preserve a separate worker entry point so it can be split later.

### FR-14 Admin and reporting
- Dashboard for order/revenue/product summaries.
- Product/category/brand management.
- Inventory and stock movements.
- Order processing and refund authorization.
- Coupon management.
- User/role/permission management.
- Review moderation.
- Audit logs.
- Paginated reports with date filters.

## 4. Non-functional requirements

### Security
- Follow OWASP ASVS concepts and OWASP API Security Top 10.
- Validate all untrusted input on the server.
- Use parameterized SQL.
- Apply least privilege to database credentials.
- Set explicit CORS origins.
- Configure secure headers, request body limits and timeouts.
- Protect against CSRF, XSS, SQL injection, SSRF, open redirects, mass assignment and BOLA.
- Keep secrets out of Git, client bundles and logs.
- Run dependency and secret scans.

### Reliability and consistency
- PostgreSQL is authoritative for orders, payments, inventory and account state.
- Transactions protect multi-row business operations.
- Idempotency protects retryable commands and webhooks.
- Redis outage must not corrupt durable business state.
- Graceful shutdown must stop accepting requests and finish/stop work safely.
- Provide health and readiness endpoints.

### Performance
Initial targets are learning objectives under a documented test environment, not production SLAs:
- Product list P95 under 300 ms at the selected baseline load.
- Product detail P95 under 300 ms at baseline load.
- No unbounded list endpoints.
- No known N+1 query on primary catalog/order paths.
- Record P50/P95/P99, throughput, error rate and database query behavior.
- Benchmark before and after caching/index changes.

### Accessibility and usability
- Responsive Angular UI.
- Keyboard-accessible interactions.
- WCAG AA-oriented contrast and semantics.
- Useful loading, empty, error and retry states.
- Avoid exposing admin functionality to unauthorized users.

### Maintainability
- Strict TypeScript; avoid `any`.
- Feature/module boundaries.
- Consistent error model.
- API contract documentation.
- Database migrations committed to Git.
- Automated tests in CI.
- Architecture decisions recorded.

## 5. Acceptance criteria for the first release

The release is acceptable when:
- A guest can browse and search products.
- A customer can register, verify email (development mail capture acceptable), log in, manage profile and addresses.
- Both session and JWT modes work independently and have documented security trade-offs.
- A customer can add items, checkout, complete a sandbox payment and view an order.
- Duplicate payment events/requests do not duplicate financial or inventory effects.
- Concurrent checkout cannot oversell stock.
- Admin permissions are enforced server-side.
- Product/catalog reads use pagination and appropriate indexes.
- Redis caching can be enabled/disabled and invalidation is tested.
- Background jobs retry safely.
- Unit, integration and E2E suites pass.
- The application is deployed on free tiers with documented limitations and no paid resources.
- A local backup/export and restore procedure is demonstrated.
