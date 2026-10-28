'use strict';
// AST-based inventory of runtime conversion work. It intentionally counts real
// calls, not text in comments, strings, or historical QA reports.
const fs=require('node:fs'),path=require('node:path');
const parser=require('@babel/parser'),traverse=require('@babel/traverse').default;
const root=path.resolve(__dirname,'../..');
function files(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(e.name==='postgres'?[]:files(path.join(directory,e.name))):e.name.endsWith('.js')?[path.join(directory,e.name)]:[])}
function memberName(n){return n?.type==='Identifier'?n.name:n?.type==='StringLiteral'?n.value:null}
function audit(){
  const result=[];
  for(const file of files(path.join(root,'server'))){
    const ast=parser.parse(fs.readFileSync(file,'utf8'),{sourceType:'script',allowReturnOutsideFunction:true});
    const sites=[];
    traverse(ast,{CallExpression(p){
      const node=p.node,callee=node.callee;
      if(callee.type==='MemberExpression'&&['prepare','transaction','pragma','exec','backup'].includes(memberName(callee.property))){
        const expression=callee.object;
        // Database objects passed through module context are conventionally db;
        // wrapped aliases remain discoverable in the per-file syntax inventory.
        if(expression.type==='Identifier'&&expression.name==='db')sites.push({line:node.loc.start.line,kind:memberName(callee.property)});
      }
      if(callee.type==='Identifier'&&callee.name==='require'&&node.arguments[0]?.value==='better-sqlite3')sites.push({line:node.loc.start.line,kind:'sqlite-driver'});
    }});
    if(sites.length)result.push({file:path.relative(root,file),status:'pending-async-conversion',sites});
  }
  const totals={};for(const f of result)for(const s of f.sites)totals[s.kind]=(totals[s.kind]||0)+1;
  return {target:'One PostgreSQL database, all business units and modules',baseline:'30.69.50',runtimeReady:result.length===0,filesRemaining:result.length,totals,files:result};
}
if(require.main===module){
  const report=audit(),file=process.argv.slice(2).find(x=>!x.startsWith('--'));
  if(file)fs.writeFileSync(path.resolve(file),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({runtimeReady:report.runtimeReady,filesRemaining:report.filesRemaining,totals:report.totals}));
  if(process.argv.includes('--check')&&!report.runtimeReady)process.exitCode=1;
}
module.exports={audit};
