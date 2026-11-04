# ShopSphere — Full-Stack E-Commerce Engineering Challenge

## Project mission

Build a complete single-vendor e-commerce platform while learning the engineering principles behind real production systems.

The goal is not merely to make a shopping UI work. The goal is to understand and demonstrate database design, REST API design, authentication, authorization, transactions, concurrency, caching, asynchronous processing, security, observability, performance and deployment.

The project follows a **modular monolith first** approach. It should preserve clear module boundaries without introducing microservices prematurely.

## Non-negotiable cost constraint

The project must be developed and deployed using **$0 services and free plans only**.

- Do not start paid trials.
- Do not enable automatic upgrades.
- Do not add a paid custom domain.
- Do not rely on a service that can silently charge for overages.
- Before creating an account or resource, re-check the provider's current plan, payment-card requirements, usage limits and overage behavior.

Free-tier services can pause, sleep, impose quotas, change terms or be discontinued. This is a learning/demo deployment, **not a guaranteed always-on commercial production service**. Keep local backups of database data and maintain a reproducible local development environment.

See [Free deployment strategy](FREE_DEPLOYMENT.md) for the detailed deployment constraints and plan.

## Chosen technology stack

| Area                               | Choice                                                           |
| ---------------------------------- | ---------------------------------------------------------------- |
| Frontend                           | Angular 21, standalone components, TypeScript                    |
| Backend                            | Node.js, TypeScript, Express                                     |
| API                                | Versioned REST API, `/api/v1`                                    |
| Primary database                   | PostgreSQL                                                       |
| Data access                        | Prisma ORM plus deliberate raw SQL exercises                     |
| Cache/session/queue infrastructure | Redis-compatible service                                         |
| Authentication                     | Server-side sessions and JWT access/refresh-token implementation |
| Validation                         | Zod or an explicitly documented equivalent                       |
| API documentation                  | OpenAPI / Swagger                                                |
| Logging                            | Pino                                                             |
| Unit/integration tests             | Vitest or Jest + Supertest                                       |
| Browser E2E                        | Playwright                                                       |
| Load testing                       | k6                                                               |
| Containers                         | Docker + Docker Compose                                          |
| CI                                 | GitHub Actions                                                   |
| Observability                      | Structured logs first; OpenTelemetry/metrics as later milestones |

Use currently supported Node.js LTS releases and pin the selected version in `.nvmrc` or `.node-version`, `package.json` engines and CI. Verify Angular compatibility before selecting the Node.js version.

## Product scope

### Customer application

- Registration, email verification, login, logout and account recovery.
- Profile and address management.
- Product browsing, categories, variants, search, filtering, sorting and pagination.
- Guest and authenticated shopping carts.
- Wishlist.
- Coupons and promotions.
- Checkout, payment sandbox integration and order history.
- Cancellation, returns, refunds and shipment tracking.
- Product reviews and ratings.
- Email and in-app notifications.

### Admin and operations application

- Role- and permission-controlled admin access.
- Product, category, brand and variant management.
- Inventory management and stock movement history.
- Order processing and status transitions.
- Coupon management.
- Review moderation.
- User and role management.
- Audit logs and basic reports.

### Later extension

Multi-vendor marketplace support is explicitly outside the first release. Add it only after the single-vendor system is stable.

The detailed functional and non-functional requirements are maintained in [REQUIREMENTS.md](REQUIREMENTS.md).

## Backend module boundaries

The planned backend modules are:

`auth`, `users`, `access-control`, `catalog`, `inventory`, `cart`, `wishlist`, `pricing`, `coupons`, `checkout`, `orders`, `payments`, `shipping`, `reviews`, `notifications`, `admin`, `analytics`, and `audit`.

Each module owns its business rules and public service interface. Avoid cross-module writes to another module's tables. Shared database transactions may be coordinated by an application service, but ownership and invariants must remain explicit.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the detailed module boundaries and system design.

## Engineering principles

1. PostgreSQL is the durable source of truth for business data.
2. Redis is an optimization and ephemeral coordination layer, never the only copy of orders, payments or inventory.
3. The server recalculates price, discount, tax, shipping and payable totals. Never trust browser-supplied totals.
4. Authorization is enforced on the server and at the resource/ownership level.
5. Every important state transition is validated by business rules.
6. Payment webhooks and retryable background jobs are idempotent.
7. Inventory correctness is enforced by database constraints and transactions; Redis locks are not the source of truth.
8. Secrets, passwords, session identifiers, access tokens and payment credentials must not appear in logs or source control.
9. Performance claims require repeatable measurements and documented test conditions.
10. Build the simplest correct design first; add abstractions only when they solve a demonstrated problem.

Detailed security, database, API and testing requirements live in their dedicated documents:

- [Database requirements](DATABASE.md)
- [API requirements](API.md)
- [Security requirements](SECURITY.md)
- [Testing strategy](TESTING.md)

## Definition of done

A feature is not complete merely because its happy path works. It is complete when:

- Its requirements and API contract are documented.
- Input is validated server-side.
- Authentication and authorization are correct.
- Database constraints protect important invariants.
- Failure cases are handled intentionally.
- Unit/integration tests cover business rules.
- Logs are useful but do not leak secrets.
- Relevant performance and security concerns have been reviewed.
- Documentation is updated.

See [TESTING.md](TESTING.md) for the testing strategy and required scenarios.

## Suggested repository layout

```text
shopsphere/
├── apps/
│   ├── api/                 # Express API and application services
│   └── web/                 # Angular application
├── packages/
│   └── contracts/           # Optional shared API types/schemas; no runtime coupling
├── infra/
│   ├── docker/
│   └── scripts/
├── docs/
├── .github/workflows/
├── .gitignore
├── .editorconfig
├── .nvmrc
└── README.md
```

Do not create every folder on day one. Each phase should create only the foundation needed at that point.

## Working agreement

Work phase by phase. For each module:

1. Read and clarify requirements.
2. Learn the underlying concepts.
3. Discuss design alternatives and trade-offs.
4. Implement a small vertical slice.
5. Test success, failure, security and concurrency cases.
6. Review the code and explain the design.
7. Update documentation and the decision log.

**First milestone:** complete Phase 1 and its acceptance criteria before implementing product features.

See [PHASE_1.md](PHASE_1.md) for the current phase plan and acceptance criteria.
