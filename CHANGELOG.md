# Changelog

## Unreleased — Netlify automation
- Added native Git-based Netlify build configuration, SPA rewrite, security headers and hosted-environment validation.
- Reject local API endpoints, partial backend settings, URL-embedded credentials and service-role/secret keys in hosted builds.
- Added seven deployment validation checks and documented the authorized verified-commit/push workflow.
- Clean-source Netlify build command passed lint/typecheck, 59 unit/database tests, seven deployment checks and production build.
- Existing target site supplied by the user; reviewed source and configuration pushed to GitHub main and remote SHA verified. Netlify account-side Git connection activation and successful hosted auto-deploy are not yet verified.

## Unreleased — Preview access correction
- Provisioned a local-only default administrator at the user’s explicit request; verified real login/owner access without committing credentials.
- Corrected guidance about cloud localhost versus the viewer's own device.
- Added credential-free single-file HTML preview generation, embedded assets and hash routing for a downloadable UI preview.
- Verified the artifact's UI via temporary HTTP transport without external asset/backend requests; managed browser file:// transport is blocked and remains unverified.
- Excluded generated/private .local files from linting. No public hosting or forwarding is claimed.

## 0.2.0 — 2026-10-28 — Authentication and working preview
- Redesigned the bilingual workspace with responsive sidebar/mobile navigation, real module filtering/search and local farm illustration; operational modules remain visibly planned.
- Implemented login, recovery/reset, protected routes, account settings, permission loading and identity cache clearing.
- Added audited organization bootstrap, private single-use invitations, verified-email acceptance, member administration and last-owner protection with serialized access changes.
- Added profile creation/backfill and invitation RLS/column privileges; generated Supabase types from actual migrated PostgreSQL.
- Built and verified a lightweight local PostgreSQL/Supabase Auth/PostgREST/Mailpit stack after the full image exceeded Docker layer storage capacity. No external project was changed.
- Fixed a hidden password-field validation issue in the recovery form, development CORS schema headers and generated-type optional-argument compatibility found by actual tests.
- Passed lint/typecheck/build, 59 unit/database tests, 12 desktop/mobile checks, 26 actual Auth/REST/concurrency/email checks and five real browser workflow groups (including PKCE recovery/reset).
- Removed integration fixtures; kept all local credential files ignored and excluded from source distribution. No demo accounts or farm data are shipped.
- Saved actual English/Bangla/login/mobile preview images and updated architecture/setup/progress documentation. No public deployment, commit or push performed.

## 0.1.0 — 2026-10-28 — Foundation
- Inspected empty repository and reconciled the complete six-page FarmLife ERP development plan.
- Established React, TypeScript, Vite, Tailwind, routing, shared accessible Button, query and session providers.
- Added optional validated Supabase public configuration and typed database client; deferred SDK loading until configured.
- Prepared all 22 module boundaries/specifications with explicit planned status.
- Added English/Bangla translations, persisted locale, BDT display and Asia/Dhaka date formatting.
- Added identity/tenancy migration, nine roles, permission helpers, tenant/location constraints and fail-closed RLS/grants.
- Documented schema, backend contracts, dependency order, acceptance gates, security and environment/deployment setup.
- Added lint, typecheck, unit/database/browser testing infrastructure and GitHub Actions.
- Fixed malformed URL validation and stale session-result races found during foundation verification.
- Final validation after clean lockfile install: lint/typecheck/build, 30 unit/database tests and four desktop/mobile browser tests passed. Verified development-server HTTP response.
- Saved reusable install_script and start_skill in the environment draft; publication remains a user action.
- Local Supabase validation blocked by managed Docker storage exhaustion after supported registry fallback. No hosted migration or deployment performed.

At 0.1.0, authentication workflows and business modules were not implemented. Authentication implementation was subsequently approved and delivered in 0.2.0; further modules require approval.
