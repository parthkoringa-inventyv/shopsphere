# Phase 1 — Foundation and Architecture

**Objective:** Establish a reproducible local development environment and a minimal, testable Express + Angular foundation. Do not implement product, cart, order or payment features in this phase.

**Expected duration:** Approximately 1–2 weeks at a deep-learning pace. The time is indicative; acceptance criteria matter more than the calendar.

## 1. Phase 1 outcomes

By the end:

- Repository structure is clear and documented.
- Node/TypeScript/Express API starts reliably.
- Angular app starts and can call the API.
- PostgreSQL and Redis run locally through Docker Compose.
- Configuration is validated at startup.
- API has request IDs, structured logging, centralized errors and health/readiness endpoints.
- Lint, formatting, typecheck and a minimal test suite run.
- `.env.example` exists and secrets are not committed.
- Architecture decisions are recorded.
- No business feature has been prematurely built.

## 2. Architecture decisions to lock

### Backend

- Express with TypeScript strict mode.
- Keep app construction separate from listening (`createApp()` vs `server.ts`) so tests can import the app without binding a port.
- Use a modular folder layout; create only `health` and `system` foundations initially.
- Use Zod to validate environment variables and request inputs.
- Use Pino for structured logs.
- Use Prisma for schema/migrations and normal data access.
- Keep a documented raw SQL path for later learning.
- Use a single centralized error handler.
- Add a request ID to every request/response and log entry.

### Frontend

- Angular 21 standalone architecture.
- Feature-based organization, lazy routes when features arrive.
- Typed API client/service layer.
- Environment-based API base URL.
- Centralized HTTP error handling.
- No authentication UI or business screens yet.

### Data infrastructure

- PostgreSQL local container with named volume.
- Redis local container with password in development configuration where practical.
- Health checks for both.
- No cloud services in Phase 1.

### Repository

Use a single Git repository with `apps/api`, `apps/web`, `infra` and `docs`. A monorepo is not a requirement for microservices; it simply keeps this learning project together.

## 3. Suggested folder structure

```text
shopsphere/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── env.ts
│   │   │   │   └── logger.ts
│   │   │   ├── common/
│   │   │   │   ├── errors/
│   │   │   │   └── middleware/
│   │   │   ├── modules/
│   │   │   │   └── health/
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── tests/
│   │   ├── prisma/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── src/
│       ├── angular.json
│       └── package.json
├── infra/
│   └── docker/
│       └── docker-compose.yml
├── docs/
├── .github/
│   └── workflows/
├── .editorconfig
├── .gitignore
├── .nvmrc
└── README.md
```

Do not add empty folders for every future module. Add a module when its first vertical slice begins.

## 4. Setup requirements

### Prerequisites

- Git.
- A currently supported Node.js LTS version compatible with Angular 21; verify Angular's official compatibility table before pinning it.
- npm.
- Docker Engine and Docker Compose plugin.
- Angular CLI matching the Angular project version (can be invoked with `npx`).
- VS Code or another editor.

### Local services

Create Docker Compose services for:

- PostgreSQL.
- Redis.

Requirements:

- Named volumes for persistence.
- Health checks.
- Local-only port bindings.
- Credentials from local environment variables.
- No default production credentials.
- Do not expose database/Redis ports to the public internet.

### Backend setup

- Initialize TypeScript project.
- Enable `strict`, `noImplicitOverride`, `noUncheckedIndexedAccess` where practical.
- Install Express, TypeScript, tsx/runner, Zod, Pino, Prisma and test dependencies.
- Separate development, build, start, lint, typecheck and test scripts.
- Build output should be generated in a dedicated directory and ignored by Git.
- Create `createApp()` and a separate server bootstrap.
- Add `/api/v1/health/live` and `/api/v1/health/ready`.
- Validate environment at process startup; fail fast with actionable errors.

### Frontend setup

- Create Angular standalone application.
- Enable strict TypeScript/template checks.
- Configure API base URL through environment configuration.
- Create a minimal status page that calls the backend health endpoint.
- Display loading, success and error states.
- Do not build the storefront yet.

## 5. Phase 1 implementation tasks

### Task 1 — Repository hygiene

- Create repository and default branch.
- Add `.gitignore` for Node, Angular, environment files, logs, build output and IDE files.
- Add `.editorconfig`.
- Add `.nvmrc` or `.node-version`.
- Add root README and documentation links.
- Add a pull-request/commit convention if desired.

### Task 2 — Local infrastructure

- Add PostgreSQL and Redis to Compose.
- Configure health checks and volumes.
- Start and stop services.
- Verify connection using `psql` and `redis-cli`.
- Verify data survives container restart.

### Task 3 — Express foundation

- Create app factory and server bootstrap.
- Add environment schema validation.
- Add request ID middleware.
- Add Pino request logging.
- Add 404 handler.
- Add centralized error handler.
- Add health and readiness routes.
- Set JSON body limit.
- Configure security headers.
- Configure CORS with explicit local Angular origin.
- Ensure errors do not leak stack traces in production mode.

### Task 4 — Database foundation

**Status: Complete (2026-11-04)**

- [x] Configure Prisma datasource.
- [x] Defer the initial migration until the first real schema is agreed; an empty database connection check is sufficient at this stage.
- [x] Add a database connectivity check to readiness.
- [x] Demonstrate a Prisma query through the readiness diagnostic without exposing database details publicly.
- [x] Document migration commands and the current Prisma 7 setup in `DATABASE.md`.

No application models, tables or migrations were created as part of this task. That is intentional and follows the agreed Phase 1 scope.

### Task 5 — Angular foundation

- Create standalone Angular application.
- Add typed health API service.
- Add a minimal diagnostic page.
- Handle API unavailable/cold-start response.
- Keep API URL configurable.

### Task 6 — Quality automation

- Add format and lint scripts.
- Add TypeScript typecheck.
- Add at least one API unit/integration test.
- Add one Angular test.
- Add GitHub Actions CI for install, lint, typecheck, test and build.
- Do not store deployment secrets in CI yet.

### Task 7 — Architecture notes

Record decisions for:

- Modular monolith.
- Express app factory.
- Prisma plus raw SQL.
- PostgreSQL as source of truth.
- Redis use boundaries.
- Session and JWT as separate auth modes.
- Free deployment limitations.

## 6. Concepts to understand before moving on

You should be able to explain:

- Node.js process and event loop at a high level.
- Difference between Express app and listening HTTP server.
- TypeScript compile-time types vs runtime validation.
- Environment variables and secret handling.
- Middleware order and error middleware signature.
- Dependency injection by composition vs global singletons.
- PostgreSQL connection and connection pooling.
- Docker image vs container vs volume.
- Health check vs readiness check.
- Structured logging and correlation/request IDs.
- Unit test vs integration test.
- Why Redis is not the durable source of truth.
- Why local Docker infrastructure is useful even when deployment is free.

## 7. Phase 1 acceptance criteria

### Repository

- [ ] Clean install works from documented steps.
- [ ] No secrets or `.env` files are committed.
- [ ] README explains prerequisites and startup.
- [ ] Node version is pinned and compatible.

### Infrastructure

- [ ] `docker compose up -d` starts PostgreSQL and Redis.
- [ ] Health checks become healthy.
- [ ] PostgreSQL and Redis data survive container restart.
- [ ] Ports are bound for local development only.

### API

- [ ] API starts with validated environment.
- [ ] `/api/v1/health/live` reports process liveness.
- [ ] `/api/v1/health/ready` checks required dependencies.
- [ ] Unknown routes return standard 404 response.
- [ ] Unexpected errors return standard error envelope.
- [ ] Request ID appears in response and logs.
- [ ] Logs are structured and redact secrets.
- [ ] `npm run typecheck`, lint, tests and build pass.

### Frontend

- [ ] Angular app starts.
- [ ] Diagnostic page calls API.
- [ ] API unavailable state is handled.
- [ ] API URL is configurable without source edits.
- [ ] Angular strict checks pass.

### CI

- [ ] Pull request workflow installs dependencies.
- [ ] Lint, typecheck, tests and builds run.
- [ ] Workflow fails when a quality gate fails.

### Understanding

- [ ] You can explain each major folder.
- [ ] You can explain middleware execution order.
- [ ] You can explain how API readiness is determined.
- [ ] You can stop/start the stack and diagnose a failed dependency.

## 8. Out of scope for Phase 1

Do not implement:

- Registration/login.
- Session or JWT logic.
- User/role tables.
- Product CRUD.
- Cart or checkout.
- Redis caching.
- Background queues.
- Payment integration.
- Production deployment.

Those are later phases. The point is to establish a reliable foundation, not to create a large amount of unfinished code.

## 9. Phase 1 review questions

Before moving to Phase 2, answer these in your own words:

1. Why should tests import `createApp()` without starting a network listener?
2. Why is Zod required if TypeScript already checks types?
3. Why are liveness and readiness different?
4. What happens if PostgreSQL is healthy but Redis is unavailable?
5. Why should database credentials not be placed in Angular environment files?
6. What is the difference between a Docker volume and a container filesystem?
7. Why should an Express error handler be registered after routes?
8. What information belongs in a request log, and what must never be logged?
9. Why is PostgreSQL authoritative and Redis disposable?
10. What changes when the API is deployed behind a reverse proxy?

**Phase 1 is complete only when the acceptance criteria and review questions are satisfied.**
