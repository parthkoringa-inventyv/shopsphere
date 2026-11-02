# Database Requirements and Learning Plan

## 1. Database principles

PostgreSQL is the system of record. Use migrations for every schema change. Prisma is the default data-access layer, but raw SQL is required for selected exercises and performance-sensitive queries.

Use UUIDs or another consistently chosen key strategy. Document the trade-off. Use integer minor units for money (e.g. paise) or PostgreSQL `numeric`; never JavaScript floating point for currency arithmetic.

## 2. Initial entity inventory

| Table / aggregate | Important contents |
|---|---|
| users | normalized email, password hash, status, timestamps |
| roles | role code and description |
| permissions | permission code and description |
| user_roles | user-role mapping |
| role_permissions | role-permission mapping |
| sessions | hashed session ID, user, expiry, last activity, revocation |
| refresh_token_families | user, family ID, revocation state |
| refresh_tokens | token hash, parent/replacement relation, expiry, consumed timestamp |
| email_verification_tokens | token hash, user, expiry, consumed timestamp |
| password_reset_tokens | token hash, user, expiry, consumed timestamp |
| addresses | owner and normalized address fields |
| categories | name, slug, parent category |
| brands | name and slug |
| products | name, slug, status, descriptions, category, brand |
| product_variants | product, SKU, options, price override |
| product_images | storage key/URL, order, alt text |
| product_attributes | attribute definitions/values |
| inventory | variant, on-hand, reserved/version |
| inventory_movements | variant, delta, reason, actor, reference |
| inventory_reservations | order/checkout reference, variant, quantity, expiry, status |
| carts | user or guest identifier, expiry |
| cart_items | cart, variant, quantity |
| wishlists | user |
| wishlist_items | wishlist, product/variant |
| coupons | code, rules, dates, limits |
| coupon_usages | coupon, user, order, redemption state |
| orders | order number, user, totals, currency, address snapshot, state |
| order_items | product/variant snapshot, quantity, unit price, tax/discount |
| order_status_history | from/to state, actor, reason, timestamp |
| payments | order, provider, provider reference, amount, state |
| payment_webhook_events | provider event ID, payload metadata, processing state |
| refunds | payment, amount, provider reference, state |
| shipments | order, provider, tracking reference, state |
| shipment_events | shipment, status, event time |
| reviews | user, order item, product, rating, body, moderation |
| notifications | user, type, payload, read/delivery state |
| outbox_events | aggregate, event type, payload, publish state |
| audit_logs | actor, action, target, metadata, timestamp |

Do not implement all tables at once. Model each phase's needs and evolve through migrations.

## 3. Required constraints and indexes

- Unique normalized user email.
- Unique product slug and SKU where applicable.
- Unique provider webhook event ID scoped to provider.
- Unique coupon code.
- Unique review per eligible order item if business policy is one review per purchase.
- Foreign keys for owned relationships.
- Check constraints for positive quantities, non-negative amounts and valid rating range.
- Index foreign keys used in joins and filters.
- Composite indexes aligned with actual query patterns, e.g. `(user_id, created_at DESC)` for order history.
- Partial indexes for active/unexpired records where appropriate.
- Avoid indexing every column; measure write and storage costs.

## 4. Transactions and concurrency exercises

Implement and test:
1. Register user plus token/outbox records where atomicity is required.
2. Reserve multiple variants atomically.
3. Create order and order-item snapshots.
4. Redeem coupon under global/per-user limits.
5. Process payment event idempotently.
6. Cancel eligible order and release reserved inventory.
7. Refund and update related states.

Study:
- ACID.
- Read Committed, Repeatable Read, Serializable.
- Row locks and `SELECT ... FOR UPDATE`.
- Optimistic concurrency/version columns.
- Lost update, write skew, phantom reads.
- Deadlock detection and retry strategy.
- Isolation level trade-offs.

Do not keep a database transaction open while calling an external API.

## 5. Prisma and raw SQL learning requirements

Prisma:
- Schema modeling and relations.
- Migrations and generated client.
- Nested writes and transactions.
- Interactive transactions.
- Query logging in development.
- Connection pooling and serverless/deployment considerations.
- Understand the SQL Prisma generates.

Raw SQL:
- Parameterized queries only.
- Joins, aggregates, CTEs and window functions.
- `INSERT ... ON CONFLICT`.
- `UPDATE ... RETURNING`.
- Row-level locks.
- Full-text search and trigram indexes.
- `EXPLAIN (ANALYZE, BUFFERS)` in a safe test database.

Never concatenate user input into SQL strings.

## 6. Data volume and benchmarking

Seed synthetic data progressively. Start with 1k products and 5k orders; scale toward 10k users, 50k products/variants, 100k orders and 500k order items locally if machine resources allow.

Measure:
- Query plan.
- Execution time.
- Rows scanned/returned.
- Index usage.
- Connection pool wait.
- API P50/P95/P99.

Do not use a tiny free hosted database for large benchmark datasets. Perform large-scale load tests locally.

## 7. Backup and recovery

- Export schema and data locally.
- Practice restoring into a fresh local PostgreSQL instance.
- Document provider-specific export/restore procedure.
- Never rely on free-tier provider backups without verifying plan support.
- Keep synthetic seed data so the demo can be rebuilt if a free database is paused/deleted.
