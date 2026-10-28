'use strict';
// Hold a complete mutation response until its database transaction commits.
// Middleware/auth/multipart run normally; the final business handler and its
// asynchronous response hooks share one PostgreSQL client and audit context.
const administrative=path=>/\/system-settings-v3252\/test-reset(?:\/|$)|\/system-settings-v319\/backups(?:\/|$)/.test(String(path));
let readers=0,writer=false;
const waitingReaders=[],waitingWriters=[];
function drain(){
 if(writer||readers)return;
 if(waitingWriters.length){writer=true;waitingWriters.shift()();return}
 for(const resolve of waitingReaders.splice(0)){readers++;resolve()}
}
async function readLock(){
 if(writer||waitingWriters.length)await new Promise(resolve=>waitingReaders.push(resolve));else readers++;
 let released=false;return ()=>{if(released)return;released=true;readers--;drain()};
}
async function exclusive(work){
 await new Promise(resolve=>{waitingWriters.push(resolve);drain()});
 try{return await work()}finally{writer=false;drain()}
}
async function requestGate(req,res,next){
 if(administrative(req.originalUrl||req.url))return next();
 const release=await readLock();
 res.once('finish',release);res.once('close',release);
 if(req.destroyed){release();return}
 next();
}
function failureStatus(error){return ['40001','40P01','23505'].includes(error.code)?409:Number(error.status)||500}
function transactional(db,handler){
 return async function(req,res,next){
  const original={end:res.end,write:res.write,writeHead:res.writeHead,flushHeaders:res.flushHeaders,json:res.json,send:res.send};
  const chunks=[];let bytes=0,endArguments,settled=false,resolveEnd,rejectEnd;
  const priorHeaders=Object.getOwnPropertyDescriptor(res,'headersSent');
  Object.defineProperty(res,'headersSent',{configurable:true,get:()=>settled});
  const ended=new Promise((resolve,reject)=>{resolveEnd=resolve;rejectEnd=reject});
  // Avoid unhandled-rejection timing if the request disconnects before its
  // handler has returned and begins awaiting the completion promise.
  ended.catch(()=>{});
  for(const method of ['json','send'])res[method]=function(...args){
   try{
    const fn=db.transactionError?.()?require('express').response[method]:original[method];
    const result=fn.apply(this,args);
    if(result&&typeof result.then==='function')result.catch(rejectEnd);
    return result;
   }catch(error){rejectEnd(error);throw error}
  };
  const append=(chunk,encoding)=>{
   if(chunk===undefined||chunk===null)return;
   const buffer=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,typeof encoding==='string'?encoding:undefined);
   bytes+=buffer.length;if(bytes>64*1024*1024)throw Object.assign(Error('Mutation response exceeds the supported buffered export size'),{status:413});chunks.push(buffer);
  };
  res.write=function(chunk,encoding,callback){append(chunk,encoding);const cb=typeof encoding==='function'?encoding:callback;if(cb)queueMicrotask(cb);return true};
  res.end=function(chunk,encoding,callback){
   if(settled)return this;append(chunk,encoding);endArguments=[typeof encoding==='function'?encoding:callback];settled=true;resolveEnd();return this;
  };
  res.writeHead=function(status,message,headers){
   this.statusCode=status;if(typeof message==='string')this.statusMessage=message;else headers=message;
   if(headers){if(Array.isArray(headers)){for(let i=0;i<headers.length;i+=2)this.setHeader(headers[i],headers[i+1])}else for(const [key,value] of Object.entries(headers))this.setHeader(key,value)}
   return this;
  };
  res.flushHeaders=function(){};
  const aborted=()=>rejectEnd(Object.assign(Error('Request disconnected before commit'),{status:499}));
  res.once('close',aborted);
  function restore(){for(const [key,value] of Object.entries(original))res[key]=value;if(priorHeaders)Object.defineProperty(res,'headersSent',priorHeaders);else delete res.headersSent;res.removeListener('close',aborted)}
  let rejectedReply=false;
  try{
   await db.transaction(async()=>{
    await db.query('SELECT pg_advisory_xact_lock_shared(1112493391,3)');
    await handler(req,res,next);
    await ended;
    if(res.statusCode>=400){rejectedReply=true;throw Error('Rollback rejected business response')}
   },{isolation:'SERIALIZABLE',serializeWrites:true});
   restore();
   return original.end.call(res,Buffer.concat(chunks),endArguments?.[0]);
  }catch(error){
   restore();
   if(res.destroyed)return;
   if(rejectedReply)return original.end.call(res,Buffer.concat(chunks),endArguments?.[0]);
   res.removeHeader('Content-Encoding');res.removeHeader('Content-Length');res.removeHeader('Content-Disposition');res.type('application/json');
   const status=failureStatus(error);
   const message=['40001','40P01'].includes(error.code)?'This record changed during the operation. Refresh and retry with the same operation key.':error.message||'Operation could not be committed';
   return res.status(status).json({error:message,code:error.code||undefined});
  }
 };
}
function install(app,db){
 app.use('/api',requestGate);
 for(const method of ['get','post','put','patch','delete']){
  const native=app[method];
  app[method]=function(path,...handlers){
   if(typeof path==='string'&&path.startsWith('/api/')&&!administrative(path)&&path!=='/api/auth/login'){
    const last=handlers.length-1;
    if(method!=='get'&&typeof handlers[last]==='function'&&handlers[last].length!==4)handlers[last]=transactional(db,handlers[last]);
    // Numeric record routes must not capture later named endpoints such as
    // /accounts. Skipping the route preserves Express's normal route ordering.
    if(/:id(?:\/|$)/.test(path))handlers.unshift((req,res,next)=>/^-?\d+$/.test(req.params.id)?next():next('route'));
   }
   return native.call(this,path,...handlers);
  };
 }
}
module.exports={install,transactional,exclusive,administrative,requestGate};
