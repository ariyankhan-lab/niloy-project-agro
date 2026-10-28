import { useState } from 'react'
import { useQuery,useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSession } from '../../../lib/auth/session'
import { requireClient,authErrorKey } from '../services/auth'
import { Button } from '../../../components/ui/button'
export function MemberManager({organizationId,isOwner}:{organizationId:string;isOwner:boolean}) {
 const {t}=useTranslation();const {session}=useSession();const cache=useQueryClient();const [busy,setBusy]=useState(false);const [error,setError]=useState('')
 const queryKey=[session?.user.id,organizationId,'authentication','members']
 const members=useQuery({queryKey,queryFn:async()=>{const result=await requireClient().rpc('list_organization_members',{target_organization:organizationId});if(result.error)throw result.error;return result.data},staleTime:0})
 return <section className="content-card"><h2>{t('auth.membersTitle')}</h2><p className="muted">{t('auth.membersDescription')}</p>{error && <p role="alert" className="field-error">{t(error)}</p>}{members.isPending?<p role="status">{t('auth.loadingAccess')}</p>:members.isError?<p role="alert">{t('auth.accessFailed')}</p>:<ul className="invitation-list">{members.data.map(member=><li key={member.membership_id}><div><strong>{member.display_name||member.email}</strong><p className="muted text-sm">{member.display_name?`${member.email} · `:''}{t(`roles.${member.role_key}`)}{member.user_id===session?.user.id?` · ${t('auth.you')}`:''}</p></div><Button variant="outline" disabled={busy||(!isOwner&&['owner','organization_admin'].includes(member.role_key))} onClick={async()=>{if(!window.confirm(t('auth.confirmRemove')))return;setBusy(true);setError('');try{const result=await requireClient().rpc('revoke_membership',{membership_id:member.membership_id});if(result.error)throw result.error;await cache.invalidateQueries({queryKey});await cache.invalidateQueries({queryKey:[session?.user.id,'authentication']})}catch(err){setError(authErrorKey(err))}finally{setBusy(false)}}}>{t('auth.removeAccess')}</Button></li>)}</ul>}</section>
}
