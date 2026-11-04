# ShopSphere

A backend-first e-commerce engineering challenge. This repository contains the application code and the practical instructions needed to run the project locally.

For the challenge goals, scope, and engineering principles, see [The ShopSphere Engineering Challenge](docs/CHALLENGE.md).

## Local development setup

Run commands from the directory indicated in each step. The examples assume the repository was cloned into a directory named `shopsphere`.

### 1. Clone the repository

```bash
git clone https://github.com/parthkoringa-inventyv/shopsphere.git
cd shopsphere
```

### 2. Create the local environment file

Run from the repository root:

```bash
cp .env.example .env
```

Review `.env` and set the local development values. Do not commit `.env`.

### 3. Install API dependencies

```bash
cd apps/api
npm install
```

### 4. Generate Prisma Client

Run from `apps/api`:

```bash
npm run db:generate
```

This generates Prisma Client from the current schema. It does not create database tables or migrations.

### 5. Start local infrastructure

Return to the repository root:

```bash
cd ../..
docker compose --env-file .env -f infra/docker/docker-compose.yml up -d
```

### 6. Check PostgreSQL and Redis connectivity

Run from `apps/api`:

```bash
cd apps/api
npm run db:check
npm run db:redis
```

These are diagnostic checks, not migrations.

### 7. Start the API

Run from `apps/api`:

```bash
npm run dev
```

## API health endpoints

- `GET /api/v1/health/live` — reports whether the API process is running.
- `GET /api/v1/health/ready` — checks whether required dependencies, including PostgreSQL and Redis, are ready.

The readiness endpoint must not expose connection strings, credentials, or other sensitive database details.

## API development commands

Run all commands in this table from `apps/api`.

| Command                     | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `npm run dev`               | Start the API in development mode with file watching |
| `npm start`                 | Start the compiled API from `dist/`                  |
| `npm run typecheck`         | Run TypeScript type checking without emitting files  |
| `npm run lint`              | Run ESLint                                           |
| `npm test`                  | Run the Vitest test suite once                       |
| `npm run test:watch`        | Run Vitest in watch mode                             |
| `npm run build`             | Compile the API TypeScript source                    |
| `npm run format`            | Format API files with Prettier                       |
| `npm run format:check`      | Check API formatting without modifying files         |
| `npm run db:generate`       | Generate Prisma Client                               |
| `npm run db:check`          | Run the PostgreSQL connectivity diagnostic           |
| `npm run db:redis`          | Run the Redis connectivity diagnostic                |
| `npm run db:migrate:status` | Inspect Prisma migration status                      |
| `npm run db:migrate:dev`    | Create and apply a development migration             |
| `npm run db:migrate:deploy` | Apply existing migrations to a deployment database   |

## Database migration quick reference

- Do not create the first migration until the first real database schema has been agreed upon.
- Until then, an empty database and a successful Prisma connectivity check are sufficient.
- Use `db:migrate:dev` only for local development after a schema change has been designed.
- Review and commit migration files to Git.
- Use `db:migrate:deploy` to apply committed migrations in a deployment environment. It does not create migrations.
- Never run development migration commands against the production database.

For the complete workflow and migration guidelines, see [Prisma migration workflow](docs/DATABASE.md#5-prisma-migration-workflow).

## Project documentation

| Document                                            | Purpose                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| [Engineering challenge overview](docs/CHALLENGE.md) | Mission, scope, stack, engineering principles and working agreement |
| [Requirements](docs/REQUIREMENTS.md)                | Functional and non-functional product specification                 |
| [Architecture](docs/ARCHITECTURE.md)                | System boundaries, modules, data flow and key decisions             |
| [Database requirements](docs/DATABASE.md)           | Data design, constraints, transactions, Prisma and raw SQL          |
| [API requirements](docs/API.md)                     | REST conventions, response format and endpoint scope                |
| [Security requirements](docs/SECURITY.md)           | Authentication, authorization and security controls                 |
| [Testing strategy](docs/TESTING.md)                 | Test levels and required failure/concurrency scenarios              |
| [Free deployment strategy](docs/FREE_DEPLOYMENT.md) | Zero-cost hosting strategy, constraints and limitations             |
| [Phase 1 plan](docs/PHASE_1.md)                     | Foundation phase, setup steps and acceptance criteria               |
| [Decision log](docs/DECISIONS.md)                   | Architecture decisions and trade-offs                               |
