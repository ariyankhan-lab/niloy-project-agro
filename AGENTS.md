# FarmLife ERP contributor instructions
Read README.md, PROJECT_PLAN.md, PROGRESS.md, CHANGELOG.md, DATABASE.md, API.md and docs/MASTER_PLAN.md before work. Inspect existing implementation and working-tree changes. The uploaded six-page FarmLife ERP Complete Development Plan is the requirements source; its claims about earlier archives do not establish implemented code here.

## Scope and approval
- Current scope: Authentication & Roles and a truthful visual preview, approved by the user after the foundation. Implement exactly one approved module at a time; stop before Organization & Branches or any other business module. Local authentication acceptance is verified; do not imply production rollout or begin another module without approval.
- Each cloud task is isolated. Use the existing checkout; do not create a worktree unless explicitly requested.
- Do not fabricate functional screens, metrics, customers or farm data. Planned modules must remain visibly planned.
- Preserve existing functionality and user changes. Never reset or overwrite unrelated work.
- The user has authorized GitHub-to-Netlify automation. After user-approved work passes its relevant checks, commit only reviewed source/configuration and push main to the configured origin to trigger a connected Netlify site. Do not use a background file watcher or publish unfinished/failed changes. Never force-push, commit credentials/local runtime files, or run remote database migrations automatically. Preserve the module approval gate. Netlify site linking still requires the user’s account connection; do not claim deployment until an actual URL/result is verified.

## Architecture
Use strict TypeScript, React, Tailwind and the shared accessible UI primitives. Module-owned components/services/schemas/hooks/tests live under src/modules/<module>. Shared code must not import domain modules. Route and query boundaries must not allow cross-tenant data reuse. Query keys include user, organization, branch and filters; clear sensitive cached data on sign-out/scope changes when data fetching is implemented.

Use English/Bangla translation keys; BDT and Asia/Dhaka shared formatting. Store timestamptz in UTC; use date for business dates. Money is PostgreSQL numeric, transported as decimal strings for exact arithmetic. Do not calculate ledgers using JavaScript floating point.

Database authorization is mandatory: organization and branch scope, composite foreign keys, RLS, least privilege and fixed-search-path functions. Frontend role checks are convenience only. Never trust user-editable JWT metadata for roles. Never ship service-role credentials to the browser. No wildcard owner role across organizations.

## Completion gate
Deliver migrations, transactional backend logic, responsive bilingual UI, validation and allowed/denied permissions together. Test tenant isolation, invalid inputs, business invariants and concurrency. Run npm run check and npm run test:e2e, plus live database checks required by the module. Record actual executed counts and distinguish failed, skipped and unrun checks. Update module specs, PROGRESS.md and CHANGELOG.md after each completed step. Do not mark a module complete until its acceptance criteria pass. Stop after the approved scope.
