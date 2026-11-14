# Production implementation roadmap

The five roadmap phases are one integrated product expansion. Preserve existing API shapes and OPEN/WON/LOST deal statuses; introduce stages alongside them. Use additive migrations, agency-scoped queries, explicit request schemas, decimal arithmetic, bounded pagination, and transactional domain operations.

1. Core: editable lead/visit/deal workflows; admin staff directory; duration-aware scheduling with database exclusion constraints; single property booking; configurable S3 storage; separate Jest configuration.
2. CRM: contacts deduplicated by normalized phone per agency; staff activity history; customer accounts with separate cookies and token audience; published-property favorites; contact-owned inquiries; durable email outbox and in-app notifications.
3. Rentals: date-validated lease agreements; calendar-month obligations; partial payments and deposit movements; renewals linked to original lease; expiry reporting. Preserve original due dates when months have fewer days.
4. Finance: agency/year invoice sequences; decimal line calculations; idempotent payment posting with locked balances; immutable payment records; branded PDFs; expenses; commission approval and payment transitions.
5. Operations: maintenance lifecycle and costs; scoped reporting with dates and CSV/PDF exports; branch assignment; agency branding/preferences; append-only audit events excluding credentials.

Cross-cutting acceptance: unauthenticated/unauthorized access fails; cross-agency references are rejected; customers cannot use staff APIs; duplicate/replayed money operations do not double-post; overlapping visits and bookings cannot race; form errors are actionable; tables work on small screens; dialogs retain focus and keyboard access; empty/loading/error states are explicit.

Deployment: back up the database, review migration SQL, reconcile conflicting legacy rows, deploy migrations before application changes, configure storage/email credentials, run the email worker, and use a dedicated test database. Never run write integration tests against production. External delivery is verified only with configured provider credentials.
