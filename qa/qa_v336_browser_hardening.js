'use strict';
const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
function pass(ok,msg){if(!ok){console.error('FAIL',msg);process.exitCode=1}else console.log('PASS',msg)}
const pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json'));
const index=read('public/index.html'),server=read('server/server.js'),b336=read('server/v336.js'),c336=read('public/v336-client.js');
const c321=read('public/v321-client.js'),c326=read('public/v326-client.js'),c328=read('public/v328-client.js'),c335=read('public/v335-client.js');
const audit=read('qa/V30_36_BROWSER_AUDIT_RESULTS.txt');
pass(pkg.version==='30.38.2'&&lock.version==='30.38.2'&&lock.packages?.['']?.version==='30.38.2','current release retains V30.36 hardening');
pass(server.includes("const v336=require('./v336').install({db});")&&b336.includes("VERSION='30.36.0'")&&b336.includes('schema_changes:false'),'V30.36 additive/no-schema server marker installed');
pass(index.includes('/v336-client.js?v=30.38.2')&&index.indexOf('/v335-client.js?v=30.38.2')<index.indexOf('/v336-client.js?v=30.38.2')&&c336.includes('browser_button_audit:true'),'V30.36 browser audit marker retained before V30.37');
pass(server.includes("version:'30.38.2'")&&server.includes('Blue Ocean Market V30.38.2 running on port'),'health/startup version current');
pass(c321.includes("input.addEventListener('input',()=>{input.value=input.value.replace")&&c321.includes("sync(false)});input.addEventListener('blur',()=>{sync(true);remoteContactCheck(input)"),'phone validation is silent while typing and validates on blur');
pass(c321.includes("input.addEventListener('input',()=>sync(false));input.addEventListener('blur',()=>{sync(true);remoteContactCheck(input)"),'email validation is silent while typing and validates on blur');
pass((c321.match(/debouncedContactCheck\(/g)||[]).length===1,'legacy debounced contact helper is no longer invoked');
pass(c321.includes("ref.addEventListener('input',()=>{const p=refTimers.get(ref);if(p)clearTimeout(p);ref.setCustomValidity('');refStatus(ref,'')});ref.addEventListener('blur',()=>{ref.dataset.v321Touched='1';run()})"),'payment reference clears while typing and validates on blur');
pass(c335.includes("if(el.validity?.valid!==false)return")&&!c335.includes("document.addEventListener('blur',e=>{const el=e.target;if(!el?.matches?.('input,select,textarea')||!el.closest('form'))return;el.dataset.v335Touched='1';if(!el.checkValidity"),'generic blur validation reads validity state without checkValidity invalid dispatch');
pass(c326.includes("document.addEventListener('input',e=>{if(e.target?.closest?.('#excavatorSaleForm')&&e.target.validity?.valid!==false)")&&c326.includes("document.addEventListener('change',e=>{if(e.target?.closest?.('#excavatorSaleForm')&&e.target.validity?.valid!==false)"),'V30.26 Sell Machine live correction listeners are non-disruptive');
pass(c328.includes("document.addEventListener('input',e=>{const f=e.target.closest?.('#excavatorSaleForm .field');if(f&&e.target.validity?.valid!==false)")&&c328.includes("document.addEventListener('change',e=>{const f=e.target.closest?.('#excavatorSaleForm .field');if(f&&e.target.validity?.valid!==false)"),'V30.28 Sell Machine listeners no longer dispatch invalid while correcting fields');
pass(c335.includes("resetPagination335(document.getElementById('financeTableBody'))")&&c335.includes("resetPagination335(document.getElementById('v318PostingBody'))")&&c335.includes('resetPagination335(list)'),'Finance, Posting Control and Machine filters reset pagination');
pass(c335.includes('resetAllPagers335')&&c335.includes("document.addEventListener('input',e=>{if(filterControl335(e.target))")&&c335.includes("document.addEventListener('change',e=>{if(filterControl335(e.target))"),'shared result-set controls reset pagers');
pass(c335.includes('window.__BOM_V335={version:VERSION,polishBuyMachine335,syncSaleAmount335,applySharedPagination335,resetPagination335,resetAllPagers335}'),'shared pagination reset helpers retained/exported');
pass(audit.includes('SUMMARY 28 checks / 28 passed / 0 failed')&&audit.includes('Genuine unresolved named handler/call targets: 0')&&audit.includes('Navigation states rendered: 99'),'browser/stateful/wiring audit evidence recorded');
pass(!c336.includes('location.reload(')&&!c335.includes('location.reload('),'no full-page reload introduced by current overlays');
if(!process.exitCode)console.log('V30.36 browser button audit / UX hardening QA PASS');
