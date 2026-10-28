# Authentication & Roles
Status: implementation verified locally; production rollout not performed. Approved after the foundation when the user requested PDF-based software and a preview.

## Implemented
- Bilingual login, safe next-route allowlist, password visibility, form validation and safe errors.
- Recovery request with neutral account-existence messaging; authenticated password reset (minimum 12 characters).
- SDK session lifecycle, refresh/logout handling, subscription cleanup, stale-result protection and identity cache clearing.
- Session-guarded access/profile/invitation routes; permission loading from RLS-protected database grants, never editable user metadata.
- Confirmed nonmember creates a new organization and its own owner role transactionally; no preexisting tenant access is granted.
- Owner/admin creates single-use, seven-day invitation for an existing verified account; raw token returned once, SHA-256 stored, private link fragment. Email binding, issuer authority and scope are rechecked when accepting.
- Owner/admin member identity listing, membership revocation, invitation revocation and last-owner protection; organization admins cannot grant/remove owner/admin access.
- Self-only profile name/language changes. Profile row trigger/backfill does not trust user metadata.
- Access changes emit same-transaction audit identities.

## External prerequisites and limitations
A configured development backend, both applied migrations, exact Auth redirects and trusted administrator-created verified accounts are required for live flows. A lightweight local backend has been prepared; see ../LOCAL_AUTH.md. Public signup remains disabled. No automatic invitation-email/account-provisioning Edge Function exists; account provisioning and private invitation sharing are explicit administrator workflows. Recovery mail requires working Supabase SMTP. No service credentials are included in browser code or test artifacts.

The initial full stack failed Docker image extraction. The supported components were then run with small official PostgreSQL Alpine; local GoTrue/PostgREST/Mailpit and actual browser workflows passed. PGlite and mocked UI tests are additional independent checks. Hosted production behavior is not implied.

## Production rollout acceptance (local counterparts verified)
1. Apply migrations to an authorized disposable Supabase development project; generate/compare database types.
2. Provision two verified users plus an unverified user using trusted administration. Verify real password login, failed login, recovery mail, PKCE callback, reset and logout.
3. Bootstrap the owner, create private branch/organization invites, accept with intended email and reject wrong/expired/used/revoked links.
4. Test REST/RPC denial for anonymous, unverified, cross-tenant, cross-branch and revoked callers; verify admin escalation denial and private member identities.
5. Test concurrent invitation consumption, revocation and last-owner removal on independent connections.
6. Confirm audit writes and cache removal across account changes, run all automated checks, update verified status and stop for approval before Organization & Branches.
