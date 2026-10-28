// Fail a hosted build instead of publishing local endpoints or server credentials.
import { isIP } from 'node:net'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { loadEnv } from 'vite'
export function validateHostedEnv(env) {
 const urlValue=(env.VITE_SUPABASE_URL ?? '').trim()
 const key=(env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim()
 if(!urlValue && !key)return {mode:'ui-only'}
 if(!urlValue || !key)throw new Error('Set both public Supabase settings, or leave both unset for a UI-only preview.')
 let url
 try{url=new URL(urlValue)}catch{throw new Error('The hosted Supabase URL must be a valid HTTPS project URL.')}
 const host=url.hostname.toLowerCase().replace(/\.$/,'').replace(/^\[|\]$/g,'')
 if(url.protocol!=='https:' || isIP(host) || !host.includes('.') || host==='localhost' || /\.(localhost|local|internal|test|invalid)$/.test(host) || url.username || url.password || url.search || url.hash) {
  throw new Error('Use a public HTTPS Supabase project URL. Local/private endpoints and credentials in URLs cannot be deployed.')
 }
 if(key.startsWith('sb_publishable_') && key.length>'sb_publishable_'.length)return {mode:'connected'}
 const parts=key.split('.')
 if(parts.length===3){
  try{const payload=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));if(payload.role==='anon')return {mode:'connected'}}catch{/* Reject malformed or nonpublic keys without echoing them. */}
 }
 throw new Error('Only a Supabase publishable key or legacy anon key can enter the browser. Never use a service-role/secret key.')
}
if(process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1])){
 try{const result=validateHostedEnv({...loadEnv('production',process.cwd(),'VITE_'),...process.env});console.log(result.mode==='ui-only'?'Hosted UI-only preview: live authentication is disabled.':'Hosted public Supabase configuration validated.')}
 catch(error){console.error(error.message);process.exitCode=1}
}
