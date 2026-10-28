import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { useSession } from '../../lib/auth/session'
import { SessionProvider } from './SessionProvider'
const mock = vi.hoisted(() => ({ getSession:vi.fn(), subscribe:vi.fn(), unsubscribe:vi.fn() }))
vi.mock('../../lib/config/env',()=>({supabaseConfig:{url:'https://test.supabase.co',key:'test-public'}}))
vi.mock('../../lib/supabase/client',()=>({supabase:{auth:{getSession:mock.getSession,onAuthStateChange:mock.subscribe}}}))
function Status() { return <p role="status">{useSession().status}</p> }
beforeEach(() => {
 mock.getSession.mockReset();mock.subscribe.mockReset();mock.unsubscribe.mockReset()
 mock.subscribe.mockReturnValue({data:{subscription:{unsubscribe:mock.unsubscribe}}})
 mock.getSession.mockResolvedValue({data:{session:null},error:null})
})
it('resolves signed out and cleans up subscriptions',async () => {
 const view=render(<SessionProvider><Status/></SessionProvider>)
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('signedOut'))
 view.unmount();expect(mock.unsubscribe).toHaveBeenCalledOnce()
})
it('reports failed session requests',async () => {
 mock.getSession.mockRejectedValue(new Error('network'))
 render(<SessionProvider><Status/></SessionProvider>)
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('error'))
})
it('does not replace a newer auth event with a stale session result',async () => {
 let resolve: (value: unknown)=>void = ()=>{}
 mock.getSession.mockReturnValue(new Promise(r=>{resolve=r}))
 render(<SessionProvider><Status/></SessionProvider>)
 await waitFor(()=>expect(mock.subscribe).toHaveBeenCalledOnce())
 await act(async () => { mock.subscribe.mock.calls[0][0]('SIGNED_IN',{user:{id:'test-user'}}); resolve({data:{session:null},error:null}) })
 expect(screen.getByRole('status')).toHaveTextContent('signedIn')
})
it('does not replace a newer auth event with a stale request error',async () => {
 let reject: (error: Error)=>void = ()=>{}
 mock.getSession.mockReturnValue(new Promise((_resolve,r)=>{reject=r}))
 render(<SessionProvider><Status/></SessionProvider>)
 await waitFor(()=>expect(mock.subscribe).toHaveBeenCalledOnce())
 await act(async () => { mock.subscribe.mock.calls[0][0]('SIGNED_IN',{user:{id:'test-user'}}); reject(new Error('stale network error')) })
 expect(screen.getByRole('status')).toHaveTextContent('signedIn')
})
it('clears identity-dependent caches on sign-in and sign-out, not token refresh',async()=>{
 const clear=vi.fn()
 render(<SessionProvider onIdentityChange={clear}><Status/></SessionProvider>)
 await waitFor(()=>expect(screen.getByRole('status')).toHaveTextContent('signedOut'))
 await act(async()=>{mock.subscribe.mock.calls[0][0]('SIGNED_IN',{user:{id:'first'}})})
 expect(clear).toHaveBeenCalledTimes(1)
 await act(async()=>{mock.subscribe.mock.calls[0][0]('TOKEN_REFRESHED',{user:{id:'first'}})})
 expect(clear).toHaveBeenCalledTimes(1)
 await act(async()=>{mock.subscribe.mock.calls[0][0]('SIGNED_OUT',null)})
 expect(clear).toHaveBeenCalledTimes(2);expect(screen.getByRole('status')).toHaveTextContent('signedOut')
})
