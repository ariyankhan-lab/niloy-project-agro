import { spawnSync } from 'node:child_process'
import { writeFileSync, renameSync, rmSync, existsSync, readFileSync, mkdirSync } from 'node:fs'
const target = 'src/lib/supabase/database.types.ts'
const temporary = `${target}.tmp`
const args=['gen','types','typescript','--local']
if(existsSync('.local/auth-stack/state.json')) {
 const state=JSON.parse(readFileSync('.local/auth-stack/state.json','utf8'))
 args.splice(3,1,'--db-url',`postgres://postgres:${state.password}@127.0.0.1:54322/postgres`,'--schema','public')
}
const result = spawnSync('supabase', args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
if (result.status !== 0 || !result.stdout.includes('export type Database')) {
 mkdirSync('.local',{recursive:true,mode:0o700})
 writeFileSync('.local/type-generation-error.log',result.stderr || String(result.error),{mode:0o600})
 console.error('Database type generation failed. Existing types were preserved. Check that the local migrated Supabase stack is running.')
 process.exit(1)
}
try { writeFileSync(temporary, result.stdout); renameSync(temporary, target) }
finally { rmSync(temporary, {force:true}) }
