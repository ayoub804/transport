# Deploy the dark UI and driver registration

This release changes both `web` and `api`. Deploy the API first so it accepts the new registration role. No database migration is required for driver signup: the existing UserRole enum already contains DRIVER.

## 1. Render API

1. Open the API service and confirm its connected repository is `ayoub804/transport`, branch `main`, Root Directory `api`. A service connected to `transport1` will not receive this update.
2. Keep the existing database URLs, signing secrets, and port settings.
3. Use the existing build command: `npm ci --include=dev && npx prisma generate && npm run build`.
4. Use the existing start command: `npx prisma migrate deploy && node dist/main.js`.
5. Choose Manual Deploy -> Deploy latest commit (or wait for the automatic Git deployment). Confirm the new commit is live and the health endpoint responds.

## 2. Vercel frontend

1. Confirm the connected repository is `ayoub804/transport`, production branch `main`, Root Directory `web`, Framework Preset Next.js.
2. Keep `API_BASE_URL` pointing at the working Render API HTTPS URL.
3. Find the new commit under Deployments and wait for Ready. If it was not automatically deployed, create a deployment from the latest `main`. Redeploying an older deployment reuses its older source commit.
4. Open the production domain and refresh with Ctrl+Shift+R. The home page should show the dark contour background, metallic links, and lime accents.

## 3. Create a driver through the website

1. Open Create account.
2. Choose Driver under Join as.
3. Enter the name, email, and password and submit.
4. The account signs in and opens the driver workspace automatically.
5. Trips appear once an admin assigns them to that driver. Existing passenger accounts are not converted by registering the same email again.

Passenger remains the default. Public signup accepts only CLIENT or DRIVER; ADMIN and invalid roles are rejected by the API.

If signup returns `property role should not exist`, the frontend is reaching an older API deployment. Update Render and confirm Vercel's `API_BASE_URL`.

## Validation and scope

- Frontend production build, TypeScript, and build-time lint.
- API production build and 31 unit tests, including role validation, passenger compatibility, and rejection of admin escalation.
- Thirteen screens checked with mock API data at 1440px and 390px; no horizontal page overflow or browser exceptions.
- Browser signup tests verify the passenger/driver request payload and corresponding redirect. Animation rendering, theme persistence, password visibility, route swapping, mobile menu, seat selection, and vehicle-dialog layout are checked.
- Production accounts and booking records are not created by these tests; physical camera scanning needs testing on a real device.
- Typography and palette follow the supplied IoT4ALL reference. The procedural 3D links and contour implementation are local components. Geist fonts are bundled with their OFL license.
- Reduced motion disables continuous visual effects; WebGL failure falls back to CSS artwork.

Reference: https://iot4all.netlify.app/
