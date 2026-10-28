# Automatic Netlify previews from GitHub

## What is prepared
`netlify.toml` declares Node 24, `npm run check:netlify`, the `dist` output and the SPA rewrite for /login, /access and other deep links. Netlify's native Git integration is the deployment trigger; no Netlify token or browser service key is committed. The build runs lint, typecheck, unit/database tests, hosted-environment tests and Vite production build. GitHub Actions additionally runs desktop/mobile browser tests.

## Existing target site
User-supplied site: https://stupendous-mousse-57e344.netlify.app. Preserve this site and URL. Its Git connection/build settings have not been verified or changed by the agent.

## One-time activation in the user's Netlify account
For an existing Netlify site, connect its build repository to **ariyankhan-lab/niloy-project-agro**, select **main** as the production branch, and permit Netlify's GitHub integration to read this repository. For a new site, import that repository from GitHub. Use the existing site when retaining its current URL; do not create duplicate sites unnecessarily.

Netlify reads netlify.toml from the root: base directory is the repository root, build command is `npm run check:netlify`, publish directory is `dist`. Enable automatic builds. Enable Deploy Previews for pull requests if desired. A manually dropped ZIP is not linked to GitHub until this connection is made.

This account connection cannot be activated by local configuration alone. No Netlify account binding/token/site ID is present in the current cloud runtime. GitHub read-only Git access is available; GitHub REST API calls were denied by network policy. Do not ask for passwords or tokens in chat. If no supported authenticated connection exists, the user must perform this one-time connection in Netlify. Do not claim live auto-deployment merely because files were committed or pushed.

## Update lifecycle
1. Implement only user-approved work, update progress/changelog and run required checks.
2. Review the diff and untracked files; omit .env.local, .local/, local users/passwords, node_modules, dist and test artifacts.
3. Commit the verified changes and push main to the configured GitHub origin (authorized by the user's auto-deploy request). Never force-push or bypass failures.
4. The connected Netlify site automatically builds that revision. A failed Netlify build leaves the last successful deployment live.
5. Visit the site's stable HTTPS address and reload after the new deployment succeeds. This is automatic deployment of pushed commits, not live editing/HMR of arbitrary unsaved workspace changes.

The agent should perform this lifecycle after future approved changes; a filesystem watcher must not publish every keystroke. Unapproved modules must not start simply because deployment is automated. GitHub branch protection and required CI checks can be enabled by an authorized repository administrator; this configuration does not claim to enforce remote branch protection. Native Netlify builds run their declared checks; GitHub browser checks remain separate unless remote required-status settings are configured.

## Backend settings
For a UI-only preview, leave both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` unset. Login stays explicitly unavailable.

For live authentication, set both **public** settings in Netlify's build environment to a hosted Supabase project and its publishable/legacy anon key. Set Supabase Auth's site URL and exact /reset-password redirect to the real Netlify domain. Migrations/account provisioning are a separately authorized operation. Never publish localhost API URLs, service_role keys, database passwords or the development default password. The hosted build rejects local/IP/private endpoints, partial configuration and nonpublic keys.

The local development account/database is not uploaded to Netlify. The frontend deployment does not create production admins, migrate PostgreSQL or deploy the local gateway, Docker containers, Storage or Edge Functions. Do not expose the local development gateway publicly.

## GitHub source publication
The reviewed application and Netlify configuration were pushed to main successfully. Read-only Git verification matched initial source commit bc15c0f0f1b8e1cc8b7090b6cf93537de750514f. GitHub REST calls and direct checks of the Netlify site are blocked by this runtime’s egress policy; no deployment success is inferred. Netlify account-side repository linking remains the required activation step.

## Verification and unresolved activation
Local checks verify the source and production bundle. After site linking, verify the actual Netlify deploy identifies the expected Git commit, the root page loads, /login works as a direct URL, static assets load, and the UI/backend status is accurate. Copy the real Netlify URL into the handoff only after it exists. Hosted deployment and future automatic redeploy are not verified until Netlify observes an actual pushed revision.
