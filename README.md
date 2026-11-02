# ShopSphere — Full-Stack E-Commerce Engineering Challenge

> A backend-first, production-style e-commerce platform built from scratch with Angular, Node.js, Express, PostgreSQL and Redis — from requirements and architecture through testing and free-tier deployment.

## Project mission

Build a complete single-vendor e-commerce platform while learning the engineering principles behind real production systems. The goal is not merely to make a shopping UI work. The goal is to understand and demonstrate database design, REST API design, authentication, authorization, transactions, concurrency, caching, asynchronous processing, security, observability, performance and deployment.

This is a **modular monolith first**. The design should preserve clear module boundaries without introducing microservices prematurely.

## Non-negotiable cost constraint

The project must be developed and deployed using **$0 services and free plans only**. Do not start a paid trial, enable automatic upgrades, add a paid custom domain, or rely on a service that can silently charge for overages. Before creating an account or resource, re-check the provider's current plan, payment-card requirements, usage limits and overage behavior.

Free-tier services can pause, sleep, impose quotas, change terms or be discontinued. This project is a learning/demo deployment, **not a guaranteed always-on commercial production service**. Keep local backups of database data and a reproducible local development environment.

See [Free deployment strategy](docs/FREE_DEPLOYMENT.md).

## Chosen stack

| Area | Choice |
|---|---|
| Frontend | Angular 21, standalone components, TypeScript |
| Backend | Node.js, TypeScript, Express |
| API | Versioned REST API, `/api/v1` |
| Primary database | PostgreSQL |
| Data access | Prisma ORM plus deliberate raw SQL exercises |
| Cache/session/queue infrastructure | Redis-compatible service |
| Authentication | Server-side sessions **and** JWT access/refresh-token implementation |
| Validation | Zod (or an explicitly documented equivalent) |
| API documentation | OpenAPI / Swagger |
| Logging | Pino |
| Unit/integration tests | Vitest or Jest + Supertest |
| Browser E2E | Playwright |
| Load testing | k6 |
| Containers | Docker + Docker Compose |
| CI | GitHub Actions |
| Observability | Structured logs first; OpenTelemetry/metrics as later milestones |

Use currently supported Node.js LTS releases and pin the selected version in `.nvmrc` or `.node-version`, `package.json` engines and CI. Verify Angular compatibility before selecting the Node version.

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

### Admin / operations application
- Role- and permission-controlled admin access.
- Product, category, brand and variant management.
- Inventory management and stock movement history.
- Order processing and status transitions.
- Coupon management.
- Review moderation.
- User and role management.
- Audit logs and basic reports.

### Later extension
Multi-vendor marketplace support is explicitly out of the first release. Add it only after the single-vendor system is stable.

## Backend modules

`auth`, `users`, `access-control`, `catalog`, `inventory`, `cart`, `wishlist`, `pricing`, `coupons`, `checkout`, `orders`, `payments`, `shipping`, `reviews`, `notifications`, `admin`, `analytics`, `audit`.

Each module owns its business rules and public service interface. Avoid cross-module writes to another module's tables. Shared database transactions may be coordinated by an application service, but ownership and invariants must remain explicit.

## Engineering principles

1. PostgreSQL is the durable source of truth for business data.
2. Redis is an optimization / ephemeral coordination layer, never the only copy of orders, payments or inventory.
3. The server recalculates price, discount, tax, shipping and payable totals. Never trust browser-supplied totals.
4. Authorization is enforced on the server and at the resource/ownership level.
5. Every important state transition is validated by business rules.
6. Payment webhooks and retryable background jobs are idempotent.
7. Inventory correctness is enforced by database constraints and transactions; Redis locks are not the source of truth.
8. Secrets, passwords, session identifiers, access tokens and payment credentials must not appear in logs or source control.
9. Performance claims require repeatable measurements and documented test conditions.
10. Build the simplest correct design first; add abstractions only when they solve a demonstrated problem.

## Documentation map

| Document | Purpose |
|---|---|
| [Requirements](docs/REQUIREMENTS.md) | Functional and non-functional product specification |
| [Architecture](docs/ARCHITECTURE.md) | System boundaries, modules, data flow and key decisions |
| [Database requirements](docs/DATABASE.md) | Entities, constraints, transactions and SQL learning objectives |
| [API requirements](docs/API.md) | REST conventions, response format and endpoint scope |
| [Security requirements](docs/SECURITY.md) | Authentication, authorization and threat controls |
| [Testing strategy](docs/TESTING.md) | Test levels and mandatory failure/concurrency scenarios |
| [Free deployment strategy](docs/FREE_DEPLOYMENT.md) | Zero-cost hosting plan and limitations |
| [Phase 1 plan](docs/PHASE_1.md) | Detailed foundation phase, setup and acceptance criteria |
| [Decision log](docs/DECISIONS.md) | Record architecture decisions and trade-offs |

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

Do not create every folder on day one. Phase 1 creates only the foundation needed for a clean start.

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

# local setup instructions
### 1. Clone the repository
git clone <your-repository-url>
cd "Shopsphere Challange"

### 2. Create your local environment file
cp .env.example .env

### 3. Install API dependencies
cd apps/api
npm install

### 4. Generate Prisma Client
npx prisma generate

### 5. Start infrastructure
cd ../..
docker compose --env-file .env -f infra/docker/docker-compose.yml up -d

### 6. Check Connections
npm run db:check
npm run db:redis

### 7. Start the API
cd apps/api
npm run dev