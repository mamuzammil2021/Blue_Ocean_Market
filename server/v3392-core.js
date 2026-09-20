// Blue Ocean Market V30.39.2 — Core Runtime & Data Path Optimization.
'use strict';
const VERSION='30.39.2';

function install({app,db,auth,allow,access,currentUnit,isFinanceReviewer}){
  // Evidence-driven indexes for the set-based summary paths introduced in V30.39.2.
  // Keep these narrowly aligned with real JOIN/WHERE patterns rather than adding indexes blindly.
  const indexes=[
    `CREATE INDEX IF NOT EXISTS idx_ps_orders_v3392_summary ON pink_salt_orders(business_unit_id,customer_id,status,order_date,id)`,
    `CREATE INDEX IF NOT EXISTS idx_ps_imports_v3392_supplier ON pink_salt_imports(business_unit_id,supplier_id,status,id)`,
    `CREATE INDEX IF NOT EXISTS idx_ps_import_payments_v3392_import ON pink_salt_import_payments(import_id,status,id)`,
    `CREATE INDEX IF NOT EXISTS idx_ps_packaging_moves_v3392_supplier ON pink_salt_packaging_movements(business_unit_id,supplier_id,movement_type,status,id)`,
    `CREATE INDEX IF NOT EXISTS idx_ps_supplier_alloc_v3392_supplier ON pink_salt_supplier_advance_allocations(supplier_id,status,id)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_v3392_unread ON notifications(user_id,read_at,business_unit_id,id)`,
    `CREATE INDEX IF NOT EXISTS idx_accounting_queue_v3392_time ON accounting_sync_queue(queued_at,finance_entry_id)`
  ];
  for(const sql of indexes){try{db.exec(sql)}catch(e){if(!/no such table|no such column/i.test(String(e.message||'')))console.warn('V30.39.2 performance index:',e.message)}}

  // Lightweight event-loop lag sample. This is diagnostic only; it does no business work.
  let eventLoopLagMs=0,lastSampleAt=Date.now();
  const intervalMs=500;
  const lagTimer=setInterval(()=>{const now=Date.now();eventLoopLagMs=Math.max(0,now-lastSampleAt-intervalMs);lastSampleAt=now},intervalMs);
  if(typeof lagTimer.unref==='function')lagTimer.unref();


  // Finance Control Center server paging. This is an additive V30.39.2 endpoint so
  // detail/correction/mutation routes remain authoritative and unchanged.
  app.get('/api/finance/v3392-page',auth,allow('finance'),(req,res)=>{
    try{
      const page=Math.max(1,Number(req.query.page)||1),requestedSize=Number(req.query.pageSize)||25,pageSize=[25,50,100].includes(requestedSize)?requestedSize:25,offset=(page-1)*pageSize;
      const unit=Number(currentUnit?.(req)||0)||null,reviewer=typeof isFinanceReviewer==='function'?!!isFinanceReviewer(req.user,unit):['CEO / Owner','Finance / Admin'].includes(req.user.role);
      const scope=[],scopeArgs=[];
      if(unit){scope.push('f.business_unit_id=?');scopeArgs.push(unit)}else if(req.user.role!=='CEO / Owner'){scope.push('f.business_unit_id=?');scopeArgs.push(Number(req.user.business_unit_id||0))}
      if(!reviewer){scope.push('f.created_by=?');scopeArgs.push(Number(req.user.id))}
      scope.push("(COALESCE(f.cash_effect,0)<>0 OR f.source_type='Manual' OR f.source_type='Pakistan Resale Bank Transfer')");
      const scopeSql=scope.length?' AND '+scope.join(' AND '):'';
      const base=`SELECT f.*,b.name business_unit,u.name created_by_name,v.name verified_by_name,
        (SELECT COUNT(*) FROM finance_attachments fa WHERE fa.finance_entry_id=f.id AND COALESCE(fa.archived,0)=0) attachment_count,
        (SELECT COUNT(*) FROM approvals ap WHERE ap.source_entity='finance_entry' AND ap.source_id=f.id AND ap.status IN ('Pending','Resubmitted','Changes Required')) open_request_count,
        CASE WHEN f.source_type='Excavator Sale' AND (lower(COALESCE(f.payment_method,''))='buyer advance' OR EXISTS(SELECT 1 FROM excavator_transactions st WHERE st.id=f.source_id AND lower(COALESCE(st.metadata,'')) LIKE '%buyer_advance%')) THEN COALESCE((SELECT COUNT(*) FROM excavator_buyer_payment_allocations al JOIN excavator_transactions st2 ON st2.id=f.source_id JOIN excavator_buyer_payments bp ON bp.id=al.payment_id WHERE al.asset_id=st2.asset_id AND COALESCE(al.status,'Active')='Active' AND COALESCE(bp.status,'Active')!='Voided' AND COALESCE(bp.source_type,'')!='Excavator Sale'),0)
        WHEN f.source_type='Pink Salt Sale' THEN COALESCE((SELECT COUNT(*) FROM pink_salt_attachments pa WHERE pa.entity_type='Order' AND pa.entity_id=f.source_id),0)+COALESCE((SELECT COUNT(*) FROM pink_salt_customer_payments pp WHERE pp.order_id=f.source_id AND pp.status='Active'),0)
        WHEN f.source_type='Pink Salt Import Purchase' THEN COALESCE((SELECT COUNT(*) FROM pink_salt_attachments pa WHERE pa.entity_type='Import' AND pa.entity_id=f.source_id),0)
        WHEN f.source_type='Pink Salt Platform Fee' THEN COALESCE((SELECT COUNT(*) FROM pink_salt_attachments pa WHERE pa.entity_type='Order' AND pa.entity_id=f.source_id),0) ELSE 0 END linked_evidence_count,
        CASE WHEN f.status='Voided' THEN 'Voided'
          WHEN f.verification_status='Verified / Correct' THEN 'Verified'
          WHEN f.verification_status IN ('Correction Required','Rejected / Incorrect','Rejected') THEN 'Correction Required'
          WHEN f.verification_status='Resubmitted' OR (f.verification_status='Pending Verification' AND f.resubmitted_at IS NOT NULL) THEN 'Resubmitted'
          ELSE 'Pending Verification' END verification_label
        FROM finance_entries f JOIN business_units b ON b.id=f.business_unit_id LEFT JOIN users u ON u.id=f.created_by LEFT JOIN users v ON v.id=f.verified_by WHERE 1=1${scopeSql}`;
      const filters=[],args=[...scopeArgs],q=String(req.query.search||'').trim().toLowerCase(),status=String(req.query.status||''),type=String(req.query.type||''),evidence=String(req.query.evidence||''),special=String(req.query.special||''),from=String(req.query.from||''),to=String(req.query.to||'');
      if(q){filters.push("lower(COALESCE(source_label,'')||' '||COALESCE(source_type,'')||' '||COALESCE(reference,'')||' '||COALESCE(category,'')||' '||COALESCE(description,'')||' '||COALESCE(business_unit,'')) LIKE ?");args.push('%'+q+'%')}
      if(status){filters.push('verification_label=?');args.push(status)}
      if(type){filters.push('type=?');args.push(type)}
      if(evidence==='yes')filters.push("(attachment_count>0 OR trim(COALESCE(receipt_file,''))<>'' OR linked_evidence_count>0)");
      if(evidence==='no')filters.push("(attachment_count=0 AND trim(COALESCE(receipt_file,''))='' AND linked_evidence_count=0)");
      if(special==='requests')filters.push("(open_request_count>0 OR status='Voided')");
      if(from){filters.push("date(COALESCE(transaction_date,created_at))>=date(?)");args.push(from)}
      if(to){filters.push("date(COALESCE(transaction_date,created_at))<=date(?)");args.push(to)}
      const where=filters.length?' WHERE '+filters.join(' AND '):'';
      const total=Number(db.prepare(`WITH scoped AS (${base}) SELECT COUNT(*) c FROM scoped${where}`).get(...args)?.c||0);
      const rows=db.prepare(`WITH scoped AS (${base}) SELECT * FROM scoped${where} ORDER BY CASE WHEN verification_label IN ('Pending Verification','Resubmitted','Correction Required') THEN 0 ELSE 1 END,created_at DESC,id DESC LIMIT ? OFFSET ?`).all(...args,pageSize,offset);
      // KPI summary intentionally bypasses the evidence-enriched row CTE. It reads the
      // authorized Finance scope directly so paging KPIs do not pay per-row attachment/evidence cost.
      const sum=db.prepare(`SELECT
        SUM(CASE WHEN f.status!='Voided' AND COALESCE(f.verification_status,'Pending Verification') NOT IN ('Verified / Correct','Correction Required','Rejected / Incorrect','Rejected','Resubmitted') AND NOT (f.verification_status='Pending Verification' AND f.resubmitted_at IS NOT NULL) THEN 1 ELSE 0 END) pending_count,
        SUM(CASE WHEN f.status!='Voided' AND f.verification_status IN ('Correction Required','Rejected / Incorrect','Rejected') THEN 1 ELSE 0 END) correction_count,
        SUM(CASE WHEN f.status!='Voided' AND (f.verification_status='Resubmitted' OR (f.verification_status='Pending Verification' AND f.resubmitted_at IS NOT NULL)) THEN 1 ELSE 0 END) resubmitted_count,
        SUM(CASE WHEN f.status!='Voided' AND f.verification_status='Verified / Correct' THEN 1 ELSE 0 END) verified_count,
        SUM(CASE WHEN f.status!='Voided' AND (COALESCE(f.verification_status,'Pending Verification') NOT IN ('Verified / Correct','Correction Required','Rejected / Incorrect','Rejected') OR f.verification_status='Resubmitted') THEN COALESCE(f.krw_amount,f.amount,0) ELSE 0 END) unverified_amount,
        SUM(CASE WHEN f.status!='Voided' AND f.type='Revenue' THEN COALESCE(f.krw_amount,f.amount,0) ELSE 0 END) income,
        SUM(CASE WHEN f.status!='Voided' AND f.type='Expense' THEN COALESCE(f.krw_amount,f.amount,0) ELSE 0 END) expenses,
        SUM(CASE WHEN f.status!='Voided' AND EXISTS(SELECT 1 FROM approvals ap WHERE ap.source_entity='finance_entry' AND ap.source_id=f.id AND ap.status IN ('Pending','Resubmitted','Changes Required')) THEN 1 ELSE 0 END) open_request_rows
        FROM finance_entries f WHERE 1=1${scopeSql}`).get(...scopeArgs)||{};
      res.setHeader('X-Total-Count',String(total));
      res.json({rows,pagination:{page,page_size:pageSize,total,pages:Math.max(1,Math.ceil(total/pageSize)),from:total?offset+1:0,to:Math.min(total,offset+pageSize)},summary:{pending_count:Number(sum.pending_count||0),correction_count:Number(sum.correction_count||0),resubmitted_count:Number(sum.resubmitted_count||0),verified_count:Number(sum.verified_count||0),unverified_amount:Number(sum.unverified_amount||0),income:Number(sum.income||0),expenses:Number(sum.expenses||0),open_request_rows:Number(sum.open_request_rows||0)}});
    }catch(e){res.status(500).json({error:'Finance page could not be loaded',detail:e.message})}
  });

  app.get('/api/performance/v3392/health',auth,allow('dashboard','finance','accounting'),(req,res)=>{
    const accountingQueue=(()=>{try{return Number(db.prepare('SELECT COUNT(*) c FROM accounting_sync_queue').get()?.c||0)}catch(_){return 0}})();
    const oldestQueueSeconds=(()=>{try{return Number(db.prepare("SELECT COALESCE(MAX(0,(julianday('now')-julianday(MIN(queued_at)))*86400),0) s FROM accounting_sync_queue").get()?.s||0)}catch(_){return 0}})();
    const migrations=(()=>{try{return Number(db.prepare('SELECT COUNT(*) c FROM system_migrations').get()?.c||0)}catch(_){return 0}})();
    const mem=process.memoryUsage();
    res.json({
      version:VERSION,
      event_loop_lag_ms:Math.round(eventLoopLagMs),
      accounting_sync_queue:accountingQueue,
      oldest_accounting_queue_seconds:Math.round(oldestQueueSeconds),
      access_cache_ttl_ms:Number(access?.cache_ttl_ms||0),
      system_migrations:migrations,
      memory_mb:{rss:Math.round(mem.rss/1048576),heap_used:Math.round(mem.heapUsed/1048576),heap_total:Math.round(mem.heapTotal/1048576)},
      generated_at:new Date().toISOString()
    });
  });

  console.info('Blue Ocean Market V30.39.2 core runtime/data-path optimization installed');
  return {VERSION,getEventLoopLagMs:()=>eventLoopLagMs};
}
module.exports={install,VERSION};
