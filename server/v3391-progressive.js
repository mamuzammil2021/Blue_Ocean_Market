'use strict';

const {parsePaging,sendPaged}=require('./pagination-v339');
const VERSION='30.39.1';

function text(v){return String(v??'').trim()}
function numeric(v){return Number(v||0)}
function sqlLike(v){return `%${text(v).toLowerCase()}%`}

function install({app,db,auth,allow,excavatorGuard}){
  const included=`(t.metadata IS NULL OR t.metadata='' OR json_extract(t.metadata,'$.include_in_machine_cost') IS NOT 0)`;
  const txActive=`t.status NOT IN ('Cancelled','Voided')`;
  const purchaseTx=`COALESCE((SELECT SUM(t.amount) FROM excavator_transactions t WHERE t.asset_id=a.id AND t.type='Purchase' AND ${txActive} AND ${included}),0)`;
  const purchase=`CASE WHEN (${purchaseTx})>0 THEN (${purchaseTx}) ELSE COALESCE(a.purchase_price,0) END`;
  const logisticsTx=`COALESCE((SELECT SUM(t.amount) FROM excavator_transactions t WHERE t.asset_id=a.id AND t.type='Logistics' AND ${txActive} AND ${included}),0)`;
  const legacyLogistics=`COALESCE((SELECT SUM(l.amount) FROM excavator_logistics l WHERE l.asset_id=a.id AND NOT EXISTS (SELECT 1 FROM excavator_transactions tr WHERE tr.asset_id=a.id AND tr.type='Logistics' AND tr.metadata LIKE '%"logistics_id":'||l.id||'%')),0)`;
  const repairTx=`COALESCE((SELECT SUM(t.amount) FROM excavator_transactions t WHERE t.asset_id=a.id AND t.type='Repair' AND ${txActive} AND ${included}),0)`;
  const legacyRepair=`COALESCE((SELECT SUM(r.amount) FROM excavator_repairs r WHERE r.asset_id=a.id AND NOT EXISTS (SELECT 1 FROM excavator_transactions tr WHERE tr.asset_id=a.id AND tr.type='Repair' AND tr.metadata LIKE '%"repair_id":'||r.id||'%')),0)`;
  const partTx=`COALESCE((SELECT SUM(t.amount) FROM excavator_transactions t WHERE t.asset_id=a.id AND t.type='Part Purchase' AND ${txActive} AND ${included}),0)`;
  const legacyParts=`COALESCE((SELECT SUM(p.cost*p.quantity) FROM excavator_parts p WHERE p.asset_id=a.id AND p.status NOT IN ('Sold','Exported') AND NOT EXISTS (SELECT 1 FROM excavator_transactions tr WHERE tr.asset_id=a.id AND tr.type='Part Purchase' AND tr.metadata LIKE '%"part_id":'||p.id||'%')),0)`;
  const other=`COALESCE((SELECT SUM(t.amount) FROM excavator_transactions t WHERE t.asset_id=a.id AND t.type IN ('Customs Duty','Tax / VAT','Shipping / Freight','Commission','Documentation / Clearance','Other Cost') AND ${txActive} AND ${included}),0)`;
  const sale=`COALESCE((SELECT SUM(t.amount) FROM excavator_transactions t WHERE t.asset_id=a.id AND t.type IN ('Local Sale','Export Sale') AND t.status NOT IN ('Cancelled','Voided')),0)`;
  const purchasePaid=`COALESCE((SELECT SUM(p.amount) FROM excavator_payments p WHERE p.asset_id=a.id AND p.payment_type='Purchase' AND p.status='Paid'),0)`;
  const legacySalePaid=`COALESCE((SELECT SUM(p.amount) FROM excavator_payments p WHERE p.asset_id=a.id AND p.payment_type='Sale' AND p.status='Paid'),0)`;
  const allocatedSalePaid=`COALESCE((SELECT SUM(al.amount_krw) FROM excavator_buyer_payment_allocations al JOIN excavator_buyer_payments bp ON bp.id=al.payment_id WHERE al.asset_id=a.id AND COALESCE(al.status,'Active')='Active' AND COALESCE(bp.status,'Active')!='Voided'),0)`;

  function assetCte(whereSql='1=1'){
    return `WITH costed AS (
      SELECT a.*,s.name supplier_name,s.location supplier_location,
        COALESCE(NULLIF(a.machine_name,''),TRIM(COALESCE(a.make,'')||' '||COALESCE(a.model,''))) machine_display_name,
        ${purchase} purchase_cost,
        (${logisticsTx}+${legacyLogistics}) logistics_cost,
        (${repairTx}+${legacyRepair}) repair_cost,
        (${partTx}+${legacyParts}) parts_cost,
        ${other} other_cost,
        ${sale} sale_amount,
        ${purchasePaid} purchase_paid,
        MAX(${legacySalePaid},${allocatedSalePaid}) sale_paid,
        COALESCE((SELECT COUNT(*) FROM excavator_documents d WHERE d.asset_id=a.id),0) document_count
      FROM excavator_assets a
      LEFT JOIN excavator_suppliers s ON s.id=a.supplier_id
      WHERE a.business_unit_id=? AND ${whereSql}
    ), snapshots AS (
      SELECT costed.*,
        (purchase_cost+logistics_cost+repair_cost+parts_cost+other_cost) total_cost,
        (sale_amount-(purchase_cost+logistics_cost+repair_cost+parts_cost+other_cost)) profit_loss,
        CASE WHEN sale_amount<=0 THEN 'Not Sold' WHEN sale_amount-(purchase_cost+logistics_cost+repair_cost+parts_cost+other_cost)>=0 THEN 'Profit' ELSE 'Loss' END profit_loss_status,
        CASE WHEN sale_amount<=0 THEN 'Not Sold' WHEN sale_paid>=sale_amount THEN 'Paid' WHEN sale_paid>0 THEN 'Partially Paid' ELSE 'Pending' END sale_payment_status,
        MAX(0,sale_amount-sale_paid) sale_outstanding,
        CASE WHEN purchase_cost<=0 THEN 'Unknown' WHEN purchase_paid>=purchase_cost THEN 'Paid' WHEN purchase_paid>0 THEN 'Token/Partial Paid' ELSE 'Pending' END purchase_status,
        MAX(0,purchase_cost-purchase_paid) purchase_outstanding
      FROM costed
    )`;
  }

  function assetFilter(req){
    const conditions=[],args=[];
    const q=text(req.query.search).toLowerCase();
    if(q){conditions.push(`lower(COALESCE(a.asset_no,'')||' '||COALESCE(a.machine_name,'')||' '||COALESCE(a.make,'')||' '||COALESCE(a.model,'')||' '||COALESCE(a.serial_no,'')||' '||COALESCE(a.type,'')||' '||COALESCE(s.name,'')||' '||COALESCE(s.location,'')) LIKE ?`);args.push(sqlLike(q))}
    const stage=text(req.query.stage||req.query.filter);
    if(stage==='Archived')conditions.push('COALESCE(a.archived,0)=1');
    else if(stage==='Open'){conditions.push("COALESCE(a.archived,0)=0 AND COALESCE(a.lifecycle_stage,'') NOT IN ('Sold / Completed','Cancelled')")}
    else if(stage==='Sold / Completed')conditions.push("COALESCE(a.archived,0)=0 AND a.lifecycle_stage='Sold / Completed'");
    else if(stage && !['All','Profit','Loss','Not Sold'].includes(stage)){conditions.push('COALESCE(a.archived,0)=0 AND a.lifecycle_stage=?');args.push(stage)}
    else if(stage!=='Archived')conditions.push('COALESCE(a.archived,0)=0');
    return {where:conditions.length?conditions.join(' AND '):'1=1',args,post:stage};
  }

  function assetOrder(sort){
    return ({oldest:'id ASC',name:'lower(COALESCE(machine_name,machine_display_name,make||\' \'||model)) ASC,id ASC',purchase_high:'purchase_cost DESC,id DESC',purchase_low:'purchase_cost ASC,id DESC',cost_high:'total_cost DESC,id DESC',profit_high:'profit_loss DESC,id DESC',profit_low:'profit_loss ASC,id DESC'}[text(sort)]||'id DESC');
  }

  function loadAssetSnapshots(b,{where='1=1',args=[],post='',sort='newest',limit=null,offset=0}={}){
    const cte=assetCte(where),postWhere=post==='Profit'?"profit_loss_status='Profit'":post==='Loss'?"profit_loss_status='Loss'":post==='Not Sold'?"profit_loss_status='Not Sold'":'1=1';
    const params=[b,...args],order=assetOrder(sort),limitSql=limit==null?'':' LIMIT ? OFFSET ?';
    if(limit!=null)params.push(limit,offset);
    return db.prepare(`${cte} SELECT * FROM snapshots WHERE ${postWhere} ORDER BY ${order}${limitSql}`).all(...params);
  }

  function countAssetSnapshots(b,{where='1=1',args=[],post=''}={}){
    const cte=assetCte(where),postWhere=post==='Profit'?"profit_loss_status='Profit'":post==='Loss'?"profit_loss_status='Loss'":post==='Not Sold'?"profit_loss_status='Not Sold'":'1=1';
    return Number(db.prepare(`${cte} SELECT COUNT(*) c FROM snapshots WHERE ${postWhere}`).get(b,...args)?.c||0);
  }

  // Replace the legacy in-memory N×M Excavator overview aggregation. The response
  // contract remains compatible; operations screens may request summary-only data.
  app.get('/api/excavator/overview',auth,allow('dashboard'),(req,res)=>{
    const b=excavatorGuard(req,res);if(!b)return;
    try{
      const includeAssets=String(req.query.include_assets||'1')!=='0';
      const agg=db.prepare(`${assetCte('COALESCE(a.archived,0)=0')} SELECT
        COUNT(*) machines,
        SUM(CASE WHEN lifecycle_stage NOT IN ('Sold / Completed','Cancelled') THEN 1 ELSE 0 END) open,
        SUM(CASE WHEN lifecycle_stage='In Yard' THEN 1 ELSE 0 END) inYard,
        SUM(CASE WHEN lifecycle_stage='Under Repair' THEN 1 ELSE 0 END) repairing,
        SUM(CASE WHEN lifecycle_stage='Ready for Sale' THEN 1 ELSE 0 END) ready,
        SUM(CASE WHEN lifecycle_stage IN ('Export Preparation','Shipped') THEN 1 ELSE 0 END) exporting,
        SUM(CASE WHEN lifecycle_stage='Sold / Completed' THEN 1 ELSE 0 END) sold,
        COALESCE(SUM(purchase_cost),0) purchase,
        COALESCE(SUM(logistics_cost),0) logistics,
        COALESCE(SUM(repair_cost),0) repair,
        COALESCE(SUM(parts_cost),0) partCost,
        COALESCE(SUM(other_cost),0) other,
        COALESCE(SUM(total_cost),0) totalCost,
        COALESCE(SUM(sale_amount),0) sales,
        COALESCE(SUM(sale_paid),0) salePaid,
        COALESCE(SUM(purchase_paid),0) purchasePaid
        FROM snapshots`).get(b)||{};
      const summary={machines:numeric(agg.machines),open:numeric(agg.open),inYard:numeric(agg.inYard),repairing:numeric(agg.repairing),ready:numeric(agg.ready),exporting:numeric(agg.exporting),sold:numeric(agg.sold),purchase:numeric(agg.purchase),logistics:numeric(agg.logistics),repair:numeric(agg.repair),partCost:numeric(agg.partCost),other:numeric(agg.other),totalCost:numeric(agg.totalCost),sales:numeric(agg.sales),margin:numeric(agg.sales)-numeric(agg.totalCost),receivable:Math.max(0,numeric(agg.sales)-numeric(agg.salePaid)),payable:Math.max(0,numeric(agg.purchase)-numeric(agg.purchasePaid)),buyers:Number(db.prepare('SELECT COUNT(*) c FROM excavator_buyers WHERE business_unit_id=? AND active=1').get(b)?.c||0),suppliers:Number(db.prepare('SELECT COUNT(*) c FROM excavator_suppliers WHERE business_unit_id=? AND active=1').get(b)?.c||0)};
      const assets=includeAssets?loadAssetSnapshots(b,{where:'COALESCE(a.archived,0)=0'}):[];
      res.json({currency:'KRW',summary,assets});
    }catch(e){console.error('V30.39.1 optimized Excavator overview:',e);res.status(500).json({error:'Excavator dashboard could not be loaded: '+e.message})}
  });

  // True server-side machine paging. Legacy callers remain unchanged unless paged=1.
  app.get('/api/excavator/assets',auth,allow('dashboard','sales','purchases','inventory','finance','documents'),(req,res,next)=>{
    if(String(req.query.paged||'')!=='1')return next();
    const b=excavatorGuard(req,res);if(!b)return;
    try{
      const paging=parsePaging(req),f=assetFilter(req),cte=assetCte(f.where),postWhere=f.post==='Profit'?"profit_loss_status='Profit'":f.post==='Loss'?"profit_loss_status='Loss'":f.post==='Not Sold'?"profit_loss_status='Not Sold'":'1=1',order=assetOrder(req.query.sort);
      let rows=db.prepare(`${cte} SELECT snapshots.*,COUNT(*) OVER() __total FROM snapshots WHERE ${postWhere} ORDER BY ${order} LIMIT ? OFFSET ?`).all(b,...f.args,paging.limit,paging.offset);
      let total=rows.length?Number(rows[0].__total||0):0;
      if(!rows.length&&paging.page>1)total=countAssetSnapshots(b,f);
      rows=rows.map(({__total,...row})=>row);
      sendPaged(res,rows,total,paging);
    }catch(e){console.error('V30.39.1 paged Excavator assets:',e);res.status(500).json({error:e.message})}
  });

  // True server-side Buyer paging with SQL-side totals. Existing edit/dropdown callers
  // still receive the legacy array because they omit paged=1.
  app.get('/api/excavator/buyers',auth,allow('dashboard','sales','purchases','finance'),(req,res,next)=>{
    if(String(req.query.paged||'')!=='1')return next();
    const b=excavatorGuard(req,res);if(!b)return;
    try{
      const paging=parsePaging(req),q=text(req.query.search).toLowerCase(),where=q?" AND lower(COALESCE(x.name,'')||' '||COALESCE(x.country,'')||' '||COALESCE(x.location,'')||' '||COALESCE(x.phone,'')||' '||COALESCE(x.whatsapp,'')||' '||COALESCE(x.contact_person,'')) LIKE ?":'',args=q?[sqlLike(q)]:[];
      const total=Number(db.prepare(`SELECT COUNT(*) c FROM excavator_buyers x WHERE x.business_unit_id=? AND x.active=1${where}`).get(b,...args)?.c||0);
      const rows=db.prepare(`SELECT x.*,
        COALESCE((SELECT SUM(p.krw_amount) FROM excavator_buyer_payments p WHERE p.buyer_id=x.id AND p.status='Active'),0) total_paid_krw,
        COALESCE((SELECT SUM(al.amount_krw) FROM excavator_buyer_payment_allocations al JOIN excavator_buyer_payments ap ON ap.id=al.payment_id AND ap.status='Active' WHERE al.buyer_id=x.id AND COALESCE(al.status,'Active')='Active'),0)+COALESCE((SELECT SUM(p2.krw_amount) FROM excavator_buyer_payments p2 WHERE p2.buyer_id=x.id AND p2.status='Active' AND p2.asset_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM excavator_buyer_payment_allocations al2 WHERE al2.payment_id=p2.id AND COALESCE(al2.status,'Active')='Active')),0) allocated_krw,
        COALESCE((SELECT SUM(r.krw_amount) FROM excavator_buyer_refunds r WHERE r.buyer_id=x.id AND r.status='Completed'),0) refunded_krw,
        COALESCE((SELECT COUNT(*) FROM excavator_assets a WHERE a.buyer_id=x.id AND a.business_unit_id=x.business_unit_id),0) machine_count
        FROM excavator_buyers x WHERE x.business_unit_id=? AND x.active=1${where} ORDER BY lower(x.name),x.id LIMIT ? OFFSET ?`).all(b,...args,paging.limit,paging.offset).map(x=>({...x,unallocated_advance_krw:Math.max(0,numeric(x.total_paid_krw)-numeric(x.allocated_krw)-numeric(x.refunded_krw))}));
      const summary=db.prepare(`SELECT
        (SELECT COUNT(*) FROM excavator_buyers x WHERE x.business_unit_id=? AND x.active=1) buyers,
        COALESCE((SELECT SUM(p.krw_amount) FROM excavator_buyer_payments p JOIN excavator_buyers x ON x.id=p.buyer_id WHERE x.business_unit_id=? AND x.active=1 AND p.status='Active'),0) total_paid,
        COALESCE((SELECT SUM(al.amount_krw) FROM excavator_buyer_payment_allocations al JOIN excavator_buyer_payments p ON p.id=al.payment_id AND p.status='Active' JOIN excavator_buyers x ON x.id=al.buyer_id WHERE x.business_unit_id=? AND x.active=1 AND COALESCE(al.status,'Active')='Active'),0) allocated,
        COALESCE((SELECT SUM(p2.krw_amount) FROM excavator_buyer_payments p2 JOIN excavator_buyers x ON x.id=p2.buyer_id WHERE x.business_unit_id=? AND x.active=1 AND p2.status='Active' AND p2.asset_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM excavator_buyer_payment_allocations al2 WHERE al2.payment_id=p2.id AND COALESCE(al2.status,'Active')='Active')),0) direct_allocated,
        COALESCE((SELECT SUM(r.krw_amount) FROM excavator_buyer_refunds r JOIN excavator_buyers x ON x.id=r.buyer_id WHERE x.business_unit_id=? AND x.active=1 AND r.status='Completed'),0) refunded,
        COALESCE((SELECT COUNT(*) FROM excavator_assets a JOIN excavator_buyers x ON x.id=a.buyer_id WHERE x.business_unit_id=? AND x.active=1),0) machines`).get(b,b,b,b,b,b);
      const paid=numeric(summary.total_paid),allocated=numeric(summary.allocated)+numeric(summary.direct_allocated),refunded=numeric(summary.refunded);
      res.setHeader('X-Total-Count',String(total));res.json({rows,pagination:{page:paging.page,page_size:paging.pageSize,total,pages:Math.max(1,Math.ceil(total/paging.pageSize)),from:total?paging.offset+1:0,to:Math.min(total,paging.offset+paging.pageSize)},summary:{buyers:numeric(summary.buyers),total_paid_krw:paid,available_advance_krw:Math.max(0,paid-allocated-refunded),machines:numeric(summary.machines)}});
    }catch(e){console.error('V30.39.1 paged buyers:',e);res.status(500).json({error:e.message})}
  });

  // True server-side Supplier paging. Count subqueries now run only for the requested page.
  app.get('/api/excavator/suppliers',auth,allow('dashboard','sales','purchases','finance'),(req,res,next)=>{
    if(String(req.query.paged||'')!=='1')return next();
    const b=excavatorGuard(req,res);if(!b)return;
    try{
      const paging=parsePaging(req),q=text(req.query.search).toLowerCase(),where=q?" AND lower(COALESCE(s.name,'')||' '||COALESCE(s.location,'')||' '||COALESCE(s.contact_person,'')||' '||COALESCE(s.phone,'')||' '||COALESCE(s.email,'')) LIKE ?":'',args=q?[sqlLike(q)]:[];
      const total=Number(db.prepare(`SELECT COUNT(*) c FROM excavator_suppliers s WHERE s.business_unit_id=? AND s.active=1${where}`).get(b,...args)?.c||0);
      const rows=db.prepare(`SELECT s.*,
        (SELECT COUNT(*) FROM excavator_supplier_machines sm WHERE sm.supplier_id=s.id AND sm.status='Available') available_machine_count,
        (SELECT COUNT(*) FROM excavator_assets a WHERE a.supplier_id=s.id AND a.business_unit_id=s.business_unit_id) purchased_machine_count
        FROM excavator_suppliers s WHERE s.business_unit_id=? AND s.active=1${where} ORDER BY lower(s.name),s.id LIMIT ? OFFSET ?`).all(b,...args,paging.limit,paging.offset);
      const summary=db.prepare(`SELECT COUNT(DISTINCT s.id) suppliers,
        COALESCE(SUM(CASE WHEN sm.status='Available' THEN 1 ELSE 0 END),0) available_machines,
        COUNT(DISTINCT CASE WHEN sm.status='Available' THEN s.id END) suppliers_with_machines
        FROM excavator_suppliers s LEFT JOIN excavator_supplier_machines sm ON sm.supplier_id=s.id
        WHERE s.business_unit_id=? AND s.active=1`).get(b);
      res.json({rows,pagination:{page:paging.page,page_size:paging.pageSize,total,pages:Math.max(1,Math.ceil(total/paging.pageSize)),from:total?paging.offset+1:0,to:Math.min(total,paging.offset+paging.pageSize)},summary:{suppliers:numeric(summary.suppliers),available_machines:numeric(summary.available_machines),suppliers_with_machines:numeric(summary.suppliers_with_machines)}});
    }catch(e){console.error('V30.39.1 paged suppliers:',e);res.status(500).json({error:e.message})}
  });

  return {VERSION};
}

module.exports={VERSION,install};
