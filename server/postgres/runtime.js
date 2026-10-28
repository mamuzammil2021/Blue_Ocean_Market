'use strict';
const {createDatabase,identifier}=require('./connection');
let singleton;

// Only bind markers are compiled here. SQL dialect/function/schema conversion
// is a source migration, never a per-request translation or SQLite bridge.
function parameters(sql){
 let out='',count=0,quote=null,line=false,block=false;
 for(let i=0;i<sql.length;i++){
  const c=sql[i],n=sql[i+1];
  if(line){out+=c;if(c==='\n')line=false;continue}
  if(block){out+=c;if(c==='*'&&n==='/'){out+=n;i++;block=false}continue}
  if(quote){out+=c;if(c===quote){if(n===quote){out+=n;i++}else quote=null}continue}
  if(c==='-'&&n==='-'){out+=c+n;i++;line=true;continue}
  if(c==='/'&&n==='*'){out+=c+n;i++;block=true;continue}
  if(c==="'"||c==='"'){quote=c;out+=c;continue}
  out+=c==='?'?'$'+(++count):c;
 }
 return {sql:out,count};
}

function values(args){return args.length===1&&Array.isArray(args[0])?args[0]:args}
function rows(result){
 const numeric=new Map((result.fields||[]).filter(f=>[20,1700].includes(f.dataTypeID)).map(f=>[f.name,f.dataTypeID]));
 return result.rows.map(row=>{
  const out={...row};
  for(const [name,oid] of numeric){
   const value=out[name];if(value===null||value===undefined)continue;
   const n=Number(value);
   if(!Number.isFinite(n)||Math.abs(n)>Number.MAX_SAFE_INTEGER||(oid===20&&!Number.isSafeInteger(n)))throw new Error(`PostgreSQL value exceeds the application's supported numeric range (${name})`);
   // Local API boundary only: preserve the existing JSON/JS number contract.
   // The import/raw pg layer retains exact strings and never uses this parser.
   out[name]=n;
  }
  return out;
 });
}

function adapt(core){
 const db={...core};
 db.prepare=function(sql){
  const leading=typeof sql==='string'?sql.replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)*/,''):'';
  if(!/^(SELECT|WITH|INSERT|UPDATE|DELETE)\b/i.test(leading))throw new Error('Only native PostgreSQL data statements are accepted by the runtime');
  const compiled=parameters(sql);
  async function execute(args,insertResult=false){
   let query=compiled.sql.trim().replace(/;\s*$/,'');
   if(insertResult&&/^INSERT\b/i.test(query)&&! /\bRETURNING\b/i.test(query))query+=' RETURNING *';
   const bound=values(args).map((v,index)=>{
    if(v&&typeof v.then==='function'||typeof v==='number'&&!Number.isFinite(v)){
     const error=Error(`Unresolved asynchronous or non-finite PostgreSQL parameter at position ${index+1}`);
     if(process.env.APP_ENV==='testing')console.error(error.stack);
     throw error;
    }
    return v===undefined?null:typeof v==='bigint'?v.toString():v;
   });
   if(compiled.count&&bound.length!==compiled.count)throw new Error(`PostgreSQL parameter count mismatch: expected ${compiled.count}, received ${bound.length}`);
   const result=await core.query(query,bound);
   return {result,rows:rows(result)};
  }
  return {
   async all(...args){return (await execute(args)).rows},
   async get(...args){return (await execute(args)).rows[0]},
   async run(...args){const r=await execute(args,true);return {changes:r.result.rowCount||r.result.affectedRows||0,lastInsertRowid:r.rows[0]?.id,rows:r.rows}},
   async iterate(...args){return (await execute(args)).rows}
  };
 };
 db.columns=async table=>{
  const result=await core.query(`SELECT a.attnum-1 AS cid,a.attname AS name,
    CASE WHEN a.atttypid='bigint'::regtype THEN 'INTEGER' WHEN a.atttypid='numeric'::regtype THEN 'REAL' ELSE 'TEXT' END AS type,
    a.attnotnull::integer AS "notnull", pg_get_expr(d.adbin,d.adrelid) AS dflt_value,
    COALESCE(array_position(i.indkey::smallint[],a.attnum)+1,0) AS pk
    FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid=a.attrelid
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
    LEFT JOIN pg_catalog.pg_index i ON i.indrelid=c.oid AND i.indisprimary
    WHERE n.nspname='bom' AND c.relname=$1 AND a.attnum>0 AND NOT a.attisdropped ORDER BY a.attnum`,[table]);
  return rows(result);
 };
 db.atomic=fn=>{
  const invoke=async(...args)=>core.transaction(()=>fn(...args),{isolation:'SERIALIZABLE',serializeWrites:true});
  invoke.immediate=invoke;invoke.deferred=invoke;invoke.exclusive=invoke;
  return invoke;
 };
 db.exec=async sql=>{
  if(!/^\s*(UPDATE|DELETE|INSERT)\b/i.test(sql))throw new Error('Runtime schema changes are prohibited; add an ordered PostgreSQL migration');
  return core.query(sql);
 };
 db.identifier=identifier;
 db.foreignKeyCheck=async()=>core.all(`SELECT c.conname AS constraint_name FROM pg_catalog.pg_constraint c
   JOIN pg_catalog.pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='bom' AND c.contype='f' AND NOT c.convalidated`);
 Object.defineProperty(db,'inTransaction',{get:()=>core.inTransaction()});
 return db;
}

function getDatabase(){
 if(!singleton){
  const injected=globalThis[Symbol.for('bom.postgres.test.pool')];
  if(injected&&process.env.APP_ENV!=='testing')throw new Error('Injected PostgreSQL test pool requires APP_ENV=testing');
  const core=createDatabase(injected?{pool:injected}:undefined);
  singleton=adapt(core);
  if(injected?.end)singleton.close=async()=>{await core.close();await injected.end()};
 }
 return singleton;
}
module.exports={getDatabase,adapt,parameters,rows};
