# AqarFlow product operations

## Implemented modules

- Core workflows: lead stage moves, assignment and notes; visit duration, editing, completion, cancellation and conflict preview; deal pipeline and offer/agreed values; staff creation/deactivation and final-admin protection. Won deals update property availability and lead conversion, with one commission per deal.
- Customer/CRM: separate HttpOnly customer sessions, registration/login/logout, published-property favorites, account-linked inquiries and visits, normalized agency contacts, activity timelines, in-app notifications, email outbox.
- Rentals: landlord/tenant/manager links, monthly/quarterly/half-yearly/yearly billing, calendar-month schedules, grace periods, partial collection, deposit receipt/refund/deduction history, renewal with deposit rollover, termination and future-charge waivers, master collection schedule.
- Finance: atomic agency/year invoice numbers, decimal line items and tax, immutable idempotent payments, invoice and receipt PDFs, expenses, commission calculation/approval/payment.
- Operations: maintenance board/list with photos, contractor/status/cost changes, date-filtered SQL-aggregated reports, CSV/PDF downloads, agency settings/logo, branches and assignments, append-only audit history.

The implementation preserves existing staff roles and deal statuses. `Deal.stage` is the detailed pipeline; status remains OPEN/WON/LOST for existing dashboards and clients. Lease end dates are exclusive. Short months clamp billing anniversaries without moving later anniversaries. Rent is charged per billing month, without daily proration. Property bookings have a strict single-holder rule; release the existing booking before creating another.

## API contracts

All staff endpoints use the existing staff session and agency scope. Admin access is required for staff writes, lease creation/renewal/termination, invoice creation/cancellation, expense creation, commission approval/payment, reports, branches, and settings. Agents may update their assigned visits and deals. Lead reassignment is admin-only. Customer tokens use a separate audience, cookie, and account table and cannot access staff endpoints.

| Area           | Endpoints                                                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contacts       | GET/POST `/contacts`, GET/PATCH `/contacts/:id`, POST `/contacts/:id/activities`                                                                                                                                                                        |
| Notifications  | GET `/notifications`, PATCH `/notifications/:id/read`                                                                                                                                                                                                   |
| Customer       | POST `/portal/auth/register`, `/portal/auth/login`, `/portal/auth/logout`; GET `/portal/auth/me`                                                                                                                                                        |
| Self-service   | GET `/portal/favorites`, POST/DELETE `/portal/favorites/:propertyId`, GET `/portal/my-inquiries`, POST `/portal/inquiries`                                                                                                                              |
| Rentals        | GET/POST `/rentals`, GET/PATCH `/rentals/:id`, POST `/rentals/:id/renew`, `/rentals/:id/terminate`, `/rentals/:id/deposits`; `/leases` aliases these routes                                                                                             |
| Collections    | GET `/rent-obligations`, POST `/rent-obligations/:id/pay`, POST `/rent-obligations/:id/waive`                                                                                                                                                           |
| Finance        | GET/POST `/finance/invoices`, PATCH `/finance/invoices/:id`, GET `/finance/invoices/:id/pdf`, GET/POST `/finance/payments`, GET `/finance/payments/:id/pdf`, GET/POST `/finance/expenses`, GET `/finance/commissions`, PATCH `/finance/commissions/:id` |
| Operations     | GET/POST `/maintenance`, PATCH `/maintenance/:id`, POST `/assets` (multipart image)                                                                                                                                                                     |
| Administration | GET/PATCH `/settings/agency`, POST `/settings/branches`, PATCH `/settings/branches/:id`, POST `/settings/branches/:id/assign`, GET `/audit-logs`                                                                                                        |
| Reporting      | GET `/reports/sales`, `/reports/rentals`, `/reports/export-csv`, `/reports/pdf`                                                                                                                                                                         |

Paths have the `/api/v1` prefix. Paginated staff lists accept page/limit (maximum 100); supported screens expose search/status filters. Reports accept ISO `from`/`to`, with a maximum five-year range. Amounts return as decimal strings; chart aggregates are numeric display values. Requests reject invalid shapes and foreign-agency references.

Payment requests require a UUID `requestKey` and exactly one of `invoiceId`/`obligationId`. Retry the same payload with the same key after a timeout; changing the payload requires a new key. Deposit movements also require a request key. Payments and audit events cannot be edited/deleted. Corrections to posted money require a future explicit reversal workflow; do not delete database rows. Won-deal value/agent changes are blocked when they would alter a generated commission.

Customers with an existing CRM phone must contact the agency to link their identity: unverified signup cannot claim existing contact history. Guest inquiries remain supported. Inquiries sent from the signed-in account have an explicit ownership link. Customer profile verification, account recovery, online payment-provider settlement, tax filing, and full double-entry accounting are separate product capabilities.

## Deployment

1. Back up the database. Review pending SQL migrations, especially the exclusion constraints and the single-property booking index. Reconcile legacy overlapping appointments and duplicate won/booked deals before deploying; migrations deliberately fail rather than discard conflicts.
2. PostgreSQL must allow `CREATE EXTENSION btree_gist`. Run `npm run prisma:deploy`, then `npm run build`. Never run seed against production.
3. Set a unique `JWT_SECRET` of at least 32 characters, `DATABASE_URL`, `DEFAULT_AGENCY_SLUG`, and exact comma-separated `FRONTEND_URL` origins. Wildcard Vercel origins are no longer trusted. Use HTTPS and matching cookie settings. Cross-origin cookie writes must supply an allowed Origin.
4. Configure the frontend backend/API URLs at build time. The supplied local verification used an isolated database and ports 5002/3002; rebuild for the intended deployment URLs.
5. For cloud images set `STORAGE_DRIVER=s3`, bucket, region/endpoint, credentials (or AWS role), and `S3_PUBLIC_URL` for the public listing-image CDN/bucket. Local storage remains available. Stored extensions follow verified file signatures; files are not silently relabeled as WebP. Restrict bucket write permissions to the application role. Signed URL helpers expire after five minutes.
6. Set `RESEND_API_KEY` and a verified sender in `EMAIL_FROM`. Schedule `npm run operations:reconcile --workspace=backend` and `npm run email:deliver --workspace=backend` every minute, preventing overlapping scheduler processes. Jobs retain failures, retry with backoff, recover stale claims, and use provider idempotency keys. Monitor FAILED email jobs after eight attempts. Production can invoke the compiled worker files instead of tsx.
7. Lease activation/expiry and visit reminders depend on the lifecycle worker. Expired agreements notify administrators to inspect the property and update availability. Notifications poll every 30 seconds while the tab is visible. Board counts reflect the current page; pagination remains available.

## Verification

`npm test` runs read-only/unit tests and skips write integration suites by default. Integration tests require `RUN_OPERATIONS_INTEGRATION=1` and an explicit DATABASE_URL whose database or schema name identifies it as a test database. Apply migrations and seed that disposable database first, then run `npm run test:integration --workspace=backend`. The suite retains audited agency identities and intentionally exercises rejected immutable-record deletion.

`npm run build` checks both application builds. `npx tsc --noEmit -p frontend/tsconfig.json` and its backend equivalent check types. For a separately started frontend, set `PLAYWRIGHT_EXTERNAL_SERVERS=1` and `PLAYWRIGHT_BASE_URL` before `npm run test:e2e --workspace=frontend`. Browser write tests intercept writes so they do not create public test listings.

Live S3/R2 access, email delivery, deployment infrastructure, and production data reconciliation need environment-specific verification. No existing application database was migrated during implementation; migrations were exercised against a disposable PostgreSQL instance under /tmp. The remaining dependency audit findings are recorded with final verification results; do not interpret a successful build as proof that external services or production operations have been validated.

### Verified on 14 November 2026

- Both production builds passed; frontend and backend TypeScript checks passed.
- Full backend regression run: **85 tests passed across 13 suites**, using the disposable PostgreSQL database. This includes concurrent payment replay, concurrent appointment conflicts, invoice sequences, renewal deposit rollover, future-charge waiver, lifecycle reminder retries, customer/staff separation, foreign-agency references, final-admin protection, PDF signatures, and origin checks.
- Chromium regression run: **21 tests passed**, including the existing public/workspace flows and the new invoice, mobile maintenance, and customer-registration checks. Desktop and mobile maintenance previews were visually inspected.
- Production dependency audit: **zero vulnerabilities**. The full dependency tree retains seven low-severity findings in the Jest/deepmerge development stack; the available automatic resolution would make a breaking test-stack change.
- Migrations were applied to the isolated test database. Live storage/email providers and production deployment were not exercised.
