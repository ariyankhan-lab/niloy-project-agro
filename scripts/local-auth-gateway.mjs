// Local-only adapter for the lightweight Auth/REST test stack, not a production gateway.
import http from 'node:http'
const origins=new Set(['http://localhost:5173','http://127.0.0.1:5173','http://127.0.0.1:4173','http://127.0.0.1:4175'])
const server=http.createServer((request,response)=>{
 const origin=request.headers.origin
 if(origin && !origins.has(origin)){response.writeHead(403);response.end();return}
 if(origin)response.setHeader('Access-Control-Allow-Origin',origin)
 response.setHeader('Vary','Origin')
 response.setHeader('Access-Control-Allow-Headers','authorization,apikey,content-type,x-client-info,prefer,range,range-unit,accept-profile,content-profile,x-upsert,x-supabase-api-version')
 response.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE,OPTIONS')
 if(request.method==='OPTIONS'){response.writeHead(204);response.end();return}
 const url=new URL(request.url,'http://127.0.0.1')
 const prefix=url.pathname.startsWith('/auth/v1/')?'/auth/v1':url.pathname.startsWith('/rest/v1/')?'/rest/v1':null
 if(!prefix){response.writeHead(404);response.end();return}
 const upstream=http.request({host:'127.0.0.1',port:prefix==='/auth/v1'?54328:54329,path:url.pathname.slice(prefix.length)+url.search,method:request.method,headers:{...request.headers,host:'127.0.0.1'}},remote=>{
  response.writeHead(remote.statusCode??502,remote.headers);remote.pipe(response)
 })
 upstream.on('error',()=>{response.writeHead(502,{'Content-Type':'application/json'});response.end('{"message":"Local backend unavailable"}')})
 request.pipe(upstream)
})
server.listen(54321,'127.0.0.1',()=>console.log('FarmLife local-only authentication gateway started on port 54321.'))
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>process.exit(0)))
