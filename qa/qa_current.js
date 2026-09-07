const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
let failed=0;
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const check=(name,ok)=>{console.log((ok?'PASS ':'FAIL ')+name);if(!ok)failed++};
const syntax=f=>{const r=cp.spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});check('syntax '+f,r.status===0);if(r.status!==0)console.error(r.stderr)};

const serverFiles=fs.readdirSync(path.join(root,'server')).filter(f=>f.endsWith('.js')&&f!=='server.v6.js').map(f=>'server/'+f);
const publicFiles=fs.readdirSync(path.join(root,'public')).filter(f=>f.endsWith('.js')).map(f=>'public/'+f);
[...serverFiles,...publicFiles,'qa/qa_current.js','qa/runtime_smoke.js'].forEach(syntax);

const pkg=JSON.parse(read('package.json')),lock=JSON.parse(read('package-lock.json'));
const server=read('server/server.js'),index=read('public/index.html'),base=read('public/client.js'),v284=read('public/v284-client.js'),v285=read('public/v285-client.js'),v300=read('public/v300-client.js'),v305=read('public/v305-client.js'),v307=read('public/v307-client.js'),v308=read('public/v308-client.js'),v309=read('public/v309-client.js'),v310=read('public/v310-client.js'),v313=read('public/v313-client.js'),v314=read('public/v314-client.js'),v315=read('public/v315-client.js'),v316=read('public/v316-client.js'),b284=read('server/v284.js'),b290=read('server/v290.js'),b300=read('server/v300.js'),b305=read('server/v305.js'),b307=read('server/v307.js'),b310=read('server/v310.js'),b313=read('server/v313.js'),b315=read('server/v315.js'),b316=read('server/v316.js'),ko=read('public/i18n-ko.js'),reqs=read('REQUIREMENTS_MASTER.md');

check('V30.16 release identity',pkg.version==='30.16.0'&&lock.version==='30.16.0'&&server.includes("version:'30.16.0'")&&server.includes('Blue Ocean Market V30.16.0 running on port'));
check('browser cache identity',index.includes('/client.js?v=30.16.0')&&index.includes('/v310-client.js?v=30.16.0')&&index.includes('/v314-client.js?v=30.16.0')&&index.includes('/v315-client.js?v=30.16.0')&&index.includes('/v316-client.js?v=30.16.0'));
const scriptRefs=[...index.matchAll(/<script src="\/([^"?]+\.js)\?v=30\.16\.0"><\/script>/g)].map(m=>m[1]);
check('all browser scripts exist',scriptRefs.length>0&&scriptRefs.every(f=>fs.existsSync(path.join(root,'public',f))));
check('runtime overlay order retained',index.indexOf('/v285-client.js?v=30.16.0')<index.indexOf('/v300-client.js?v=30.16.0')&&index.indexOf('/v300-client.js?v=30.16.0')<index.indexOf('/v310-client.js?v=30.16.0')&&index.indexOf('/v313-client.js?v=30.16.0')<index.indexOf('/v314-client.js?v=30.16.0'));

check('context-aware hint engine installed',v285.includes('PINK_SALT_HINTS')&&v285.includes('RESTAURANT_HINTS')&&v285.includes('NEUTRAL_HINTS')&&v285.includes('selectedBusinessName'));
check('explicit module placeholders preserved',v285.includes('v285ExplicitPlaceholder')&&v285.includes('Module-authored placeholders carry more precise workflow context'));
check('shared placeholders adapt by business unit',v285.includes("related_entity_type:'import, supplier, product, order...'")&&v285.includes("related_entity_type:'order, menu item, table, supplier...'")&&v285.includes("financeSearch:'Search import, supplier, order, customer, reference…'"));
check('Pink Salt source placeholders are field-specific',v300.includes('placeholder="e.g. PK-SALT-INV-2026-015"')&&v300.includes('placeholder="e.g. 500g stand-up pouch"')&&v300.includes('placeholder="Packaging supplier"')&&v300.includes('Mixed Pink Salt Gift Box 500g Pouches'));
check('Pink Salt storage context uses warehouse not yard',v300.includes('placeholder="Warehouse / Rack / Zone"')&&!v300.includes('placeholder="Yard / Rack / Zone"'));
check('Pink Salt source has no Excavator example leakage',!v300.includes('Seoul Heavy Equipment')&&!v300.includes('Customer / supplier / employee name')&&!v300.includes('Volvo EC220'));
check('V30.10 safety placeholder fixer retained',v310.includes('fixPinkPlaceholders')&&v310.includes('e.g. 500g stand-up pouch')&&v310.includes('e.g. PK-SALT-INV-2026-015'));
check('new context strings have Korean mappings',ko.includes("'Warehouse / Rack / Zone':'창고 / 랙 / 구역'")&&ko.includes("'e.g. Pink Salt operations review':'예: 핑크 소금 운영 검토'")&&ko.includes("'Search order, supplier, menu item, reference…':'주문, 공급업체, 메뉴 항목, 참조 검색…'"));
check('master requirement defines mandatory context integrity',reqs.includes('Mandatory business-unit context integrity')&&reqs.includes('Context correctness is a release-blocking requirement')&&reqs.includes('Business Context Audit'));

check('V30.13 backend installed',server.includes("require('./v313').install")&&b313.includes("VERSION='30.13.0'")&&b313.includes('/api/pink-salt/customers-v313')&&b313.includes('/api/pink-salt/orders-v313'));
check('V30.13 browser overlay retained before V30.14',index.includes('/v313-client.js?v=30.16.0')&&index.indexOf('/v310-client.js?v=30.16.0')<index.indexOf('/v313-client.js?v=30.16.0')&&index.indexOf('/v313-client.js?v=30.16.0')<index.indexOf('/v314-client.js?v=30.16.0'));
check('customer account and aging implemented',b313.includes('account-v313')&&b313.includes('unallocated_credit_krw')&&b313.includes('d31_60')&&v313.includes('psCustomerAccount313'));
check('grouped receipts and multi-order allocation implemented',b313.includes('pink_salt_customer_receipt_allocations')&&b313.includes('gross_settlement_krw')&&v313.includes('data-alloc-order')&&v313.includes('psAllocateReceipt313'));
check('marketplace settlement fee accounting implemented',b313.includes('Pink Salt Marketplace Settlement Fee')&&read('server/v290.js').includes("st==='Pink Salt Marketplace Settlement Fee'")&&server.includes("st==='Pink Salt Marketplace Settlement Fee'"));
check('flexible pricing hierarchy implemented',b313.includes("pricing_source:'Customer Specific'")&&b313.includes('Price Tier ·')&&b313.includes("pricing_source:'Product Default'")&&b313.includes("'Manual Override'"));
check('historical pricing snapshot retained',b313.includes('pricing_snapshot_json')&&b313.includes('list_price_krw')&&b313.includes('price_override_reason'));
check('below-cost protection implemented',b313.includes('below current unit cost')&&b313.includes("req.user.role!=='CEO / Owner'"));
check('customer statements and exports implemented',b313.includes('statement-v313.csv')&&b313.includes('statement-v313.pdf')&&v313.includes('psDownloadStatement313'));
check('Pink Salt list controls implemented',v313.includes('enhanceGenericList')&&v313.includes('enhancePackaging')&&v313.includes("['psImports','psRawStock','psProduction','psFinished','psWaste']"));
check('new account and pricing UI is bilingual-ready',v313.includes("'Customer Accounts':'고객 계정'")&&v313.includes("'Pricing Tier':'가격 등급'")&&v313.includes("'Unallocated Credit':'미배정 크레딧'"));
check('master requirements include V30.13 receivables and pricing',reqs.includes('V30.13 mandatory Pink Salt customer accounts')&&reqs.includes('active customer/store-specific price → assigned price tier → product default price → authorized manual override')&&reqs.includes('Pink Salt list search, sorting and filtering'));

check('V30.14 Review & Confirm retained before V30.15 supplier overlay',index.includes('/v314-client.js?v=30.16.0')&&index.indexOf('/v313-client.js?v=30.16.0')<index.indexOf('/v314-client.js?v=30.16.0')&&index.indexOf('/v314-client.js?v=30.16.0')<index.indexOf('/v315-client.js?v=30.16.0')&&v314.includes("const VERSION='30.14.0'"));
check('system-wide form Review & Confirm capture implemented',v314.includes("document.addEventListener('submit'")&&v314.includes('formReview(form,submitter)')&&v314.includes('collectForm(form)')&&v314.includes('Review & Confirm'));
check('edit review supports old to new presentation',v314.includes('bom314-review-change')&&v314.includes('initialValue(el)')&&v314.includes('<span class="arrow">→</span>'));
check('explicit confirmation workflows grant review allowance',v314.includes("wrapDecision('confirmAction'")&&v314.includes("wrapDecision('reasonAction'")&&v314.includes('grantReview()'));
check('mutating API calls require review and show processing state',v314.includes('window.api=async function')&&v314.includes('genericApiReview(url,opt)')&&v314.includes('showProcessing(url,buttonText)')&&v314.includes('markButtonBusy(actionButton)')&&v314.includes('hideProcessing()'));
check('non-business auth/notification/download actions bypass V30.14 blocker',v314.includes('if(noReview(url))return oldApi(url,opt)'));
check('contextual processing messages implemented',v314.includes('Receiving import…')&&v314.includes('Completing production…')&&v314.includes('Recording payment…')&&v314.includes('Allocating balance…'));
check('persistent mutation idempotency protection retained',v284.includes('X-Idempotency-Key')&&v284.includes('X-Request-Fingerprint')&&b284.includes('request_idempotency')&&b284.includes("app.use('/api',mutationIdempotency)")&&v314.includes("opt.headers['X-Idempotency-Key']=randomKey()"));
check('long-running mutations receive extended client timeout',base.includes("timeoutMs=(method==='GET'||method==='HEAD')?30000:120000")&&base.includes('setTimeout(()=>controller.abort(),timeoutMs)'));
check('Review and processing UI has Korean localization',ko.includes("'Review & Confirm':'검토 및 확인'")&&ko.includes("'Receiving import…':'수입 입고 처리 중…'")&&ko.includes("'Processing…':'처리 중…'")&&ko.includes("'Confirm & Save':'확인 후 저장'"));
check('semantic Pink Salt account position replaces raw negative presentation',v313.includes('accountPosition313')&&v313.includes("?'Due':")&&v313.includes("?'Credit':'Settled'")&&v313.includes('Account Position')&&v313.includes('Math.abs(n)'));
check('available customer credit can be selected on new completed order',v313.includes('Available Customer Credit')&&v313.includes('name="apply_available_credit"')&&v313.includes('ps313RefreshCreditBox')&&b313.includes('applyExistingCustomerCredit')&&b313.includes('apply_available_credit')&&b313.includes('existing_credit_applied_krw'));
check('customer credit application preserves allocation accounting',b313.includes("sourceType:'Pink Salt Customer Receipt Allocation'")&&b313.includes("accounting.accountId('CUSTOMER_ADVANCES')")&&b313.includes("accounting.accountId('ACCOUNTS_RECEIVABLE')"));
check('V30.14 account/review strings are bilingual-ready',ko.includes("'Available Customer Credit':'사용 가능한 고객 크레딧'")&&ko.includes("'Account Position':'계정 상태'")&&ko.includes("'Credit':'크레딧'"));
check('master requirements include V30.14 review processing and account position',reqs.includes('V30.14 mandatory system-wide Review & Confirm')&&reqs.includes('server-side transaction and idempotency/request-fingerprint protection')&&reqs.includes('Do not present a customer/store credit position as a confusing raw negative account balance'));


check('V30.15 supplier backend installed',server.includes("require('./v315').install")&&b315.includes("VERSION='30.15.0'")&&b315.includes('/api/pink-salt/suppliers-v315')&&b315.includes('/account-v315'));
check('dedicated Pink Salt Suppliers sidebar is installed before Imports',v300.includes("['psSuppliers','Suppliers','🤝'],['psImports','Imports / Purchases'")&&v300.includes("if(view==='psSuppliers')return window.psSuppliersView"));
check('Imports header no longer owns Supplier Management',!v310.includes('onclick="psSuppliers()"')&&!v310.includes("t('Supplier Management')"));
check('unified supplier categories support multi-category profiles',b315.includes('supplier_categories_json')&&b315.includes('Import / Raw Salt Supplier')&&b315.includes('Packaging Material Supplier')&&v315.includes('supplierTypes')&&v315.includes('name="supplier_category"'));
check('legacy suppliers are categorized from operational history',b315.includes('Classify existing suppliers from their actual Pink Salt history')&&b315.includes("set.add('Import / Raw Salt Supplier')")&&b315.includes("set.add('Packaging Material Supplier')"));
check('category-specific supplier selection is enforced client and server',v300.includes("Import / Raw Salt Supplier')})")||v300.includes("includes('Import / Raw Salt Supplier')")&&b300.includes("supplierHasCategoryV315(supplier,'Import / Raw Salt Supplier')")&&b300.includes("supplierHasCategoryV315(supplier,'Packaging Material Supplier')")&&v315.includes("includes('Packaging Material Supplier')"));
check('supplier account exposes payables credit aging and obligations',b315.includes('total_outstanding_krw')&&b315.includes('available_credit_krw')&&b315.includes('function aging(')&&v315.includes('Total Payables')&&v315.includes('Available Supplier Credit')&&v315.includes('agingCards'));
check('supplier profile has context-specific operational/document/history sections',v315.includes('supplierProfileTabs315')&&v315.includes("cats.includes('Import / Raw Salt Supplier')")&&v315.includes("cats.includes('Packaging Material Supplier')")&&v315.includes('Documents / Evidence')&&v315.includes('Audit / History')&&b315.includes('documents,history'));
check('central supplier payments reuse audited advance payment pool',v315.includes('/api/pink-salt/suppliers/${id}/advances')&&b305.includes("app.post('/api/pink-salt/suppliers/:id/advances'")&&b305.includes('Advance payment receipt / evidence is required.'));
check('supplier payment balance is shared across import and packaging allocations',b305.includes('packagingAllocated')&&b305.includes('pink_salt_supplier_packaging_allocations x WHERE x.advance_id=a.id')&&b307.includes('packagingAllocated')&&b307.includes('imports or packaging receipts'));
check('packaging receipt creates payable not cash payment',b300.includes("paymentMethod:'Supplier Payable'")&&server.includes("st==='Pink Salt Packaging Purchase')return ['Packaging Purchase / Payable',0]")&&b290.includes("st==='Pink Salt Packaging Purchase'")&&b290.includes("accountId('ACCOUNTS_PAYABLE')"));
check('packaging receipt requires supplier invoice and evidence',b300.includes('supplier invoice/reference')&&b300.includes('Packaging invoice / delivery evidence is required.')&&v315.includes('Supplier Invoice / Reference')&&v315.includes('Invoice / Delivery Evidence'));
check('packaging supplier credit can auto-apply on receipt',v315.includes('name="apply_available_credit"')&&b300.includes('apply_available_credit')&&b300.includes('allocatePackagingCreditV315')&&b300.includes('allocated_credit_krw'));
check('manual and automatic packaging allocation endpoints implemented',b315.includes('/packaging-allocations-v315')&&b315.includes('/auto-allocate-v315')&&v315.includes('psSupplierAllocate315')&&v315.includes('psSupplierAutoAllocate315'));
check('supplier packaging allocation posts non-cash AP settlement',b315.includes("accounting.accountId('ACCOUNTS_PAYABLE')")&&b315.includes("accounting.accountId('PINK_SALT_SUPPLIER_ADVANCES')")&&b315.includes('Pink Salt Supplier Packaging Allocation'));
check('simple accounting balances include packaging payables and allocations',b305.includes("'PACK-'||m.id import_no")&&b305.includes('pink_salt_supplier_packaging_allocations x WHERE x.supplier_id=s.id'));
check('supplier statements support JSON CSV and PDF',b315.includes('/statement-v315')&&b315.includes('/statement-v315.csv')&&b315.includes('/statement-v315.pdf')&&v315.includes('psSupplierStatementDownload315'));
check('V30.15 supplier UI is bilingual-ready',v315.includes("'Supplier Accounts':'공급업체 계정'")&&v315.includes("'Packaging Material Supplier':'포장 자재 공급업체'")&&v315.includes("'Available Supplier Credit':'사용 가능한 공급업체 크레딧'"));
check('V30.15 requirements documented',reqs.includes('V30.15 mandatory Pink Salt unified supplier architecture')&&reqs.includes('one unified supplier master')&&reqs.includes('Stock receipt and supplier payment are separate but linked business events'));


check('V30.16 backend installed',server.includes("require('./v316').install")&&b316.includes('access_role_templates')&&b316.includes('user_business_units')&&b316.includes('user_access_overrides')&&b316.includes('user_access_limits'));
check('live auth resolves current user instead of stale token role',server.includes('const decoded=jwt.verify')&&server.includes('SELECT id,name,email,role,business_unit_id,active')&&server.includes('Your account is inactive or no longer available'));
check('effective permission middleware replaces role-only allow path',server.includes('accessV316.canAnyModule')&&b316.includes('effectiveAccess')&&b316.includes('canModule'));
check('multi-business-unit assignments and switching implemented',b316.includes('user_business_units')&&b316.includes('replaceAssignments')&&base.includes('unitOptions.length>1')&&base.includes('await hydrateAccess()'));
check('CEO global and delegated user access administration implemented',b316.includes('canManageTarget')&&b316.includes('delegate.bu_users')&&b316.includes('delegate.finance_users')&&b316.includes('You cannot change your own role or access.'));
check('Finance Head and Finance User templates implemented',b316.includes("role:'Finance Head'")&&b316.includes("role:'Finance User'")&&base.includes("'Finance Head','Finance User'"));
check('granular module actions supported',b316.includes("const ACTIONS=['view','create','edit','delete','void','approve','export','print','verify','correct','allocate']")&&v316.includes('access-matrix'));
check('sensitive and delegated rights supported',b316.includes('sensitive.user_management')&&b316.includes('sensitive.accounting_adjustments')&&b316.includes('delegate.access')&&v316.includes('Sensitive Permissions'));
check('limits and threshold controls supported',b316.includes('finance_payment_max')&&b316.includes('finance_approval_max')&&b316.includes('max_discount_pct')&&v316.includes('Limits / Thresholds'));
check('role template apply and access copy implemented',b316.includes('/apply-template')&&b316.includes('/copy')&&v316.includes('applyAccessTemplate')&&v316.includes('copyAccessDialog'));
check('access change history implemented',b316.includes('access_change_history')&&b316.includes('history(target')&&v316.includes('Access History'));
check('Pink Salt navigation honors effective permissions',v316.includes("psSuppliers:'purchases'")&&v316.includes("if(module&&!allowed(key))btn.remove()"));
check('V30.16 bilingual access UI included',v316.includes("'Users & Access':'사용자 및 접근 권한'")&&v316.includes("'Effective Access':'유효 접근 권한'")&&v316.includes("'Finance Head':'재무 책임자'"));
check('V30.16 requirements documented',reqs.includes('V30.16 mandatory system-wide Users & Access requirements')&&reqs.includes('effective permissions are authoritative')&&reqs.includes('Finance Head delegated administration'));
check('V30.16 overlay loads last',index.indexOf('/v315-client.js?v=30.16.0')<index.indexOf('/v316-client.js?v=30.16.0'));


check('V30.10 import management retained',server.includes("require('./v310').install")&&b310.includes('/manage-v310')&&b310.includes('/history-v310')&&b310.includes('/cancel-v310')&&b310.includes('/void-v310')&&b310.includes('/delete-v310'));
check('import approval and downstream safeguards retained',b310.includes('pink_salt.import_sensitive_edit')&&b310.includes('production_inputs')&&b310.includes('controlled correction/reversal workflow'));
check('terminal import states block new activity',b300.includes("['Cancelled','Voided'].includes(imp.status)")&&v305.includes('Supplier Advance'));
check('whole-number count integrity retained',v310.includes('Quantity must be a whole number.')&&b300.includes('Packing recipe quantities must be whole numbers.')&&server.includes('countQuantityRequired'));
check('measurement values preserve decimals',v310.includes('/weight|kg|\\(g\\)|amount|price|cost|rate|percent|percentage/'));
check('integer step-base regression fixed',v310.includes('normalizeCountInput')&&v310.includes('!Number.isInteger(min)')&&v310.includes('i.min=String(min>0?Math.ceil(min):Math.floor(min))'));
check('generic Quantity no longer forces restaurant measurements to integers',v310.includes("if(bu==='Excavator')return true;return false")&&v310.includes("explicit==='measurement'")&&v310.includes("explicit==='count'"));
check('Pink Salt packaging receive is unit-aware',v300.includes("data-quantity-kind=\"${String(x?.unit||'pcs').toLowerCase()==='kg'?'measurement':'count'}\"")&&v300.includes("step=\"${String(x?.unit||'pcs').toLowerCase()==='kg'?'0.001':'1'}\""));
check('Pink Salt packaging reorder is unit-aware',v300.includes('psPackagingUnitChanged')&&b300.includes('Packaging reorder level must be a whole number unless the unit is kg.'));
check('Pink Salt waste quantity follows source unit',v300.includes("q.dataset.quantityKind=count?'count':'measurement'")&&b300.includes("source==='Packaging'&&String(unit).toLowerCase()!=='kg'&&!Number.isInteger(qty)"));
check('Finance corrections preserve quantity precision',server.includes("number('quantity','Quantity',true,'1')")&&server.includes('packaging_unit')&&server.includes('Packaging quantity must be a whole number unless the unit is kg.'));
check('master requirement defines quantity step-base integrity',reqs.includes('integer field using `step=1` must not retain a fractional step base')&&reqs.includes('Restaurant/POS fractional quantity support must not be broken'));
check('Pink Salt duplicate generic nav tabs remain hidden only there',v300.includes("'businesses','sales','purchases','inventory'")&&!v300.includes("'approvals','tasks','performance'"));
check('gift-box and production integrity retained',v300.includes('Gift Box Composition')&&v300.includes('gift_pouch_weight_g')&&b300.includes('production_inputs'));
check('production PDF retained',v308.includes('Production PDF')||v308.includes('production PDF')||read('server/v308.js').includes('production-pdf'));
check('import received PDF retained',v307.includes('Download Import PDF')&&read('server/v307.js').includes('received-pdf'));
check('Finance / Accounting layers retained',server.includes("require('./v290').install")&&server.includes("require('./v302').install")&&server.includes("require('./v305').install"));
check('CEO business-unit scope retained',server.includes("req.user.role==='CEO / Owner'")&&server.includes("x-business-unit-id"));
check('responsive sidebar retained',index.includes('overflow-y:auto')||index.includes('sidebar'));
check('local test data preservation',read('.env').includes('SEED_DEMO_USERS=false')&&read('.env').includes('SEED_DEMO_DATA=false'));
check('local launcher identifies current release',read('START_LOCAL_MAC.command').includes('V30.16.0')&&!read('START_LOCAL_MAC.command').includes('V29.1.0'));
check('Pink Salt reference blueprint retained under docs',fs.existsSync(path.join(root,'docs/reference/PINK_SALT_WORKING_BLUEPRINT.pdf')));
check('package scripts consolidated to current release',Object.keys(pkg.scripts||{}).sort().join('|')===['dev','dev:local','qa:current','qa:runtime','start','start:local'].sort().join('|'));
const pinkContextFiles=['public/v300-client.js','public/v305-client.js','public/v307-client.js','public/v308-client.js','public/v309-client.js'];
const pinkContextText=pinkContextFiles.map(read).join('\n');
check('Pink Salt active UI files contain no copied Excavator examples',!/(Seoul Heavy Equipment|Customer \/ supplier \/ employee name|Volvo EC220|Yard \/ Rack \/ Zone)/.test(pinkContextText));

const bannedRoot=fs.readdirSync(root).filter(f=>/^(README_V|CHANGELOG_V|QA_REPORT_V|QA_RUN_V|RELEASE_MANIFEST_V|GIT_RELEASE_CHECKLIST_V|DEPENDENCY_CHECK_V)/.test(f));
check('historical release clutter removed from root',bannedRoot.length===0);
check('obsolete duplicate root clients removed',!fs.existsSync(path.join(root,'client.js'))&&!fs.existsSync(path.join(root,'v300-client.js'))&&!fs.existsSync(path.join(root,'v305-client.js')));
check('obsolete V6 snapshots removed',!fs.existsSync(path.join(root,'server/server.v6.js'))&&!fs.existsSync(path.join(root,'public/index.v6.html')));

if(failed){console.error(`\nV30.16 CURRENT QA FAILED: ${failed} check(s)`);process.exit(1)}
console.log('\nV30.16 CURRENT QA PASS');
