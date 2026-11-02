# Free-Tier Deployment Strategy ($0 Constraint)

## 1. Cost policy

The target is **zero monetary spend**, not merely a free trial. We will not:
- Start paid trials.
- Add a paid custom domain.
- Enable automatic paid upgrades.
- Use pay-as-you-go services without a hard free-only control.
- Store payment details just to access a trial.
- Depend on a service whose free tier requires accepting a paid commitment.

Provider policies can change. Re-check the linked official pricing/limits pages immediately before creating resources. If a provider requires a card or exposes an overage risk that cannot be disabled, stop and choose an alternative.

## 2. Provisional deployment layout

| Component | Candidate | Intended use | Known free-tier caveat |
|---|---|---|---|
| Angular static frontend | Cloudflare Pages Free | Serve compiled SPA | Build/file quotas; static assets are the suitable use case |
| Express API | Render Free Web Service | Public Node API | Spins down after inactivity; cold start; no persistent local disk |
| PostgreSQL | Supabase Free | Managed PostgreSQL | 500 MB database; projects may pause after one week of inactivity |
| Redis | Upstash Redis Free | Cache/session/queue experiments | 256 MB, 500K commands/month and 10 GB monthly bandwidth shown on current pricing |
| Source control / CI | GitHub Free | Repository and Actions | Public repo standard runner usage is free; private repos have included minute quotas |
| File storage | Initially defer; use remote seed images or evaluate Supabase Storage free quota | Product media | Verify storage/egress limits before uploads |
| Email | Development mail capture first | Test notifications | Do not assume unlimited free transactional email; add only after verifying a genuinely free plan |

Official references:
- [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Render free services](https://render.com/docs/free)
- [Render service types](https://render.com/docs/service-types)
- [Supabase free Postgres FAQ](https://supabase.com/kb/faqs/platform/free-postgres-for-side-projects)
- [Supabase pricing](https://supabase.com/pricing)
- [Upstash Redis pricing](https://upstash.com/pricing/redis)
- [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)

## 3. Important caveats

### Render
- Free web services spin down after 15 minutes of inactivity and may take around a minute to wake.
- Free web services have ephemeral filesystems; uploaded files must not be stored on local disk.
- Render free Postgres expires after 30 days and is not appropriate as the long-term database for this project.
- Therefore, use Render for the API only, not as the primary persistent database.
- Run Prisma migrations through a controlled startup/release script compatible with the selected free service; verify current deployment behavior.

### Supabase
- Free database currently lists 500 MB.
- Free projects can pause after a week of low activity.
- Export data regularly and keep local backups.
- Do not assume free plan includes production-grade backup/restore guarantees.

### Upstash
- Current free Redis listing shows 256 MB, 500K commands/month and 10 GB bandwidth.
- Track command usage. Do not let cache churn exhaust the quota.
- Validate compatibility of the chosen Redis client and BullMQ features against the provider. If blocking commands/connection semantics are unsuitable, keep BullMQ local and use a simpler compatible hosted queue alternative only after testing.

### Cloudflare Pages
- Suitable for static Angular output.
- Use SPA fallback/routing configuration.
- API calls go to the Express host; configure CORS and cookie topology deliberately.

## 4. Cookie and origin design

Frontend and API may be on different provider subdomains. Cookie behavior depends on their site relationship, `SameSite`, `Secure`, CORS credentials and browser rules.

Before production-like auth deployment:
1. Decide frontend and API hostnames.
2. Configure exact allowed origin.
3. Use HTTPS.
4. Set cookie attributes deliberately.
5. Test login, refresh/session restoration, CSRF and logout in a real browser.
6. Do not loosen CORS to `*` to make cookies work.

A free provider subdomain is sufficient. A custom domain is optional and may cost money.

## 5. Free-tier operational design

- Keep uploads out of ephemeral API disk.
- Make the API tolerate cold starts.
- Use health endpoints but do not use artificial keep-alive traffic to evade provider sleep policies.
- Use a small synthetic catalog and demo data.
- Run load tests locally; do not load-test free shared hosting.
- Keep background work bounded. If API and worker share one free process initially, document the trade-off and make worker startup configurable.
- Avoid expensive monitoring SaaS; use structured logs and local dashboards for learning.
- Use local PostgreSQL/Redis in Docker Compose as the reliable development environment.

## 6. Zero-cost verification checklist

Before deployment:
- [ ] Confirm each selected service is on its $0 plan.
- [ ] Confirm no trial is enabled.
- [ ] Confirm no card/payment method is required or no paid usage can be triggered.
- [ ] Disable paid auto-upgrades.
- [ ] Review quotas and suspension behavior.
- [ ] Confirm database export/restore works.
- [ ] Confirm no paid domain is required.
- [ ] Confirm storage and email are either free within limits or deferred.
- [ ] Add a monthly manual quota review.
- [ ] Record actual provider and plan in this document.

## 7. Reality check

This is a publicly accessible learning deployment, not a reliable commercial production service. Free tiers can sleep, pause, expire, change limits or disappear. The codebase should be production-minded, but the free infrastructure cannot provide paid-tier uptime, durability, scaling or support guarantees.
