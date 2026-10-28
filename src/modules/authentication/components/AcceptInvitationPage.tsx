import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation,useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { requireClient,authErrorKey } from '../services/auth'
import { useSession } from '../../../lib/auth/session'
import { Button } from '../../../components/ui/button'
export function AcceptInvitationPage() {
 const {t}=useTranslation();const location=useLocation();const navigate=useNavigate();const cache=useQueryClient();const {session}=useSession()
 const [error,setError]=useState('');const [busy,setBusy]=useState(false)
 const token=new URLSearchParams(location.hash.slice(1)).get('token')
 return <section className="content-card narrow"><h1>{t('auth.acceptTitle')}</h1><p className="muted">{t('auth.acceptDescription')}</p><p>{session?.user.email}</p>{!token && <p role="alert" className="field-error">{t('auth.invalidInvitation')}</p>}{error && <p role="alert" className="field-error">{t(error)}</p>}<Button disabled={!token||busy} onClick={async()=>{setBusy(true);setError('');try{const result=await requireClient().rpc('accept_invitation',{invitation_token:token!});if(result.error)throw result.error;await cache.invalidateQueries({queryKey:[session?.user.id,'authentication']});navigate('/access',{replace:true})}catch(err){setError(authErrorKey(err))}finally{setBusy(false)}}}>{t(busy?'auth.working':'auth.acceptInvitation')}</Button></section>
}
