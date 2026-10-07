'use strict';
const VERSION='30.69.2';
function install({app,db,auth,allow,currentUnit,enforceUnit,audit}){
  const num=v=>Number(v||0), text=v=>String(v??'').trim();
  function pinkBu(){return Number(db.prepare("SELECT id FROM business_units WHERE name='Pink Salt' AND status!='Archived'").get()?.id||0)}
  function guard(req,res){const bu=pinkBu(),selected=Number(currentUnit(req)||0);if(!bu)return res.status(409).json({error:'Pink Salt business unit is not available.'});if(!selected||selected!==bu||!enforceUnit(req,bu)){res.status(403).json({error:'Select the Pink Salt business unit to use this workspace.'});return null}return bu}
  function costLock(costId){const f=db.prepare("SELECT id,verification_status,accounting_status,status FROM finance_entries WHERE source_type='Pink Salt Import Cost' AND source_id=? AND status!='Voided' ORDER BY id DESC LIMIT 1").get(costId);if(!f)return null;if(f.verification_status==='Verified / Correct'||['Posted','Reversed'].includes(text(f.accounting_status)))return f;return null}

  app.post('/api/pink-salt/suppliers/:id/restore-v3692',auth,allow('purchases','finance'),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;const s=db.prepare('SELECT * FROM pink_salt_suppliers WHERE id=? AND business_unit_id=?').get(Number(req.params.id),bu);if(!s)return res.status(404).json({error:'Supplier not found.'});if(num(s.active))return res.json({ok:true,already_active:true});db.prepare('UPDATE pink_salt_suppliers SET active=1,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(s.id);audit(req.user,'pink_salt_supplier',s.id,'restore-v3692','Restored from archived supplier list');res.json({ok:true});
  });

  app.get('/api/pink-salt/imports/:id/cost-locks-v3692',auth,allow('purchases','inventory','finance','dashboard'),(req,res)=>{
    const bu=guard(req,res);if(!bu)return;const imp=db.prepare('SELECT id,status,received_at FROM pink_salt_imports WHERE id=? AND business_unit_id=?').get(Number(req.params.id),bu);if(!imp)return res.status(404).json({error:'Import not found.'});const costs=db.prepare("SELECT * FROM pink_salt_import_costs WHERE import_id=? AND COALESCE(status,'Active')!='Voided' ORDER BY cost_date,id").all(imp.id).map(c=>{const lock=costLock(c.id);return {id:c.id,locked:!!lock,lock_reason:lock?(['Posted','Reversed'].includes(text(lock.accounting_status))?'Accounting Posted':'Finance Verified'):''}});res.json({import_received:text(imp.status)==='Received'||!!imp.received_at,costs});
  });

  console.info(`Blue Ocean Market V${VERSION} Pink Salt QA server refinements loaded`);
  return {VERSION};
}
module.exports={install,VERSION};
