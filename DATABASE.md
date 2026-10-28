# Database architecture

## Implemented foundation
Migration: supabase/migrations/20261028000100_identity_and_tenancy_foundation.sql.

| Table | Purpose | Client access |
| --- | --- | --- |
| organizations | Tenant owner, fixed BDT and Asia/Dhaka defaults | Read if member |
| branches | Farm, collection_center or distribution location | Read permitted organization/branch |
| farms | Farm subtype linked to exactly one farm branch | Read permitted branch |
| profiles | Auth user display name and language | Read/update self; only name/language mutable |
| roles | Nine fixed role definitions | Authenticated read |
| role_permissions | Explicit permission catalog by role | Authenticated read |
| memberships | User + tenant + optional branch + role grants | Self or authorized tenant admin read |
| audit_logs | Server-written event identity and actor | Explicit audit.read grant |

Organizations own branches. A farm is a subtype of a farm branch, not a sibling tenant. Farm-specific domain records will carry organization_id and farm_id; farm_id resolves to the branch for permission checks. Collection/distribution domains carry organization_id and branch_id. Scope foreign keys must preserve the organization. Do not introduce two conflicting farm/branch authorization paths.

All IDs are UUIDs. All implemented FK lookups have supporting indexes (including composite indexes/uniqueness). Names and enum-like values have checks; role grants use NULLS NOT DISTINCT uniqueness to prevent duplicate organization-wide membership. UTC timestamptz timestamps are touched on mutable row updates. Branch kind cannot change away from farm while a farm row references it. Domain deletion/archival rules are future module decisions; avoid cascades that destroy business history.

## Authorization
Every public foundation table has RLS enabled. Anonymous clients have no grants. All writes are denied except updates of one's own profile display_name/language. Direct organization/membership table writes remain denied. The authentication migration adds narrowly authorized transactional RPCs; these are the only client access-mutation entry points.

Membership branch_id NULL grants organization-wide scope; non-null grants exactly that branch. Owners and organization administrators must be organization-scoped. Other roles can be explicitly assigned organization-wide by a future authorized provisioning service. Multiple memberships are additive. No membership means no tenant access. No role is a platform superuser. Role definitions are global nonsecret metadata; role assignments are tenant-specific.

private.is_member and private.has_permission are stable SECURITY DEFINER functions with empty search_path and explicit grants. They read current memberships using auth.uid(), avoiding recursive membership RLS. The migration-owning database role must remain trusted; do not grant ownership to application users. Owner/service-role RLS bypass is deliberate for server operations and must never reach browser clients. Functions are outside exposed API schemas. No business authorization is taken from user metadata.

Only foundation permissions are seeded: organization.read, branch.read, membership.read, audit.read. Operational permissions do not exist yet. The authentication migration adds membership.manage for organization owners/admins and transactional audit writes for access changes. Generic domain audit capture is not implemented. Future services must emit durable audit entries in the same transaction and avoid storing credentials or unnecessary PII in audit payloads.

## Migration conventions
- UTC filenames: YYYYMMDDHHMMSS_description.sql; append-only after application. Review transactions, locking and deployment order.
- Add constraints, indexes, RLS and explicit grants together. Avoid destructive resets outside disposable local testing.
- New domain tables require organization scope and composite tenant FKs, no permissive defaults.
- Financial amounts: numeric(18,2); quantities/weights numeric with domain-approved scale; dates are date; instants timestamptz. Transport exact decimal text and use decimal arithmetic.
- Financial postings/stock movements use atomic functions with row locking, idempotency keys and concurrency tests. Posted history is immutable; use reversals.
- Regenerate database.types.ts from a local migrated database with npm run db:types; never derive contracts from nonexistent tables. The contract has been generated from the migrated local PostgreSQL schema; the generator supports the lightweight stack or standard Supabase local mode and preserves existing types on failure.
- Test fresh apply, upgrades against realistic prior state, RLS denies, scope FK violations and integrity. Backups/restore verification precede production migrations.

## Proposed domain tables (not created)
See docs/modules/ for every table group from the master plan. Sheds/pens, animals, lifetime events/transfers/relationships, milk, farmer collection, feed, health, breeding, growth/fattening, inventory, purchasing, sales, delivery, journals, employees and notifications are planned. Reporting, attachments, farm settings and AI retrieval require separately approved schemas/policies.

## Nonnegotiable future invariants
Unique cattle ID per farm; preserve sold/dead history. Atomic nonnegative stock unless explicitly authorized. Balanced journals with immutable posted lines and reversal corrections. Reconcile milk production/collection/allocation/sales/stock. Separate revenue recognition from payment and inventory purchases from consumption expense. Cross-farm transfers require source/destination authority and approval history; exclude internal turnover from consolidated revenue/profit. Avoid animal-cost duplication.

## Authentication migration
20261028000200_authentication_and_invitations.sql adds invitations, Auth profile creation/backfill and six RPCs:
- bootstrap_organization(name): verified nonmember only; advisory user lock, organization/owner/audit in one transaction. It grants access only to the newly created tenant.
- create_invitation(org,email,role,branch): org owner/admin only; only owners can grant owner/admin. Stores SHA-256 of a random 256-bit token, returns the raw value once. Branch FK and privileged role scope constraints apply.
- accept_invitation(token): locks invite and organization, checks verified recipient email, expiry, unused/unrevoked state and inviter's current authority; inserts membership and audit atomically.
- revoke_invitation(id): current authorized org admin; owner required for privileged invitations. Consumed/revoked invitations cannot be revoked again.
- revoke_membership(id): locks organization and target membership; owner/admin restrictions and last-owner protection; audited revocation.
- list_organization_members(org): verified, authorized org admin only; returns member display names/emails for access administration. Ordinary members cannot enumerate these identities.

Every function fixes search_path and is denied to anonymous/public roles. Invitations use RLS; only admin metadata columns are selectable, never token_hash. Profiles are automatically created from auth.users inserts without trusting user metadata. Auth account deletion through trusted administration must transfer ownership first; administrative SQL/Auth deletion can bypass application-level last-owner guards.

No hosted migration is applied. Both migrations have been applied successfully to local PostgreSQL 17 and embedded PostgreSQL. Actual GoTrue/PostgREST/SMTP tests verify JWT/RLS behavior, one-success concurrent invitation acceptance and concurrent last-owner preservation. Real browser tests verify login/bootstrap/invitations/profile/logout and recovery email/PKCE/reset. The full hosted Supabase platform and production deployment remain separate verification targets. Do not disable RLS to work around deployment prerequisites.
