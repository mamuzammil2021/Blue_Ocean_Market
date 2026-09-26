'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process');
const root=path.resolve(__dirname,'..');const get=p=>fs.readFileSync(path.join(root,p),'utf8');
const ui=get('public/v357-accounting-workspace.js'),index=get('public/index.html');let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name)}
test('single Accounting navigation with six focused groups',()=>['Overview','Accounts & Ledgers','Money & Balances','Financial Reports','Accounting Control','Accounting Setup'].forEach(x=>assert(ui.includes("['"+x+"'"))));
test('one route persisted across mode transitions',()=>{assert(ui.includes('sessionStorage.setItem(routeKey,key)'));assert(ui.includes('await window.accountingSimpleV291?.()'));assert(ui.includes('window.v355OpenAdvancedTab?.(tab)'))});
test('authorization is applied to rendered advanced routes',()=>{assert(ui.includes('advancedKeys.has(key)&&!authorized()'));assert(ui.includes('entries.filter(([,key])=>!advancedKeys.has(key)||authorized())'));assert(ui.includes("typeof me!=='undefined'"))});
test('context header and duplicate navigation cleanup',()=>{assert(ui.includes('v357-workspace-header'));assert(ui.includes('v357WorkspaceDescription'));assert(ui.includes('.v356-quick{display:none'));assert(ui.includes('.v291-simple-tabs'));assert(ui.includes('.v290-tabs'))});
test('account lookup remains tied to live COA and server eligibility',()=>{const j=get('public/v290-client.js');assert(j.includes("api('/api/accounting/accounts')"));assert(j.includes("!a.active||!a.allow_manual?'disabled'"));assert(get('server/v318.js').includes('normalizeManualLines'))});
test('journal validation and focused layout retained',()=>{assert(ui.includes('Math.abs(dr-cr)'));assert(ui.includes('submit.disabled='));assert(ui.includes('.v290-journal-line{border:'));assert(ui.includes(':focus-visible'))});
test('no added financial API or schema migration',()=>{assert(!fs.existsSync(path.join(root,'server/v3571.js')));assert(!fs.existsSync(path.join(root,'server/v357.js')))});
test('version and compressed UI match',()=>{assert(index.includes('?v=30.57.1'));assert.equal(require('../package.json').version,'30.57.1');const z=require('zlib');assert.equal(z.gunzipSync(fs.readFileSync(path.join(root,'public/v357-accounting-workspace.js.gz'))).toString(),ui)});
for(const f of ['public/v357-accounting-workspace.js','public/v290-client.js','public/v356-accounting.js','server/server.js'])test('syntax '+f,()=>{const p=cp.spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});assert.equal(p.status,0,p.stderr)});
console.log('V30.57.1 professional accounting UI checks passed: '+count+'. Live browser/Render verification remains pending.');
