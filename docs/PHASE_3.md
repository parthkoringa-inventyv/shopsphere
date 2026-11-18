# Phase 3 — Product Catalog & Inventory Foundation

**Project:** ShopSphere — Full-Stack E-Commerce Engineering Challenge  
**Prerequisite:** Phase 1 is complete and Phase 2 identity/authentication/access-control acceptance criteria pass.  
**Objective:** Build the single-vendor product information and stock foundation: category and brand taxonomy, products, variants, attributes, product media metadata, public catalog browsing/search/filtering, administrator catalog management, and transactional inventory records.

> This plan follows `REQUIREMENTS.md` FR-05 and FR-07, with supporting rules from `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `SECURITY.md`, `TESTING.md` and `FREE_DEPLOYMENT.md`. Phase 3 does not implement cart, checkout, orders, payments or shipping. Inventory reservation for checkout is prepared in the model/design but is implemented when checkout is introduced.

---

## 1. Phase goals and outcomes

At the end of Phase 3:

1. Administrators with the correct permissions can create, edit, publish, archive and inspect products.
2. Administrators can manage categories and brands.
3. Products can have one or more variants, each with a unique SKU and its own sellable attributes and inventory identity.
4. Product attributes/options are modeled deliberately rather than as uncontrolled arbitrary JSON.
5. Product images/media metadata can be managed with validated metadata, ordering and alt text. Storage is behind an adapter so the application is not coupled to one provider.
6. Public visitors can browse product lists and details, categories and brands.
7. Product listing supports bounded pagination, allowlisted sorting and validated filters.
8. Search works using PostgreSQL capabilities appropriate to the project scale; query plans and indexes are measured.
9. Inventory tracks on-hand quantity and every stock change through an immutable movement record.
10. Stock adjustments are transactional, audited and protected from negative stock.
11. Catalog and inventory operations enforce server-side permissions.
12. Angular has a minimal customer catalog and admin catalog/inventory screens.
13. Tests cover product rules, database constraints, authorization, query behavior and concurrent stock updates.
14. The phase remains compatible with the single-vendor scope and free deployment constraints.

## 2. Scope boundaries

### Included

- Category hierarchy and category listing.
- Brand management.
- Product lifecycle and publication status.
- Product variants and SKU management.
- Product attributes/options and validation.
- Product image/media metadata and storage adapter boundary.
- Public product listing, detail, search, filter, sort and pagination.
- Admin product/category/brand/variant management.
- Base inventory quantities, stock adjustments and movement history.
- Low-stock threshold and basic low-stock view/report.
- Catalog caching only after correctness and invalidation tests.
- Angular customer catalog and admin management UI.

### Explicitly not included

- Cart, wishlist or guest-cart merge.
- Pricing promotions, coupons, tax calculation or checkout quote.
- Inventory reservation/commit/release lifecycle for orders. The schema and invariants should be planned, but reservation behavior belongs with checkout/order implementation.
- Orders, payments, refunds or shipping.
- Reviews, recommendations or analytics dashboard beyond simple catalog/stock summaries.
- Multi-vendor seller onboarding, tenant-specific catalogs or seller inventory.
- Production image hosting unless a genuinely free, persistent storage option is verified before use.

## 3. Important modeling decisions

### 3.1 Product vs variant

A product is the customer-facing parent listing (for example, a shoe model). A variant is the purchasable stock-keeping unit (for example, size 9 / black). Inventory is tracked against a variant, not just the parent product. Even a product with no meaningful options should have a default variant/SKU if it is purchasable. This keeps cart and order lines unambiguous later.

### 3.2 Product lifecycle

Define explicit statuses such as `DRAFT`, `ACTIVE`, `ARCHIVED` and optionally `OUT_OF_STOCK` only if the status has a clear business meaning. Prefer deriving availability from variant inventory rather than storing a potentially stale product status. Publishing must validate required product fields and at least one active purchasable variant.

### 3.3 Category and brand

- Categories support a parent-child hierarchy.
- Prevent cycles and invalid parent assignments.
- Product-to-category cardinality should follow the requirements and your chosen first-release UX. A practical first implementation can use one primary category per product; record this as a decision if selected.
- Brand is optional unless the product domain requires it.

### 3.4 Attributes and variant options

Separate descriptive attributes (e.g. material, care instructions) from variant-defining options (e.g. size, color). Do not allow arbitrary client JSON to define schema or SQL behavior. Validate attribute definitions and values on the server.

### 3.5 Money and SKU

- Store monetary values as integer minor units (INR paise) or PostgreSQL `numeric`, as selected in `DATABASE.md`.
- Never use JavaScript floating point for price arithmetic.
- SKU uniqueness is enforced by PostgreSQL. Decide whether SKU uniqueness is global for the single store; the recommended first-release policy is globally unique.

### 3.6 Media storage

Use a media-storage interface. Local development may use a local adapter, but do not assume local disk persists on the free API host. For the first deployable version, use known remote seed images or a verified free persistent object-storage service. If a free provider cannot be verified without a paid commitment or overage risk, defer live uploads and keep the adapter contract plus local tests. Never expose a fake claim that uploaded local files are durable in deployment.

### 3.7 Inventory truth

PostgreSQL is authoritative. `inventory_movements` is the audit ledger of stock changes; the current inventory row is the efficiently readable balance. Update both in one transaction. Redis must never be used as the source of truth for stock.

---

## 4. Implementation sequence — do these tasks in order

### Task 0 — Phase readiness and domain walkthrough

**Goal:** Ensure Phase 2 provides the authentication and permission contracts this phase requires.

Steps:
1. Create a branch such as `phase-3/catalog-inventory`.
2. Run the full Phase 1 and Phase 2 checks from a clean local setup.
3. Confirm both auth modes work and that one configured mode is active for the demo environment.
4. Confirm the backend exposes a stable authenticated principal and permission-check service.
5. Confirm initial permissions exist for catalog and inventory actions, or add a reviewed seed migration for them.
6. Read FR-05 and FR-07 carefully and map each requirement to a planned endpoint, table, UI flow and test.
7. Define the initial product example domain and sample data (e.g. apparel, electronics or home goods). Keep the model generic enough for the selected domain.
8. Decide product/category cardinality, SKU policy, variant-option representation, product slug policy, image storage approach and low-stock threshold behavior.
9. Record decisions in `DECISIONS.md` before implementing schema.
10. Update the root documentation index with Phase 3.

Acceptance:
- Phase 2 remains green.
- Every Phase 3 requirement has a planned implementation/test location.

### Task 1 — Catalog module boundaries and contracts

**Goal:** Create explicit ownership for catalog and inventory business rules.

Suggested modules:

```text
apps/api/src/modules/
  catalog/
    domain/
    application/
    infrastructure/
    http/
  inventory/
    domain/
    application/
    infrastructure/
    http/
```

Steps:
1. Define catalog ownership: categories, brands, products, variants, product attributes and media metadata.
2. Define inventory ownership: stock balances, stock movements, stock adjustments and low-stock queries.
3. Define application services such as `CreateProduct`, `UpdateProduct`, `PublishProduct`, `AdjustStock`, `GetProductDetail` and `SearchCatalog`.
4. Define explicit input/output DTOs. Do not return Prisma models directly.
5. Define repository interfaces and query interfaces. Keep public catalog read queries separate from admin write use cases.
6. Define how catalog calls inventory to verify that a product has an active sellable variant; do not let catalog write inventory tables directly.
7. Define how inventory references variants without owning variant lifecycle.
8. Avoid circular module dependencies. Use an application service/orchestrator where a use case needs both modules.

Acceptance:
- Catalog and inventory responsibilities are documented.
- HTTP handlers contain no core stock arithmetic or product publication rules.

### Task 2 — Database schema and migrations

**Goal:** Implement the minimum relational model for catalog and stock, adding only the tables required by the current phase.

Core tables based on `DATABASE.md`:
- `categories`
- `brands`
- `products`
- `product_variants`
- `product_attributes` (and attribute-value relation tables if the chosen model needs them)
- `product_images`
- `inventory`
- `inventory_movements`

Steps:
1. Review the existing ID strategy and timestamp conventions; stay consistent.
2. Create `categories` with name, slug, optional parent ID, status/sort fields and timestamps.
3. Add unique slug constraint and parent foreign key. Define deletion behavior for parent categories with children/products.
4. Create `brands` with name, slug, status and timestamps. Add unique slug.
5. Create `products` with name, slug, description, status, category relation, optional brand relation, SEO fields if included, and timestamps.
6. Add unique product slug. Decide how archived products remain addressable by historical order snapshots later.
7. Create `product_variants` with product ID, globally unique SKU, option data/normalized option relations, optional price override, weight/dimensions and status.
8. Add checks for non-negative price/weight/dimensions where applicable and valid quantity constraints.
9. Model descriptive attributes separately from variant-defining options. Choose normalized tables or a constrained JSON representation and document the trade-off. Do not make arbitrary JSON the only source of critical SKU/option identity.
10. Create `product_images` with product/optional variant relation, storage key or URL, alt text, sort order, MIME/type metadata and timestamps.
11. Create `inventory` with one row per stock-managed variant, on-hand quantity, reserved quantity (reserved remains zero until reservation workflow is implemented), low-stock threshold and optional version field.
12. Create append-only `inventory_movements` with variant, signed quantity delta, movement reason, actor, reference, note and timestamp.
13. Add unique constraint on inventory variant ID; add foreign keys and check constraints preventing invalid negative balances.
14. Add indexes based on real queries: category parent/status, product status/category/brand/created time, variant product/SKU, inventory low-stock lookup and movement history by variant/time.
15. Generate migration and inspect SQL. Confirm cascade/restrict behavior deliberately.
16. Apply migrations to clean and existing databases.
17. Create deterministic synthetic seed data for categories, brands, products, variants and initial stock. Make seeding repeatable.

Acceptance:
- Constraints reject duplicate slugs/SKUs and invalid stock values.
- Each sellable variant has a stable SKU and inventory identity.
- Migrations run cleanly and are committed.

### Task 3 — Category and brand management

**Goal:** Build taxonomy before product workflows depend on it.

Steps:
1. Implement create/list/detail/update/archive category use cases.
2. Validate category names and generate or validate URL-safe slugs. Handle slug collisions with a clear conflict response.
3. Implement parent assignment and reject self-parenting, descendant cycles and invalid parent states.
4. Define category deletion behavior: block deletion when products/children depend on it, or require explicit reassignment/archive. Do not silently cascade-delete product data.
5. Implement category tree/list query with bounded depth/page behavior appropriate to the UI.
6. Implement create/list/update/archive brand use cases.
7. Define brand deletion behavior for products already referencing it.
8. Add admin permissions for category and brand actions.
9. Add audit records for create/update/archive operations.
10. Add tests for duplicate slugs, category cycles, invalid parent, referenced deletion and permission denial.

Acceptance:
- Admin can manage category hierarchy and brands.
- Public category listing exposes only categories intended to be public.
- Invalid hierarchy changes are rejected consistently.

### Task 4 — Product and variant domain rules

**Goal:** Implement product lifecycle and purchasable SKU rules independently of HTTP.

Steps:
1. Define product status transitions, e.g. `DRAFT -> ACTIVE -> ARCHIVED`; document whether unpublishing returns to `DRAFT` or a separate `INACTIVE` state.
2. Define required fields for draft vs publish. Draft may be incomplete; active product must satisfy publication rules.
3. Define variant lifecycle and whether a product may be active with some inactive variants.
4. Define SKU normalization and uniqueness policy. Do not silently rewrite merchant-provided identifiers without documenting it.
5. Define variant option validation (e.g. required size/color options for the selected category/domain).
6. Define descriptive attribute validation and allowed types (text, number, boolean, enum) if using typed attributes.
7. Define price inheritance/override semantics. A variant override should be explicit; do not ambiguously treat zero as missing.
8. Define product slug immutability/update policy and whether old slugs redirect or return not found. Record the decision.
9. Define archive behavior: archived products disappear from public catalog but remain available to historical references later.
10. Write pure unit tests for all transitions and validation rules before repository/route implementation.

Acceptance:
- Product/variant business rules are testable without Express or PostgreSQL.
- A product cannot be published without required fields and at least one active sellable variant.

### Task 5 — Product and variant administration APIs

**Goal:** Allow authorized staff to maintain the catalog.

Steps:
1. Implement admin create-product endpoint with Zod validation and explicit DTO mapping.
2. Implement product detail/edit endpoints.
3. Implement variant create/update/deactivate endpoints and enforce SKU uniqueness at database level.
4. Implement product publish/unpublish/archive domain commands; do not allow arbitrary status mutation via generic PATCH.
5. Implement product image metadata create/update/reorder/delete endpoints.
6. Enforce permissions such as `catalog.product.read`, `catalog.product.create`, `catalog.product.update`, `catalog.product.publish`, `catalog.product.archive`, and equivalent category/brand permissions. Use the actual permission naming convention established in Phase 2.
7. Enforce role/permission checks in backend routes/application services.
8. Audit product and variant changes with actor ID and safe before/after metadata; avoid storing huge payloads or sensitive values.
9. Return response DTOs, not ORM entities.
10. Add API contract and integration tests for valid/invalid product, variant and status changes.

Acceptance:
- Only authorized administrators can mutate catalog data.
- Product status transitions are validated by domain rules.
- SKU/slug conflicts return controlled 409-style errors.

### Task 6 — Media metadata and storage adapter

**Goal:** Support product imagery without coupling business logic to a paid or ephemeral storage provider.

Steps:
1. Define a `MediaStorage` interface with operations needed by the application (upload/store, retrieve URL/metadata, delete if policy permits).
2. Define allowed file extensions and MIME types, maximum byte size and image dimension/pixel limits appropriate to the demo.
3. Validate file signature/content rather than trusting only filename or browser-supplied MIME type.
4. Generate random storage keys; never use the uploaded filename as a filesystem path.
5. Prevent path traversal, overwrite collisions and unauthorized upload/delete.
6. Store media metadata in PostgreSQL; store bytes only through the storage adapter.
7. Implement a local development adapter only if needed, and clearly mark its data as ephemeral/local.
8. For deployment, use remote seed image URLs or a verified free persistent storage service. Re-check its quotas, card requirement, egress and overage policy before enabling uploads.
9. Ensure product images have meaningful alt text and deterministic display order.
10. Add tests for oversized file, deceptive MIME, invalid signature, unauthorized upload, path traversal and duplicate storage key.
11. Document how to replace the adapter without changing catalog domain rules.

Acceptance:
- Invalid uploads are rejected before persistence.
- No upload is written to an ephemeral deployment filesystem under the assumption that it is durable.
- Media metadata and storage provider are cleanly separated.

### Task 7 — Inventory ledger and stock adjustment

**Goal:** Build auditable stock management before introducing carts or checkout.

Steps:
1. Define stock quantities precisely: `on_hand`, `reserved` and `available = on_hand - reserved`. In this phase, reservation workflows are not active, so reserved should remain zero unless test fixtures explicitly exercise the model.
2. Define allowed stock movement reasons: `INITIAL_STOCK`, `RECEIPT`, `ADJUSTMENT_INCREASE`, `ADJUSTMENT_DECREASE`, `DAMAGE`, `LOSS`, `CORRECTION`. Keep the list controlled.
3. Implement initial stock creation when a variant becomes stock-managed.
4. Implement an inventory adjustment command that requires quantity delta, reason and optional note/reference.
5. In one PostgreSQL transaction, update the inventory balance and insert the corresponding immutable movement row.
6. Prevent a negative on-hand balance using conditional updates and database constraints. Return a conflict/business error if an adjustment would make stock negative.
7. Record the actor from the authenticated principal; never trust actor ID from the request body.
8. Implement stock movement history with bounded pagination and stable ordering.
9. Implement low-stock query using threshold and available quantity. Decide whether zero threshold means disabled or alert at zero; document it.
10. Add audit records for administrative stock adjustments in addition to the inventory movement ledger where appropriate.
11. Add tests for concurrent adjustments, rollback if movement insert fails, invalid deltas, unauthorized changes and low-stock calculation.

Acceptance:
- Every balance change has a matching movement record.
- The balance and movement commit or roll back together.
- Negative stock cannot be created through API or direct invalid SQL.

### Task 8 — Public catalog read APIs

**Goal:** Deliver useful read-only product discovery for guests and customers.

Steps:
1. Implement `GET /api/v1/categories` and category detail/list endpoints for active public categories.
2. Implement `GET /api/v1/products` with page/pageSize, category, brand, status (public status only), search, price range only if price fields are included, and allowlisted sort options.
3. Set a maximum page size and reject invalid pagination/filter values.
4. Use deterministic sorting with a tie-breaker such as product ID/created timestamp.
5. Implement `GET /api/v1/products/{productIdOrSlug}` and return only active/public products and active variants.
6. Return variant availability derived from inventory. Do not expose internal stock counts unless the product UX explicitly requires it; prefer availability flags or coarse messaging.
7. Add brand listing/filtering if required by the selected storefront UX.
8. Return explicit DTOs with product summary, image URLs/alt text, category/brand labels and variant choices.
9. Apply appropriate `Cache-Control` headers for public catalog reads; private admin responses must not be publicly cached.
10. Add API tests for hidden drafts, archived products, invalid filters, maximum page size and stable sorting.

Acceptance:
- Guest can browse public products and categories without authentication.
- Draft/archived products are not exposed through public APIs.
- Lists are bounded and deterministic.

### Task 9 — Search, filtering, indexes and raw SQL exercise

**Goal:** Implement search that is correct, safe and measured rather than adding arbitrary filters.

Steps:
1. Start with a documented search scope: product name, description and SKU only if SKU should be public-searchable.
2. Choose PostgreSQL full-text search, trigram matching or a simpler `ILIKE` baseline based on the learning goal and dataset. Record why.
3. Use parameterized queries only. Never concatenate user search text into SQL.
4. Add appropriate PostgreSQL indexes (e.g. GIN full-text/trigram) only after confirming extension availability and local/deployment compatibility.
5. Keep sort field names in a server-side allowlist; never pass raw user-provided SQL identifiers.
6. Implement at least one search/filter query with parameterized raw SQL via Prisma `$queryRaw`/safe tagged template, then compare it with an ORM query where suitable.
7. Run `EXPLAIN (ANALYZE, BUFFERS)` locally against seeded data.
8. Record query plan, row counts, latency and index usage before/after.
9. Add tests for SQL injection payloads, empty search, special characters, invalid sort keys and filter combinations.
10. Avoid premature caching until the query behavior and invalidation strategy are understood.

Acceptance:
- Search/filter results are deterministic and bounded.
- No SQL injection path exists in search or sort parameters.
- At least one raw SQL exercise is documented with query plan evidence.

### Task 10 — Catalog caching (only after correctness)

**Goal:** Learn cache-aside without allowing stale catalog data to become authoritative.

Steps:
1. Establish uncached API correctness and baseline performance first.
2. Identify public read endpoints worth caching using measured request/query data.
3. Define cache keys containing search, filters, sort, page and relevant catalog version.
4. Define TTL and maximum cache payload/entry behavior within the Redis quota.
5. Invalidate or version cache entries after product/category/brand publication or edits that affect public output.
6. Never cache admin/private data as public.
7. Define behavior when Redis is unavailable: public reads should fall back to PostgreSQL if safe; writes must still commit to PostgreSQL and must not fail solely because cache invalidation failed. Use versioning/outbox or safe best-effort invalidation so stale data risk is bounded and documented.
8. Add tests for cache hit, miss, invalidation, stale-key behavior and Redis outage.
9. Measure before/after P50/P95 and database query load. Do not claim performance improvement without results.

Acceptance:
- Cache can be enabled/disabled by configuration.
- PostgreSQL remains authoritative.
- Catalog changes do not leave indefinitely stale public responses.

### Task 11 — Angular customer catalog

**Goal:** Give guests and customers a usable way to discover products.

Suggested feature layout:

```text
apps/web/src/app/features/catalog/
  pages/
    product-list/
    product-detail/
    category-list/   # only if required by UX
  components/
    product-card/
    product-filters/
    product-gallery/
  data-access/
    catalog-api.service.ts
  models/
```

Steps:
1. Define strict TypeScript DTOs matching the API/OpenAPI contract.
2. Implement a typed catalog API service.
3. Build product listing with loading, error, empty and retry states.
4. Add category/brand/search filters supported by the API.
5. Keep filter state reflected in URL query parameters where useful for refresh/share/back navigation.
6. Implement pagination and stable sort controls.
7. Build product detail with image gallery, description, variant selection and availability display.
8. Disable selection/purchase affordances for unavailable variants, but do not implement cart in this phase.
9. Use Angular 21 standalone components, signals/computed for local UI state, OnPush change detection and native control flow.
10. Use `NgOptimizedImage` for suitable static/known images; handle remote image sizing and fallback correctly.
11. Ensure keyboard operation, semantic headings, accessible form labels, alt text and WCAG AA-oriented contrast.
12. Add component/service tests and Playwright browse/search/detail flows.

Acceptance:
- Guest can browse, search, filter and open product details.
- UI never assumes a product is purchasable solely because it appears in a list.
- Loading/error/empty states are usable and accessible.

### Task 12 — Angular admin catalog and inventory screens

**Goal:** Let authorized staff maintain products and stock through the application.

Suggested feature layout:

```text
apps/web/src/app/features/admin/
  catalog/
    products/
    categories/
    brands/
  inventory/
    stock-list/
    stock-adjustment/
    movement-history/
```

Steps:
1. Add admin navigation based on the authenticated principal's permission data for UX only.
2. Build product list with search, filters, pagination and status indicators.
3. Build product create/edit form with category, brand, description, status and SEO fields as selected.
4. Build variant editor with SKU, option values, price override and active status.
5. Build publish/archive actions as explicit commands with confirmation and validation feedback.
6. Build category hierarchy and brand management screens.
7. Build inventory list with on-hand/available/low-stock indicators.
8. Build stock-adjustment form requiring reason and quantity delta; show clear warning for decreases.
9. Build stock movement history with bounded filters and pagination.
10. Display permission-denied states safely. The backend remains the enforcement layer.
11. Add tests for form validation, permission-aware navigation and end-to-end product/stock workflows.

Acceptance:
- Authorized admin can create and publish a valid product with variants.
- Unauthorized customer cannot perform mutations even by calling API directly.
- Stock adjustment history is visible and traceable.

### Task 13 — Performance, reliability and data-quality testing

**Goal:** Validate catalog performance and stock correctness against the project targets.

Steps:
1. Seed at least 1,000 synthetic products and representative variants/categories locally as a starting benchmark; scale further only if machine resources allow.
2. Capture baseline product-list and detail P50/P95/P99, throughput, error rate and SQL query count.
3. Check for N+1 queries on list/detail paths.
4. Verify indexes align with actual filter/sort patterns.
5. Test bounded pagination and large page-size rejection.
6. Run concurrent stock adjustment tests against the same variant.
7. Verify no lost updates and no negative stock.
8. Verify transaction rollback leaves neither a balance change without a movement nor a movement without a balance change.
9. Run a local k6 smoke/load test; do not load-test shared free hosting.
10. Record machine, Node/PostgreSQL versions, dataset size, concurrency and test command so results are reproducible.
11. Compare against the learning targets in `REQUIREMENTS.md`; explain misses rather than tuning blindly.

Acceptance:
- No known N+1 issue remains on primary catalog paths without a documented reason.
- Stock invariants pass concurrency tests.
- Performance report includes test conditions and measured values.

### Task 14 — Security review and final documentation

**Goal:** Ensure catalog and inventory do not introduce authorization, injection or upload vulnerabilities.

Steps:
1. Test anonymous access to admin catalog endpoints.
2. Test customer access to product mutation and stock adjustment endpoints.
3. Test a staff role missing the specific permission.
4. Test mass-assignment attempts to set product status, SKU, stock or protected fields outside the allowed command.
5. Test SQL injection through search, filters and sort values.
6. Test malicious/deceptive uploads, oversized images and path traversal if upload is enabled.
7. Test access to draft/archived products by public ID and slug.
8. Verify audit log records catalog and stock changes.
9. Verify public cache headers and no-store/private headers for admin endpoints.
10. Update `README.md`, `REQUIREMENTS.md` if scope changed, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `SECURITY.md`, `TESTING.md`, `DECISIONS.md` and free-deployment notes if media storage changed.
11. Add seed instructions, admin bootstrap instructions and a complete local demo walkthrough.
12. Record known limitations and phase exit evidence.

Acceptance:
- No unresolved critical/high issue remains without an explicit mitigation/deferral decision.
- Documentation matches actual endpoints, schema, permissions and storage behavior.

---

## 5. Suggested backend structure after Phase 3

```text
apps/api/src/modules/
  auth/
  users/
  access-control/
  audit/
  catalog/
    domain/
    application/
    infrastructure/
    http/
  inventory/
    domain/
    application/
    infrastructure/
    http/
```

Only create subfolders that contain actual code. Preserve the module boundaries established in Phase 2.

## 6. Suggested API surface

Exact route names should follow the existing API conventions and OpenAPI contract. A reasonable first version is:

### Public
- `GET /api/v1/categories`
- `GET /api/v1/categories/{slug}`
- `GET /api/v1/brands` (if the storefront needs brand navigation)
- `GET /api/v1/products`
- `GET /api/v1/products/{productIdOrSlug}`

### Admin catalog
- `GET /api/v1/admin/products`
- `POST /api/v1/admin/products`
- `GET /api/v1/admin/products/{productId}`
- `PATCH /api/v1/admin/products/{productId}`
- `POST /api/v1/admin/products/{productId}/publish`
- `POST /api/v1/admin/products/{productId}/archive`
- Variant create/update/deactivate routes under the product resource.
- Category and brand CRUD/archive routes under `/api/v1/admin`.
- Product media metadata/upload routes only if the selected storage adapter is ready.

### Admin inventory
- `GET /api/v1/admin/inventory`
- `GET /api/v1/admin/inventory/{variantId}/movements`
- `POST /api/v1/admin/inventory/{variantId}/adjustments`
- `GET /api/v1/admin/inventory/low-stock`

Document request/response DTOs, pagination, allowed sort/filter values, permissions and error codes. Do not expose internal ORM records.

## 7. Suggested permission catalogue

Use the naming convention already adopted in Phase 2. Example permission codes:

- `catalog.product.read`
- `catalog.product.create`
- `catalog.product.update`
- `catalog.product.publish`
- `catalog.product.archive`
- `catalog.category.manage`
- `catalog.brand.manage`
- `catalog.media.manage`
- `inventory.read`
- `inventory.adjust`
- `inventory.movements.read`

Assign only the required permissions to `ADMIN`, `PRODUCT_MANAGER` and `INVENTORY_MANAGER`. A role should not automatically receive every future permission.

## 8. Database and SQL learning order

1. One-to-many category hierarchy and self-referencing foreign keys.
2. Product-to-variant one-to-many relationship.
3. SKU and slug uniqueness constraints.
4. Check constraints and foreign-key delete behavior.
5. Normalized descriptive attributes vs variant option modeling.
6. Inventory balance plus append-only movement ledger.
7. Transactions that update a balance and append a movement atomically.
8. Conditional updates and row locking for concurrent stock changes.
9. Index design for category/status/sort/filter queries.
10. PostgreSQL full-text/trigram search options.
11. Parameterized raw SQL, CTEs/aggregates where useful and `EXPLAIN (ANALYZE, BUFFERS)`.
12. Cache-aside, invalidation/versioning and safe Redis degradation.

## 9. Required learning outcomes

You should be able to explain:
- Product vs variant vs SKU.
- Why inventory belongs to a sellable variant.
- Product lifecycle and publication invariants.
- Category hierarchy and cycle prevention.
- Descriptive attributes vs variant-defining options.
- Database uniqueness vs application validation.
- Why stock movements should be recorded as a ledger.
- How transactions prevent balance/ledger divergence.
- Lost updates and concurrent stock adjustment strategies.
- Why PostgreSQL, not Redis, is inventory authority.
- Safe pagination and allowlisted sorting.
- Full-text search/trigram trade-offs.
- Query plans and index selectivity.
- Media metadata vs binary object storage.
- Cache invalidation and stale-data risks.
- Why an active product and an available variant are separate concepts.

## 10. Phase 3 acceptance checklist

### Catalog data model
- [ ] Category hierarchy supports parent-child relationships and prevents cycles.
- [ ] Brand records have unique slugs.
- [ ] Products have unique slugs and explicit lifecycle states.
- [ ] Variants have globally unique SKUs.
- [ ] Product attributes and variant options have documented models.
- [ ] Product image metadata includes storage reference, alt text and ordering.
- [ ] Migrations and deterministic seed scripts are committed.

### Catalog behavior
- [ ] Admin can create, edit, publish, unpublish/archive products.
- [ ] Publishing validates required fields and active purchasable variant.
- [ ] Admin can manage categories and brands.
- [ ] Public APIs expose only public/active catalog records.
- [ ] Search, filters, sorting and pagination are validated and bounded.
- [ ] Sort fields are allowlisted.
- [ ] Product APIs return explicit DTOs.

### Inventory
- [ ] Inventory is tracked per variant.
- [ ] Stock adjustment and movement insertion are one transaction.
- [ ] Every stock change has actor, reason, delta and timestamp.
- [ ] Negative stock is prevented by database/application safeguards.
- [ ] Concurrent adjustment tests pass.
- [ ] Low-stock reporting works.
- [ ] Redis is not the source of truth for inventory.

### Media and security
- [ ] Media storage is abstracted.
- [ ] Uploads, if enabled, validate file content, size and authorization.
- [ ] No durable upload relies on ephemeral deployment disk.
- [ ] Admin mutations enforce server-side permissions.
- [ ] Public endpoints do not reveal drafts/archived products.
- [ ] SQL injection, mass assignment and IDOR-related checks pass.
- [ ] Audit logs capture catalog and stock changes without unsafe payloads.

### Frontend and quality
- [ ] Customer catalog supports list/detail/search/filter/pagination.
- [ ] Admin can manage products, categories, brands and stock.
- [ ] UI has loading, empty, error and retry states.
- [ ] Keyboard and accessibility checks pass.
- [ ] Unit, integration, API and E2E tests pass.
- [ ] Local performance report records reproducible measurements.
- [ ] Documentation and decision log are updated.

## 11. Phase 3 exit gate

Do not begin cart, pricing or checkout work until the public catalog contract is stable, product/variant identity is reliable, stock movements are transactionally correct, and concurrency tests prove that stock cannot become negative. The next phase can then build carts and pricing against stable product/variant IDs and inventory availability rules.


---

## Deployment checkpoint — Phase 3

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
