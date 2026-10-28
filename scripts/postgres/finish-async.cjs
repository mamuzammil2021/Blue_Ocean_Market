'use strict';
// Check transitive async exports/aliases against the current migrated source.
// This pass preserves reviewed SQL and subsystem overrides.
const fs=require('fs'),path=require('path'),parser=require('@babel/parser'),traverse=require('@babel/traverse').default,t=require('@babel/types'),generate=require('@babel/generator').default;
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?(x.name==='postgres'?[]:files(path.join(dir,x.name))):x.name.endsWith('.js')?[path.join(dir,x.name)]:[])}
const paths=[...files('server'),'qa/postgres/fx_fixture.cjs',...fs.readdirSync('qa/postgres/regressions').filter(x=>x.endsWith('.cjs')).map(x=>'qa/postgres/regressions/'+x)];
const data=paths.map(file=>({file,input:fs.readFileSync(file,'utf8')}));for(const x of data)x.ast=parser.parse(x.input,{sourceType:'script'});
const prop=n=>t.isIdentifier(n)?n.name:t.isStringLiteral(n)?n.value:null;
const key=p=>p.node.id?.name||(p.isObjectMethod()?prop(p.node.key):p.parentPath?.isVariableDeclarator()?prop(p.parentPath.node.id):p.parentPath?.isObjectProperty()?prop(p.parentPath.node.key):p.parentPath?.isAssignmentExpression()?prop(p.parentPath.node.left.property):null);
const names=new Set(),needed=new Set(),helpers=new Set();let additions=0;
const builtin=new Set(['Math','JSON','Number','String','Boolean','Buffer','Object','Array','Date','console','crypto','fs','path','zlib','D','M','req','process','Promise','jwt','bcrypt','os','__async']);
const collections=['map','flatMap','filter','forEach','some','every','find','findIndex','reduce','sort'];
function asynchronous(path,name){
 const binding=path.scope.getBinding(name),p=binding?.path;
 if(p?.isFunctionDeclaration())return !!p.node.async;
 if(p?.isVariableDeclarator()&&t.isFunction(p.node.init))return !!p.node.init.async;
 if(binding?.kind==='param'&&['next','resolve','reject','cb','callback'].includes(name))return false;
 return names.has(name);
}
function mark(p){const fn=p.getFunctionParent();if(!fn)return false;needed.add(p.node);if(fn.node.async)return false;fn.node.async=true;const n=key(fn);if(n)names.add(n);return true}
function shouldAwait(p){
 const c=p.node.callee;
 if(t.isIdentifier(c))return asynchronous(p,c.name);
 if(!t.isMemberExpression(c)&&!t.isOptionalMemberExpression(c))return false;
 if(t.isIdentifier(c.object)&&builtin.has(c.object.name)||collections.includes(prop(c.property)))return false;
 return names.has(prop(c.property));
}
for(let pass=0;pass<80;pass++){
 let changed=false;
 for(const {ast} of data)traverse(ast,{
  Function(p){const n=key(p);if(n&&p.node.async&&!names.has(n)){names.add(n);changed=true}},
  ObjectProperty(p){if(t.isIdentifier(p.node.value)&&asynchronous(p,p.node.value.name)){const n=prop(p.node.key);if(n&&!names.has(n)){names.add(n);changed=true}}},
  AssignmentExpression(p){if(t.isMemberExpression(p.node.left)&&t.isIdentifier(p.node.right)&&asynchronous(p,p.node.right.name)){const n=prop(p.node.left.property);if(n&&!names.has(n)){names.add(n);changed=true}}}
 });
 for(const {ast,file} of data)traverse(ast,{'CallExpression|OptionalCallExpression':{exit(p){
  const c=p.node.callee;
  if(shouldAwait(p)&&!p.parentPath.isAwaitExpression()&&mark(p))changed=true;
  if(!t.isMemberExpression(c)||t.isIdentifier(c.object,{name:'__async'})||!collections.includes(prop(c.property)))return;
  const cb=p.node.arguments[0],isAsync=t.isFunction(cb)?cb.async:t.isIdentifier(cb)?asynchronous(p,cb.name):false;
  if(!isAsync)return;
  if(prop(c.property)==='sort')throw Error(`Async sort comparator requires review: ${file}:${p.node.loc?.start.line}`);
  const node=t.callExpression(t.memberExpression(t.identifier('__async'),t.identifier(prop(c.property))),[c.object,...p.node.arguments]);
  needed.delete(p.node);p.replaceWith(node);needed.add(node);mark(p);helpers.add(file);changed=true;
 }}});
 if(!changed)break;if(pass===79)throw Error('Async alias graph did not converge');
}
for(const {ast,file,input} of data){
 if(helpers.has(file)&&!input.includes('const __async'))ast.program.body.unshift(parser.parse(`const __async=require(${JSON.stringify(file.startsWith('qa/postgres/regressions/')?'../../../server/postgres/collections':file.startsWith('qa/')?'../../server/postgres/collections':file.includes('/receiving/')?'../postgres/collections':'./postgres/collections')});`).program.body[0]);
 traverse(ast,{'CallExpression|OptionalCallExpression':{exit(p){if(needed.has(p.node)&&!p.parentPath.isAwaitExpression()){p.replaceWith(t.awaitExpression(p.node));p.skip();additions++}}}});
 traverse(ast,{Function(p){for(let i=0;i<p.node.params.length;i++){const a=p.node.params[i];if(t.isAssignmentPattern(a)&&t.isAwaitExpression(a.right)&&t.isIdentifier(a.left)){if(!t.isBlockStatement(p.node.body))p.node.body=t.blockStatement([t.returnStatement(p.node.body)]);p.node.body.body.unshift(t.ifStatement(t.binaryExpression('===',a.left,t.identifier('undefined')),t.expressionStatement(t.assignmentExpression('=',a.left,a.right))));p.node.params[i]=a.left}}}});
 fs.writeFileSync(file,generate(ast,{retainLines:true,comments:true},input).code+'\n');
}
console.log(JSON.stringify({files:data.length,additionalAwaitEdges:additions}));
