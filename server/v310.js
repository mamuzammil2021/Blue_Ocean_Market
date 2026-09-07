// Blue Ocean Market V30.10.0 — Pink Salt import controls, filters and quantity integrity.
const VERSION='30.10.0';

function install({app,db,auth,allow,currentUnit,enforceUnit,audit,notify,voidFinanceBySource,accounting,maybeCreateApproval,stopForApproval,markApprovalExecuted}){
  const num=v=>Number(v||0),text=v=>String(v??'').trim(),today=()=>new Date().toISOString().slice(0,10);
  const columnExists=(table,col)=>db.prepare(`PRAGMA table_info(${table})`).all().some(x=>x.name===col);
  const ensureColumn=(table,col,def)=>{if(!columnExists(table,col))db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`)};
  const pinkUnit=()=>db.prepare("SELECT id FROM business_units WHERE lower(name) LIKE '%pink%salt%' ORDER BY id LIMIT 1").get()?.id;
  function guard(req,res){const bu=Number(pinkUnit()||0),selected=Number(currentUnit(req)||0);if(!bu){res.status(409).json({error:'Pink Salt business unit is not available.'});return null}if(!selected||selected!==bu||!enforceUnit(req,bu)){res.status(403).json({error:'Select the Pink Salt business unit to use this workspace.'});return null}return bu}
  const whole=v=>Number.isFinite(Number(v))&&Number(v)>0&&Number.isInteger(Number(v));
  const parseJson=v=>{try{return typeof v==='string'?JSON.parse(v):v}catch(_){return null}};

  ensureColumn('pink_salt_imports','cancel_reason',"TEXT DEFAULT ''");
  ensureColumn('pink_salt_imports','cancelled_by','INTEGER');
  ensureColumn('pink_salt_imports','cancelled_at','TEXT');
  ensureColumn('pink_salt_imports','void_reason',"TEXT DEFAULT ''");
  ensureColumn('pink_salt_imports','voided_by','INTEGER');
  ensureColumn('pink_salt_imports','voided_at','TEXT');
  db.exec(`
    CREATE TABLE IF NOT EXISTS pink_salt_import_change_history(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      import_id INTEGER,
      business_unit_id INTEGER NOT NULL,
      import_no TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT DEFAULT '',
      before_json TEXT DEFAULT '{}',
      after_json TEXT DEFAULT '{}',
      approval_id INTEGER,
      user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_ps_import_history_import ON pink_salt_import_change_history(import_id,created_at);
  `);

  // Pink Salt-specific rules use the existing global approval engine. CEO/Owner still follows direct-confirmation bypass.
  const buSeed=Number(pinkUnit()||0);
  if(buSeed){
    const add=db.prepare(`INSERT OR IGNORE INTO approval_rules(business_unit_id,action_key,action_name,condition_type,threshold_amount,approver_level,require_dual,active,notes) VALUES(?,?,?,?,?,?,?,?,?)`);
    add.run(buSeed,'pink_salt.import_sensitive_edit','Sensitive Pink Salt Import Edit','Always',0,3,0,1,'Finance approval for changes to an import after finance or stock activity exists.');
    add.run(buSeed,'pink_salt.import_cancel','Cancel Pink Salt Import','Always',0,3,0,1,'Finance approval when cancelling an import that has financial activity.');
    add.run(buSeed,'pink_salt.import_void','Void Pink Salt Import','Always',0,5,1,1,'Dual Finance + CEO approval before reversing an import with posted activity.');
  }

  function importRow(id,bu){return db.prepare(`SELECT i.*,s.name supplier FROM pink_salt_imports i LEFT JOIN pink_salt_suppliers s ON s.id=i.supplier_id WHERE i.id=? AND i.business_unit_id=?`).get(Number(id),bu)}
  function items(id){return db.prepare('SELECT * FROM pink_salt_import_items WHERE import_id=? ORDER BY id').all(Number(id))}
  function purchaseKrw(id){return num(db.prepare('SELECT COALESCE(SUM(line_amount_krw),0) v FROM pink_salt_import_items WHERE import_id=?').get(Number(id))?.v)}
  function purchaseOriginal(id){return num(db.prepare('SELECT COALESCE(SUM(line_amount_original),0) v FROM pink_salt_import_items WHERE import_id=?').get(Number(id))?.v)}
  function activity(id){
    const payments=num(db.prepare("SELECT COUNT(*) c FROM pink_salt_import_payments WHERE import_id=? AND COALESCE(status,'Active')!='Voided'").get(id)?.c);
    const allocations=num(db.prepare("SELECT COUNT(*) c FROM pink_salt_supplier_advance_allocations WHERE import_id=? AND COALESCE(status,'Active')='Active'").get(id)?.c);
    const costs=num(db.prepare("SELECT COUNT(*) c FROM pink_salt_import_costs WHERE import_id=? AND COALESCE(status,'Active')!='Voided'").get(id)?.c);
    const rawMovements=num(db.prepare('SELECT COUNT(*) c FROM pink_salt_raw_stock_movements m JOIN pink_salt_import_items x ON x.id=m.import_item_id WHERE x.import_id=?').get(id)?.c);
    const rawBalance=num(db.prepare('SELECT COALESCE(SUM(m.quantity_kg),0) v FROM pink_salt_raw_stock_movements m JOIN pink_salt_import_items x ON x.id=m.import_item_id WHERE x.import_id=?').get(id)?.v);
    const receivedQty=num(db.prepare('SELECT COALESCE(SUM(received_weight_kg),0) v FROM pink_salt_import_items WHERE import_id=?').get(id)?.v);
    const productionInputs=num(db.prepare('SELECT COUNT(*) c FROM pink_salt_production_inputs p JOIN pink_salt_import_items x ON x.id=p.import_item_id WHERE x.import_id=?').get(id)?.c);
    const attachments=num(db.prepare("SELECT COUNT(*) c FROM pink_salt_attachments WHERE entity_type='Import' AND entity_id=?").get(id)?.c);
    return {payments,allocations,costs,raw_movements:rawMovements,raw_balance_kg:rawBalance,received_weight_kg:receivedQty,production_inputs:productionInputs,attachments,financial_activity:payments+allocations+costs>0,stock_activity:rawMovements>0,downstream_activity:productionInputs>0};
  }
  function capabilities(imp,a){
    const terminal=['Cancelled','Voided'].includes(imp.status);
    const canDelete=!terminal&&imp.status!=='Received'&&!a.financial_activity&&!a.stock_activity&&!a.downstream_activity&&a.attachments===0;
    const canCancel=!terminal&&imp.status!=='Received'&&!a.financial_activity&&!a.stock_activity&&!a.downstream_activity;
    const rawConsumed=a.stock_activity&&a.raw_balance_kg+0.005<a.received_weight_kg;
    const canVoid=!terminal&&!a.downstream_activity&&(!a.stock_activity||!rawConsumed);
    return {can_edit:!terminal,can_delete:canDelete,can_cancel:canCancel,can_void:canVoid,raw_consumed:rawConsumed,sensitive_edit_requires_approval:a.financial_activity||a.stock_activity};
  }
  function history(importId,bu,importNo,action,reason,before,after,userId,approvalId=null){
    db.prepare('INSERT INTO pink_salt_import_change_history(import_id,business_unit_id,import_no,action,reason,before_json,after_json,approval_id,user_id) VALUES(?,?,?,?,?,?,?,?,?)').run(importId,bu,importNo,action,reason,JSON.stringify(before||{}),JSON.stringify(after||{}),approvalId,userId||null);
  }
  function postedJournal(sourceType,sourceId){return db.prepare("SELECT * FROM accounting_journal_entries WHERE source_type=? AND source_id=? AND status='Posted' ORDER BY id DESC LIMIT 1").get(sourceType,Number(sourceId))}
  function reverseSourceJournal(sourceType,sourceId,reason,userId){const j=postedJournal(sourceType,sourceId);if(!j)return null;if(accounting?.isPeriodClosed?.(j.business_unit_id,j.transaction_date))throw new Error('The linked accounting period is closed. Reopen it before this correction.');return accounting?.reverseJournal?.(j,reason,userId)||null}
  function postCommitment(imp){const total=purchaseKrw(imp.id);if(total<=0||!accounting?.postJournal)return null;return accounting.postJournal({businessUnitId:imp.business_unit_id,transactionDate:imp.purchase_date||today(),sourceType:'Pink Salt Import Commitment',sourceId:imp.id,sourceLabel:`Pink Salt Import Commitment · ${imp.import_no}`,description:'Recognize Pink Salt purchase commitment and supplier payable without creating a Finance payment entry.',createdBy:imp.created_by,lines:[{account_id:accounting.accountId('PINK_SALT_IN_TRANSIT'),debit_krw:total,credit_krw:0,original_amount:purchaseOriginal(imp.id)||total,original_currency:imp.invoice_currency||'KRW',fx_rate:num(imp.invoice_fx_rate_to_krw)||1,entity_type:'Pink Salt Import',entity_id:imp.id,memo:`Import commitment · ${imp.import_no}`},{account_id:accounting.accountId('ACCOUNTS_PAYABLE'),debit_krw:0,credit_krw:total,original_amount:purchaseOriginal(imp.id)||total,original_currency:imp.invoice_currency||'KRW',fx_rate:num(imp.invoice_fx_rate_to_krw)||1,entity_type:'Pink Salt Supplier',entity_id:imp.supplier_id||null,memo:`Supplier payable · ${imp.supplier_name||''}`}]})}
  function recalcLanded(id){const rows=items(id),shared=num(db.prepare("SELECT COALESCE(SUM(krw_amount),0) v FROM pink_salt_import_costs WHERE import_id=? AND COALESCE(status,'Active')!='Voided'").get(id)?.v),weight=rows.reduce((s,x)=>s+num(x.total_weight_kg),0),up=db.prepare('UPDATE pink_salt_import_items SET landed_cost_krw=? WHERE id=?');for(const x of rows)up.run(num(x.line_amount_krw)+(weight?shared*(num(x.total_weight_kg)/weight):0),x.id)}

  app.get('/api/pink-salt/imports-list-v310',auth,allow('purchases','inventory','finance','dashboard'),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;
    const rows=db.prepare(`SELECT i.*,COALESCE(s.name,i.supplier_name) supplier,
      (SELECT GROUP_CONCAT(DISTINCT x.salt_grade) FROM pink_salt_import_items x WHERE x.import_id=i.id) salt_categories,
      (SELECT COALESCE(SUM(total_weight_kg),0) FROM pink_salt_import_items x WHERE x.import_id=i.id) total_weight_kg,
      (SELECT COALESCE(SUM(line_amount_original),0) FROM pink_salt_import_items x WHERE x.import_id=i.id) purchase_original,
      (SELECT COALESCE(SUM(line_amount_krw),0) FROM pink_salt_import_items x WHERE x.import_id=i.id) purchase_krw,
      (SELECT COALESCE(SUM(krw_amount),0) FROM pink_salt_import_payments p WHERE p.import_id=i.id AND COALESCE(p.status,'Active')!='Voided') cash_paid_krw,
      (SELECT COALESCE(SUM(amount_krw),0) FROM pink_salt_supplier_advance_allocations a WHERE a.import_id=i.id AND COALESCE(a.status,'Active')='Active') advance_allocated_krw
      FROM pink_salt_imports i LEFT JOIN pink_salt_suppliers s ON s.id=i.supplier_id WHERE i.business_unit_id=? ORDER BY i.id DESC`).all(bu);
    for(const x of rows){x.paid_krw=num(x.cash_paid_krw)+num(x.advance_allocated_krw);const terminal=['Cancelled','Voided'].includes(x.status);x.outstanding_krw=terminal?0:Math.max(0,num(x.purchase_krw)-x.paid_krw);x.payment_status=terminal?x.status:x.paid_krw<=0?'Unpaid':x.outstanding_krw<=0.01?'Fully Paid / Ready to Receive':'Partially Paid'}
    res.json(rows);
  });

  app.get('/api/pink-salt/imports/:id/manage-v310',auth,allow('purchases','inventory','finance','dashboard'),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;const imp=importRow(req.params.id,bu);if(!imp)return res.status(404).json({error:'Import not found.'});const a=activity(imp.id);res.json({import:imp,items:items(imp.id),activity:a,capabilities:capabilities(imp,a),purchase_krw:purchaseKrw(imp.id),purchase_original:purchaseOriginal(imp.id)});
  });
  app.get('/api/pink-salt/imports/:id/history-v310',auth,allow('purchases','inventory','finance','dashboard'),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;const imp=importRow(req.params.id,bu);if(!imp)return res.status(404).json({error:'Import not found.'});res.json(db.prepare(`SELECT h.*,u.name user_name FROM pink_salt_import_change_history h LEFT JOIN users u ON u.id=h.user_id WHERE h.business_unit_id=? AND (h.import_id=? OR h.import_no=?) ORDER BY h.id DESC`).all(bu,imp.id,imp.import_no));
  });

  app.put('/api/pink-salt/imports/:id/manage-v310',auth,allow('purchases','inventory','finance'),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;const imp=importRow(req.params.id,bu);if(!imp)return res.status(404).json({error:'Import not found.'});const a=activity(imp.id),cap=capabilities(imp,a);if(!cap.can_edit)return res.status(409).json({error:'Cancelled or voided imports cannot be edited.'});
    const reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Edit reason is required for import audit history.'});
    const supplierId=num(req.body.supplier_id||imp.supplier_id),supplier=db.prepare('SELECT * FROM pink_salt_suppliers WHERE id=? AND business_unit_id=? AND active=1').get(supplierId,bu);if(!supplier)return res.status(400).json({error:'Selected supplier is invalid.'});
    if((a.payments||a.allocations)&&supplierId!==num(imp.supplier_id))return res.status(409).json({error:'Supplier cannot be changed after supplier payment or advance-allocation activity. Reverse/correct the linked payments or allocations first.'});
    const currency=(text(req.body.invoice_currency||imp.invoice_currency)||'KRW').toUpperCase(),rate=currency==='KRW'?1:num(req.body.invoice_fx_rate_to_krw??imp.invoice_fx_rate_to_krw);if(rate<=0)return res.status(400).json({error:'A valid import exchange rate to KRW is required.'});
    const status=text(req.body.status||imp.status);if(!['Draft','Ordered','In Transit','Customs / Clearance','Received'].includes(status)||status==='Received'&&imp.status!=='Received')return res.status(400).json({error:'Use Receive Shipment to mark an import as Received.'});if(imp.status==='Received'&&status!=='Received')return res.status(409).json({error:'A received import cannot be moved back to an earlier status. Use the controlled correction/reversal workflow.'});
    const incoming=Array.isArray(req.body.items)?req.body.items:parseJson(req.body.items);const replacing=Array.isArray(incoming);
    if(replacing&&(a.stock_activity||a.downstream_activity))return res.status(409).json({error:'Salt item composition is locked after receipt or downstream production. Use a controlled correction/reversal workflow.'});
    if(replacing){if(!incoming.length)return res.status(400).json({error:'Add at least one salt category to this import.'});for(const x of incoming){if(!text(x.salt_grade)||num(x.bag_size_kg)<=0||!whole(x.bag_count)||num(x.unit_price_original)<=0)return res.status(400).json({error:'Each salt item requires category, bag size, whole-number bag count and unit price.'})}}
    const before={import:imp,items:items(imp.id)},next={supplier_id:supplierId,supplier_name:supplier.name,supplier_invoice_no:text(req.body.supplier_invoice_no??imp.supplier_invoice_no),container_no:text(req.body.container_no??imp.container_no),bill_of_lading:text(req.body.bill_of_lading??imp.bill_of_lading),purchase_date:text(req.body.purchase_date||imp.purchase_date)||imp.purchase_date,expected_arrival:text(req.body.expected_arrival??imp.expected_arrival)||null,actual_arrival:text(req.body.actual_arrival??imp.actual_arrival)||null,status,invoice_currency:currency,invoice_fx_rate_to_krw:rate,notes:text(req.body.notes??imp.notes)};
    const financialMaterial=replacing||supplierId!==num(imp.supplier_id)||currency!==imp.invoice_currency||Math.abs(rate-num(imp.invoice_fx_rate_to_krw))>1e-9;
    const metadataSensitive=next.supplier_invoice_no!==text(imp.supplier_invoice_no)||next.container_no!==text(imp.container_no)||next.bill_of_lading!==text(imp.bill_of_lading)||next.purchase_date!==text(imp.purchase_date)||text(next.expected_arrival)!==text(imp.expected_arrival)||text(next.actual_arrival)!==text(imp.actual_arrival)||next.status!==text(imp.status);
    const sensitive=financialMaterial||metadataSensitive;
    if(a.stock_activity&&financialMaterial)return res.status(409).json({error:'Financial values and salt composition are locked after receipt. Use the controlled correction/reversal workflow.'});
    const settledKrw=num(db.prepare("SELECT COALESCE(SUM(krw_amount),0) v FROM pink_salt_import_payments WHERE import_id=? AND COALESCE(status,'Active')!='Voided'").get(imp.id)?.v)+num(db.prepare("SELECT COALESCE(SUM(amount_krw),0) v FROM pink_salt_supplier_advance_allocations WHERE import_id=? AND COALESCE(status,'Active')='Active'").get(imp.id)?.v);
    let prospectiveKrw=purchaseKrw(imp.id);if(replacing)prospectiveKrw=incoming.reduce((sum,x)=>{const bags=num(x.bag_count),lineOriginal=num(x.line_amount_original)||num(x.unit_price_original)*bags;return sum+lineOriginal*rate},0);else if(currency!==imp.invoice_currency||Math.abs(rate-num(imp.invoice_fx_rate_to_krw))>1e-9)prospectiveKrw=purchaseOriginal(imp.id)*rate;
    if(settledKrw>prospectiveKrw+0.01)return res.status(409).json({error:'This edit would reduce the import value below supplier payments or advance allocations already applied. Correct/reverse the linked settlement first.'});
    const approvalNeeded=(a.financial_activity||a.stock_activity)&&sensitive;let ar=null;
    if(approvalNeeded&&typeof maybeCreateApproval==='function'){ar=maybeCreateApproval({req,businessUnitId:bu,actionKey:'pink_salt.import_sensitive_edit',type:'Sensitive Pink Salt Import Edit',amount:purchaseKrw(imp.id),reason,sourceEntity:'pink_salt_import',sourceId:imp.id,priority:'High',snapshot:{body:req.body,import_id:imp.id,before}});if(typeof stopForApproval==='function'&&stopForApproval(res,ar,'Import edit submitted for approval.',{source_id:imp.id}))return}
    try{
      const tx=db.transaction(()=>{
        if(financialMaterial)reverseSourceJournal('Pink Salt Import Commitment',imp.id,'Import edited: '+reason,req.user.id);
        db.prepare(`UPDATE pink_salt_imports SET supplier_id=?,supplier_name=?,supplier_invoice_no=?,container_no=?,bill_of_lading=?,purchase_date=?,expected_arrival=?,actual_arrival=?,status=?,invoice_currency=?,invoice_fx_rate_to_krw=?,notes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(next.supplier_id,next.supplier_name,next.supplier_invoice_no,next.container_no,next.bill_of_lading,next.purchase_date,next.expected_arrival,next.actual_arrival,next.status,next.invoice_currency,next.invoice_fx_rate_to_krw,next.notes,imp.id);
        if(replacing){db.prepare('DELETE FROM pink_salt_import_items WHERE import_id=?').run(imp.id);const ins=db.prepare('INSERT INTO pink_salt_import_items(import_id,salt_grade,specification,bag_size_kg,bag_count,total_weight_kg,unit_price_original,line_amount_original,fx_rate_to_krw,line_amount_krw,storage_location,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');for(const x of incoming){const bags=num(x.bag_count),size=num(x.bag_size_kg),lineOriginal=num(x.line_amount_original)||num(x.unit_price_original)*bags;ins.run(imp.id,text(x.salt_grade),text(x.specification),size,bags,size*bags,num(x.unit_price_original),lineOriginal,rate,lineOriginal*rate,text(x.storage_location),text(x.notes))}}
        else if(currency!==imp.invoice_currency||Math.abs(rate-num(imp.invoice_fx_rate_to_krw))>1e-9){db.prepare('UPDATE pink_salt_import_items SET fx_rate_to_krw=?,line_amount_krw=line_amount_original*? WHERE import_id=?').run(rate,rate,imp.id)}
        recalcLanded(imp.id);if(financialMaterial)postCommitment(importRow(imp.id,bu));
        const after={import:importRow(imp.id,bu),items:items(imp.id)};history(imp.id,bu,imp.import_no,'Edit',reason,before,after,req.user.id,ar?.approval?.id||null);audit(req.user,'pink_salt_import',imp.id,'edit-v310',JSON.stringify({reason,approval_id:ar?.approval?.id||null,financial_material:financialMaterial,sensitive}));
      });tx();if(ar?.approval&&typeof markApprovalExecuted==='function')markApprovalExecuted(ar.approval,req.user,{import_id:imp.id,action:'edit'});res.json({ok:true,id:imp.id});
    }catch(e){res.status(409).json({error:e.message})}
  });

  app.post('/api/pink-salt/imports/:id/cancel-v310',auth,allow('purchases','inventory','finance'),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;const imp=importRow(req.params.id,bu);if(!imp)return res.status(404).json({error:'Import not found.'});const a=activity(imp.id),cap=capabilities(imp,a),reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Cancellation reason is required.'});if(!cap.can_cancel)return res.status(409).json({error:a.financial_activity?'This import has payments, advance allocations, or costs. Use the approval-controlled Void workflow or reverse/correct those records first.':'This import can no longer be cancelled. Use Void or a controlled correction/reversal workflow.'});let ar=null;if(a.financial_activity&&typeof maybeCreateApproval==='function'){ar=maybeCreateApproval({req,businessUnitId:bu,actionKey:'pink_salt.import_cancel',type:'Cancel Pink Salt Import',amount:purchaseKrw(imp.id),reason,sourceEntity:'pink_salt_import',sourceId:imp.id,priority:'High',snapshot:{body:req.body,import_id:imp.id,status:imp.status}});if(stopForApproval?.(res,ar,'Import cancellation submitted for approval.',{source_id:imp.id}))return}
    try{reverseSourceJournal('Pink Salt Import Commitment',imp.id,'Import cancelled: '+reason,req.user.id);db.prepare("UPDATE pink_salt_imports SET status='Cancelled',cancel_reason=?,cancelled_by=?,cancelled_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(reason,req.user.id,imp.id);const after=importRow(imp.id,bu);history(imp.id,bu,imp.import_no,'Cancel',reason,imp,after,req.user.id,ar?.approval?.id||null);audit(req.user,'pink_salt_import',imp.id,'cancel-v310',reason);if(ar?.approval)markApprovalExecuted?.(ar.approval,req.user,{import_id:imp.id,action:'cancel'});notify?.(req.user.id,'warning','Pink Salt import cancelled',`${imp.import_no}: ${reason}`,bu,'pink_salt_import',imp.id,'psImports');res.json({ok:true,status:'Cancelled'})}catch(e){res.status(409).json({error:e.message})}
  });

  app.post('/api/pink-salt/imports/:id/void-v310',auth,allow('purchases','inventory','finance'),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;const imp=importRow(req.params.id,bu);if(!imp)return res.status(404).json({error:'Import not found.'});const a=activity(imp.id),cap=capabilities(imp,a),reason=text(req.body.reason);if(!reason)return res.status(400).json({error:'Void reason is required.'});if(!cap.can_void)return res.status(409).json({error:a.downstream_activity?'Import cannot be voided because its raw salt has downstream production. Use a controlled correction/reversal workflow.':'Import cannot be voided because received raw salt has already been consumed. Restore/correct downstream stock first.'});let ar=null;if(typeof maybeCreateApproval==='function'){ar=maybeCreateApproval({req,businessUnitId:bu,actionKey:'pink_salt.import_void',type:'Void Pink Salt Import',amount:purchaseKrw(imp.id),reason,sourceEntity:'pink_salt_import',sourceId:imp.id,priority:'Critical',snapshot:{body:req.body,import_id:imp.id,status:imp.status,activity:a}});if(stopForApproval?.(res,ar,'Import void submitted for Finance + CEO approval.',{source_id:imp.id}))return}
    try{const before={import:imp,activity:a};const tx=db.transaction(()=>{
      reverseSourceJournal('Pink Salt Import Receipt',imp.id,'Import voided: '+reason,req.user.id);reverseSourceJournal('Pink Salt Import Commitment',imp.id,'Import voided: '+reason,req.user.id);
      const allocs=db.prepare("SELECT * FROM pink_salt_supplier_advance_allocations WHERE import_id=? AND status='Active'").all(imp.id);for(const x of allocs){if(x.journal_entry_id){const j=db.prepare('SELECT * FROM accounting_journal_entries WHERE id=?').get(x.journal_entry_id);if(j&&j.status==='Posted')accounting.reverseJournal(j,'Import voided: '+reason,req.user.id)}db.prepare("UPDATE pink_salt_supplier_advance_allocations SET status='Reversed',reversal_reason=?,reversed_by=?,reversed_at=CURRENT_TIMESTAMP WHERE id=?").run(reason,req.user.id,x.id)}
      for(const p of db.prepare("SELECT id FROM pink_salt_import_payments WHERE import_id=? AND COALESCE(status,'Active')!='Voided'").all(imp.id)){db.prepare("UPDATE pink_salt_import_payments SET status='Voided',void_reason=?,voided_by=?,voided_at=CURRENT_TIMESTAMP WHERE id=?").run(reason,req.user.id,p.id);voidFinanceBySource?.('Pink Salt Import Payment',p.id,reason,req.user.id,bu)}
      for(const c of db.prepare("SELECT id FROM pink_salt_import_costs WHERE import_id=? AND COALESCE(status,'Active')!='Voided'").all(imp.id)){db.prepare("UPDATE pink_salt_import_costs SET status='Voided',void_reason=?,voided_by=?,voided_at=CURRENT_TIMESTAMP WHERE id=?").run(reason,req.user.id,c.id);voidFinanceBySource?.('Pink Salt Import Cost',c.id,reason,req.user.id,bu)}
      const movement=db.prepare('INSERT INTO pink_salt_raw_stock_movements(business_unit_id,import_item_id,movement_date,movement_type,quantity_kg,reference_type,reference_id,reference,notes,created_by) VALUES(?,?,?,?,?,?,?,?,?,?)');for(const x of items(imp.id)){const balance=num(db.prepare('SELECT COALESCE(SUM(quantity_kg),0) v FROM pink_salt_raw_stock_movements WHERE import_item_id=?').get(x.id)?.v);if(balance>0.000001)movement.run(bu,x.id,today(),'Import Void',-balance,'Import',imp.id,imp.import_no,'Import void reversal: '+reason,req.user.id)}
      db.prepare("UPDATE pink_salt_imports SET status='Voided',void_reason=?,voided_by=?,voided_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(reason,req.user.id,imp.id);history(imp.id,bu,imp.import_no,'Void',reason,before,{import:importRow(imp.id,bu)},req.user.id,ar?.approval?.id||null);audit(req.user,'pink_salt_import',imp.id,'void-v310',reason);
    });tx();accounting?.processQueue?.(1000);if(ar?.approval)markApprovalExecuted?.(ar.approval,req.user,{import_id:imp.id,action:'void'});res.json({ok:true,status:'Voided'})}catch(e){res.status(409).json({error:e.message})}
  });

  app.delete('/api/pink-salt/imports/:id/delete-v310',auth,allow('purchases','inventory','finance'),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;const imp=importRow(req.params.id,bu);if(!imp)return res.status(404).json({error:'Import not found.'});const a=activity(imp.id),cap=capabilities(imp,a),reason=text(req.body?.reason);if(!reason)return res.status(400).json({error:'Delete reason is required.'});if(!cap.can_delete)return res.status(409).json({error:'Delete is only allowed for an early import with no payments, advance allocations, costs, documents, stock movements or downstream production. Use Cancel/Void instead.'});try{reverseSourceJournal('Pink Salt Import Commitment',imp.id,'Import deleted: '+reason,req.user.id);history(imp.id,bu,imp.import_no,'Delete',reason,{import:imp,items:items(imp.id)},{deleted:true},req.user.id,null);db.prepare('DELETE FROM pink_salt_imports WHERE id=?').run(imp.id);audit(req.user,'pink_salt_import',imp.id,'delete-v310',reason);res.json({ok:true,deleted:true})}catch(e){res.status(409).json({error:e.message})}
  });

  console.info('Blue Ocean Market V30.10.0 import controls and quantity integrity backend loaded');
  return {VERSION};
}
module.exports={install,VERSION};
