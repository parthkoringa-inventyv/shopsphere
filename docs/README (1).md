# ShopSphere --- Complete Engineering Roadmap

A backend-first, single-vendor e-commerce platform built with Angular
21, Node.js, Express, TypeScript, PostgreSQL, Prisma plus deliberate raw
SQL, Redis where required, and a strict \$0 deployment target.

## Core rules

-   Modular monolith first; no premature microservices.
-   PostgreSQL is the durable source of truth.
-   Redis is ephemeral/optimization infrastructure, never the authority
    for orders, payments or stock.
-   Both session and JWT authentication are implemented and tested
    independently; one mode is selected per API deployment.
-   Single-vendor first; multi-vendor is a future extension.
-   All business totals are recalculated server-side.
-   Every phase is tested, deployed and smoke-tested before moving on.
-   Free-tier providers are provisional; verify current pricing, quotas,
    card requirements and overage policies before provisioning.

## Documentation

  -----------------------------------------------------------------------
  File                                Purpose
  ----------------------------------- -----------------------------------
  `docs/DEPLOYMENT_PREPARATION.md`    Initial deployment runbook and
                                      continuous release policy

  `docs/PHASE_1.md`                   Foundation plus first public
                                      deployment

  `docs/PHASE_2.md`                   Identity, sessions, JWT, roles and
                                      permissions

  `docs/PHASE_3.md`                   Catalog, products, variants and
                                      inventory base

  `docs/PHASE_4.md`                   Cart, wishlist, pricing and coupons

  `docs/PHASE_5.md`                   Checkout, orders and stock
                                      reservations

  `docs/PHASE_6.md`                   Payment sandbox, webhooks and
                                      refunds

  `docs/PHASE_7.md`                   Fulfilment and mock
                                      shipping/delivery

  `docs/PHASE_8.md`                   Reviews, notifications and customer
                                      experience

  `docs/PHASE_9.md`                   Admin operations, reporting and
                                      support console

  `docs/PHASE_10.md`                  Final hardening, recovery and
                                      release
  -----------------------------------------------------------------------

The original project specification remains authoritative for functional
scope: `REQUIREMENTS.md`. Supporting source documents are
`ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `SECURITY.md`, `TESTING.md`,
`FREE_DEPLOYMENT.md` and `DECISIONS.md`.

## End-to-end phase order

  -----------------------------------------------------------------------------
                  Order Phase            Main deliverable    Deployment
                                                             milestone
  --------------------- ---------------- ------------------- ------------------
                      1 Foundation       Repo, API, Angular, Deploy minimal
                                         local               public foundation
                                         PostgreSQL/Redis,   immediately
                                         CI                  

                      2 Identity and     Registration,       Deploy auth behind
                        access           session/JWT,        safe release gates
                                         permissions,        
                                         profile             

                      3 Catalog and      Products, variants, Deploy
                        inventory        search, stock       storefront/admin
                                         ledger              catalog

                      4 Cart and pricing Cart, wishlist,     Deploy basket and
                                         coupons and price   pricing
                                         quote               

                      5 Checkout and     Idempotent order    Deploy
                        orders           creation and stock  pending-payment
                                         reservation         order flow

                      6 Payments         Sandbox payment,    Deploy test-mode
                                         signed webhook,     payment flow
                                         refund              

                      7 Fulfilment and   Pick/pack,          Deploy complete
                        shipping         shipment, tracking, mock delivery
                                         simulated delivery  

                      8 Reviews and      Verified reviews,   Deploy customer
                        notifications    inbox, outbox       engagement
                                         worker              

                      9 Admin and        Operational         Deploy operational
                        reporting        console, audit and  dashboard
                                         reports             

                     10 Final release    Security, recovery, Final \$0 release
                                         performance,        and demo
                                         accessibility       
  -----------------------------------------------------------------------------

## How to work each phase

1.  Read the phase plan and source requirements.
2.  Confirm prerequisites and prior exit gates.
3.  Review domain concepts and record decisions.
4.  Design tables, constraints, APIs and state transitions before
    implementation.
5.  Implement a small vertical slice at a time.
6.  Add unit, integration, API and E2E tests.
7.  Run the full regression suite.
8.  Review migrations and backward compatibility.
9.  Deploy API then frontend through CI/CD.
10. Run deployed smoke tests and record evidence.
11. Update architecture/API/database/security/testing/decision
    documents.
12. Move forward only after the phase exit gate passes.

## Deployment rule

The first public deployment happens at the end of Phase 1, before Phase
2. Every later phase extends that deployment. See
`docs/DEPLOYMENT_PREPARATION.md`. Deployment is not postponed to Phase
10; Phase 10 is the final hardening and release review.

## Scope boundaries

The first release is single-vendor. Real card-data handling, live
logistics integrations, native mobile applications, multi-vendor seller
onboarding/settlements, microservices and paid production SLAs are
outside the first release. Use sandbox/fake adapters and mock delivery
where specified.

## Definition of done

A feature is complete only when requirements, API contract, server-side
validation, authorization, database invariants, failure behavior, tests,
logs, deployment smoke tests and documentation are complete.
