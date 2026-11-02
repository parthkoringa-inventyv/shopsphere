# Security Requirements

## 1. Security baseline

Use OWASP API Security Top 10 and relevant OWASP ASVS controls as review references. Security is part of each feature, not a final hardening sprint.

## 2. Authentication

- Argon2id password hashing.
- Random, single-use, expiring verification/reset tokens; store token hashes.
- Opaque session IDs; secure HttpOnly cookies.
- Session rotation after authentication and privilege changes.
- Idle and absolute session expiration.
- Logout and password reset revocation.
- JWT algorithm allowlist and issuer/audience/expiry validation.
- Rotating refresh tokens and reuse detection.
- Never put secrets in URL query strings.
- Never store long-lived tokens in localStorage.

## 3. CSRF, CORS and browser security

- Cookie-authenticated unsafe requests require CSRF protection.
- Configure `SameSite` deliberately based on deployment origin arrangement.
- Allow only known frontend origins in CORS; never use wildcard origin with credentials.
- Use secure headers (e.g. Helmet).
- Set `Secure` cookies in HTTPS environments.
- Use a host-only cookie; consider `__Host-` prefix where deployment topology permits.
- Ensure logout and refresh endpoints are protected appropriately.

## 4. Authorization

- Deny by default.
- Enforce role/permission checks server-side.
- Enforce resource ownership on every private object access.
- Test IDOR/BOLA by changing identifiers.
- Avoid mass assignment: explicitly map allowed writable fields.
- Audit sensitive administrative actions.

## 5. Input and data protection

- Validate every request with schemas.
- Use parameterized SQL and ORM parameter binding.
- Set request body size limits.
- Validate upload size, MIME type and file content; randomize storage names.
- Protect against SSRF when fetching remote URLs.
- Prevent open redirects.
- Encode/sanitize content appropriate to output context.
- Do not render user HTML unsafely.

## 6. Abuse prevention

- Rate-limit authentication and sensitive endpoints.
- Use account/IP/device signals carefully; avoid permanent lockout that enables denial of service.
- Limit pagination and expensive search filters.
- Add request timeouts and concurrency limits.
- Protect coupon redemption and checkout from replay/races.

## 7. Payment and webhook security

- Verify provider signatures using exact raw body as required.
- Validate event type, provider account and amount/currency/reference.
- Deduplicate event IDs.
- Treat webhook delivery as at-least-once.
- Never trust browser redirect as payment proof.
- Never store card PAN/CVV.
- Keep sandbox and production credentials separate.

## 8. Secrets and operations

- `.env` is ignored by Git.
- Commit `.env.example` with placeholders only.
- Use hosting secret settings for deployed credentials.
- Rotate exposed secrets immediately.
- Redact authorization headers, cookies, passwords, token values and payment data from logs.
- Run dependency audit and secret scanning.
- Use least-privilege database users.
- Avoid exposing database/Redis ports publicly.

## 9. Required security tests

- Anonymous request to protected endpoint.
- Customer accesses another customer's address/order.
- Customer invokes admin endpoint.
- Expired/revoked session.
- Session fixation attempt.
- CSRF attempt.
- JWT with wrong issuer/audience/algorithm/expiry.
- Refresh token reuse.
- SQL injection payload in search/filter.
- Oversized or deceptive file upload.
- Duplicate webhook.
- Rate-limit bypass attempt.
