import { supabase } from '../../../lib/supabase/client'
export function requireClient() { if(!supabase) throw new Error('UNCONFIGURED'); return supabase }
export { authErrorKey } from './errors'
export async function signIn(email: string,password: string) {
 const {error}=await requireClient().auth.signInWithPassword({email,password});if(error)throw error
}
export async function sendRecovery(email: string) {
 const {error}=await requireClient().auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`});if(error)throw error
}
export async function updatePassword(password: string) {
 const {error}=await requireClient().auth.updateUser({password});if(error)throw error
}
export async function signOut() {
 const {error}=await requireClient().auth.signOut();if(error)throw error
}
export async function loadAccess(userId: string) {
 const client=requireClient()
 const [memberships,organizations,branches,permissions,profile]=await Promise.all([
  client.from('memberships').select('*').eq('user_id',userId),
  client.from('organizations').select('*'),client.from('branches').select('*'),
  client.from('role_permissions').select('*'),client.from('profiles').select('*').eq('id',userId).single(),
 ])
 for(const result of [memberships,organizations,branches,permissions,profile])if(result.error)throw result.error
 return {memberships:memberships.data ?? [],organizations:organizations.data ?? [],branches:branches.data ?? [],permissions:permissions.data ?? [],profile:profile.data}
}
export const invitationColumns='id,organization_id,branch_id,email,role_key,created_at,expires_at,accepted_at,revoked_at' as const
