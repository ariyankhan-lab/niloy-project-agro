# FarmLife ERP
Bilingual English/Bangla dairy and cattle fattening ERP for Bangladesh, designed for multiple farms, collection centers and distribution branches.

**Status: working development preview; Authentication & Roles is in development.** The bilingual workspace, login/recovery/profile/access UI and audited authentication RPC migration are implemented. Local Supabase Auth/REST acceptance has passed; hosted production acceptance remains separate. The other 21 modules remain planned. This is not a production-ready ERP release. No sample farm records or fake operational dashboards are included.

## Development
Prerequisites: Node.js 24 (see .nvmrc), npm, and Git. Docker is optional for the shell and required for a local authentication backend. This managed environment uses the verified lightweight setup in docs/LOCAL_AUTH.md.

```sh
npm ci
cp .env.example .env.local  # only if this file does not already exist
npm run dev
```
The shell renders without Supabase credentials and explicitly reports that state. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to connect your own project. Restart Vite after changing them. Browser publishable keys are public; database passwords, service-role keys and AI credentials must never use VITE_* or enter Git. Login, recovery and protected routes are implemented but disabled when the backend is unconfigured. Account creation is administrator-provisioned; no public signup is exposed.

## Verification
```sh
npm run check       # ESLint, strict TypeScript, unit + PostgreSQL tests, build
npx playwright install --with-deps chromium
npm run test:e2e    # desktop and mobile Chromium
```
On machines with a preinstalled Chromium, use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`. npm test includes real embedded PostgreSQL (PGlite) migration/RLS tests with a minimal auth.uid() fixture. These do not replace Supabase Auth/REST integration checks. See PROGRESS.md for actual results and limitations.

## Local database
Use [the verified lightweight Auth/REST stack](docs/LOCAL_AUTH.md) on this managed machine. The standard full-stack commands below remain an option on machines with enough Docker storage.

```sh
npm run db:start
# For a lighter foundation stack:
npx supabase start -x studio,imgproxy,edge-runtime,logflare,vector,supavisor,realtime,storage-api
```
The CLI applies migrations on a fresh stack. Read public connection settings from `npx supabase status` privately; do not paste its secret values into logs or tickets. Configure .env.local only with the URL and public key. Use `npm run db:types` after migrations. `npm run db:reset` destroys local data: use only against a disposable local stack after checking ownership. `npm run db:stop` stops the local stack.

Public signup is disabled. No users or organizations are seeded. Verified nonmembers can create their own organization through bootstrap_organization. Owners/admins can invite existing verified Auth accounts through private expiring links. New Auth accounts must be provisioned through a trusted Supabase administrator; automated invitation email/account provisioning is not implemented. Do not weaken policies to make development writes work. Hosted migrations are a separate authorized operation; no hosted project has been linked or modified.

## Structure
- src/app/: composition, providers and layout
- src/components/ui/: shadcn-style accessible shared primitives (Button currently)
- src/lib/: typed Supabase client, i18n, configuration, formatting and authorization helpers
- src/locales/{en,bn}/: matching translation dictionaries
- src/modules/: all 22 module boundaries; planned directories only
- supabase/migrations/: append-only SQL migrations
- supabase/functions/_shared/: future secure service boundary
- tests/database/: migration and authorization tests; tests/e2e/: browser tests
- docs/: master requirements, architecture, security, setup and module specifications

Read PROJECT_PLAN.md for dependency order, DATABASE.md for database design, API.md for service contracts, and PROGRESS.md for verified status. GitHub Actions runs checks and browser tests without production secrets. Configure SPA rewrites to index.html when hosting built dist/ (see docs/DEPLOYMENT.md). Production deployment, backups, restore drills and security review are future gates.

## Authentication module and preview
Routes: /login, /forgot-password, /reset-password, /access, /account, /accept-invitation. Private routes require a session; database RLS/RPC authorization independently enforces privileges. Membership removal protects the last owner. Invite tokens are hashed at rest, expire in seven days, bind to the verified email and are consumed once. Links carry tokens in the URL fragment and are shared privately by an administrator; there is no automatic email sending service.

Apply both migrations only to an authorized development target. Configure the project Auth site URL and exact /reset-password redirect; keep public signup disabled. Provision the first verified test account through Supabase's trusted administration interface (never grant client service-role access), then sign in and create its organization. Test account creation and SMTP delivery are external prerequisites; do not represent mocked UI or embedded database tests as live Auth checks. See docs/modules/authentication.md and PROGRESS.md.

The redesigned workspace provides real search/category filtering and responsive navigation, with every operational module visibly planned. It contains no invented farm totals. Actual screenshots can be reproduced from a running local server with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium node scripts/capture-preview.mjs`; set PREVIEW_ARTIFACT_DIR to choose the output folder. No public deployment or shareable hosted preview has been created. [Lightweight local backend setup](docs/LOCAL_AUTH.md) includes secure account provisioning and actual integration-test commands.

## Preview on your own device
A cloud environment's localhost URL points back to the viewer's device and cannot be opened remotely without supported forwarding or hosting. Do not present cloud loopback links as publicly reachable previews.

`npm run preview:offline` builds a self-contained HTML UI preview with inline CSS/JavaScript, hash routing, Bangla/English switching and no backend credentials or external assets. Output: `/workspace/artifacts/farmlife/FarmLife_Preview.html`. Download it and open it in your own browser. Live sign-in is deliberately unavailable in this offline build; use the normal backend-connected app for authenticated workflows. Alternatively, run the project on your own computer with `npm ci` and `npm run dev`, then open that computer's localhost.

## Automatic Netlify updates
Netlify Git integration is configured by [netlify.toml](netlify.toml); see [the activation guide](docs/NETLIFY.md). Connect your Netlify site once to `ariyankhan-lab/niloy-project-agro`, production branch `main`. Verified changes pushed to main then trigger builds and deploy to the same HTTPS site URL; local unsaved edits do not. The build refuses local backend URLs/server keys, and can publish an honest UI-only preview when public Supabase settings are absent. Site linking and an actual successful hosted deploy must be verified separately from local configuration.
