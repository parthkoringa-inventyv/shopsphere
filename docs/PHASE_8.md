# Phase 8 --- Reviews, Notifications and Customer Experience Completion

**Prerequisites:** Phases 1--7 are complete and deployed.\
**Requirements covered:** FR-12 and FR-13, completing customer-facing
order/shipping communication.\
**Goal:** Add verified-purchase reviews, moderation, persistent in-app
notifications and reliable asynchronous notification delivery using
free/development-safe adapters.

## 1. Outcomes

-   Eligible customers can review purchased products under a clear
    policy.
-   Verified-purchase status is derived from server-side order data.
-   One-review-per-eligible-order-item policy is enforced.
-   Reviews support rating 1--5 and text; optional images remain
    deferred until persistent storage is verified.
-   Reviews can be edited/deleted under a defined policy.
-   Admin can moderate and report reviews.
-   Aggregate rating is correct and does not include hidden/rejected
    reviews.
-   In-app notification inbox is durable.
-   Email notifications use an adapter; local development can use mail
    capture.
-   Important domain events are written to a transactional outbox.
-   Jobs are retryable, bounded, observable and idempotent.

## 2. Scope boundaries

Included: review lifecycle, moderation, reporting, aggregate ratings,
notification preferences if required, in-app inbox, email adapter,
outbox dispatcher, retries and dead-letter handling.

Not included: paid email/SMS guarantee, social sharing, recommendation
engine, live chat, marketing automation or unverified customer reviews.

## 3. Decisions to record

1.  Review eligibility: delivered order item is recommended.
2.  One review per order item vs one per product/customer.
3.  Edit/delete window and moderation policy.
4.  Whether reviews publish immediately or require moderation.
5.  Rating aggregate formula and cache invalidation.
6.  Notification event catalogue and user preferences.
7.  Email adapter for local vs deployed mode.
8.  Retry schedule, max attempts and failed-job handling.
9.  Data retention and privacy policy.
10. Image review support only if persistent free storage is verified.

## 4. Implementation sequence

### Task 0 --- Readiness

1.  Run order/payment/shipping E2E tests.
2.  Verify delivered state and order-item snapshots are reliable.
3.  Confirm outbox/job infrastructure and request correlation.
4.  Map FR-12/FR-13 to schema, APIs, UI and test cases.

### Task 1 --- Reviews module

1.  Define review aggregate and state machine: pending/moderation,
    published, rejected, hidden/deleted as needed.
2.  Define eligibility service using authenticated user, delivered order
    and order item.
3.  Never accept `verifiedPurchase=true` from the browser.
4.  Decide one-review uniqueness key and enforce it in PostgreSQL.
5.  Validate rating 1--5, text length and allowed content.
6.  Add edit/delete policy and audit metadata.
7.  Add indexes for product/status/date and customer history.
8.  Add migration and deterministic test data.

### Task 2 --- Review APIs

Customer: - `POST /api/v1/products/{productId}/reviews` -
`GET /api/v1/users/me/reviews` - `PATCH /api/v1/reviews/{reviewId}` -
`DELETE /api/v1/reviews/{reviewId}`

Public: - `GET /api/v1/products/{productId}/reviews`

Admin: - list pending/reported reviews - approve/reject/hide with
reason - view moderation history.

Every endpoint must enforce ownership, eligibility, permission,
pagination and safe DTO rules.

### Task 3 --- Review moderation and aggregate

1.  Implement report-review command with abuse controls.
2.  Implement moderator decisions and reasons.
3.  Exclude non-published reviews from public results and aggregate.
4.  Compute rating count and average with a measured SQL aggregate.
5.  Add index/cache strategy only after correctness is established.
6.  Test moderation race conditions and aggregate recalculation after
    edit/delete.

### Task 4 --- Notification event catalogue

Define event types from completed workflows: - email
verification/password reset (Phase 2) - order placed/confirmed/payment
failed/payment succeeded - cancellation/refund result - shipment
created/out for delivery/delivered/delivery failed - return status -
review moderation result where appropriate.

For each event define recipient, channel, template, data classification,
retry behavior and whether it is mandatory or optional.

### Task 5 --- Durable notification data

Create/adapt: - `notifications` (user, type, title/body/template key,
safe payload, read timestamp, created timestamp) -
`notification_preferences` if needed - `outbox_events` -
`notification_deliveries` or job attempts - failed/dead-letter metadata.

Use stable event IDs and deduplication keys. Do not store unnecessary
sensitive data in notification payloads.

### Task 6 --- Transactional outbox and worker

1.  Domain transaction writes business change and outbox event together.
2.  Dispatcher claims pending outbox rows safely.
3.  Convert event to in-app notification and optional email delivery.
4.  Record delivery attempt and result.
5.  Retry transient errors with bounded exponential backoff.
6.  Mark permanent failure/dead-letter after configured attempts.
7.  Make duplicate processing harmless.
8.  Add replay/retry operation restricted to staff.
9.  Keep worker as separate entry point but allow same-process
    deployment under free-tier limits.
10. Provide manual processing command for demo if free host sleeps.

### Task 7 --- Email adapter

1.  Define provider-neutral `EmailSender` interface.
2.  Implement local mail-capture adapter.
3.  Implement a deployed adapter only after verifying a genuinely free
    plan, card/overage rules and sender-domain requirements.
4.  Do not promise transactional email delivery if no free provider is
    acceptable.
5.  Keep templates versioned and escaped.
6.  Never place passwords, raw reset tokens or session credentials in
    email logs.
7.  Ensure verification/reset URLs are single-use and short-lived.
8.  Test template rendering and adapter failures.

### Task 8 --- Angular customer experience

1.  Add review form on eligible delivered order item/product.
2.  Show verified-purchase badge only when API returns authoritative
    eligibility.
3.  Build review list, pagination and rating summary.
4.  Add edit/delete/report interactions according to policy.
5.  Build notification inbox, unread count and mark-read behavior.
6.  Add notification preference controls only if backend support is
    included.
7.  Add useful empty/error/retry states and accessible announcements.

### Task 9 --- Admin moderation

1.  Build moderation queue.
2.  Show product, review, author-safe display and verified purchase
    state.
3.  Add approve/reject/hide with required reason.
4.  Add report queue and moderation history.
5.  Restrict every action by permission.
6.  Audit moderation decisions.

### Task 10 --- Tests and security

-   Review without eligible delivered order.
-   Spoofed verified-purchase field.
-   Duplicate review for same eligible item.
-   Cross-user edit/delete.
-   Rating/text boundary validation.
-   Rejected review not public or included in aggregate.
-   Concurrent moderation/edit.
-   Duplicate outbox event.
-   Worker crash and retry.
-   Email provider timeout/permanent failure.
-   Template escaping/XSS.
-   Notification ownership and pagination.
-   User cannot read another user's inbox.

### Task 11 --- Deploy and sign off

1.  Deploy review and notification schema/API behind controlled
    availability.
2.  Test in-app notification without external email dependency.
3.  Test mail-capture locally and deployed adapter only if approved.
4.  Verify worker restart and retry.
5.  Run previous checkout/payment/shipping smoke tests.
6.  Record actual notification delivery limitations.

## 5. Learning outcomes

-   Verified-purchase authorization.
-   Moderation lifecycle.
-   SQL aggregation.
-   Transactional outbox.
-   At-least-once background delivery.
-   Retry/backoff/dead-letter policies.
-   Email abstraction and template security.
-   Durable inbox vs ephemeral push.

## 6. Exit checklist

-   [ ] Review eligibility is server-derived.
-   [ ] Duplicate reviews are prevented by DB constraints.
-   [ ] Moderation controls public visibility and aggregates.
-   [ ] Notification inbox is durable and user-scoped.
-   [ ] Outbox and worker processing are idempotent.
-   [ ] Retries and dead-letter behavior are documented.
-   [ ] Email adapter works locally without paid service.
-   [ ] No claim of email delivery without a verified provider.
-   [ ] Accessibility/security/E2E tests pass.
-   [ ] Deployment and regression smoke tests pass.

**Exit gate:** Do not start the final operations console until review
and notification workflows are observable and recoverable.
