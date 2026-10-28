import { test,expect } from '@playwright/test'
test('workspace stays responsive and language preference persists',async({page})=>{
 await page.goto('/')
 await expect(page.getByRole('heading',{level:1})).toHaveText('Your farm, thoughtfully connected.')
 await expect(page.getByRole('status')).toContainText('Live farm data not connected')
 await expect(page.locator('.module-card')).toHaveCount(22)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
 await page.getByRole('button',{name:'বাংলা'}).click()
 await expect(page.locator('html')).toHaveAttribute('lang','bn')
 await expect(page.getByRole('heading',{level:1})).toHaveText('আপনার খামার, এক সুতোয় গাঁথা।')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
 await page.reload();await expect(page.locator('html')).toHaveAttribute('lang','bn')
 await page.getByRole('button',{name:'English'}).click();await expect(page.locator('html')).toHaveAttribute('lang','en')
})
test('module search and category filters work without fabricated data',async({page})=>{
 await page.goto('/')
 await page.getByRole('button',{name:'Herd & care'}).click();await expect(page.locator('.module-card')).toHaveCount(6)
 await page.getByRole('textbox',{name:'Find a module…'}).fill('cattle');await expect(page.locator('.module-card')).toHaveCount(1)
 await page.getByRole('textbox',{name:'Find a module…'}).fill('not-a-module');await expect(page.getByRole('status').filter({hasText:'No modules match your search.'})).toBeVisible()
 await page.getByRole('textbox',{name:'Find a module…'}).clear();await page.getByRole('button',{name:'All modules'}).click();await expect(page.locator('.module-card')).toHaveCount(22)
})
test('sign-in preview is explicit about missing backend and has usable password controls',async({page})=>{
 await page.goto('/login')
 await expect(page.getByRole('heading',{name:'Welcome back'})).toBeVisible()
 await expect(page.getByRole('status')).toContainText('Live sign-in is unavailable')
 await expect(page.getByRole('button',{name:'Sign in'})).toBeDisabled()
 await page.getByLabel('Password',{exact:true}).fill('private-test-only')
 await page.getByRole('button',{name:'Show password'}).click();await expect(page.getByLabel('Password',{exact:true})).toHaveAttribute('type','text')
 await page.getByRole('button',{name:'Hide password'}).click();await expect(page.getByLabel('Password',{exact:true})).toHaveAttribute('type','password')
 await page.getByRole('link',{name:'Forgot password?'}).click();await expect(page.getByRole('heading',{name:'Reset your access'})).toBeVisible()
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
})
test('private routes require authentication and keep invitation fragment through sign-in redirect',async({page})=>{
 await page.goto('/account');await expect(page).toHaveURL(/\/login\?next=%2Faccount/)
 await expect(page.getByRole('heading',{name:'Welcome back'})).toBeVisible()
 await page.goto('/accept-invitation#token=not-a-real-invitation');await expect(page).toHaveURL(/\/login\?next=%2Faccept-invitation#token=not-a-real-invitation/)
})
test('navigation is keyboard accessible and mobile drawer can be closed',async({page,isMobile})=>{
 await page.goto('/')
 if(isMobile){await page.getByRole('button',{name:'Open navigation'}).click();await expect(page.getByRole('link',{name:'Access & roles',exact:true})).toBeVisible();await page.getByRole('button',{name:'Close navigation',exact:true}).last().click()}
 else{await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused()}
})
test('unknown routes provide a working home link',async({page})=>{
 await page.goto('/missing');await expect(page.getByRole('heading',{name:'Page not found'})).toBeVisible()
 await page.getByRole('link',{name:'Return to foundation'}).click();await expect(page.getByRole('heading',{level:1})).toHaveText('Your farm, thoughtfully connected.')
})
