'use strict';
// V30.48 read-only, BU-scoped projections for LIST views; mutation-time single-record
// settlement helpers remain authoritative. No ledger write, reclassification or schema change.
const n=v=>Number(v||0);
function lookup(rows,key){return new Map(rows.map(r=>[Number(r[key]),n(r.amount)]))}
function grouped(db,sql,bu,key,args=[]){return lookup(db.prepare(sql).all(bu,...args),key)}
function financialsBulk(db,bu,orders,today){
  if(!orders.length)return new Map();
  // For a paged list, aggregate only the visible order IDs; the legacy full-list path stays compatible.
  const ids=orders.length<=100?orders.map(o=>Number(o.id)).filter(Number.isSafeInteger):[];
  const restrict=ids.length?' AND o.id IN ('+ids.map(()=>'?').join(',')+')':'';
  const legacy=grouped(db,`SELECT p.order_id,COALESCE(SUM(p.krw_amount),0) amount FROM pink_salt_customer_payments p JOIN pink_salt_orders o ON o.id=p.order_id WHERE o.business_unit_id=? AND p.status='Active' ${restrict} GROUP BY p.order_id`,bu,'order_id',ids);
  const allocations=grouped(db,`SELECT a.order_id,COALESCE(SUM(a.amount_krw),0) amount FROM pink_salt_customer_receipt_allocations a JOIN pink_salt_customer_receipts r ON r.id=a.receipt_id JOIN pink_salt_orders o ON o.id=a.order_id WHERE o.business_unit_id=? AND a.status='Active' AND r.status='Active' ${restrict} GROUP BY a.order_id`,bu,'order_id',ids);
  const refunds=grouped(db,`SELECT p.order_id,COALESCE(SUM(p.krw_amount),0) amount FROM pink_salt_customer_refunds p JOIN pink_salt_orders o ON o.id=p.order_id WHERE o.business_unit_id=? AND p.status='Active' ${restrict} GROUP BY p.order_id`,bu,'order_id',ids);
  const result=new Map();
  for(const o of orders){const l=legacy.get(Number(o.id))||0,a=allocations.get(Number(o.id))||0,r=refunds.get(Number(o.id))||0,paid=Math.max(0,l+a-r),outstanding=o.status==='Cancelled'?0:Math.max(0,n(o.total_krw)-paid);
    let status='Unpaid';if(o.status==='Cancelled')status=paid>0?'Credit Held':'Cancelled';else if(outstanding<=0.005&&n(o.total_krw)>0)status='Paid';else if(paid>0)status='Partially Paid';else if(o.due_date&&o.due_date<today)status='Overdue';
    result.set(Number(o.id),{legacy_paid_krw:l,allocated_paid_krw:a,refunded_krw:r,paid_krw:paid,outstanding_krw:outstanding,payment_status_v313:status});
  }return result;
}
function customersBulk(db,bu,today,selectedCustomers=null){
  const customers=selectedCustomers||db.prepare('SELECT * FROM pink_salt_customers WHERE business_unit_id=? ORDER BY active DESC,name').all(bu);
  if(!customers.length)return[];
  const ids=selectedCustomers&&customers.length<=100?customers.map(c=>Number(c.id)):[];
  const restrict=ids.length?' AND customer_id IN ('+ids.map(()=>'?').join(',')+')':'';
  const orders=db.prepare(`SELECT * FROM pink_salt_orders WHERE business_unit_id=? AND status='Completed' ${restrict} ORDER BY order_date,id`).all(bu,...ids);
  const fin=financialsBulk(db,bu,orders,today);
  const receipts=db.prepare(`SELECT id,customer_id,gross_settlement_krw FROM pink_salt_customer_receipts WHERE business_unit_id=? AND status='Active' ${restrict}`).all(bu,...ids);
  const used=grouped(db,`SELECT r.id receipt_id,COALESCE(SUM(a.amount_krw),0) amount FROM pink_salt_customer_receipts r JOIN pink_salt_customer_receipt_allocations a ON a.receipt_id=r.id WHERE r.business_unit_id=? AND r.status='Active' AND a.status='Active' ${ids.length?' AND r.customer_id IN ('+ids.map(()=>'?').join(',')+')':''} GROUP BY r.id`,bu,'receipt_id',ids);
  const adjustments=db.prepare(`SELECT customer_id,effect,amount_krw FROM pink_salt_customer_adjustments WHERE business_unit_id=? AND status='Active' ${restrict}`).all(bu,...ids);
  const sums=new Map(customers.map(c=>[Number(c.id),{completed_orders:0,lifetime_sales_krw:0,paid_krw:0,outstanding_krw:0,overdue_krw:0,unallocated_credit_krw:0,adjustment_net_krw:0}]));
  for(const o of orders){const s=sums.get(Number(o.customer_id));if(!s)continue;const f=fin.get(Number(o.id));s.completed_orders++;s.lifetime_sales_krw+=n(o.total_krw);s.paid_krw+=f.paid_krw;s.outstanding_krw+=f.outstanding_krw;if(o.due_date&&o.due_date<today)s.overdue_krw+=f.outstanding_krw}
  for(const r of receipts){const s=sums.get(Number(r.customer_id));if(s)s.unallocated_credit_krw+=Math.max(0,n(r.gross_settlement_krw)-(used.get(Number(r.id))||0))}
  for(const a of adjustments){const s=sums.get(Number(a.customer_id));if(s)s.adjustment_net_krw+=a.effect==='Debit'?n(a.amount_krw):-n(a.amount_krw)}
  return customers.map(c=>{const s=sums.get(Number(c.id));return {...c,...s,account_balance_krw:s.outstanding_krw+s.adjustment_net_krw-s.unallocated_credit_krw}});
}
module.exports={financialsBulk,customersBulk};
