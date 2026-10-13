'use strict';
// Real Express HTTP responses with gzip negotiation and a disposable asset directory.
const fs=require('fs'),os=require('os'),path=require('path'),http=require('http'),zlib=require('zlib'),crypto=require('crypto'),assert=require('assert'),express=require('express');
const perf=require(process.env.BOM_PERFORMANCE_MODULE||'../server/v339-performance');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'bom-static-36923-')),pub=path.join(temp,'public'),checks=[];
fs.mkdirSync(pub);const source=path.join(pub,'client.js'),gz=source+'.gz',current=Buffer.from('window.BOM_RELEASE="30.69.23";');fs.writeFileSync(source,current);fs.writeFileSync(gz,zlib.gzipSync('window.BOM_RELEASE="obsolete";'));
const app=express();perf.installEarly({app,root:temp});app.use(express.static(pub,{setHeaders(res){res.setHeader('Cache-Control','no-cache')}}));const server=app.listen(0,'127.0.0.1');
function get(url,encoding='gzip',method='GET'){return new Promise((resolve,reject)=>{const req=http.request({hostname:'127.0.0.1',port:server.address().port,path:url,method,headers:{'Accept-Encoding':encoding}},res=>{const b=[];res.on('data',x=>b.push(x));res.on('end',()=>{const raw=Buffer.concat(b);resolve({status:res.statusCode,headers:res.headers,body:method==='HEAD'?raw:res.headers['content-encoding']==='gzip'?zlib.gunzipSync(raw):raw})})});req.on('error',reject);req.end()})}
function pass(s){checks.push(s);console.log('PASS '+s)}
(async()=>{try{
 await new Promise(r=>server.on('listening',r));let r=await get('/client.js?v=30.69.23');assert(r.body.equals(current));assert(!r.headers['content-encoding']);pass('Stale gzip falls back to the exact current canonical source');
 r=await get('/client.js?v=30.69.23','identity');assert(r.body.equals(current));assert(/Accept-Encoding/i.test(r.headers.vary));pass('Identity and gzip clients receive the same release with Vary headers');
 fs.writeFileSync(gz,zlib.gzipSync(current));r=await get('/client.js?v=30.69.23');assert(r.body.equals(current));assert.equal(r.headers['content-encoding'],'gzip');pass('Matching precompressed source retains gzip delivery');
 assert.equal(r.headers['x-bom-version'],require('../package.json').version);pass('HTTP release header identifies the actual application version');
 r=await get('/client.js');assert(!/immutable/.test(r.headers['cache-control']));pass('Unversioned compressed assets require cache revalidation');
 fs.writeFileSync(source,'window.BOM_RELEASE="newer";');r=await get('/client.js?v=30.69.23');assert(r.body.equals(fs.readFileSync(source)));assert(!r.headers['content-encoding']);pass('Cached gzip validation is invalidated when canonical source changes');
 fs.writeFileSync(gz,'corrupt gzip');r=await get('/client.js?v=30.69.23');assert(r.body.equals(fs.readFileSync(source)));pass('Corrupt compressed artifacts safely fall back without a failed page');
 fs.writeFileSync(gz,zlib.gzipSync(fs.readFileSync(source)));r=await get('/client.js?v=30.69.23','gzip;q=0, identity');assert(!r.headers['content-encoding']);pass('Explicit gzip quality zero respects client encoding preference');
 r=await get('/client.js?v=30.69.23','gzip','HEAD');assert.equal(r.headers['content-encoding'],'gzip');assert.equal(r.body.length,0);pass('HEAD negotiates the same verified representation without a response body');
 fs.writeFileSync(path.join(pub,'orphan.js.gz'),zlib.gzipSync('obsolete'));r=await get('/orphan.js?v=30.69.23');assert.equal(r.status,404);pass('An orphan compressed file cannot replace a missing canonical asset');
 fs.mkdirSync(path.join(temp,'server'));const version=require('../package.json').version;fs.writeFileSync(path.join(temp,'package.json'),JSON.stringify({version}));fs.writeFileSync(path.join(temp,'server/frontend-manifest.json'),JSON.stringify({version,files:{'public/client.js':crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex')}}));
 const {assertFrontendIntegrity}=require('../server/frontend-integrity');assert.equal(assertFrontendIntegrity(temp).files,1);pass('Matching frontend release passes startup integrity validation');
 fs.writeFileSync(source,'obsolete startup source');assert.throws(()=>assertFrontendIntegrity(temp),/Frontend release integrity failed/);pass('A mixed canonical frontend release is rejected before database startup');
 fs.writeFileSync(path.join(__dirname,'evidence/36923-static-assets.json'),JSON.stringify({status:'PASS',checks,production_data_used:false},null,2));
 }catch(e){console.error(e.message);process.exitCode=1}finally{server.close();fs.rmSync(temp,{recursive:true,force:true})}})();
