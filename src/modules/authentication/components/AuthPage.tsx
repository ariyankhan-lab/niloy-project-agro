import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, LockKeyhole, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useSession } from '../../../lib/auth/session'
import { supabaseConfig } from '../../../lib/config/env'
import { Button } from '../../../components/ui/button'
import { loginSchema, emailSchema, safeNext } from '../schemas/auth'
import { authErrorKey, signIn, sendRecovery } from '../services/auth'
import { FarmIllustration } from '../../../components/FarmIllustration'
export function AuthPage({recovery=false}:{recovery?:boolean}) {
 const {t}=useTranslation();const location=useLocation();const navigate=useNavigate();const {status}=useSession()
 const [error,setError]=useState('');const [sent,setSent]=useState(false);const [visible,setVisible]=useState(false)
 const {register,handleSubmit,formState:{errors,isSubmitting}}=useForm({resolver:zodResolver(recovery ? emailSchema.extend({password:z.string().optional()}) : loginSchema),defaultValues:{email:'',password:''}})
 async function submit(values:{email:string;password?:string}) {
  setError('');try {
   if(recovery){await sendRecovery(values.email);setSent(true)}
   else {await signIn(values.email,values.password!);navigate(safeNext(new URLSearchParams(location.search).get('next'))+location.hash,{replace:true})}
  }catch(err){setError(authErrorKey(err))}
 }
 return <section className="auth-grid">
 <div className="auth-story"><span className="eyebrow light">{t('auth.storyLabel')}</span><h1>{t('auth.storyTitle')}</h1><p>{t('auth.storyDescription')}</p><FarmIllustration/><div className="auth-story-foot"><ShieldCheck size={20}/><span>{t('auth.secure')}</span></div></div>
 <div className="auth-form-panel"><div className="icon-tile"><LockKeyhole size={24}/></div><h2>{t(recovery?'auth.recoveryTitle':'auth.loginTitle')}</h2><p className="muted">{t(recovery?'auth.recoveryDescription':'auth.loginDescription')}</p>
 {!supabaseConfig && <div role="status" className="notice notice-amber">{t('auth.unconfigured')}</div>}
 {status==='signedIn' && !recovery && <div className="notice"><Link to="/access">{t('auth.alreadySignedIn')} →</Link></div>}
 {sent ? <div role="status" className="notice">{t('auth.recoverySent')}</div> : <form onSubmit={handleSubmit(submit)} noValidate className="form-stack">
 <label htmlFor="email">{t('auth.email')}</label><input id="email" type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email} aria-describedby={errors.email?'email-error':undefined} placeholder="you@yourfarm.com"/>
 {errors.email && <p id="email-error" className="field-error">{t(errors.email.message!)}</p>}
 {!recovery && <><div className="field-label"><label htmlFor="password">{t('auth.password')}</label><Link to="/forgot-password">{t('auth.forgot')}</Link></div><div className="password-field"><input id="password" type={visible?'text':'password'} autoComplete="current-password" {...register('password')} aria-invalid={!!errors.password} aria-describedby={errors.password?'password-error':undefined}/><button type="button" onClick={()=>setVisible(!visible)} aria-label={t(visible?'auth.hidePassword':'auth.showPassword')}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>{errors.password && <p id="password-error" className="field-error">{t(errors.password.message!)}</p>}</>}
 {error && <p role="alert" className="field-error">{t(error)}</p>}
 <Button type="submit" disabled={!supabaseConfig || isSubmitting} className="w-full gap-2">{t(isSubmitting?'auth.working':recovery?'auth.sendRecovery':'auth.signIn')}<ArrowRight size={17}/></Button>
 </form>}
 <p className="auth-help">{t('auth.inviteOnly')}</p><Link className="text-link" to={recovery?'/login':'/'}>{t(recovery?'auth.backLogin':'auth.explore')}</Link>
 </div></section>
}
