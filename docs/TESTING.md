# Testing Strategy

## 1. Test pyramid

### Unit tests
Test deterministic business logic without network/database:
- Price, tax, shipping and coupon calculations.
- State transition rules.
- Permission evaluation.
- Token expiry/claim validation.
- Inventory quantity calculations.
- Idempotency fingerprinting.

### Integration tests
Use disposable PostgreSQL and Redis:
- Repository behavior and constraints.
- Transaction rollback.
- Registration/session lifecycle.
- Cart merge.
- Inventory reservation and release.
- Coupon limit enforcement.
- Order/payment transitions.
- Webhook deduplication.
- Outbox processing.

### API tests
Use Supertest against the Express app:
- Status codes and response schema.
- Authentication and authorization.
- Validation failures.
- Pagination and filtering.
- Rate limits.
- Error handling.

### E2E tests
Use Playwright:
- Register/login.
- Browse/search/filter.
- Add to cart.
- Checkout with payment sandbox/test adapter.
- View order.
- Admin manages product and inventory.

### Load tests
Use k6:
- Product browsing.
- Search.
- Authentication.
- Cart updates.
- Checkout.
- Contended last-item inventory purchase.

## 2. Mandatory failure and concurrency scenarios

1. Two users try to buy the last unit simultaneously; at most one succeeds.
2. Two requests redeem the final coupon use; limit is not exceeded.
3. Same idempotency key submitted concurrently; one business operation occurs.
4. Same payment webhook delivered multiple times; effects happen once.
5. Webhook arrives before browser redirect; order state remains correct.
6. Payment provider times out after request may have succeeded; reconciliation prevents duplicate charge/order.
7. Redis unavailable; durable operations remain correct and degrade safely.
8. PostgreSQL unavailable; API returns controlled 503/5xx and does not claim success.
9. Worker crashes after side effect but before acknowledgment; retry is safe.
10. Backend restarts with active sessions; session behavior is as designed.
11. A customer changes an order ID to another user's ID; access is denied.
12. Coupon expires during checkout; backend revalidates at commit.

## 3. Test data

Use deterministic seed scripts and synthetic data. Never use real customer/payment data in test environments.

Large datasets belong in local benchmark environments, not tiny free cloud databases.

## 4. CI quality gates

At minimum:
- Formatting/lint.
- TypeScript typecheck.
- Unit tests.
- Integration tests.
- Build.
- Dependency/security scan.
- Migration validation.

E2E and load tests can run on selected workflows to control free CI usage.
