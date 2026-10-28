import { useQuery } from '@tanstack/react-query'
import { useSession } from '../../../lib/auth/session'
import { loadAccess } from '../services/auth'
export function useAccess() {
 const {session,status}=useSession()
 return useQuery({queryKey:[session?.user.id,'authentication','access'],queryFn:()=>loadAccess(session!.user.id),enabled:status==='signedIn' && !!session,staleTime:0,refetchOnWindowFocus:true})
}
