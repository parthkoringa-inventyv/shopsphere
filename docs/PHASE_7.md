# Phase 7 --- Order Fulfilment and Mock Shipping / Delivery

**Prerequisites:** Phases 1--6 are complete and deployed.\
**Requirements covered:** FR-11 and relevant parts of
FR-09/FR-13/FR-14.\
**Goal:** Fulfil paid orders and provide a fully simulated
shipping/tracking journey without paid courier APIs, SMS, maps or real
GPS.

## 1. Outcomes

-   Authorized staff can pick, pack and create shipments.
-   Order status and shipment status are separate state machines.
-   Shipment has unique tracking number.
-   Virtual warehouses/hubs, routes and dummy delivery agents support
    simulation.
-   Tracking events are persisted and customer-visible.
-   Delivery simulation is driven by durable jobs, not chained
    `setTimeout()` calls.
-   Failed delivery, delay, return-to-origin and retry cases can be
    demonstrated.
-   Proof of delivery uses a mock in-app OTP, not paid SMS.
-   The system resumes safely after API/worker restart.
-   Manual simulation advancement works when free hosting sleeps.

## 2. Scope boundaries

Included: fulfilment workflow, shipment records, virtual hubs/routes,
mock agents, tracking timeline, simulated events, delivery attempts,
proof-of-delivery OTP, returns-to-origin foundation and admin controls.

Excluded: real courier APIs, real GPS, maps routing, live driver app,
paid SMS/WhatsApp, actual carrier labels and multi-warehouse
optimization.

## 3. Domain boundaries and state machines

Keep three concepts distinct: - **Order:** commercial purchase/payment
lifecycle. - **Fulfilment:** pick/pack/dispatch readiness. -
**Shipment:** physical-delivery simulation lifecycle.

Suggested shipment states:
`CREATED -> READY_FOR_PICKUP -> PICKED_UP -> IN_TRANSIT -> AT_DESTINATION_HUB -> OUT_FOR_DELIVERY -> DELIVERED`.

Exception states may include `PICKUP_FAILED`, `DELIVERY_FAILED`,
`DELAYED`, `RETURN_TO_ORIGIN`, `RETURNED`, `CANCELLED`. Define allowed
transitions and retry rules.

Do not set an order to delivered merely because a shipment event was
requested by the browser. Every customer-visible state must be backed by
a persisted server event.

## 4. Implementation sequence

### Task 0 --- Readiness and policy

1.  Run payment success/failure/refund and order-state tests.
2.  Confirm only eligible paid/confirmed orders can enter fulfilment.
3.  Decide whether a single order creates one shipment in the first
    version.
4.  Define packaging, dispatch and cancellation cutoff.
5.  Define simulation clock mode: automatic elapsed time plus manual
    advance for demos.
6.  Record status diagrams and demo scenario.

### Task 1 --- Module contracts

Create `shipping`/`fulfilment` module boundaries. Define: -
`StartFulfilment` - `MarkItemsPicked` - `PackOrder` - `CreateShipment` -
`AssignDeliveryAgent` - `AdvanceSimulation` - `RecordTrackingEvent` -
`RecordDeliveryAttempt` - `VerifyProofOfDelivery` -
`InitiateReturnToOrigin`

Do not let shipment code directly mutate order/payment internals;
coordinate through explicit application services and domain events.

### Task 2 --- Database schema

Add only required tables, likely: - `warehouses` - `logistics_hubs` -
`delivery_agents` - `shipments` - `shipment_items` - `shipment_routes` -
`shipment_tracking_events` - `delivery_assignments` -
`delivery_attempts` - `delivery_proof_tokens` or equivalent hashed OTP
state - `background_jobs` - `outbox_events` if not already present.

Design: 1. Shipment references order and immutable order-item/quantity
snapshots. 2. Tracking number has a unique constraint and is generated
server-side. 3. Events are append-only and ordered by
timestamp/sequence. 4. Agent and hub IDs are foreign-keyed. 5. Job has
type, payload reference, due time, state, attempts, lock/lease metadata
and idempotency key. 6. Index due jobs by state/run time and tracking
events by shipment/sequence. 7. Store OTP hash, expiry, consumed time
and attempt count; never store plaintext OTP. 8. Migration must preserve
existing orders/payments.

### Task 3 --- Fulfilment workflow

1.  Admin selects eligible order.
2.  Verify payment/order state.
3.  Validate ordered variants and quantities.
4.  Create fulfilment record or transition order to processing.
5.  Mark items picked and validate quantities.
6.  Mark packed only when all required items are accounted for.
7.  Record actor, timestamp and optional note for each action.
8.  Reject invalid transitions and duplicate pack commands.
9.  Decide partial fulfilment as future work unless explicitly required.

### Task 4 --- Shipment creation and tracking identity

1.  Create shipment only from packed/eligible order.
2.  Generate unique human-readable tracking number,
    e.g. `SS-<year>-<sequence/random>`.
3.  Create initial tracking event in the same transaction.
4.  Snapshot recipient/delivery address and shipment item details.
5.  Define tracking access: authenticated owner endpoint plus optional
    public tracking endpoint with unguessable tracking identifier and
    carefully limited fields.
6.  Never expose internal notes, OTP hash, private agent data or other
    customers' information.

### Task 5 --- Virtual logistics network

1.  Seed synthetic origin, sorting and destination hubs with city/postal
    metadata.
2.  Define deterministic route graph between hubs; do not require a maps
    API.
3.  Seed synthetic agents assigned to hubs.
4.  Define agent availability/workload states.
5.  Implement deterministic assignment (e.g. available agent with lowest
    active workload at destination).
6.  Record assignment history.
7.  Do not expose dummy agent phone numbers as real contact details.

### Task 6 --- Durable simulation job engine

1.  Use PostgreSQL-backed `background_jobs` initially to avoid requiring
    another paid queue service.
2.  Store scheduled next transition with due timestamp and idempotency
    key.
3.  Worker polls due jobs in bounded batches.
4.  Claim jobs safely with transaction and `FOR UPDATE SKIP LOCKED` or
    equivalent lease strategy.
5.  Validate current shipment state before applying transition.
6.  In one transaction update shipment, append tracking event, schedule
    next job and mark current job complete.
7.  Add bounded retries with backoff and dead-letter/failed state.
8.  Ensure duplicate worker execution cannot duplicate tracking events
    or deliver twice.
9.  Use a configurable worker entry point. On free hosting it may share
    the API process initially.
10. Do not use an unpersisted timer chain as the source of delivery
    progress.

### Task 7 --- Free-host simulation modes

Implement two supported modes: - **Automatic mode:** worker advances due
jobs while the process is awake. On restart it safely processes overdue
jobs according to bounded catch-up rules. - **Manual demo mode:**
authorized admin can advance the simulation by one event or a bounded
time interval. This is essential when the free host sleeps.

Do not claim a real-world delivery ETA. Display simulated estimates as
demo values. Do not use keep-alive traffic to bypass free-tier sleep.

### Task 8 --- Delivery attempts and proof of delivery

1.  Generate a random short-lived delivery OTP when shipment reaches
    out-for-delivery.
2.  Deliver/display it only through the demo account/in-app demo
    channel; do not send paid SMS.
3.  Store only OTP hash.
4.  Limit attempts, expiry and resend.
5.  Verify OTP server-side and consume once.
6.  Append proof-of-delivery event and transition shipment to delivered
    atomically.
7.  Define customer-unavailable/failed-attempt flow and retry count.
8.  After configured failures, support return-to-origin.
9.  Do not automatically restock returned items; require
    inspection/restock command.

### Task 9 --- APIs and admin/customer UI

Customer: - `GET /api/v1/orders/{orderId}/shipments` -
`GET /api/v1/shipments/{shipmentId}/tracking` -
`GET /api/v1/tracking/{trackingNumber}` only if public tracking is
enabled - `POST /api/v1/shipments/{shipmentId}/delivery/verify`

Admin: - pack/pick commands under order/fulfilment resources - create
shipment - list/detail shipments - assign agent - record approved
simulation event - advance simulation - retry failed delivery - inspect
jobs and attempts.

Angular: 1. Admin fulfilment queue and order detail. 2. Pick/pack
actions with confirmation. 3. Shipment tracking number display. 4.
Hub/agent assignment view. 5. Simulation controls restricted to
admin/demo role. 6. Customer tracking timeline and delivery status. 7.
OTP verification UI. 8. Accessible status and error messaging.

### Task 10 --- Tests

-   Unpaid order cannot be shipped.
-   Invalid pick/pack transitions rejected.
-   Duplicate shipment creation is idempotent.
-   Tracking number uniqueness.
-   Tracking event ordering.
-   Job claimed by only one worker.
-   Crash after event insert/retry does not duplicate event.
-   Worker restart processes overdue jobs safely.
-   Manual advance is permission-gated and bounded.
-   Delivery OTP expiry/reuse/attempt limit.
-   Failed delivery and retry.
-   Return-to-origin and no automatic restock.
-   Customer cannot view another customer's tracking.
-   Public tracking reveals only allowed data.

### Task 11 --- Deploy and sign off

1.  Apply migration on staging copy.
2.  Deploy API and worker configuration.
3.  Keep worker disabled until the deployment resource limits are
    understood.
4.  Enable bounded automatic mode or manual demo mode.
5.  Test one full synthetic order from paid to delivered.
6.  Test host restart/cold start and manual advancement.
7.  Verify previous payment/order journeys.
8.  Record simulated timing limitations and public demo instructions.

## 5. Learning outcomes

-   Domain state machines.
-   Append-only tracking history.
-   PostgreSQL job queues and `SKIP LOCKED`.
-   At-least-once processing and idempotency.
-   Worker leases/retries/dead-letter handling.
-   Proof-of-delivery secret handling.
-   Free-host background processing limitations.

## 6. Exit checklist

-   [ ] Only eligible orders enter fulfilment.
-   [ ] Order and shipment states remain separate.
-   [ ] Shipment/tracking records are durable.
-   [ ] Tracking timeline is event-backed.
-   [ ] Job processing is persistent and idempotent.
-   [ ] Manual simulation works when host is asleep.
-   [ ] Delivery OTP is hashed, expiring and single-use.
-   [ ] Failure/retry/RTO flows work.
-   [ ] Returns do not automatically restock.
-   [ ] Customer/admin permissions are enforced.
-   [ ] Full synthetic delivery demo and deployment smoke tests pass.

**Exit gate:** Do not begin final customer experience/review work until
a full paid-order-to-delivered simulation is repeatable and recoverable.
