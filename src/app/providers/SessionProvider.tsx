import { useEffect, useState, type ReactNode } from 'react'
import { supabaseConfig } from '../../lib/config/env'
import { SessionContext, type SessionState } from '../../lib/auth/session'
export function SessionProvider({ children,onIdentityChange }: {children: ReactNode;onIdentityChange?:()=>void}) {
 const [state, setState] = useState<SessionState>({session:null, status:supabaseConfig ? 'loading' : 'unconfigured'})
 useEffect(() => {
  if (!supabaseConfig) return
  let active = true
  let currentUserId: string | null = null
  function applySession(session: SessionState['session'],error=false) {
   if(!active)return
   if(currentUserId!==(session?.user.id ?? null)) {currentUserId=session?.user.id ?? null;onIdentityChange?.()}
   setState({session,status:error?'error':session?'signedIn':'signedOut'})
  }
  let revision = 0
  let initialRevision = 0
  let unsubscribe: (() => void) | undefined
  void import('../../lib/supabase/client').then(async ({supabase}) => {
   if (!active || !supabase) return
   const {data:{subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
    revision++
    applySession(session)
   })
   unsubscribe = () => subscription.unsubscribe()
   initialRevision = revision
   const {data,error} = await supabase.auth.getSession()
   if (active && revision === initialRevision) applySession(data.session,!!error)
  }).catch(() => { if(active && revision === initialRevision) setState({session:null,status:'error'}) })
  return () => { active=false; unsubscribe?.() }
 }, [onIdentityChange])
 return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
}
