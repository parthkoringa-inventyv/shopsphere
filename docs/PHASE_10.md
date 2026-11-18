# Phase 10 --- Final Hardening, Recovery and Release

**Prerequisites:** Phases 1--9 are complete and deployed.\
**Requirements covered:** All non-functional requirements and
first-release acceptance criteria in `REQUIREMENTS.md`.\
**Goal:** Prove the single-vendor ShopSphere release is secure,
recoverable, accessible, measured, documented and demonstrable within
the strict \$0 hosting constraint.

## 1. Definition of final release

The final release must demonstrate: 1. Guest can browse/search/filter
products. 2. Customer can register, verify, log in, manage profile and
addresses. 3. Session and JWT modes each work independently and have
documented trade-offs. 4. Customer can use cart/wishlist/coupons and
server-side pricing. 5. Customer can checkout with stock reservation and
idempotent order creation. 6. Sandbox payment can be verified through
signed webhook processing. 7. Duplicate payment events do not duplicate
financial/inventory effects. 8. Customer can view order and shipment
tracking. 9. Mock delivery can be advanced automatically while awake or
manually for demo. 10. Eligible customer can review a purchased product.
11. Admin permissions are enforced server-side. 12. Background jobs
retry safely. 13. Unit, integration, API and E2E suites pass. 14.
Deployed application uses only verified \$0 resources. 15. Database
export and restore are demonstrated.

## 2. Workstream A --- Full regression and requirements traceability

1.  Build a traceability matrix mapping every FR-01 through FR-14 and
    each NFR to implementation, API, UI and tests.
2.  Mark each item complete, deferred with reason, or not applicable.
3.  Run clean-clone setup from README.
4.  Run migrations from an empty database.
5.  Run upgrade migrations from the prior release schema.
6.  Run all API tests with `AUTH_MODE=session`.
7.  Run all API tests with `AUTH_MODE=jwt`.
8.  Run Angular unit/component tests.
9.  Run Playwright customer and admin journeys.
10. Run dependency, secret and static analysis scans.
11. Fix or explicitly document every failure; do not silently waive a
    required acceptance criterion.

## 3. Workstream B --- Security assessment

Review against OWASP ASVS concepts and OWASP API Security Top 10: -
Authentication and account recovery. - Session fixation, expiry,
revocation and CSRF. - JWT algorithm/issuer/audience/expiry validation
and refresh reuse. - Authorization, least privilege, IDOR/BOLA and mass
assignment. - Input validation, SQL injection and safe
sorting/filtering. - XSS through product descriptions, reviews and
notification templates. - SSRF/open redirects if any URL-fetching or
redirect feature exists. - Upload validation if media upload is
enabled. - Rate limits and abuse controls. - Payment webhook
signature/replay/idempotency. - Secrets and PII in logs, error responses
and frontend bundle. - Security headers, body limits, timeouts and CORS.

Steps: 1. Run automated dependency and secret scans. 2. Run targeted
negative API tests. 3. Review authorization on every private/admin
endpoint. 4. Review database roles and least-privilege credentials. 5.
Rotate any exposed credentials. 6. Document residual risks and
mitigations. 7. Do not claim formal certification or legal compliance
from a checklist.

## 4. Workstream C --- Reliability and failure recovery

Test: 1. PostgreSQL unavailable during API request. 2. Redis unavailable
for cache/session-dependent behavior. 3. API process killed during a
request. 4. Worker killed before and after job side effect. 5. Duplicate
outbox/webhook/job delivery. 6. Database connection exhaustion. 7.
Provider cold start or database pause. 8. Payment provider timeout after
request may have succeeded. 9. Reservation expiry during retry. 10.
Deployment rollback with additive schema migration.

Verify: - PostgreSQL remains source of truth. - No operation reports
success before durable commit. - Idempotency prevents duplicate
effects. - Graceful shutdown is bounded. - Worker can recover due
jobs. - Redis loss cannot corrupt stock/order/payment truth. -
User-facing UI handles unavailable services.

## 5. Workstream D --- Backup and restore drill

1.  Choose a provider-supported database export method.
2.  Export the deployed synthetic/demo database.
3.  Store backup outside Git and protect it appropriately.
4.  Restore into a separate local PostgreSQL instance.
5.  Verify row counts and representative relationships.
6.  Run application smoke tests against restored data.
7.  Record export/restore duration and any manual steps.
8.  Document backup frequency and the actual data-loss window implied by
    it.
9.  Repeat before destructive schema changes.
10. Do not claim provider backup guarantees beyond what the current plan
    documents.

## 6. Workstream E --- Performance and capacity

1.  Use local PostgreSQL with deterministic synthetic data.
2.  Seed at least the agreed benchmark dataset; record hardware and
    versions.
3.  Run k6 scenarios for product listing/detail/search, auth, cart,
    checkout and last-item contention.
4.  Capture P50/P95/P99, throughput, error rate and query counts.
5.  Check N+1 query paths.
6.  Run `EXPLAIN (ANALYZE, BUFFERS)` on critical queries.
7.  Validate initial learning targets from `REQUIREMENTS.md`: product
    list/detail P95 under 300 ms at the documented baseline.
8.  Measure cache enabled/disabled; retain caching only if correctness
    and measured benefit justify it.
9.  Do not load-test shared free hosting.
10. Document limitations of the free plan separately from application
    performance.

## 7. Workstream F --- Accessibility and usability

1.  Test keyboard-only navigation for storefront and admin.
2.  Run automated accessibility checks (including axe where available).
3.  Verify form labels, field errors, focus management and dialog
    behavior.
4.  Verify contrast and semantic heading structure.
5.  Verify loading, empty, error and retry states.
6.  Verify responsive behavior at supported viewport sizes.
7.  Ensure admin actions are not communicated by color alone.
8.  Fix critical accessibility findings and document remaining
    limitations.

## 8. Workstream G --- Deployment and operational runbook

1.  Re-verify every provider plan and current quota.
2.  Confirm no paid resource, trial, paid domain, auto-upgrade or
    uncontrolled overage.
3.  Confirm production environment variables and secret rotation
    procedure.
4.  Confirm CI is required before deploy.
5.  Confirm API/frontend deployment order.
6.  Confirm migration procedure and expand-and-contract rules.
7.  Confirm smoke-test script.
8.  Confirm rollback procedure for application artifacts.
9.  Confirm forward-fix/restore procedure for database changes.
10. Confirm backup export/restore instructions.
11. Confirm cold-start and worker limitations are visible to demo users.
12. Record public URLs, deployed commit, migration version and service
    plans.

## 9. Workstream H --- Documentation and demo preparation

Update: - Root README. - REQUIREMENTS.md traceability. - ARCHITECTURE.md
with actual deployed topology. - DATABASE.md with actual schema and
backup process. - API.md/OpenAPI. - SECURITY.md with implemented
controls and known gaps. - TESTING.md with commands/results. -
FREE_DEPLOYMENT.md with actual selected providers/limits. - DECISIONS.md
with accepted/rejected decisions. - All phase files with completion
evidence.

Create a deterministic demo script: 1. Open storefront. 2. Browse and
filter products. 3. Register/verify/login with demo account. 4. Add
product to cart and apply test coupon. 5. Checkout and place order. 6.
Complete sandbox payment. 7. Open admin order queue and pack order. 8.
Create shipment and show tracking. 9. Advance mock delivery and verify
delivered state. 10. Submit eligible review. 11. Open admin
dashboard/report/audit view.

Use synthetic data and never expose real personal/payment data.

## 10. Final release acceptance checklist

### Functional

-   [ ] FR-01 to FR-14 are mapped and satisfied or explicitly deferred
    with an accepted reason.
-   [ ] All required customer and admin journeys work.
-   [ ] Single-vendor boundary is maintained.
-   [ ] No unfinished feature is accidentally exposed.

### Security

-   [ ] Both auth modes pass independent suites.
-   [ ] Authorization and ownership tests pass.
-   [ ] Payment webhook verification and idempotency pass.
-   [ ] No secrets/card data are stored or logged.
-   [ ] No unresolved critical/high security issue remains without
    documented mitigation.

### Reliability

-   [ ] Last-unit inventory concurrency passes.
-   [ ] Coupon limit concurrency passes.
-   [ ] Duplicate idempotency/webhook/job processing is safe.
-   [ ] Worker restart recovery passes.
-   [ ] Database export and restore are demonstrated.

### Quality

-   [ ] Lint, typecheck, unit, integration, API and E2E tests pass.
-   [ ] Accessibility checks pass at the agreed level.
-   [ ] Performance report includes reproducible conditions.
-   [ ] API/OpenAPI and database documentation match implementation.

### Deployment

-   [ ] Public application is reachable over HTTPS.
-   [ ] Only verified \$0 resources are used.
-   [ ] CI gates deployment.
-   [ ] Smoke tests pass after release.
-   [ ] Rollback and migration recovery procedures are documented.
-   [ ] Free-tier limitations are disclosed.

## 11. Final exit gate

The project is complete when all first-release acceptance criteria in
`REQUIREMENTS.md` are demonstrated, the deployment remains within \$0,
restore is tested, and known limitations are documented. Multi-vendor
support, real courier integrations, live payments, native apps and
high-availability infrastructure remain future projects rather than
hidden unfinished requirements.
