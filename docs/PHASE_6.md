# Phase 6 --- Payment Sandbox, Webhooks and Refund Foundations

**Prerequisites:** Phases 1--5 are complete and deployed.\
**Requirements covered:** FR-10, integrating FR-09, FR-07 and FR-13.\
**Goal:** Implement a provider-independent payment workflow using
sandbox/test credentials only, with verified callbacks, idempotent
webhook processing and safe reconciliation.

## 1. Outcomes

-   Payment provider is hidden behind an adapter interface.
-   Backend creates payment intent/order; browser never supplies trusted
    payment status.
-   Provider callback/signature is verified server-side.
-   Webhook raw-body verification is implemented where required by the
    selected provider.
-   Webhook event IDs are deduplicated.
-   Payment attempts and provider references are persisted.
-   Duplicate, delayed and out-of-order events are handled safely.
-   Payment state and order state remain separate.
-   Verified success commits inventory reservation; verified
    failure/expiry releases it according to policy.
-   Refund requests and provider refund results are tracked.
-   No card numbers, CVV or raw card credentials are stored.
-   Reconciliation/manual review exists for uncertain provider outcomes.

## 2. Scope boundaries

Included: sandbox adapter, payment intent creation, payment attempts,
webhook inbox, signature verification, payment state machine,
reservation commit/release integration, refunds in sandbox,
reconciliation screen/command and tests.

Excluded: live production card processing, storing card data, real money
settlement, PCI compliance claims, split payments, subscriptions and
multi-vendor settlement.

## 3. Provider selection gate

Before choosing a sandbox: 1. Review provider documentation and current
account requirements. 2. Confirm test mode is available without paid
commitment. 3. Confirm webhook signature verification requirements and
raw-body behavior. 4. Confirm refund sandbox support and event types. 5.
Record provider-specific limits and test-card/test-account behavior. 6.
Keep provider credentials in server environment only. 7. If no provider
meets the \$0 policy, implement a deterministic local fake payment
adapter first. Do not block the engineering learning on provider signup.

## 4. Implementation sequence

### Task 0 --- Readiness

1.  Run checkout/order and reservation suites.
2.  Verify order remains `PENDING_PAYMENT` after placement.
3.  Verify reservation expiry and release.
4.  Map FR-10 to payment tables, endpoints, webhook cases and tests.
5.  Record payment/order/reservation state diagrams.

### Task 1 --- Payment module and adapter contract

Define: - `PaymentProvider.createPayment` -
`PaymentProvider.verifyWebhook` - `PaymentProvider.fetchPayment` -
`PaymentProvider.createRefund` - `PaymentProvider.fetchRefund` where
provider supports it.

Define normalized provider-neutral result types. Keep provider SDK types
inside infrastructure adapter.

### Task 2 --- Database model

Create/adapt: - `payments` - `payment_attempts` -
`payment_webhook_events` (inbox/deduplication) - `refunds` -
`payment_reconciliation_cases` - provider reference and idempotency
fields.

Constraints: 1. Unique provider event ID scoped to provider/account. 2.
Unique provider payment reference where appropriate. 3. Unique
idempotency key for create/refund commands. 4. Amount and currency
stored exactly. 5. State/timestamp indexes for pending/reconciliation
queries. 6. Foreign keys preserve order/payment history. 7. Raw payload
retention is minimized; store verified, sanitized event data or a
bounded encrypted/raw payload only if strictly required and documented.

### Task 3 --- Payment state machine

Define states such as `CREATED`, `REQUIRES_ACTION`, `PENDING`,
`SUCCEEDED`, `FAILED`, `CANCELLED`, `EXPIRED`, `REFUND_PENDING`,
`PARTIALLY_REFUNDED`, `REFUNDED`, `RECONCILIATION_REQUIRED`.

Rules: 1. Only verified provider evidence can transition a payment to
success. 2. Browser redirect is informational, not authoritative. 3.
Duplicate success event has no repeated side effects. 4. A late failure
must not overwrite a confirmed success. 5. Out-of-order events are
evaluated against current state and provider evidence. 6.
Amount/currency/order reference must match the expected payment. 7.
Uncertain outcomes enter reconciliation, not guessed success/failure.

### Task 4 --- Create payment

1.  Customer requests payment for an eligible pending-payment order.
2.  API loads order from database and verifies ownership.
3.  API calculates exact payable amount from order snapshot.
4.  API creates a local payment attempt/idempotency record.
5.  Provider adapter creates sandbox payment.
6.  Persist provider reference and normalized state.
7.  Return only client-safe provider action details.
8.  Never accept amount from browser as authoritative.
9.  Handle provider timeout where request may have succeeded; use
    idempotency/reconciliation before retry.

### Task 5 --- Webhook endpoint and verification

1.  Add provider-specific webhook route before JSON parsing if raw body
    is required.
2.  Preserve exact raw bytes for signature validation.
3.  Verify signature, timestamp/replay window and expected provider
    identity.
4.  Reject invalid signatures without changing business state.
5.  Persist event ID in webhook inbox with unique constraint.
6.  Acknowledge duplicate already-processed events safely.
7.  Validate payment reference, amount, currency and order mapping.
8.  Process state transition and business effects transactionally.
9.  Record processing outcome and safe metadata.
10. Never log signing secrets, full authorization headers or sensitive
    payload fields.

### Task 6 --- Commit/release inventory and order transition

On verified success, in one coherent transaction: 1. Lock/read the
payment, order and reservation state. 2. Confirm payment is eligible and
amount/currency match. 3. Mark payment succeeded. 4. Commit/deduct the
reservation using inventory service contract. 5. Insert inventory
movement records. 6. Transition order to confirmed/paid state according
to the agreed order state model. 7. Write outbox event. 8. Commit once;
retry must not repeat effects.

On verified failure/expiry: 1. Confirm no success has already been
accepted. 2. Mark payment failed/expired. 3. Release active reservation
according to policy. 4. Release coupon reservation where applicable. 5.
Transition order to payment-failed/cancelled state as defined. 6. Write
outbox event.

### Task 7 --- Refund workflow

1.  Define which roles may request/approve refunds.
2.  Validate refundable amount against captured amount minus prior
    refunds.
3.  Create refund request with idempotency key.
4.  Call provider outside the database transaction through a persisted
    intent/outbox workflow.
5.  Process provider refund event/result.
6.  Update refund and payment state idempotently.
7.  Decide inventory restock separately; returned goods must not
    automatically become sellable until inspection policy allows it.
8.  Audit all refund approvals and state changes.

### Task 8 --- Reconciliation

1.  Find payments stuck pending beyond configured age.
2.  Query provider by reference where supported.
3.  Compare provider amount/currency/status with local state.
4.  Resolve automatically only when evidence is authoritative.
5.  Send mismatches to a manual-review queue.
6.  Add admin view/command with restricted permissions.
7.  Record reconciliation decisions and actor.

### Task 9 --- Angular payment UX and admin tools

1.  Build payment initiation and return/status page.
2.  Display pending state until backend verification completes.
3.  Poll a bounded status endpoint or use a documented refresh strategy.
4.  Never show success based only on redirect query parameters.
5.  Build admin payment/refund/reconciliation views.
6.  Keep provider secrets and privileged operations out of frontend.

### Task 10 --- Testing and security

-   Valid/invalid webhook signature.
-   Raw-body mismatch.
-   Duplicate event.
-   Out-of-order success/failure.
-   Delayed webhook.
-   Provider timeout after possible success.
-   Amount/currency mismatch.
-   Duplicate payment create.
-   Duplicate refund.
-   Refund over captured amount.
-   Reservation commit exactly once.
-   Payment success after reservation expiry.
-   Database unavailable during webhook processing.
-   Browser redirect without webhook.
-   Customer cannot access another order/payment.
-   Secret and card-data scan.

### Task 11 --- Deploy and sign off

1.  Use sandbox credentials only.
2.  Configure webhook URL and provider test mode.
3.  Deploy API route and verify provider can reach it.
4.  Trigger sandbox success/failure and replay duplicate webhook if test
    tooling allows.
5.  Confirm order/payment/reservation state in database.
6.  Verify no card data or secrets are logged.
7.  Verify previous checkout and catalog journeys.
8.  Record provider configuration and limitations without publishing
    secrets.

## 5. Learning outcomes

-   Provider adapter design.
-   Webhook signature and raw-body verification.
-   At-least-once delivery and deduplication.
-   Payment/order state separation.
-   Idempotency under timeouts.
-   Transactional outbox/inbox.
-   Reconciliation and uncertain outcomes.
-   Refund accounting and inventory separation.

## 6. Exit checklist

-   [ ] Provider adapter and local fake adapter work.
-   [ ] Sandbox payment can be initiated.
-   [ ] Webhook signature is verified.
-   [ ] Duplicate and out-of-order events are safe.
-   [ ] Browser redirect cannot mark an order paid.
-   [ ] Payment amount/currency/order match is enforced.
-   [ ] Inventory commits/releases exactly once.
-   [ ] Refund workflow is idempotent.
-   [ ] Reconciliation cases can be reviewed.
-   [ ] No card data or secrets are stored/logged.
-   [ ] Deployed sandbox smoke tests and regression tests pass.

**Exit gate:** Do not start fulfilment automation until verified
payment-to-order transition is reliable and reservation commitment is
correct.
