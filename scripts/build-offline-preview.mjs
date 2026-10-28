// Self-contained UI preview: no backend credentials, service keys or network assets.
import { build } from 'vite'
import { mkdir,readFile,writeFile } from 'node:fs/promises'
import { resolve,dirname } from 'node:path'
const source=resolve('.local/offline-source'),out=resolve('.local/offline-build')
const artifact=resolve('/workspace/artifacts/farmlife/FarmLife_Preview.html')
await mkdir(source,{recursive:true});await mkdir(dirname(artifact),{recursive:true})
await writeFile(resolve(source,'index.html'),'<!doctype html><html lang="bn"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>FarmLife ERP — Offline Preview</title></head><body><div id="root"></div><script type="module" src="./entry.tsx"></script></body></html>')
await writeFile(resolve(source,'entry.tsx'),`import React from 'react';import ReactDOM from 'react-dom/client';import {HashRouter} from 'react-router-dom';import {App} from '/src/app/App';import {AppProviders} from '/src/app/providers/AppProviders';import i18n from '/src/lib/i18n';import '/src/styles.css';void i18n.changeLanguage('bn');ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><HashRouter><AppProviders><App/></AppProviders></HashRouter></React.StrictMode>);`)
await build({configFile:resolve('vite.config.ts'),base:'./',envDir:false,envPrefix:'FARMLIFE_OFFLINE_',build:{outDir:out,emptyOutDir:true,cssCodeSplit:false,rollupOptions:{input:resolve(source,'index.html'),output:{codeSplitting:false}}}})
const htmlFile=resolve(out,'.local/offline-source/index.html')
let html=await readFile(htmlFile,'utf8')
for(const match of [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]){
 const js=await readFile(resolve(dirname(htmlFile),match[1]),'utf8')
 html=html.replace(match[0],()=>`<script type="module">${js.replace(/<\/script/gi,'<\\/script')}</script>`)
}
for(const match of [...html.matchAll(/<link\b[^>]*href="([^"]+)"[^>]*>/g)]){
 if(!match[1].endsWith('.css'))throw new Error('Unexpected external asset in offline preview')
 const css=await readFile(resolve(dirname(htmlFile),match[1]),'utf8')
 html=html.replace(match[0],()=>`<style>${css.replace(/<\/style/gi,'<\\/style')}</style>`)
}
if(/eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]{16,}|https?:\/\/127\.0\.0\.1:54321/.test(html))throw new Error('Backend configuration unexpectedly included')
await writeFile(artifact,html)
console.log(`Created credential-free, self-contained preview: ${artifact}`)
