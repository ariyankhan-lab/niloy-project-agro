// Disposable local development infrastructure. Never link or mutate a hosted project.
import { spawnSync } from 'node:child_process'
import { randomBytes,createHmac,createHash } from 'node:crypto'
import { mkdirSync,writeFileSync,readFileSync,existsSync,readdirSync } from 'node:fs'
import { resolve } from 'node:path'
const folder=resolve('.local/auth-stack')
mkdirSync(folder,{recursive:true,mode:0o700})
const docker=(args,input)=>{
 const result=spawnSync('docker',['--host=unix:///var/run/docker.sock',...args],{encoding:'utf8',input,maxBuffer:8*1024*1024})
 if(result.status!==0){writeFileSync(`${folder}/last-error.log`,result.stderr||result.stdout||String(result.error),{mode:0o600});throw new Error(`Local Docker operation failed (${args[0]}). See ignored .local/auth-stack/last-error.log privately.`)}
 return result.stdout.trim()
}
const name='farmlife-authdev',label='io.farmlife.local=authdev'
const names=['db','mail','auth','rest'].map(id=>`${name}-${id}`)
if(process.argv[2]==='stop'){
 for(const container of names){const found=docker(['ps','-a','--filter',`name=^/${container}$`,'--format','{{.Names}}']);if(found){if(docker(['inspect','--format','{{index .Config.Labels "io.farmlife.local"}}',container])!=='authdev')throw new Error('Unowned container name conflict');docker(['stop',container])}}
 console.log('Stopped only FarmLife local-auth development containers. Data retained.');process.exit(0)
}
let state
if(existsSync(`${folder}/state.json`))state=JSON.parse(readFileSync(`${folder}/state.json`,'utf8'))
else{state={password:randomBytes(24).toString('hex'),jwtSecret:randomBytes(48).toString('hex'),applied:[]};writeFileSync(`${folder}/state.json`,JSON.stringify(state),{mode:0o600})}
function token(role){const payload={role,iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+86400*365};const encoded=[{alg:'HS256',typ:'JWT'},payload].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.');return encoded+'.'+createHmac('sha256',state.jwtSecret).update(encoded).digest('base64url')}
const anonKey=token('anon'),serviceKey=token('service_role')
writeFileSync(`${folder}/connection.json`,JSON.stringify({url:'http://127.0.0.1:54321',anonKey,serviceKey}),{mode:0o600})
function envFile(id,values){const path=`${folder}/${id}.env`;writeFileSync(path,Object.entries(values).map(([key,value])=>`${key}=${value}`).join('\n')+'\n',{mode:0o600});return path}
const networkExists=docker(['network','ls','--filter',`name=^${name}$`,'--format','{{.Name}}'])
if(!networkExists)docker(['network','create','--label',label,name])
else if(docker(['network','inspect','--format','{{index .Labels "io.farmlife.local"}}',name])!=='authdev')throw new Error('Unowned network conflict')
function run(id,image,values,extra=[]){
 const container=`${name}-${id}`
 const existing=docker(['ps','-a','--filter',`name=^/${container}$`,'--format','{{.Names}}'])
 const configHash=createHash('sha256').update(JSON.stringify({image,values,extra})).digest('hex')
 if(existing){
  if(docker(['inspect','--format','{{index .Config.Labels "io.farmlife.local"}}',container])!=='authdev')throw new Error('Unowned container conflict')
  if(docker(['inspect','--format','{{index .Config.Labels "io.farmlife.config"}}',container])===configHash){docker(['start',container]);return}
  // Recreate only this helper's owned process; named database volume is retained.
  docker(['rm','-f',container])
 }
 docker(['run','-d','--name',container,'--network',name,'--label',label,'--label',`io.farmlife.config=${configHash}`,'--env-file',envFile(id,values),...extra,image])
}
run('db','postgres:17-alpine@sha256:266d3c257594e195b309ae9d1805e54c788f1d7b375f56bf6c367aac6c917e7b',{POSTGRES_PASSWORD:state.password},['-p','127.0.0.1:54322:5432','--mount',`type=volume,src=${name}-db,dst=/var/lib/postgresql/data`])
for(let i=0;i<30;i++){const r=spawnSync('docker',['--host=unix:///var/run/docker.sock','exec',`${name}-db`,'pg_isready','-U','postgres'],{encoding:'utf8'});if(r.status===0)break;if(i===29)throw new Error('Database did not become ready');await new Promise(r=>setTimeout(r,500))}
if(docker(['exec',`${name}-db`,'psql','-U','postgres','-tAc',"select exists(select 1 from pg_roles where rolname='supabase_auth_admin')"])==='f'){state.initialized=false;state.applied=[]}
if(!state.initialized){
 docker(['exec','-i',`${name}-db`,'psql','-v','ON_ERROR_STOP=1','-U','postgres'],`create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;
 create role authenticator noinherit login password '${state.password}';grant anon,authenticated,service_role to authenticator;
 create role supabase_auth_admin login password '${state.password}';create schema auth authorization supabase_auth_admin;
 grant all on database postgres to supabase_auth_admin;grant usage on schema public to anon,authenticated,service_role;
 create extension if not exists pgcrypto;create extension if not exists "uuid-ossp";
 create function auth.uid() returns uuid language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
 alter function auth.uid() owner to supabase_auth_admin;
 grant usage on schema auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`)
 state.initialized=true;writeFileSync(`${folder}/state.json`,JSON.stringify(state),{mode:0o600})
}
run('mail','ghcr.io/supabase/mailpit:v1.31.3',{},['-p','127.0.0.1:54324:8025'])
run('auth','ghcr.io/supabase/gotrue:v2.197.0',{
 GOTRUE_API_HOST:'0.0.0.0',GOTRUE_API_PORT:'9999',API_EXTERNAL_URL:'http://127.0.0.1:54321',
 GOTRUE_SITE_URL:'http://127.0.0.1:5173',GOTRUE_URI_ALLOW_LIST:'http://127.0.0.1:5173/**,http://localhost:5173/**,http://127.0.0.1:4175/**',
 GOTRUE_DB_DRIVER:'postgres',GOTRUE_DB_DATABASE_URL:`postgres://supabase_auth_admin:${state.password}@${name}-db:5432/postgres?search_path=auth`,GOTRUE_DB_NAMESPACE:'auth',
 GOTRUE_JWT_SECRET:state.jwtSecret,GOTRUE_JWT_EXP:'3600',GOTRUE_JWT_AUD:'authenticated',GOTRUE_JWT_DEFAULT_GROUP_NAME:'authenticated',GOTRUE_JWT_ADMIN_ROLES:'service_role',
 GOTRUE_DISABLE_SIGNUP:'true',GOTRUE_MAILER_AUTOCONFIRM:'false',GOTRUE_SMTP_HOST:`${name}-mail`,GOTRUE_SMTP_PORT:'1025',GOTRUE_SMTP_ADMIN_EMAIL:'auth@farmlife.test',GOTRUE_SMTP_SENDER_NAME:'FarmLife Local',
 GOTRUE_MAILER_URLPATHS_RECOVERY:'/auth/v1/verify',GOTRUE_RATE_LIMIT_EMAIL_SENT:'100',
},['-p','127.0.0.1:54328:9999'])
for(let i=0;i<40;i++){try{const response=await fetch('http://127.0.0.1:54328/health');if(response.ok)break}catch{/* Startup pending. */}if(i===39)throw new Error('Local Auth health check failed');await new Promise(r=>setTimeout(r,500))}
docker(['exec','-i',`${name}-db`,'psql','-v','ON_ERROR_STOP=1','-U','postgres'],`create or replace function auth.uid() returns uuid language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;grant execute on function auth.uid() to anon,authenticated,service_role;`)
for(const migration of readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort()){
 if(state.applied.includes(migration))continue
 docker(['exec','-i',`${name}-db`,'psql','-v','ON_ERROR_STOP=1','-U','postgres'],readFileSync(`supabase/migrations/${migration}`,'utf8'))
 state.applied.push(migration);writeFileSync(`${folder}/state.json`,JSON.stringify(state),{mode:0o600})
}
run('rest','ghcr.io/supabase/postgrest:v16.5',{
 PGRST_DB_URI:`postgres://authenticator:${state.password}@${name}-db:5432/postgres`,PGRST_DB_SCHEMAS:'public',PGRST_DB_ANON_ROLE:'anon',PGRST_JWT_SECRET:state.jwtSecret,PGRST_DB_EXTRA_SEARCH_PATH:'public',
},['-p','127.0.0.1:54329:3000'])
if(!existsSync('.env.local'))writeFileSync('.env.local',`VITE_SUPABASE_URL=http://127.0.0.1:54321\nVITE_SUPABASE_PUBLISHABLE_KEY=${anonKey}\n`,{mode:0o600})
console.log('Local PostgreSQL, Supabase Auth, PostgREST and Mailpit started. Credentials are in ignored .local/auth-stack only. Start the local gateway separately. No hosted project was touched.')
