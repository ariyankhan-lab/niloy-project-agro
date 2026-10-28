# Lightweight local authentication development

The official full Supabase PostgreSQL image exceeded this managed Docker daemon's layer storage capacity. A small alternative has been **executed and verified locally**: official PostgreSQL 17 Alpine + Supabase GoTrue + PostgREST + Mailpit, with a loopback-only development gateway. This is not a production Supabase distribution and does not provide Storage, Realtime, Studio or Edge Functions.

## Start
From the existing checkout (Node 24, npm and managed Docker required):

```sh
npm ci
npm run dev:backend
# separate long-running terminals:
npm run dev:gateway
npm run dev -- --port 5173 --strictPort
```

The helper verifies ownership labels, retains its named PostgreSQL volume, applies unapplied migrations and restarts only its own containers when configuration changes. A lost development volume is detected and the schema is rebuilt from migrations; this is not a backup/restore mechanism for farm data. No existing remote project is linked or modified. Do not edit an already applied migration; create the next migration.

Fresh setup generates random local passwords and JWT signing material in `.local/auth-stack/` with private filesystem permissions. The helper creates `.env.local` only if absent, containing **only the local URL and public anonymous key**. Existing `.env.local` files are preserved. Never copy connection.json, state.json, env files, test mail or private debug artifacts into Git, a source archive, screenshots or chat. These are local development credentials, not production settings.

## Create your own account securely
No demo account/password is shipped. Provision a verified **local-only** account from your terminal as the trusted administrator:

```sh
read -r -p 'Email: ' LOCAL_DEV_EMAIL
read -r -s -p 'Password (12+ characters): ' LOCAL_DEV_PASSWORD
export LOCAL_DEV_EMAIL LOCAL_DEV_PASSWORD
npm run dev:create-user
unset LOCAL_DEV_EMAIL LOCAL_DEV_PASSWORD
```

Do not paste passwords into chat or commit a credential file. Then sign in, create your organization, and create private workspace invitations for other administrator-provisioned verified accounts. Existing account provisioning is deliberate; there is no public signup endpoint or automatic invitation email sender. Recovery email is captured in local Mailpit and is never delivered to external recipients.

## Verify

```sh
npm run check
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
npm run test:live
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:live:browser
npm run db:types
```

Live tests refuse nonlocal targets, create test-only users/organizations, and remove them in finally blocks. They exercise actual JWTs, RLS, scoped REST reads, privilege denial, profile writes, single-use invitation races, concurrent last-owner revocation, Mailpit delivery, browser login/bootstrap/invitation, logout guards and email/PKCE/password reset. Mocked unit tests remain separate. Generated TypeScript types come from the migrated PostgreSQL schema.

Bind ports are local-only: 54321 gateway, 54322 PostgreSQL, 54324 Mailpit, 54328 Auth and 54329 PostgREST. Do not expose the helper publicly. CI's normal unit/browser checks explicitly use an unconfigured backend, independent of `.env.local`.

## Stop
Stop the gateway terminal, then `npm run dev:backend:stop`. This stops only labeled FarmLife auth-development containers and preserves their database volume. The source helpers never prune other Docker resources. A production deployment needs a reviewed hosted or self-hosted Supabase configuration, real account/email administration, TLS, exact redirect domains, MFA/rate policy, monitoring and backup/restore verification.
