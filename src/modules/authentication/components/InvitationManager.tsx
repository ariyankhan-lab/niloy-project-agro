import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery,useQueryClient } from '@tanstack/react-query'
import { Button } from '../../../components/ui/button'
import { roles } from '../../../lib/auth/permissions'
import { useSession } from '../../../lib/auth/session'
import { formatDate } from '../../../lib/format'
import { requireClient,authErrorKey,invitationColumns } from '../services/auth'
import { invitationSchema } from '../schemas/auth'
export function InvitationManager({organizationId,branches,isOwner}:{organizationId:string;branches:{id:string;name:string}[];isOwner:boolean}) {
 const {t,i18n}=useTranslation();const {session}=useSession();const cache=useQueryClient()
 const [email,setEmail]=useState('');const [role,setRole]=useState('farm_worker');const [branch,setBranch]=useState('');const [link,setLink]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [copied,setCopied]=useState(false)
 const queryKey=[session?.user.id,organizationId,'authentication','invitations']
 const invitations=useQuery({queryKey,queryFn:async()=>{const result=await requireClient().from('invitations').select(invitationColumns).eq('organization_id',organizationId).order('created_at',{ascending:false});if(result.error)throw result.error;return result.data},staleTime:0})
 return <section className="content-card"><h2>{t('auth.inviteTitle')}</h2><p className="muted">{t('auth.inviteDescription')}</p>
 <form className="invite-form" noValidate onSubmit={async event=>{event.preventDefault();setError('');setLink('');const parsed=invitationSchema.safeParse({email,role,branch});if(!parsed.success){setError(parsed.error.issues[0].message);return}setBusy(true);try{const result=await requireClient().rpc('create_invitation',{target_organization:organizationId,target_email:email,target_role:role,target_branch:['owner','organization_admin'].includes(role)?undefined:branch||undefined});if(result.error)throw result.error;setLink(`${window.location.origin}/accept-invitation#token=${encodeURIComponent(result.data)}`);setCopied(false);setEmail('');await cache.invalidateQueries({queryKey})}catch(err){setError(authErrorKey(err))}finally{setBusy(false)}}}>
 <div><label htmlFor="invite-email">{t('auth.email')}</label><input id="invite-email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div>
 <div><label htmlFor="invite-role">{t('auth.role')}</label><select id="invite-role" value={role} onChange={e=>setRole(e.target.value)}>{roles.filter(r=>isOwner||!['owner','organization_admin'].includes(r)).map(r=><option key={r} value={r}>{t(`roles.${r}`)}</option>)}</select></div>
 <div><label htmlFor="invite-branch">{t('auth.scope')}</label><select id="invite-branch" value={['owner','organization_admin'].includes(role)?'':branch} disabled={['owner','organization_admin'].includes(role)} onChange={e=>setBranch(e.target.value)}><option value="">{t('auth.organizationWide')}</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
 <Button disabled={busy} type="submit">{t(busy?'auth.working':'auth.createInvitation')}</Button></form>
 {error && <p role="alert" className="field-error">{t(error)}</p>}
 {link && <div className="notice"><label htmlFor="invitation-link">{t('auth.linkCreated')}</label><input id="invitation-link" value={link} readOnly/><Button variant="outline" onClick={async()=>{try{await navigator.clipboard.writeText(link);setCopied(true)}catch{setError('auth.copyFailed')}}}>{t(copied?'auth.copied':'auth.copyLink')}</Button></div>}
 {invitations.isPending?<p role="status">{t('auth.loadingAccess')}</p>:invitations.isError?<p role="alert">{t('auth.accessFailed')}</p>:<ul className="invitation-list">{invitations.data.length===0?<li className="muted">{t('auth.noInvitations')}</li>:invitations.data.map(invite=>{
 const state=invite.accepted_at?'accepted':invite.revoked_at?'revoked':new Date(invite.expires_at)<=new Date()?'expired':'pending'
 return <li key={invite.id}><div><strong>{invite.email}</strong><p className="muted text-sm">{t(`roles.${invite.role_key}`)} · {t(`auth.${state}`)} · {formatDate(invite.expires_at,i18n.resolvedLanguage==='bn'?'bn':'en')}</p></div>{state==='pending' && <Button variant="outline" disabled={busy || (!isOwner && ['owner','organization_admin'].includes(invite.role_key))} onClick={async()=>{if(!window.confirm(t('auth.confirmRevoke')))return;setBusy(true);setError('');try{const result=await requireClient().rpc('revoke_invitation',{invitation_id:invite.id});if(result.error)throw result.error;await cache.invalidateQueries({queryKey})}catch(err){setError(authErrorKey(err))}finally{setBusy(false)}}}>{t('auth.revoke')}</Button>}</li>})}</ul>}
 </section>
}
