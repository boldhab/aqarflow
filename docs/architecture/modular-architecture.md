# AqarFlow Modular Architecture

## Core Architectural Principle
AqarFlow strictly follows a **Modular (Feature-Based)** architecture rather than a layer-based or type-based structure.

### Key Rules
1. **Feature Encapsulation**: All business logic, data models, routes, controllers, and schemas related to a feature live together inside its module directory.
2. **Explicit Public Interface**: Every module exposes its public API **strictly via its `index.ts`**.
3. **Strict Import Boundary**:
   - A module may import another module ONLY via `@/modules/<module-name>` (the module's `index.ts`).
   - Deep imports into internal module files (e.g., `@/modules/users/users.repository`) from outside the module are strictly forbidden.
4. **Tenant Isolation**: Every database table includes an `agencyId` for multi-tenant separation.
5. **Shared Layer**: Cross-cutting utilities, errors, middlewares, and common UI components live in `shared/`.

### Module Structure

#### Backend Module Template
```
backend/src/modules/<feature-name>/
├── <feature-name>.routes.ts       # Express router definitions
├── <feature-name>.controller.ts   # HTTP request/response handling
├── <feature-name>.service.ts      # Core business rules
├── <feature-name>.repository.ts   # Database queries via Prisma
├── <feature-name>.schema.ts       # Zod validation schemas
├── <feature-name>.types.ts        # TypeScript interfaces & types
├── <feature-name>.test.ts         # Unit & integration tests
└── index.ts                       # Public API export (router + services)
```

#### Frontend Module Template
```
frontend/modules/<feature-name>/
├── components/                    # Feature-specific UI components
├── api.ts                         # HTTP requests to backend API
├── hooks.ts                       # React state & query hooks
├── types.ts                       # Domain types & DTOs
└── index.ts                       # Public export barrel
```
