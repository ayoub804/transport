# Transport API

NestJS REST API for the transport reservation system. The repository-level [README](../README.md) contains complete local setup instructions and development seed credentials.

## Development

From the repository root in PowerShell:

```powershell
docker compose up -d
Set-Location api
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

The API reads its configuration from the repository root `.env`. Swagger is available at <http://localhost:3001/api/docs>.

## Scripts

- `npm run build` — compile and type-check the API
- `npm test` — run Jest unit tests
- `npm run prisma:migrate` — create/apply local development migrations
- `npm run prisma:seed` — insert idempotent development data

## Current modules

- `Auth` — client registration, login, JWT authentication, and roles
- `Vehicles` — admin-only vehicle CRUD
- `Trips` — public search/details/seat availability and admin-only trip management
- `Reservations` — client booking/history/change/cancel, driver assigned-trip listing, and admin filters
- `Tickets` — signed QR tickets and driver/admin single-use validation
- `Reports` — admin reservation summary and per-trip counts

Reservation changes target another scheduled trip. The existing seat is retained unless a replacement `seatNumber` is supplied. Changes and cancellations are rejected after departure. Vehicle/trip deletion is rejected if linked trips or reservation history would be invalidated.

Ticket QR codes contain a QR-secret-signed JWT with only the reservation UUID plus standard JWT claims. They expire after 30 days and can be validated once by the assigned driver or an admin; a successful scan marks the reservation `USED`. Reports define the cancellation rate as cancelled records divided by all records, and per-trip counts exclude cancelled reservations.

Production migrations should be applied with Prisma's `migrate deploy` command after the production environment is configured.
