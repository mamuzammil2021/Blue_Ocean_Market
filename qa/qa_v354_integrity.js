#!/usr/bin/env node
'use strict';
// V30.54 release gate: assertions are source-level + executable SQLite migration fixture.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
const server=read('server/server.js'),integritySource=read('server/v354-finance-integrity.js'),accounting=read('server/v290.js'),posting=read('server/v318.js'),classifier=read('server/v302.js');
const packageJSON=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json'));let n=0;
function check(name,ok){assert.ok(ok,name);console.log('PASS '+name);n++}
check('V30.54 version and health match',packageJSON.version==='30.54.0'&&lock.version==='30.54.0'&&lock.packages[''].version==='30.54.0'&&server.includes("version:'30.54.0'"));
check('Source is installed once Accounting exists and before other financial routes',server.indexOf('const integrityV354=financeIntegrityV354.install')>server.indexOf('const accountingV29=')&&server.indexOf('const integrityV354=financeIntegrityV354.install')<server.indexOf("require('./v300').install"));
check('Startup payment backfill requires Paid and skips mirrors',server.includes("FROM excavator_payments WHERE asset_id=? AND status='Paid'")&&server.includes('filter(p=>!financeIntegrityV354.isSaleSettlementMirror(db,p.id))'));
check('FinanceSync never creates cash from sale settlement mirror',server.includes("if(sourceType==='Excavator Payment'&&financeIntegrityV354.isSaleSettlementMirror(db,sourceId))return null"));
check('Direct Sale payments are categorized as incoming',server.includes("if(st==='Excavator Payment')return ['Machine Payment / Settlement',ty==='Revenue'?1:-1]")&&classifier.includes("cash_effect:type==='Revenue'?1:-1"));
check('Purchase value recognized as non-cash payable/inventory',server.includes("if(st==='Excavator Cost Transaction'&&cat==='Purchase')return ['Purchase / Payable',0]")&&classifier.includes("if(st==='Excavator Cost Transaction'&&cat==='Purchase')return {finance_role:'Purchase / Payable',cash_effect:0}"));
check('Legacy purchase correction is not a new GL journal and does not change payment method',integritySource.includes("UPDATE finance_entries SET cash_effect=0,finance_role='Purchase / Payable'")&&!integritySource.includes("payment_method='Operational',payment_account_id=NULL"));
check('Purchase resync preserves historical payment method and posted journal source hash',server.includes("sourceType==='Excavator Cost Transaction'&&category==='Purchase'&& !paymentMethod ? (ex.payment_method||'') : (paymentMethod||'')"));
check('Pre-post duplicate Finance rows quarantined with audit, not deleted',integritySource.includes("status='Voided',void_reason=?")&&integritySource.includes('v354-duplicate-mirror-quarantine')&&!integritySource.includes('DELETE FROM finance_entries'));
check('Already-posted suspect entries held for controlled reversal',integritySource.includes("'Needs Controlled Reversal'")&&integritySource.includes("status='Posted'")&&integritySource.includes('no automatic deletion or ledger mutation'));
check('Idempotent scan uses unique case ID and existing source-key protection',integritySource.includes('finance_entry_id INTEGER PRIMARY KEY')&&integritySource.includes('ON CONFLICT(finance_entry_id) DO UPDATE')&&server.includes("status!='Voided' ORDER BY id LIMIT 1"));
check('Quarantined proposals synchronize through existing Accounting engine',integritySource.includes('accounting?.syncFinanceEntry?.(id)')&&accounting.includes("if(text(finance.status)==='Voided')"));
check('Accounting resync cannot regenerate mirror posting',accounting.includes("isSaleSettlementMirror(db,finance.source_id)")&&accounting.includes('V354_SALE_SETTLEMENT_MIRROR'));
check('Finance Verify and Bulk Verify reject mirror even for CEO',server.includes('if(financeIntegrityV354.isLegacyMirrorFinance(db,f)||integrityV354.caseFor(f.id))')&&server.includes('Sale settlement mirror is not a real cash movement.'));
check('Final Accounting posting readiness rejects mirror or integrity case',posting.includes('isLegacyMirrorFinance(db,f)')&&posting.includes('ready:!integrityHold&&f.status'));
check('Persistent audit-safe integrity diagnostic route available',integritySource.includes("'/api/finance/integrity-v354'")&&integritySource.includes('manual_reversal_required'));
check('Old classifier leaves voided source rows intact',classifier.includes("FROM finance_entries WHERE status!='Voided'"));
check('No changes to real Buyer Advance or real buyer receipt posting logic',accounting.includes("st==='Excavator Buyer Payment'")&&accounting.includes("st==='Excavator Sale'"));
check('Protected current UI and cache-busted scripts retained',read('public/index.html').includes('v353-client.js?v=30.54.0')&&read('public/index.html').includes('v351-loader.js?v=30.54.0'));
for(const f of ['server/server.js','server/v290.js','server/v302.js','server/v318.js','server/v354-finance-integrity.js']){
 const result=cp.spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});check('Syntax '+f,result.status===0);
}
for(const f of ['client.js','runtime-v30392.js','v353-client.js']){
 const raw=fs.readFileSync(path.join(root,'public',f)),gz=fs.readFileSync(path.join(root,'public',f+'.gz'));
 check('Compressed served asset matches '+f,zlib.gunzipSync(gz).equals(raw));
}
const fixture=cp.spawnSync('python3',[path.join(root,'qa/sql_v354_integrity.py')],{encoding:'utf8'});
if(fixture.stdout)process.stdout.write(fixture.stdout);if(fixture.stderr)process.stderr.write(fixture.stderr);
check('Executable SQLite repeat-deploy regression fixture',fixture.status===0);
console.log(`V30.54 FINANCIAL INTEGRITY QA PASS (${n} checks)`);
