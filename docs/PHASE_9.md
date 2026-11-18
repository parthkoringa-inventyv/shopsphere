# Phase 9 --- Admin Operations, Reporting and Support Console

**Prerequisites:** Phases 1--8 are complete and deployed.\
**Requirements covered:** FR-04 and FR-14, consolidating admin
capabilities introduced in Phases 2--8.\
**Goal:** Provide a coherent, permission-controlled operational console
for managing users, catalog, stock, orders, payments, shipments,
coupons, reviews, audit activity and basic reports.

## 1. Outcomes

-   Admin dashboard shows useful operational summaries.
-   Role/permission administration is safe and auditable.
-   Order and fulfilment queues support staff workflows.
-   Coupon, review and inventory controls are consolidated.
-   Support staff can access only permitted customer/order data.
-   Audit logs can be searched with bounded filters.
-   Reports are paginated/date-filtered and match database truth.
-   Admin APIs enforce permission checks and resource scoping.
-   No dashboard metric is presented as authoritative if its
    source/query is incomplete.

## 2. Scope boundaries

Included: admin navigation/dashboard, user/role management,
order/payment/refund operations, fulfilment/shipping controls, coupon
management integration, inventory low-stock view, review moderation,
audit search, basic revenue/order/product reports.

Not included: multi-vendor settlements, advanced BI/warehouse, AI
recommendations, real-time analytics platform, payroll/accounting
integration or unrestricted customer impersonation.

## 3. Readiness and permission review

1.  Run all prior phase tests and deployed smoke tests.
2.  Inventory all admin endpoints and permission codes.
3.  Build a permission matrix by role and operation.
4.  Identify duplicated screens/APIs introduced in earlier phases.
5.  Define support-agent privacy boundary and data minimization.
6.  Define metrics precisely: gross sales vs net sales,
    cancelled/refunded order treatment, date timezone, order count and
    inventory availability.
7.  Record dashboard/report query definitions in `API.md` or a reporting
    note.

## 4. Implementation sequence

### Task 1 --- Admin application shell

1.  Build role/permission-aware navigation for UX.
2.  Add route-level guard for navigation only.
3.  Ensure backend permissions remain authoritative.
4.  Add shared page layout, breadcrumbs, table patterns and accessible
    dialogs.
5.  Add pagination, filters, loading/error/empty states.
6.  Avoid a giant generic admin component; keep features modular.

### Task 2 --- User and access administration

1.  List users with bounded pagination and safe search.
2.  View account status and verification status where permitted.
3.  Suspend/reactivate accounts through explicit commands.
4.  Assign/revoke roles only for users with dedicated permission.
5.  Prevent removal of the last active administrator.
6.  Require confirmation/reason for sensitive changes.
7.  Audit every account/role change.
8.  Do not provide silent impersonation. If support impersonation is
    ever added, it requires a separate design, explicit consent/notice,
    narrow duration and full audit.

### Task 3 --- Order operations console

1.  Build order queue with status/date/customer filters.
2.  Show immutable order item/address/price snapshots.
3.  Provide valid state-transition actions only.
4.  Link to payment attempts, refund status and shipment timeline.
5.  Show idempotency/reference identifiers for troubleshooting without
    exposing secrets.
6.  Support cancellation/return review according to policy.
7.  Audit administrative decisions and reasons.

### Task 4 --- Payment and refund operations

1.  List payment attempts and normalized provider states.
2.  Show webhook processing status and reconciliation cases.
3.  Restrict refund creation/approval by permission.
4.  Display refundable amount computed server-side.
5.  Provide manual review action for mismatches.
6.  Never allow admin UI to mark payment succeeded without verified
    provider evidence.
7.  Audit every refund/reconciliation action.

### Task 5 --- Inventory and catalogue operations

1.  Consolidate low-stock and movement views.
2.  Link variant SKU to product and stock history.
3.  Require adjustment reason and confirmation.
4.  Show archived/draft/published status clearly.
5.  Expose catalog operations based on permissions.
6.  Avoid direct editing of ledger history; corrections are new
    movements.

### Task 6 --- Shipping and delivery operations

1.  Shipment queue with tracking number, status, hub and assigned demo
    agent.
2.  Show delivery attempts and failed jobs.
3.  Allow only valid retry/manual simulation operations.
4.  Restrict simulation clock controls to demo/admin permission.
5.  Keep customer-facing tracking events separate from internal notes.
6.  Provide RTO/return inspection workflow visibility.

### Task 7 --- Coupons and review moderation integration

1.  Consolidate coupon list, activation and usage summary.
2.  Show coupon redemption records without exposing unnecessary customer
    details.
3.  Consolidate review moderation queue and reports.
4.  Preserve moderation reason/history.
5.  Enforce module-specific permissions.

### Task 8 --- Audit console

1.  Add bounded date, actor, action, target and request-ID filters.
2.  Use append-only audit records; do not offer edit/delete UI.
3.  Restrict audit access to dedicated permission.
4.  Redact credential and personal-secret fields.
5.  Add pagination and stable ordering.
6.  Add retention and export policy only after reviewing privacy
    obligations.
7.  Test that an ordinary admin role without audit permission cannot
    read logs.

### Task 9 --- Reporting model and SQL

Implement basic reports from documented definitions: - Orders by
status/date. - Gross order value and net collected amount with clear
refund/cancellation handling. - Sales by product/variant. - Low-stock
variants. - Coupon usage. - Refund totals. - Shipment delivery/failure
counts. - Review rating summary.

Steps: 1. Define time zone and date-boundary behavior. 2. Decide whether
each report reads transactional tables or a derived summary. 3. Use
parameterized raw SQL for at least one multi-join/aggregate report. 4.
Add indexes based on query plan evidence. 5. Use bounded date ranges and
pagination. 6. Run `EXPLAIN (ANALYZE, BUFFERS)` locally. 7. Compare
report totals with manually verified sample transactions. 8. Do not add
Redis caching until correctness and invalidation are tested. 9. Export
CSV only if bounded and safe; avoid large unbounded exports.

### Task 10 --- Security, privacy and accessibility review

-   Role matrix and deny-by-default tests.
-   Support agent cannot access admin-only operations.
-   Customer PII minimization in tables/logs.
-   IDOR/BOLA checks on all admin detail endpoints.
-   No payment secrets/card data in UI/logs.
-   CSRF/CORS and session/JWT mode tests.
-   Accessible keyboard/table/dialog navigation.
-   Audit reason and actor integrity.

### Task 11 --- Deployment and sign-off

1.  Deploy backend APIs and migrations.
2.  Deploy Angular admin console.
3.  Verify each role with seeded non-production demo users.
4.  Verify forbidden routes are denied server-side.
5.  Reconcile dashboard totals with SQL test fixtures.
6.  Run all previous customer journeys.
7.  Record performance and query evidence.

## 5. Learning outcomes

-   Permission matrices and least privilege.
-   Operational workflow design.
-   Auditability and privacy.
-   Reporting aggregates and raw SQL.
-   Query plans/indexes.
-   Admin UX and accessible data tables.
-   Reconciliation between operational records.

## 6. Exit checklist

-   [ ] Admin shell and navigation work.
-   [ ] Every admin operation has explicit permission.
-   [ ] User/role changes are audited.
-   [ ] Order/payment/shipment operations are visible and controlled.
-   [ ] Audit logs are searchable and immutable through UI.
-   [ ] Reports have documented definitions and verified totals.
-   [ ] Query performance is measured.
-   [ ] Support-agent privacy boundaries pass tests.
-   [ ] All prior journeys and deployed smoke tests pass.

**Exit gate:** Begin final production-readiness only when operational
workflows are usable, least-privilege permissions are proven and reports
reconcile to source data.
