import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { passwordSchema } from '../schemas/auth'
import { authErrorKey,updatePassword } from '../services/auth'
import { Button } from '../../../components/ui/button'
export function ResetPasswordPage() {
 const {t}=useTranslation();const [error,setError]=useState('');const [done,setDone]=useState(false)
 const {register,handleSubmit,formState:{errors,isSubmitting}}=useForm({resolver:zodResolver(passwordSchema)})
 return <section className="content-card narrow"><h1>{t('auth.resetTitle')}</h1><p className="muted">{t('auth.resetDescription')}</p>{done?<div role="status" className="notice">{t('auth.passwordUpdated')} <Link to="/access">{t('auth.accessTitle')}</Link></div>:<form className="form-stack" noValidate onSubmit={handleSubmit(async values=>{setError('');try{await updatePassword(values.password);setDone(true)}catch(err){setError(authErrorKey(err))}})}>
 <label htmlFor="new-password">{t('auth.newPassword')}</label><input id="new-password" type="password" autoComplete="new-password" {...register('password')}/>{errors.password && <p className="field-error">{t(errors.password.message!)}</p>}
 <label htmlFor="confirm-password">{t('auth.confirmPassword')}</label><input id="confirm-password" type="password" autoComplete="new-password" {...register('confirm')}/>{errors.confirm && <p className="field-error">{t(errors.confirm.message!)}</p>}
 {error && <p role="alert" className="field-error">{t(error)}</p>}<Button disabled={isSubmitting} type="submit">{t('auth.updatePassword')}</Button></form>}</section>
}
