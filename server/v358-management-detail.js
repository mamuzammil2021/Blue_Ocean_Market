'use strict';
// Paged current source registers and posted GL links. No costing allocation is inferred.
function install({app,db,auth,allow,currentUnit,enforceUnit}){
 const round=x=>Math.round((Number(x||0)+Number.EPSILON)*100)/100;
 const fail=(status,message)=>Object.assign(new Error(message),{status});
 const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(String(s))&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
 const scope=req=>{const selected=Number(currentUnit(req)||0),bu=selected||Number(req.user.role==='CEO / Owner'?0:req.user.business_unit_id||0);if(bu&&!enforceUnit(req,bu))throw fail(403,'Business unit not permitted');if(!bu&&req.user.role!=='CEO / Owner')throw fail(403,'Business unit required');return bu||null};
 const one=(sql,...args)=>db.prepare(sql).get(...args);
 const val=(sql,...args)=>round(one(sql,...args)?.v);
 const posted=(bu,type,id,to,source=false)=>db.prepare(`SELECT a.system_key,ROUND(SUM(l.debit_krw-l.credit_krw),2) amount FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE j.status IN ('Posted','Reversed') AND j.transaction_date<=? AND l.business_unit_id=? AND ${source?'j.source_type=? AND j.source_id=?':'l.entity_type=? AND l.entity_id=?'} GROUP BY a.id`).all(to,bu,type,id).reduce((x,r)=>(x[r.system_key]=round(r.amount),x),{});
 // The sale and direct payment post AR under the customer dimension. The credit allocation
 // posts under the order dimension. Follow the immutable journal/source links for one invoice.
 const orderPostedAR=(o,to)=>val(`SELECT SUM(l.debit_krw-l.credit_krw) v FROM accounting_journal_lines l
  JOIN accounting_journal_entries j ON j.id=l.journal_entry_id
  JOIN accounting_accounts a ON a.id=l.account_id
  LEFT JOIN finance_entries f ON f.id=j.finance_entry_id
  WHERE j.status IN ('Posted','Reversed') AND j.transaction_date<=? AND l.business_unit_id=?
    AND a.system_key='ACCOUNTS_RECEIVABLE' AND (
      (f.source_type='Pink Salt Sale' AND f.source_id=?)
      OR (f.source_type='Pink Salt Customer Payment' AND f.source_id IN (SELECT id FROM pink_salt_customer_payments WHERE order_id=? AND payment_role='Sale Payment'))
      OR (j.source_type='Pink Salt Customer Receipt Allocation' AND j.source_id IN (SELECT id FROM pink_salt_customer_receipt_allocations WHERE order_id=?))
      OR (l.entity_type='Pink Salt Order' AND l.entity_id=?)
    )`,to,o.business_unit_id,o.id,o.id,o.id,o.id);
 const pagination=req=>{const page=Math.max(1,Math.min(100000,Number(req.query.page)||1)),size=[25,50,100].includes(Number(req.query.page_size))?Number(req.query.page_size):25;return {page,page_size:size,limit:size,offset:(page-1)*size}};
 const mapGl=(g,k,credit=false)=>round((credit?-1:1)*Number(g[k]||0));
 app.get('/api/accounting/v358/management-detail',auth,allow('finance','accounting','dashboard'),(req,res)=>{try{
  const bu=scope(req),kind=String(req.query.kind||''),asOf=String(req.query.as_of||new Date().toISOString().slice(0,10)),p=pagination(req);
  if(!date(asOf))throw fail(400,'Valid as-of date required');if(!['machine','import','batch','sku','expense','aging','invoice_aging','supplier_invoice_aging'].includes(kind))throw fail(400,'Choose machine, import, batch, sku, expense, aging, invoice_aging or supplier_invoice_aging');
  let rows=[],total=0,basis='';const unit=bu?' WHERE business_unit_id=?':'',args=bu?[bu]:[];
  if(kind==='machine'){
   total=one(`SELECT COUNT(*) n FROM excavator_assets${unit}`,...args).n;
   rows=db.prepare(`SELECT id,asset_no,business_unit_id,status,purchase_price,selling_price FROM excavator_assets${unit} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args,p.limit,p.offset).map(a=>{const g=posted(a.business_unit_id,'Machine',a.id,asOf),revenue=mapGl(g,'EXCAVATOR_SALES_REVENUE',true),cogs=mapGl(g,'EXCAVATOR_COGS'),inventory=mapGl(g,'EXCAVATOR_INVENTORY');return {...a,reference:a.asset_no,posted_revenue_krw:revenue,posted_cogs_krw:cogs,posted_inventory_krw:inventory,posted_korea_profit_krw:round(revenue-cogs),source_purchase_krw:round(a.purchase_price),source_sale_krw:round(a.selling_price),flags:[...(a.status==='Sold'&&inventory>.01?['SOLD_INVENTORY_REMAINS']:[]),...(a.status==='Sold'&&Number(a.selling_price)>0&&revenue<=0?['SALE_RECOGNITION_MISSING']:[])]}});
   basis='Machine source amounts are current operational fields; revenue, COGS, inventory and profit are posted Machine-dimension GL through the selected date. Pakistan resale share is separate.';
  }else if(kind==='import'){
   total=one(`SELECT COUNT(*) n FROM pink_salt_imports${unit}`,...args).n;
   rows=db.prepare(`SELECT id,import_no,business_unit_id,supplier_id,status,invoice_currency FROM pink_salt_imports${unit} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args,p.limit,p.offset).map(a=>{const items=one('SELECT SUM(line_amount_krw) purchase,SUM(landed_cost_krw) landed FROM pink_salt_import_items WHERE import_id=?',a.id),costs=val("SELECT SUM(krw_amount) v FROM pink_salt_import_costs WHERE import_id=? AND COALESCE(status,'Active')!='Voided'",a.id),g=posted(a.business_unit_id,'Pink Salt Import',a.id,asOf);return {...a,reference:a.import_no,source_purchase_krw:round(items.purchase),source_landed_krw:round(items.landed),source_extra_costs_krw:costs,posted_in_transit_krw:mapGl(g,'PINK_SALT_IN_TRANSIT'),posted_raw_receipt_krw:mapGl(g,'PINK_SALT_RAW_INVENTORY'),flags:a.status==='Received'&&Math.abs(Number(items.landed||0)-Number(items.purchase||0)-costs)>.01?['LANDED_SOURCE_DIFFERS']:[]}});
   basis='Import source purchase and landed-cost snapshots compared with import-linked posted GL through the selected date. Later item consumption is not assigned to an import closing value.';
  }else if(kind==='batch'){
   const where=[bu?'business_unit_id=?':'',"status='Completed'"].filter(Boolean).join(' AND '),filter=' WHERE '+where;
   total=one(`SELECT COUNT(*) n FROM pink_salt_production_batches${filter}`,...args).n;
   rows=db.prepare(`SELECT id,batch_no,business_unit_id,production_date,status FROM pink_salt_production_batches${filter} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args,p.limit,p.offset).map(a=>{const raw=val('SELECT SUM(input_weight_kg*raw_unit_cost_krw) v FROM pink_salt_production_inputs WHERE production_batch_id=?',a.id),pack=val('SELECT SUM(quantity_used*unit_cost_krw) v FROM pink_salt_production_packaging WHERE production_batch_id=?',a.id),output=val('SELECT SUM(quantity_units*unit_cost_krw) v FROM pink_salt_production_outputs WHERE production_batch_id=?',a.id),g=posted(a.business_unit_id,'Pink Salt Production',a.id,asOf,true),finished=mapGl(g,'PINK_SALT_FINISHED_INVENTORY');return {...a,reference:a.batch_no,source_raw_krw:raw,source_packaging_krw:pack,source_output_krw:output,posted_finished_krw:finished,posted_loss_krw:mapGl(g,'PINK_SALT_WASTE_EXPENSE'),flags:Math.abs(output-finished)>.01?['SOURCE_POSTED_OUTPUT_DIFFERS']:[]}});
   basis='Completed batch inputs/outputs versus posted conversion journals. Waste absorption and WIP methods require approved policy.';
  }else if(kind==='sku'){
   total=one(`SELECT COUNT(*) n FROM pink_salt_products${unit}`,...args).n;
   rows=db.prepare(`SELECT id,sku,name,business_unit_id,active FROM pink_salt_products${unit} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args,p.limit,p.offset).map(a=>{const sales=one("SELECT SUM(i.line_total_krw) revenue,SUM(i.line_cost_krw) cost FROM pink_salt_order_items i JOIN pink_salt_orders o ON o.id=i.order_id WHERE i.product_id=? AND o.status='Completed'",a.id),stock=val('SELECT SUM(quantity_units) v FROM pink_salt_finished_stock_movements WHERE product_id=?',a.id);return {...a,reference:a.sku,source_completed_sales_krw:round(sales.revenue),source_completed_cost_krw:round(sales.cost),source_gross_margin_krw:round(Number(sales.revenue||0)-Number(sales.cost||0)),source_stock_units:stock,posted_sku_profit_krw:null,flags:stock<0?['NEGATIVE_STOCK']:[]}});
   basis='Current operational SKU sale/cost and stock units. Posted sale and production GL are order/batch-scoped; SKU-level official profit is unavailable without approved allocation and cannot be fabricated.';
  }else if(kind==='invoice_aging'){
   const where=`o.status='Completed' AND o.order_date<=? ${bu?'AND o.business_unit_id=?':''}`,bind=bu?[asOf,bu]:[asOf];
   total=one(`SELECT COUNT(*) n FROM pink_salt_orders o WHERE ${where}`,...bind).n;
   rows=db.prepare(`SELECT o.id,o.order_no,o.business_unit_id,o.customer_id,o.customer_name,o.order_date,o.due_date,o.total_krw,o.prepaid_applied_krw FROM pink_salt_orders o WHERE ${where} ORDER BY COALESCE(o.due_date,o.order_date),o.id LIMIT ? OFFSET ?`).all(...bind,p.limit,p.offset).map(o=>{
    const legacy=val("SELECT SUM(krw_amount) v FROM pink_salt_customer_payments WHERE order_id=? AND status='Active' AND payment_role='Sale Payment' AND payment_date<=?",o.id,asOf),alloc=val("SELECT SUM(a.amount_krw) v FROM pink_salt_customer_receipt_allocations a JOIN pink_salt_customer_receipts r ON r.id=a.receipt_id WHERE a.order_id=? AND a.status='Active' AND r.status='Active' AND r.payment_date<=?",o.id,asOf),refund=val("SELECT SUM(krw_amount) v FROM pink_salt_customer_refunds WHERE order_id=? AND status='Active' AND refund_date<=?",o.id,asOf),source=round(Math.max(0,Number(o.total_krw)-Number(o.prepaid_applied_krw||0)-Math.max(0,legacy+alloc-refund))),postedAR=orderPostedAR(o,asOf),due=o.due_date||null,days=due&&due<asOf?Math.floor((Date.parse(asOf+'T00:00:00Z')-Date.parse(due+'T00:00:00Z'))/86400000):0,bucket=days===0?'Current':days<=30?'1-30':days<=60?'31-60':days<=90?'61-90':'90+';return {...o,reference:o.order_no,source_invoice_krw:round(o.total_krw),source_paid_krw:round(legacy+alloc-refund),source_outstanding_krw:source,posted_receivable_krw:postedAR,difference_krw:round(source-postedAR),days_overdue:days,aging_bucket:bucket,flags:Math.abs(source-postedAR)>.01?['SOURCE_POSTED_RECEIVABLE_DIFFERS']:[]}
   });
   basis='Pink Salt completed invoice due-date aging uses direct sale payments, applied prepayment, active receipt allocations and refunds. Posted AR follows Finance sale/payment source IDs and direct allocation journal IDs, with order-dimension historical fallback. Customer-dimension manual adjustments without an invoice source remain unallocated. Current active/void status cannot reconstruct later reversals at an old cutoff.';
  }else if(kind==='supplier_invoice_aging'){
   const sql=`WITH obligations AS (
    SELECT 'Import' source_type,i.id source_id,i.import_no reference,i.business_unit_id,i.supplier_id,i.purchase_date source_date,i.expected_arrival due_date,
     COALESCE((SELECT SUM(x.line_amount_krw) FROM pink_salt_import_items x WHERE x.import_id=i.id),0) obligation_krw,
     COALESCE((SELECT SUM(x.krw_amount) FROM pink_salt_import_payments x WHERE x.import_id=i.id AND COALESCE(x.status,'Active')!='Voided' AND x.payment_date<=?),0) cash_paid_krw,
     COALESCE((SELECT SUM(x.amount_krw) FROM pink_salt_supplier_advance_allocations x WHERE x.import_id=i.id AND x.status='Active' AND x.allocation_date<=?),0) credit_applied_krw
    FROM pink_salt_imports i WHERE i.status NOT IN ('Cancelled','Voided') AND i.purchase_date<=? ${bu?'AND i.business_unit_id=?':''}
    UNION ALL
    SELECT 'Packaging' source_type,m.id source_id,COALESCE(NULLIF(m.reference,''),'PACK-'||m.id) reference,m.business_unit_id,m.supplier_id,m.movement_date source_date,m.due_date,
     m.quantity*m.unit_cost_krw obligation_krw,0 cash_paid_krw,
     COALESCE((SELECT SUM(x.amount_krw) FROM pink_salt_supplier_packaging_allocations x WHERE x.packaging_movement_id=m.id AND x.status='Active' AND x.allocation_date<=?),0) credit_applied_krw
    FROM pink_salt_packaging_movements m WHERE m.movement_type='Purchase Receipt' AND COALESCE(m.status,'Active')!='Voided' AND m.movement_date<=? ${bu?'AND m.business_unit_id=?':''}
   )`;
   const bind=[asOf,asOf,asOf,...(bu?[bu]:[]),asOf,asOf,...(bu?[bu]:[])];
   total=one(`${sql} SELECT COUNT(*) n FROM obligations WHERE obligation_krw-cash_paid_krw-credit_applied_krw>.01`,...bind).n;
   rows=db.prepare(`${sql} SELECT * FROM obligations WHERE obligation_krw-cash_paid_krw-credit_applied_krw>.01 ORDER BY COALESCE(due_date,source_date),source_type,source_id LIMIT ? OFFSET ?`).all(...bind,p.limit,p.offset).map(x=>{const due=x.due_date||null,days=due&&due<asOf?Math.floor((Date.parse(asOf+'T00:00:00Z')-Date.parse(due+'T00:00:00Z'))/86400000):0;return {...x,source_outstanding_krw:round(x.obligation_krw-x.cash_paid_krw-x.credit_applied_krw),days_overdue:days,aging_bucket:days===0?'Current':days<=30?'1-30':days<=60?'31-60':days<=90?'61-90':'90+',posted_invoice_payable_krw:null}});
   basis='Paged Pink Salt import and packaging obligation aging uses source due dates, real import payments and supplier-credit allocations. Posted AP is supplier-dimension, so an invoice-level GL amount is not assigned. Current active/void status cannot reconstruct later reversals at an old cutoff; see source reconciliation for supplier-level GL differences.';
  }else if(kind==='expense'){
   const cond=`j.status IN ('Posted','Reversed') AND j.transaction_date<=? AND a.account_type='Expense' ${bu?'AND l.business_unit_id=?':''}`,bind=bu?[asOf,bu]:[asOf];
   total=one(`SELECT COUNT(*) n FROM (SELECT a.id,l.business_unit_id FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE ${cond} GROUP BY a.id,l.business_unit_id)`,...bind).n;
   rows=db.prepare(`SELECT a.id account_id,a.code,a.name,l.business_unit_id,ROUND(SUM(l.debit_krw-l.credit_krw),2) posted_expense_krw FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE ${cond} GROUP BY a.id,l.business_unit_id ORDER BY ABS(posted_expense_krw) DESC,a.code LIMIT ? OFFSET ?`).all(...bind,p.limit,p.offset).map(x=>({...x,reference:x.code,posted_expense_krw:round(x.posted_expense_krw)}));
   basis='Posted expense account totals through the selected date, separated by business unit; use account statement for journal drill-down.';
  }else{
   const cond=`j.status IN ('Posted','Reversed') AND j.transaction_date<=? AND a.system_key IN ('ACCOUNTS_RECEIVABLE','ACCOUNTS_PAYABLE') ${bu?'AND l.business_unit_id=?':''}`,bind=bu?[asOf,bu]:[asOf];
   total=one(`SELECT COUNT(*) n FROM (SELECT a.id,l.business_unit_id,COALESCE(l.entity_type,''),COALESCE(l.entity_id,0) FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE ${cond} GROUP BY a.id,l.business_unit_id,l.entity_type,l.entity_id HAVING ABS(SUM(CASE WHEN a.system_key='ACCOUNTS_RECEIVABLE' THEN l.debit_krw-l.credit_krw ELSE l.credit_krw-l.debit_krw END))>.01)`,...bind).n;
   rows=db.prepare(`SELECT a.system_key,a.code,l.business_unit_id,l.entity_type,l.entity_id,MIN(j.transaction_date) first_posted_date,MAX(j.transaction_date) last_posted_date,ROUND(SUM(CASE WHEN a.system_key='ACCOUNTS_RECEIVABLE' THEN l.debit_krw-l.credit_krw ELSE l.credit_krw-l.debit_krw END),2) net_exposure_krw FROM accounting_journal_lines l JOIN accounting_journal_entries j ON j.id=l.journal_entry_id JOIN accounting_accounts a ON a.id=l.account_id WHERE ${cond} GROUP BY a.id,l.business_unit_id,l.entity_type,l.entity_id HAVING ABS(SUM(CASE WHEN a.system_key='ACCOUNTS_RECEIVABLE' THEN l.debit_krw-l.credit_krw ELSE l.credit_krw-l.debit_krw END))>.01 ORDER BY ABS(net_exposure_krw) DESC LIMIT ? OFFSET ?`).all(...bind,p.limit,p.offset).map(x=>({...x,reference:`${x.entity_type||'Unassigned'} #${x.entity_id||''}`,net_exposure_krw:round(x.net_exposure_krw),age_of_first_posting_days:Math.floor((Date.parse(asOf+'T00:00:00Z')-Date.parse(x.first_posted_date+'T00:00:00Z'))/86400000)}));
   basis='Posted receivable/payable exposure by source entity. Age is since the first posting, not an invoice-due aging allocation; apply operational invoice settlement links for formal aging. Unassigned and negative exposures are shown separately.';
  }
  res.json({kind,as_of:asOf,business_unit_id:bu,page:p.page,page_size:p.page_size,total,rows,basis,read_only:true});
 }catch(e){res.status(e.status||500).json({error:e.message})}});
}
module.exports={install};
