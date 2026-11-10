# AqarFlow - Real Estate Management Platform (MVP)

AqarFlow is a multi-tenant real estate operations and CRM platform built for property agencies to manage listings, leads, agent visits, and deal pipelines with speed and tenant isolation.

---

## Architecture Principle: Modular (Feature-Based)

AqarFlow organizes code by **business feature (module)** rather than technical file type.

### The Modular Rules
1. **Self-Contained Modules**: Every business domain (e.g. `properties`, `leads`, `visits`) lives in its own dedicated directory containing its data access, business logic, controllers, routing, schemas, and tests.
2. **Encapsulated Public API via `index.ts`**:
   - Each module exposes its public interface **exclusively through its `index.ts`**.
   - Backend modules export only the router and public service functions.
   - Frontend modules export only public components, hooks, api methods, and types.
3. **No Deep/Internal Imports**:
   - Cross-module dependencies MUST import through the target module's barrel:
     ```ts
     // ✅ ALLOWED (via module index.ts)
     import { propertiesService } from '@/modules/properties';

     // ❌ FORBIDDEN (deep internal file import)
     import { propertiesRepository } from '@/modules/properties/properties.repository';
     ```
4. **Shared Code**: Code that is generic, reusable across multiple modules, or infrastructural lives in `shared/` (`middleware`, `permissions`, `utils`, `errors`, `types` for backend; `components/ui`, `components/layout`, `lib`, `hooks` for frontend).
5. **Tenant Isolation**: Every database table includes an `agencyId` foreign key to ensure complete tenant data segregation.

---

## Auth & Roles

AqarFlow implements a secure, stateless authentication and authorization architecture designed for multi-tenant real estate agencies:

### 1. HTTP-Only Cookie Approach
- **Cookie Name**: `aqarflow_token`
- **Cookie Flags**: `httpOnly: true`, `sameSite: "lax"`, `path: "/"`, `secure: process.env.NODE_ENV === "production"`, with `maxAge` matching `JWT_EXPIRES_IN` (default: 8 hours).
- **Client Security**: Tokens are neither stored in `localStorage` nor in JavaScript-accessible `document.cookie`, mitigating token theft via XSS.
- **Request Pipeline**: On every protected request, `authMiddleware` extracts the token from the cookie (with bearer fallback for API clients), verifies JWT signature, and checks the database to verify `user.isActive === true`. It attaches `req.user = { id, userId, agencyId, role }`.

### 2. Role-Based Access Control (RBAC)
- **Roles**:
  - `ADMIN`: Full agency operational and administrative access (properties, leads, deals, visits, team management, and settings).
  - `AGENT`: Day-to-day operational workflow access (properties, leads, visits, deals). Admin navigation and endpoints are restricted.
- **Backend Guard**: `requireRole('ADMIN')` returns `403 Forbidden` if the authenticated user's role is not authorized.
- **Frontend Guard**: The UI dynamically renders role-specific menus (e.g. `Sidebar` hides admin links from `AGENT`), while `middleware.ts` guards workspace routes for seamless UX.

### 3. Tenant Isolation Rule (`scopeToAgency`)
- **Strict Data Scoping**: All agency resources are isolated by `agencyId`.
- **Tenant Scoping Helper**:
  ```ts
  const scope = scopeToAgency(req); // returns { agencyId: req.user.agencyId }
  const properties = await prisma.property.findMany({
    where: { ...scope, status: 'AVAILABLE' },
  });
  ```
- **Cross-Tenant Barrier**: A user can never access or mutate data belonging to another agency, even if they know the record's primary key ID.


## How to Add a New Module

### 1. Adding a Backend Module
To add a new backend module named `<feature>` (e.g. `contracts`):

1. Create directory: `backend/src/modules/<feature>/`
2. Create exactly these 8 files:
   - `<feature>.schema.ts`: Zod validation schemas for requests.
   - `<feature>.types.ts`: TypeScript DTOs, domain interfaces.
   - `<feature>.repository.ts`: Database queries using Prisma.
   - `<feature>.service.ts`: Business logic and validations.
   - `<feature>.controller.ts`: Express request/response handlers.
   - `<feature>.routes.ts`: Router mounting endpoints with `validate` / `authMiddleware`.
   - `<feature>.test.ts`: Jest unit/integration tests for the feature.
   - `index.ts`: Export the router and public service functions only:
     ```ts
     export { <feature>Router } from './<feature>.routes';
     export { <feature>Service } from './<feature>.service';
     ```
3. Mount the new router in `backend/src/routes.ts`:
   ```ts
   import { <feature>Router } from '@/modules/<feature>';
   router.use('/<feature>', <feature>Router);
   ```

### 2. Adding a Frontend Module
To add a matching frontend module named `<feature>`:

1. Create directory: `frontend/modules/<feature>/`
2. Create:
   - `components/`: Feature-specific UI components and `components/index.ts`.
   - `api.ts`: API client functions calling `/api/v1/<feature>`.
   - `hooks.ts`: Custom React hooks for data fetching & mutations.
   - `types.ts`: Frontend domain models and DTOs.
   - `index.ts`: Public API export barrel (`export * from './components'; export * from './api'; export * from './hooks'; export * from './types';`).
3. Create thin routing page in `frontend/app/(workspace)/<feature>/page.tsx`:
   ```tsx
   import React from 'react';
   import { <Feature>Component } from '@/modules/<feature>';

   export default function <Feature>Page() {
     return <<Feature>Component />;
   }
   ```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS |
| **Backend** | Express.js, TypeScript |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Authentication** | JWT + bcrypt |
| **Validation** | Zod |
| **API Documentation** | Swagger (`swagger-ui-express`) |
| **Testing** | Jest + Supertest (backend), Playwright (frontend e2e) |

---

## Directory Structure

```
aqarflow/
├── frontend/
│   ├── app/                      (Routing only, thin pages importing from modules)
│   │   ├── (public)/             home, properties, properties/[id], about, contact
│   │   ├── (auth)/login          login page
│   │   └── (workspace)/          dashboard, properties, leads, visits, deals
│   ├── modules/                  (Feature-based modules)
│   │   ├── auth/
│   │   ├── properties/
│   │   ├── public-portal/
│   │   ├── leads/
│   │   ├── visits/
│   │   ├── deals/
│   │   └── dashboard/
│   ├── shared/                   (Cross-cutting components, utilities, hooks)
│   │   ├── components/ui/        (Button, Input, Modal, Table)
│   │   ├── components/layout/    (Navbar, Sidebar, Footer)
│   │   ├── lib/                  (apiClient.ts, utils.ts)
│   │   └── hooks/
│   ├── middleware.ts             (Next.js route protection)
│   ├── public/
│   ├── tests/e2e/                (Playwright tests)
│   ├── package.json, tsconfig.json, tailwind.config.ts, playwright.config.ts
├── backend/
│   ├── prisma/                   (schema.prisma, migrations/, seed.ts)
│   ├── uploads/                  (git-ignored file storage)
│   ├── src/
│   │   ├── app.ts, server.ts
│   │   ├── config/               (env.ts, db.ts, swagger.ts)
│   │   ├── modules/              (Feature-based modules)
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── properties/
│   │   │   ├── public-portal/
│   │   │   ├── leads/
│   │   │   ├── visits/
│   │   │   ├── deals/
│   │   │   └── dashboard/
│   │   ├── shared/               (Cross-cutting middleware, permissions, utils)
│   │   │   ├── middleware/       (auth, role, validate, error, upload)
│   │   │   ├── permissions/      (roles: ADMIN, AGENT)
│   │   │   ├── utils/            (jwt, password, logger)
│   │   │   ├── errors/           (ApiError.ts)
│   │   │   └── types/
│   │   └── routes.ts             (mounts all module routers under /api/v1)
│   ├── tests/                    (Integration smoke tests)
│   ├── package.json, tsconfig.json, jest.config.ts, Dockerfile
├── docs/                         (architecture/, api/, user-guides/)
├── infra/                        (docker-compose.yml, Dockerfiles/)
├── .gitignore
├── .env.example
└── README.md
```

---

## NPM Scripts

The root and package configurations provide standard scripts:

| Script | Purpose |
|---|---|
| `npm run dev` | Runs backend (port 5000) and frontend (port 3000) concurrently |
| `npm run build` | Builds backend (TypeScript) and frontend (Next.js) |
| `npm run start` | Runs production builds of backend and frontend |
| `npm run test` | Runs backend Jest unit & integration tests |
| `npm run prisma:generate` | Generates Prisma client types |
| `npm run prisma:migrate` | Runs database migrations |
| `npm run prisma:seed` | Seeds database with initial tenant and agency data |

### Workspace-Specific Scripts
- Backend dev only: `npm run dev:backend` (or `cd backend && npm run dev`)
- Frontend dev only: `npm run dev:frontend` (or `cd frontend && npm run dev`)
- E2E Playwright tests: `cd frontend && npm run test`
