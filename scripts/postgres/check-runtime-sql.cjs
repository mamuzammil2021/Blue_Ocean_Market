'use strict';
// Plan statically recoverable runtime SQL against a disposable PostgreSQL
// engine. EXPLAIN (without ANALYZE) does not execute business mutations.
const fs=require('fs'),path=require('path'),parser=require('@babel/parser'),traverse=require('@babel/traverse').default;
const {parameters}=require('../../server/postgres/runtime');
const root=path.resolve(__dirname,'../..');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?(x.name==='postgres'?[]:files(path.join(dir,x.name))):x.name.endsWith('.js')?[path.join(dir,x.name)]:[])}
async function main(){
 const {PGlite}=require('@electric-sql/pglite');const p=new PGlite();await p.waitReady;
 const {createDatabase}=require('../../server/postgres/connection');
 const run=async(s,v=[])=>v.length?p.query(s,v):(await p.exec(s)).at(-1)||{rows:[]};
 const db=createDatabase({pool:{query:run,connect:async()=>({query:run,release(){}})}});
 try{
  await require('../../server/postgres/migrate').migrate(db);await p.exec('SET search_path TO bom,pg_catalog');
  const queries=new Map();
  for(const file of files(path.join(root,'server'))){
   if(file.endsWith('v3252.js')||file.endsWith('test-reset-tables.js'))continue;
   const ast=parser.parse(fs.readFileSync(file,'utf8'),{sourceType:'script'});
   traverse(ast,{CallExpression(x){
    const a=x.node.arguments[0];
    const sql=a?.type==='StringLiteral'?a.value:a?.type==='TemplateLiteral'&&!a.expressions.length?a.quasis[0].value.cooked:null;
    const c=x.node.callee,n=c.type==='Identifier'?c.name:c.type==='MemberExpression'?c.property.name:null;
    if(!sql||!['prepare','one','rows','sum','run','query','all','get'].includes(n)||!/^\s*(SELECT|INSERT|UPDATE|DELETE|WITH)\b/i.test(sql))return;
    if(!queries.has(sql))queries.set(sql,{file:path.relative(root,file),line:x.node.loc.start.line});
   }});
  }
  const failures=[];let checked=0;
  for(const [sql,location] of queries){
   const compiled=parameters(sql);
   try{await run('EXPLAIN '+compiled.sql,Array(compiled.count).fill(null));checked++}
   catch(e){failures.push({...location,sql,code:e.code,error:e.message})}
  }
  const report={checked,failed:failures.length,failures};
  fs.writeFileSync(path.join(root,'qa/evidence/postgres-sql-planning.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({checked,failed:failures.length,examples:failures.slice(0,18).map(x=>({file:x.file,line:x.line,error:x.error}))}));
  if(failures.length)process.exitCode=1;
 }finally{await p.close()}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1});
