import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Plus } from 'lucide-react'
import { useSession } from '../../../lib/auth/session'
import { useAccess } from '../hooks/useAccess'
import { requireClient,authErrorKey } from '../services/auth'
import { organizationSchema } from '../schemas/auth'
import { Button } from '../../../components/ui/button'
import { InvitationManager } from './InvitationManager'
import { MemberManager } from './MemberManager'
export function AccessPage() {
 const {t}=useTranslation();const {session}=useSession();const access=useAccess();const cache=useQueryClient()
 const [name,setName]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false)
 const [chosen,setChosen]=useState('')
 if(access.isPending)return <p role="status">{t('auth.loadingAccess')}</p>
 if(access.isError)return <section className="content-card"><p role="alert">{t('auth.accessFailed')}</p><Button onClick={()=>void access.refetch()}>{t('auth.retry')}</Button></section>
 const data=access.data
 const orgId=data.organizations.some(o=>o.id===chosen)?chosen:data.organizations[0]?.id
 const canManage=data.memberships.some(m=>m.organization_id===orgId && m.branch_id===null && data.permissions.some(p=>p.role_key===m.role_key && p.permission==='membership.manage'))
 return <div className="space-y-6"><div className="page-heading"><div><p className="eyebrow">{t('auth.securityLabel')}</p><h1>{t('auth.accessTitle')}</h1><p className="muted">{session?.user.email}</p></div><ShieldCheck size={32} className="text-green-800"/></div>
 {data.memberships.length===0?<section className="content-card"><h2>{t('auth.noMembership')}</h2><p className="muted">{t('auth.bootstrapDescription')}</p><form className="form-stack narrow-form" onSubmit={async event=>{event.preventDefault();const parsed=organizationSchema.safeParse({name});if(!parsed.success){setError('auth.required');return}setBusy(true);setError('');try{const result=await requireClient().rpc('bootstrap_organization',{organization_name:parsed.data.name});if(result.error)throw result.error;await cache.invalidateQueries({queryKey:[session?.user.id,'authentication']})}catch(err){setError(authErrorKey(err))}finally{setBusy(false)}}}><label htmlFor="org-name">{t('auth.organizationName')}</label><input id="org-name" value={name} onChange={e=>setName(e.target.value)} maxLength={200} required/>{error && <p role="alert" className="field-error">{t(error)}</p>}<Button disabled={busy} type="submit"><Plus size={17}/>{t(busy?'auth.working':'auth.createWorkspace')}</Button></form></section>:<>
 <section className="content-card"><label htmlFor="org-select" className="field-label">{t('auth.organization')}</label><select id="org-select" value={orgId} onChange={e=>setChosen(e.target.value)}>{data.organizations.map(org=><option key={org.id} value={org.id}>{org.name}</option>)}</select><h2 className="mt-6">{t('auth.yourRoles')}</h2><div className="membership-grid">{data.memberships.filter(m=>m.organization_id===orgId).map(m=><article key={m.id} className="membership-card"><span className="status-pill status-green">{t(`roles.${m.role_key}`)}</span><p>{m.branch_id?data.branches.find(b=>b.id===m.branch_id)?.name ?? t('auth.branchUnavailable'):t('auth.organizationWide')}</p><p className="muted text-sm">{t('auth.serverEnforced')}</p></article>)}</div></section>
 {canManage && orgId && <MemberManager key={`members-${orgId}`} organizationId={orgId} isOwner={data.memberships.some(m=>m.organization_id===orgId && m.role_key==='owner')}/>}
 {canManage && orgId && <InvitationManager key={orgId} organizationId={orgId} branches={data.branches.filter(b=>b.organization_id===orgId)} isOwner={data.memberships.some(m=>m.organization_id===orgId && m.role_key==='owner')}/>}
 </>}
 </div>
}
