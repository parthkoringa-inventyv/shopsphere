# Architecture Decision Log

Record decisions as they are made. Newest decisions go first.

## ADR-0001 — Modular monolith for the first release

- **Status:** Accepted
- **Context:** The project is a deep backend learning challenge with a strict free deployment constraint.
- **Decision:** One Express application with explicit business modules and infrastructure adapters.
- **Consequences:** Simpler deployment and transactional workflows; requires discipline around module boundaries.
- **Revisit when:** A module has independently justified scaling, deployment or ownership requirements.

## ADR-0002 — PostgreSQL is the source of truth

- **Status:** Accepted
- **Decision:** Store durable business records in PostgreSQL. Redis may be used for disposable cache data, sessions and temporary coordination, but is never authoritative for orders, payments, inventory or account state. The application must define safe behavior when Redis is unavailable, and cache data must be rebuildable.
- **Consequences:** Correctness can rely on database constraints and transactions; cache data can be rebuilt.

## ADR-0003 — Prisma plus raw SQL

- **Status:** Accepted
- **Decision:** Use Prisma for schema/migrations and normal access; deliberately implement selected operations with parameterized raw SQL.
- **Consequences:** Developer productivity plus direct SQL learning; generated SQL and transaction semantics still need review.

## ADR-0004 — Both session and JWT authentication

- **Status:** Accepted
- **Decision:** Implement both as separate strategies, selectable by configuration, with a clearly defined credential transport.
- **Consequences:** More learning and test coverage; avoid ambiguous simultaneous acceptance of cookies and bearer tokens.

## ADR-0005 — Single-vendor first

- **Status:** Accepted
- **Decision:** First release has one store owner. Multi-vendor marketplace is a later extension.
- **Consequences:** Simpler inventory/order ownership and checkout; avoid premature tenant abstractions.

## ADR-0006 — Free-tier deployment only

- **Status:** Accepted
- **Decision:** Deploy only to $0 plans, no paid trial, no automatic paid upgrades and no paid custom domain.
- **Consequences:** Sleep/pausing/quotas and weaker reliability are accepted for a learning deployment. Re-check provider terms before provisioning.

## ADR-0007 — Separate Express app construction from server startup

- **Status:** Accepted
- **Context:** The API needs to be testable without opening a network port, while production startup and process lifecycle need a clear owner.
- **Decision:** Keep Express application construction in `app.ts` and HTTP server startup, signal handling and graceful shutdown in `server.ts`. Tests import the app factory directly and do not start a listener.
- **Consequences:** Application tests remain isolated from network lifecycle concerns. Startup and shutdown behavior can be tested separately.
- **Revisit when:** The application requires a different server runtime or a more complex process topology.