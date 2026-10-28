import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
const output=resolve(process.env.PREVIEW_ARTIFACT_DIR || '/workspace/artifacts/farmlife')
const origin=process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:5173'
await mkdir(output,{recursive:true})
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH})
try{
 const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1})
 await page.goto(origin);await page.getByRole('heading',{level:1}).waitFor();await page.screenshot({path:resolve(output,'workspace-en.png')})
 await page.getByRole('button',{name:'বাংলা'}).click();await page.screenshot({path:resolve(output,'workspace-bn.png')})
 await page.getByRole('button',{name:'English'}).click();await page.goto(`${origin}/login`);await page.getByRole('heading',{name:'Welcome back'}).waitFor();await page.screenshot({path:resolve(output,'login-en.png')})
 await page.setViewportSize({width:390,height:844});await page.goto(origin);await page.getByRole('heading',{level:1}).waitFor();await page.screenshot({path:resolve(output,'workspace-mobile.png'),fullPage:true})
 console.log(`Captured workspace English/Bangla, sign-in and mobile previews in ${output}`)
}finally{await browser.close()}
