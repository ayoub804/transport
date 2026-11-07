# Transport Reservation System

This repository is being delivered in phases. Phases 1–6 provide the local infrastructure, NestJS API foundation, Prisma data model and migration, development seed, authentication, vehicle/trip management, seat reservations, QR tickets, and admin reports.

## Requirements

- Windows 10/11 with Docker Desktop and Docker Compose
- Node.js 20+ and npm

## Local setup

Run these commands from the repository root in PowerShell:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Replace the placeholder passwords and secrets in `.env` before running the API. Use distinct, randomly generated values for `JWT_SECRET` and `QR_SECRET`. The database URL password must match `POSTGRES_PASSWORD`.

Start PostgreSQL 16 and Redis 7:

```powershell
docker compose up -d
```

Install API dependencies, apply the initial database migration, and seed development accounts:

```powershell
Set-Location api
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Stop any running API process with `Ctrl+C` before rerunning Prisma generation or migrations. On Windows, an active Node process can hold Prisma's query-engine DLL open and prevent Prisma from replacing it.

Start the API in watch mode:

```powershell
npm run start:dev
```

Swagger UI is at <http://localhost:3001/api/docs>. The health endpoint is `GET http://localhost:3001/`.

Run unit tests from `api`:

```powershell
npm test
```

## Frontend (Phase 7)

In a second PowerShell terminal, configure and start the Next.js PWA:

```powershell
if (-not (Test-Path web\.env.local)) { Copy-Item web\.env.example web\.env.local }
Set-Location web
npm install
npm run dev
```

The frontend opens at <http://localhost:3000> and expects the API at `API_BASE_URL` in `web/.env.local` (default `http://localhost:3001`). Its server-side session routes proxy API requests and store access tokens in an HttpOnly cookie rather than browser storage.

Available role-based pages:

- Client: `/trips`, `/trips/[id]`, `/my-reservations`
- Driver: `/driver/trips`, `/driver/trips/[id]`, `/driver/scan`
- Admin: `/admin/dashboard`, `/admin/vehicles`, `/admin/trips`, `/admin/reservations`

Installable app metadata is served from `/manifest.json`. Driver camera scanning requires camera permission and a secure context (HTTPS, or localhost).

The API currently includes:

- Authentication: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Admin vehicle CRUD: `/vehicles`
- Public trip search/details/seats: `GET /trips`, `/trips/:id`, `/trips/:id/seats`
- Admin trip create/update/delete: `/trips`
- Client reservation create/history/update/cancel: `/reservations`
- Driver assigned-trip reservations: `GET /driver/trips/:tripId/reservations`
- Admin reservation list and filters: `GET /reservations`
- Owner QR tickets and driver/admin validation: `GET /reservations/:id/ticket`, `POST /tickets/validate`
- Admin reservation summary: `GET /reports/summary`

Changing a reservation moves it to another scheduled trip and retains its current seat unless `seatNumber` is supplied. Vehicle/trip deletion is rejected when it would invalidate existing assignments or reservation history. Reservations can be changed or cancelled only before departure.

Ticket QR codes contain only a QR-secret-signed JWT with the reservation UUID (and standard JWT timing/issuer/audience claims). Tickets expire after 30 days, are available only for confirmed reservations on future scheduled trips, and can be scanned only by the assigned driver or an admin. Successful scans atomically mark a reservation `USED`; repeat scans return HTTP 409. The report's `cancellationRate` is cancelled reservation records divided by all reservation records; `reservationCount` per trip excludes cancelled records and includes used tickets.

Stop local infrastructure from the repository root:

```powershell
docker compose down
```

Add `-v` to `docker compose down` only if you intentionally want to delete the local database and Redis volumes.

## Seed accounts

The seed script creates:

| Role | Email | Password |
|---|---|---|
| ADMIN | admin@transport.local | Admin123! |
| DRIVER | driver@transport.local | Driver123! |
| CLIENT | client@transport.local | Client123! |

These are local development credentials. Change them before exposing any environment beyond local development.

## Configuration

All service connection settings and signing secrets are read from environment variables. `.env.example` documents the local variables; `.env` is ignored by Git. For production, configure `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `QR_SECRET`, `CORS_ORIGINS`, and `API_PORT` in the process environment. Never reuse development secrets.

## UML diagrams

Architecture, use case, domain class, reservation, and QR-ticket validation diagrams are in [docs/UML.md](docs/UML.md).

## Assumptions

- The API listens on port 3001 by default to keep the conventional Next.js port 3000 available.
- The root `.env` is the Compose configuration source and is also loaded by the API from the repository root; the API does not require committed environment-specific files.
- The initial Prisma migration is stored under `api/prisma/migrations` and is applied locally with `prisma migrate dev`. Production deployments should apply committed migrations with `prisma migrate deploy`.
- Development seed accounts use fixed documented credentials so the seeded local system can be exercised immediately.
- Registration always creates a `CLIENT`; the requested auth foundation does not expose public role selection.
- JWTs are bearer access tokens with a configurable expiry. Browser token storage is deferred to the frontend phase.

## Project layout

```text
api/                 NestJS API
docs/                Project documentation
docker-compose.yml   PostgreSQL 16 and Redis 7
```
