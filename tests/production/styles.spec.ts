import {test,expect} from '@playwright/test'
test('production HTML loads actual CSS and assets; deep links keep the layout',async({page,isMobile})=>{
 const failures:string[]=[]
 // 304 reuses a valid cached asset after deep-link navigation; it is not a load failure.
 page.on('pageerror',error=>failures.push(error.message))
 page.on('response',response=>{if(response.url().includes('/assets/') && !response.ok() && response.status()!==304)failures.push(`Asset ${new URL(response.url()).pathname}: HTTP ${response.status()}`)})
 await page.goto('/')
 await expect(page).toHaveTitle('FarmLife ERP')
 await expect(page.getByRole('heading',{level:1})).toHaveText('Your farm, thoughtfully connected.')
 const stylesheet=await page.locator('link[rel=stylesheet]').first().getAttribute('href')
 expect(stylesheet).toMatch(/^\/assets\/.+\.css$/)
 const response=await page.request.get(stylesheet!)
 expect(response.ok()).toBe(true);expect(response.headers()['content-type']).toContain('text/css')
 await expect(page.locator('.welcome-card')).toHaveCSS('background-color','rgb(232, 237, 221)')
 if(!isMobile){await expect(page.locator('.sidebar')).toHaveCSS('width','244px');await expect(page.locator('.workspace-body')).toHaveCSS('margin-left','244px')}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
 await page.goto('/login')
 await expect(page.getByRole('heading',{name:'Welcome back'})).toBeVisible()
 await expect(page.locator('.auth-grid')).toHaveCSS('display','grid')
 await expect(page.getByRole('status')).toContainText('Live sign-in is unavailable')
 await page.getByRole('button',{name:'বাংলা'}).click()
 await expect(page.getByRole('heading',{name:'আবারও স্বাগতম'})).toBeVisible()
 expect(failures).toEqual([])
})
