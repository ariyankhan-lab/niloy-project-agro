import { render,screen,waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter,Route,Routes } from 'react-router-dom'
import { beforeEach,expect,it,vi } from 'vitest'
import { AuthPage } from '../components/AuthPage'
import i18n from '../../../lib/i18n'
const services=vi.hoisted(()=>({signIn:vi.fn(),sendRecovery:vi.fn()}))
vi.mock('../../../lib/config/env',()=>({supabaseConfig:{url:'https://test.supabase.co',key:'public-test'}}))
vi.mock('../services/auth',async importOriginal=>{const original=await importOriginal<typeof import('../services/auth')>();return {...original,signIn:services.signIn,sendRecovery:services.sendRecovery}})
beforeEach(async()=>{services.signIn.mockReset().mockResolvedValue(undefined);services.sendRecovery.mockReset().mockResolvedValue(undefined);await i18n.changeLanguage('en')})
function view(recovery=false,path='/login'){
 return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/login" element={<AuthPage recovery={recovery}/>}/><Route path="/access" element={<h2>Authorized access destination</h2>}/><Route path="/accept-invitation" element={<h2>Invitation destination</h2>}/></Routes></MemoryRouter>)
}
it('validates required fields before sending credentials',async()=>{
 view();await userEvent.click(screen.getByRole('button',{name:'Sign in'}))
 expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();expect(services.signIn).not.toHaveBeenCalled()
})
it('submits credentials and uses the safe destination',async()=>{
 view(false,'/login?next=https://untrusted.example')
 await userEvent.type(screen.getByLabelText('Email address'),'USER@example.test');await userEvent.type(screen.getByLabelText('Password',{exact:true}),'private-test-password')
 await userEvent.click(screen.getByRole('button',{name:'Sign in'}))
 await waitFor(()=>expect(services.signIn).toHaveBeenCalledWith('user@example.test','private-test-password'))
 expect(await screen.findByRole('heading',{name:'Authorized access destination'})).toBeInTheDocument()
})
it('shows safe translated errors without backend details',async()=>{
 services.signIn.mockRejectedValue(new Error('Invalid login credentials'))
 view();await userEvent.type(screen.getByLabelText('Email address'),'user@example.test');await userEvent.type(screen.getByLabelText('Password',{exact:true}),'incorrect')
 await userEvent.click(screen.getByRole('button',{name:'Sign in'}))
 expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.')
})
it('recovery success does not disclose account existence',async()=>{
 view(true);await userEvent.type(screen.getByLabelText('Email address'),'unknown@example.test');await userEvent.click(screen.getByRole('button',{name:'Send recovery link'}))
 expect(await screen.findByRole('status')).toHaveTextContent('If this email has an account')
 expect(services.sendRecovery).toHaveBeenCalledWith('unknown@example.test')
})
