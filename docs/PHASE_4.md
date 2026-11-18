# Phase 4 --- Cart, Wishlist, Pricing and Coupons

**Prerequisites:** Phases 1--3 are complete, deployed and passing their
exit gates.\
**Requirements covered:** FR-06 and FR-08, with dependencies on FR-05,
FR-07 and FR-04.\
**Goal:** Let guests and customers assemble a basket and wishlist while
keeping all price and discount calculations authoritative on the server.

## 1. Outcomes

-   Guest and authenticated carts work.
-   Cart lines reference product variants, not ambiguous parent
    products.
-   Guest cart merge behavior is deterministic.
-   Wishlist add/list/remove works for authenticated customers.
-   Pricing is centralized and uses integer minor units (INR paise).
-   Coupons support fixed/percentage discounts, validity, eligibility
    and redemption limits.
-   Coupon stacking rules are explicit.
-   Cart totals are previews; checkout will recalculate them later.
-   Concurrent coupon redemption cannot exceed limits.
-   Customer storefront and admin coupon screens work.
-   Every release is deployed through the common deployment runbook.

## 2. Scope boundaries

Included: carts, cart items, guest-cart identity, merge, wishlist, price
calculation, coupon rules, redemption tracking, admin coupon management,
cart API/UI and tests.

Not included: checkout, payment, inventory reservation, order creation,
tax/legal compliance claims, shipping charge commitment or multi-vendor
pricing.

## 3. Decisions to record before coding

1.  Guest cart identity: signed opaque guest-cart token or another
    documented mechanism; do not trust a client-supplied cart ID alone.
2.  Guest cart persistence: database-backed is recommended for
    cross-device? No---guest identity remains browser-scoped; document
    expiry and cleanup.
3.  Cart merge: define duplicate variant handling, quantity cap,
    unavailable variant behavior and whether authenticated cart wins.
4.  Cart quantity maximum and whether quantity is constrained by current
    availability.
5.  Price source: variant override if present, otherwise product base
    price; define exact inheritance.
6.  Coupon stacking: recommended first release is one coupon per cart
    unless a more complex policy is explicitly justified.
7.  Discount allocation across eligible lines and rounding behavior.
8.  Currency: single-store INR initially; store integer paise and
    currency code.
9.  Tax: configurable calculation placeholder only; no claim of
    legal/tax compliance without review.
10. Coupon redemption timing: reserve/consume at order commit in Phase
    5, not merely when displayed in cart.

Record decisions in `DECISIONS.md`.

## 4. Implementation sequence

### Task 0 --- Readiness and requirement mapping

1.  Run all prior phase tests and deployed smoke tests.
2.  Verify product/variant APIs expose stable IDs, active state, price
    and availability.
3.  Verify authentication principal and ownership policy.
4.  Map FR-06 and FR-08 to tables, services, endpoints, UI and tests.
5.  Agree guest cart expiry, merge rules, max quantity and coupon
    policy.

**Acceptance:** prior deployed journeys remain green and all new
decisions are recorded.

### Task 1 --- Module boundaries

Create `cart`, `wishlist`, `pricing` and `coupons` modules. Define
service contracts: - Cart: create/get/add/update/remove/clear/merge. -
Wishlist: add/list/remove. - Pricing: quote lines, subtotal, discount,
tax estimate and total. - Coupons: validate eligibility and calculate
discount; reserve/consume only during Phase 5 order commit.

Do not let controllers calculate money or write other modules' tables.

### Task 2 --- Database design and migrations

Implement only tables required by the decisions: - `carts` (owner user
nullable for guest; guest token hash/reference; expiry; timestamps). -
`cart_items` (cart, variant, quantity, created/updated). - `wishlists`
or a user-to-variant/product relation with unique constraints. -
`coupons` (code normalized, type, value, currency/constraints, validity,
limits, status). - `coupon_products` / `coupon_categories` eligibility
relations if required. - `coupon_redemptions` with customer, coupon,
order reference (nullable until Phase 5), status and timestamps. -
Optional pricing rule/config tables only if the first release needs
admin-configurable tax/fees.

Steps: 1. Add unique constraints for coupon code and cart+variant line.
2. Add unique wishlist ownership+target constraint. 3. Add checks for
positive quantity, valid discount values, date ranges and non-negative
limits. 4. Add indexes for cart owner/expiry, item cart, coupon
code/status/validity and redemption customer/coupon. 5. Define deletion
policy for products/variants referenced by carts/wishlists; do not
cascade-delete historical orders (not built yet). 6. Write and inspect
Prisma migration SQL. 7. Seed deterministic demo coupons; make seed
idempotent. 8. Test clean migration and upgrade migration.

**Acceptance:** database constraints prevent duplicate cart lines,
duplicate wishlist entries and invalid coupon values.

### Task 3 --- Cart domain rules

1.  Define cart lifecycle: active, merged, expired/cleared as needed.
2.  Define add-to-cart behavior for an existing variant line.
3.  Validate variant is active and product is publicly purchasable.
4.  Validate quantity is a positive integer and within configured
    maximum.
5.  Decide how to display insufficient stock: reject quantity above
    current available stock or allow a cart preview with an unavailable
    warning. Never reserve stock here.
6.  Define how deleted/archived/unavailable variants are represented in
    an existing cart.
7.  Ensure cart total is recalculated from current server-side
    product/variant price.
8.  Add pure unit tests for all rules.

### Task 4 --- Guest cart identity and persistence

1.  Issue an opaque high-entropy guest cart credential.
2.  Persist only a safe hash/reference where feasible; do not accept
    arbitrary cart IDs as authorization.
3.  Set cookie attributes appropriate to the frontend/API topology; if
    cookie-based, design CSRF protection for mutations.
4.  Implement create/get cart for guest.
5.  Add expiry and cleanup strategy.
6.  Rate-limit abuse-prone mutations.
7.  Test tampered token, expired cart, cross-guest access and replay.

### Task 5 --- Authenticated cart and guest merge

1.  Implement current-user cart retrieval from authenticated principal.
2.  Add/update/remove/clear cart lines with ownership enforcement.
3.  On login, merge guest cart using the documented duplicate/quantity
    rules.
4.  Execute merge transactionally so retry does not duplicate lines.
5.  Handle unavailable/archived variants and max quantity.
6.  Clear or invalidate guest cart credential after successful merge.
7.  Test repeated login/merge, simultaneous merge requests and two users
    attempting to access another cart.

### Task 6 --- Pricing service

1.  Define money value object in integer paise with currency code.
2.  Resolve variant price override vs product base price.
3.  Compute line subtotal and cart subtotal with integer arithmetic.
4.  Define rounding for percentage discounts.
5.  Calculate discounts by eligible line; do not discount excluded
    lines.
6.  Calculate configured tax/shipping preview only if requirements and
    decisions specify the formula.
7.  Return a quote breakdown with subtotal, discount, tax estimate,
    shipping estimate and payable preview.
8.  Keep quote output informational and mark it non-binding.
9.  Add property/boundary tests: zero, maximum values, rounding, invalid
    currency and overflow limits.

### Task 7 --- Coupon engine and administration

1.  Implement coupon create/edit/activate/deactivate/list/detail for
    authorized staff.
2.  Validate code normalization, type, value, start/end, minimum basket,
    max discount, total uses and per-customer uses.
3.  Implement product/category/first-order eligibility only where
    configured.
4.  Enforce one-coupon policy unless the ADR says otherwise.
5.  Validate coupon at cart quote time without consuming redemption
    capacity.
6.  At Phase 5, redemption will be consumed/reserved atomically with
    order creation; define the contract now.
7.  Protect final-use concurrency with a transaction and conditional
    update/row lock in Phase 5.
8.  Audit coupon creation and changes.
9.  Test expired, not-yet-valid, ineligible, exhausted and concurrent
    last-use cases.

### Task 8 --- API

Suggested customer routes: - `GET /api/v1/cart` -
`POST /api/v1/cart/items` - `PATCH /api/v1/cart/items/{itemId}` -
`DELETE /api/v1/cart/items/{itemId}` - `DELETE /api/v1/cart` -
`POST /api/v1/cart/merge` only if not performed automatically by the
auth flow - `GET /api/v1/wishlist` - `POST /api/v1/wishlist/items` -
`DELETE /api/v1/wishlist/items/{itemId}` - `POST /api/v1/cart/coupon`
and `DELETE /api/v1/cart/coupon` if cart stores selected coupon state -
`GET /api/v1/cart/quote`

Admin routes: - `GET/POST /api/v1/admin/coupons` -
`GET/PATCH /api/v1/admin/coupons/{couponId}` - explicit
activate/deactivate commands.

For every endpoint define DTO, validation, permission, ownership, rate
limit, status code and idempotency behavior. Never accept client totals
as authoritative.

### Task 9 --- Angular customer and admin UI

1.  Add typed cart/wishlist/pricing API clients.
2.  Build cart page with variant, quantity, current price, line subtotal
    and availability warning.
3.  Build add-to-cart interaction from product detail.
4.  Build guest cart persistence and login merge UX.
5.  Build wishlist list/add/remove for authenticated users.
6.  Build coupon entry and validation feedback.
7.  Display quote breakdown and explain it is recalculated at checkout.
8.  Build admin coupon list/form with date and limit validation.
9.  Handle cold starts, loading, empty, error and retry states.
10. Use Angular 21 standalone components, signals/computed, OnPush,
    strict types and accessible forms.

### Task 10 --- Tests and security

-   Cart ownership/IDOR.
-   Guest token tampering/expiry.
-   Guest-to-user merge idempotency.
-   Quantity boundaries and unavailable variant.
-   Price tampering from browser.
-   Coupon eligibility, expiry and usage limits.
-   Concurrent final coupon redemption.
-   Decimal/float regression: money arithmetic must remain
    integer/decimal-safe.
-   Customer cannot manage coupons.
-   SQL injection and pagination/filter bounds.
-   Browser E2E: guest cart, login merge, wishlist, coupon quote.

### Task 11 --- Deploy and sign off

1.  Apply migration in staging/disposable database.
2.  Deploy API then frontend.
3.  Smoke-test guest and authenticated cart journeys.
4.  Verify no client-supplied amount affects server quote.
5.  Verify previous auth and catalog journeys.
6.  Record migration, release SHA, quota use and rollback.
7.  Update API, database, security, testing, decisions and root README.

## 5. Learning outcomes

-   Guest identity and cookie security.
-   Idempotent merge.
-   Money arithmetic and rounding.
-   Server-authoritative pricing.
-   Coupon eligibility and concurrency.
-   Unique constraints and transaction design.
-   Cart state vs inventory reservation.
-   Cache correctness vs business truth.

## 6. Exit checklist

-   [ ] Guest and customer carts work.
-   [ ] Cart merge is deterministic and idempotent.
-   [ ] Wishlist ownership and duplicate prevention work.
-   [ ] Prices use integer minor units/decimal-safe representation.
-   [ ] Browser totals are never trusted.
-   [ ] Coupon eligibility and limits are validated.
-   [ ] Coupon redemption is not incorrectly consumed by a cart preview.
-   [ ] Unit/API/E2E tests pass.
-   [ ] Deployed smoke tests pass and prior journeys remain green.
-   [ ] Documentation and ADRs are current.

**Exit gate:** Do not begin checkout until cart identity, server pricing
and coupon eligibility contracts are stable.
