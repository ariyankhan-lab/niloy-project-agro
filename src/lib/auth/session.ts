import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'
export type SessionState = { session: Session | null; status: 'unconfigured' | 'loading' | 'signedOut' | 'signedIn' | 'error' }
export const SessionContext = createContext<SessionState>({ session: null, status: 'loading' })
export const useSession = () => useContext(SessionContext)
