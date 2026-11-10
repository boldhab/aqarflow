# Getting Started with AqarFlow

Welcome to AqarFlow! This guide walks you through setting up and running the MVP locally.

## Prerequisites
- Node.js >= 18 (Node 20+ recommended)
- PostgreSQL database
- Docker (optional, for containerized deployment)

## Setup Steps
1. Copy `.env.example` in root, `backend/`, and `frontend/`:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run database migrations:
   ```bash
   npm run prisma:migrate
   ```
4. Run the seed script:
   ```bash
   npm run prisma:seed
   ```
5. Start development servers:
   ```bash
   npm run dev
   ```

Frontend runs on `http://localhost:3000`.
Backend runs on `http://localhost:5000`.
Swagger API docs are available at `http://localhost:5000/docs`.
