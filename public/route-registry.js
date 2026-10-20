/* Navigation catalogue. Only record identifiers, sections and safe list state enter URLs.
 * New modules register here or through BOMRoutes.register; they share one controller. */
(()=>{'use strict';
const entries=new Map();
function register(x){entries.set(x.view+'/'+(x.kind||''),Object.freeze(x));window.BOMRouter?.bind();return x}
function record(view,kind,open,section,options={}){return register({view,kind,open,section,direct:!!kind,...options})}
for(const [kind,open] of [['menu','restaurantMenu'],['stock','restaurantStock'],['weekly','restaurantWeekly'],['buffet','restaurantBuffet'],['open-orders','restaurantOpenOrders']])record('restaurant',kind,[open],null,{noId:true});
record('excavator','machine',['excavatorOpenMachine']);
record('excavatorSuppliers','supplier',['BOMProfileRoutes337.supplier'],{open:['BOMProfileRoutes337.supplierSection'],legacy:['v337SupplierSection'],arg:1,defaults:'overview',values:['overview','machines','requirements','payments','accounts']},{legacy:['v329SupplierOpen'],initialSection:true,handlesSection:true});
record('excavatorBuyers','buyer',['BOMProfileRoutes337.buyer'],{open:['BOMProfileRoutes337.buyerSection'],legacy:['v337BuyerSection'],arg:1,defaults:'payments',values:['payments','refunds','machines','requirements','documents','accounts']},{legacy:['excavatorBuyerDetail'],initialSection:true,handlesSection:true});
record('excavatorBuyers','pakistan',['openPakistanResalesV327'],{open:['v338PakistanSection'],arg:1,defaults:'overview',values:['overview','records','payments','credit','refunds','transfers','documents']},{initialSection:true,handlesSection:true});
record('psSuppliers','supplier',['psSupplierAccount315'],{open:['psSupplierTab315'],arg:0,defaults:'account',values:['overview','account','payments','accounts','imports','packaging','documents','history']},{handlesSection:true});
record('psPackaging','',['psPackHome'],null,{direct:true,noId:true});
for(const kind of ['materials','purchases','stock'])record('psPackaging',kind,['psPackHome'],null,{noId:true});
record('psPackaging','material',['psPackMaterial']);record('psPackaging','legacy',['psPackLegacy']);record('psPackaging','movement',['psPackMovement']);record('psPackaging','fx',['psFxTransactionDetail']);
record('psPackaging','purchase',['psPackPurchase'],{open:['psPackPurchaseSection'],arg:1,defaults:'overview',values:['overview','receiving','payments','history']},{initialSection:true,handlesSection:true});
record('psImports','import',['psImportDetail']);
record('psImports','cost',['BOMPinkImportDetailQA.openCost']);
record('psImports','fx',['psFxTransactionDetail']);record('psSales','fx',['psFxTransactionDetail']);
record('psSales','order',['psOrderDetail313','psOrderDetail']);
record('psSales','new',['psSaleForm313'],null,{noId:true,temporary:true});
record('psCustomers','customer',['psCustomerAccount313'],{open:['psAccountTab313'],dom:true,defaults:'orders',values:['orders','receipts','prices','adjust']},{handlesSection:true});
record('psProduction','batch',['psProductionDetail'],null,{parent:{view:'psProduction'}});
record('psProduction','new',['psProductionForm'],null,{noId:true,parent:{view:'psProduction'}});
record('finance','record',['financeOpen']);record('finance','correction',['financeCorrectionOpen']);
const userAccessNative340=window.userAccessOpen;window.BOMUserRoutes340={open:id=>userAccessNative340(id,window.BOMRouter.parse().section||'summary',Number(window.BOMRouter.parse().params.get('scope')||0)),section:(id,key)=>userAccessNative340(id,key,Number(window.BOMRouter.parse().params.get('scope')||0))};
record('users','access',['BOMUserRoutes340.open'],{open:['BOMUserRoutes340.section'],arg:1,defaults:'summary',values:['summary','profiles','groups','scope','authority','advanced','history']},{legacy:['userAccessOpen'],handlesSection:true,scopeArgument:2});
record('users','profiles',['v340ProfileLibrary'],null,{noId:true});
record('tasks','task',['taskDetail']);record('meetings','meeting',['meetingDetail']);
record('reports','report',['reportDetail']);record('approvals','approval',['approvalDetail']);
record('payroll','employee',['employeeProfileV3592','employeeProfileV359','employeeDetailV29'],{open:['employeeSectionV3592'],arg:1,defaults:'overview',values:['overview','employment','compensation','advances','payroll','accounts','documents','allocation']},{initialSection:true,handlesSection:true});
record('payroll','run',['payrollRunDetailV3591','payrollRunDetailV29']);
record('profile','',[],{open:['setMyAccountSectionV3592'],arg:0,defaults:'overview',values:['overview','security','employment','payroll','payslips','advances','accounts','documents','access']},{handlesSection:true});
record('payroll','',[],{open:['payrollWorkspaceSectionV3591'],arg:0,defaults:'employees',values:['overview','employees','runs','advances']},{handlesSection:true});
record('accounting','',[],{open:['accountingV305Tab','accountingSimpleTabV291','accountingTabV29','v357AccountingOpen'],arg:0,accounting:true});
record('accounting','account',['v343OpenAccount'],null,{mode:'simple'});
record('psFinished','lots',['psLotsV367'],null,{noId:true,parent:{view:'psFinished'}});
record('psFinished','lot',['psLotDetail38'],null,{parent:{view:'psFinished',kind:'lots'}});
record('psSales','trace',['psOrderLotTraceV367']);
record('psFinished','families',['psFamiliesV367'],null,{noId:true,parent:{view:'psFinished'}});
record('psFinished','family',['psFamilyDetail38'],null,{parent:{view:'psFinished',kind:'families'}});
record('accounting','journal',['journalDetailV29'],null,{temporary:true});
record('accounting','posting',['postingOpenV318'],null,{temporary:true});
// Bank statement upload is a temporary mutation modal, never an addressable read route.
record('accounting','control',['accountingPostingControlV318'],null,{noId:true});
record('accounting','financing',['v356FinancingDetail'],null,{mode:'simple',prepare:()=>window.BOMAccountingShell291(document.getElementById('content'))});
record('accounting','asset',['v357FixedAssetDetail'],null,{mode:'simple',prepare:()=>window.BOMAccountingShell291(document.getElementById('content'))});
record('accounting','ledger',['v358AccountLedger'],null,{mode:'simple',prepare:()=>window.BOMAccountingShell291(document.getElementById('content'))});
record('accounting','foreign-financing',['v356ForeignDetail'],null,{mode:'simple',prepare:()=>window.BOMAccountingShell291(document.getElementById('content'))});
window.BOMSecurityRoutes={open:()=>window.v341SecurityAccess(window.BOMRouter.parse().section||'overview')};
record('systemSettings','security',['BOMSecurityRoutes.open'],{open:['v341SecurityAccess'],arg:0,defaults:'overview',values:['overview','profiles','groups','policies','approval','audit','defaults']},{noId:true,handlesSection:true,prepare:()=>window.BOMSettingsShell319(document.getElementById('content'),'security_access')});
record('systemSettings','',[],{open:['v319SettingsSection'],arg:0});
const moduleMap={accounting:'accounting',payroll:'payroll',restaurantTables:'restaurant',excavatorSuppliers:'excavator',excavatorBuyers:'excavator',psSuppliers:'purchases',psImports:'purchases',psRawStock:'inventory',psProduction:'inventory',psFinished:'inventory',psPackaging:'inventory',psSales:'sales',psCustomers:'sales',psWaste:'inventory',psCommerce:'sales'};
const units={excavator:'Excavator',excavatorBuyers:'Excavator',excavatorSuppliers:'Excavator',restaurant:'MIMI Resturant',restaurantTables:'MIMI Resturant'};
window.BOMRoutes={version:'30.69.28',capabilities:Object.freeze({direct_hydration:true,structural_dependencies:true,initial_section:true}),register,record,entries,find:r=>entries.get(r.view+'/'+(r.kind||'')),moduleFor:v=>Array.from(entries.values()).find(x=>x.view===v&&x.module)?.module||moduleMap[v]||v,unitName:v=>/^ps[A-Z]/.test(v)?'Pink Salt':units[v]||'',views:()=>new Set([...Object.keys(viewLabels),...Array.from(entries.values(),x=>x.view)])};
})();
