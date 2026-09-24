'use strict';
// V30.46 opt-in, bounded diagnostics. No SQL literals, bind values, user IDs or raw URLs are recorded.
const {AsyncLocalStorage}=require('node:async_hooks');
const {monitorEventLoopDelay}=require('node:perf_hooks');
const crypto=require('node:crypto');
const context=new AsyncLocalStorage();
const enabled=String(process.env.BOM_PERF_DETAILED||'false').toLowerCase()==='true';
const SLOW_SQL_MS=Math.max(5,Math.min(2000,Number(process.env.BOM_SLOW_SQL_MS||150)));
const MAX_ENDPOINTS=80,MAX_SLOW=40,MAX_RECENT=64;
const endpointStats=new Map(),slowQueries=[];
let counted=0;
// Opt-in only: event-loop delay is process-wide and contains no request/user information.
const loopLag=enabled?monitorEventLoopDelay({resolution:20}):null;
if(loopLag)loopLag.enable();
const sample=(n)=>Math.round(n*10)/10;
function requestLabel(req){
  // Express matched route suppresses IDs; fallback replaces numeric IDs and tokens.
  const route=req.route?.path?String(req.route.path):String(req.path||'').replace(/\b\d+\b/g,':id').replace(/[0-9a-f]{12,}/ig,':token');
  return String(req.method||'GET').toUpperCase()+' '+route.split('?')[0].slice(0,100);
}
function addBounded(row){const key=row.route;let value=endpointStats.get(key);
  if(!value){if(endpointStats.size>=MAX_ENDPOINTS){let oldest=null;for(const [k,v] of endpointStats)if(!oldest||v.at<oldest[1].at)oldest=[k,v];if(oldest)endpointStats.delete(oldest[0])}
    value={requests:0,total_ms:0,max_ms:0,sql_queries:0,sql_ms:0,bytes:0,errors:0,at:0,latencies:[],sql_latencies:[],max_sql_queries:0,max_bytes:0,slowest_sql_ms:0};endpointStats.set(key,value)}
  value.requests++;value.total_ms+=row.ms;value.max_ms=Math.max(value.max_ms,row.ms);value.sql_queries+=row.sql_count;value.sql_ms+=row.sql_ms;value.bytes+=row.bytes;value.errors+=row.status>=500?1:0;value.at=Date.now();value.max_sql_queries=Math.max(value.max_sql_queries,row.sql_count);value.max_bytes=Math.max(value.max_bytes,row.bytes);value.slowest_sql_ms=Math.max(value.slowest_sql_ms,row.slowest_sql_ms);value.latencies.push(row.ms);value.sql_latencies.push(row.sql_ms);if(value.latencies.length>MAX_RECENT)value.latencies.shift();if(value.sql_latencies.length>MAX_RECENT)value.sql_latencies.shift();
}
function installEarly({app,db}){
  if(!enabled)return false;
  app.use((req,res,next)=>{
    const start=process.hrtime.bigint(),scope={sql_count:0,sql_ms:0,bytes:0,slowest_ms:0};
    const write=res.write,end=res.end;
    const addChunk=(chunk,encoding)=>{if(Buffer.isBuffer(chunk))scope.bytes+=chunk.length;else if(typeof chunk==='string')scope.bytes+=Buffer.byteLength(chunk,typeof encoding==='string'?encoding:'utf8')};
    res.write=function(chunk,encoding,...rest){addChunk(chunk,encoding);return write.call(this,chunk,encoding,...rest)};
    res.end=function(chunk,encoding,...rest){addChunk(chunk,encoding);return end.call(this,chunk,encoding,...rest)};
    res.once('finish',()=>{
      if(!String(req.path||'').startsWith('/api/'))return;
      const row={route:requestLabel(req),ms:sample(Number(process.hrtime.bigint()-start)/1e6),sql_count:scope.sql_count,sql_ms:sample(scope.sql_ms),slowest_sql_ms:sample(scope.slowest_ms),bytes:scope.bytes,status:res.statusCode};
      counted++;addBounded(row);
      if(row.ms>=750||row.sql_count>=80)console.warn(`[PERF][V346] ${row.route} ${row.status} ${row.ms}ms sql=${row.sql_count} sql_ms=${row.sql_ms} bytes=${row.bytes}`);
    });
    context.run(scope,next);
  });
  const original=db.prepare.bind(db);
  db.prepare=function(sql){const stmt=original(sql),fingerprint=crypto.createHash('sha256').update(String(sql||'').replace(/\s+/g,' ').trim().replace(/\b\d+\b/g,'?')).digest('hex').slice(0,12);
    for(const method of ['get','all','run']){
      if(typeof stmt[method]!=='function')continue;
      const base=stmt[method].bind(stmt);
      try{stmt[method]=function(...args){const started=process.hrtime.bigint();try{return base(...args)}finally{
        const ms=Number(process.hrtime.bigint()-started)/1e6,scope=context.getStore();
        if(scope){scope.sql_count++;scope.sql_ms+=ms;scope.slowest_ms=Math.max(scope.slowest_ms,ms)}
        if(ms>=SLOW_SQL_MS){slowQueries.unshift({at:new Date().toISOString(),fingerprint,method,ms:sample(ms)});if(slowQueries.length>MAX_SLOW)slowQueries.length=MAX_SLOW;console.warn(`[PERF][SQL] ${method} ${sample(ms)}ms id=${fingerprint}`)}
      }};}catch(_){/* Statement implementation may disallow overrides; never change query behavior. */}
    }
    return stmt;
  };
  return true;
}
function percentile(values,p){if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b);return sample(sorted[Math.max(0,Math.ceil(p*sorted.length)-1)])}
function snapshot(){return {enabled,requests_observed:counted,event_loop_ms:loopLag?{mean:sample(loopLag.mean/1e6||0),p95:sample(loopLag.percentile(95)/1e6||0),p99:sample(loopLag.percentile(99)/1e6||0),max:sample(loopLag.max/1e6||0)}:null,thresholds:{slow_sql_ms:SLOW_SQL_MS},endpoints:[...endpointStats.entries()].map(([route,v])=>({route,requests:v.requests,avg_ms:sample(v.total_ms/v.requests),p95_ms:percentile(v.latencies,.95),p99_ms:percentile(v.latencies,.99),max_ms:sample(v.max_ms),avg_sql_queries:sample(v.sql_queries/v.requests),max_sql_queries:v.max_sql_queries,avg_sql_ms:sample(v.sql_ms/v.requests),p95_sql_ms:percentile(v.sql_latencies,.95),slowest_sql_ms:sample(v.slowest_sql_ms),avg_bytes:Math.round(v.bytes/v.requests),max_bytes:v.max_bytes,errors:v.errors})).sort((a,b)=>b.avg_ms-a.avg_ms),slow_queries:[...slowQueries]}}
function installRoutes({app,auth,allow}){app.get('/api/v346/performance/diagnostics',auth,allow('dashboard','finance'),(req,res)=>res.json(snapshot()))}
module.exports={enabled,installEarly,installRoutes,snapshot};
