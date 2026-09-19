'use strict';

const fs=require('fs');
const path=require('path');
const zlib=require('zlib');
const crypto=require('crypto');

const VERSION='30.39.2';
const DEFAULT_SLOW_MS=Math.max(100,Number(process.env.BOM_SLOW_REQUEST_MS||750));
const DEFAULT_LARGE_BYTES=Math.max(64*1024,Number(process.env.BOM_LARGE_RESPONSE_BYTES||1024*1024));
const metrics={started_at:new Date().toISOString(),requests:0,api_requests:0,slow_requests:0,large_responses:0,errors:0,last_slow:[],last_large:[]};

function pushLimited(arr,item,max=25){arr.unshift(item);if(arr.length>max)arr.length=max}
function requestLabel(req){return `${String(req.method||'GET').toUpperCase()} ${String(req.originalUrl||req.url||'').split('?')[0]}`}

function installEarly({app,root}){
  const publicRoot=path.join(root,'public');

  // Request measurement is intentionally first so every route/module is covered.
  app.use((req,res,next)=>{
    const started=process.hrtime.bigint();
    const requestId=crypto.randomBytes(6).toString('hex');
    metrics.requests++;
    if(String(req.path||'').startsWith('/api/'))metrics.api_requests++;
    res.setHeader('X-BOM-Version',VERSION);
    res.setHeader('X-Request-ID',requestId);
    const originalWriteHead=res.writeHead;
    res.writeHead=function(...args){
      if(!res.headersSent){
        const ms=Number(process.hrtime.bigint()-started)/1e6;
        try{res.setHeader('Server-Timing',`app;dur=${ms.toFixed(1)}`);res.setHeader('X-Response-Time',`${ms.toFixed(1)}ms`)}catch(_){}
      }
      return originalWriteHead.apply(this,args);
    };
    res.on('finish',()=>{
      const ms=Number(process.hrtime.bigint()-started)/1e6;
      const bytes=Number(res.getHeader('Content-Length')||0);
      const label=requestLabel(req);
      if(res.statusCode>=500)metrics.errors++;
      if(String(req.path||'').startsWith('/api/')&&ms>=DEFAULT_SLOW_MS){
        metrics.slow_requests++;pushLimited(metrics.last_slow,{at:new Date().toISOString(),request:label,status:res.statusCode,ms:Number(ms.toFixed(1)),request_id:requestId});
        console.warn(`[PERF] slow ${label} ${res.statusCode} ${ms.toFixed(1)}ms request=${requestId}`);
      }
      if(bytes>=DEFAULT_LARGE_BYTES){
        metrics.large_responses++;pushLimited(metrics.last_large,{at:new Date().toISOString(),request:label,status:res.statusCode,bytes,request_id:requestId});
        console.warn(`[PERF] large ${label} ${res.statusCode} ${(bytes/1024/1024).toFixed(2)}MiB request=${requestId}`);
      }
    });
    next();
  });

  // Built-in gzip for JSON/text API responses. No third-party dependency and no schema change.
  app.use((req,res,next)=>{
    if(!String(req.path||'').startsWith('/api/'))return next();
    if(!/\bgzip\b/i.test(String(req.headers['accept-encoding']||'')))return next();
    const originalJson=res.json.bind(res);
    res.json=function(body){
      try{
        if(res.headersSent)return originalJson(body);
        const raw=Buffer.from(JSON.stringify(body));
        if(raw.length<2048)return originalJson(body);
        // V30.39.2: compression is asynchronous so a large JSON response does not
        // monopolize the Node event loop on smaller Render instances.
        zlib.gzip(raw,{level:zlib.constants.Z_BEST_SPEED},(err,gz)=>{
          if(err){if(!res.headersSent)originalJson(body);return}
          if(res.headersSent)return;
          res.setHeader('Content-Type','application/json; charset=utf-8');
          res.setHeader('Content-Encoding','gzip');
          res.setHeader('Vary','Accept-Encoding');
          res.setHeader('Content-Length',String(gz.length));
          res.end(gz);
        });
        return res;
      }catch(_){return originalJson(body)}
    };
    next();
  });

  // Prefer pre-compressed static assets when present. Versioned assets are immutable-cacheable.
  app.use((req,res,next)=>{
    if(req.method!=='GET'&&req.method!=='HEAD')return next();
    if(!/\bgzip\b/i.test(String(req.headers['accept-encoding']||'')))return next();
    const rel=decodeURIComponent(String(req.path||'')).replace(/^\/+/, '');
    if(!/\.(?:js|css|json)$/i.test(rel)||rel.includes('..'))return next();
    const source=path.join(publicRoot,rel),gz=source+'.gz';
    try{
      if(!fs.existsSync(gz)||!fs.statSync(gz).isFile())return next();
      const ext=path.extname(source).slice(1)||'bin';
      res.type(ext);
      res.setHeader('Content-Encoding','gzip');
      res.setHeader('Vary','Accept-Encoding');
      res.setHeader('Cache-Control','public, max-age=604800, immutable');
      return res.sendFile(gz);
    }catch(_){return next()}
  });

  return metrics;
}

function installRoutes({app,db,auth,allow}){
  // Read-only runtime diagnostics for authorized dashboard/finance/admin users.
  app.get('/api/v339/performance/health',auth,allow('dashboard','finance'),(req,res)=>{
    let sqlite={};
    try{
      sqlite={journal_mode:db.pragma('journal_mode',{simple:true}),synchronous:db.pragma('synchronous',{simple:true}),busy_timeout:db.pragma('busy_timeout',{simple:true}),cache_size:db.pragma('cache_size',{simple:true})};
    }catch(_){}
    res.json({ok:true,version:VERSION,thresholds:{slow_request_ms:DEFAULT_SLOW_MS,large_response_bytes:DEFAULT_LARGE_BYTES},metrics:{...metrics,last_slow:[...metrics.last_slow],last_large:[...metrics.last_large]},sqlite});
  });
  return {VERSION,metrics};
}

function enableSqlProfiling(db){
  if(String(process.env.BOM_SQL_PROFILE||'').toLowerCase()!=='true')return false;
  if(db.__bomV339Profiled)return true;
  const original=db.prepare.bind(db);
  db.prepare=function(sql){
    const stmt=original(sql);const preview=String(sql||'').replace(/\s+/g,' ').trim().slice(0,220);
    for(const method of ['all','get','run']){
      if(typeof stmt[method]!=='function')continue;
      const base=stmt[method].bind(stmt);
      stmt[method]=function(...args){const s=process.hrtime.bigint();try{return base(...args)}finally{const ms=Number(process.hrtime.bigint()-s)/1e6;if(ms>=Number(process.env.BOM_SLOW_SQL_MS||150))console.warn(`[PERF][SQL] ${method} ${ms.toFixed(1)}ms :: ${preview}`)}};
    }
    return stmt;
  };
  db.__bomV339Profiled=true;
  return true;
}

module.exports={VERSION,installEarly,installRoutes,enableSqlProfiling,metrics};
