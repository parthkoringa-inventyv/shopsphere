# Deployment Preparation --- ShopSphere (Strict \$0 Budget)

**Purpose:** Prepare and deploy the minimal Phase 1 foundation now, then
use the same controlled release process for every subsequent phase. This
is a learning/demo deployment, not a commercial uptime commitment.

## 1. Deployment objectives

The first deployment contains only: - Angular 21 static frontend. -
Express + TypeScript API. - PostgreSQL database. - HTTPS and restricted
CORS. - Liveness and readiness endpoints. - CI quality gates and
controlled CD. - Safe configuration, logs and a documented rollback
path.

Do not deploy unfinished authentication, catalog, cart, checkout,
payment or shipping features. Add each capability only after its phase
passes tests.

## 2. Non-negotiable cost policy

1.  Total recurring and one-time spend must remain \$0.
2.  Do not start paid trials or provide payment details to unlock a
    trial.
3.  Do not add a paid custom domain.
4.  Disable automatic upgrades and paid overage wherever the provider
    exposes those controls.
5.  If a provider requires a card, paid commitment or uncontrolled
    overage exposure, stop and select another option.
6.  Re-check provider terms immediately before provisioning; the
    candidates in `FREE_DEPLOYMENT.md` are provisional, not guarantees.
7.  Keep a local Docker Compose environment and local backups even after
    deployment.
8.  Do not use artificial keep-alive traffic to evade free-tier sleep
    policies.

## 3. Provisional hosting topology

  --------------------------------------------------------------------------------
  Component         Candidate from    Responsibility             Must verify
                    the project                                  
                    architecture                                 
  ----------------- ----------------- -------------------------- -----------------
  Angular static    Cloudflare Pages  Serve compiled Angular SPA Build limits,
  frontend          Free                                         bandwidth, SPA
                                                                 fallback and
                                                                 current free
                                                                 terms

  Express API       Render Free Web   Run the API                Sleep/cold start,
                    Service                                      ephemeral disk,
                                                                 outbound
                                                                 connections,
                                                                 deploy behavior

  PostgreSQL        Supabase Free or  Durable application data   Pause policy,
                    another verified                             size, expiry,
                    free persistent                              backup/export,
                    PostgreSQL                                   connection
                    service                                      limits,
                                                                 card/overage
                                                                 terms

  Redis             Upstash Free only Sessions/cache/ephemeral   Commands,
                    when required     coordination               bandwidth,
                                                                 memory,
                                                                 connection
                                                                 semantics and
                                                                 quota behavior

  Source control/CI GitHub Free       Source, CI and deployment  Current Actions
                                      orchestration              quotas and
                                                                 repository
                                                                 visibility rules

  Object storage    Defer until a     Product images             Storage, egress,
                    verified free                                image limits,
                    persistent option                            card and overage
                    is selected                                  policy

  Email             Development       Verification and           A genuinely free
                    capture first     transactional messages     provider must be
                                                                 verified before
                                                                 enabling real
                                                                 delivery
  --------------------------------------------------------------------------------

Official candidate references recorded in `FREE_DEPLOYMENT.md`: -
Cloudflare Pages: https://pages.cloudflare.com/ - Render pricing:
https://render.com/pricing - Render free services:
https://render.com/docs/free - Supabase pricing:
https://supabase.com/pricing - Supabase free Postgres FAQ:
https://supabase.com/kb/faqs/platform/free-postgres-for-side-projects -
Upstash Redis: https://upstash.com/pricing/redis - GitHub Actions
billing:
https://docs.github.com/en/billing/concepts/product-billing/github-actions

These links are starting points, not proof that a particular plan is
still free or suitable.

## 4. Deployment topology and trust boundaries

``` text
Browser
  | HTTPS
  +---- Angular SPA hosting
  |
  +---- Express API hosting
            |
            +---- PostgreSQL (durable source of truth)
            |
            +---- Redis (only for features that require it)
            |
            +---- External sandbox adapters (only in later phases)
```

Rules: - Browser input is untrusted. - API owns authorization and
business rules. - PostgreSQL owns durable account, catalog, stock, order
and payment state. - Redis is disposable and must never be the only copy
of business truth. - The API filesystem is assumed ephemeral unless the
selected host explicitly guarantees otherwise. - Never expose PostgreSQL
or Redis directly to the public internet.

## 5. Pre-provisioning checklist

### Provider and cost verification

-   [ ] Read the official current pricing page.
-   [ ] Confirm the exact selected plan says \$0.
-   [ ] Confirm whether a payment card is required.
-   [ ] Confirm no paid trial is being activated.
-   [ ] Confirm overage behavior and disable paid upgrades.
-   [ ] Check resource expiry, inactivity pause, sleep and quota
    policies.
-   [ ] Check database export and restore options.
-   [ ] Check region and connection limits.
-   [ ] Record the date and evidence of the verification.

### Repository readiness

-   [ ] Main branch builds from a clean checkout.
-   [ ] Lockfiles are committed.
-   [ ] Node version is pinned and supported.
-   [ ] `.env`, keys, tokens and database dumps are ignored by Git.
-   [ ] Production build does not contain server secrets.
-   [ ] CI runs lint, typecheck, tests and builds.
-   [ ] Health/readiness endpoints are present.
-   [ ] Graceful shutdown is implemented.
-   [ ] Production error responses do not reveal stack traces.

## 6. Environment and secrets design

Keep separate configuration sets for local, CI and production.

Typical API variables (adapt names to the actual Phase 1
configuration): - `NODE_ENV` - `PORT` - `DATABASE_URL` - `DIRECT_URL`
only if the selected Prisma/provider migration setup requires it -
`WEB_ORIGIN` - `API_PUBLIC_ORIGIN` - `LOG_LEVEL` - `AUTH_MODE` only when
Phase 2 is implemented - Session/JWT/email/payment secrets only when
their respective phase is implemented

Typical frontend configuration: - Public API base URL only. - No
database credentials, Redis credentials, JWT signing keys, email
credentials or payment secrets.

Rules: 1. Validate required variables at API startup. 2. Keep
`.env.example` with placeholders, never real values. 3. Use hosting
environment-variable settings for production secrets. 4. Restrict access
to deployment settings. 5. Rotate a secret if it is accidentally
committed or exposed. 6. Never log environment objects, connection
strings, cookies, authorization headers or raw tokens.

## 7. Initial deployment runbook (Phase 1)

1.  Run the full local Phase 1 checklist.
2.  Verify the production build locally.
3.  Provision the frontend host, API host and PostgreSQL only after cost
    verification.
4.  Configure API environment variables and database connectivity.
5.  Apply reviewed Prisma migrations using a controlled migration step.
6.  Deploy the API.
7.  Verify liveness and readiness endpoints.
8.  Deploy Angular with the public API base URL.
9.  Configure SPA fallback and exact CORS origin.
10. Test the site in a clean browser profile.
11. Verify HTTPS, error handling, request IDs and log redaction.
12. Record the public URL, commit SHA, migration version and known
    limitations.

## 8. Database migration policy

-   Every schema change is a committed Prisma migration.
-   Inspect generated SQL before deployment.
-   Test migration on a clean database and on a copy of the previous
    schema.
-   Do not edit migrations that have already been applied to a
    shared/deployed database.
-   Prefer expand-and-contract changes: add nullable/new columns or
    tables first, deploy code compatible with both shapes, backfill,
    then remove obsolete structures in a later release.
-   Do not run destructive migration commands against production.
-   Do not automatically run an unreviewed migration from every
    application replica at startup.
-   Keep a migration log with timestamp, commit, migration name and
    result.
-   Back up/export before high-risk data migrations.

## 9. CI/CD policy

### Pull request CI

1.  Install from lockfile.
2.  Format/lint.
3.  Typecheck.
4.  Unit tests.
5.  Integration tests that can run in CI.
6.  Prisma schema/migration validation.
7.  Angular and API production builds.
8.  Dependency/secret scanning where quota permits.

### Deployment

1.  Only the selected main/release branch may deploy.
2.  Deployment requires successful CI.
3.  Deployment secrets are stored in repository/environment secrets.
4.  Use least-privilege deployment tokens.
5.  Do not print secrets.
6.  Deploy API before frontend when the frontend depends on new API
    behavior.
7.  Run smoke tests after deployment.
8.  Record commit SHA and migration version.
9.  Keep a manual deploy procedure in case free CI quota is exhausted.

## 10. Release pattern for every phase

Every phase must use this order:

1.  Complete implementation locally.
2.  Run unit, integration, API and relevant E2E tests.
3.  Run the full regression suite from all prior phases.
4.  Review schema and migration SQL.
5.  Test migrations against a disposable copy of the deployed schema.
6.  Confirm backward compatibility or document expand-and-contract
    rollout.
7.  Merge only after CI passes.
8.  Deploy the backend/API.
9.  Run API smoke tests.
10. Deploy the frontend.
11. Run browser smoke tests and verify the previous journeys.
12. Check logs, quotas and provider status.
13. Record release evidence and rollback plan.

Do not make unfinished routes discoverable or publicly usable. Use
feature flags or keep routes unmounted until ready. Authorization must
still protect every administrative route.

## 11. Smoke-test catalogue

### Initial foundation

-   Frontend loads over HTTPS.
-   API liveness returns success.
-   Readiness checks required dependencies.
-   Frontend can call API.
-   Invalid route returns standard 404.
-   API outage produces a useful frontend error.
-   No secrets appear in built assets.

### Authentication (Phase 2)

-   Register/verify/login/logout in the configured mode.
-   Refresh/reload restores state correctly.
-   CSRF/CORS/cookie behavior works in a real browser.
-   Customer cannot call admin API.
-   Run separate test suites for session and JWT modes.

### Catalog/inventory (Phase 3)

-   Public catalog lists only active products.
-   Admin can create/publish a test product.
-   Customer cannot mutate product or stock.
-   Stock adjustment creates movement history.

### Cart/pricing (Phase 4)

-   Guest cart persists according to documented policy.
-   Login merge follows deterministic rules.
-   Server recalculates totals.
-   Coupon limits cannot be exceeded.

### Checkout/orders (Phase 5)

-   Checkout quote is recalculated server-side.
-   Repeated idempotency key does not create duplicate order.
-   Concurrent final-unit purchase does not oversell.
-   Reservation expiry releases stock safely.

### Payments (Phase 6)

-   Sandbox payment success/failure.
-   Duplicate webhook does not duplicate effects.
-   Browser redirect alone cannot mark paid.
-   Refund state is reconciled.

### Fulfilment/shipping (Phase 7)

-   Paid/eligible order can be packed and shipped.
-   Tracking timeline is persisted.
-   Manual simulation works if worker is asleep.
-   Replayed jobs do not duplicate events.

### Customer experience/notifications (Phase 8)

-   Eligible customer can submit one review under policy.
-   Moderation hides rejected/pending reviews from public listing.
-   In-app notification is persisted.
-   Delivery retry is idempotent.

### Operations/reporting (Phase 9)

-   Admin views are permission-gated.
-   Date-filtered reports match database aggregates.
-   Audit logs do not expose secrets.
-   Pagination is bounded.

## 12. Cold starts, sleeping services and workers

-   The UI must handle a sleeping API with a clear loading state and
    retry action.
-   Do not use keep-alive pings to bypass host sleep rules.
-   Do not promise exact background-job timing on a free host that can
    sleep.
-   Use persisted jobs/outbox records so work can resume after process
    restart.
-   Make a bounded worker entry point that can run in the same API
    process initially.
-   Provide a manual admin/demo processing action for simulations that
    must be demonstrated on demand.
-   If the provider pauses the database, document wake-up behavior and
    avoid claiming real-time availability.

## 13. Backups, recovery and rollback

1.  Export PostgreSQL regularly using the provider-supported method and
    keep a local encrypted copy.
2.  Never commit production dumps to Git.
3.  Verify restore into a separate local database, not merely that an
    export file exists.
4.  Before a risky migration, create an export and test the migration
    against a copy.
5.  Application rollback means redeploying the last known-good artifact.
6.  Database rollback is not always safe after writes. Prefer a
    forward-fix migration unless a tested restore is necessary.
7.  Document the maximum data loss window implied by the actual backup
    frequency; do not invent an RPO/RTO guarantee.
8.  Keep a local synthetic demo dataset so the project remains
    demonstrable if a free provider pauses or removes a resource.

## 14. Monitoring and quota controls

-   Use host-provided logs and health dashboards first.
-   Track database storage, connection count, API sleep/cold starts,
    Redis commands/bandwidth and build minutes.
-   Review quotas monthly and before major demo milestones.
-   Keep logs bounded and avoid verbose request-body logging.
-   Run load tests locally, not against shared free infrastructure.
-   Keep catalog seed data small in hosted environments.
-   Do not deploy large media files until a persistent free storage
    solution is verified.

## 15. Final deployment acceptance

-   [ ] Every required first-release user journey passes in the deployed
    environment.
-   [ ] No paid resources, trials, auto-upgrades or paid domains are
    active.
-   [ ] Database export and restore have been demonstrated.
-   [ ] All migrations are committed and reviewed.
-   [ ] CI gates every release.
-   [ ] Production secrets are not in Git or client assets.
-   [ ] CORS, cookies, CSRF and HTTPS are verified in a real browser.
-   [ ] Worker recovery and idempotency are demonstrated.
-   [ ] API and UI handle cold starts/provider pauses.
-   [ ] Security, accessibility and performance reports are documented.
-   [ ] Known free-tier limitations are visible in the project README.

## 16. Final reality check

The application should be engineered with production principles, but the
hosting tier is a demonstration environment. Free providers may sleep,
pause, change terms, enforce quotas or discontinue plans. This
architecture cannot promise commercial uptime, guaranteed background
execution, high availability or provider support.
