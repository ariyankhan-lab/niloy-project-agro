# API and service architecture

## Current implemented boundary
The browser creates a typed Supabase client only when both validated public settings are present. Auth uses PKCE, SDK session persistence and refresh. Session subscription is cleaned up on unmount. TanStack Query loads user-keyed access/profile/tenant data. Identity changes clear its cache; token refresh preserves it. No operational domain endpoints exist. Session presence alone grants no UI or database privilege.

Supabase REST read access is limited by table grants/RLS (DATABASE.md). There are no deployed Edge Functions. The authentication module implements login, recovery/reset, profile updates, permission loading, protected routes and the six audited access RPCs listed in DATABASE.md. No operational business routes are enabled. Live local Auth/REST/SMTP and browser acceptance has passed; account provisioning and invitation mail delivery remain trusted administrator tasks.

## Planned service contract
- Authenticate bearer tokens with Supabase Auth; reject absent/invalid tokens. Validate all inputs with Zod at the UI and server boundary.
- Resolve memberships server-side and enforce organization/location permission for every operation. Do not trust caller-provided organization_id or role claims without authorization.
- Use caller JWT clients so RLS remains active. Any service-role workflow requires explicit authorization first and an audited transactional database function.
- Use transactions for provisioning, animal transfer, stock movement, settlement and journal posting. Include idempotency keys and reject conflicting retries.
- Stable error codes: UNAUTHENTICATED, FORBIDDEN, VALIDATION_FAILED, CONFLICT, INSUFFICIENT_STOCK, PERIOD_CLOSED. Return localized UI messages via keys, never raw SQL or secrets.
- Query keys: [userId, organizationId, branchId, module, resource, filters]. Clear sensitive caches and unsubscribe on identity/scope change. Never perform consolidated queries in the browser across unauthorized locations.
- Storage uses private buckets with organization/location object paths and independent policies. Signed URLs are short-lived; no public cattle/health/employee records by default. Storage configuration is planned.

Authentication module acceptance must include invitation lifecycle, secure first-owner provisioning, expired sessions, logout cache clearing and nonmember/role-denial tests before any domain UI is enabled.
