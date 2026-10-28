// Live tests against ONLY the disposable stack created by local-auth-stack.mjs.
// All test users and organizations are removed in finally; no fixtures enter the preview.
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
const {url,anonKey,serviceKey}=JSON.parse(readFileSync('.local/auth-stack/connection.json','utf8'))
if(url!=='http://127.0.0.1:54321')throw new Error('Refusing a nonlocal integration target')
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}
const admin=createClient(url,serviceKey,options)
const clients=[],users=[],organizations=[]
let passed=0
function check(condition,name){if(!condition)throw new Error(`FAIL: ${name}`);passed++;console.log(`PASS: ${name}`)}
function sql(input){const result=spawnSync('docker',['--host=unix:///var/run/docker.sock','exec','-i','farmlife-authdev-db','psql','-v','ON_ERROR_STOP=1','-U','postgres','-tA'],{input,encoding:'utf8'});if(result.status!==0)throw new Error('Local SQL fixture operation failed');return result.stdout.trim()}
async function user(label,confirmed=true){
 const email=`farmlife-test-${Date.now()}-${label}@example.test`,password=randomBytes(18).toString('base64url')
 const created=await admin.auth.admin.createUser({email,password,email_confirm:confirmed})
 if(created.error||!created.data.user)throw new Error('Local test user provisioning failed')
 users.push(created.data.user.id)
 const client=createClient(url,anonKey,options);clients.push(client)
 return {client,email,password,id:created.data.user.id}
}
try{
 const owner=await user('owner'),recipient=await user('recipient'),outsider=await user('other-owner'),unconfirmed=await user('unconfirmed',false)
 check(!(await owner.client.auth.signInWithPassword({email:owner.email,password:owner.password})).error,'real password sign-in')
 check(!!(await unconfirmed.client.auth.signInWithPassword({email:unconfirmed.email,password:unconfirmed.password})).error,'unverified account denied')
 check(!!(await recipient.client.auth.signInWithPassword({email:recipient.email,password:'incorrect-test-password'})).error,'incorrect password denied')
 for(const record of [recipient,outsider])if((await record.client.auth.signInWithPassword({email:record.email,password:record.password})).error)throw new Error('Fixture sign-in failed')
 const boot=await owner.client.rpc('bootstrap_organization',{organization_name:'Integration test organization A'})
 check(!boot.error&&!!boot.data,'confirmed nonmember bootstrap through authenticated REST/RPC')
 organizations.push(boot.data)
 const bootB=await outsider.client.rpc('bootstrap_organization',{organization_name:'Integration test organization B'});if(bootB.error)throw new Error('Other tenant bootstrap failed');organizations.push(bootB.data)
 check(!!(await owner.client.rpc('bootstrap_organization',{organization_name:'Duplicate'})).error,'duplicate bootstrap denied')
 const visible=await owner.client.from('organizations').select('id');check(!visible.error&&visible.data.length===1&&visible.data[0].id===boot.data,'real JWT tenant RLS isolation')
 const noAnon=await createClient(url,anonKey,options).from('organizations').select('id');check(!!noAnon.error,'anonymous table access denied')
 const branch=sql(`insert into branches(organization_id,name,kind) values('${boot.data}','Test-only branch A','farm') returning id;`).split('\n')[0]
 if(!/^[0-9a-f-]{36}$/.test(branch))throw new Error('Invalid fixture branch')
 sql(`insert into branches(organization_id,name,kind) values('${boot.data}','Test-only branch A2','farm'),('${bootB.data}','Test-only branch B1','farm');`)
 const invite=await owner.client.rpc('create_invitation',{target_organization:boot.data,target_email:recipient.email,target_role:'farm_worker',target_branch:branch})
 check(!invite.error&&typeof invite.data==='string','authorized private invitation created')
 check(!!(await outsider.client.rpc('accept_invitation',{invitation_token:invite.data})).error,'wrong verified email denied')
 const raced=await Promise.all([recipient.client.rpc('accept_invitation',{invitation_token:invite.data}),recipient.client.rpc('accept_invitation',{invitation_token:invite.data})])
 check(raced.filter(r=>!r.error).length===1&&raced.filter(r=>r.error).length===1,'concurrent invite consumption has exactly one success')
 const branches=await recipient.client.from('branches').select('id');check(!branches.error&&branches.data.length===1&&branches.data[0].id===branch,'branch-scoped REST read')
 check(!!(await recipient.client.rpc('create_invitation',{target_organization:boot.data,target_email:outsider.email,target_role:'owner',target_branch:null})).error,'worker privilege escalation denied by server')
 check(!!(await recipient.client.rpc('list_organization_members',{target_organization:boot.data})).error,'member identity enumeration denied')
 const listed=await owner.client.rpc('list_organization_members',{target_organization:boot.data});check(!listed.error&&listed.data.length===2,'owner member administration authorized')
 const profiles=await recipient.client.from('profiles').select('id');check(!profiles.error&&profiles.data.length===1&&profiles.data[0].id===recipient.id,'profile reads restricted to self')
 const updated=await recipient.client.from('profiles').update({display_name:'Integration test only',language:'bn'}).eq('id',recipient.id).select('id');check(!updated.error&&updated.data.length===1,'profile update through actual REST')
 const ownerMembership=listed.data.find(m=>m.role_key==='owner').membership_id
 check(!!(await owner.client.rpc('revoke_membership',{membership_id:ownerMembership})).error,'last-owner guard enforced through RPC')
 const workerMembership=listed.data.find(m=>m.role_key==='farm_worker').membership_id
 check(!(await owner.client.rpc('revoke_membership',{membership_id:workerMembership})).error,'authorized membership revocation')
 const afterRevoke=await recipient.client.from('branches').select('id');check(!afterRevoke.error&&afterRevoke.data.length===0,'revoked access denied with existing JWT')
 const ownerInvite=await owner.client.rpc('create_invitation',{target_organization:boot.data,target_email:recipient.email,target_role:'owner',target_branch:null})
 if(ownerInvite.error||(await recipient.client.rpc('accept_invitation',{invitation_token:ownerInvite.data})).error)throw new Error('Second-owner fixture failed')
 const ownerRows=(await owner.client.rpc('list_organization_members',{target_organization:boot.data})).data.filter(row=>row.role_key==='owner')
 const concurrentRemoval=await Promise.all(ownerRows.map(row=>owner.client.rpc('revoke_membership',{membership_id:row.membership_id})))
 check(concurrentRemoval.filter(result=>!result.error).length===1,'concurrent owner revocation has one success')
 check(sql(`select count(*) from memberships where organization_id='${boot.data}' and role_key='owner';`)==='1','concurrent revocation preserves at least one owner')
 const tokenRead=await owner.client.from('invitations').select('token_hash');check(!!tokenRead.error,'invitation hash column cannot be selected')
 const reset=await owner.client.auth.resetPasswordForEmail(owner.email,{redirectTo:'http://127.0.0.1:5173/reset-password'})
 check(!reset.error,'recovery request accepted by real Auth/SMTP service')
 let mailSeen=false
 for(let i=0;i<20;i++){const response=await fetch('http://127.0.0.1:54324/api/v1/messages');const data=await response.json();if(data.messages?.some(mail=>mail.To?.some(to=>to.Address===owner.email))){mailSeen=true;break}await new Promise(r=>setTimeout(r,250))}
 check(mailSeen,'recovery email delivered to isolated local Mailpit')
 check(!(await owner.client.auth.updateUser({password:randomBytes(18).toString('base64url')})).error,'authenticated password update')
 check(!(await owner.client.auth.signOut()).error,'real sign-out request succeeds')
 console.log(`Live local integration complete: ${passed} checks passed. Hosted/production deployment is not implied.`)
}finally{
 try {await cleanup()} catch {console.error('Local test cleanup failed; inspect only this task\'s disposable stack before reuse.');process.exitCode=1}
}
async function cleanup(){
 if(organizations.length){for(const id of organizations)if(!/^[0-9a-f-]{36}$/.test(id))throw new Error('Invalid cleanup target');const ids=organizations.map(id=>`'${id}'`).join(',');sql(`begin;delete from invitations where organization_id in (${ids});delete from audit_logs where organization_id in (${ids});delete from memberships where organization_id in (${ids});delete from farms where organization_id in (${ids});delete from branches where organization_id in (${ids});delete from organizations where id in (${ids});commit;`)}
 for(const id of users){const result=await admin.auth.admin.deleteUser(id);if(result.error)throw new Error('Test user cleanup failed')}
 for(const client of clients)client.auth.stopAutoRefresh()
 console.log('Removed test users and organization records from the isolated local stack.')
}
