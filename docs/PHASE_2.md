# Phase 2 — Identity, Authentication & Access Control

**Project:** ShopSphere — Full-Stack E-Commerce Engineering Challenge  
**Prerequisite:** Phase 1 foundation is complete and its acceptance criteria pass.  
**Objective:** Build the complete identity and access-control foundation so that every later private feature can rely on authenticated identities, explicit permissions, resource ownership checks and auditable administrative actions.

> This plan follows `PHASE_1.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `SECURITY.md` and `TESTING.md`. Where those documents leave implementation details open, this plan records a recommended implementation decision rather than silently treating it as an existing requirement.

---

## 1. Phase goals and outcomes

At the end of Phase 2:

1. A user can register with name, email and password.
2. Email addresses are normalized and unique at the database level.
3. Passwords are hashed with Argon2id; plaintext passwords are never stored or logged.
4. Email verification and password-reset tokens are random, single-use, expiring and stored only as hashes.
5. A user can log in, log out, change password, request password reset and view/update their own profile.
6. Session authentication works as a complete, independently selectable strategy.
7. JWT authentication works as a complete, independently selectable strategy with short-lived access tokens and rotating refresh tokens.
8. The active strategy is selected explicitly through configuration (`AUTH_MODE=session` or `AUTH_MODE=jwt`). A request must not silently authenticate through whichever credential happens to be present.
9. Roles and permissions are enforced by the API, not merely hidden in Angular.
10. Customers can access only their own private resources. Administrative operations require explicit permissions.
11. Sensitive account and administrative actions are recorded in audit logs without storing secrets.
12. The Angular application has working registration, login, verification, account and logout flows for the configured authentication mode.
13. Automated tests cover success, failure, security and concurrency cases.
14. The implementation remains a modular monolith and is documented well enough for later catalog, cart, checkout and admin modules to reuse.

## 2. Scope boundaries

### Included

- Identity and user account lifecycle.
- Session authentication and session lifecycle.
- JWT access/refresh authentication and token-family lifecycle.
- Role-based permissions and server-side authorization.
- User profile and address book foundation.
- Development email-delivery adapter or mail-capture mechanism.
- Audit records for sensitive identity/access actions.
- Angular authentication and account screens.
- API documentation, tests, security review and decision records.

### Explicitly not included

- Product, category, brand or inventory management (Phase 3).
- Cart, wishlist, coupons, pricing, checkout or orders.
- Payment integration.
- Real SMS/phone verification.
- Social login or OAuth providers.
- Multi-factor authentication unless added later as a separately scoped enhancement.
- Production transactional email provider unless a genuinely free option is verified and accepted. Development must work without paid email.
- Multi-vendor tenant or seller roles. The first release remains single-vendor.

## 3. Architecture decisions for this phase

### 3.1 Authentication strategy selection

Implement both strategies, but activate exactly one per running API instance:

```env
AUTH_MODE=session
# or
AUTH_MODE=jwt
```

- Session mode accepts the configured session cookie as its authentication credential.
- JWT mode accepts a short-lived access token through the documented bearer-token transport. Refresh-token transport is separately defined and protected.
- Do not accept both cookie and bearer credentials opportunistically on the same request.
- The same user/account/authorization services are shared by both strategies. Only credential issuance, credential validation and lifecycle differ.
- Run the complete automated test suite once for each `AUTH_MODE` value.

### 3.2 Session storage

- Use Redis for server-side session state as specified by the requirements.
- Do not put session state in browser storage.
- If Phase 1 has only a Redis local service, use it for local development and test it under restart/unavailable conditions.
- If a local fallback adapter is implemented, label it development/test-only and do not silently use in deployment.
- Store only a hash/HMAC of the opaque session identifier where practical. Never log the raw identifier.

### 3.3 JWT refresh-token persistence

- Access tokens are short-lived signed tokens.
- Refresh tokens are random high-entropy opaque secrets or otherwise designed for safe rotation; persist only their hashes.
- Persist token-family state in PostgreSQL so revocation and reuse detection survive Redis loss/restart.
- Keep access tokens in Angular memory, not `localStorage` or `sessionStorage`.
- Prefer an HttpOnly refresh-token cookie for browser refresh flows; protect refresh/logout endpoints against CSRF when cookie transport is used.

### 3.4 Email delivery

Define an email adapter boundary. For local development, use a mail-capture tool or a development adapter that makes the verification/reset link visible only to the developer. Do not return verification tokens from public API responses. Do not log raw tokens in normal application logs. A test-only adapter may capture messages for integration tests.

### 3.5 Account states

Define and document a small explicit set of account states, for example `PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED` and `DISABLED`. Enforce allowed transitions in the user/account service. Do not infer account state from the presence of a verification token.

### 3.6 Initial role policy

Seed a minimal single-vendor role/permission model. Suggested roles: `CUSTOMER`, `ADMIN`, `PRODUCT_MANAGER`, `INVENTORY_MANAGER`, `ORDER_MANAGER`, `SUPPORT_AGENT`. Seed only permissions needed by implemented routes. A role is a grouping of permissions; backend authorization checks permission codes. Do not create future permissions for every unbuilt module without a use case.

---

## 4. Implementation sequence — do these tasks in order

Each task is a checkpoint. Do not begin the next task until the current task's tests and acceptance checks pass.

### Task 0 — Phase readiness and design review

**Goal:** Confirm Phase 1 is genuinely complete and agree on the identity contracts before creating tables.

Steps:
1. Pull the latest project branch and create a feature branch such as `phase-2/identity-access`.
2. Run the documented clean-install procedure from the root README.
3. Start PostgreSQL and Redis using the Phase 1 Compose configuration.
4. Run API and Angular lint, format check, typecheck, tests and builds.
5. Verify readiness checks correctly report PostgreSQL and Redis availability.
6. Review the Phase 1 error envelope, request ID, logger redaction and environment validation.
7. Read the identity requirements in `REQUIREMENTS.md` FR-01 through FR-04 and the related `SECURITY.md` sections.
8. Draw the registration, verification, login, logout, password-reset and refresh flows before coding.
9. Record open decisions: cookie name, session idle/absolute lifetime, access-token lifetime, refresh-token lifetime, password policy, account-state transitions and initial permission matrix.
10. Add the Phase 2 plan to the documentation index in the root README.

Deliverables:
- Reviewed flow diagrams or sequence notes.
- A short decision record for values not fixed by the source requirements.
- A green Phase 1 baseline.

Acceptance:
- No Phase 1 regression exists.
- The authentication-mode behavior and credential transport are written down before implementation.

### Task 1 — Module boundaries and application contracts

**Goal:** Establish clean ownership so later modules do not manipulate identity tables directly.

Suggested backend modules:

```text
apps/api/src/modules/
  auth/
    domain/
    application/
    infrastructure/
    http/
  users/
    domain/
    application/
    infrastructure/
    http/
  access-control/
    domain/
    application/
    infrastructure/
    http/
  audit/
    application/
    infrastructure/
```

Steps:
1. Define module responsibilities: `auth` owns credential flows; `users` owns profile/account lifecycle; `access-control` owns roles/permissions and policy evaluation; `audit` owns audit-event persistence/querying.
2. Define application-service interfaces and DTOs before writing route handlers.
3. Define a shared authenticated-principal shape containing user ID, account status and the permission information needed by authorization.
4. Define repository interfaces for user lookup, token persistence, session operations, role/permission lookup and audit writes.
5. Keep HTTP concerns in route/controller/validation layers; do not put business rules in Express handlers.
6. Prevent other modules from importing auth repositories directly. They should use a documented service or authorization interface.
7. Add module-level tests for pure policy and state-transition functions.

Acceptance:
- Route handlers do not contain password hashing, token rotation or role-policy logic.
- The module dependency direction is documented and has no circular imports.

### Task 2 — Identity database schema and migrations

**Goal:** Create the minimum durable schema for identity and authorization.

Implement tables incrementally; names can follow the existing Prisma naming convention:

- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `sessions` (if session metadata is persisted in PostgreSQL in addition to Redis; document the split)
- `refresh_token_families`
- `refresh_tokens`
- `email_verification_tokens`
- `password_reset_tokens`
- `addresses`
- `audit_logs`

Steps:
1. Decide and document the primary-key strategy consistently with `DATABASE.md` (UUID or another chosen strategy).
2. Add `users` with normalized email, password hash, display/name fields, account status, verification timestamp, last-login timestamp and created/updated timestamps.
3. Add a database unique constraint on normalized email. Application validation alone is insufficient.
4. Add roles and permissions with unique stable codes.
5. Add join tables with composite uniqueness to prevent duplicate user-role and role-permission assignments.
6. Add token tables with user/family foreign keys, token hash, expiry, consumed/revoked timestamps and metadata needed for reuse detection.
7. Add address ownership and fields. Decide how a default address is represented and enforce at most one default per user using an appropriate transaction/constraint strategy.
8. Add audit log fields for actor, action, target type/ID, timestamp and safe metadata. Never store passwords, raw tokens, cookie values or authorization headers.
9. Add indexes for normalized email, token hash, user ownership, token expiry and common audit queries.
10. Add foreign-key delete behavior deliberately. Prefer deactivation/retention for accounts with historical business records rather than cascading deletion of all future order history.
11. Create and review the Prisma migration. Inspect generated SQL.
12. Apply migration to a clean database and to a database containing the Phase 1 state.
13. Add deterministic seed data for roles and permissions. Make the seed idempotent.
14. Add a rollback/recovery note. Do not edit an already-applied migration; create a follow-up migration.

Acceptance:
- Clean database migration succeeds.
- Unique email and join-table constraints are enforced by PostgreSQL.
- Seed can run repeatedly without duplicate roles/permissions.
- Prisma schema and migration SQL are committed.

### Task 3 — Validation, password policy and cryptographic primitives

**Goal:** Build and test the security primitives before exposing authentication endpoints.

Steps:
1. Add Zod schemas for registration, login, email verification, password reset, password change and profile updates.
2. Normalize email consistently (trim and canonical lowercase policy) before lookup and storage. Document the policy; do not apply provider-specific transformations such as removing dots.
3. Define password length and blocklist policy. Avoid arbitrary composition rules that create poor usability; ensure the chosen minimum/maximum is documented and tested.
4. Integrate Argon2id with reviewed parameters appropriate for the deployment resource limits.
5. Add a password-hashing service with `hash` and constant-time verification behavior provided by the chosen library.
6. Add secure random token generation using Node's cryptographic APIs.
7. Hash verification/reset/refresh secrets before persistence. Compare hashes safely.
8. Add expiry, single-use and consumed-state checks in application services.
9. Add tests for invalid inputs, normalized email collisions, wrong passwords, expired tokens, consumed tokens and random-token uniqueness.
10. Ensure logger redaction and error responses never include password or token input.

Acceptance:
- No plaintext password or raw single-use token is stored.
- Security primitives have unit tests and no route depends on untested helper code.

### Task 4 — Registration and email verification

**Goal:** Deliver the first complete identity vertical slice.

Steps:
1. Implement `POST /api/v1/auth/register` with schema validation and rate limiting.
2. In a database transaction, create the pending user and the verification-token record. Ensure normalized-email uniqueness races return a controlled conflict/appropriate generic response.
3. Generate a verification link through the email adapter after the database transaction commits. Use an outbox if the email action must be reliably retried; do not call an external email service inside a database transaction.
4. Implement `POST /api/v1/auth/verify-email` to validate token hash, expiry and unused status, then atomically consume the token and activate the user.
5. Implement `POST /api/v1/auth/resend-verification` with generic responses, per-account/IP throttling and invalidation/expiry rules for previous tokens.
6. Decide whether duplicate registration responses reveal account existence. Public responses must avoid account enumeration as required by `SECURITY.md`.
7. Add development mail capture. Keep its UI/local access out of production builds.
8. Add audit events for registration and verification without token values.
9. Add tests for successful verification, duplicate email, duplicate token use, expired token, resend throttling and concurrent verification requests.

Acceptance:
- A new user cannot use protected customer functionality before activation if that is the selected account policy.
- A verification token works once and only before expiry.
- Public responses do not expose whether an email is registered.

### Task 5 — Login, logout and account status checks

**Goal:** Authenticate active accounts and centralize identity resolution.

Steps:
1. Implement `POST /api/v1/auth/login` with normalized email lookup, password verification and generic failure response.
2. Apply rate limits and abuse controls. Avoid permanent lockout that can be abused for denial of service.
3. Reject suspended/disabled accounts consistently without disclosing unnecessary account details.
4. Update last-login metadata after successful authentication.
5. Implement `GET /api/v1/auth/me` to return a safe principal/profile DTO, never password hashes or token records.
6. Implement logout behavior through the active strategy adapter (completed in Tasks 6 and 7).
7. Add `POST /api/v1/auth/change-password` requiring the current password; after a successful change, revoke sessions and refresh-token families according to the documented policy.
8. Add tests for invalid password, unverified account, disabled account, throttling and account revocation.

Acceptance:
- The same identity service works for both authentication strategies.
- Login responses and logs do not leak account-sensitive details or credentials.

### Task 6 — Session authentication strategy

**Goal:** Implement a complete server-side session lifecycle.

Steps:
1. Create a session adapter interface independent of Express and Redis client details.
2. Configure Redis connection, namespace/key prefix, TTL and failure behavior.
3. Generate cryptographically random opaque session IDs.
4. Persist session data server-side; store only a hash/HMAC of the ID where practical.
5. Issue a host-only HttpOnly cookie with `Secure` in HTTPS, a deliberate `SameSite` value, path and expiry/max-age.
6. Rotate the session ID after login and privilege changes to prevent session fixation.
7. Implement session lookup middleware that runs only when `AUTH_MODE=session`.
8. Enforce idle timeout and absolute lifetime separately.
9. Implement current-session logout and logout-all-devices. Revocation must invalidate the server-side session.
10. Add CSRF protection for cookie-authenticated unsafe requests. Document token issuance, header and validation behavior.
11. Configure exact CORS origins and credential behavior; never use wildcard origin with credentials.
12. Handle Redis outage safely: fail closed for authentication rather than treating an unknown session as authenticated. Return a controlled dependency error where appropriate.
13. Add tests for cookie flags, rotation, expiry, revocation, CSRF, session fixation and Redis-unavailable behavior.

Acceptance:
- Session mode passes its full authentication and security suite.
- No session ID is stored in browser storage or logs.
- Restart/revocation behavior matches the documented Redis persistence/TTL design.

### Task 7 — JWT authentication strategy

**Goal:** Implement access and refresh token lifecycle separately from session mode.

Steps:
1. Define the signing algorithm and key-management approach. Use an explicit algorithm allowlist; never trust the token header to select arbitrary algorithms.
2. Validate issuer, audience, expiry and not-before claims.
3. Define short access-token lifetime and refresh-token lifetime as explicit configuration values. Do not hard-code unexplained durations.
4. Issue access tokens with minimal claims. Do not put secrets or sensitive profile data in claims.
5. Generate refresh tokens with high entropy and persist only their hashes in PostgreSQL.
6. Create a refresh-token family on login and link each rotated token to its predecessor/replacement.
7. Implement `POST /api/v1/auth/refresh` as an atomic rotation operation. A consumed token presented again must trigger family reuse detection and revocation.
8. Implement logout and logout-all by revoking the relevant refresh token/family records.
9. For Angular, keep access tokens in memory. Use an HttpOnly refresh cookie where selected; implement CSRF protection for cookie-based refresh/logout.
10. Ensure API authentication middleware validates only bearer access tokens when `AUTH_MODE=jwt`.
11. Handle key rotation strategy and signing-secret changes in configuration documentation.
12. Add tests for expired token, wrong signature, wrong issuer/audience, disallowed algorithm, missing claims, refresh rotation, concurrent refresh, reuse detection and family revocation.

Acceptance:
- JWT mode passes independently with no session-cookie fallback.
- Reuse of an already-rotated refresh token revokes the affected family.
- Access tokens are not persisted in localStorage/sessionStorage.

### Task 8 — Authorization, roles and permissions

**Goal:** Enforce backend permissions consistently.

Steps:
1. Create a permission catalogue with stable codes, descriptions and module ownership.
2. Seed the minimum role-to-permission matrix for current routes.
3. Implement permission lookup/service and a reusable authorization policy interface.
4. Add route middleware or application-service policy checks for permission requirements.
5. Implement deny-by-default behavior.
6. Add ownership policies for `/users/me` and address resources. Do not accept a user ID from the browser to decide ownership.
7. Add a safe admin bootstrap procedure. Do not ship a default public admin password or hard-coded admin credentials.
8. Restrict role assignment to an authorized administrator or a one-time controlled bootstrap script.
9. Audit role/permission changes and administrative account status changes.
10. Add tests for customer-to-admin denial, missing permission, changed resource ID/IDOR, role changes, and revoked access.
11. Ensure frontend route guards are only UX helpers; API authorization remains authoritative.

Acceptance:
- Every protected route declares its permission/ownership requirement.
- An ordinary customer cannot assign roles, view another user's data or call admin APIs.
- Denial is consistent and does not leak resource existence where concealment is appropriate.

### Task 9 — Profile and address book

**Goal:** Implement the account data required by later checkout without implementing checkout.

Steps:
1. Implement `GET /api/v1/users/me` and `PATCH /api/v1/users/me` with explicit writable-field mapping.
2. Do not allow profile update payloads to modify roles, account status, verification state or password hash.
3. Implement list/create/update/delete endpoints for the authenticated user's addresses.
4. Validate postal code, country, required address fields and reasonable field lengths. Keep validation rules configurable where country formats differ.
5. Enforce address ownership on every read/update/delete.
6. Define default-address behavior and update it transactionally so a user does not end up with multiple defaults.
7. Consider soft deletion or retention if addresses are later snapshotted into orders. Checkout must snapshot address values rather than rely on a mutable address row.
8. Add tests for cross-user address access, default-address changes, invalid input and concurrent default selection.

Acceptance:
- A user can manage only their own profile and addresses.
- No mass assignment path can modify protected fields.

### Task 10 — Audit trail and operational controls

**Goal:** Make sensitive actions traceable without leaking secrets.

Steps:
1. Define an allowlisted audit action vocabulary.
2. Record registration, verification, login outcome where policy permits, logout, password change/reset, session revocation, refresh-family reuse detection, role changes and account status changes.
3. Include actor ID (nullable for anonymous events), action, target, timestamp, request ID and safe metadata.
4. Do not store raw passwords, verification/reset tokens, refresh tokens, session IDs, cookies or authorization headers.
5. Restrict audit-log read access to explicit administrative permissions.
6. Add pagination and bounded date filters for audit queries.
7. Add retention notes; do not invent legal retention claims.
8. Test that audit records are created for important actions and that unauthorized users cannot read them.

Acceptance:
- Sensitive actions can be traced by request ID and actor where available.
- Audit records contain no credential material.

### Task 11 — Angular authentication and account experience

**Goal:** Connect the identity APIs to a minimal, accessible UI.

Suggested feature layout (adapt to the existing Phase 1 Angular structure):

```text
apps/web/src/app/
  core/
    auth/
    http/
    guards/
  features/
    auth/
      register/
      login/
      verify-email/
      forgot-password/
      reset-password/
    account/
      profile/
      addresses/
```

Steps:
1. Create typed request/response models or generate them from OpenAPI if that workflow is already established.
2. Create a single auth API service and an auth-state abstraction using Angular signals.
3. Initialize auth state through `/auth/me` on application startup. Handle cold start/API unavailable states without redirect loops.
4. Build registration and login forms with reactive forms, strict typing and accessible labels/errors.
5. Build verification success/expired/invalid states.
6. Build forgot-password and reset-password forms without revealing account existence.
7. Build logout and account profile screens.
8. Add a route guard for navigation convenience; never rely on it for security.
9. For session mode, configure credentialed HTTP requests and CSRF token handling. For JWT mode, keep access token in memory and implement refresh behavior without localStorage.
10. Prevent concurrent refresh storms with a single-flight refresh strategy if required by the chosen HTTP architecture.
11. Add loading, empty, validation, error and retry states.
12. Meet keyboard navigation and WCAG AA-oriented contrast/semantics.
13. Run the frontend against both auth modes by switching backend configuration and documenting any required environment changes.

Acceptance:
- Register/login/logout/account flows work in the browser.
- Refreshing the page restores authentication according to the selected strategy.
- No access/refresh/session credential is written to browser persistent storage.

### Task 12 — API contract and documentation

**Goal:** Make identity behavior consumable and testable by future modules.

Document at minimum:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/change-password`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/sessions` and `DELETE /api/v1/auth/sessions/{sessionId}` if session listing is implemented
- `POST /api/v1/auth/refresh` in JWT mode
- `GET/PATCH /api/v1/users/me`
- `GET/POST /api/v1/users/me/addresses`
- `PATCH/DELETE /api/v1/users/me/addresses/{addressId}`
- Admin role/permission management endpoints only if included in this phase.

For every endpoint document request schema, response DTO, status codes, auth mode, permission, CSRF behavior, rate limits and error codes. Keep the shared API error envelope from Phase 1.

### Task 13 — Testing, security review and failure drills

**Goal:** Demonstrate that identity works under hostile and failure conditions.

Unit tests:
- Email normalization.
- Password policy and hashing adapter behavior.
- Token generation/hash/expiry.
- Account-state transitions.
- Permission evaluation.
- Refresh-token family transition rules.

Integration/API tests:
- Registration and verification.
- Duplicate normalized email race.
- Login/logout for session mode.
- Login/refresh/logout for JWT mode.
- Password reset and password-change revocation.
- Session idle/absolute expiry and rotation.
- CSRF protection.
- Role and permission enforcement.
- User/address ownership and IDOR attempts.
- Rate limits and generic public responses.
- Redis unavailable in session mode.
- Database unavailable behavior.

Security cases required by `SECURITY.md`:
- Anonymous protected request.
- Customer calls admin endpoint.
- Customer accesses another customer's address.
- Expired/revoked session.
- Session fixation attempt.
- CSRF attempt.
- JWT wrong issuer/audience/algorithm/expiry.
- Refresh token reuse.
- Rate-limit bypass attempt.

Run the API suite in two configurations:
1. `AUTH_MODE=session`
2. `AUTH_MODE=jwt`

Also run Angular unit tests and Playwright flows for the configured mode. Add CI jobs/matrix only if runtime and free CI quota remain reasonable.

Acceptance:
- Both authentication strategies pass their respective tests.
- No critical/high security issue found in the phase review remains undocumented or unmitigated.
- CI fails on lint, typecheck, test or build failure.

### Task 14 — Review, cleanup and phase sign-off

**Goal:** Finish the phase with maintainable, documented identity infrastructure.

Steps:
1. Review module boundaries and remove duplicated auth logic.
2. Inspect Prisma migrations and query behavior.
3. Verify database constraints, indexes and transaction boundaries.
4. Review all log statements and response DTOs for secret leakage.
5. Verify startup fails clearly when required configuration is missing or invalid.
6. Verify Redis is required only for the selected session-mode operations; document JWT-mode dependency needs.
7. Update `README.md`, `API.md`, `DATABASE.md`, `SECURITY.md`, `TESTING.md`, `ARCHITECTURE.md` and `DECISIONS.md`.
8. Add a Phase 2 completion summary and known limitations.
9. Demonstrate a clean local setup from a fresh clone.
10. Tag/merge the phase only after all acceptance criteria are checked.

---

## 5. Suggested backend structure after Phase 2

```text
apps/api/src/
  config/
  common/
    errors/
    middleware/
    validation/
    security/
  infrastructure/
    database/
    redis/
    email/
  modules/
    auth/
    users/
    access-control/
    audit/
  app.ts
  server.ts
```

Keep the structure consistent with the actual Phase 1 implementation. Do not create abstractions or folders without code that uses them.

## 6. Suggested database learning order

Study and apply these concepts in this order:
1. Unique constraints and normalized identifiers.
2. Foreign keys and join tables for many-to-many relationships.
3. Transactions for registration/token creation and token consumption.
4. Atomic conditional updates for single-use tokens.
5. Expiry queries and indexes.
6. Token-family relationships and refresh rotation.
7. Redis TTL and the difference between ephemeral session state and durable account state.
8. Audit-event append patterns.
9. Prisma relation queries and generated SQL inspection.
10. Parameterized raw SQL for at least one meaningful reporting/query exercise (for example, recent account/audit activity), then compare query plans.

Do not force raw SQL into every repository method. Use it deliberately where it teaches a database concept or improves a measured query.

## 7. Required learning outcomes

You should be able to explain:
- Authentication vs authorization.
- Session authentication vs JWT and why JWT refresh still needs server-side state.
- Password hashing vs encryption.
- Entropy, token hashing, expiry and single-use semantics.
- Session fixation and session rotation.
- CSRF vs XSS and why HttpOnly does not solve CSRF.
- SameSite, Secure, HttpOnly and CORS credentials.
- Refresh-token rotation and reuse detection.
- RBAC vs resource ownership checks.
- IDOR/BOLA and deny-by-default authorization.
- Database uniqueness races and transaction boundaries.
- Redis as session infrastructure vs PostgreSQL as durable account state.
- Why Angular route guards are not security controls.

## 8. Phase 2 acceptance checklist

### Identity
- [ ] Registration creates a pending account safely.
- [ ] Normalized email is unique at database level.
- [ ] Passwords use Argon2id.
- [ ] Email verification token is random, hashed, expiring and single-use.
- [ ] Resend verification is rate-limited.
- [ ] Password reset token is random, hashed, expiring and single-use.
- [ ] Password change/reset revokes relevant credentials.
- [ ] Public responses avoid account enumeration.

### Session mode
- [ ] Session mode can be selected by configuration.
- [ ] Opaque session ID is issued in secure cookie attributes appropriate to environment.
- [ ] Server-side session state is stored in Redis.
- [ ] Session ID rotates after login/privilege changes.
- [ ] Idle and absolute expiry are enforced.
- [ ] Logout and logout-all revoke sessions.
- [ ] CSRF protection is tested.
- [ ] Redis outage fails closed.

### JWT mode
- [ ] JWT mode can be selected by configuration.
- [ ] Access token is short-lived and validates algorithm, issuer, audience and time claims.
- [ ] Refresh tokens are stored as hashes and rotated.
- [ ] Reuse detection revokes token family.
- [ ] Logout and logout-all revoke refresh-token state.
- [ ] Browser does not persist access tokens in localStorage/sessionStorage.

### Authorization and user data
- [ ] Roles and permissions are seeded idempotently.
- [ ] Protected API routes enforce permissions server-side.
- [ ] Ownership checks prevent cross-user profile/address access.
- [ ] Role assignment is restricted.
- [ ] Audit logs record sensitive actions without secrets.
- [ ] Profile and address updates use allowlisted fields.

### Quality
- [ ] OpenAPI/API documentation is current.
- [ ] Unit, integration, API and relevant E2E tests pass.
- [ ] Test suite passes separately for session and JWT modes.
- [ ] Lint, typecheck and build pass locally and in CI.
- [ ] Documentation and decision log are updated.
- [ ] Clean-clone setup and manual demo are successful.

## 9. Phase 2 exit gate

Do not start Phase 3 until the Phase 2 acceptance checklist is complete, both auth modes have independent test evidence, and the API exposes a stable authenticated-principal and permission-check contract. Phase 3 will depend on these contracts for administrator-only catalog and inventory operations.


---

## Deployment checkpoint — Phase 2

Deployment is part of this phase, not a separate end-of-project activity. Follow `DEPLOYMENT_PREPARATION.md` for the common deployment rules.

1. Confirm the currently deployed Phase 1 application is healthy before merging this phase.
2. Apply the phase migration to a disposable/staging database first. Review the generated SQL and verify both a clean migration and an upgrade from the previous schema.
3. Keep the API backward-compatible with the currently deployed frontend during rollout. If a breaking API change is unavoidable, deploy in an expand-and-contract sequence and document the temporary compatibility window.
4. Deploy the API first when the frontend depends on new API behavior. Do not expose unfinished routes or screens; keep them behind authorization and/or a feature flag.
5. Deploy the Angular build after the API is ready. Verify the production API base URL, CORS, HTTPS, cookies and environment configuration.
6. Run the phase-specific production smoke tests using demo accounts and synthetic data only.
7. Confirm logs contain request IDs and no credentials, tokens, passwords or personal secrets.
8. Verify free-tier usage and ensure no paid plan, paid trial, auto-upgrade or overage setting has been enabled.
9. Record the deployment commit, migration version, provider resource names, test results, known limitations and rollback steps.
10. If the release fails, roll back the application to the last known-good build. Do not blindly reverse a migration that has already received production writes; use a forward fix or a documented restore procedure.

**Phase exit addition:** The phase is not complete until its local acceptance criteria pass, its deployment smoke tests pass, and the deployed application still supports the previous completed user journeys.
