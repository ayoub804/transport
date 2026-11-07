# Wayfare web app

Next.js App Router frontend for the transport reservation system.

## Local development

From the repository root in PowerShell:

```powershell
Copy-Item web\.env.example web\.env.local
Set-Location web
npm install
npm run dev
```

The API must also be running at the `API_BASE_URL` configured in `web/.env.local` (default `http://localhost:3001`). Open <http://localhost:3000>.

The browser uses same-origin Next.js session/proxy routes. Access JWTs are stored in an `HttpOnly`, `SameSite=Lax` cookie and never exposed to client-side JavaScript or local storage.

## Features

- Client registration/login, trip search, seat selection, reservations, cancellations, changes, and QR tickets.
- Driver assigned trips, passenger lists, camera scanning, and manual ticket-token entry.
- Admin vehicle/trip/reservation management and reservation dashboard.
- Responsive layouts, installable PWA manifest, and service-worker registration.

Run checks with `npm run lint` and `npm run build`.
