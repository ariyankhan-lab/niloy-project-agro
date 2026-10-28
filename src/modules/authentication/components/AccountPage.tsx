import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from '../../../lib/auth/session'
import { Button } from '../../../components/ui/button'
import { useAccess } from '../hooks/useAccess'
import { requireClient,authErrorKey } from '../services/auth'
export function AccountPage(){
 const {t,i18n}=useTranslation();const {session}=useSession();const access=useAccess();const cache=useQueryClient()
 const [editedName,setName]=useState<string|null>(null);const [editedLanguage,setLanguage]=useState<string|null>(null);const [error,setError]=useState('');const [done,setDone]=useState(false);const [busy,setBusy]=useState(false)
 const name=editedName ?? access.data?.profile?.display_name ?? '';const language=editedLanguage ?? access.data?.profile?.language ?? 'en'
 if(access.isPending)return <p role="status">{t('auth.loadingAccess')}</p>
 if(access.isError)return <p role="alert">{t('auth.accessFailed')}</p>
 return <section className="content-card narrow"><h1>{t('auth.accountTitle')}</h1><p className="muted">{session?.user.email}</p><form className="form-stack" onSubmit={async event=>{event.preventDefault();setDone(false);setError('');setBusy(true);try{const result=await requireClient().from('profiles').update({display_name:name.trim(),language:language==='bn'?'bn':'en'}).eq('id',session!.user.id).select('id').single();if(result.error)throw result.error;await i18n.changeLanguage(language);await cache.invalidateQueries({queryKey:[session?.user.id,'authentication']});setDone(true)}catch(err){setError(authErrorKey(err))}finally{setBusy(false)}}}><label htmlFor="display-name">{t('auth.displayName')}</label><input id="display-name" value={name} maxLength={200} onChange={e=>setName(e.target.value)}/><label htmlFor="account-language">{t('auth.language')}</label><select id="account-language" value={language} onChange={e=>setLanguage(e.target.value)}><option value="en">English</option><option value="bn">বাংলা</option></select>{error && <p role="alert" className="field-error">{t(error)}</p>}{done && <p role="status">{t('auth.saved')}</p>}<Button type="submit" disabled={busy}>{t(busy?'auth.working':'auth.saveProfile')}</Button></form></section>
}
