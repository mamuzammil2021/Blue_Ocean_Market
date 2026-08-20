const fs=require('fs'),path=require('path');const root=path.join(__dirname,'..');const server=fs.readFileSync(path.join(root,'server','server.js'),'utf8');const client=fs.readFileSync(path.join(root,'public','client.js'),'utf8');const db=fs.readFileSync(path.join(root,'server','db.js'),'utf8');const checks=[
['health',server.includes("version:'26.8.0'")],
['unit-switch-dashboard',client.includes("view='dashboard';render()")],
['sidebar',client.includes('toggleSidebar')&&client.includes('bo_sidebar_collapsed')],
['notifications-scope',server.includes('business_unit_id IS NULL')],
['notification-nav',client.includes('notificationNavigate')],
['machine-payment-line-removed',!client.includes('Payment: ${esc(status)}')],
['finance-sync',server.includes('function financeSync')],
['payment-void-reason',server.includes("voidFinanceBySource('Excavator Payment'")],
['buyer-payment-void',server.includes("voidFinanceBySource('Excavator Buyer Payment'")],
['cost-finance',server.includes("sourceType:'Excavator Cost Transaction'")],
['repair-finance',server.includes("sourceType:'Excavator Repair'")],
['logistics-finance',server.includes("sourceType:'Excavator Logistics'")],
['parts-finance',server.includes("sourceType:'Excavator Part'")],
['finance-void-columns',db.includes('void_reason')&&db.includes('voided_by')],
['notification-action-columns',db.includes('action_view')&&db.includes('action_id')],
['manual-pkr-resale',client.includes('Manual Resale Profit')&&client.includes('resale_price_pkr')],
['nav-icons',client.includes('nav-icon')&&client.includes('📊')],
['sidebar-css',fs.readFileSync(path.join(root,'public','index.html'),'utf8').includes('sidebar-collapsed')],
['no-payment-filter',!client.includes('Payment Pending</option>')],
['no-payment-card-line',!client.includes('Payment: ${esc(status)}')],
['notification-open-button',client.includes('notificationNavigate')&&client.includes('x.action_view')]
];
let bad=0;for(const [n,ok] of checks){console.log((ok?'PASS':'FAIL')+' '+n);if(!ok)bad++;}process.exitCode=bad?1:0;
