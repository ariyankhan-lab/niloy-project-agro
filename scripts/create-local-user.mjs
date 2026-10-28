// Trusted local administrator utility; never a browser signup endpoint.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { z } from 'zod'
const input=z.object({LOCAL_DEV_EMAIL:z.email(),LOCAL_DEV_PASSWORD:z.string().min(12)}).safeParse(process.env)
if(!input.success){console.error('Provide LOCAL_DEV_EMAIL and LOCAL_DEV_PASSWORD (12+ characters) securely in your local terminal. Do not put them in source code or chat.');process.exit(1)}
const connection=JSON.parse(readFileSync('.local/auth-stack/connection.json','utf8'))
if(connection.url!=='http://127.0.0.1:54321')throw new Error('Refusing to provision a nonlocal account')
const admin=createClient(connection.url,connection.serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
const result=await admin.auth.admin.createUser({email:input.data.LOCAL_DEV_EMAIL,password:input.data.LOCAL_DEV_PASSWORD,email_confirm:true})
if(result.error){console.error('Local account creation failed. Check backend readiness or whether this email already exists.');process.exit(1)}
console.log('Created a verified local development account. Sign in, then create your organization or accept an invitation. No farm records were added.')
