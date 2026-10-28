import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState,useCallback, type ReactNode } from 'react'
import { SessionProvider } from './SessionProvider'
export function AppProviders({ children }: {children: ReactNode}) {
 const [client] = useState(() => new QueryClient({defaultOptions:{queries:{staleTime:30_000,retry:1,refetchOnWindowFocus:false}}}))
 const clearIdentityCache=useCallback(()=>client.clear(),[client])
 return <QueryClientProvider client={client}><SessionProvider onIdentityChange={clearIdentityCache}>{children}</SessionProvider></QueryClientProvider>
}
