# Deploy the refreshed Wayfare interface

The redesign is a frontend update in `web`. The API contract and database schema are unchanged by this UI commit.

1. In the existing Vercel project's Settings, check that the connected Git repository is `ayoub804/transport` and the production branch is `main`. An earlier deployment used `transport1`; that separate repository will not receive pushes to `transport`.
2. Under Build and Deployment, set Root Directory to `web`, Framework Preset to Next.js, and use `npm run build`. Keep the default output directory and install command (or `npm ci`).
3. Keep the production environment variable `API_BASE_URL` set to the working Render API's HTTPS base URL.
4. Open Deployments and find the new UI commit. With Git deployments enabled, the push triggers a build. If the repository connection was corrected after the push, create a deployment from the latest `main` commit. Redeploying an older deployment reuses that older source commit.
5. Wait for Ready, open the production domain, and refresh with Ctrl+Shift+R. Verify the light blue sign-in screen, then test your client, driver, and admin accounts.

Render and Neon need no configuration changes for this UI update. If you create a new Vercel domain, update Render's `CORS_ORIGINS` to include its exact HTTPS origin.

## Validation

- Production Next.js build, TypeScript checks, and build-time lint.
- Browser checks with mock API responses across login, registration, trip search, seat selection, reservations, four admin pages, and three driver pages.
- Desktop (1440px) and mobile (390px), horizontal overflow, password visibility, route swapping, mobile navigation, seat selection, and vehicle dialog layout.
- Mock data is used only in the temporary browser QA harness, not in application code. Production login, database writes, and physical camera scanning were not exercised by this visual verification.

References: [Vercel monorepos](https://vercel.com/docs/monorepos), [managing deployments](https://vercel.com/docs/deployments/managing-deployments).
