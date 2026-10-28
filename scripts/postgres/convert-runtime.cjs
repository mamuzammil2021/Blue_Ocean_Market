'use strict';
// Development-only, repeatable source conversion from a local checkpoint.
// The generated application contains native SQL; this script is never loaded
// by the server. Every generated change remains subject to runtime acceptance.
const fs=require('fs'),path=require('path'),cp=require('child_process');
const parser=require('@babel/parser'),traverse=require('@babel/traverse').default,t=require('@babel/types'),generate=require('@babel/generator').default;
const root=path.resolve(__dirname,'../..'),checkpoint=process.env.BOM_CONVERSION_BASE||'HEAD';
const catalog=require('../../server/postgres/catalog-v306950.json');const sqlFixes=require('./runtime-sql-fixes.json');
const sources=cp.execFileSync('git',['ls-tree','-r','--name-only',checkpoint],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>f.startsWith('server/')&&f.endsWith('.js')&&!f.startsWith('server/postgres/')&&!['server/test-reset-tables.js','server/v3252.js'].includes(f));
if(process.env.BOM_CONVERT_QA==='true')sources.push('qa/postgres/fx_fixture.cjs',...JSON.parse(fs.readFileSync('/tmp/bom-pg-qa-inputs.json','utf8')));
const asts=new Map(),asyncNodes=new Set(),names=new Set(),aliases=new Map(),statementNames=new Set(),awaitCalls=new Set();
const prop=n=>n?.type==='Identifier'?n.name:n?.type==='StringLiteral'?n.value:null;
const member=(node,name)=>t.isMemberExpression(node)&&prop(node.property)===name;
const key=p=>{
 const n=p.node,pa=p.parentPath;
 if(n.id?.name)return n.id.name;
 if(pa?.isVariableDeclarator())return prop(pa.node.id);
 if(p.isObjectMethod()||p.isClassMethod())return prop(n.key);
 if(pa?.isObjectProperty())return prop(pa.node.key);
 if(pa?.isAssignmentExpression())return prop(pa.node.left.property)||prop(pa.node.left);
 return null;
};
const qsql=n=>t.isStringLiteral(n)?n.value:t.isTemplateLiteral(n)?n.quasis.map((q,i)=>q.value.cooked+(i<n.expressions.length?`__DYNAMIC_${i}__`:'')).join(''):null;
const mark=p=>{const fn=p.getFunctionParent();if(!fn)return false;if(fn.isClassMethod({kind:'constructor'}))throw Error('Database call in a constructor');let changed=!asyncNodes.has(fn.node);asyncNodes.add(fn.node);fn.node.async=true;const name=key(fn);if(name&&!names.has(name)){names.add(name);changed=true}return changed};
const requestAwait=p=>{if(!p.getFunctionParent())return false;awaitCalls.add(p.node);return mark(p)};

function nativeFunctions(sql){
 let out='';
 for(let i=0;i<sql.length;){
  if(sql[i]==="'"||sql[i]==='"'){
   const q=sql[i],start=i++;while(i<sql.length){if(sql[i++]===q){if(sql[i]===q)i++;else break}}out+=sql.slice(start,i);continue;
  }
  const match=sql.slice(i).match(/^(MAX|MIN|GROUP_CONCAT|INSTR)\s*\(/i);
  if(!match||i>0&&/[\w.]/.test(sql[i-1])){out+=sql[i++];continue}
  const open=i+match[0].length-1;let j=open+1,depth=1,quote=null,begin=j,args=[];
  for(;j<sql.length;j++){
   const c=sql[j];if(quote){if(c===quote){if(sql[j+1]===quote)j++;else quote=null}continue}
   if(c==="'"||c==='"'){quote=c;continue}if(c==='(')depth++;else if(c===')'){if(--depth===0){args.push(sql.slice(begin,j));break}}else if(c===','&&depth===1){args.push(sql.slice(begin,j));begin=j+1}
  }
  if(depth){out+=sql.slice(i);break}
  args=args.map(nativeFunctions);const name=match[1].toUpperCase();
  if(name==='GROUP_CONCAT'){
   const distinct=/^\s*DISTINCT\b/i.test(args[0]);const value=args[0].replace(/^\s*DISTINCT\s+/i,'');
   out+=`STRING_AGG(${distinct?'DISTINCT ':''}(${value})::text,${args[1]||"','"})`;
  }else out+=(name==='INSTR'?'STRPOS':args.length>1?(name==='MAX'?'GREATEST':'LEAST'):name)+'('+args.join(',')+')';
  i=j+1;
 }
 return out;
}
function replaceSQL(sql){
 return nativeFunctions(sql).replace(/sqlite_master\b/g,'bom._relations')
  .replace(/\bCURRENT_TIMESTAMP\b/g,'bom.utc_now()')
  .replace(/\bdatetime\s*\(/gi,'bom.utc_datetime(')
  .replace(/\bjulianday\s*\(/gi,'bom.julian_day(')
  .replace(/\bjson_extract\s*\(/gi,'bom.json_text(')
  .replace(/\bjson_each\s*\(/gi,'bom.json_elements(')
  .replace(/\bIFNULL\s*\(/gi,'COALESCE(')
  .replace(/\bIS NOT 0\b/gi,"IS DISTINCT FROM '0'")
  .replace(/\bCOLLATE NOCASE\b/gi,'')
  .replace(/\bINSERT OR IGNORE\b/gi,'INSERT')
  .replace(/\bINSERT OR REPLACE\b/gi,'INSERT');
}

for(const file of sources){
 let input=file==='qa/postgres/fx_fixture.cjs'?fs.readFileSync('/tmp/bom-postgres-fx-fixture-input.cjs','utf8'):file.startsWith('qa/postgres/regressions/')?fs.readFileSync('/tmp/'+path.basename(file)+'.input','utf8'):cp.execFileSync('git',['show',`${checkpoint}:${file}`],{cwd:root,encoding:'utf8'});
 if(file==='server/db.js'){
  input=input.slice(input.indexOf('db.exec(`'));
  input=input.replace('module.exports=db;','');
  input=`'use strict';const bcrypt=require('bcryptjs'),fs=require('fs'),path=require('path');const storage=require('./runtime-storage');const dataDir=storage.dataDir;const db=require('./postgres/runtime').getDatabase();module.exports=db;db.ready=(async()=>{await require('./postgres/migrate').migrate(db);await require('./postgres/maintenance').recover(db,storage);db._resetSeedFile=(await require('../scripts/test-reset-startup').applyPending(storage,db))?.file;\n${input}\nreturn db;})();`;
 }
 if(file==='server/numbering-service.js')input=input.replace('ensure();\nmodule.exports', 'module.exports');
 if(file==='server/server.js')input=`module.exports=(async()=>{\n${input.replace("const db=require('./db');","const db=require('./db');await db.ready;")}\nreturn {app,httpServer,db};})();module.exports.catch(e=>{console.error('[startup]',e.stack||e);process.exit(1)});`;
 if(file==='server/server.js'){
  input=input.replace("const numbering=require('./numbering-service');","const numbering=require('./numbering-service');await numbering.ensure();");
  input=input.replace("const app=express(),PORT=process.env.PORT||3000;","const app=express(),PORT=process.env.PORT||3000;require('./postgres/request-boundaries').install(app,db);");
  input=input.replace("const httpServer=app.listen", "if(db._resetSeedFile)fs.rmSync(db._resetSeedFile,{force:true});const httpServer=app.listen");
 }
 const ast=parser.parse(input,{sourceType:'script',allowReturnOutsideFunction:true});asts.set(file,{ast,input});
 traverse(ast,{
  Function(p){if(p.node.async){asyncNodes.add(p.node);const n=key(p);if(n)names.add(n)}},
  VariableDeclarator(p){
   if(t.isObjectPattern(p.node.id))for(const x of p.node.id.properties)if(t.isObjectProperty(x)&&t.isIdentifier(x.value))aliases.set(x.value.name,prop(x.key));
   if(t.isIdentifier(p.node.id)&&member(p.node.init?.callee,'prepare'))statementNames.add(p.node.id.name);
  },
  CallExpression(p){
   const c=p.node.callee;
   if(t.isMemberExpression(c)&&['run','get','all'].includes(prop(c.property))&&member(c.object?.callee,'prepare')){
    const sql=qsql(c.object.arguments[0]);if(sql&&/^\s*(CREATE|ALTER|DROP)\b/i.test(sql)){p.replaceWith(t.unaryExpression('void',t.numericLiteral(0)));p.skip();return}
   }
   if(member(c,'exec')&&t.isIdentifier(c.object,{name:'db'})){
    const sql=qsql(p.node.arguments[0]);
    if(!sql||!/^\s*(UPDATE|DELETE|INSERT)\b/i.test(sql)){p.replaceWith(t.unaryExpression('void',t.numericLiteral(0)));p.skip();return}
   }
   if(member(c,'transaction')&&t.isIdentifier(c.object,{name:'db'}))c.property=t.identifier('atomic');
   if(member(c,'pragma')&&(t.isIdentifier(c.object,{name:'db'})||member(c.object,'db'))){
    const sql=qsql(p.node.arguments[0]);
    if(sql==='foreign_key_check'){p.replaceWith(t.callExpression(t.memberExpression(c.object,t.identifier('foreignKeyCheck')),[]));}
    else if(sql&&/^table_info\(/i.test(sql)){
     const table=sql.match(/^table_info\((.*?)\)/i)?.[1];
     p.replaceWith(t.callExpression(t.memberExpression(t.identifier('db'),t.identifier('columns')),[t.stringLiteral(table)]));
    }else p.replaceWith(t.arrayExpression([]));
   }
   if(member(c,'all')&&member(c.object?.callee,'prepare')){
    const arg=c.object.arguments[0],sql=qsql(arg);
    if(sql&&/^PRAGMA table_info\(/i.test(sql)){
     const match=sql.match(/^PRAGMA table_info\((.*?)\)/i),dyn=match?.[1]?.match(/^__DYNAMIC_(\d+)__$/);
     const table=dyn?arg.expressions[Number(dyn[1])]:t.stringLiteral(match[1]);
     p.replaceWith(t.callExpression(t.memberExpression(t.identifier('db'),t.identifier('columns')),[table]));
    }
   }
  },
  StringLiteral(p){
   if(!/\b(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|GROUP_CONCAT|json_extract|CURRENT_TIMESTAMP|datetime|julianday|instr)\b/i.test(p.node.value))return;
   const original=p.node.value;
   let value=replaceSQL(original);
   if(/^\s*INSERT OR IGNORE\b/i.test(original))value+=' ON CONFLICT DO NOTHING';
   if(/^\s*INSERT OR REPLACE\b/i.test(original)){
    const match=original.match(/INTO\s+(\w+)\s*\(([^)]+)\)/i),table=catalog.tables.find(x=>x.name===match?.[1]);
    if(!table)throw Error('Unknown replace target '+original);
    const columns=match[2].split(',').map(x=>x.trim()),pk=table.columns.filter(c=>c.pk).sort((a,b)=>a.pk-b.pk).map(c=>c.name);
    // Existing REPLACE sites update the complete logical row identified by its
    // primary key or their explicit unique business key; never delete/reinsert.
    const conflict=pk.length&&pk.every(c=>columns.includes(c))?pk:table.indexes.filter(i=>i.origin==='u').map(i=>i.columns.filter(c=>c.key).map(c=>c.name)).find(cs=>cs.every(c=>columns.includes(c)));
    if(!conflict)throw Error('REPLACE requires a reviewed key '+original);
    const updates=columns.filter(c=>!conflict.includes(c));
    value+=` ON CONFLICT (${conflict.join(',')}) DO ${updates.length?'UPDATE SET '+updates.map(c=>c+'=EXCLUDED.'+c).join(','):'NOTHING'}`;
   }
   p.node.value=sqlFixes[value]||value;delete p.node.extra;
  },
  TemplateLiteral(p){
   const original=qsql(p.node);if(!/\b(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|GROUP_CONCAT|json_extract|CURRENT_TIMESTAMP|datetime|julianday|instr)\b/i.test(original||''))return;
   let value=replaceSQL(original);if(/^\s*INSERT OR IGNORE\b/i.test(original))value+=' ON CONFLICT DO NOTHING';
   value=sqlFixes[value]||value;const chunks=value.split(/__DYNAMIC_\d+__/);if(chunks.length!==p.node.quasis.length)throw Error('Template interpolation changed');
   for(let i=0;i<chunks.length;i++){p.node.quasis[i].value.cooked=chunks[i];p.node.quasis[i].value.raw=chunks[i].replace(/\\/g,'\\\\').replace(/`/g,'\\`').replace(/\$\{/g,'\\${')}
  }

 });
}

function statement(node,scope){
 if(!node)return false;
 if(t.isCallExpression(node)&&t.isMemberExpression(node.callee))return prop(node.callee.property)==='prepare'||statement(node.callee.object,scope);
 if(t.isIdentifier(node)){
  const b=scope.getBinding(node.name);const init=b?.path.isVariableDeclarator()?b.path.node.init:null;
  return !!init&&t.isCallExpression(init)&&member(init.callee,'prepare');
 }
 return false;
}
names.add('close');names.add('restart');
const ignored=new Set(['next','resolve','reject','cb','callback']);
const intrinsics=new Set(['Math','JSON','Number','String','Boolean','Buffer','Object','Array','Date','console','crypto','fs','path','zlib','D','M','req','res','process','Promise','jwt','bcrypt','os']);
function intrinsic(c,scope){
 if(!t.isMemberExpression(c)&&!t.isOptionalMemberExpression(c))return false;
 const o=c.object;if(t.isIdentifier(o)&&intrinsics.has(o.name))return true;
 if(['map','flatMap','filter','forEach','some','every','find','findIndex','reduce','sort','then','catch','finally'].includes(prop(c.property)))return true;
 if(t.isIdentifier(o)){const b=scope.getBinding(o.name),init=b?.path.isVariableDeclarator()?b.path.node.init:null;if(t.isNewExpression(init)&&['Map','WeakMap','Set','WeakSet'].includes(init.callee.name))return true}
 return false;
}
function knownAsync(p){
 const c=p.node.callee,n=callName(c);if(!n||(t.isIdentifier(c)&&ignored.has(n))||intrinsic(c,p.scope))return false;
 if(t.isIdentifier(c)){
  const binding=p.scope.getBinding(n),bp=binding?.path;
  if(bp?.isFunctionDeclaration())return asyncNodes.has(bp.node);
  if(bp?.isVariableDeclarator()&&t.isFunction(bp.node.init))return asyncNodes.has(bp.node.init);
  if(bp?.isVariableDeclarator()){
   const init=bp.node.init;
   if(t.isCallExpression(init)&&member(init.callee,'bind')){
    const target=init.callee.object;
    if(t.isMemberExpression(target)&&target.computed)return true;
    const name=callName(target)||prop(target);return names.has(name);
   }
   if(t.isMemberExpression(init)&&init.computed)return true;
  }
 }
 return names.has(n)||names.has(aliases.get(n));
}

function callName(c){return t.isIdentifier(c)?c.name:t.isMemberExpression(c)||t.isOptionalMemberExpression(c)?prop(c.property):null}
let changed=true,passes=0;
while(changed&&passes++<80){
 changed=false;
 for(const {ast} of asts.values())traverse(ast,{
  'CallExpression|OptionalCallExpression'(p){
   const c=p.node.callee,n=callName(c);
   const terminal=t.isMemberExpression(c)&&['run','get','all','iterate'].includes(n)&&statement(c.object,p.scope);
   const db=t.isMemberExpression(c)&&(t.isIdentifier(c.object,{name:'db'})||member(c.object,'db'))&&['columns','exec','backup','foreignKeyCheck'].includes(n);
   const atomic=t.isCallExpression(c)&&member(c.callee,'atomic')||t.isMemberExpression(c)&&['immediate','deferred','exclusive'].includes(n)&&t.isCallExpression(c.object)&&member(c.object.callee,'atomic');
   const binding=t.isIdentifier(c)?p.scope.getBinding(c.name):null;
   const init=binding?.path.isVariableDeclarator()?binding.path.node.init:null;
   const factory=t.isCallExpression(init)&&member(init.callee,'atomic');
   let atomicMember=false;
   if(t.isMemberExpression(c)&&['immediate','deferred','exclusive'].includes(n)&&t.isIdentifier(c.object)){
    const b=p.scope.getBinding(c.object.name),v=b?.path.isVariableDeclarator()?b.path.node.init:null;atomicMember=t.isCallExpression(v)&&member(v.callee,'atomic');
   }
   const dynamic=t.isMemberExpression(c)&&c.computed&&!t.isStringLiteral(c.property);
   const global=knownAsync(p);
   const parameter=binding?.kind==='param'&&['fn','handler','work','guard','can','getter','build','execute'].includes(n);
   const iife=t.isFunction(c)&&asyncNodes.has(c);
   if(terminal||db||atomic||atomicMember||factory||global||parameter||iife||dynamic){if(requestAwait(p))changed=true}
  }
 });
}
if(changed)throw Error('Async call graph did not converge');

// Resolve collection callbacks and their callers together to a fixed point.
const helperFiles=new Set();
for(let round=0;round<50;round++){
 let converted=0;
 for(const [file,{ast}] of asts)traverse(ast,{CallExpression:{exit(p){
  const c=p.node.callee;if(!t.isMemberExpression(c)||t.isIdentifier(c.object,{name:'__async'}))return;
  const method=prop(c.property);if(!['map','flatMap','filter','forEach','some','every','find','findIndex','reduce','sort'].includes(method))return;
  const cb=p.node.arguments[0];let asynchronous=t.isFunction(cb)&&asyncNodes.has(cb);
  if(t.isIdentifier(cb)){
   const b=p.scope.getBinding(cb.name),bp=b?.path;
   asynchronous=bp?.isFunctionDeclaration()?asyncNodes.has(bp.node):bp?.isVariableDeclarator()&&t.isFunction(bp.node.init)?asyncNodes.has(bp.node.init):names.has(cb.name)||names.has(aliases.get(cb.name));
  }
  if(!asynchronous)return;
  if(method==='sort')throw Error(`Async sort comparator needs manual conversion: ${file}:${p.node.loc?.start.line}`);
  const replacement=t.callExpression(t.memberExpression(t.identifier('__async'),t.identifier(method)),[c.object,...p.node.arguments]);
  awaitCalls.delete(p.node);p.replaceWith(replacement);awaitCalls.add(replacement);mark(p);helperFiles.add(file);converted++;
 }}});
 changed=true;passes=0;
 while(changed&&passes++<80){changed=false;for(const {ast} of asts.values())traverse(ast,{'CallExpression|OptionalCallExpression'(p){if(knownAsync(p)){if(requestAwait(p))changed=true}}})}
 if(!converted)break;if(round===49)throw Error('Async collections did not converge');
}
for(const file of helperFiles){const {ast}=asts.get(file);ast.program.body.unshift(t.variableDeclaration('const',[t.variableDeclarator(t.identifier('__async'),t.callExpression(t.identifier('require'),[t.stringLiteral(file.startsWith('qa/postgres/regressions/')?'../../../server/postgres/collections':file.startsWith('qa/')?'../../server/postgres/collections':file.includes('/receiving/')?'../postgres/collections':'./postgres/collections')]))]));}

for(const [file,{ast,input}] of asts){
 traverse(ast,{CallExpression(p){
  if(t.isMemberExpression(p.node.callee)&&['throws','doesNotThrow'].includes(prop(p.node.callee.property))&&t.isFunction(p.node.arguments[0])&&p.node.arguments[0].async){p.node.callee.property=t.identifier(prop(p.node.callee.property)==='throws'?'rejects':'doesNotReject');requestAwait(p);}
 }});
 traverse(ast,{CallExpression(p){
  if(!member(p.node.callee,'get')||!member(p.node.callee.object?.callee,'prepare')||qsql(p.node.callee.object.arguments[0])!=='SELECT changes() c')return;
  const statement=p.getStatementParent(),body=statement.parentPath.node.body,index=body.indexOf(statement.node),previous=body[index-1];
  if(!t.isExpressionStatement(previous))throw Error('changes() requires its preceding mutation result');
  const result=t.identifier('__postingMutation');body[index-1]=t.variableDeclaration('const',[t.variableDeclarator(result,previous.expression)]);
  p.replaceWith(t.objectExpression([t.objectProperty(t.identifier('c'),t.memberExpression(t.cloneNode(result),t.identifier('changes')))]));
 }});
 traverse(ast,{Function(p){for(let i=0;i<p.node.params.length;i++){const parameter=p.node.params[i];if(t.isAssignmentPattern(parameter)&&(t.isAwaitExpression(parameter.right)||awaitCalls.has(parameter.right))&&t.isIdentifier(parameter.left)){if(!t.isBlockStatement(p.node.body))p.node.body=t.blockStatement([t.returnStatement(p.node.body)]);p.node.body.body.unshift(t.ifStatement(t.binaryExpression('===',t.cloneNode(parameter.left),t.identifier('undefined')),t.expressionStatement(t.assignmentExpression('=',t.cloneNode(parameter.left),parameter.right))));p.node.params[i]=parameter.left;}}}});
 traverse(ast,{'CallExpression|OptionalCallExpression':{exit(p){if(!awaitCalls.has(p.node)||p.parentPath.isAwaitExpression())return;if(p.node.callee?.type==='Super')return;p.replaceWith(t.awaitExpression(p.node));p.skip()}}});
 fs.writeFileSync(path.join(root,file),generate(ast,{retainLines:true,comments:true},input).code+'\n');
}
fs.writeFileSync(path.join(root,'qa/evidence/postgres-async-conversion.json'),JSON.stringify({files:asts.size,asyncFunctions:asyncNodes.size,awaitedCalls:awaitCalls.size,asyncNames:[...names].sort()},null,2)+'\n');
console.log(JSON.stringify({files:asts.size,asyncFunctions:asyncNodes.size,awaitedCalls:awaitCalls.size}));
