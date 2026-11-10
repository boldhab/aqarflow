# AqarFlow API Specification

Base URL: `/api/v1`
Interactive Swagger Documentation: `http://localhost:5000/docs`

## Endpoints Overview

### Authentication (`/api/v1/auth`)
- `POST /login`: Authenticate agent or admin, returns JWT.
- `POST /register`: Register new agency with an initial admin user.

### Users (`/api/v1/users`)
- `GET /`: List all users belonging to the agency (Admin/Agent).
- `GET /:id`: Retrieve single user details.
- `POST /`: Invite/create new agent (Admin only).
- `PATCH /:id`: Update agent profile (Admin only).

### Properties (`/api/v1/properties`)
- `GET /`: List agency properties with filtering & pagination.
- `GET /:id`: Property detail view with images.
- `POST /`: Create property listing.
- `PATCH /:id`: Update property listing.
- `DELETE /:id`: Remove property listing.

### Public Portal (`/api/v1/portal`)
- `GET /listings`: Public listing feed with filters (city, type, price).
- `GET /listings/:id`: Public single listing view.
- `POST /inquiries`: Public lead inquiry submission.

### Leads (`/api/v1/leads`)
- `GET /`: Filter leads by stage and agent.
- `GET /:id`: Lead details with notes and timeline.
- `POST /`: Create new lead.
- `PATCH /:id`: Update lead status or info.
- `POST /:id/assign`: Assign lead to an agent.
- `POST /:id/notes`: Add note to lead history.

### Visits (`/api/v1/visits`)
- `GET /`: List scheduled visits.
- `GET /:id`: Visit detail view.
- `POST /`: Schedule property visit.
- `PATCH /:id`: Update visit status (SCHEDULED/COMPLETED/CANCELLED).

### Deals (`/api/v1/deals`)
- `GET /`: List pipeline deals.
- `GET /:id`: Deal details.
- `POST /`: Create deal.
- `PATCH /:id`: Update deal value, status, closing date.

### Dashboard (`/api/v1/dashboard`)
- `GET /overview`: High-level metrics, recent leads, and upcoming visits.
