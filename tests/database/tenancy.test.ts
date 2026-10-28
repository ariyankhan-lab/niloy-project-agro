// @vitest-environment node
import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
let db: PGlite
const orgA='10000000-0000-0000-0000-000000000001', orgB='10000000-0000-0000-0000-000000000002'
const branchA='20000000-0000-0000-0000-000000000001', branchA2='20000000-0000-0000-0000-000000000002', branchB='20000000-0000-0000-0000-000000000003'
const owner='30000000-0000-0000-0000-000000000001', worker='30000000-0000-0000-0000-000000000002', outsider='30000000-0000-0000-0000-000000000003'
beforeAll(async () => {
 db=new PGlite()
 await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`)
 await db.exec(await readFile(new URL('../../supabase/migrations/20261028000100_identity_and_tenancy_foundation.sql',import.meta.url),'utf8'))
 await db.exec(`insert into auth.users values ('${owner}'),('${worker}'),('${outsider}');
 insert into public.organizations(id,name) values ('${orgA}','Farm A'),('${orgB}','Farm B');
 insert into public.branches(id,organization_id,name,kind) values ('${branchA}','${orgA}','A1','farm'),('${branchA2}','${orgA}','A2','farm'),('${branchB}','${orgB}','B1','distribution');
 insert into public.farms(organization_id,branch_id) values ('${orgA}','${branchA}');
 insert into public.memberships(organization_id,user_id,branch_id,role_key) values ('${orgA}','${owner}',null,'owner'),('${orgA}','${worker}','${branchA}','farm_worker');
 insert into public.profiles(id) values ('${owner}'),('${worker}');
 insert into public.audit_logs(organization_id,action,entity_type) values ('${orgA}','foundation.fixture','test');`)
},30000)
afterAll(async () => {await db?.close()})
async function asUser(id: string, sql: string) {
 await db.exec('begin; set local role authenticated;')
 try {await db.query("select set_config('request.jwt.claim.sub',$1,true)",[id]); return await db.query(sql)}
 finally {await db.exec('rollback')}
}
describe('PostgreSQL migration and tenant isolation (embedded PostgreSQL)', () => {
 it('enables RLS on every public foundation table', async () => {
  const result=await db.query<{relrowsecurity:boolean}>("select relrowsecurity from pg_class join pg_namespace n on n.oid=relnamespace where n.nspname='public' and relkind='r'")
  expect(result.rows).toHaveLength(8); expect(result.rows.every(row=>row.relrowsecurity)).toBe(true)
 })
 it('owner reads only its organization and branches',async () => {
  expect((await asUser(owner,'select id from organizations')).rows).toEqual([{id:orgA}])
  expect((await asUser(owner,'select id from branches order by id')).rows).toEqual([{id:branchA},{id:branchA2}])
 })
 it('branch worker cannot see other branches or organizations',async () => {
  expect((await asUser(worker,'select id from branches')).rows).toEqual([{id:branchA}])
  expect((await asUser(worker,'select id from farms')).rows).toHaveLength(1)
  expect((await asUser(worker,`select private.has_permission('${orgA}',null,'branch.read') as allowed`)).rows).toEqual([{allowed:false}])
 })
 it('nonmember cannot read tenant records',async () => {for(const table of ['organizations','branches','farms','memberships','audit_logs']) expect((await asUser(outsider,`select * from ${table}`)).rows).toHaveLength(0)})
 it('memberships and audit data are restricted',async () => {
  expect((await asUser(worker,'select * from memberships')).rows).toHaveLength(1)
  expect((await asUser(owner,'select * from memberships')).rows).toHaveLength(2)
  expect((await asUser(worker,'select * from audit_logs')).rows).toHaveLength(0)
  expect((await asUser(owner,'select * from audit_logs')).rows).toHaveLength(1)
 })
 it('denies membership escalation and client tenant creation',async () => {
  await expect(asUser(worker,"update memberships set role_key='owner'")).rejects.toThrow(/permission denied/)
  await expect(asUser(owner,"insert into organizations(name) values ('Injected')")).rejects.toThrow(/permission denied/)
  await expect(asUser(owner,"update role_permissions set permission='membership.write'")).rejects.toThrow(/permission denied/)
 })
 it('profiles can only update self and permitted columns',async () => {
  expect((await asUser(worker,'select id from profiles')).rows).toEqual([{id:worker}])
  await asUser(worker,"update profiles set language='bn'")
  await expect(asUser(worker,`update profiles set id='${outsider}'`)).rejects.toThrow(/permission denied/)
 })
 it('rejects cross-organization foreign keys and invalid farm kinds',async () => {
  await expect(db.exec(`insert into memberships(organization_id,user_id,branch_id,role_key) values ('${orgB}','${worker}','${branchA}','farm_worker')`)).rejects.toThrow(/foreign key/)
  await expect(db.exec(`insert into farms(organization_id,branch_id) values ('${orgB}','${branchB}')`)).rejects.toThrow(/Farm must reference/)
  await expect(db.exec(`update branches set kind='distribution' where id='${branchA}'`)).rejects.toThrow(/cannot change kind/)
 })
 it('rejects duplicate organization-wide grants and branch-scoped owners',async () => {
  await expect(db.exec(`insert into memberships(organization_id,user_id,role_key) values ('${orgA}','${owner}','owner')`)).rejects.toThrow(/unique constraint/)
  await expect(db.exec(`insert into memberships(organization_id,user_id,branch_id,role_key) values ('${orgA}','${outsider}','${branchA}','owner')`)).rejects.toThrow(/check constraint/)
 })
 it('revocation is effective without trusting stale JWT role claims',async () => {
  await db.exec('begin')
  try {
   await db.exec(`delete from memberships where user_id='${worker}'; set local role authenticated;`)
   await db.query("select set_config('request.jwt.claim.sub',$1,true)",[worker])
   expect((await db.query('select * from branches')).rows).toHaveLength(0)
  } finally {await db.exec('rollback')}
 })
 it('denies anonymous reads',async () => {
  await db.exec('begin; set local role anon')
  try {await expect(db.query('select * from organizations')).rejects.toThrow(/permission denied/)} finally {await db.exec('rollback')}
 })
})
