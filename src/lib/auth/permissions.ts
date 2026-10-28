export const roles = ['owner','organization_admin','farm_manager','collection_manager','accountant','veterinarian','farm_worker','delivery_staff','report_viewer'] as const
export type Role = typeof roles[number]
export type Scope = { organizationId: string; branchId?: string }
export type Grant = { organizationId: string; branchId: string | null; permission: string }
// UI convenience only. Database policies independently authorize every request.
export function can(grants: readonly Grant[], permission: string, scope: Scope) {
 return grants.some(g => g.organizationId === scope.organizationId && g.permission === permission &&
  (g.branchId === null || (scope.branchId !== undefined && g.branchId === scope.branchId)))
}
