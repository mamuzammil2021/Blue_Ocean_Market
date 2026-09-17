'use strict';

// Blue Ocean Market V30.32.0
// UI/account-flow refinements and supplier destination-account persistence.
const VERSION='30.32.0';

function install({db}={}){
  if(!db)throw new Error('V30.32 requires db');
  const columns=t=>{try{return new Set(db.prepare(`PRAGMA table_info(${t})`).all().map(x=>x.name))}catch(_){return new Set()}};
  const addColumn=(t,c,d)=>{try{if(!columns(t).has(c))db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${d}`)}catch(e){console.error(`V30.32 migration ${t}.${c}:`,e.message)}};

  // Persist the exact supplier destination account used by each machine payment.
  // Additive only: historic rows remain valid with NULL receiver_account_id.
  addColumn('excavator_payments','receiver_account_id','INTEGER');
  try{db.exec('CREATE INDEX IF NOT EXISTS idx_excavator_payments_receiver_v332 ON excavator_payments(receiver_account_id)')}catch(e){console.error('V30.32 receiver index:',e.message)}

  function createSupplierPayee({businessUnitId,supplierId,userId,label='Supplier Main Bank',methodType='Bank',bankName='',accountHolder='',accountNumber='',accountCountry='',currency='KRW',isDefault=false}={}){
    const bu=Number(businessUnitId||0),sid=Number(supplierId||0),uid=Number(userId||0),number=String(accountNumber||'').trim();
    if(!bu||!sid||!number)return null;
    const supplier=db.prepare('SELECT id,name FROM excavator_suppliers WHERE id=? AND business_unit_id=? AND active=1').get(sid,bu);
    if(!supplier)throw new Error('Supplier receiver account cannot be linked because the supplier is unavailable.');
    const method=String(methodType||'Bank').trim()||'Bank';
    if(isDefault)db.prepare("UPDATE counterparty_payment_accounts SET is_default=0 WHERE business_unit_id=? AND entity_type='excavator_supplier' AND entity_id=? AND method_type=?").run(bu,sid,method);
    const r=db.prepare(`INSERT INTO counterparty_payment_accounts(
      business_unit_id,entity_type,entity_id,label,method_type,bank_name,account_holder,account_number,account_country,currency,active,is_default,created_by
    ) VALUES(?, 'excavator_supplier', ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`)
      .run(bu,sid,String(label||'Supplier Main Bank').trim()||'Supplier Main Bank',method,String(bankName||'').trim(),String(accountHolder||supplier.name).trim()||supplier.name,number,String(accountCountry||'').trim(),String(currency||'KRW').trim().toUpperCase(),isDefault?1:0,uid||null);
    return db.prepare('SELECT * FROM counterparty_payment_accounts WHERE id=?').get(Number(r.lastInsertRowid));
  }

  return {version:VERSION,createSupplierPayee};
}

module.exports={install,VERSION};
