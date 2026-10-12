const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const overlay=read('public/v3694-pink-qa.js');
const index=read('public/index.html');
const v300=read('server/v300.js'),v305=read('server/v305.js'),v310=read('server/v310.js'),v350=read('server/v350-import-pages.js');
const checks=[
 ['V30.69.4 overlay loaded after routing',/\/v3693-persistent-routing\.js\?v=30\.69\.(?:3|6)/.test(index)&&index.includes('/v3694-pink-qa.js?v=30.69.4')&&index.indexOf('/v3694-pink-qa.js?v=30.69.4')>index.indexOf('/v3693-persistent-routing.js?v=30.69.6')],
 ['Cash company account query does not blindly force country',overlay.includes("if(!/^cash$/i.test(text(method)))qs.set('country','South Korea')")],
 ['Cash selector filters to Cash accounts',overlay.includes("wanted==='cash'?ty==='cash'")],
 ['Bank selector filters to Bank accounts',overlay.includes("wanted==='bank'?ty==='bank'")],
 ['Cash hides supplier Paid To and keeps server validation secondary',overlay.includes("if(method==='Cash')")&&overlay.includes("paidToField?.classList.add('v3694-hidden')")],
 ['Supplier account save triggers targeted Accounts refresh',overlay.includes('oldSaveAccount')&&overlay.includes('refreshPinkSupplierAccounts')&&overlay.includes('ps369SupplierAccounts')],
 ['Supplier account archive triggers targeted Accounts refresh',overlay.includes('oldArchiveAccount')&&overlay.includes('refreshPinkSupplierAccounts')],
 ['Pink Supplier/Profile hard refresh restore is registered',overlay.includes("['psSuppliers','psImports'].includes(r.view)")&&overlay.includes("r.view==='psSuppliers'")&&overlay.includes('psSupplierAccount315')],
 ['Pink Import hard refresh restore is registered',overlay.includes("r.view==='psImports'")&&overlay.includes('psImportDetail')],
 ['Edit Import stray category remove controls are removed',overlay.includes("root.querySelectorAll('.ps-remove')")&&overlay.includes("#psV310EditItems .ps-line")],
 ['Three import payment modes are deterministic',overlay.includes("['advance','new','both'].includes(mode)")&&overlay.includes("#ps369PaymentChoice [data-mode]")],
 ['Hidden settlement fields are disabled to avoid stale validation',overlay.includes("querySelectorAll('input,select,textarea').forEach(x=>x.disabled")],
 ['Import Detail redundant close button is removed',overlay.includes("/closeModal/.test(b.getAttribute('onclick')||'')")],
 ['Received shipment has View PDF action',overlay.includes('View Shipment PDF')&&overlay.includes('psViewImportPdf3694')],
 ['Received shipment has Download PDF action',overlay.includes('Download Shipment PDF')&&overlay.includes('psDownloadImportPdf3694')],
 ['Received list fallback removes Ready to Receive wording',overlay.includes('fixReceivedListLabels')&&overlay.includes("c.textContent=T('Fully Paid')")],
 ['v300 financial state is receipt-aware',v300.includes("imp.status==='Received'&&outstanding<=0.01?'Fully Paid'")&&v300.includes("ready_to_receive:imp.status!=='Received'" )],
 ['v305 financial state is receipt-aware',v305.includes("imp.status==='Received'&&outstanding<=.01?'Fully Paid'")&&v305.includes("ready_to_receive:imp.status!=='Received'" )],
 ['v310 import list is receipt-aware',v310.includes("x.status==='Received'&&x.outstanding_krw<=0.01?'Fully Paid'")],
 ['v350 import list is receipt-aware',v350.includes("x.status==='Received'&&x.outstanding_krw<=.01?'Fully Paid'")&&v350.includes("x.ready_to_receive=x.status!=='Received'")]
];
let fail=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)fail++}
console.log(`V30.69.4 QA: ${checks.length-fail}/${checks.length}`);if(fail)process.exit(1);
