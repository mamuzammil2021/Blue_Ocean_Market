#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};
const has=(s,x,msg)=>must(s.includes(x),msg||`Missing ${x}`);
const pkg=JSON.parse(read('package.json'));
const idx=read('public/index.html'),client=read('public/v343-client.js'),server=read('server/v343.js'),main=read('server/server.js'),v319=read('server/v319.js');

must(pkg.version==='30.51.0','current package version required');
has(pkg.scripts['qa:v343']||'','qa_v343_qa_refinements.js','qa:v343 script missing');
has(idx,'/v343-client.js?v=30.51.0','V30.43 client must load from index');
must(idx.indexOf('/v343-client.js')>idx.indexOf('/v342-client.js'),'V30.43 overlay must load after V30.42');
has(main,"require('./v343').install",'server must install v343');
has(main,'Blue Ocean Market V30.51.0 running','runtime release identity missing');

// Targeted refresh + child context preservation.
has(client,'bom_v343_workflow_context','persistent child context missing');
has(client,"wrapContext343('v329SupplierOpen'",'supplier child route not registered');
has(client,"wrapContext343('excavatorBuyerDetail'",'buyer child route not registered');
has(client,"wrapContext343('excavatorOpenMachine'",'machine child route not registered');
has(client,'BOMRegisterChildContextV343','future child context registration hook missing');
has(client,"forceSupplier343(supplierId,'machines')",'Supplier Machines targeted refresh missing');
has(client,"forceBuyer343(id,'payments')",'Buyer Payments targeted refresh missing');

// Cost / purchase / sold document controls.
has(main,"code:'FINANCE_ACTION_LOCKED'",'Finance-action cost lock missing');
has(main,"'Correction Required'",'Finance correction action not included in edit lock');
has(main,"code:'SOLD_PURCHASE_LOCKED'",'sold purchase server lock missing');
has(client,"txt(x?.type)==='Purchase'",'purchase row special handling missing');
has(client,"html.replace(/<button class=\"btn small\" onclick=\"excavatorAddCost",'purchase duplicate Edit removal missing');
has(client,'financeActed343','Finance-action UI lock missing');
has(client,'Purchase editing is locked after sale.','sold Purchase UI lock missing');
has(v319,'SOLD_DOCUMENT_CEO_ONLY','sold document CEO-only server policy missing');
has(client,'deleteExcavatorDocumentV319','sold document UI policy missing');

// Optional buyer sending accounts in payment and sale flows.
has(server,"ensureColumn('excavator_buyer_payments','buyer_sender_account_id'",'buyer payment sender-account migration missing');
has(main,'optionalBuyerSenderAccount','buyer sender account resolver missing');
has(main,'buyer_sender_account_id:buyerSenderAccount?.id||null','sale sender account metadata missing');
has(main,'buyer_sender_account_label','buyer payment sender-account detail projection missing');
has(client,'Buyer Sending Account (optional)','optional buyer sender UI missing');
has(client,'buyer_sender_account_id','buyer sender form field missing');
has(client,'upgradedBuyerPayments343','buyer sender account must be visible in payment history');

// Accounting account drilldown + statement + PDF + transfer.
has(server,"/api/v343/accounting/payment-accounts/:id/detail",'account detail endpoint missing');
has(server,"/api/v343/accounting/payment-accounts/:id/statement",'statement endpoint missing');
has(server,"/api/v343/accounting/payment-accounts/:id/statement.pdf",'statement PDF endpoint missing');
has(server,'accounting_account_transfers_v343','same-BU company transfer ledger missing');
has(server,"/api/v343/accounting/account-transfers",'company transfer endpoint missing');
has(server,'accounting.postJournal','company transfer Accounting posting missing');
has(client,'v343OpenAccount','account drill-down UI missing');
has(client,'v343GenerateStatement','statement generation UI missing');
has(client,'v343DownloadStatementPdf','statement PDF download UI missing');
has(client,'v343TransferForm','company account transfer UI missing');
has(client,"fetch(`/api/v343/accounting/payment-accounts/${Number(id)}/statement.pdf",'authenticated statement PDF fetch missing');

// Additive migration and retained V30.42 layer.
has(idx,'/v342-client.js?v=30.51.0','V30.42 client layer must remain');
has(server,'CREATE TABLE IF NOT EXISTS','additive schema guard expected');
must(!server.includes('DROP TABLE'),'V30.43 must not perform destructive table drops');

console.log('V30.43.0 QA refinements static QA: PASS');
