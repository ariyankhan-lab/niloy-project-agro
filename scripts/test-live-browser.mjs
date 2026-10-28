import { createClient } from '@supabase/supabase-js'
import { chromium } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { spawn,spawnSync } from 'node:child_process'
const connection=JSON.parse(readFileSync('.local/auth-stack/connection.json','utf8'))
if(connection.url!=='http://127.0.0.1:54321')throw new Error('Refusing a nonlocal browser integration target')
const admin=createClient(connection.url,connection.serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
const users=[];let organization;let browser;let debugPage
const origin='http://127.0.0.1:4175'
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4175','--strictPort'],{stdio:'ignore',env:{...process.env,VITE_SUPABASE_URL:connection.url,VITE_SUPABASE_PUBLISHABLE_KEY:connection.anonKey}})
async function fixture(label){const email=`browser-${label}-${Date.now()}@example.test`,password=randomBytes(18).toString('base64url');const created=await admin.auth.admin.createUser({email,password,email_confirm:true});if(created.error)throw new Error('Test user creation failed');const user={id:created.data.user.id,email,password};users.push(user);return user}
async function login(page,user){await page.getByLabel('Email address').fill(user.email);await page.getByLabel('Password',{exact:true}).fill(user.password);await page.getByRole('button',{name:'Sign in',exact:true}).click()}
try{
 for(let i=0;i<50;i++){try{if((await fetch(origin)).ok)break}catch{/* Wait for Vite. */}if(i===49)throw new Error('Local browser server did not start');await new Promise(r=>setTimeout(r,200))}
 const owner=await fixture('owner'),recipient=await fixture('recipient')
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH})
 const ownerContext=await browser.newContext();const ownerPage=await ownerContext.newPage();debugPage=ownerPage;ownerPage.on('requestfailed',request=>console.log('Failed local request:',new URL(request.url()).pathname,request.failure()?.errorText))
 await ownerPage.goto(`${origin}/login`);await login(ownerPage,owner)
 await ownerPage.getByRole('heading',{name:'Your workspace starts here'}).waitFor()
 await ownerPage.getByLabel('Organization name').fill('Browser integration test organization')
 await ownerPage.getByRole('button',{name:'Create my organization'}).click()
 await ownerPage.getByRole('heading',{name:'Your authorized roles'}).waitFor()
 organization=await ownerPage.locator('#org-select').inputValue()
 console.log('PASS: real browser login and first-owner organization bootstrap')
 await ownerPage.getByLabel('Email address').fill(recipient.email)
 await ownerPage.getByLabel('Role',{exact:true}).selectOption('farm_worker')
 await ownerPage.getByRole('button',{name:'Create invitation',exact:true}).click()
 const link=await ownerPage.getByLabel('Copy this private invitation link now. It is not stored in readable form.').inputValue()
 const recipientContext=await browser.newContext();const recipientPage=await recipientContext.newPage()
 await recipientPage.goto(link);await recipientPage.getByRole('heading',{name:'Welcome back'}).waitFor();await login(recipientPage,recipient)
 await recipientPage.getByRole('heading',{name:'Join your organization'}).waitFor()
 await recipientPage.getByRole('button',{name:'Accept invitation',exact:true}).click()
 await recipientPage.getByRole('heading',{name:'Your authorized roles'}).waitFor()
 if(await recipientPage.getByRole('heading',{name:'Organization members'}).count()!==0)throw new Error('Worker should not see member administration')
 console.log('PASS: real browser private invitation, login redirect, acceptance and role-aware administration visibility')
 await recipientPage.getByRole('link',{name:'My account',exact:true}).click()
 await recipientPage.getByLabel('Display name').fill('Browser test profile')
 await recipientPage.getByRole('button',{name:'Save profile'}).click()
 await recipientPage.getByRole('status').filter({hasText:'Your profile has been saved.'}).waitFor()
 console.log('PASS: real browser profile mutation')
 await recipientPage.getByRole('button',{name:'Sign out',exact:true}).click()
 await recipientPage.getByRole('heading',{name:'Welcome back'}).waitFor()
 await recipientPage.goto(`${origin}/account`);await recipientPage.getByRole('heading',{name:'Welcome back'}).waitFor()
 console.log('PASS: real browser logout and protected-route denial')
 await recipientPage.getByRole('link',{name:'Forgot password?'}).click()
 await recipientPage.getByLabel('Email address').fill(recipient.email)
 await recipientPage.getByRole('button',{name:'Send recovery link'}).click()
 await recipientPage.getByRole('status').filter({hasText:'If this email has an account'}).waitFor()
 let messageId
 for(let i=0;i<30;i++){const response=await fetch('http://127.0.0.1:54324/api/v1/messages');const data=await response.json();const message=data.messages?.find(mail=>mail.To?.some(to=>to.Address===recipient.email));if(message){messageId=message.ID;break}await new Promise(r=>setTimeout(r,200))}
 if(!messageId)throw new Error('Browser recovery email not delivered')
 const mail=await (await fetch(`http://127.0.0.1:54324/api/v1/message/${messageId}`)).json()
 const links=[...mail.HTML.matchAll(/href="([^"]+)"/g)].map(match=>match[1].replaceAll('&amp;','&'))
 const recoveryLink=links.find(link=>link.includes('/verify'))
 if(!recoveryLink)throw new Error('Recovery link missing')
 await recipientPage.goto(recoveryLink)
 await recipientPage.getByRole('heading',{name:'Choose a new password'}).waitFor()
 const newPassword=randomBytes(18).toString('base64url')
 await recipientPage.getByLabel('New password',{exact:true}).fill(newPassword)
 await recipientPage.getByLabel('Confirm password',{exact:true}).fill(newPassword)
 await recipientPage.getByRole('button',{name:'Update password',exact:true}).click()
 await recipientPage.getByRole('status').filter({hasText:'Your password has been updated.'}).waitFor()
 console.log('PASS: real browser recovery email, PKCE callback and password reset')
 console.log('Live browser workflows passed; no mocked API responses were used.')
}catch(error){
 if(debugPage){console.log('Failed UI route:',new URL(debugPage.url()).pathname);console.log('UI alerts:',await debugPage.locator('[role=alert]').allTextContents());await debugPage.screenshot({path:'.local/auth-stack/browser-failure.png'})}
 throw error
}finally{
 try {await cleanup()} catch {console.error('Local test cleanup failed; inspect only this task\'s disposable stack before reuse.');process.exitCode=1}
}
async function cleanup(){
 await browser?.close();server.kill('SIGTERM')
 if(!organization){const result=await admin.from('memberships').select('organization_id').in('user_id',users.map(u=>u.id));organization=result.data?.[0]?.organization_id}
 if(organization){if(!/^[0-9a-f-]{36}$/.test(organization))throw new Error('Invalid cleanup target');const result=spawnSync('docker',['--host=unix:///var/run/docker.sock','exec','-i','farmlife-authdev-db','psql','-v','ON_ERROR_STOP=1','-U','postgres'],{encoding:'utf8',input:`begin;delete from invitations where organization_id='${organization}';delete from audit_logs where organization_id='${organization}';delete from memberships where organization_id='${organization}';delete from organizations where id='${organization}';commit;`});if(result.status!==0)throw new Error('Browser test cleanup failed')}
 for(const user of users){const result=await admin.auth.admin.deleteUser(user.id);if(result.error)throw new Error('Browser test account cleanup failed')}
 console.log('Removed browser test records and stopped its temporary server.')
}
