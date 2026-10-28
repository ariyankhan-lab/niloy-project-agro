import assert from 'node:assert/strict'
import { validateHostedEnv } from './validate-hosted-env.mjs'
let executed=0
function test(name,run){run();executed++;console.log(`PASS: ${name}`)}
const url='https://farm-example.supabase.co'
const publicKey='sb_publishable_test_only'
const configured={VITE_SUPABASE_URL:url,VITE_SUPABASE_PUBLISHABLE_KEY:publicKey}
function jwt(role){return [JSON.stringify({alg:'HS256'}),JSON.stringify({role})].map(value=>Buffer.from(value).toString('base64url')).join('.')+'.test-signature'}
test('allows a truthful UI-only deployment with both values absent',()=>assert.deepEqual(validateHostedEnv({}),{mode:'ui-only'}))
test('rejects partial backend configuration',()=>{assert.throws(()=>validateHostedEnv({VITE_SUPABASE_URL:url}));assert.throws(()=>validateHostedEnv({VITE_SUPABASE_PUBLISHABLE_KEY:publicKey}))})
test('accepts a public HTTPS project and public publishable key',()=>assert.deepEqual(validateHostedEnv(configured),{mode:'connected'}))
test('rejects local, IP, HTTP and invalid project destinations',()=>{
 for(const destination of ['http://farm-example.supabase.co','http://127.0.0.1:54321','https://127.0.0.1','https://[::1]','https://localhost','https://localhost.','https://farm.local','https://farm.internal','https://farm.test','invalid'])assert.throws(()=>validateHostedEnv({...configured,VITE_SUPABASE_URL:destination}))
})
test('rejects URL-embedded credentials and query tokens without echoing values',()=>{
 for(const destination of ['https://user:private-value@farm-example.supabase.co','https://farm-example.supabase.co?token=private-value'])assert.throws(()=>validateHostedEnv({...configured,VITE_SUPABASE_URL:destination}),error=>!error.message.includes('private-value'))
})
test('rejects service-role and secret keys',()=>{
 for(const key of ['sb_secret_test_only',jwt('service_role'),jwt('authenticated'),'unknown-key'])assert.throws(()=>validateHostedEnv({...configured,VITE_SUPABASE_PUBLISHABLE_KEY:key}))
})
test('accepts the legacy public anon JWT shape only',()=>assert.deepEqual(validateHostedEnv({...configured,VITE_SUPABASE_PUBLISHABLE_KEY:jwt('anon')}),{mode:'connected'}))

console.log(`Hosted-environment validation: ${executed} checks passed.`)
