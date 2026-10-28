# Authentication & Roles
Status: implementation verified locally; production rollout not performed. See [specification](../../../docs/modules/authentication.md).

Components implement login, recovery/reset, access roles, first-organization bootstrap, invitations, member removal and profile settings. Services call Supabase Auth/REST/RPC using only the caller JWT; schemas use Zod/React Hook Form; hooks use user-scoped TanStack Query keys. Tests contain test-only fixtures and never populate the production UI with demo records.
