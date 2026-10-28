import { lazy,Suspense } from 'react'
import { Link,Route,Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppShell } from './layout/AppShell'
import { OverviewPage } from './OverviewPage'
const AuthPage=lazy(()=>import('../modules/authentication/components/AuthPage').then(module=>({default:module.AuthPage})))
import { RequireSession } from '../modules/authentication/components/RequireSession'
const AccessPage=lazy(()=>import('../modules/authentication/components/AccessPage').then(module=>({default:module.AccessPage})))
const ResetPasswordPage=lazy(()=>import('../modules/authentication/components/ResetPasswordPage').then(module=>({default:module.ResetPasswordPage})))
const AccountPage=lazy(()=>import('../modules/authentication/components/AccountPage').then(module=>({default:module.AccountPage})))
const AcceptInvitationPage=lazy(()=>import('../modules/authentication/components/AcceptInvitationPage').then(module=>({default:module.AcceptInvitationPage})))
export function App(){
 const {t}=useTranslation()
 return <AppShell><Suspense fallback={<p role="status">{t('auth.checking')}</p>}><Routes><Route path="/" element={<OverviewPage/>}/><Route path="/login" element={<AuthPage/>}/><Route path="/forgot-password" element={<AuthPage recovery/>}/><Route path="/access" element={<RequireSession><AccessPage/></RequireSession>}/><Route path="/account" element={<RequireSession><AccountPage/></RequireSession>}/><Route path="/reset-password" element={<RequireSession><ResetPasswordPage/></RequireSession>}/><Route path="/accept-invitation" element={<RequireSession><AcceptInvitationPage/></RequireSession>}/><Route path="*" element={<section className="content-card"><h1>{t('notFound')}</h1><Link to="/" className="text-link">{t('home')}</Link></section>}/></Routes></Suspense></AppShell>
}
