#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const server=read('server/server.js'),runtime=read('public/runtime-v30392.js'),client=read('public/client.js'),v343=read('public/v343-client.js'),v3382=read('public/v3382-client.js'),v353=read('public/v353-client.js'),index=read('public/index.html'),pkg=require('../package.json'),lock=require('../package-lock.json');
let checks=0;function check(name,condition){assert.ok(condition,name);console.log('PASS '+name);checks++}
check('Release version and health agree',pkg.version==='30.54.0'&&lock.version==='30.54.0'&&lock.packages[''].version==='30.54.0'&&server.includes("version:'30.54.0'"));
check('V30.53 patch loads after protected V30.52 patch',index.includes('/v353-client.js?v=30.54.0')&&index.indexOf('v353-client.js')>index.indexOf('v352-client.js'));
check('Cost lock requires verified or posted in backend, no mere linked journal',server.includes("['Verified / Correct','Verified'].includes(String(linkedFinance.verification_status")&&!/financeLocked=.*accounting_journal_id/.test(server));
check('Legacy client lock only verified or posted',v343.includes("return as==='Posted'||['Verified / Correct','Verified'].includes(vs)")&&!v343.includes("return as==='Posted'||n(x?.accounting_journal_id)>0"));
check('Consolidated bundle cost guard does not lock on journal ID',!runtime.includes("return as==='Posted'||n(x?.accounting_journal_id)>0"));
check('Native token payment selects replace fragile mirrored pickers',v3382.includes("sel._v3382Picker?.remove()")&&v3382.includes("sel.classList.remove('v3382-native-account-select')")&&v353.includes('pointer-events:auto!important'));
check('Supplier account manager button has isolated action handler',v3382.includes('data-v353-manage-payee')&&v353.includes('stopImmediatePropagation')&&v353.includes('openCounterpartyAccountsV338'));
check('New receiver account returns to actual purchase form',runtime.includes("const host=document.getElementById('v324WorkflowSurface')||document.querySelector('#modalRoot .modal')"));
check('New supplier account does not prefill person name',!runtime.includes('value="${esc(s.name||\'\')}"')&&runtime.includes("name=\"account_holder\" value=\"${esc(row?.account_holder||'')}\""));
check('Business examples are English/Romanized when English selected',v353.includes('e.g., Kim Min-su')&&v353.includes('e.g., KB Kookmin Bank')&&v353.includes("'e.g., Kim Min-su':'예: 김민수'"));
check('Buyer edit origin preserved',client.includes("window.__BOMBuyerEditOriginV353==='profile'")&&v353.includes("'profile':'list'"));
check('Contextual success surface on existing feedback route',v353.includes('bom353-success')&&v353.includes('window.toast=nextToast'));
check('Financial writes use persistent idempotency key',v353.includes('X-Idempotency-Key')&&v353.includes('bom353PaymentKey')&&read('server/v284.js').includes('request_idempotency'));
check('Transaction-in-flight disables form and protects closing',v353.includes('protectedForms.add(f)')&&v353.includes("el.disabled=true")&&v353.includes('window.closeModal=close353'));
check('Successful same-form retries return original payment promise',v353.includes("f.dataset.bom353Committed='1'")&&v353.includes("if(f.dataset.bom353Committed!=='1')paymentFlights.delete(f)"));
check('Reference validates after typing with delayed check',runtime.includes('setTimeout(()=>{if(ref.isConnected&&String(ref.value')&&runtime.includes('},450)'));
check('Stale reference invalidity cleared before submit',runtime.includes("for(const r of form.querySelectorAll('input[name=\"payment_reference\"]'))r.setCustomValidity('')"));
check('Reference check retries and distinguishes network errors',runtime.includes('for(let attempt=0;attempt<2;attempt++)')&&runtime.includes("Unable to check payment reference. Retry."));
check('Final server still enforces reference uniqueness',server.includes('assertUniquePaymentReference'));
check('Posting Control removes own redundant action',runtime.includes('compactAccounting332')&&v353.includes('data-v332-posting'));
check('Advanced Accounting return button deduplicated',v353.includes('buttons.slice(1).forEach(x=>x.remove())')&&runtime.includes(".v291-advanced-return"));
check('Notification cards preserve item IDs',client.includes('data-notification-id=')&&read('public/v348-notifications.js').includes('data-notification-id='));
check('Mark read is per-record and does not reload page',v353.includes('window.readNotif=read353')&&v353.includes('styleRead(id)')&&!v353.includes('loadView()'));
check('Open related notification automatically marks read',v353.includes('await read353(notificationId)')&&read('public/v348-notifications.js').includes('notificationNavigate(${dest},${action},${id})'));
check('Bell reopens unread-only feed, full history remains',read('public/v348-bell.js').includes('status=unread')&&read('public/v348-notifications.js').includes("['all','unread','read']"));
check('Base lazy loading is retained',index.includes('v351-loader.js?v=30.54.0')&&index.includes('v348-loader.js?v=30.54.0'));
const files=[...fs.readdirSync(path.join(root,'server')).filter(x=>x.endsWith('.js')).map(x=>'server/'+x),...fs.readdirSync(path.join(root,'public')).filter(x=>x.endsWith('.js')).map(x=>'public/'+x)];
for(const f of files){const r=cp.spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});check('JavaScript syntax '+f,r.status===0)}
for(const f of ['client.js','runtime-v30392.js','v353-client.js','v343-client.js']){const gz=fs.readFileSync(path.join(root,'public',f+'.gz')),raw=fs.readFileSync(path.join(root,'public',f));check('Compressed asset matches '+f,zlib.gunzipSync(gz).equals(raw))}
console.log(`V30.53 STATIC REGRESSION QA PASS (${checks} checks)`);
