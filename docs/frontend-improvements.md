# Aqarflow frontend improvements

## Routes and workflows

- `/properties` is public for visitors and signed-in users. `/properties/[id]` contains the detail gallery and inquiry form.
- `/inventory` requires a session and provides property creation, editing, photos, publication, and archive controls. The backend remains responsible for authorization.
- Inventory URL filters such as `/inventory?purpose=RENT` work with sidebar selection. `/leads?view=pipeline` opens the keyboard-accessible pipeline.
- Dashboard shortcuts open real forms using `?create=1`. Leads, visits, and deals are created through their existing API endpoints. Lists refresh after creation.
- Creating a property continues to photo management. Publication and availability are shown separately. Secondary publication/archive actions are under More.

## Public experience

The homepage renders before its latest listings finish loading. Public cards share one component, with price, title, locality, key specifications, availability, reference, and a details link. Missing and failed photos have a consistent fallback. Advanced filters collapse on mobile; search and budget changes apply explicitly. Changing the URL restores the filter state. Outdated listing requests are canceled.

Failed requests display recovery controls rather than empty-results advice. Detail 404s are reserved for missing properties; server failures use an error boundary. Route loading placeholders and API timeouts avoid indefinite loading. Mobile detail pages have persistent Call/Inquire controls; the general contact form comes first on mobile.

## Workspace and accessibility

Inventory and shared tables use cards on mobile. Inventory requests and pagination use the same 20-record page size. Dialogs trap and restore focus, support Escape, and lock background scrolling. Dirty property and workflow forms ask before discarding changes. Field IDs are unique; labels, hints, and validation errors are associated with their controls. Email is required when email contact is selected. Phone inputs use the telephone keyboard.

Photo uploads show each file's outcome, completed counts, and retry for failed files. Cover selection remains available; deletion requires confirmation. Upload controls are keyboard accessible, and closing photo management is blocked during an active operation. The unsupported promise of image reordering was removed rather than advertising a missing feature.

Appointments display date and time in Pakistan time (PKT); new visit forms explicitly accept PKT and send UTC timestamps. The won-deal metric is labeled accordingly. Brand accents use forest green, icons are consistent, muted text is darker, mobile controls have usable touch heights, and reduced-motion preferences are respected.

## Content and data

Hardcoded market statistics, unsupported verification/licensing promises, and placeholder legal links were removed. Latest listings are labeled accurately. The specifically identified published automated-test listing AF-1033 was unpublished from the local database; the record was preserved. Future browser creation tests use mocked writes, preventing new public test listings.

The current property model does not store a rental billing period. The UI asks visitors to confirm payment periods with the agent instead of inventing monthly or yearly terms. Existing agency contact details, property photographs, and image captions are agency-managed content and still require factual review by their owner. No legal policy text was invented; the footer links to contact support until approved policies exist.

## Verification

- `npm run build --workspace=frontend`
- `npx tsc --noEmit -p frontend/tsconfig.json`
- `npx tsc --noEmit -p backend/tsconfig.json`
- `npm test --workspace=backend -- --runInBand public-portal.repository.unit.test.ts`
- `PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e --workspace=frontend`

The browser suite covers public desktop/mobile layouts, real local demo login, real property details, compact filters, failure recovery, URL-driven inventory/pipeline navigation, agent controls, dialog focus/unsaved changes, creation payloads, upload retry, and deletion confirmation. Creation and upload writes in these tests are intercepted; they verify frontend behavior without creating database records. The backend unit test verifies that the advertised N+ bedroom filter uses a minimum comparison while retaining publication/agency scope.

Before starting tests against port 3001, run a frontend server there. Avoid running two Next.js processes against the same `.next` directory. Existing integration suites that write to a database should use a dedicated test database.
