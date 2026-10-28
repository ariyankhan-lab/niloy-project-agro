// Build a deployable frontend from explicit public process settings only.
// Never let this workspace's local .env.local enter a public upload.
import { build } from 'vite'
import { readFile,stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { validateHostedEnv } from './validate-hosted-env.mjs'
const mode=validateHostedEnv(process.env).mode
const output=resolve('.local/netlify-package/dist')
await build({configFile:resolve('vite.config.ts'),envDir:false,build:{outDir:output,emptyOutDir:true}})
const html=await readFile(resolve(output,'index.html'),'utf8')
if(!html.includes('<title>FarmLife ERP</title>') || html.includes('/src/main.tsx') || /<title>[^<]*Codex/i.test(html))throw new Error('Unexpected application entry in deployment output')
const scripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(match=>match[1])
const styles=[...html.matchAll(/<link\b[^>]*href="([^"]+\.css)"/g)].map(match=>match[1])
if(!scripts.length || !styles.length)throw new Error('Missing compiled JavaScript or CSS references')
for(const asset of [...scripts,...styles]){
 if(!asset.startsWith('/assets/') || asset.includes('..'))throw new Error('Unexpected asset path')
 const file=resolve(output,asset.slice(1));if(!(await stat(file)).isFile())throw new Error('Referenced asset missing')
}
const css=(await Promise.all(styles.map(path=>readFile(resolve(output,path.slice(1)),'utf8')))).join('\n')
if(!css.includes('.workspace-shell') || !css.includes('.sidebar') || !css.includes('.welcome-card'))throw new Error('Application styles missing from the compiled stylesheet')
if((await readFile(resolve(output,'_redirects'),'utf8')).trim()!=='/* /index.html 200')throw new Error('SPA redirect missing from manual-upload package')
await stat(resolve(output,'_headers'))
console.log(`Verified FarmLife HTML, CSS, JavaScript and manual-upload routing: ${output}. Mode: ${mode}. No deployment has been performed.`)
