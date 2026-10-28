// @vitest-environment node
import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import { beforeAll,beforeEach,afterEach,afterAll,expect,it } from 'vitest'
let db:PGlite
const org='10000000-0000-0000-0000-000000000001',other='10000000-0000-0000-0000-000000000002'
const owner='30000000-0000-0000-0000-000000000001',admin='30000000-0000-0000-0000-000000000002',worker='30000000-0000-0000-0000-000000000003',recipient='30000000-0000-0000-0000-000000000004',unconfirmed='30000000-0000-0000-0000-000000000005'
const branch='20000000-0000-0000-0000-000000000001'
beforeAll(async()=>{
 db=new PGlite()
 await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;`)
 for(const file of ['20261028000100_identity_and_tenancy_foundation.sql','20261028000200_authentication_and_invitations.sql'])await db.exec(await readFile(new URL(`../../supabase/migrations/${file}`,import.meta.url),'utf8'))
 await db.exec(`insert into auth.users values('${owner}','owner@example.test',now()),('${admin}','admin@example.test',now()),('${worker}','worker@example.test',now()),('${recipient}','recipient@example.test',now()),('${unconfirmed}','unconfirmed@example.test',null);
 insert into organizations(id,name) values('${org}','A'),('${other}','B');
 insert into branches(id,organization_id,name,kind) values('${branch}','${org}','A1','farm');
 insert into memberships(organization_id,user_id,role_key) values('${org}','${owner}','owner'),('${org}','${admin}','organization_admin');
 insert into memberships(organization_id,user_id,role_key,branch_id) values('${org}','${worker}','farm_worker','${branch}');`)
},30000)
beforeEach(async()=>{await db.exec('begin')})
afterEach(async()=>{await db.exec('rollback')})
afterAll(async()=>{await db?.close()})
async function actor(id:string,sql:string,params:unknown[]=[]){
 await db.exec('savepoint action;set local role authenticated')
 try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);const result=await db.query<Record<string,unknown>>(sql,params);await db.exec('reset role;release savepoint action');return result}
 catch(error){await db.exec('rollback to savepoint action;release savepoint action');throw error}
}
async function invite(by=owner,role='farm_worker',scope:string|null=branch){
 const result=await actor(by,'select create_invitation($1,$2,$3,$4) as token',[org,'recipient@example.test',role,scope]);return String(result.rows[0].token)
}
it('automatically creates profiles for new Auth users',async()=>{expect((await db.query('select * from profiles')).rows).toHaveLength(5)})
it('bootstraps an organization and owner atomically for a verified nonmember',async()=>{
 const result=await actor(recipient,"select bootstrap_organization('My organization') as id");const id=result.rows[0].id
 expect((await db.query('select role_key from memberships where organization_id=$1',[id])).rows).toEqual([{role_key:'owner'}])
 expect((await db.query('select action from audit_logs where organization_id=$1',[id])).rows).toEqual([{action:'organization.bootstrapped'}])
})
it('rejects duplicate bootstrap and unconfirmed users',async()=>{
 await expect(actor(owner,"select bootstrap_organization('Duplicate')")).rejects.toThrow(/ALREADY_MEMBER/)
 await expect(actor(unconfirmed,"select bootstrap_organization('Unconfirmed')")).rejects.toThrow(/UNAUTHENTICATED/)
})
it('rejects empty organization names without partial rows',async()=>{
 await expect(actor(recipient,"select bootstrap_organization('   ')")).rejects.toThrow(/VALIDATION_FAILED/)
 expect((await db.query('select * from organizations')).rows).toHaveLength(2)
})
it('stores only a hash and returns the private invitation token once',async()=>{
 const token=await invite();expect(token.length).toBe(72)
 const result=await db.query<{token_hash:string}>('select token_hash from invitations');expect(result.rows[0].token_hash).toHaveLength(64);expect(result.rows[0].token_hash).not.toBe(token)
 await expect(actor(owner,'select token_hash from invitations')).rejects.toThrow(/permission denied/)
})
it('denies invitation creation by a branch worker or another tenant',async()=>{
 await expect(invite(worker)).rejects.toThrow(/FORBIDDEN/)
 await expect(actor(owner,'select create_invitation($1,$2,$3,null)',[other,'recipient@example.test','farm_worker'])).rejects.toThrow(/FORBIDDEN/)
})
it('allows admin invitations to operational roles but denies owner/admin escalation',async()=>{
 await invite(admin)
 await expect(invite(admin,'owner',null)).rejects.toThrow(/FORBIDDEN/)
 await expect(invite(admin,'organization_admin',null)).rejects.toThrow(/FORBIDDEN/)
})
it('accepts only with the intended verified email, preserving branch scope',async()=>{
 const token=await invite()
 await expect(actor(worker,'select accept_invitation($1)',[token])).rejects.toThrow(/INVALID_INVITATION/)
 await expect(actor(unconfirmed,'select accept_invitation($1)',[token])).rejects.toThrow(/UNAUTHENTICATED/)
 await actor(recipient,'select accept_invitation($1)',[token])
 expect((await db.query('select role_key,branch_id from memberships where user_id=$1',[recipient])).rows).toEqual([{role_key:'farm_worker',branch_id:branch}])
 expect((await db.query("select * from audit_logs where action='invitation.accepted'")).rows).toHaveLength(1)
})
it('rejects used and invalid invitation tokens',async()=>{
 const token=await invite();await actor(recipient,'select accept_invitation($1)',[token])
 await expect(actor(recipient,'select accept_invitation($1)',[token])).rejects.toThrow(/INVALID_INVITATION/)
 await expect(actor(recipient,"select accept_invitation('bad')")).rejects.toThrow(/INVALID_INVITATION/)
})
it('rejects expired invitations',async()=>{
 const token=await invite();await db.exec("update invitations set created_at=now()-interval '9 days',expires_at=now()-interval '2 days'")
 await expect(actor(recipient,'select accept_invitation($1)',[token])).rejects.toThrow(/INVALID_INVITATION/)
})
it('revokes invitations and rejects later acceptance',async()=>{
 const token=await invite();const id=(await db.query<{id:string}>('select id from invitations')).rows[0].id
 await actor(owner,'select revoke_invitation($1)',[id])
 await expect(actor(recipient,'select accept_invitation($1)',[token])).rejects.toThrow(/INVALID_INVITATION/)
})
it('invalidates outstanding invitations when inviter loses authority',async()=>{
 const token=await invite(admin);await db.exec(`delete from memberships where user_id='${admin}'`)
 await expect(actor(recipient,'select accept_invitation($1)',[token])).rejects.toThrow(/INVALID_INVITATION/)
})
it('keeps invitation metadata private from ordinary members and other tenants',async()=>{
 await invite();expect((await actor(worker,'select id,email from invitations')).rows).toHaveLength(0)
 expect((await actor(recipient,'select id,email from invitations')).rows).toHaveLength(0)
 expect((await actor(owner,'select id,email from invitations')).rows).toHaveLength(1)
})
it('prevents deleting the last owner and prevents admins revoking owners',async()=>{
 const id=(await db.query<{id:string}>("select id from memberships where role_key='owner'")).rows[0].id
 await expect(actor(owner,'select revoke_membership($1)',[id])).rejects.toThrow(/LAST_OWNER/)
 await expect(actor(admin,'select revoke_membership($1)',[id])).rejects.toThrow(/FORBIDDEN/)
})
it('revokes an operational membership with a durable audit event',async()=>{
 const id=(await db.query<{id:string}>('select id from memberships where user_id=$1',[worker])).rows[0].id
 await actor(owner,'select revoke_membership($1)',[id])
 expect((await actor(worker,'select id from organizations')).rows).toHaveLength(0)
 expect((await db.query("select * from audit_logs where action='membership.revoked'")).rows).toHaveLength(1)
})
it('prevents branch-scoped privileged roles and cross-tenant branch invitations',async()=>{
 await expect(invite(owner,'owner')).rejects.toThrow(/check constraint/)
 await db.exec(`insert into branches(id,organization_id,name,kind) values('20000000-0000-0000-0000-000000000002','${other}','B1','farm')`)
 await expect(invite(owner,'farm_worker','20000000-0000-0000-0000-000000000002')).rejects.toThrow(/foreign key/)
})
it('denies anonymous execute grants for every new RPC',async()=>{
 await db.exec('savepoint anon_test;set local role anon')
 try{await expect(db.query("select bootstrap_organization('Attack')")).rejects.toThrow(/permission denied/)}finally{await db.exec('rollback to savepoint anon_test;release savepoint anon_test')}
})

it('only tenant administrators can list member identities',async()=>{
 expect((await actor(owner,'select * from list_organization_members($1)',[org])).rows).toHaveLength(3)
 await expect(actor(worker,'select * from list_organization_members($1)',[org])).rejects.toThrow(/FORBIDDEN/)
 await expect(actor(owner,'select * from list_organization_members($1)',[other])).rejects.toThrow(/FORBIDDEN/)
})
