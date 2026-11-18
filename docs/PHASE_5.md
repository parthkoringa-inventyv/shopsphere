# Phase 5 --- Checkout, Orders and Inventory Reservations

**Prerequisites:** Phases 1--4 are complete and deployed.\
**Requirements covered:** FR-07 and FR-09, integrating FR-06 and FR-08.\
**Goal:** Turn a cart preview into a durable order with immutable
purchase snapshots, safe stock reservation, idempotent checkout and a
validated order state machine.

## 1. Outcomes

-   Customer can obtain a server-calculated checkout quote.
-   Customer can select an owned address and supported shipping method.
-   Checkout revalidates products, prices, coupon, tax/fees and stock.
-   Order and order items are persisted transactionally.
-   Inventory reservation prevents overselling and expires safely.
-   Order items preserve product name, SKU, variant, unit price,
    discounts and tax snapshots.
-   Customer can view only their own orders.
-   Order status history is persisted.
-   Cancellation and return requests follow explicit policy.
-   No order is considered paid in this phase; payment integration
    follows in Phase 6.
-   All checkout commands are idempotent and concurrency-tested.

## 2. Scope boundaries

Included: checkout quote, address selection,
shipping-method/serviceability abstraction, order creation, order
snapshots, reservations, order history, order state machine,
cancellation eligibility, return-request foundation and admin order
list/detail.

Not included: live payment provider, actual shipping integration,
shipment tracking, refund settlement, tax/legal certification or
marketplace split orders.

## 3. Domain decisions before implementation

Record: 1. Order number format and uniqueness. 2. Idempotency key scope,
storage, expiry and replay response. 3. Reservation duration and expiry
behavior. 4. When coupon use is reserved vs consumed. 5. Shipping method
and serviceability interface for mock phase. 6. Order statuses and
allowed transitions. 7. Whether guest checkout is supported; if not
explicitly required, begin authenticated-only. 8. Cancellation cutoff
and whether cancellation after payment requires refund. 9. Return
eligibility window and item condition policy; keep initial policy
simple. 10. Address snapshot structure and retention. 11. Tax
configuration and explicit non-compliance disclaimer pending review.

## 4. Implementation sequence

### Task 0 --- Readiness

1.  Run prior phase local and deployed smoke suites.
2.  Verify cart quote is server-authoritative.
3.  Verify inventory on-hand and movement ledger invariants.
4.  Confirm customer address ownership.
5.  Map FR-07/FR-09 to tables, commands, APIs, tests and UI.
6.  Record state diagrams and reservation policy.

### Task 1 --- Checkout and order module contracts

Create `checkout` and `orders` modules. Define: -
`CreateCheckoutQuote` - `ValidateCheckout` - `PlaceOrder` -
`GetCustomerOrder` - `CancelOrder` - `RequestReturn` -
`TransitionOrderStatus` - `ExpireInventoryReservation`

Keep checkout orchestration separate from order aggregate rules and
inventory repository ownership.

### Task 2 --- Database model and migrations

Create/adapt: - `orders` - `order_items` - `order_status_history` -
`checkout_idempotency` or a reusable idempotency table -
`inventory_reservations` - `inventory_reservation_items` -
`coupon_redemptions` order linkage/status - `outbox_events` if not
already introduced - optional `return_requests` / `return_items` if
return request is in scope now.

Required invariants: 1. Unique order number. 2. Unique idempotency key
per customer/operation scope. 3. Reservation quantity positive. 4.
Reservation expiry and state indexed. 5. Unique reference preventing
duplicate reservation for the same checkout/order where applicable. 6.
Order totals and snapshots stored in integer minor units/decimal-safe
representation. 7. Foreign keys and delete behavior preserve order
history. 8. Constraints prevent negative available stock. 9. Index
customer order history by user and creation time; index admin
status/date queries. 10. Migration reviewed and tested against previous
deployed schema.

### Task 3 --- Checkout quote

1.  Accept cart reference, selected address ID and shipping method
    ID---not totals.
2.  Verify address ownership.
3.  Re-fetch current product/variant state and price.
4.  Recalculate discounts and coupon eligibility.
5.  Revalidate stock availability.
6.  Resolve shipping cost through a deterministic mock
    serviceability/quote adapter.
7.  Apply configured tax rules only as documented.
8.  Return a quote with line-level and aggregate breakdown, expiry and
    quote version/hash if useful.
9.  Do not reserve stock during quote retrieval.
10. Test price/stock changes between quote and order placement.

### Task 4 --- Inventory reservation model

1.  Define available quantity = on-hand minus active reservations.
2.  Implement reservation creation in a PostgreSQL transaction.
3.  Use conditional updates/row locks to ensure concurrent checkouts
    cannot reserve more than available.
4.  Reserve every required variant line atomically; if any line fails,
    roll back all reservations.
5.  Record reservation state, expiry, quantity and order/checkout
    reference.
6.  Ensure duplicate idempotency request returns the original
    reservation/order result.
7.  Implement release on failed checkout, expiry and eligible
    cancellation.
8.  Implement commit/deduct on verified payment in Phase 6; define the
    contract but do not mark paid here.
9.  Record inventory movements for committed stock changes, not for
    merely viewing a quote.
10. Test two customers buying the final unit simultaneously.

### Task 5 --- Order placement transaction

1.  Require authentication and a valid idempotency key.
2.  Start a transaction.
3.  Resolve idempotency record; if completed, return the prior result.
4.  Revalidate cart, variants, prices, coupon, address, shipping quote
    and stock.
5.  Create order header.
6.  Create immutable order-item snapshots.
7.  Create inventory reservations.
8.  Record coupon reservation/redemption state consistently.
9.  Create initial order status history.
10. Write outbox event for `OrderPlaced` within the same transaction.
11. Store idempotent response/result.
12. Commit; only then trigger external/background effects.
13. Return pending-payment state, not paid state.

### Task 6 --- Order state machine

1.  Define initial states such as `PENDING_PAYMENT`, `CONFIRMED`,
    `PROCESSING`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`,
    `RETURN_REQUESTED`, `RETURNED`, `REFUND_PENDING`, `REFUNDED`, as
    appropriate to the agreed flow.
2.  Separate payment state from order state and fulfilment/shipment
    state.
3.  Define allowed transitions and actor permissions.
4.  Reject direct arbitrary status patching.
5.  Persist every transition with actor, reason, previous/next state and
    timestamp.
6.  Make transition command transactional and idempotent where retried.
7.  Keep shipping-specific tracking states in Phase 7 rather than
    overloading order status.

### Task 7 --- Order read APIs and customer experience

Customer APIs: - `POST /api/v1/checkout/quote` - `POST /api/v1/orders`
(idempotency key required) - `GET /api/v1/orders` -
`GET /api/v1/orders/{orderId}` -
`POST /api/v1/orders/{orderId}/cancel` -
`POST /api/v1/orders/{orderId}/returns` when return requests are
enabled.

Admin APIs: - `GET /api/v1/admin/orders` -
`GET /api/v1/admin/orders/{orderId}` - Explicit order
transition/processing commands.

Enforce customer ownership on every private order route. Use bounded
pagination and safe filters.

### Task 8 --- Angular checkout and order UI

1.  Build checkout review page.
2.  Add address selection/create flow using Phase 2 address APIs.
3.  Show line items, current price, discounts, tax/shipping estimates
    and final server quote.
4.  Require explicit confirmation to place order.
5.  Send idempotency key and handle retry without duplicate order.
6.  Show pending-payment/order status accurately.
7.  Build order confirmation and order history/detail pages.
8.  Build cancellation/return request UI according to policy.
9.  Add admin order queue/detail views with explicit action buttons and
    permission UX.
10. Handle cold starts and duplicate-submit states accessibly.

### Task 9 --- Background reservation expiry

1.  Persist expiry jobs/outbox events in PostgreSQL.
2.  Worker claims due work safely; use `FOR UPDATE SKIP LOCKED` where
    appropriate.
3.  Re-check reservation state before release.
4.  Release inventory and coupon reservation transactionally.
5.  Make retry idempotent.
6.  Keep worker bounded and recoverable after restart.
7.  Provide a manual processing command for demo environments where free
    hosting sleeps.
8.  Do not promise exact expiry timing while the host/worker is asleep.

### Task 10 --- Testing

-   Price changes between quote and order.
-   Stock changes between quote and order.
-   Concurrent last-unit checkout.
-   Duplicate idempotency key, including concurrent submission.
-   Multi-line reservation rollback.
-   Reservation expiry and duplicate worker execution.
-   Coupon final-use concurrency.
-   Cross-user order access/IDOR.
-   Cancellation before/after payment boundary.
-   Invalid order transition.
-   Database unavailable/Redis unavailable behavior.
-   Browser E2E checkout and order history.

### Task 11 --- Deploy and sign off

1.  Test migrations against a copy of deployed schema.
2.  Deploy API, run smoke tests, then frontend.
3.  Use synthetic orders only.
4.  Verify reservation and idempotency behavior in deployed database.
5.  Verify admin and customer authorization.
6.  Verify previous catalog/cart/auth flows.
7.  Record release evidence and rollback/forward-fix plan.

## 5. Learning outcomes

-   Transaction boundaries and isolation.
-   Conditional updates and row locks.
-   Idempotency and replay-safe commands.
-   Immutable order snapshots.
-   State machines and state history.
-   Reservation vs deduction.
-   Outbox pattern and asynchronous side effects.
-   Concurrency testing for last-item inventory.

## 6. Exit checklist

-   [ ] Checkout quote is server-calculated.
-   [ ] Order and items are transactionally persisted.
-   [ ] Order snapshots are immutable.
-   [ ] Reservation prevents overselling.
-   [ ] Reservation expiry/release is retry-safe.
-   [ ] Idempotency prevents duplicate orders.
-   [ ] Customer order ownership is enforced.
-   [ ] Order history and valid transitions work.
-   [ ] Tests pass, including last-unit concurrency.
-   [ ] Deployment smoke tests and previous journeys pass.

**Exit gate:** Do not integrate payment until order creation,
reservation and pending-payment state are correct and idempotent.
